// V5 (Tal, 2026-10-11): hook first ("wait, so you guys are gay, from Uganda, and you moved to Israel to
// escape"), then the walk-up, then THEY tell the story before he asks more questions.
import fs from "node:fs";
const p = "projects/st-uganda/edit.json";
const c = JSON.parse(fs.readFileSync(p));
const F = "local-3b0b7fa81fabadc7", B = "local-9a2267308e037d97";
c.beats = [
  [F, 138.04, 143.65],                       // HOOK: so you came to Israel to escape, hunted for being gay in Uganda? Exactly.
  [F, 1.72, 3.30], [B, 13.54, 15.60], [B, 18.44, 21.90],   // walk-up, from Uganda, a couple? yes
  [F, 24.58, 25.90], [F, 41.0, 46.15],       // tell me your story / we came from Uganda, I came alone, she came alone
  [F, 60.20, 68.25], [F, 71.33, 76.0],       // fell in love, met here, why move / hunting us, wanted to kill us
  [F, 83.27, 95.35], [F, 95.36, 98.45], [F, 99.90, 105.98],  // who / community, family / chased out, had to get out
  [F, 168.77, 171.30], [F, 174.28, 183.25],  // message to the world / live their truth
  [F, 199.64, 208.45],                       // here in Israel there is peace / safe? exactly
  [F, 209.92, 219.15], [F, 229.63, 233.05], [F, 245.73, 252.50],  // Christian + Muslim / what matters is love / live in peace
  [F, 274.12, 282.60]].map(([i, a, b]) => [i, a, b, 0.5, ""]);
c.captionFix = c.captionFix.filter(f => !/yoganda/i.test(f.match)).concat([{ match: "Yoganda", to: "Uganda" }, { match: "yoganda", to: "Uganda" }]);
c.out = "ST_UGANDA_V5.mp4";
fs.writeFileSync(p, JSON.stringify(c, null, 1));
console.log(c.beats.reduce((s, b) => s + b[2] - b[1], 0).toFixed(1));
