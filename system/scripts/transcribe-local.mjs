#!/usr/bin/env node
// TRANSCRIBE-LOCAL — bring footage that is already on this disk into the same
// pipeline as Frame.io footage.
//
//   node scripts/transcribe-local.mjs "C:/Users/taldo/Downloads/feed homeless"
//   node scripts/transcribe-local.mjs <folder> --slug feed-homeless --force
//
// WHY
//   Tal, 2026-09-21: *"it really just makes sense just to download them high
//   res at one time ... I don't know why I do the low res and then switch to
//   the high res."* He is right. When the originals are already here — or the
//   folder is small enough to just pull — there is no reason to cut from a
//   360p proxy at all.
//
// WHAT IT DOES
//   Extracts 16 kHz mono FLAC (never uploads video), transcribes with Groq
//   turbo WITH word timestamps, and for non-English speech also runs the
//   translation endpoint so captions can be English-only. Everything lands in
//   the SAME cache the Frame.io path uses, so build-edit/autotrim/selfreview
//   work unchanged.
//
//   It also writes cache/local-sources.json mapping each id to its absolute
//   path, which is how build-edit finds the real file instead of a proxy.
//
// COST: cached by content, never re-paid. --force is the only way to redo it.
// The originals are opened read-only and never modified.
import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync, readFileSync, createReadStream } from "node:fs";
import { join, basename, extname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { loadEnv, extractAudio, probeAudio, looksSilent, groqTranscribe, groqTranslate, pool, scrub, GROQ_TURBO } from "./lib/stt.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const CACHE = join(ROOT, "projects/_frameio/cache");
const TRANS = join(CACHE, "transcripts");
const TRANSL = join(CACHE, "translate");
const AUDIO = join(CACHE, "audio");
const SRCMAP = join(CACHE, "local-sources.json");
const VIDEO = new Set([".mp4", ".mov", ".m4v", ".mkv", ".avi", ".mts"]);

loadEnv();

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
const FORCE = args.includes("--force");
const slugFlag = (() => { const i = args.indexOf("--slug"); return i >= 0 ? args[i + 1] : null; })();
if (!target) { console.error('usage: node scripts/transcribe-local.mjs "<folder or file>" [--slug x] [--force]'); process.exit(2); }

for (const d of [TRANS, TRANSL, AUDIO]) mkdirSync(d, { recursive: true });

// A stable id from the absolute path, so re-running never re-pays and two
// folders with a C0484.MP4 each cannot collide.
const idFor = (p) => "local-" + createHash("sha1").update(resolve(p).toLowerCase()).digest("hex").slice(0, 16);

const files = statSync(target).isDirectory()
  ? readdirSync(target).filter((f) => VIDEO.has(extname(f).toLowerCase())).map((f) => join(target, f))
  : [target];

if (!files.length) { console.error(`No video files in ${target}`); process.exit(2); }

const srcMap = existsSync(SRCMAP) ? JSON.parse(readFileSync(SRCMAP, "utf8")) : {};
const slug = slugFlag ?? basename(statSync(target).isDirectory() ? target : join(target, "..")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

console.log(`\nTRANSCRIBE-LOCAL  ${slug}  —  ${files.length} file(s)\n`);

let done = 0, cached = 0, failed = 0, billed = 0;

await pool(files, 3, async (path) => {
  const id = idFor(path);
  const name = basename(path);
  const out = join(TRANS, `${id}.json`);
  srcMap[id] = { path: resolve(path), name, slug };

  if (existsSync(out) && !FORCE) {
    const j = JSON.parse(readFileSync(out, "utf8"));
    if ((j.words ?? []).length || j.silent) { cached++; console.log(`  = ${name}  cached`); return; }
  }

  const flac = join(AUDIO, `${id}.flac`);
  try {
    if (!existsSync(flac) || FORCE) extractAudio(path, flac);
    const info = probeAudio(flac);
    if (looksSilent(info)) {
      writeFileSync(out, JSON.stringify({ id, name, source: { local: resolve(path) }, silent: true,
        usable_as_broll: true, duration: info.duration ?? null, segments: [], words: [] }, null, 2), "utf8");
      console.log(`  · ${name}  silent -> b-roll only`);
      done++; return;
    }

    const t = await groqTranscribe(flac, { model: GROQ_TURBO, words: true });
    billed += (t.duration ?? 0) / 60;
    const rec = {
      id, name, slug, source: { local: resolve(path) },
      duration: t.duration ?? null, language: t.language ?? null,
      segments: t.segments ?? [], words: t.words ?? [],
      provider: "groq", model: GROQ_TURBO, transcribed_at: new Date().toISOString(),
    };
    writeFileSync(out, JSON.stringify(rec, null, 2), "utf8");

    // Non-English speech gets an English translation too — Tal's captions are
    // English only, and ffmpeg drawtext has no bidi engine so the original
    // script would render backwards anyway.
    const lang = String(t.language ?? "").toLowerCase();
    const isEn = lang.startsWith("en");
    if (!isEn && (t.segments ?? []).length) {
      const tr = await groqTranslate(flac);
      writeFileSync(join(TRANSL, `${id}.json`), JSON.stringify(
        { id, name, from: t.language, segments: tr.segments ?? [], translated_at: new Date().toISOString() }, null, 2), "utf8");
      console.log(`  + ${name}  [${t.language}] ${(t.segments ?? []).length} segs, ${(t.words ?? []).length} word-ts  +EN translation`);
    } else {
      console.log(`  + ${name}  [${t.language}] ${(t.segments ?? []).length} segs, ${(t.words ?? []).length} word-ts`);
    }
    done++;
  } catch (e) {
    failed++;
    console.error(`  ! ${name} FAILED: ${scrub(e.message)}`);
  }
});

writeFileSync(SRCMAP, JSON.stringify(srcMap, null, 2), "utf8");
console.log(`\ntranscribed ${done}, cached ${cached}, failed ${failed}`);
console.log(`billed ~${billed.toFixed(1)} min -> ~$${(billed / 60 * 0.04).toFixed(4)}`);
console.log(`sources -> cache/local-sources.json  (build-edit reads real files from here)`);
console.log(`\nids:`);
for (const [id, v] of Object.entries(srcMap)) if (v.slug === slug) console.log(`  ${id}  ${v.name}`);
