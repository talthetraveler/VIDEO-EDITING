#!/usr/bin/env node
// BATCH-FINALIZE — re-render every delivered video of a batch at full size.
//
//   node scripts/batch-finalize.mjs <slug> "<VIDEOS OUT folder>" [--only a,b] [--lane i/n]
//
// Review renders are 540x960 (--preview). Posting needs 1080x1920. For every
// file in projects/<slug>/manifest.jsonl (last entry per file) this:
//   1. re-renders its edit (projects/<edit-slug>/edit.json) WITHOUT --preview,
//      with whatever build-edit.mjs is now - so fixes made during the night
//      reach every video;
//   2. re-runs the gate: verify-cut + selfreview (rendered captions, flags),
//      because a builder fix can change captions - the review of the preview
//      does not carry over;
//   3. checks the file really is 1080x1920;
//   4. moves the preview into <folder>/previews/ (never deleted) and puts the
//      full-size file under the same name.
// Results append to projects/<slug>/finalize.jsonl; the review page reads the
// resolution from there.
import { readFileSync, existsSync, mkdirSync, renameSync, copyFileSync, appendFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join, basename } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const args = process.argv.slice(2);
const [slug, outDir] = args;
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const lane = args.includes("--lane") ? args[args.indexOf("--lane") + 1].split("/").map(Number) : null;
if (!slug || !outDir) { console.error('usage: node scripts/batch-finalize.mjs <slug> "<VIDEOS OUT folder>" [--only a,b] [--lane i/n]'); process.exit(2); }

const mf = join(ROOT, "projects", slug, "manifest.jsonl");
const byFile = new Map();
for (const l of readFileSync(mf, "utf8").split("\n").filter(Boolean)) {
  try { const r = JSON.parse(l); if (r.file && r.slug) byFile.set(basename(r.file), r); } catch {}
}
let jobs = [...byFile.values()].filter((r) => !only || only.includes(r.slug));
if (lane) jobs = jobs.filter((_, k) => k % lane[1] === lane[0]);
const log = join(ROOT, "projects", slug, "finalize.jsonl");
mkdirSync(join(outDir, "previews"), { recursive: true });

const run = (cmd, a) => { const r = spawnSync(cmd, a, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); return (r.stdout || "") + (r.stderr || ""); };

for (const r of jobs) {
  const editP = join(ROOT, "projects", r.slug, "edit.json");
  if (!existsSync(editP)) { console.log(`!! ${r.slug}: no edit.json`); continue; }
  const edit = JSON.parse(readFileSync(editP, "utf8"));
  const t0 = Date.now();
  console.log(`\n=== ${r.file}  (${r.slug})`);
  const vc = run("node", ["scripts/verify-cut.mjs", editP]);
  const cutClean = /No boundary problems/.test(vc);
  const b = run("node", ["scripts/build-edit.mjs", r.slug]);
  const rendered = join(ROOT, "projects", r.slug, edit.out ?? `${r.slug.toUpperCase()}_V1.mp4`);
  if (!existsSync(rendered) || !/TOTAL/.test(b)) {
    console.log(`!! build failed:\n${b.split("\n").slice(-6).join("\n")}`);
    appendFileSync(log, JSON.stringify({ file: r.file, slug: r.slug, ok: false, error: "build failed" }) + "\n");
    continue;
  }
  let wh = "";
  try { wh = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", rendered], { encoding: "utf8" }).trim(); } catch {}
  const dur = +(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", rendered], { encoding: "utf8" }).trim());
  const sr = run("node", ["scripts/selfreview.mjs", editP, rendered]);
  const caps = +(sr.match(/(\d+) rendered captions, (\d+) flagged/) || [])[1] || 0;
  const flagged = +(sr.match(/(\d+) rendered captions, (\d+) flagged/) || [])[2] || 0;
  const flaggedLines = sr.split("\n").filter((l) => /<-- CHECK/.test(l) && /^\s+\d/.test(l)).map((l) => l.trim());
  const issues = +(sr.match(/(\d+) issue\(s\)/) || [])[1] || 0;
  const cov = run("node", ["scripts/caption-coverage.mjs", r.slug]);
  const covLine = (cov.match(/(\d+)\/(\d+) spoken words on screen/) || []);
  const covered = covLine[1] ? `${covLine[1]}/${covLine[2]}` : "n/a";
  // numbers, not the string: iPhone "Ambient viewing environment" side data makes
  // ffprobe print "1080,1920," - the exact match called real finals not-full (7da30c9)
  const [w0, h0] = wh.split(",").map(Number);
  const full = w0 === 1080 && h0 === 1920;
  const dest = join(outDir, r.file);
  if (full) {
    if (existsSync(dest)) renameSync(dest, join(outDir, "previews", r.file));
    copyFileSync(rendered, dest);
  }
  const rec = { file: r.file, slug: r.slug, ok: full, resolution: wh, duration: +dur.toFixed(1), cut_clean: cutClean,
    boundary_issues: issues, captions: caps, flagged, flagged_lines: flaggedLines, words_on_screen: covered, secs: Math.round((Date.now() - t0) / 1000) };
  appendFileSync(log, JSON.stringify(rec) + "\n");
  console.log(`  ${full ? "OK" : "NOT FULL SIZE"} ${wh} ${rec.duration}s  cut ${cutClean ? "clean" : "ISSUES"}  captions ${caps} (${flagged} flagged)  words ${covered}  ${rec.secs}s`);
}
console.log("\nfinalize done");
