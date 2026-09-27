#!/usr/bin/env node
// PROVE WHERE A CAPTION LANDS RELATIVE TO THE VOICE.
//
// Tal, repeatedly: "make sure when I speak then the captions show up."
//
// This replays build-edit.mjs's caption placement against synthetic speech
// whose onsets are KNOWN exactly, so the answer is arithmetic, not opinion.
// Run it after touching anything in the placement code.
//
//   node system/scripts/test-caption-timing.mjs [--old]
//
// THE BUG IT WAS WRITTEN FOR (2026-09-24, measured)
//   `const a = Math.max(prevEnd, ...)` made a caption start no earlier than
//   the PREVIOUS caption ENDED. Every caption is held a readable minimum
//   (>=0.8s), so whenever someone speaks faster than that, each line shoves the
//   next one later and the error accumulates:
//
//     speech at 0.0 0.5 1.0 1.5 2.0  ->  captions at 0.0 0.8 1.6 2.4 3.0
//                                                        +0.3 +0.6 +0.9 +1.0
//
//   which is exactly the reported symptom - the caption appears as the
//   sentence finishes. It was invisible at a normal talking pace (1.0s
//   between lines clears the 0.8s floor) and severe in fast exchanges.
//
// THE FIX
//   Captions REPLACE each other. A caption starts on its own speech onset and
//   is never pushed by the one before it; instead the previous caption is cut
//   short by the next one's arrival. When two onsets are closer together than
//   a line can be read, the two lines are MERGED into one caption rather than
//   one of them being delayed. That is Tal's own rule - "rapid speech produces
//   rapid replacements" - instead of a queue that slips.

import { placeCaptions, MIN_SHOW } from "./lib/caption-timing.mjs";

const CAP = (t) => Math.round(t * 1000) / 1000;
const OLD = process.argv.includes("--old");

// ---------------------------------------------------------------- OLD
// The shipped algorithm before 2026-09-24, kept so the bug stays reproducible.
function placeOld(onsets, texts, wordsPerChunk, a0, b0) {
  const n = wordsPerChunk.length;
  const total = wordsPerChunk.reduce((t, x) => t + x, 0) || 1;
  let cum = 0;
  let starts = wordsPerChunk.map((w) => {
    const v = a0 + (cum / total) * (b0 - a0);
    cum += w;
    return v;
  });
  if (onsets.length) {
    let last = -Infinity;
    starts = starts.map((t) => {
      let best = null, bd = 0.8;
      for (const o of onsets) {
        if (o < last) continue;
        const d = Math.abs(o - t);
        if (d < bd) { bd = d; best = o; }
      }
      const v = best ?? Math.max(t, last);
      last = v + 0.2;
      return v;
    });
  }
  const out = [];
  let prevEnd = 0;
  for (let ci = 0; ci < n; ci++) {
    const a = Math.max(prevEnd, Math.min(Math.max(starts[ci], a0), b0 - 0.2));
    const need = Math.max(0.8, wordsPerChunk[ci] * 0.25);
    const nextStart = ci + 1 < starts.length ? Math.max(starts[ci + 1], a + need) : a + need;
    const b = Math.min(b0, Math.max(a + need, Math.min(nextStart, a + 2.2)));
    prevEnd = b;
    out.push({ a: CAP(a), b: CAP(b), text: texts[ci] });
  }
  return out;
}

// ---------------------------------------------------------------- CASES
const cases = [
  {
    name: "fast speech, 0.5s between lines",
    onsets: [0.0, 0.5, 1.0, 1.5, 2.0],
    texts: ["I LOVE", "YOU TOO", "MY BROTHER", "COME HERE", "THANK YOU"],
    a0: 0, b0: 3.2,
  },
  {
    name: "normal speech, 1.0s between lines",
    onsets: [0.0, 1.0, 2.0, 3.0],
    texts: ["WHAT IS THIS", "IT IS BREAD", "FOR YOU FREE", "THANK YOU BROTHER"],
    a0: 0, b0: 4.5,
  },
  {
    name: "a pause in the middle",
    onsets: [0.0, 0.6, 3.0, 3.6],
    texts: ["ARE YOU", "PALESTINIAN", "YES I AM", "WE TOGETHER"],
    a0: 0, b0: 4.6,
  },
  {
    name: "very fast - 0.3s apart, must merge not slip",
    onsets: [0.0, 0.3, 0.6, 2.0],
    texts: ["NO", "THANK", "YOU", "WHY NOT"],
    a0: 0, b0: 3.0,
  },
];

const place = OLD ? placeOld : placeCaptions;
console.log(OLD ? "ALGORITHM: old (pre-fix)" : "ALGORITHM: current");

let offVoice = 0, tooShort = 0, overSilence = 0;

for (const c of cases) {
  console.log(`\n=== ${c.name} ===`);
  console.log(`  speech starts at: ${c.onsets.join(", ")}`);
  const words = c.texts.map((t) => t.split(/\s+/).length);
  const got = place(c.onsets, c.texts, words, c.a0, c.b0);

  console.log(`  ${"shown".padEnd(16)} ${"for".padEnd(7)} ${"voice".padEnd(7)} off by   text`);
  for (const cap of got) {
    // the voice this caption is meant to be on = nearest onset at/before it
    const near = c.onsets.reduce((best, o) =>
      Math.abs(o - cap.a) < Math.abs(best - cap.a) ? o : best, c.onsets[0]);
    const off = CAP(cap.a - near);
    const dur = CAP(cap.b - cap.a);
    const badOff = Math.abs(off) > 0.25;
    const badDur = dur < MIN_SHOW - 1e-6;
    // is any speech happening while it is up? (a run starts within its window)
    const covered = c.onsets.some((o) => o >= cap.a - 0.3 && o < cap.b);
    if (badOff) offVoice++;
    if (badDur) tooShort++;
    if (!covered) overSilence++;
    console.log(
      `  ${`${cap.a}s -> ${cap.b}s`.padEnd(16)} ${`${dur}s`.padEnd(7)} ${String(near).padEnd(7)} ` +
      `${off > 0 ? "+" : ""}${off}s`.padEnd(9) +
      `${cap.text}` +
      `${badOff ? "   <-- OFF THE VOICE" : ""}${badDur ? "   <-- TOO BRIEF" : ""}` +
      `${!covered ? "   <-- OVER SILENCE" : ""}`);
  }
}

console.log(`\n${offVoice} off the voice (>0.25s), ${tooShort} too brief (<${MIN_SHOW}s), ${overSilence} over silence.`);
process.exit(offVoice + tooShort + overSilence ? 1 : 0);
