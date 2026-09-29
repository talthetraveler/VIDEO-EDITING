#!/usr/bin/env node
// PROVE A CAPTION HOLDS LONG ENOUGH TO READ.
//
// Tal, 2026-09-29, reviewing ~35 finished videos: *"the caption pops up for
// like 0.2 seconds and then it goes away … it doesn't hold till I finish my
// sentence … it doesn't hold till the next person says something."*
// Measured on those renders: median caption on screen 0.56s, 40% under 0.5s,
// 84% under 0.8s, and 479 blank flashes (<0.8s) between captions mid-sentence.
//
// This tests placeInSpeech() - the function build-edit.mjs actually uses -
// against synthetic speech runs whose timing is known exactly.
//
//   node system/scripts/test-caption-hold.mjs        (exit 1 on any failure)
//
// THE RULE
//   1. READABLE: no caption is on screen for less than READ_MIN (0.8s) -
//      a line that would flash is merged with its neighbour, or held.
//   2. HOLD: a caption stays up until the next one replaces it, bridging any
//      gap shorter than BRIDGE (1.0s) - no blank flash between two words.
//   3. ON THE VOICE: a caption still starts on its own speech (within 0.05s
//      of a run start or inside a run) - holding must not delay starts.
//   4. A REAL PAUSE CLEARS: after the last word before a pause >= 1.2s, the
//      caption holds at most TAIL_MAX (0.7s) into the silence.
import { placeInSpeech } from "./lib/caption-timing.mjs";

const READ_MIN = 0.8, BRIDGE = 1.0, TAIL_MAX = 0.7;

const cases = [
  {
    name: "continuous fast talk, tiny gaps between words (the reported bug)",
    runs: [[0.0, 0.45], [0.55, 1.0], [1.1, 1.6], [1.7, 2.3]],
    texts: ["WHEN I HELP", "SOMEBODY", "IT MAKES ME", "MORE HAPPY"],
  },
  {
    name: "one long run, five short lines",
    runs: [[0.0, 2.6]],
    texts: ["IF I", "HELP OTHER", "PERSON", "IT MAKES", "ME HAPPY"],
  },
  {
    name: "a real pause in the middle must clear",
    runs: [[0.0, 1.2], [3.0, 4.0]],
    texts: ["ARE YOU MUSLIM", "YES I AM"],
  },
  {
    name: "one short word alone",
    runs: [[0.0, 0.3]],
    texts: ["THANKS"],
  },
];

let fails = 0;
for (const c of cases) {
  const words = c.texts.map((t) => t.split(/\s+/).length);
  const got = placeInSpeech(c.runs, c.texts, words);
  console.log(`\n=== ${c.name}`);
  for (const g of got) console.log(`  ${g.a.toFixed(2)}-${g.b.toFixed(2)}  (${(g.b - g.a).toFixed(2)}s)  ${g.text}`);
  const bad = [];
  const allText = got.map((g) => g.text).join(" ").split(/\s+/).join(" ");
  if (allText !== c.texts.join(" ").split(/\s+/).join(" ")) bad.push(`words lost or reordered: "${allText}"`);
  got.forEach((g, i) => {
    if (g.b - g.a < READ_MIN - 1e-6) bad.push(`"${g.text}" on screen ${(g.b - g.a).toFixed(2)}s < ${READ_MIN}`);
    const onVoice = c.runs.some(([s, e]) => g.a >= s - 0.05 && g.a < e);
    if (!onVoice) bad.push(`"${g.text}" starts at ${g.a} with no speech under it`);
    const nx = got[i + 1];
    if (nx) {
      const gap = nx.a - g.b;
      const speechGap = (() => {                     // silence between the two lines' speech
        const endRun = c.runs.filter(([s]) => s <= g.b + 1e-6).pop();
        const nextRun = c.runs.find(([s, e]) => nx.a >= s - 0.05 && nx.a < e);
        return endRun && nextRun ? nextRun[0] - endRun[1] : 0;
      })();
      if (gap > 0.001 && gap < BRIDGE && speechGap < 1.2) bad.push(`blank flash ${gap.toFixed(2)}s between "${g.text}" and "${nx.text}"`);
    }
    // a real pause must clear
    const run = c.runs.find(([s, e]) => g.a >= s - 0.05 && g.a < e);
    const nextRun = run && c.runs.find(([s]) => s > run[1] + 1e-6);
    const lastInRun = !nx || !(run && nx.a < run[1] + 1.2);
    if (run && lastInRun && nextRun && nextRun[0] - run[1] >= 1.2 && g.b > run[1] + TAIL_MAX + 1e-6)
      bad.push(`"${g.text}" holds ${(g.b - run[1]).toFixed(2)}s into a real pause (max ${TAIL_MAX})`);
  });
  if (bad.length) { fails += bad.length; for (const b of bad) console.log(`  FAIL ${b}`); } else console.log("  PASS");
}
console.log(`\n${fails ? `${fails} FAILURE(S)` : "ALL PASS"}`);
process.exit(fails ? 1 : 0);
