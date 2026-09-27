#!/usr/bin/env node
// STUDY A REFERENCE VIDEO PROPERLY — one command, every time Tal sends one.
//
// I cannot PLAY video. "Watching" here means three concrete things, all of
// which must happen before claiming a reference has been studied:
//   1. MEASURE  — duration, resolution, cut count at the correct threshold
//   2. LOOK     — a contact sheet of real frames, inspected as images
//   3. LISTEN   — a Groq transcript with timings
// Saying "I studied this" after doing only (1) is the kind of overclaim
// CLAUDE.md §1 forbids. This makes all three cheap enough that there is no
// excuse for skipping any.
//
//   node scripts/study-reference.mjs <file.mp4> [more.mp4 ...]
//
// Writes to projects/_refs/study/<slug>/ : sheet.jpg, transcript.txt, stats.json
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import { groqTranscribe, GROQ_TURBO } from "./lib/stt.mjs";

const FFDIR = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin";
const FF = join(FFDIR, "ffmpeg.exe"), FP = join(FFDIR, "ffprobe.exe");
const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const STUDY = join(ROOT, "projects/_refs/study");

// ffmpeg writes filter MEASUREMENTS to stderr and execFileSync returns only
// stdout — reading one stream once reported 0 cuts on a video with 17.
const both = (bin, args) => {
  // execFileSync returns ONLY stdout on success, and ffmpeg writes filter
  // MEASUREMENTS to stderr — so the success path silently lost every scene
  // score and reported 0 cuts on videos with 25. spawnSync exposes both.
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return (r.stdout || "") + (r.stderr || "");
};

for (const file of process.argv.slice(2)) {
  if (!existsSync(file)) { console.log(`!! missing: ${file}`); continue; }
  const slug = basename(file).replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 44).replace(/^-|-$/g, "").toLowerCase();
  const dir = join(STUDY, slug);
  mkdirSync(dir, { recursive: true });

  // ---- 1. MEASURE
  const dur = parseFloat(execFileSync(FP, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).trim());
  const wh = execFileSync(FP, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file], { encoding: "utf8" }).trim();
  // 0.20, NOT 0.30 — 0.30 misses cuts between similar-looking shots and once
  // made this repo record "his biggest reel has ZERO cuts" when it has 4.
  const cuts = (both(FF, ["-hide_banner", "-i", file, "-vf", "select='gt(scene,0.20)',metadata=print", "-an", "-f", "null", "-"]).match(/lavfi\.scene_score/g) ?? []).length;
  const perMin = +(cuts / (dur / 60)).toFixed(1);
  const band = perMin > 20 ? "FAST (many people — the cut IS the structure)"
    : perMin >= 8 ? "MID (a conversation that breathes)"
    : "SLOW (one subject — hold the shot)";

  // ---- 2. LOOK
  const n = Math.min(8, Math.max(4, Math.round(dur / 6)));
  const shots = Array.from({ length: n }, (_, i) => (dur * (i + 0.5)) / n);
  shots.forEach((t, i) => execFileSync(FF, ["-v", "error", "-ss", t.toFixed(2), "-i", file, "-frames:v", "1",
    "-vf", "scale=190:-1", join(dir, `f${i}.jpg`), "-y"], { stdio: "pipe" }));
  const ins = [];
  shots.forEach((_, i) => ins.push("-i", join(dir, `f${i}.jpg`)));
  execFileSync(FF, ["-v", "error", ...ins, "-filter_complex",
    `${shots.map((_, i) => `[${i}]`).join("")}hstack=inputs=${shots.length}`, join(dir, "sheet.jpg"), "-y"], { stdio: "pipe" });

  // ---- 3. LISTEN
  const flac = join(dir, "audio.flac");
  execFileSync(FF, ["-v", "error", "-y", "-i", file, "-vn", "-ar", "16000", "-ac", "1", "-c:a", "flac", flac], { stdio: "pipe" });
  let lines = [];
  try {
    const r = await groqTranscribe(flac, { model: GROQ_TURBO });
    lines = r.segments.map((s) => `${s.start.toFixed(1).padStart(6)}  ${s.text}`);
  } catch (e) { lines = [`(transcription failed: ${e.message.slice(0, 60)})`]; }
  writeFileSync(join(dir, "transcript.txt"), lines.join("\n"), "utf8");

  const stats = { file: basename(file), dur: +dur.toFixed(1), resolution: wh, cuts_at_0_20: cuts, cuts_per_min: perMin, avg_shot_s: +(dur / (cuts + 1)).toFixed(2), band };
  writeFileSync(join(dir, "stats.json"), JSON.stringify(stats, null, 2), "utf8");

  console.log(`\n=== ${basename(file).slice(0, 60)}`);
  console.log(`    ${stats.dur}s  ${wh}  ${cuts} cuts  ${perMin}/min  avg ${stats.avg_shot_s}s  -> ${band}`);
  console.log(`    sheet: ${join(dir, "sheet.jpg")}   <-- LOOK AT THIS`);
  console.log(`    ${lines.length} transcript lines -> ${join(dir, "transcript.txt")}`);
}
console.log(`\nA reference is only "studied" once the contact sheet has been LOOKED AT.`);
