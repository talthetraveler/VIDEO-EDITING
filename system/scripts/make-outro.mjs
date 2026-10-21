#!/usr/bin/env node
// TAL'S OUTRO, ready to join onto a video.
//
//   node scripts/make-outro.mjs [--force]   -> prints the path of the joinable outro, or nothing (exit 3) if none
//
// Section 11: "after he says bye, every video ends on his animated Social Accords logo outro." The outro is HIS
// file. Tal, 2026-10-21, on one designed here from the logo: "forget that, I'll give you the outro file." So
// there is no built-in outro: drop his file at assets/brand/ as social-accords-outro.<mp4|mov|webm> and it is
// used from then on. Until it is there, no outro is added anywhere (stamp-logo.py says so).
//
// His file is not touched. A copy is conformed once to the house format (1080x1920 fitted on black, 30 fps CFR,
// limited-range yuv420p, stereo AAC 48 kHz - a silent track if it has none) so it joins any cut, and reused,
// keyed by the file's bytes, until he replaces it.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const BRAND = join(ROOT, "../assets/brand");
const src = ["mp4", "mov", "webm", "MP4", "MOV"].map((e) => join(BRAND, `social-accords-outro.${e}`)).find(existsSync);
if (!src) process.exit(3);

const key = createHash("sha1").update(readFileSync(src)).digest("hex").slice(0, 10);
const DIR = join(ROOT, "projects/_brand");
const out = join(DIR, `outro-${key}.mp4`);
if (existsSync(out) && statSync(out).size > 0 && !process.argv.includes("--force")) { console.log(out); process.exit(0); }

mkdirSync(DIR, { recursive: true });
const hasAudio = execFileSync("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", src],
  { encoding: "utf8" }).trim() !== "";
const hdr = /arib-std-b67|smpte2084/.test(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries",
  "stream=color_transfer", "-of", "csv=p=0", src], { encoding: "utf8" }));
// HDR phone export -> SDR as neutrally as possible (section 11). FIT, not crop: an outro is a graphic, and cropping
// a landscape file to 9:16 would cut its logo; it sits whole on black instead. Range + colour fields are tagged in
// the graph (ffmpeg 9 writes the range only with all four set - stamp-logo.py, 2026-10-21).
const tone = hdr ? "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv," : "";
const vf = `${tone}scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos:out_range=tv,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,` +
  "fps=30,setsar=1,format=yuv420p,setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=bt709";
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src,
  ...(hasAudio ? [] : ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]),
  "-map", "0:v:0", "-map", hasAudio ? "0:a:0" : "1:a", ...(hasAudio ? [] : ["-shortest"]),
  "-vf", vf, "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-color_range", "tv",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", out]);
for (const f of readdirSync(DIR)) if (/^outro-[0-9a-f]+\.mp4$/.test(f) && join(DIR, f) !== out) rmSync(join(DIR, f));
console.log(out);
