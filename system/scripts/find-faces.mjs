#!/usr/bin/env node
// WHERE IN THIS CLIP IS THERE ACTUALLY A FACE?
//
//   node scripts/find-faces.mjs <clipId> [--step 1.5] [--win 3] [--min 0.5]
//
// check-beats.mjs answers "is the speaker on screen for THIS beat" and --fix
// looks a few seconds either side. On the POV glasses shoots that is not
// enough: Tal is walking, the camera points at the pavement, a bicycle, a
// stranger's backpack, tree branches — for tens of seconds at a time. On
// shana-tova, 4 of 8 beats came back "nothing nearby holds a face", because
// nothing within 12s of them does.
//
// So this scans the WHOLE clip and reports every window that holds a face,
// merged into runs. That turns "this beat is broken" into "here are the three
// places in this clip where a human is actually visible" — which is what
// choosing a replacement shot needs.
//
// It reports PICTURE only. Whether a run is usable for a given line is an
// editorial call: a face run that is 40s from the dialogue is a cutaway, not
// a sync shot, and using it means taking the audio with push.audio.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { locate } from "./lib/framing.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const C = join(ROOT, "projects/_frameio/cache");
const LOCAL = existsSync(join(C, "local-sources.json"))
  ? JSON.parse(readFileSync(join(C, "local-sources.json"), "utf8")) : {};

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i + 1] : d; };
const id = process.argv[2];
if (!id) { console.error("usage: node scripts/find-faces.mjs <clipId> [--step N] [--win N]"); process.exit(1); }

const STEP = arg("--step", 1.5), WIN = arg("--win", 3), MIN = arg("--min", 0.5);

function src(cid) {
  if (LOCAL[cid]?.path && existsSync(LOCAL[cid].path)) return LOCAL[cid].path;
  for (const p of [join(C, "hq", `${cid}.mp4`), join(C, "proxies", `${cid}.mp4`)])
    if (existsSync(p)) return p;
  return null;
}
const path = src(id);
if (!path) { console.error(`no source for ${id}`); process.exit(2); }

const dur = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
  "-of", "csv=p=0", path], { encoding: "utf8" }).trim();

const hits = [];
for (let t = 0; t + WIN <= dur; t += STEP) {
  const b = locate(path, t, t + WIN, 0, 3);
  const conf = b?.found ? b.found / (b.of || 1) : 0;
  const ok = b?.found && (b.by === "face" || b.by === "profile") && conf >= MIN;
  if (ok) hits.push({ t, conf, by: b.by, h: b.h });
}

// merge adjacent hits into runs
const runs = [];
for (const h of hits) {
  const last = runs[runs.length - 1];
  if (last && h.t - last.end <= STEP * 1.5) { last.end = h.t + WIN; last.n++; last.conf = Math.max(last.conf, h.conf); }
  else runs.push({ start: h.t, end: h.t + WIN, n: 1, conf: h.conf, by: h.by });
}

console.log(`\n${id.slice(0, 8)}  ${dur.toFixed(1)}s  —  ${runs.length} run(s) with a face\n`);
for (const r of runs.sort((a, b) => (b.end - b.start) - (a.end - a.start)))
  console.log(`  ${r.start.toFixed(1)} - ${r.end.toFixed(1)}  (${(r.end - r.start).toFixed(1)}s)  ${r.by} up to ${(r.conf * 100).toFixed(0)}%`);
if (!runs.length) console.log("  none — this clip never shows a face. It is B-roll, not a shot of a person.");
