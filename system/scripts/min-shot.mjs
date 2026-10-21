#!/usr/bin/env node
// NEVER A FLASH: every shot in a RENDERED file lasts at least 1.2 s.
//
//   node scripts/min-shot.mjs <render.mp4> [--min 1.2] [--scene 0.3]
//
// Tal's master prompt, section 11 (October 2026): "No flash frames or
// micro-shots anywhere: every shot, B-roll or archive segment is at least
// 1.2 s. Check every render for segments under 1.2 s before delivering,
// including jump-cut remnants inside the source clips."
//
// The plan cannot answer this — a jump cut baked into a source clip is
// invisible to the edit spec — so it reads the picture: ffmpeg scene scores,
// cut where the score passes --scene, shots measured between cuts.
// A fast whip pan or a flash of light can score as a cut, so a hit is "look
// at this", not proof; a clean pass means no hard cut sits closer than --min.
// Exit 0 = every shot >= min, 1 = short shots listed (LOOK at them).
import { spawnSync } from "node:child_process";

const file = process.argv[2];
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i + 1] : d; };
if (!file) { console.error("usage: node scripts/min-shot.mjs <render.mp4> [--min 1.2] [--scene 0.3]"); process.exit(2); }
const MIN = arg("--min", 1.2), SCENE = arg("--scene", 0.3);

// showinfo writes to stderr; read both streams (an earlier check read stdout only and reported 0 cuts on a video with 17)
const r = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-an", "-vf", `select='gt(scene,${SCENE})',showinfo`, "-f", "null", "-"],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const log = (r.stdout || "") + (r.stderr || "");
const dur = (() => { const m = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(log); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null; })();
const cuts = [...log.matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1]);
if (dur == null) { console.error(`could not read ${file}`); process.exit(2); }

const bounds = [0, ...cuts, dur];
const short = [];
for (let i = 0; i < bounds.length - 1; i++) {
  const len = bounds[i + 1] - bounds[i];
  if (len < MIN) short.push({ from: bounds[i], to: bounds[i + 1], len });
}
console.log(`${file}\n  ${cuts.length} cut(s), ${bounds.length - 1} shot(s), ${dur.toFixed(2)}s`);
if (!short.length) { console.log(`  every shot >= ${MIN}s`); process.exit(0); }
for (const s of short)
  console.log(`  SHORT  ${s.from.toFixed(2)}-${s.to.toFixed(2)}s  ${s.len.toFixed(2)}s  (look at it: a micro-shot, or a whip pan scored as a cut)`);
process.exit(1);
