#!/usr/bin/env node
/**
 * Re-transcribe specific clips with a better whisper model and update the DB.
 *
 *   node scripts/retranscribe.mjs --slug meta-shoot --model medium --clips video-1339,video-1347
 *   node scripts/retranscribe.mjs --slug meta-shoot --model medium --used-by scratch/fullstory/FULL_01_bakery_mahmoud.json,scratch/fullstory/COMP_01_greetings.json
 *
 * Small/base whisper hallucinates and mistimes on short multilingual street
 * clips. `medium` (multilingual) is the project default per CLAUDE.md §7 but was
 * never downloaded. This re-runs it on just the clips a cut actually uses, so we
 * don't reprocess all 328. Rewrites the `words` + `speech` rows and the
 * `clips.transcript` for each; prints an old-vs-new diff.
 */
import { execFileSync } from "node:child_process";
import { readdirSync as _rd } from "node:fs";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir, cpus } from "node:os";
import { installWhisperCpp, downloadWhisperModel, transcribe, toCaptions } from "@remotion/install-whisper-cpp";
import { mergeTokensToWords } from "./lib/autocut-core.mjs";
import { openDb } from "./lib/db.mjs";

const WHISPER_VERSION = "1.5.5";
const HOTWORDS =
  "Shalom, Shabbat Shalom, Salam, Salam Alaikum, Wa Alaikum Salam, Marhaba, Toda, Yalla, Habibi, Inshallah, Alhamdulillah, Israel, Jaffa, Tel Aviv, Jerusalem, Nazareth";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug", "meta-shoot");
const model = opt("model", "medium");
const root = process.cwd();
const db = openDb(join(root, "public", "footage", slug, "library.db"));

let clipIds = (opt("clips", "") || "").split(",").filter(Boolean);
const usedBy = opt("used-by", "");
if (usedBy) {
  const clipByPath = db.prepare("SELECT id FROM clips WHERE path=?");
  const momentById = db.prepare("SELECT clip_id FROM moments WHERE id=?");
  for (const specPath of usedBy.split(",")) {
    const spec = JSON.parse(readFileSync(specPath.trim(), "utf8"));
    for (const m of spec.moments ?? []) {
      if (m.inline) clipIds.push(clipByPath.get(m.inline.src)?.id);
      else clipIds.push(momentById.get(m.moment_id)?.clip_id);
    }
  }
}
clipIds = [...new Set(clipIds.filter(Boolean))];
if (!clipIds.length) {
  console.error("No clips. Pass --clips a,b or --used-by spec.json,spec2.json");
  process.exit(1);
}
console.log(`Re-transcribing ${clipIds.length} clip(s) with ${model}:\n  ${clipIds.join("\n  ")}\n`);

const cacheRoot = join(homedir(), ".cache", "video-studio");
const whisperDir = join(cacheRoot, "whisper.cpp");
process.chdir(cacheRoot);
await installWhisperCpp({ to: whisperDir, version: WHISPER_VERSION });
await downloadWhisperModel({ model, folder: whisperDir });
process.chdir(root);

const ffmpegBin = (() => {
  const dir = join(root, "node_modules", "@remotion");
  
  const c = _rd(dir)
    .filter((d) => d.startsWith("compositor-"))
    .map((d) => join(dir, d, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"));
  return c.find((p) => existsSync(p));
})();
const ff = (a) => execFileSync(ffmpegBin, ["-hide_banner", "-loglevel", "error", ...a], { stdio: ["ignore", "ignore", "pipe"] });

const THREADS = Math.max(2, Math.floor(cpus().length / 2));
const getClip = db.prepare("SELECT id, abs_path, path, transcript FROM clips WHERE id=?");
const delWords = db.prepare("DELETE FROM words WHERE clip_id=?");
const delSpeech = db.prepare("DELETE FROM speech WHERE clip_id=?");
const insWord = db.prepare("INSERT INTO words (clip_id,idx,word,norm,start_s,end_s) VALUES (?,?,?,?,?,?)");
const insSpeech = db.prepare("INSERT INTO speech (clip_id,start_s,end_s) VALUES (?,?,?)");
const updClip = db.prepare("UPDATE clips SET transcript=?, language=? WHERE id=?");

for (const cid of clipIds) {
  const clip = getClip.get(cid);
  if (!clip) {
    console.warn(`⚠ ${cid} not in DB`);
    continue;
  }
  const src = clip.abs_path && existsSync(clip.abs_path) ? clip.abs_path : join(root, "public", clip.path);
  if (!existsSync(src)) {
    console.warn(`⚠ ${cid}: source not found (${src})`);
    continue;
  }
  const wav = join(tmpdir(), `retr_${cid}_${Date.now()}.wav`);
  ff(["-i", src, "-vn", "-ac", "1", "-ar", "16000", "-y", wav]);
  const out = await transcribe({
    inputPath: wav,
    whisperPath: whisperDir,
    whisperCppVersion: WHISPER_VERSION,
    model,
    tokenLevelTimestamps: true,
    language: null,
    additionalArgs: [
      ["--prompt", HOTWORDS],
      ["-t", String(THREADS)],
    ],
  });
  rmSync(wav, { force: true });

  const { captions } = toCaptions({ whisperCppOutput: out });
  // KEEP punctuation tokens (". " "?" ",") — mergeTokensToWords glues them onto
  // the previous word, and the caption grouper needs them for clause breaks.
  // Only drop whitespace-only tokens and bracketed annotations.
  const toks = captions
    .filter((c) => {
      const s = (c.text ?? c.word ?? "").trim();
      return s && !/^[\[(]?(BLANK_AUDIO|Music|Applause|Laughter|inaudible)[\])]?\.?$/i.test(s);
    })
    .map((c) => ({ word: c.word ?? c.text, start: c.startMs / 1000, end: c.endMs / 1000 }));
  const words = mergeTokensToWords(toks);
  const transcript = words
    .map((w) => w.word)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // speech regions: merge words with <0.6s gaps
  const regions = [];
  for (const w of words) {
    const last = regions[regions.length - 1];
    if (last && w.start - last.end <= 0.6) last.end = Math.max(last.end, w.end);
    else regions.push({ start: w.start, end: w.end });
  }

  const tx = db.transaction(() => {
    delWords.run(cid);
    delSpeech.run(cid);
    words.forEach((w, i) => insWord.run(cid, i, w.word, w.norm, w.start, w.end));
    regions.forEach((r) => insSpeech.run(cid, r.start, r.end));
    updClip.run(transcript, out.result?.language ?? null, cid);
  });
  tx();

  console.log(`\n=== ${cid} (${out.result?.language ?? "?"}) ===`);
  console.log(`OLD: ${(clip.transcript || "").slice(0, 160)}`);
  console.log(`NEW: ${transcript.slice(0, 160)}`);
  console.log(`     ${words.length} words, ${regions.length} speech regions`);
}
console.log(`\n✓ done. Rebuild affected cuts: node scripts/build-reel.mjs --slug ${slug} --spec <spec.json>`);
