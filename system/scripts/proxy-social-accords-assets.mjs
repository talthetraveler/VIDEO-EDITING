import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repo = process.cwd();
const ffmpeg = path.join(repo, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const srcDir = path.join(repo, "assets", "instagram");
const projects = [
  path.join(repo, "projects", "social-accords-hyperframes"),
  path.join(repo, "projects", "social-accords-hyperframes-clean"),
];

const clips = [
  ["feed-toxic", "Montana_Tucker_DUBKswjE9N-.mp4", 8, 6.2],
  ["viral-loop", "Montana_Tucker_DTatvYeEzmy.mp4", 46, 5.8],
  ["other-side", "Montana_Tucker_C8UqBOVJxFA.mp4", 12, 11.8],
  ["viral-too", "Montana_Tucker_C-vEx9rJgwd.mp4", 8, 8.2],
  ["survivors", "Montana_Tucker_DUBKswjE9N-.mp4", 70, 7.6],
  ["world", "Montana_Tucker_DLh9NVbxS_b.mp4", 42, 10.6],
  ["stereotypes", "Montana_Tucker_DJKGD-hsCbJ.mp4", 42, 10.6],
  ["views", "Montana_Tucker_DOYzGPvEYfc.mp4", 25, 11.3],
  ["question", "Montana_Tucker_DEsdVfayw3e.mp4", 12, 11.8],
  ["helping", "Montana_Tucker_DObW_JBERrJ.mp4", 16, 10.2],
  ["listening", "Montana_Tucker_DTatvYeEzmy.mp4", 28, 15.5],
  ["creator-chain", "Montana_Tucker_C-vEx9rJgwd.mp4", 21, 13.9],
  ["storytellers", "Montana_Tucker_DJ100ADJSgU.mp4", 92, 11.8],
  ["misunderstanding", "Montana_Tucker_DTtIOJ4ErvB.mp4", 70, 10.6],
  ["movement", "Montana_Tucker_DVoeFmbE090.mp4", 18, 10.6],
  ["human-being", "Montana_Tucker_DOq1PW9idT2.mp4", 104, 10.2],
  ["phone-insert", "Montana_Tucker_C8UqBOVJxFA.mp4", 12, 10.5],
  ["closing-insert", "Montana_Tucker_C-vEx9rJgwd.mp4", 30, 4.5],
];

if (!fs.existsSync(ffmpeg)) {
  throw new Error(`Missing ffmpeg: ${ffmpeg}`);
}

for (const project of projects) {
  const outDir = path.join(project, "assets", "instagram", "proxies");
  fs.mkdirSync(outDir, { recursive: true });
  for (const [id, file, start, duration] of clips) {
    const input = path.join(srcDir, file);
    const output = path.join(outDir, `${id}.mp4`);
    if (!fs.existsSync(input)) throw new Error(`Missing source clip: ${input}`);
    const args = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(start),
      "-i",
      input,
      "-t",
      String(duration),
      "-vf",
      "scale=w=540:h=960:force_original_aspect_ratio=increase,crop=w=540:h=960",
      "-r",
      "30",
      "-g",
      "30",
      "-keyint_min",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "28",
      "-pix_fmt",
      "yuv420p",
      "-an",
      "-movflags",
      "+faststart",
      output,
    ];
    const result = spawnSync(ffmpeg, args, { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`ffmpeg failed for ${id}`);
  }
  console.log(`Proxied ${clips.length} clips into ${outDir}`);
}
