#!/usr/bin/env node
/**
 * Auto video editor — Remotion-native port of auto-video-editor.skill.
 *
 *   npm run tighten -- <video> --slug <slug> [--model small.en] [--max-pause 0.4]
 *   npm run tighten -- --batch <folder> --slug <slug> [--model small.en]
 *
 * Transcribes talking footage locally with whisper.cpp (no API, no tokens),
 * drops filler words + long pauses, and writes per clip:
 *
 *   public/footage/<slug>/<name>.keep.json       spans to keep  (fed to <AutoCut>)
 *   public/footage/<slug>/<name>.captions.json   Caption[]      (fed to <Captions>)
 *   public/footage/<slug>/<name>.captions.raw.json
 *   public/footage/<slug>/<name>.cut.log
 *
 * Single mode also emits src/compositions/<slug>/<Pascal>Cut.tsx.
 * Batch mode also writes public/footage/<slug>/<slug>.index.json — every clip's
 * transcript + kept spans + GREETING HITS (shabbat shalom / salam alaikum /
 * marhaba / peace / bless / welcome…), for cutting kindness-greeting reels.
 *
 * There is NO ffmpeg re-encode step: the tightened cut is a Remotion composition.
 * Every take is kept, in order — this only tightens, it never picks takes.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, copyFileSync, rmSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { homedir, tmpdir } from "node:os";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";
import { removeFillers, wordsToSegments, findGreetings, norm, DEFAULTS } from "./lib/autocut-core.mjs";

const WHISPER_VERSION = "1.5.5";
const VIDEO_EXTS = new Set([".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi"]);

const args = process.argv.slice(2);
const VALUE_FLAGS = new Set(["slug", "model", "max-pause", "batch", "language"]);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
// --translate: whisper "translate" task — any spoken language (Arabic/Hebrew/…)
// comes out as English. --language he|ar to pin the source (skips autodetect).
const translateToEnglish = args.includes("--translate");
const language = opt("language", null);
const positional = args.find((a, i) => !a.startsWith("--") && !(args[i - 1]?.startsWith("--") && VALUE_FLAGS.has(args[i - 1].slice(2))));
const batchDir = opt("batch");
let model = opt("model", "small.en");
// translate / non-English needs a multilingual model — .en models can't
if ((translateToEnglish || language) && /\.en$/.test(model)) {
  const m = model.replace(/\.en$/, "");
  console.warn(`· --translate/--language needs a multilingual model — switching ${model} → ${m}`);
  model = m;
}
const maxPause = parseFloat(opt("max-pause", String(DEFAULTS.MAX_PAUSE)));

const root = process.cwd();
const round = (n) => Math.round(n * 1000) / 1000;

// ---- resolve inputs -----------------------------------------------------
let clips = [];
let slug;
if (batchDir) {
  if (!existsSync(batchDir)) exit(`No such folder: ${batchDir}`);
  clips = readdirSync(batchDir)
    .filter((f) => VIDEO_EXTS.has(extname(f).toLowerCase()))
    .sort()
    .map((f) => join(batchDir, f));
  if (!clips.length) exit(`No video files in ${batchDir}`);
  slug = (opt("slug", basename(batchDir)) || basename(batchDir)).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
} else {
  const video = positional;
  if (!video || !existsSync(video)) {
    exit("Usage: npm run tighten -- <video> --slug s   |   npm run tighten -- --batch <folder> --slug s");
  }
  clips = [video];
  slug = (opt("slug", basename(video, extname(video))) || basename(video, extname(video)))
    .replace(/[^a-z0-9-]/gi, "-")
    .toLowerCase();
}
const pascal = slug.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

// ---- paths / whisper cache (must be space-free — see note below) ------
const cacheRoot = join(homedir(), ".cache", "video-studio");
const whisperDir = join(cacheRoot, "whisper.cpp");
const publicDir = join(root, "public", "footage", slug);
const compDir = join(root, "src", "compositions", slug);
mkdirSync(cacheRoot, { recursive: true });
mkdirSync(publicDir, { recursive: true });
mkdirSync(compDir, { recursive: true });
if (/\s/.test(whisperDir)) exit(`whisper path has a space (${whisperDir}); @remotion/install-whisper-cpp can't handle that.`);

// Remotion ships a bundled ffmpeg; `npx` needs shell:true on Windows.
const ffmpeg = (a) => {
  try {
    return execFileSync("npx", ["remotion", "ffmpeg", ...a], { shell: true, stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    return Buffer.from(String(e.stderr ?? ""));
  }
};

// ---- whisper.cpp install (once). It downloads its zip into process.cwd()
// and runs an unquoted Expand-Archive, so run it with cwd in the space-free
// cache dir, then switch back.
console.log(`· preparing whisper.cpp (${model})… first run downloads the model`);
process.chdir(cacheRoot);
try {
  await installWhisperCpp({ to: whisperDir, version: WHISPER_VERSION });
  await downloadWhisperModel({ model, folder: whisperDir });
} finally {
  process.chdir(root);
}

// ---- process one clip -------------------------------------------------
async function processClip(videoPath) {
  const name = basename(videoPath, extname(videoPath)).replace(/[^a-z0-9-_]/gi, "_");
  const localName = `${name}${extname(videoPath)}`;
  console.log(`\n· ${localName}`);

  const probe = ffmpeg(["-i", JSON.stringify(videoPath)]).toString();
  const dm = probe.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  const probedDuration = dm ? +dm[1] * 3600 + +dm[2] * 60 + +dm[3] : 0;

  copyFileSync(videoPath, join(publicDir, localName));
  const wav = join(tmpdir(), `vs_${slug}_${name}_${Date.now()}.16k.wav`);
  ffmpeg(["-i", JSON.stringify(videoPath), "-vn", "-ac", "1", "-ar", "16000", "-y", JSON.stringify(wav)]);
  if (!existsSync(wav)) {
    console.error(`  ✗ ffmpeg produced no wav for ${localName}; skipping.`);
    return null;
  }

  const out = await transcribe({
    inputPath: wav,
    whisperPath: whisperDir,
    whisperCppVersion: WHISPER_VERSION,
    model,
    tokenLevelTimestamps: true,
    translateToEnglish,
    ...(language ? { language } : {}),
  });
  rmSync(wav, { force: true });

  const { captions: rawCaptions } = toCaptions({ whisperCppOutput: out });
  const NON_SPEECH = /(blank_audio|music|silence|applause|laughter|noise|inaudible)/i;
  const isSpeech = (t) => t.length > 0 && !NON_SPEECH.test(t) && /[a-z0-9]/i.test(t);
  const captions = rawCaptions.filter((c) => isSpeech(c.text.trim()) && c.endMs > c.startMs);
  writeFileSync(join(publicDir, `${name}.captions.raw.json`), JSON.stringify(rawCaptions, null, 2));

  const words = captions.map((c) => ({
    word: c.word ?? c.text,
    start: c.startMs / 1000,
    end: c.endMs / 1000,
    norm: norm(c.text.trim()),
  }));

  const { kept, removed } = removeFillers(words);
  const total = probedDuration || (words.at(-1)?.end ?? 0) + 1;
  const segments = wordsToSegments(kept, total, { maxPause });
  const greetings = findGreetings(words).map((g) => ({ ...g, start: round(g.start), end: round(g.end) }));
  const keptSeconds = segments.reduce((n, [s, e]) => n + (e - s), 0);
  const pct = total ? Math.round((1 - keptSeconds / total) * 100) : 0;

  const keepFile = {
    src: `footage/${slug}/${localName}`,
    fps: 30,
    segments: segments.map(([s, e]) => [round(s), round(e)]),
    stats: { originalSeconds: round(total), keptSeconds: round(keptSeconds), fillersRemoved: removed.length },
  };
  writeFileSync(join(publicDir, `${name}.keep.json`), JSON.stringify(keepFile, null, 2));

  // captions remapped onto the TIGHTENED timeline so they sync with <AutoCut>
  let cumBefore = 0;
  const tightened = [];
  for (const [s, e] of segments) {
    const shift = s - cumBefore;
    for (const c of captions) {
      const mid = (c.startMs / 1000 + c.endMs / 1000) / 2;
      if (mid >= s && mid <= e) {
        const ns = Math.max(0, Math.round((Math.max(c.startMs / 1000, s) - shift) * 1000));
        const ne = Math.round((Math.min(c.endMs / 1000, e) - shift) * 1000);
        tightened.push({ text: c.text, startMs: ns, endMs: Math.max(ne, ns + 1), timestampMs: Math.round((ns + ne) / 2), confidence: c.confidence ?? null });
      }
    }
    cumBefore += e - s;
  }
  writeFileSync(join(publicDir, `${name}.captions.json`), JSON.stringify(tightened, null, 2));

  const transcript = words.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();
  const logLines = [
    `auto-cut  ${localName}`,
    `transcribed words : ${words.length}`,
    `fillers removed    : ${removed.length}`,
    `kept speech chunks : ${segments.length}`,
    `length             : ${total.toFixed(1)}s -> ${keptSeconds.toFixed(1)}s  (${pct}% shorter)`,
    greetings.length ? `greeting hits      : ${greetings.map((g) => `${g.phrase}@${g.start}s`).join(", ")}` : "",
    removed.length ? `e.g. fillers       : ${removed.slice(0, 14).map((w) => w.word.trim()).join(" ")}` : "",
    "",
    words.length === 0
      ? "note: no speech detected — pass-through copy."
      : pct < 8
        ? "⚠ Only a few % shorter — try --model medium.en or a lower --max-pause."
        : "",
  ].filter(Boolean);
  writeFileSync(join(publicDir, `${name}.cut.log`), logLines.join("\n") + "\n");
  console.log("  " + logLines.slice(1, 6).join("\n  "));

  return {
    name,
    localName,
    src: `footage/${slug}/${localName}`,
    originalSeconds: round(total),
    keptSeconds: round(keptSeconds),
    fillersRemoved: removed.length,
    pctShorter: pct,
    greetings,
    segments: keepFile.segments,
    transcript,
  };
}

// ---- run --------------------------------------------------------------
const results = [];
for (const c of clips) {
  const r = await processClip(c);
  if (r) results.push(r);
}

if (batchDir) {
  const index = {
    slug,
    model,
    clips: results,
    greetingClips: results.filter((r) => r.greetings.length).map((r) => r.name),
  };
  writeFileSync(join(publicDir, `${slug}.index.json`), JSON.stringify(index, null, 2));
  console.log(`\n════ batch done: ${results.length} clips ════`);
  console.log(`✓ public/footage/${slug}/${slug}.index.json`);
  const hits = results.filter((r) => r.greetings.length);
  if (hits.length) {
    console.log(`\ngreeting moments (${hits.reduce((n, r) => n + r.greetings.length, 0)} across ${hits.length} clips):`);
    for (const r of hits) {
      for (const g of r.greetings) {
        console.log(`  ${r.name}  ${String(g.start).padStart(6)}s  “…${g.context}…”`);
      }
    }
  } else {
    console.log("\nno greeting phrases detected — check the transcripts in the index, or add patterns to autocut-core.mjs");
  }
  console.log(`\nNext: read the index, pick beats across clips, build a <Series> reel per variation. See kindness-greetings.md.`);
} else {
  const r = results[0];
  const compFile = join(compDir, `${pascal}Cut.tsx`);
  if (r && !existsSync(compFile)) {
    writeFileSync(
      compFile,
      `import React from "react";
import { AbsoluteFill } from "remotion";
import type { Caption } from "@remotion/captions";
import keep from "../../../public/footage/${slug}/${r.name}.keep.json";
import captions from "../../../public/footage/${slug}/${r.name}.captions.json";
import { AutoCut, autoCutMetadata, type KeepFile } from "../../components/AutoCut";
import { Captions } from "../../captions/Captions";

const KEEP = keep as KeepFile;
const CAPTIONS = captions as Caption[];

/** Tightened cut of ${r.localName} + synced captions. Edit ${r.name}.keep.json to hand-tune. */
export const ${pascal}Cut: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <AutoCut keep={KEEP} />
    <Captions captions={CAPTIONS} />
  </AbsoluteFill>
);
export const ${pascal.toUpperCase()}_CUT_METADATA = autoCutMetadata(KEEP);
`,
    );
  }
  console.log(`\n✓ public/footage/${slug}/${r?.name}.keep.json`);
  console.log(`✓ src/compositions/${slug}/${pascal}Cut.tsx\n`);
  console.log("Register in src/Root.tsx:\n");
  console.log(`  import { ${pascal}Cut, ${pascal.toUpperCase()}_CUT_METADATA } from "./compositions/${slug}/${pascal}Cut";`);
  console.log(`  <Composition id="${pascal}Cut" component={${pascal}Cut}`);
  console.log(`    width={1080} height={1920} fps={30} durationInFrames={1}`);
  console.log(`    calculateMetadata={${pascal.toUpperCase()}_CUT_METADATA} />\n`);
  console.log(`Then: npm run studio   ·   npm run render ${pascal}Cut output/${slug}.mp4\n`);
}

function exit(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}
