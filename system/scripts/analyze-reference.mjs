#!/usr/bin/env node
// Fetch ONE reference video and measure it. Numbers are automatic; the
// qualitative half is written by hand afterwards, from the extracted frames.
//
// Deliberately one-at-a-time. Bulk-analysing the whole library was explicitly
// rejected — analyse a reference when it is relevant to the edit in hand.
//
//   node scripts/analyze-reference.mjs <url> [--slug NAME] [--transcribe]
//
// Writes reference-library/<slug>/
//   source.mp4  metrics.json  frames/f00..f11.jpg  [transcript.json]
import { mkdirSync, existsSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const LIB = join(ROOT, "reference-library");
const YTDLP = join(ROOT, "bin/yt-dlp.exe");
const COOKIES = "C:/Users/taldo/Downloads/cookies.txt";
const FF = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe";
const FP = FF.replace("ffmpeg.exe", "ffprobe.exe");

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith("http"));
if (!url) { console.error("usage: analyze-reference.mjs <url> [--slug NAME] [--transcribe]"); process.exit(1); }
const slugArg = args[args.indexOf("--slug") + 1];
const slug = args.includes("--slug") ? slugArg : (url.match(/\/(reel|reels|p)\/([^/?]+)/)?.[2] ?? "ref");
const dir = join(LIB, slug);
mkdirSync(join(dir, "frames"), { recursive: true });

const sh = (bin, a, opts = {}) =>
  execFileSync(bin, a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });

// ffmpeg writes filter output (metadata=print, ebur128, silencedetect) to
// STDERR, and execFileSync returns only stdout — so reading the result of any
// of those with sh() silently yields "". That bug reported 0 cuts on a video
// with 17. Anything that reads an ffmpeg MEASUREMENT must use this.
const shBoth = (bin, a) => {
  const r = spawnSync(bin, a, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return (r.stdout || "") + (r.stderr || "");
};

// ---- fetch ----------------------------------------------------------------
const src = join(dir, "source.mp4");
if (!existsSync(src)) {
  console.log(`fetching ${url}`);
  const dl = [url, "-o", join(dir, "source.%(ext)s"), "--no-warnings",
              "-f", "mp4/best", "--merge-output-format", "mp4"];
  if (existsSync(COOKIES)) dl.push("--cookies", COOKIES);
  try { sh(YTDLP, dl, { stdio: ["ignore", "pipe", "pipe"] }); }
  catch (e) { console.error("FETCH FAILED — Instagram may be rate-limiting, or cookies are stale."); process.exit(2); }
} else console.log("cached");

// ---- probe ----------------------------------------------------------------
const meta = JSON.parse(sh(FP, ["-v", "error", "-show_entries",
  "format=duration:stream=width,height,codec_type,r_frame_rate", "-of", "json", src]));
const v = meta.streams.find((s) => s.codec_type === "video");
const hasAudio = meta.streams.some((s) => s.codec_type === "audio");
const dur = +(+meta.format.duration).toFixed(2);
const [fn, fd] = (v.r_frame_rate || "0/1").split("/");
const fps = +fd ? +(+fn / +fd).toFixed(2) : null;

// ---- cut rate (scene detection) -------------------------------------------
// Threshold 0.3 matches what was used to measure NAS/Montana, so numbers are
// comparable across the library. A hard cut scores high; a whip-pan may not.
const scenes = shBoth(FF, ["-hide_banner", "-i", src, "-vf",
  "select='gt(scene,0.3)',metadata=print", "-an", "-f", "null", "-"]);
const cutTimes = [...scenes.matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1]);
const cuts = cutTimes.length;

// pacing curve: cuts per 10s bucket — shows where it speeds up and slows down
const buckets = Array(Math.max(1, Math.ceil(dur / 10))).fill(0);
for (const t of cutTimes) buckets[Math.min(buckets.length - 1, Math.floor(t / 10))]++;

