#!/usr/bin/env node
// FETCH-HQ — pull FULL-QUALITY source for the seconds an edit actually uses.
//
//   node scripts/fetch-hq.mjs <slug>
//
// WHY THIS EXISTS
//   Previews are cut from 360p proxies. A final delivery cut from a 360p proxy
//   and upscaled to 1080x1920 is not "good quality", it is a blurry proxy in a
//   big box. The originals here are 4K (3840x2160) — but the 11 clips Jamaica
//   uses are ~3 GB, and most of every clip is unused.
//
// HOW IT WORKS (verified live 2026-09-21)
//   Frame.io's media_links.original is an S3 presigned URL that honours HTTP
//   Range (a range GET returned 206). ffmpeg can therefore seek INTO the
//   original over the network and pull only the span each clip needs —
//   3 seconds of a 91 MB 4K file came down in 4.9 s.
//
//   For each clip used by the edit we extract ONE span covering all of its
//   beats, plus padding, and record the span's start as an OFFSET. The builder
//   subtracts that offset so every existing in/out timestamp keeps working.
//
// SEEK ACCURACY: `-ss` before `-i` is a fast keyframe seek and lands early by
// up to a GOP. The two-stage seek below (coarse before -i, fine after) starts
// the output at exactly the requested time, which is what the offset math
// assumes. Getting this wrong shifts every caption in the final cut.
//
// READ-ONLY: this only ever GETs. Nothing on Frame.io is modified.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { makeClient } from "./lib/frameio-deliver.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const FFDIR = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin";
const FF = join(FFDIR, "ffmpeg.exe");
const HQ = join(ROOT, "projects/_frameio/cache/hq");
const INDEX = join(ROOT, "projects/_frameio/cache/discover-index.json");
const ACCOUNT = "81f57ddf-de4c-40fb-bd14-afef691a48b2";

const PAD = 2.0;          // seconds of head/tail room so autotrim still has air
const COARSE = 6.0;       // how far before the span the fast seek lands
// WAS 1080, with the comment "4K is overkill for a 1080x1920 delivery".
// That is only true if the whole frame is delivered. It is not: the builder
// now aims the crop at the subject's face and punches in 2.2x-2.6x, so the
// pixels that reach the screen are a small window of the source. At MAXH=1080
// a 2.6x crop of coffee-kindness is 234x416 REAL pixels blown up to 1080x1920
// — a 4.6x upscale, which is the mush Tal was looking at. Downscaling the
// original on fetch threw the detail away before the crop could use it.
// 2160 is the native height of these originals; nothing is being invented.
const MAXH = 2160;

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const FORCE = args.includes("--force");
if (!slug) { console.error("usage: node scripts/fetch-hq.mjs <slug> [--force]"); process.exit(2); }

const projDir = join(ROOT, "projects", slug);
const editPath = existsSync(join(projDir, "edit.json")) ? join(projDir, "edit.json") : join(projDir, "EDIT.json");
if (!existsSync(editPath)) { console.error(`No edit at ${editPath}`); process.exit(2); }
const edit = JSON.parse(readFileSync(editPath, "utf8"));

// The edit may name clips by short tag ("0310") or by uuid. Resolve either.
const index = JSON.parse(readFileSync(INDEX, "utf8")).files;
const resolveId = (tag) => {
  if (index.some((f) => f.id === tag)) return tag;
  // A 4-digit camera tag ("0323") is a FILENAME, not an id prefix. Checking id
  // prefixes first matched file id 0323b3e3… — which is clip _0312_ — and
  // fetched the wrong footage under the right label. Name wins for short tags.
  const byName = index.find((f) => new RegExp(`[_-]${tag}[_.-]`, "i").test(f.name));
  if (byName) return byName.id;
  const byPrefix = tag.length >= 8 ? index.find((f) => f.id.startsWith(tag)) : null;
  return byPrefix?.id ?? null;
};

// group every beat by source clip -> one span per clip
const spans = new Map();
for (const b of edit.beats) {
  const [tag, ss, to] = b;
  if (tag === "CARD") continue;
  const id = resolveId(String(tag));
  if (!id) { console.error(`  ! cannot resolve clip tag "${tag}" — skipping`); continue; }
  const cur = spans.get(id) ?? { tag, from: Infinity, to: -Infinity };
  cur.from = Math.min(cur.from, ss);
  cur.to = Math.max(cur.to, to);
  spans.set(id, cur);
}

mkdirSync(HQ, { recursive: true });
const manifestPath = join(HQ, `${slug}.json`);
const manifest = existsSync(manifestPath) && !FORCE ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};

const client = makeClient();
const one = (r) => r?.response?.data ?? r?.data ?? r;
const mb = (b) => (b / 1048576).toFixed(1);

console.log(`\nFETCH-HQ  ${slug}  —  ${spans.size} clip(s), full-quality spans only\n`);

let totalBytes = 0;
for (const [id, sp] of spans) {
  const out = join(HQ, `${id}.mp4`);
  const from = Math.max(0, sp.from - PAD);
  const len = (sp.to + PAD) - from;

  if (!FORCE && manifest[id] && existsSync(out)
      && manifest[id].offset <= sp.from && manifest[id].offset + manifest[id].length >= sp.to) {
    console.log(`  = ${sp.tag}  cached (${mb(statSync(out).size)} MB)`);
    continue;
  }

  const meta = one(await client.files.show(ACCOUNT, id, { include: "media_links.original" }));
  const url = meta?.media_links?.original?.download_url ?? meta?.media_links?.original?.url;
  if (!url) { console.error(`  ! no original link for ${sp.tag} (${id})`); continue; }

  const coarse = Math.max(0, from - COARSE);
  const fine = from - coarse;
  const t0 = Date.now();
  const r = spawnSync(FF, [
    "-y", "-v", "error",
    "-ss", coarse.toFixed(3),          // fast, keyframe-snapped, over HTTP Range
    "-i", url,
    "-ss", fine.toFixed(3),            // exact, on decoded frames
    "-t", len.toFixed(3),
    "-vf", `scale=-2:'min(${MAXH},ih)'`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart",
    out,
  ], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

  if (r.status !== 0 || !existsSync(out)) {
    console.error(`  ! ${sp.tag} FAILED: ${(r.stderr || r.stdout || "").slice(0, 300)}`);
    continue;
  }
  const bytes = statSync(out).size;
  totalBytes += bytes;
  manifest[id] = { tag: sp.tag, offset: +from.toFixed(3), length: +len.toFixed(3), name: meta.name, bytes };
  console.log(`  + ${sp.tag}  ${from.toFixed(1)}–${(from + len).toFixed(1)}s  ${mb(bytes)} MB  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
console.log(`\n${Object.keys(manifest).length} HQ span(s), ${mb(totalBytes)} MB fetched this run`);
console.log(`manifest -> ${manifestPath}`);
console.log(`\nnow: node scripts/build-edit.mjs ${slug} --final --hq`);
