#!/usr/bin/env node
/**
 * Re-transcribe a project's clips with whisper `medium` KEEPING PUNCTUATION, and
 * rebuild the caption track from real sentence boundaries. Non-destructive —
 * snapshots a revision; AI_DRAFT is untouched.
 *
 *   node scripts/proj-recaption.mjs <projectName> [--model medium] [--force]
 *
 * WHY: the shared library's `words` table was indexed with a model/filter that
 * dropped every "." "?" "," token, so the phrase grouper had no clause
 * boundaries and fell back to fixed 3-word bricks ("THE / BEST", question glued
 * to its answer). This re-runs medium on just this project's ~10 clips, caches
 * punctuated word timings in scratch/recap/<slug>/<clipId>.json, and regroups.
 *
 * proj-new / proj-op will prefer that cache automatically once it exists.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir, cpus } from "node:os";
import { installWhisperCpp, downloadWhisperModel, transcribe, toCaptions } from "@remotion/install-whisper-cpp";
import { mergeTokensToWords } from "./lib/autocut-core.mjs";
import { groupCaptions } from "./lib/caption-group.mjs";
import { scanNegative, isBareNo } from "./lib/positivity.mjs";
import { loadProject, saveProject, loadProfile, loadPreset } from "./lib/project.mjs";
import { openDb } from "./lib/db.mjs";

const WHISPER_VERSION = "1.5.5";
const HOTWORDS =
  "Shalom, Shabbat Shalom, Salam, Salam Alaikum, Wa Alaikum Salam, Marhaba, Toda, Yalla, Habibi, Inshallah, Alhamdulillah, Israel, Jaffa, Tel Aviv, Jerusalem, Nazareth";

const root = process.cwd();
const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const model = opt("model", "medium");
const force = args.includes("--force");
const wantStyle = opt("style", null); // e.g. nas_caption — switch caption style + rebuild in it
const translateToEnglish = args.includes("--translate"); // whisper translate task (he/ar → en)
const dropRepeats = !args.includes("--keep-repeats"); // remove restarted-sentence takes (default on)
if (!name) {
  console.error("Usage: node scripts/proj-recaption.mjs <projectName> [--model medium] [--style nas_caption] [--translate] [--force]");
  process.exit(1);
}

const p = loadProject(name);
if (wantStyle) {
  loadPreset("caption", wantStyle); // validate
  p.caption_style = wantStyle;
}
const slug = p.slug || "meta-shoot";
const profile = loadProfile();
const pref = (k, d) => (profile.preferences[k]?.confidence >= 0.6 ? profile.preferences[k].value : d);
const capPreset = loadPreset("caption", p.caption_style ?? "tal_caption");
const capMode = capPreset.mode ?? "phrase";
if (capMode === "none") {
  console.log("caption style is 'none' — nothing to recaption.");
  process.exit(0);
}

// ---- resolve this project's distinct source clips ----------------------
const db = openDb(join(root, "public", "footage", slug, "library.db"));
const clipByPath = db.prepare("SELECT id, abs_path, path FROM clips WHERE path=? OR abs_path=?");
const srcs = [...new Set(p.tracks.video.map((c) => c.src))];
const clips = srcs
  .map((s) => {
    const rel = s.replace(/^footage\//, "footage/");
    const row = clipByPath.get(rel, s) || clipByPath.get(s, s);
    const abs = row?.abs_path && existsSync(row.abs_path) ? row.abs_path : join(root, "public", s);
    return { src: s, id: row?.id ?? s.replace(/[^a-z0-9]/gi, "_"), abs };
  })
  .filter((c) => existsSync(c.abs));
if (!clips.length) {
  console.error("✗ no resolvable source files for this project");
  process.exit(1);
}

const cacheDir = join(root, "scratch", "recap", slug);
mkdirSync(cacheDir, { recursive: true });

// ---- whisper setup ---------------------------------------------------
const cacheRoot = join(homedir(), ".cache", "video-studio");
const whisperDir = join(cacheRoot, "whisper.cpp");
process.chdir(cacheRoot);
await installWhisperCpp({ to: whisperDir, version: WHISPER_VERSION });
await downloadWhisperModel({ model, folder: whisperDir });
process.chdir(root);

const ffmpegBin = (() => {
  const dir = join(root, "node_modules", "@remotion");
  return readdirSync(dir)
    .filter((d) => d.startsWith("compositor-"))
    .map((d) => join(dir, d, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"))
    .find(existsSync);
})();
const ff = (a) => execFileSync(ffmpegBin, ["-hide_banner", "-loglevel", "error", ...a], { stdio: ["ignore", "ignore", "pipe"] });
const THREADS = Math.max(2, Math.floor(cpus().length / 2));

// keep punctuation: drop only whitespace-only and bracket annotations
const KEEP = (t) => t && t.trim() && !/^[\[(]?(BLANK_AUDIO|Music|Applause|Laughter|inaudible)[\])]?\.?$/i.test(t.trim());

const wordCache = {}; // src -> [{word,start,end}]
for (const c of clips) {
  const cf = join(cacheDir, `${c.id}${translateToEnglish ? ".en" : ""}.json`);
  if (existsSync(cf) && !force) {
    wordCache[c.src] = JSON.parse(readFileSync(cf, "utf8"));
    console.log(`· ${c.id}  (cached, ${wordCache[c.src].length} words)`);
    continue;
  }
  const wav = join(tmpdir(), `recap_${c.id}_${Date.now()}.wav`);
  ff(["-i", c.abs, "-vn", "-ac", "1", "-ar", "16000", "-y", wav]);
  const out = await transcribe({
    inputPath: wav,
    whisperPath: whisperDir,
    whisperCppVersion: WHISPER_VERSION,
    model,
    tokenLevelTimestamps: true,
    language: null,
    translateToEnglish,
    additionalArgs: [
      ["--prompt", HOTWORDS],
      ["-t", String(THREADS)],
    ],
  });
  rmSync(wav, { force: true });
  const { captions } = toCaptions({ whisperCppOutput: out });
  const toks = captions.filter((x) => KEEP(x.text ?? x.word)).map((x) => ({ word: x.word ?? x.text, start: x.startMs / 1000, end: x.endMs / 1000 }));
  const words = mergeTokensToWords(toks).map((w) => ({ word: w.word, start: w.start, end: w.end }));
  writeFileSync(cf, JSON.stringify(words));
  wordCache[c.src] = words;
  console.log(`· ${c.id}  (${out.result?.language ?? "?"}, ${words.length} words)  ${words.slice(0, 14).map((w) => w.word).join(" ")}…`);
}

// ---- rebuild the caption track (same windowing as proj-new) -----------
// when a style switch is requested, the PRESET wins over the learned profile
const wpg = wantStyle ? capPreset.wordsPerGroup ?? [3, 5] : pref("caption_words_per_group", capPreset.wordsPerGroup ?? [2, 3]);
const capUpper = wantStyle ? capPreset.uppercase !== false : pref("caption_uppercase", capPreset.uppercase !== false);
const capPos = wantStyle ? capPreset.position ?? { x: 0.5, y: 0.76 } : pref("caption_position", capPreset.position ?? { x: 0.5, y: 0.67 });

// "only start the video when I start talking" — open on the first CONNECTED
// speech, skipping faint/distant walk-up words. Once only (flag), and never on a
// hook-first variation (its first clip is a deliberate cold open).
if (!args.includes("--no-lead-trim") && p.variation !== "hook_first" && p.kind !== "compilation" && p.tracks.video[0] && !p.tracks.video[0]._leadTrimmed) {
  const c0 = p.tracks.video[0];
  const ws = (wordCache[c0.src] ?? [])
    .filter((w) => w.end > c0.sourceIn - 0.1 && w.start < c0.sourceOut && /[A-Za-z0-9]/.test(w.word))
    .sort((a, b) => a.start - b.start);
  // skip leading words whisper stretched across the quiet walk-up (a real word
  // is short; a >1.2s "word" is silence) and any word followed by a big gap
  let i = 0;
  while (
    i < ws.length - 1 &&
    (ws[i].end - ws[i].start > 1.2 || ws[i + 1].end - ws[i + 1].start > 1.2 || ws[i + 1].start - ws[i].end >= 0.5)
  )
    i++;
  // don't open on a stray 1–3 letter fragment ("me,") — take the next word
  if (ws[i] && ws[i + 1] && ws[i].word.replace(/[^A-Za-z]/g, "").length <= 3 && ws[i + 1].start - ws[i].end < 0.6) i++;
  const w0 = ws[i];
  if (w0 && w0.start - c0.sourceIn > 0.4) {
    const newIn = Math.max(0, +(w0.start - 0.2).toFixed(3));
    console.log(
      `· lead trim: clip ${c0.id} in ${c0.sourceIn} → ${newIn}` +
        (i ? `  skipped faint: "${ws.slice(0, i).map((w) => w.word.trim()).join(" ")}"` : "") +
        `  opens on "${w0.word.trim()}" @ ${w0.start.toFixed(2)}s`,
    );
    c0.sourceIn = newIn;
  }
  c0._leadTrimmed = true;
}

let tl = 0;
const allGroups = [];
for (let si = 0; si < p.tracks.video.length; si++) {
  const c = p.tracks.video[si];
  const nextC = p.tracks.video[si + 1];
  const inS = c.sourceIn;
  const outS = c.sourceOut;
  const dur = (outS - inS) / (c.speed ?? 1);
  const sameClipContiguous = nextC && nextC.src === c.src && nextC.sourceIn - outS < 1.2 && nextC.sourceIn >= inS;
  const src = wordCache[c.src] ?? [];
  // back-slop catches a word split across a CUT — but not at the very start of
  // the video, where a word starting before sourceIn is the trimmed walk-up
  const backSlop = si === 0 ? 0.05 : 0.3;
  const words = src
    .filter((w) => w.end > inS - backSlop && w.start < outS + 0.3 && (si !== 0 || w.start > inS - 0.15))
    .map((w) => ({ text: w.word, start: +(tl + (w.start - inS) / (c.speed ?? 1)).toFixed(3), end: +(tl + (w.end - inS) / (c.speed ?? 1)).toFixed(3) }));
  if (words.length) {
    const g = groupCaptions(words, {
      mode: capMode,
      wordsPerGroup: wpg,
      uppercase: capUpper,
      maxWidthFrac: capPreset.maxWidthFrac ?? 0.88,
      sizePx: capPreset.sizePx ?? 74,
      leadMs: 110,
    });
    for (const grp of g) {
      if (grp.start < tl - 0.15 || grp.start > tl + dur + 0.15) continue;
      if (!sameClipContiguous) grp.end = Math.min(grp.end, tl + dur + 0.12);
      const own = (grp.word_ids ?? []).map((wi) => words[wi]).filter(Boolean);
      allGroups.push({ ...grp, _words: own });
    }
  }
  tl += dur;
}

const before = p.tracks.captions.length;
// same-source contiguous clip windows overlap at the seam → dedupe twin groups
allGroups.sort((a, b) => a.start - b.start);
let deduped = [];
for (const g of allGroups) {
  if (deduped.some((x) => x.text === g.text && Math.abs(x.start - g.start) < 0.6)) continue;
  deduped.push(g);
}

// ---- REPEATED-TAKE removal (the new pipeline) — a speaker who restarts a
// sentence ("…a slogan AND IT'S love…" then "…a slogan WHICH IS love…") leaves
// the abandoned take in. Drop groups from the first occurrence of a repeated
// ≥4-content-word run to the restart. --keep-repeats to disable.
if (dropRepeats && deduped.length > 4) {
  const STOP = new Set(
    "a an the and or but so of to in on at is are was were be been am it its it's this that these those we you i he she they them our your my his her as with for from than then there here just really very oh no yeah ok okay well".split(" "),
  );
  const kt = (s) => (s.toLowerCase().match(/[a-z0-9']+/g) || []).filter((w) => !STOP.has(w));
  const kg = (arr, n = 4) => { const s = new Set(); for (let i = 0; i + n <= arr.length; i++) s.add(arr.slice(i, i + n).join(" ")); return s; };
  const toks = deduped.map((g) => kt(g.text));
  const grams = toks.map((t) => kg(t));
  const kill = new Set();
  for (let i = 0; i < deduped.length; i++) {
    if (kill.has(i) || toks[i].length < 4) continue;
    for (let j = i + 1; j < deduped.length && deduped[j].start - deduped[i].end < 34; j++) {
      if (deduped[j].start - deduped[i].start < 4 || toks[j].length < 4) continue;
      let shared = false;
      for (const g of grams[i]) if (grams[j].has(g)) { shared = true; break; }
      if (!shared) continue;
      for (let k = i; k < j; k++) kill.add(k); // abandoned take + the run-up to the retry
      i = j - 1;
      break;
    }
  }
  if (kill.size) {
    console.log(`  · repeated-take: dropped ${kill.size} caption group(s) from restarted sentences`);
    deduped = deduped.filter((_, i) => !kill.has(i));
  }
}
// ---- POSITIVITY GATE (Tal's #1 rule) — silently exclude anything negative
// about Israel. No flags, no review prompt — Tal: "just don't include anything
// as negative." A lone "No." to a positive prompt reads negative → dropped too.
const dropped = [];
const clean = [];
for (const g of deduped) {
  const bad = scanNegative(g.text) || (isBareNo(g.text) ? "bare negative" : null);
  if (bad) {
    dropped.push({ t: +g.start.toFixed(1), text: g.text, reason: bad });
    continue; // remove the caption entirely, no flag
  }
  clean.push(g);
}
delete p.flags; // never surface positivity flags (removed 2026-09-08)
p.tracks.captions = clean.map((g, i) => ({
  id: `c${i + 1}`,
  type: "speech_caption",
  start: g.start,
  end: g.end,
  text: g.text,
  word_ids: g.word_ids,
  words: g._words ?? [],
  style: p.caption_style,
  position: capPos,
}));
if (dropped.length) {
  console.log(`  · positivity gate: ${dropped.length} negative line(s) excluded (not flagged)`);
  for (const f of dropped) console.log(`     ✂ ${f.t}s  "${f.text}"  (${f.reason})`);
}

saveProject(name, p, { label: "recaption (medium + punctuation)" });
console.log(`\n✓ ${name}: captions ${before} → ${p.tracks.captions.length} groups, rebuilt from punctuated ${model} transcripts`);
console.log(`  cache: scratch/recap/${slug}/   ·   revision snapshot saved`);
console.log(`\nNext: node scripts/proj-render.mjs ${name}`);
