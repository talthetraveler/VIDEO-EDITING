#!/usr/bin/env node
// Build / update the single source of truth for every AI-made video.
//
// Design rules (Tal, 2026-09-20):
//  - ONE lightweight manifest. Do not rely on filenames alone — probe the file.
//  - Never guess `posted`. The ShortSync key and every review-manifest.json were
//    destroyed with projects/, so posting status is genuinely UNKNOWN for the
//    archive. `"unknown"` is a real value here and must never be written as
//    `false`, which would read as "safe to post" and risk a double-post.
//  - Non-destructive: re-running merges into the existing manifest and never
//    drops a field a human (or a later reconciliation) has filled in.
//
// Usage:
//   node scripts/video-manifest.mjs            # scan + merge + write
//   node scripts/video-manifest.mjs --report   # print a summary, write nothing
import { readdirSync, existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, basename, extname } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const HOME = join(ROOT, "Videos Edited by AI");
const OUT = join(HOME, "VIDEO-MANIFEST.json");
const FFPROBE = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffprobe.exe";

// stage is derived from WHICH FOLDER the file sits in — the folder is the
// workflow state, so moving a file between folders is how its stage changes.
const STAGES = [
  ["New Edits", "new"],
  ["Trials",    "trial"],
  ["Finals",    "final"],
  ["Posted",    "posted"],
  ["Archive/Final Variations", "archive"],
];

const probe = (p) => {
  try {
    const raw = execFileSync(FFPROBE, [
      "-v", "error", "-show_entries",
      "format=duration,size:stream=codec_type,width,height,r_frame_rate",
      "-of", "json", p,
    ], { encoding: "utf8" });
    const j = JSON.parse(raw);
    const v = (j.streams || []).find((s) => s.codec_type === "video") || {};
    const a = (j.streams || []).find((s) => s.codec_type === "audio");
    const fr = (v.r_frame_rate || "0/1").split("/");
    return {
      duration_s: +(+(j.format?.duration ?? 0)).toFixed(2),
      size_mb: +((+(j.format?.size ?? 0)) / 1048576).toFixed(1),
      width: v.width ?? null,
      height: v.height ?? null,
      fps: fr[1] && +fr[1] ? +(+fr[0] / +fr[1]).toFixed(2) : null,
      has_audio: !!a,
    };
  } catch {
    return { probe_failed: true };
  }
};

// Version out of a filename: "... V2.mp4", "..._v3.mp4", "... FINAL.mp4"
const parseVersion = (name) => {
  const m = name.match(/[ _-]v(\d+)/i);
  if (m) return `V${m[1]}`;
  if (/final/i.test(name)) return "FINAL";
  return null;
};

// Legacy archive files map back to their old project path via the manifest
// that shipped with the flatten. It is a historical record, not live paths.
const legacyMap = () => {
  const f = join(HOME, "Archive", "_legacy-manifest.txt");
  if (!existsSync(f)) return {};
  const map = {};
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const [p] = line.split("\t");
    if (!p) continue;
    const m = p.match(/output__([^\\/]+)[\\/](.+)$/);
    if (m) map[basename(m[2])] = m[1];
  }
  return map;
};

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { videos: [] };
const prevBy = Object.fromEntries((prev.videos || []).map((v) => [v.path, v]));
const legacy = legacyMap();

const videos = [];
for (const [rel, stage] of STAGES) {
  const dir = join(HOME, rel);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    if (!/\.(mp4|mov|m4v)$/i.test(name)) continue;
    const abs = join(dir, name);
    const relPath = `${rel}/${name}`;
    const old = prevBy[relPath] || {};
    const p = old.probe_failed === undefined && old.duration_s ? old : probe(abs);

    videos.push({
      // identity
      path: relPath,
      filename: name,
      title: old.title ?? basename(name, extname(name)),
      project: old.project ?? legacy[name] ?? null,
      version: old.version ?? parseVersion(name),
      // workflow state — folder is the authority for `stage`
      stage,
      format: old.format ?? null,          // set when a format preset is applied
      approved: old.approved ?? (stage === "final" || stage === "posted" ? true : false),
      // posting — NEVER guessed. "unknown" is distinct from false.
      posted: old.posted ?? (stage === "posted" ? true : "unknown"),
      platforms: old.platforms ?? [],
      posted_date: old.posted_date ?? null,
      shortsync_id: old.shortsync_id ?? null,
      instagram_url: old.instagram_url ?? null,
      // provenance
      references_used: old.references_used ?? [],
      // two tiers, deliberately different: "approved for posting" is not the
      // same as "this defines my style". Only the latter is a golden reference.
      golden_reference: old.golden_reference ?? false,
      // THE BENCHMARK — meaningful corrections before approval. The trend
      // across videos is how we know the learning loop actually works.
      review_rounds: old.review_rounds ?? null,
      corrections_to_approval: old.corrections_to_approval ?? null,
      corrections: old.corrections ?? [],
      notes: old.notes ?? null,
      mtime: statSync(abs).mtime.toISOString(),
      ...p,
    });
  }
}

videos.sort((a, b) => a.path.localeCompare(b.path));

const manifest = {
  generated: new Date().toISOString(),
  schema: 1,
  counts: videos.reduce((acc, v) => ((acc[v.stage] = (acc[v.stage] || 0) + 1), acc), {}),
  posting_status_note:
    "posted:'unknown' means the record was lost with projects/ — NOT that it is unposted. " +
    "Do not post anything marked 'unknown' until reconciled against ShortSync's own history.",
  videos,
};

if (process.argv.includes("--report")) {
  console.log(JSON.stringify(manifest.counts, null, 1));
  const unknown = videos.filter((v) => v.posted === "unknown").length;
  console.log(`posted=unknown: ${unknown}`);
  console.log(`golden references: ${videos.filter((v) => v.golden_reference).length}`);
} else {
  writeFileSync(OUT, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`wrote ${OUT}`);
  console.log(JSON.stringify(manifest.counts, null, 1));
  console.log(`posted=unknown: ${videos.filter((v) => v.posted === "unknown").length}`);
}
