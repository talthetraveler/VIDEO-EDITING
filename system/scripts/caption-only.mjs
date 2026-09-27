#!/usr/bin/env node
// CAPTION AN ALREADY-EDITED CLIP. Nothing else is touched.
//
// Tal, 2026-09-24: *"they're already edited, you just need captions ... just do
// the minimum ... just some good captions, boom boom boom."*
//
//   node system/scripts/caption-only.mjs <clip.mp4> <out.mp4> [--id <cacheId>]
//
// WHY NOT build-edit.mjs
//   build-edit re-cuts, re-grades and denoises. On footage Tal has already
//   finished, every one of those is a defect: his grade would be applied twice
//   and his ambience would shift. This overlays caption PNGs and copies the
//   audio stream untouched. The picture is re-encoded once because burning in
//   pixels requires it; nothing else about it changes.
//
// TIMING comes from scripts/lib/caption-timing.mjs — the placement fixed on
// 2026-09-24 after captions were landing AFTER the words they caption.
// Onsets are measured from THIS file's audio, never from transcript maths.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { placeInSpeech } from "./lib/caption-timing.mjs";
import { captionLines } from "./lib/caption-lines.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const CACHE = join(ROOT, "projects/_frameio/cache");
const args = process.argv.slice(2);
const SRC = args[0];
const OUT = args[1];
const ID = args.includes("--id") ? args[args.indexOf("--id") + 1] : null;
const CAP_SIZE = 94, CAP_MAXW = 980, CAP_Y = 0.66;

if (!SRC || !OUT) { console.error("usage: caption-only.mjs <clip.mp4> <out.mp4> --id <cacheId>"); process.exit(1); }
if (!existsSync(SRC)) { console.error(`no such file: ${SRC}`); process.exit(1); }

const TMP = join(ROOT, "projects/_tmp-captions", basename(OUT, ".mp4"));
mkdirSync(TMP, { recursive: true });

// ---------------------------------------------------------------- transcript
// prefer the gap-recovered transcript when one exists
const mp = join(CACHE, "translate", `${ID}.merged.json`);
const tp = existsSync(mp) ? mp : join(CACHE, "translate", `${ID}.json`);
if (!existsSync(tp)) { console.error(`no translation cached for ${ID}`); process.exit(1); }
const segs = (JSON.parse(readFileSync(tp, "utf8")).segments ?? [])
  .map((s) => ({ start: +s.start, end: +s.end, text: String(s.text ?? "").trim() }))
  .filter((s) => s.text);

// HAND CORRECTIONS. A machine transcript is not sacred (CLAUDE.md rule 5:
// read every caption as English). Groq rendered the Hebrew slang "חם רצח"
// — "murder-hot", i.e. brutally hot — literally as "Happy Ritzach", which is
// not English and not what he said.
const FIX = [
  [/happy ritzach today,? ?/gi, "So hot today, "],
  [/happy ritzach/gi, "So hot today"],
  [/\britzach\b/gi, "crazy hot"],
  [/take care of your life/gi, "Take care of yourself"],
];

// --------------------------------------------------------------- speech runs
// RUNS, not onsets. A street POV mic fires an onset on a bottle crinkle, a
// footstep, a passing scooter; a run has duration and cannot. Measured on this
// very clip: placing by onset put 6 of 19 captions over silence.
function runsFor(file) {
  try {
    const out = execFileSync("python", [join(ROOT, "scripts/speech-runs.py"), file],
      { encoding: "utf8" }).trim();
    if (!out) return [];
    return out.split(",").map((r) => r.split("-").map(Number))
      .filter(([s, e]) => Number.isFinite(s) && Number.isFinite(e) && e > s);
  } catch (e) {
    console.log(`  !! speech detection failed: ${String(e.message).slice(0, 80)}`);
    return [];
  }
}

// ------------------------------------------------------------------ chunking
// scripts/lib/caption-lines.mjs — splits on MEANING, not every 2-3 words.
// The old splitter is why Tal said "you're doing such a bad job on the
// captions": it produced "LIKED THE LOOK. HAVE A" / "DAY. I LIKED THE LOOK".

const allRuns = runsFor(SRC);
const talk = allRuns.reduce((t, [a, b]) => t + (b - a), 0);
console.log(`  ${allRuns.length} speech runs measured from the file's own audio (${talk.toFixed(1)}s of talking)`);

let caps = [];
let lastShown = "";
for (const sg of segs) {
  let text = sg.text;
  for (const [re, to] of FIX) text = text.replace(re, to);
  const lines = captionLines(text).map((l) => l.toUpperCase());
  if (!lines.length) continue;
  const words = lines.map((l) => l.split(/\s+/).length);
  // the speech actually inside this segment, clipped to it
  const lo = sg.start - 0.25, hi = sg.end + 0.25;
  const local = allRuns
    .map(([a, b]) => [Math.max(a, lo), Math.min(b, hi)])
    .filter(([a, b]) => b - a > 0.12);
  if (!local.length) continue;              // nobody is speaking here - no caption
  const placed = placeInSpeech(local, lines, words);
  for (const p of placed) {
    const key = p.text.trim().toUpperCase();
    if (key === lastShown) continue;            // never the same line twice running
    lastShown = key;
    caps.push(p);
  }
}
// no overlaps: a caption ends when the next begins
caps.sort((a, b) => a.a - b.a);
caps = caps.filter((c, i) => {
  if (i + 1 < caps.length) c.b = Math.min(c.b, caps[i + 1].a);
  return c.b - c.a >= 0.2;
});
console.log(`  ${caps.length} captions`);

// ------------------------------------------------------------------ render
const meta = JSON.parse(execFileSync("python", [join(ROOT, "scripts/render-caption.py"),
  TMP, String(CAP_MAXW), String(CAP_SIZE)],
  { input: JSON.stringify(caps.map((c) => ({ text: c.text }))), encoding: "utf8" }).trim());

const H = 1920;
const y = Math.round(H * CAP_Y);
const parts = [];
let prev = "[0:v]";
caps.forEach((c, i) => {
  const m = meta[i];
  if (!m) return;
  const fp = m.file.split(String.fromCharCode(92)).join("/").replace(/^([A-Za-z]):/, "$1\\:");
  parts.push(`movie='${fp}'[cm${i}]`);
  parts.push(`${prev}[cm${i}]overlay=x=(W-w)/2:y=${y}-h/2:eval=init:` +
    `enable='between(t\\,${c.a}\\,${c.b})'[vc${i}]`);
  prev = `[vc${i}]`;
});
const fc = parts.join(";") + `;${prev}null[v]`;

mkdirSync(dirname(OUT), { recursive: true });
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", SRC,
  "-filter_complex", fc, "-map", "[v]", "-map", "0:a?",
  "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
  "-c:a", "copy", OUT], { stdio: "inherit" });

writeFileSync(join(dirname(OUT), `${basename(OUT, ".mp4")}.captions.json`),
  JSON.stringify(caps, null, 1), "utf8");
console.log(`  -> ${OUT}`);
