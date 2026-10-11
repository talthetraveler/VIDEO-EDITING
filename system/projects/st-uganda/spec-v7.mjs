// V7 (Tal, 2026-10-11): hook starts at "you came to Israel..." (no "So you ran"); the Muslim / Christian
// exchange comes from the greeting take, where he says "You're a Christian" out loud; "No need" now follows
// the question it answers ("why do people fight because of religion?"); adds "even the religion".
import fs from "node:fs";
const p = "projects/st-uganda/edit.json";
const c = JSON.parse(fs.readFileSync(p));
const F = "local-3b0b7fa81fabadc7", B = "local-9a2267308e037d97", R = "local-c11a7f7e68b16b1d";
c.beats = [
  [F, 138.82, 143.65],                       // HOOK: you came to Israel to escape ... hunted for being gay in Uganda? Exactly.
  [F, 1.72, 3.30], [B, 13.54, 15.60], [B, 18.44, 21.90],
  [F, 24.58, 25.90], [F, 41.0, 46.15],
  [F, 60.20, 68.25], [F, 71.33, 76.0],
  [F, 83.27, 95.35], [F, 95.36, 98.45], [F, 99.90, 105.98],
  [F, 168.77, 171.30], [F, 174.28, 183.25],
  [F, 199.64, 208.45],
  [B, 32.17, 41.45],                         // you are Muslim, and are you Muslim also? You're a Christian. Wow. Partners together.
  [R, 0.26, 4.80],                           // many people are against you because you're gay? Yes, even the religion.
  [F, 229.63, 233.05], [F, 233.54, 252.50],  // what matters is love / Jerusalem: mosque, church ... why fight over religion? No need. Live in peace.
  [F, 274.12, 282.60]].map(([i, a, b]) => [i, a, b, 0.5, ""]);
delete c.music; delete c.musicVol;           // the song is mixed after the build so its level can be changed without a re-render
c.out = "ST_UGANDA_V7.mp4";
fs.writeFileSync(p, JSON.stringify(c, null, 1));
console.log(c.beats.reduce((s, b) => s + b[2] - b[1], 0).toFixed(1));