// shot lengths
const bounds = [0, ...cutTimes, dur];
const shots = bounds.slice(1).map((t, i) => +(t - bounds[i]).toFixed(2));
const sorted = [...shots].sort((a, b) => a - b);
const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;

// ---- loudness --------------------------------------------------------------
let lufs = null, tp = null;
if (hasAudio) {
  try {
    const l = shBoth(FF, ["-hide_banner", "-i", src, "-af", "ebur128=framelog=quiet", "-f", "null", "-"]);
    lufs = +(l.match(/I:\s+(-?[\d.]+)\s+LUFS/)?.[1] ?? NaN) || null;
    tp = +(l.match(/Peak:\s+(-?[\d.]+)\s+dBFS/)?.[1] ?? NaN) || null;
  } catch {}
}

// ---- silence (where it breathes) -------------------------------------------
let pauses = [];
if (hasAudio) {
  try {
    const s = shBoth(FF, ["-hide_banner", "-i", src, "-af", "silencedetect=noise=-32dB:d=0.8", "-f", "null", "-"]);
    const starts = [...s.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => +m[1]);
    const ends = [...s.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => +m[1]);
    pauses = starts.map((st, i) => ({ start: st, dur: ends[i] ? +(ends[i] - st).toFixed(2) : null }))
                   .filter((p) => p.dur);
  } catch {}
}

// ---- frames: evenly spaced, plus the first 3 seconds ------------------------
// The opening matters disproportionately, so it is sampled densely.
const stamps = [0.3, 1.0, 2.0, 3.0, ...Array.from({ length: 8 }, (_, i) => +(dur * (i + 1) / 9).toFixed(2))];
stamps.forEach((t, i) => {
  if (t >= dur) return;
  try {
    sh(FF, ["-y", "-v", "error", "-ss", String(t), "-i", src, "-vf", "scale=360:-1",
            "-frames:v", "1", join(dir, "frames", `f${String(i).padStart(2, "0")}_${t}s.jpg`)]);
  } catch {}
});

const metrics = {
  slug, url, fetched: new Date().toISOString(),
  duration_s: dur, width: v.width, height: v.height, fps,
  vertical: v.height > v.width, has_audio: hasAudio,
  cuts, cuts_per_min: dur ? +(cuts / (dur / 60)).toFixed(1) : null,
  mean_shot_s: shots.length ? +(shots.reduce((a, b) => a + b, 0) / shots.length).toFixed(2) : null,
  median_shot_s: median,
  shots_under_1s_pct: shots.length ? +(100 * shots.filter((s) => s < 1).length / shots.length).toFixed(0) : null,
  pacing_curve_cuts_per_10s: buckets,
  integrated_lufs: lufs, true_peak_dbfs: tp,
  pauses_over_0_8s: pauses,
  frames: readdirSync(join(dir, "frames")),
  qualitative: "NOT YET WRITTEN — look at the frames, then fill analysis.md",
};
writeFileSync(join(dir, "metrics.json"), JSON.stringify(metrics, null, 2), "utf8");

console.log(`\n${slug}  ${dur}s  ${v.width}x${v.height}  ${fps}fps`);
console.log(`cuts ${cuts}  (${metrics.cuts_per_min}/min)  mean shot ${metrics.mean_shot_s}s  median ${median}s  <1s: ${metrics.shots_under_1s_pct}%`);
if (lufs) console.log(`loudness ${lufs} LUFS  true peak ${tp} dBFS`);
if (pauses.length) console.log(`pauses >0.8s: ${pauses.length} — ${pauses.slice(0, 5).map((p) => `${p.start}s/${p.dur}s`).join(", ")}`);
console.log(`pacing (cuts per 10s): ${buckets.join(" ")}`);
console.log(`\n-> ${dir}`);
console.log(`NOW LOOK AT THE FRAMES and write analysis.md. Numbers alone are not an analysis.`);
