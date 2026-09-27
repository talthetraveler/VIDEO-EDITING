#!/usr/bin/env node
/**
 * Long Form -> Short — stage 1: ingest + transcribe ONE long source video.
 *
 *   node scripts/longform-index.mjs <video> --slug <slug> [--model medium] [--frame-every 20]
 *
 * This is the only automated stage of the pipeline. Moment-finding and viral
 * scoring (skills/01-longform-to-short/references/pipeline.md, STEP 1 + STEP 2)
 * are a semantic reading task — done by Claude reading the outputs of this
 * script, not by a heuristic. Writes:
 *
 *   public/footage/<slug>/source_video.json     probe metadata (schema below)
 *   public/footage/<slug>/transcript.json       word-level timings, ABSOLUTE seconds
 *   public/footage/<slug>/TRANSCRIPT.md         same transcript, human-skimmable w/ timecodes
 *   public/footage/<slug>/frames/frame_MMSS.jpg sparse keyframes to actually look at
 *
 * The source file is never modified. It is hardlinked (or copied, cross-volume)
 * into public/footage/<slug>/ so Remotion's staticFile() can serve it — the
 * original at its given path stays untouched and is the file of record.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readdirSync, linkSync, copyFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { homedir } from "node:os";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";
import { wordsToSegments, norm, DEFAULTS } from "./lib/autocut-core.mjs";

const WHISPER_VERSION = "1.5.5";
const root = process.cwd();

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const video = args.find((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--"));
const model = opt("model", "medium"); // multilingual default — never a *.en model (CLAUDE.md §7)
const frameEvery = parseFloat(opt("frame-every", "20"));
const MAX_FRAMES = 240;

if (!video || !existsSync(video)) {
  console.error("Usage: node scripts/longform-index.mjs <video> --slug <slug> [--model medium] [--frame-every 20]");
  process.exit(1);
}
const slug = (opt("slug", basename(video, extname(video))) || basename(video, extname(video)))
  .replace(/[^a-z0-9-]/gi, "-")
  .toLowerCase();

const outDir = join(root, "public", "footage", slug);
const framesDir = join(outDir, "frames");
mkdirSync(framesDir, { recursive: true });
const cacheRoot = join(homedir(), ".cache", "video-studio");
const whisperDir = join(cacheRoot, "whisper.cpp");
mkdirSync(cacheRoot, { recursive: true });
if (/\s/.test(whisperDir)) {
  console.error(`✗ whisper cache path has a space (${whisperDir}); @remotion/install-whisper-cpp can't handle that.`);
  process.exit(1);
}

// Remotion's bundled ffmpeg binary, called directly — ~12x faster than
// `npx remotion ffmpeg` (npx pays ~2s startup per call). Falls back to npx if
// the compositor package can't be found.
const ffmpegBin = (() => {
  const dir = join(root, "node_modules", "@remotion");
  if (!existsSync(dir)) return null;
  const cands = readdirSync(dir)
    .filter((d) => d.startsWith("compositor-"))
    .map((d) => join(dir, d, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"));
  return cands.find((p) => existsSync(p)) ?? null;
})();
const ffmpeg = (a) => {
  try {
    if (ffmpegBin) {
      return execFileSync(ffmpegBin, ["-hide_banner", ...a.map((x) => String(x))], {
        stdio: ["ignore", "ignore", "pipe"],
      }).toString();
    }
    return execFileSync("npx", ["remotion", "ffmpeg", ...a], { shell: true, stdio: ["ignore", "ignore", "pipe"] }).toString();
  } catch (e) {
    return String(e.stderr ?? "");
  }
};

console.log(`· probing ${video}`);
const probeOut = ffmpeg(["-i", video]);
const dm = probeOut.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
const rm = probeOut.match(/(\d+(?:\.\d+)?)\s*fps/);
const wh = probeOut.match(/,\s(\d{2,5})x(\d{2,5})[\s,]/);
const duration_s = dm ? +dm[1] * 3600 + +dm[2] * 60 + +dm[3] : 0;
const fps = rm ? +rm[1] : 30;
const width = wh ? +wh[1] : null;
const height = wh ? +wh[2] : null;
const has_audio = /Audio:/.test(probeOut);
if (!duration_s) {
  console.error("✗ could not probe duration — is this a valid video file?");
  process.exit(1);
}
console.log(`  ${(duration_s / 60).toFixed(1)} min · ${width}x${height} · ${fps}fps · audio:${has_audio ? "yes" : "no"}`);

// hardlink (or copy, cross-volume) the source into public/footage/<slug>/ so
// staticFile() can serve it. The ORIGINAL at `video` is never touched.
const localName = basename(video).replace(/[^a-z0-9.\-_]/gi, "_");
const localPath = join(outDir, localName);
if (!existsSync(localPath)) {
  try {
    linkSync(video, localPath);
  } catch {
    copyFileSync(video, localPath);
  }
}
const staticPath = `footage/${slug}/${localName}`;

if (!has_audio) {
  console.error("✗ no audio stream detected — cannot transcribe. Aborting before wasting a whisper pass.");
  process.exit(1);
}

console.log(`· whisper.cpp (${model}) — multilingual, no *.en model…`);
process.chdir(cacheRoot);
try {
  await installWhisperCpp({ to: whisperDir, version: WHISPER_VERSION });
  await downloadWhisperModel({ model, folder: whisperDir });
} finally {
  process.chdir(root);
}

const wav = join(cacheRoot, `longform_${slug}.16k.wav`);
ffmpeg(["-i", video, "-vn", "-ac", "1", "-ar", "16000", "-y", wav]);
if (!existsSync(wav)) {
  console.error("✗ ffmpeg produced no wav — aborting.");
  process.exit(1);
}

console.log("· transcribing (this is the long step — a 45min video takes a while)…");
const whisperOut = await transcribe({
  inputPath: wav,
  whisperPath: whisperDir,
  whisperCppVersion: WHISPER_VERSION,
  model,
  tokenLevelTimestamps: true,
});
try { execFileSync(process.execPath, ["-e", `require('fs').unlinkSync(${JSON.stringify(wav)})`]); } catch {}

const { captions: rawCaptions } = toCaptions({ whisperCppOutput: whisperOut });
const NON_SPEECH = /(blank_audio|music|silence|applause|laughter|noise|inaudible)/i;
const isSpeech = (t) => t.length > 0 && !NON_SPEECH.test(t) && /[a-z0-9]/i.test(t);
const captions = rawCaptions.filter((c) => isSpeech(c.text.trim()) && c.endMs > c.startMs);

const words = captions.map((c) => ({
  word: (c.word ?? c.text).trim(),
  start: +(c.startMs / 1000).toFixed(3),
  end: +(c.endMs / 1000).toFixed(3),
  norm: norm(c.text.trim()),
}));
console.log(`  ${words.length} words transcribed`);

// Informational only — NOT used to cut anything yet. Gives Claude a rough
// sense of scene/topic breaks (a >1.2s gap between speech regions) while
// reading the transcript for STEP 1 / STEP 2 of the pipeline.
const speechRegions = wordsToSegments(
  words.map((w) => ({ ...w })),
  duration_s,
  { maxPause: 1.2, margin: 0, minSegment: 0.3 },
).map(([s, e]) => [+s.toFixed(2), +e.toFixed(2)]);

// ---- write source_video.json -------------------------------------------
const sourceVideo = {
  id: slug,
  original_path: video,
  path: staticPath,
  duration_s: +duration_s.toFixed(2),
  width,
  height,
  fps,
  has_audio,
  aspect: width && height ? (width > height ? "horizontal" : width === height ? "square" : "vertical") : null,
  model,
  frames_dir: `footage/${slug}/frames`,
  indexed_at: new Date().toISOString(),
};
writeFileSync(join(outDir, "source_video.json"), JSON.stringify(sourceVideo, null, 2));

// ---- write transcript.json ----------------------------------------------
const transcript = {
  slug,
  source: staticPath,
  model,
  duration_s: sourceVideo.duration_s,
  word_count: words.length,
  words, // [{word,start,end,norm}] — ABSOLUTE seconds into the source
  speech_regions: speechRegions, // informational scene/topic-break hint only
};
writeFileSync(join(outDir, "transcript.json"), JSON.stringify(transcript, null, 2));

// ---- write TRANSCRIPT.md — human-skimmable, timecoded ------------------
const fmtT = (s) => {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};
const lines = [`# Transcript — ${localName}`, "", `${fmtT(0)}–${fmtT(duration_s)} · ${words.length} words · model: ${model}`, ""];
let bucket = [];
let bucketStart = 0;
for (const w of words) {
  if (w.start - bucketStart >= 15 && bucket.length) {
    lines.push(`**[${fmtT(bucketStart)}]** ${bucket.join(" ")}`);
    lines.push("");
    bucket = [];
    bucketStart = w.start;
  }
  if (!bucket.length) bucketStart = w.start;
  bucket.push(w.word);
}
if (bucket.length) lines.push(`**[${fmtT(bucketStart)}]** ${bucket.join(" ")}`);
writeFileSync(join(outDir, "TRANSCRIPT.md"), lines.join("\n") + "\n");

// ---- sparse keyframes, so "analyse the entire source" means actually
// looking at frames, not just reading text -------------------------------
const frameCount = Math.min(MAX_FRAMES, Math.floor(duration_s / frameEvery) + 1);
console.log(`· extracting ${frameCount} keyframes (every ${frameEvery}s)…`);
for (let i = 0; i < frameCount; i++) {
  const t = i * frameEvery;
  const jpg = join(framesDir, `frame_${fmtT(t).replace(":", "")}.jpg`);
  if (existsSync(jpg)) continue;
  ffmpeg(["-ss", String(t), "-i", video, "-frames:v", "1", "-q:v", "3", "-vf", "scale=480:-2", "-y", jpg]);
}

console.log(`\n════ done ════`);
console.log(`✓ public/footage/${slug}/source_video.json`);
console.log(`✓ public/footage/${slug}/transcript.json   (${words.length} words)`);
console.log(`✓ public/footage/${slug}/TRANSCRIPT.md      (read this first)`);
console.log(`✓ public/footage/${slug}/frames/            (${frameCount} keyframes — look at these, don't guess)`);
console.log(`\nNext (Claude, not a script): read TRANSCRIPT.md + the keyframes, run STEP 1 + STEP 2 of`);
console.log(`skills/01-longform-to-short/references/pipeline.md, and write moments.json`);
console.log(`(schema: skills/01-longform-to-short/templates/moments.json) into public/footage/${slug}/.`);
console.log(`Then: node scripts/longform-build.mjs --slug ${slug} --spec <candidate>.json`);
