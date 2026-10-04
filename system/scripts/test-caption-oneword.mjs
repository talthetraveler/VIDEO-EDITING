#!/usr/bin/env node
// PROVE ONE-WORD CAPTIONS SIT ON THEIR OWN WORD.
//
// Tal, 2026-10-04 (stranger heli balloon): "Use one word captions."
// `"captionWords": 1` in edit.json -> oneWordCaptions(). Needs WhisperX-aligned
// word times (tools/align-cache.py); the builder falls back to phrase captions
// when a clip is not aligned.
//
//   node system/scripts/test-caption-oneword.mjs      (exit 1 on any failure)
//
// THE RULE
//   1. ONE WORD per caption, in speaking order, upper case, no punctuation.
//   2. ON THE WORD: a caption starts within 0.02s of its word's start.
//   3. ONE AT A TIME: a caption ends when the next word starts.
//   4. A PAUSE CLEARS: after a word followed by silence the caption lingers at
//      most LINGER (0.35s) past the word's end.
//   5. A word belongs to the beat that holds its MIDPOINT - never two beats.
//   6. A word too quick to see (< 0.1s before the next) rides with the next.
import { oneWordCaptions } from "./lib/caption-timing.mjs";

let fail = 0;
const ok = (cond, msg) => { if (!cond) { fail++; console.log("  FAIL  " + msg); } };
const W = (s) => s.map(([word, start, end]) => ({ word, start, end }));

{ // plain sentence, beat 10-13
  const words = W([["Hey,", 10.1, 10.4], ["excuse", 10.45, 10.8], ["me.", 10.82, 11.0], ["Sorry!", 12.0, 12.4]]);
  const c = oneWordCaptions(words, 10, 13);
  ok(c.map((x) => x.text).join("|") === "HEY|EXCUSE|ME|SORRY", "text/order: " + c.map((x) => x.text).join("|"));
  ok(c.every((x, i) => Math.abs(x.a - (words[i].start - 10)) <= 0.02), "starts on its word");
  ok(c[0].b <= c[1].a + 1e-6 && c[1].b <= c[2].a + 1e-6, "one at a time");
  ok(c[2].b <= 1.0 + 0.35 + 1e-6 && c[2].b < c[3].a, "pause clears: 'ME' ends " + c[2].b);
  ok(c[3].b <= 2.4 + 0.35 + 1e-6, "last word lingers at most 0.35s");
}
{ // midpoint ownership across a cut at 5.0
  const words = W([["good", 4.6, 4.9], ["morning", 4.92, 5.3], ["friend", 5.35, 5.8]]);
  const a = oneWordCaptions(words, 4, 5), b = oneWordCaptions(words, 5, 6);
  ok(a.map((x) => x.text).join("|") === "GOOD", "beat A owns GOOD only: " + a.map((x) => x.text).join("|"));
  ok(b.map((x) => x.text).join("|") === "MORNING|FRIEND", "beat B owns MORNING FRIEND: " + b.map((x) => x.text).join("|"));
  ok(b[0].a === 0, "a word that began before the cut starts at 0, got " + b[0].a);
  ok(a.every((x) => x.b <= 1.0 + 1e-6) && b.every((x) => x.b <= 1.0 + 1e-6), "never past the beat end");
}
{ // a flash word rides with the next; unsorted + untimed input survives
  const words = W([["now", 1.5, 1.9], ["I", 1.0, 1.04], ["go", 1.06, 1.4], ["...", 2.0, 2.1]]);
  words.push({ word: "ten" });
  const c = oneWordCaptions(words, 0, 3);
  ok(c.map((x) => x.text).join("|") === "I GO|NOW", "flash word merged: " + c.map((x) => x.text).join("|"));
  ok(c.every((x) => x.b - x.a >= 0.1), "nothing shorter than 0.1s");
}
{ // corrections: rename and drop
  const words = W([["Am", 0.1, 0.3], ["Israel", 0.35, 0.8], ["High", 0.85, 1.2], ["um", 1.3, 1.5]]);
  const c = oneWordCaptions(words, 0, 2, { fix: [{ match: "High", to: "Chai" }, { match: "um", to: null }] });
  ok(c.map((x) => x.text).join("|") === "AM|ISRAEL|CHAI", "fix applied: " + c.map((x) => x.text).join("|"));
}
console.log(fail ? `\n${fail} FAILED` : "one-word captions: all checks pass");
process.exit(fail ? 1 : 0);
