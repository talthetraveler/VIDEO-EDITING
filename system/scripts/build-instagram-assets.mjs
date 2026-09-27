import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const instagramDir = path.join(root, "assets", "instagram");
const contactDir = path.join(instagramDir, "contact_sheets");
const frameDir = path.join(contactDir, "_frames");
const ffmpeg = path.join(root, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const ffprobe = path.join(root, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe");

fs.mkdirSync(contactDir, {recursive: true});
fs.mkdirSync(frameDir, {recursive: true});

const failures = [
  {
    url: "https://www.instagram.com/reel/C7wlyE9xopo/?stkn=eWZnMDRwOHFtNWlm",
    reason: "Instagram reported the content is not available to everyone. Authenticated Chrome-cookie retry was authorized, but Windows DPAPI prevented cookie decryption in this process.",
  },
  {
    url: "https://www.instagram.com/p/DEseAASyybj/?img_index=1&stkn=NThtOTZmMHcybGQ2#item_DEsd_zvSfcW",
    reason: "Carousel item had no downloadable video formats.",
  },
  {
    url: "https://www.instagram.com/p/DEseAASyybj/?img_index=1&stkn=NThtOTZmMHcybGQ2#item_DEsd_zqSrYM",
    reason: "Carousel item had no downloadable video formats.",
  },
];

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
};

const probe = (file) => {
  try {
    const raw = execFileSync(ffprobe, [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height,duration:format=duration",
      "-of", "json",
      file,
    ], {encoding: "utf8"});
    const data = JSON.parse(raw);
    const stream = data.streams?.[0] ?? {};
    return {
      width: stream.width ?? null,
      height: stream.height ?? null,
      duration: Number(stream.duration ?? data.format?.duration ?? 0),
    };
  } catch {
    return {width: null, height: null, duration: null};
  }
};

const clips = await Promise.all(fs.readdirSync(instagramDir)
  .filter((name) => name.toLowerCase().endsWith(".mp4"))
  .sort()
  .map(async (name) => {
    const videoPath = path.join(instagramDir, name);
    const infoPath = videoPath.replace(/\.mp4$/i, ".info.json");
    const info = readJson(infoPath);
    const id = info.id ?? path.basename(name, ".mp4").split("_").at(-1);
    const sheetPath = path.join(contactDir, `${path.basename(name, ".mp4")}.jpg`);
    const meta = probe(videoPath);

    const framePaths = [];
    const frameCount = 8;
    const duration = meta.duration || 30;
    for (let index = 0; index < frameCount; index += 1) {
      const at = Math.max(0.4, ((index + 1) / (frameCount + 1)) * duration);
      const framePath = path.join(frameDir, `${path.basename(name, ".mp4")}_${String(index + 1).padStart(2, "0")}.jpg`);
      try {
        execFileSync(ffmpeg, [
          "-hide_banner",
          "-loglevel", "error",
          "-y",
          "-ss", at.toFixed(2),
          "-i", videoPath,
          "-frames:v", "1",
          "-update", "1",
          framePath,
        ], {stdio: "pipe"});
        framePaths.push(framePath);
      } catch {
        // Keep the manifest useful even if thumbnail extraction fails for a clip.
      }
    }

    if (framePaths.length > 0) {
      const tileWidth = 180;
      const tileHeight = 320;
      const columns = 4;
      const rows = Math.ceil(framePaths.length / columns);
      const composites = await Promise.all(framePaths.map(async (framePath, index) => {
        const input = await sharp(framePath)
          .resize(tileWidth, tileHeight, {fit: "cover", position: "centre"})
          .jpeg({quality: 82})
          .toBuffer();
        return {
          input,
          left: (index % columns) * tileWidth,
          top: Math.floor(index / columns) * tileHeight,
        };
      }));
      await sharp({
        create: {
          width: columns * tileWidth,
          height: rows * tileHeight,
          channels: 3,
          background: "#111111",
        },
      }).composite(composites).jpeg({quality: 85}).toFile(sheetPath);
    }

    return {
      id,
      file: path.relative(root, videoPath).replaceAll("\\", "/"),
      info_json: fs.existsSync(infoPath) ? path.relative(root, infoPath).replaceAll("\\", "/") : null,
      contact_sheet: fs.existsSync(sheetPath) ? path.relative(root, sheetPath).replaceAll("\\", "/") : null,
      source_url: info.webpage_url ?? info.original_url ?? info.url ?? null,
      uploader: info.uploader ?? info.channel ?? "Montana Tucker",
      title: info.title ?? "",
      description: info.description ?? "",
      duration_seconds: meta.duration ? Number(meta.duration.toFixed(2)) : null,
      width: meta.width,
      height: meta.height,
      best_usable_time_range: "",
      person_or_subject: "",
      location: "",
      religion_culture_or_community: "",
      action: "",
      emotional_tone: "",
      supports_sentence: "",
      final_timeline_use: "",
      review_notes: "Needs human/visual selection against Montana A-roll transcript.",
    };
  }));

const csvHeader = [
  "id",
  "file",
  "source_url",
  "duration_seconds",
  "width",
  "height",
  "person_or_subject",
  "location",
  "religion_culture_or_community",
  "action",
  "emotional_tone",
  "best_usable_time_range",
  "supports_sentence",
  "final_timeline_use",
  "contact_sheet",
  "review_notes",
];

const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""').replaceAll(/\r?\n/g, " ")}"`;
const csv = [
  csvHeader.join(","),
  ...clips.map((clip) => csvHeader.map((field) => csvValue(clip[field])).join(",")),
].join("\n");

fs.writeFileSync(path.join(instagramDir, "source_manifest.json"), JSON.stringify({clips, failures}, null, 2));
fs.writeFileSync(path.join(instagramDir, "source_manifest.csv"), `${csv}\n`);
fs.writeFileSync(path.join(instagramDir, "failed_links.txt"), failures.map((f) => `${f.url}\n${f.reason}\n`).join("\n"));

console.log(`Wrote ${clips.length} clips to assets/instagram/source_manifest.json`);
console.log(`Wrote ${failures.length} failed/retry items to assets/instagram/failed_links.txt`);
