// V4 (Tal, 2026-10-11): "but they need to tell me their story".
// Adds his "tell me your story", "we came from Uganda... I came alone, she came alone", and how she was
// chased out and had to get away. Still no "mob justice" and no police/prison part.
import fs from "node:fs";
const p = "projects/st-uganda/edit.json";
const c = JSON.parse(fs.readFileSync(p));
const F = "local-3b0b7fa81fabadc7", B = "local-9a2267308e037d97";
c.beats = [[F, 1.72, 3.30], [B, 13.54, 15.60], [B, 18.44, 21.90], [F, 11.15, 15.85],
  [F, 24.58, 25.90], [F, 41.0, 46.15],
  [F, 60.20, 68.25], [F, 71.33, 76.0], [F, 83.27, 95.35], [F, 95.36, 98.45], [F, 99.90, 105.98],
  [F, 138.04, 143.65], [F, 168.77, 171.30], [F, 174.28, 183.25], [F, 187.96, 198.55], [F, 199.64, 208.45], [F, 209.92, 219.15],
  [F, 229.63, 233.05], [F, 245.73, 252.50], [F, 274.12, 282.60]].map(([i, a, b]) => [i, a, b, 0.5, ""]);
c.captionFix = c.captionFix.filter(f => !/yoganda/i.test(f.match)).concat([{ match: "Yoganda", to: "Uganda" }, { match: "yoganda", to: "Uganda" }]);
c.out = "ST_UGANDA_V4.mp4";
fs.writeFileSync(p, JSON.stringify(c, null, 1));
console.log(c.beats.reduce((s, b) => s + b[2] - b[1], 0).toFixed(1));
