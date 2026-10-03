#!/usr/bin/env node
// Numbered review copies for the 2026-10-03 batch. Tal: "show me just here in
// the chat, with a number over it so I can review and tell you what to fix."
// The number is a REVIEW artifact: it is burned into a copy under review/ and
// never into the project's own render or a final.
//
//   node system/projects/_batch-2026-10-03/make-review.mjs [n n n]   (no args = all)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const P = join(HERE, "..");
const OUT = join(HERE, "review");
const FF = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe";
const LIST = JSON.parse(readFileSync(join(HERE, "review-list.json"), "utf8"));
const only = process.argv.slice(2).map(Number);
mkdirSync(OUT, { recursive: true });

for (const [n, title, rel] of LIST) {
  if (only.length && !only.includes(n)) continue;
  const src = join(P, rel);
  if (!existsSync(src)) { console.log(`#${n} MISSING ${rel}`); continue; }
  const dst = join(OUT, `${String(n).padStart(2, "0")} - ${title}.mp4`);
  const vf = `drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='${n}':fontsize=h*0.075:fontcolor=white:` +
    `box=1:boxcolor=black@0.75:boxborderw=14:x=w*0.05:y=h*0.045`;
  const r = spawnSync(FF, ["-v", "error", "-y", "-i", src, "-vf", vf, "-c:v", "libx264", "-preset", "veryfast",
    "-crf", "25", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", dst], { encoding: "utf8" });
  console.log(r.status ? `#${n} FAILED ${r.stderr.slice(0, 200)}` : `#${n} ok  ${dst}`);
}
