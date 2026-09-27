import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: node scripts/make-contact-sheet.mjs <input-video> <output-jpg>");
  process.exit(1);
}

const root = process.cwd();
const ffmpeg = path.join(root, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const ffprobe = path.join(root, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "contact-sheet-"));

const raw = execFileSync(ffprobe, [
  "-v", "error",
  "-show_entries", "format=duration",
  "-of", "json",
  input,
], {encoding: "utf8"});
const duration = Number(JSON.parse(raw).format?.duration ?? 30);

const frames = [];
const count = 12;
for (let index = 0; index < count; index += 1) {
  const at = Math.max(0.3, ((index + 1) / (count + 1)) * duration);
  const frame = path.join(tempDir, `${String(index + 1).padStart(2, "0")}.jpg`);
  execFileSync(ffmpeg, [
    "-hide_banner",
    "-loglevel", "error",
    "-y",
    "-ss", at.toFixed(2),
    "-i", input,
    "-frames:v", "1",
    "-update", "1",
    frame,
  ], {stdio: "pipe"});
  frames.push(frame);
}

const tileWidth = 180;
const tileHeight = 320;
const columns = 4;
const rows = Math.ceil(frames.length / columns);
const composites = await Promise.all(frames.map(async (frame, index) => ({
  input: await sharp(frame).resize(tileWidth, tileHeight, {fit: "cover", position: "centre"}).jpeg({quality: 84}).toBuffer(),
  left: (index % columns) * tileWidth,
  top: Math.floor(index / columns) * tileHeight,
})));

fs.mkdirSync(path.dirname(output), {recursive: true});
await sharp({
  create: {
    width: columns * tileWidth,
    height: rows * tileHeight,
    channels: 3,
    background: "#111111",
  },
}).composite(composites).jpeg({quality: 86}).toFile(output);

console.log(output);
