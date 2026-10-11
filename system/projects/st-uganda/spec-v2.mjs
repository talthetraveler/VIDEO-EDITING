// V2: the long clip only (Tal, 2026-10-11: "just use that clip mainly and use only that clip").
import fs from "node:fs";
const p = "projects/st-uganda/edit.json";
const c = JSON.parse(fs.readFileSync(p));
const F = "local-3b0b7fa81fabadc7";
c.beats = [[1.72, 3.30], [5.87, 15.85], [60.20, 68.25], [71.33, 76.0], [83.27, 95.35], [138.04, 143.65], [168.77, 171.30],
  [174.28, 183.25], [187.96, 198.55], [199.64, 208.45], [209.92, 219.15], [229.63, 233.05], [245.73, 252.50], [274.12, 282.60]]
  .map(([a, b]) => [F, a, b, 0.5, ""]);
c.captionFix = [
  { match: "Rezibian", to: "lesbian" },
  { match: "But he could enough,", to: "But good enough," },
  { match: "he could enough", to: "good enough" },
  { match: "And so you Muslim?", to: "And so you're Muslim?" },
  { match: "So you Christian, you Muslim,", to: "So you're Christian, you're Muslim," },
];
c.out = "ST_UGANDA_V2.mp4";
fs.writeFileSync(p, JSON.stringify(c, null, 1));
console.log(c.beats.reduce((s, b) => s + b[2] - b[1], 0).toFixed(1));
