#!/usr/bin/env node
/**
 * export-srt.mjs — write a standalone .srt from a project's ALREADY-EDITED
 * caption track. For YouTube's native caption upload slot (accessibility,
 * search, auto-translate) as a complement to the burned-in captions in the
 * render itself — not a replacement for them.
 *
 * 2026-09-12: built after evaluating kkoppenhaver/cc-skills' video-subtitler
 * skill. That skill re-transcribes from scratch with whisper.cpp/whisper-cli
 * to produce an SRT; we don't need that here — every project already has
 * word-exact, hand-correctable caption text in project.json's `captions`
 * track (whisper.cpp or WhisperX timed, positivity-gated, retake-cleaned,
 * possibly hand-edited in the :4100 dashboard). Exporting FROM that is more
 * accurate than re-transcribing the final render and risking a second set
 * of transcription errors on top of the ones already fixed.
 *
 * Usage:
 *   node scripts/export-srt.mjs <project> [--out path.srt]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const project = args[0];
const outIdx = args.indexOf("--out");
const outPath = outIdx >= 0 ? args[outIdx + 1] : join(root, "projects", project, `${project}.srt`);

if (!project) {
  console.error("usage: node scripts/export-srt.mjs <project> [--out path.srt]");
  process.exit(2);
}

const projPath = join(root, "projects", project, "project.json");
const data = JSON.parse(readFileSync(projPath, "utf8"));
const captions = data.tracks?.captions;
if (!Array.isArray(captions) || captions.length === 0) {
  console.error(`ERROR: no captions track found in ${projPath}`);
  process.exit(1);
}

function srtTime(s) {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const rem = ms % 1000;
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(rem, 3)}`;
}

const lines = [];
captions.forEach((c, i) => {
  if (!c.text || !c.text.trim()) return; // skip empty/removed captions
  lines.push(String(i + 1));
  lines.push(`${srtTime(c.start)} --> ${srtTime(c.end)}`);
  lines.push(c.text.trim());
  lines.push("");
});

writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`${captions.filter((c) => c.text?.trim()).length} cues -> ${outPath}`);
console.log("Upload via YouTube Studio -> the video -> Subtitles -> Add language -> Upload file -> With timing.");
