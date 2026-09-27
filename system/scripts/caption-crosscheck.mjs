#!/usr/bin/env node
// CAPTION CROSS-CHECK — a SECOND OPINION on caption timing, from an engine
// that had nothing to do with generating them.
//
//   node system/scripts/caption-crosscheck.mjs <project-slug|BUILD-LOG.json> <render.mp4>
//   node system/scripts/caption-crosscheck.mjs eden-story system/projects/eden-story/EDEN_HER_STORY_V9.mp4
//
// WHY THIS EXISTS
//   The caption-qc rule in this repo is: *never verify with the same engine
//   that generated the captions.* Until now the only timing check was
//   speech-runs.py, which is the SAME measurement that placed them — it can
//   only confirm its own opinion. Three separate times an instrument here has
//   condemned good work or blessed bad work because it was marking its own
//   homework.
//
//   AutoSubSync (Tal handed over denizsafak/AutoSubSync) ships `assy-cli`,
//   which drives ffsubsync / alass / autosubsync / lapse. ffsubsync aligns a
//   subtitle file to a video by its OWN voice-activity detection. Feed it our
//   captions and it answers one question honestly:
//
//       "How far would I have to shift these to make them fit the speech?"
//
//   A near-zero shift is independent evidence the timing is right. A large
//   one means drift, and the sign tells you which way.
//
// WHAT IT DOES NOT DO
//   It says NOTHING about whether a caption's WORDS are correct, and nothing
//   about a translated caption's meaning. Timing only. A translated line stays
//   "timing verified, wording unverified" (CLAUDE.md 1 Honesty).
//
// ONE CONTINUOUS CLIP ONLY — MEASURED, 2026-09-26.
//   ffsubsync looks for the ONE shift that best fits the whole file. On a
//   multi-beat cut there is no such shift, and it does not fail loudly — it
//   returns a confident wrong number. Both cases were tested by injecting a
//   known +2.000s offset and asking it to recover -2.000s:
//
//     single clip (02 captioned.mp4, 28 cues)   median -2.00  min -2.00  max -2.00
//     13-beat montage (EDEN V9, 64 cues)        median -0.27  min -8.48  max +11.55
//
//   Exact on one take; noise on a montage. So this refuses to run on a
//   multi-beat build rather than print a number nobody should trust. Without
//   that guard it "condemned" the Eden cut at +24.29s — the fourth time an
//   instrument in this repo has failed good work.
//
// It writes only into the scratch dir; the render and the build log are read-only.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve, basename } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const SCRATCH = join(ROOT, "projects/_build-scratch/crosscheck");

const [arg0, arg1] = process.argv.slice(2);
if (!arg0 || !arg1) {
  console.error("usage: caption-crosscheck.mjs <slug|BUILD-LOG.json> <render.mp4>");
  process.exit(2);
}

const logPath = arg0.endsWith(".json") ? resolve(arg0) : join(ROOT, "projects", arg0, "BUILD-LOG.json");
const video = resolve(arg1);
for (const [label, p] of [["build log", logPath], ["render", video]]) {
  if (!existsSync(p)) { console.error(`${label} not found: ${p}`); process.exit(2); }
}

const raw = JSON.parse(readFileSync(logPath, "utf8"));
// Two shapes in this repo: a project BUILD-LOG ({captions:[{at,to,text}]}) and
// a caption-only sidecar ([{a,b,text}]). Normalise to {at,to,text}.
const list = Array.isArray(raw) ? raw : (raw.captions ?? []);
const caps = list
  .map((c) => ({ at: c.at ?? c.a, to: c.to ?? c.b, text: c.text, beat: c.beat }))
  .filter((c) => Number.isFinite(c.at) && Number.isFinite(c.to));
if (!caps.length) { console.error("no captions with start/end times in that file"); process.exit(2); }

// THE GUARD. See the header: on a multi-beat cut ffsubsync returns a confident
// wrong number instead of an error, so refuse rather than report it.
const beats = new Set(caps.map((c) => c.beat).filter((b) => b !== undefined));
const nBeats = Array.isArray(raw) ? 1 : (raw.beats?.length ?? beats.size);
if (nBeats > 1 && !process.argv.includes("--force-montage")) {
  console.error(`REFUSING: this is a ${nBeats}-beat cut, not one continuous take.`);
  console.error("ffsubsync fits ONE global shift; across hard cuts there isn't one, and it");
  console.error("returns noise rather than failing (measured: +-11s on a 91s film).");
  console.error("Cross-check the SOURCE CLIPS individually instead, before they are assembled.");
  process.exit(2);
}

// ---------------------------------------------------------------- srt
// BUILD-LOG records both edges since 2026-09-24. Before that only `at` existed
// and any checker was measuring a GUESSED window — see LESSONS.
const pad = (n, w) => String(n).padStart(w, "0");
const stamp = (t) => {
  const ms = Math.max(0, Math.round(t * 1000));
  return `${pad(Math.floor(ms / 3600000), 2)}:${pad(Math.floor(ms / 60000) % 60, 2)}:` +
         `${pad(Math.floor(ms / 1000) % 60, 2)},${pad(ms % 1000, 3)}`;
};
const srt = caps.map((c, i) =>
  `${i + 1}\n${stamp(c.at)} --> ${stamp(c.to)}\n${c.text}\n`).join("\n");

