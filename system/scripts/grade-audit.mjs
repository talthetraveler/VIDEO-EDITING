#!/usr/bin/env node
// GRADE AUDIT — measure the look of every beat of every delivered video.
//
//   node scripts/grade-audit.mjs <batch-slug> "<VIDEOS OUT folder>" > audit.json
//
// Tal, 2026-09-29: "sometimes the color grading is not perfect". This finds
// WHICH ones instead of guessing: one frame from the middle of each beat of
// each delivered MP4, ffmpeg signalstats -> YAVG (brightness), YLOW/YHIGH
// (10th/90th percentile luma), SATAVG, UAVG/VAVG (colour cast; 128 = neutral).
// Flags: dark (YAVG<60), bright (YAVG>175), crushed/lifted blacks, blown
// highlights, over/under saturation, a cast, and a jump in brightness between
// consecutive beats (>35) - the thing an eye catches as "not graded".
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const [slug, outDir] = process.argv.slice(2);
const man = new Map();
for (const l of readFileSync(join(ROOT, "projects", slug, "manifest.jsonl"), "utf8").split(/\r?\n/).filter(Boolean)) {
  try { const r = JSON.parse(l); man.set(r.file, r); } catch {}
}
const stat = (file, t) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-ss", t.toFixed(2), "-i", file, "-frames:v", "1",
    "-vf", "scale=270:-2,signalstats,metadata=print", "-f", "null", "-"], { encoding: "utf8" });
  const o = (r.stdout || "") + (r.stderr || "");
  const g = (k) => +(o.match(new RegExp(`lavfi\\.signalstats\\.${k}=([\\d.]+)`)) || [])[1];
  return { yavg: g("YAVG"), ylow: g("YLOW"), yhigh: g("YHIGH"), sat: g("SATAVG"), u: g("UAVG"), v: g("VAVG") };
};
const out = [];
for (const r of man.values()) {
  const file = join(outDir, r.file);
  const ep = join(ROOT, "projects", r.slug, "edit.json");
  if (!existsSync(file) || !existsSync(ep)) continue;
  const edit = JSON.parse(readFileSync(ep, "utf8"));
  let acc = 0; const beats = [];
  for (const b of edit.beats) {
    if (!b || b[0] === "CARD") continue;
    const len = b[2] - b[1];
    const s = stat(file, acc + len / 2);
    const flags = [];
    if (s.yavg < 60) flags.push("dark");
    if (s.yavg > 175) flags.push("bright");
    if (s.ylow > 45) flags.push("lifted-blacks");
    if (s.yhigh < 150 && s.yavg > 60) flags.push("dull-highlights");
    if (s.yhigh > 250 && s.yavg > 150) flags.push("blown");
    if (s.sat > 70) flags.push("oversaturated");
    if (s.sat < 12) flags.push("washed-out");
    if (Math.abs(s.u - 128) > 12 || Math.abs(s.v - 128) > 14) flags.push(`cast(u${Math.round(s.u - 128)},v${Math.round(s.v - 128)})`);
    beats.push({ n: beats.length + 1, id: b[0], t: +(acc + len / 2).toFixed(1), ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Math.round(v)])), flags });
    acc += len;
  }
  for (let i = 1; i < beats.length; i++) {
    if (beats[i].id === beats[i - 1].id && Math.abs(beats[i].yavg - beats[i - 1].yavg) > 35) beats[i].flags.push(`jump(${beats[i - 1].yavg}->${beats[i].yavg})`);
  }
  out.push({ file: r.file, slug: r.slug, beats });
  const bad = beats.filter((b) => b.flags.length);
  process.stderr.write(`${bad.length ? "!!" : "ok"} ${r.slug}: ${beats.length} beats${bad.length ? " | " + bad.map((b) => `b${b.n} ${b.flags.join(",")} (Y${b.yavg} S${b.sat})`).join(" ; ") : ""}\n`);
}
console.log(JSON.stringify(out, null, 1));
