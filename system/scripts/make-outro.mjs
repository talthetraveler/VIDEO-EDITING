#!/usr/bin/env node
// THE SOCIAL ACCORDS OUTRO as a ready-to-join MP4 (src/effects/LogoOutro.tsx).
//
//   node scripts/make-outro.mjs [--force]      -> prints the path of the outro file
//
// Rendered once and reused: the file is keyed by the logo PNG and the component
// source, so it is only rendered again when either changes. 1080x1920, 30 fps,
// limited-range yuv420p, with a SILENT stereo AAC track so it concatenates onto
// any video. stamp-logo.py calls this and appends the result (section 11).
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const LOGO = join(ROOT, "../assets/brand/social-accords-logo.png");
const SRC = join(ROOT, "src/effects/LogoOutro.tsx");
if (!existsSync(LOGO)) { console.error(`no logo at ${LOGO}`); process.exit(1); }

const key = createHash("sha1").update(readFileSync(LOGO)).update(readFileSync(SRC)).digest("hex").slice(0, 10);
const DIR = join(ROOT, "projects/_brand");
const out = join(DIR, `outro-${key}.mp4`);
if (existsSync(out) && statSync(out).size > 0 && !process.argv.includes("--force")) { console.log(out); process.exit(0); }

mkdirSync(DIR, { recursive: true });
const work = join(tmpdir(), "tal-outro", String(Date.now()));
mkdirSync(join(work, "public/brand"), { recursive: true });
try {
  copyFileSync(LOGO, join(work, "public/brand/social-accords-logo.png"));
  const silent = join(work, "picture.mp4");
  const r = spawnSync(process.execPath, [join(ROOT, "node_modules/@remotion/cli/remotion-cli.js"), "render", "src/effects/index.ts", "LogoOutro",
    silent, `--public-dir=${join(work, "public")}`, "--codec=h264", "--crf=16", "--pixel-format=yuv420p", "--color-space=bt709", "--muted"],
    { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] });
  if (r.status !== 0) throw new Error(`outro render failed (exit ${r.status})`);
  // a silent track the same length, so the outro joins a video with sound without a gap in the audio stream
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", silent, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", "-color_range", "tv", "-movflags", "+faststart", out]);
  // keep only the current outro
  for (const f of readdirSync(DIR)) if (/^outro-[0-9a-f]+\.mp4$/.test(f) && join(DIR, f) !== out) rmSync(join(DIR, f));
} finally {
  rmSync(work, { recursive: true, force: true });
}
console.log(out);