mkdirSync(SCRATCH, { recursive: true });
const base = basename(video).replace(/\.[^.]+$/, "");
const ours = join(SCRATCH, `${base}.ours.srt`);
const theirs = join(SCRATCH, `${base}.ffsubsync.srt`);
writeFileSync(ours, srt, "utf8");

// ---------------------------------------------------------------- the second opinion
// ffsubsync is the default engine: it reads the VIDEO's audio directly, so it
// shares no code and no assumption with how these captions were placed.
const TOOL = process.argv.includes("--tool")
  ? process.argv[process.argv.indexOf("--tool") + 1] : "ffsubsync";

console.log(`cross-checking ${caps.length} captions against ${basename(video)} with ${TOOL} ...`);
try {
  execFileSync("assy-cli", ["sync", video, ours, "-o", theirs, "-t", TOOL, "--no-prefix"],
    { stdio: ["ignore", "pipe", "pipe"], timeout: 15 * 60_000 });
} catch (e) {
  const err = String(e.stderr ?? e.stdout ?? e.message).trim().split("\n").slice(-4).join("\n");
  console.error(`assy-cli failed — the cross-check did NOT run:\n${err}`);
  console.error("(is AutoSubSync installed? `pip show autosubsync ffsubsync`)");
  process.exit(1);
}
if (!existsSync(theirs)) { console.error(`${TOOL} wrote no output — cross-check did NOT run`); process.exit(1); }

// ---------------------------------------------------------------- compare
const secs = (s) => {
  const m = s.match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : null;
};
const got = [];
for (const block of readFileSync(theirs, "utf8").split(/\r?\n\r?\n/)) {
  const line = block.split(/\r?\n/).find((l) => l.includes("-->"));
  if (line) { const [a] = line.split("-->"); const t = secs(a); if (t !== null) got.push(t); }
}
// CUE LOSS = THE ENGINE DID NOT LOCK ON, and it is the ONLY tell it gives.
//
// ffsubsync applies one global shift and silently drops whatever would land
// before t=0. So a wild misalignment shows up as MISSING CUES, not as an
// error. On "01 captioned.mp4" it returned 3 of 14 — our cue 12 (22.46s) came
// back at 1.50s, a shift of about -21s on a 27-second clip, and the first
// eleven were simply gone.
//
// Comparing what is left by position is meaningless once that happens: cue 1
// of theirs is cue 12 of ours. Reporting a "shift" from it produced three
// false FAILs on captions that were fine. So: no verdict, and say so.
if (got.length !== caps.length) {
  console.log("");
  console.log(`INCONCLUSIVE — ${TOOL} returned ${got.length} of ${caps.length} cues.`);
  console.log("Dropped cues mean it never locked onto the speech; the cues that survived");
  console.log("no longer line up with ours by position, so any number here would be fiction.");
  console.log("");
  console.log("This engine can CONFIRM timing, never convict it. Treat as 'not checked'");
  console.log("and fall back to looking at real frames.");
  process.exit(3);
}

const n = Math.min(got.length, caps.length);
const shifts = Array.from({ length: n }, (_, i) => got[i] - caps[i].at);
const sorted = [...shifts].sort((a, b) => a - b);
const median = sorted[sorted.length >> 1];
const worst = shifts.reduce((m, s) => (Math.abs(s) > Math.abs(m) ? s : m), 0);
const spread = sorted[sorted.length - 1] - sorted[0];

console.log("");
console.log(`captions        ${n}`);
console.log(`median shift    ${median >= 0 ? "+" : ""}${median.toFixed(2)}s   <- a CONSTANT offset; the whole track is early/late`);
console.log(`spread          ${spread.toFixed(2)}s   <- GROWING drift if this is large; the signature of bad word timings`);
console.log(`worst single    ${worst >= 0 ? "+" : ""}${worst.toFixed(2)}s`);

const off = shifts.filter((s) => Math.abs(s) > 0.5).length;
console.log(`over 0.5s out   ${off} of ${n}`);

// Thresholds: 0.30s is roughly the point a caption reads as late to the eye;
// 0.5s spread means the error is not a constant offset that one shift fixes.
const bad = Math.abs(median) > 0.3 || spread > 1.0 || off > n * 0.25;
console.log("");
console.log(bad ? "FAIL — an independent engine disagrees with this timing. Do not send."
                : "PASS — an independent engine puts these captions where we put them.");
console.log(`ours:   ${ours}`);
console.log(`theirs: ${theirs}`);
console.log("");
console.log("TIMING ONLY. This says nothing about whether the words are right,");
console.log("and nothing at all about a translated line's meaning.");
process.exit(bad ? 1 : 0);
