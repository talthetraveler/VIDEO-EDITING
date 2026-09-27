#!/usr/bin/env node
// RECOVER THE OTHER PERSON'S VOICE — by transcribing only the GAPS.
//
// Tal, 2026-09-24: *"you didn't really transcribe what the other person said.
// You just transcribed what I said from the POV."*
//
//   node system/scripts/retranscribe-boosted.mjs <clip.mp4> <cacheId> [--dry]
//
// WHY THE MODEL WAS NEVER THE PROBLEM
//   The translation pass already uses whisper-large-v3. The problem is LEVEL:
//   Tal wears the mic, so his voice is far hotter than the stranger a few feet
//   away, and on a noisy street the reply never rises enough for the model to
//   commit to it. Measured on clip 02: 3.1s-5.5s came back empty although
//   there is plainly speech in it.
//
// WHY NOT JUST RE-RUN THE WHOLE CLIP BOOSTED
//   Tried, twice, and both merge rules failed. A whole-clip boosted pass
//   re-hears everything, returns segments rounded to the second, and each one
//   spans both speakers. Merging loosely DOUBLED captions ("It's a hot day"
//   printed twice on clip 02); merging strictly rejected all of it, because a
//   3-second coarse segment always overlaps something.
//
// SO: FIND THE SILENCE IN THE TRANSCRIPT, NOT IN THE AUDIO.
//   Where the transcript says nothing but the audio measures speech, cut out
//   exactly that window, boost it alone, and transcribe just that. The result
//   is timed to the real window and cannot collide with what is already there.
//   The delivered audio is never altered — only the copy sent to the model.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { loadEnv, groqTranslate } from "./lib/stt.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const CACHE = join(ROOT, "projects/_frameio/cache");
const TMP = join(ROOT, "projects/_tmp-boost");
const MIN_GAP = 0.55;     // shorter than this is a breath, not a reply
const PAD = 0.20;

const [SRC, ID] = process.argv.slice(2);
const DRY = process.argv.includes("--dry");
if (!SRC || !ID) { console.error("usage: retranscribe-boosted.mjs <clip.mp4> <cacheId>"); process.exit(1); }
loadEnv();
mkdirSync(TMP, { recursive: true });

const before = JSON.parse(readFileSync(join(CACHE, "translate", `${ID}.json`), "utf8"));
const segs = (before.segments ?? [])
  .map((s) => ({ start: +s.start, end: +s.end, text: String(s.text ?? "").trim() }))
  .filter((s) => s.text)
  .sort((a, b) => a.start - b.start);

// measured speech
// A LOWER THRESHOLD ON PURPOSE. The default (0.35 of the file's own range) is
// tuned to place captions on the WEARER's voice. The person he is talking to is
// far quieter, and at the default their reply is not even detected as speech —
// which is why a first attempt at this found almost no gaps to fill. 0.14
// reaches down to the other half of the conversation.
const runs = execFileSync("python", [join(ROOT, "scripts/speech-runs.py"), SRC, "12", "0.14"],
  { encoding: "utf8" }).trim().split(",").filter(Boolean)
  .map((r) => r.split("-").map(Number));

// speech the transcript does NOT account for
const holes = [];
for (const [rs, re] of runs) {
  let cuts = [[rs, re]];
  for (const s of segs) {
    const next = [];
    for (const [a, b] of cuts) {
      if (s.end <= a || s.start >= b) { next.push([a, b]); continue; }
      if (s.start > a) next.push([a, s.start]);
      if (s.end < b) next.push([s.end, b]);
    }
    cuts = next;
  }
  for (const [a, b] of cuts) if (b - a >= MIN_GAP) holes.push([a, b]);
}

console.log(`  ${segs.length} segments transcribed, ${runs.length} speech runs measured`);
console.log(`  ${holes.length} window(s) where someone speaks but nothing was transcribed:`);
for (const [a, b] of holes) console.log(`      ${a.toFixed(2)} - ${b.toFixed(2)}  (${(b - a).toFixed(2)}s)`);
if (!holes.length || DRY) {
  if (!DRY) writeFileSync(join(CACHE, "translate", `${ID}.merged.json`),
    JSON.stringify({ ...before, segments: segs }, null, 1), "utf8");
  process.exit(0);
}

const recovered = [];
for (const [a, b] of holes) {
  const ss = Math.max(0, a - PAD);
  const dur = (b - a) + PAD * 2;
  const wav = join(TMP, `${basename(SRC, ".mp4")}-${a.toFixed(2)}.flac`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(ss), "-t", String(dur), "-i", SRC,
    "-vn", "-af", "highpass=f=70,dynaudnorm=f=120:g=11:p=0.92:m=20:s=6," +
    "compand=attacks=0.02:decays=0.3:points=-70/-38|-40/-16|-20/-9|0/-5",
    "-ac", "1", "-ar", "16000", "-c:a", "flac", wav], { stdio: "pipe" });
  let txt = "";
  try {
    const r = await groqTranslate(wav);
    txt = String(r.text ?? "").trim();
  } catch (e) { console.log(`      !! ${a.toFixed(2)}s failed: ${String(e.message).slice(0, 60)}`); }
  // Whisper fills silence with its stock phrases; none of these is a reply.
  const junk = /^(thank you\.?|you|bye|thanks for watching|subtitles by.*|\.|,)$/i;
  if (!txt || junk.test(txt.replace(/\s+/g, " ").trim()) && (b - a) < 0.9) continue;
  if (!txt || txt.length < 2) continue;
  recovered.push({ start: a, end: b, text: txt, from: "gap" });
  console.log(`      + ${a.toFixed(2)}-${b.toFixed(2)}  "${txt}"`);
}

const merged = [...segs, ...recovered].sort((x, y) => x.start - y.start);
writeFileSync(join(CACHE, "translate", `${ID}.merged.json`),
  JSON.stringify({ ...before, segments: merged }, null, 1), "utf8");
console.log(`  recovered ${recovered.length} line(s) -> ${ID}.merged.json  (${merged.length} total)`);
