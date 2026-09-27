#!/usr/bin/env node
/**
 * Long Form -> Short — stage 3: an approved candidate -> a Remotion composition.
 *
 *   node scripts/longform-build.mjs --slug <slug> --spec <candidate>.json
 *
 * `candidate.json` (see skills/01-longform-to-short/templates/clips.json):
 * {
 *   "name": "he_gave_me_his_motorcycle",
 *   "title": "HE JUST GAVE ME HIS MOTORCYCLE",       // optional TitleCard
 *   "uppercaseCaptions": true,
 *   "tighten": true,                                  // drop fillers/pauses per beat
 *   "beats": [
 *     { "start": 761.2, "end": 768.0, "label": "hook — pulled forward from later" },
 *     { "start": 700.0, "end": 761.2, "label": "context", "objectPosition": "35%" }
 *   ]
 * }
 *
 * Beats play in the ORDER GIVEN, not source-chronological order — that's what
 * makes hook reconstruction possible (STEP "HOOK RECONSTRUCTION" in
 * references/pipeline.md): pull a strong line from later in the source and
 * open on it. `start`/`end` are ABSOLUTE seconds into the long source.
 *
 * Captions are generated WORD-LEVEL by slicing transcript.json for each beat's
 * span and remapping onto the assembled timeline — not one caption per beat —
 * so <Captions> pages and per-word emphasis work exactly as they do elsewhere.
 *
 * No smart reframing here: crop-to-fill is a centred (or `objectPosition`-
 * shifted) static crop. MediaPipe/face-tracking is not installed on this
 * machine (see CLAUDE.md §7) — if a speaker drifts out of a static crop, set
 * `objectPosition` on that beat by eye after checking a still, or split the
 * beat so each half gets its own crop.
 *
 * Writes src/compositions/<slug>/<Pascal>.tsx + .data.json, and records the
 * spec into public/footage/<slug>/clips.json + captions.json (the artifacts
 * named in the pipeline spec) for traceability.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { removeFillers, wordsToSegments } from "./lib/autocut-core.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug");
const specPath = opt("spec");
if (!slug || !specPath || !existsSync(specPath)) {
  console.error("Usage: node scripts/longform-build.mjs --slug <slug> --spec <candidate>.json");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));
if (!Array.isArray(spec.beats) || !spec.beats.length) {
  console.error("✗ spec.beats must be a non-empty array of {start,end}");
  process.exit(1);
}

const root = process.cwd();
const footageDir = join(root, "public", "footage", slug);
const transcriptPath = join(footageDir, "transcript.json");
if (!existsSync(transcriptPath)) {
  console.error(`✗ no transcript.json for slug "${slug}" — run scripts/longform-index.mjs first.`);
  process.exit(1);
}
const { source, words: allWords, duration_s } = JSON.parse(readFileSync(transcriptPath, "utf8"));

const name = (spec.name || basename(specPath, ".json")).replace(/[^a-z0-9-_]/gi, "_");
const rawPascal = name.replace(/(^|[-_])([a-z0-9])/gi, (_, __, c) => c.toUpperCase()).replace(/[-_]/g, "");
const Pascal = /^[0-9]/.test(rawPascal) ? `C${rawPascal}` : rawPascal;

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const beats = [];
const captions = [];
let cursorMs = 0;
let totalTightened = 0;
let totalRaw = 0;

for (const item of spec.beats) {
  const s0 = item.start;
  const e0 = item.end;
  if (typeof s0 !== "number" || typeof e0 !== "number" || e0 <= s0) {
    console.error(`✗ bad beat: ${JSON.stringify(item)}`);
    process.exit(1);
  }
  if (e0 > duration_s + 0.5) {
    console.error(`✗ beat end ${e0}s is past the source duration (${duration_s}s)`);
    process.exit(1);
  }
  totalRaw += e0 - s0;

  // words strictly inside [s0,e0] by midpoint, used both for tightening and
  // for caption slicing.
  const inWindow = allWords.filter((w) => (w.start + w.end) / 2 >= s0 && (w.start + w.end) / 2 <= e0);

  // sub-segments to actually cut: the whole beat, or filler/pause-tightened
  // pieces of it (TIGHTENING step of the pipeline).
  let subSegments;
  if (spec.tighten && inWindow.length) {
    const { kept } = removeFillers(inWindow.map((w) => ({ ...w })));
    subSegments = wordsToSegments(kept, e0, { maxPause: 0.4, margin: 0.06, minSegment: 0.15 }).map(([a, b]) => [
      Math.max(s0, a),
      Math.min(e0, b),
    ]);
    if (!subSegments.length) subSegments = [[s0, e0]];
  } else {
    subSegments = [[s0, e0]];
  }

  for (const [s, e] of subSegments) {
    totalTightened += e - s;
    beats.push({
      src: source,
      startSec: +s.toFixed(3),
      endSec: +e.toFixed(3),
      ...(item.objectPosition ? { objectPosition: item.objectPosition } : {}),
    });
    const durMs = (e - s) * 1000;
    for (const w of inWindow) {
      if ((w.start + w.end) / 2 < s || (w.start + w.end) / 2 > e) continue;
      const startMs = Math.round(cursorMs + Math.max(0, w.start - s) * 1000);
      const endMs = Math.round(cursorMs + Math.min(e - s, w.end - s) * 1000);
      captions.push({
        text: " " + w.word.trim(),
        startMs,
        endMs: Math.max(endMs, startMs + 1),
        timestampMs: Math.round((startMs + endMs) / 2),
        confidence: 1,
      });
    }
    cursorMs += durMs;
  }
}

const totalFrames = Math.max(1, Math.round((cursorMs / 1000) * FPS));
const compDir = join(root, "src", "compositions", slug);
mkdirSync(compDir, { recursive: true });
const dataFile = join(compDir, `${Pascal}.data.json`);
writeFileSync(dataFile, JSON.stringify({ fps: FPS, width: WIDTH, height: HEIGHT, beats, captions }, null, 2));

const titleBlock = spec.title
  ? `      <TitleCard theme={theme} text=${JSON.stringify(spec.title)} total={${Math.round(2.5 * FPS)}} />\n`
  : "";
const capUpper = spec.uppercaseCaptions ? " uppercase" : "";

const comp = `import React from "react";
import { AbsoluteFill } from "remotion";
import type { Caption } from "@remotion/captions";
import data from "./${Pascal}.data.json";
import {
  ClipReel,
  clipReelMetadata,
  Captions,
  TitleCard,
  editorialTheme,
  type ReelSpec,
} from "../../components";
import { loadFonts } from "../../lib/fonts";

loadFonts();
const theme = editorialTheme;
const SPEC = data as ReelSpec;

/**
 * ${name}  (long-form -> short)
 * source: ${source}
 * ${spec.beats.length} beat(s) from the source, ${beats.length} cut segment(s) after tightening
 * Regenerate: node scripts/longform-build.mjs --slug ${slug} --spec ${basename(specPath)}
 */
export const ${Pascal}: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
${titleBlock}    <Captions theme={theme} captions={(SPEC.captions ?? []) as Caption[]}${capUpper} />
  </AbsoluteFill>
);

export const ${Pascal.toUpperCase()}_METADATA = clipReelMetadata(SPEC);
`;
writeFileSync(join(compDir, `${Pascal}.tsx`), comp);

// ---- traceability artifacts named in the pipeline spec -------------------
const clipsPath = join(footageDir, "clips.json");
const clipsLog = existsSync(clipsPath) ? JSON.parse(readFileSync(clipsPath, "utf8")) : [];
const clipRecord = {
  id: name,
  source,
  beats: spec.beats,
  tightened: !!spec.tighten,
  raw_duration_s: +totalRaw.toFixed(2),
  final_duration_s: +(cursorMs / 1000).toFixed(2),
  title: spec.title ?? null,
  composition: `src/compositions/${slug}/${Pascal}.tsx`,
  built_at: new Date().toISOString(),
};
writeFileSync(
  clipsPath,
  JSON.stringify([...clipsLog.filter((c) => c.id !== name), clipRecord], null, 2),
);

const captionsPath = join(footageDir, "captions.json");
const captionsLog = existsSync(captionsPath) ? JSON.parse(readFileSync(captionsPath, "utf8")) : {};
captionsLog[name] = captions;
writeFileSync(captionsPath, JSON.stringify(captionsLog, null, 2));

console.log(`✓ src/compositions/${slug}/${Pascal}.tsx`);
console.log(`  ${spec.beats.length} beat(s) → ${beats.length} cut segment(s) · ${(cursorMs / 1000).toFixed(1)}s final` +
  (spec.tighten ? ` (${totalRaw.toFixed(1)}s raw → ${totalTightened.toFixed(1)}s after tightening)` : ""));
console.log(`✓ public/footage/${slug}/clips.json`);
console.log(`✓ public/footage/${slug}/captions.json`);
console.log(`\nRegister in src/Root.tsx:\n`);
console.log(`  import { ${Pascal}, ${Pascal.toUpperCase()}_METADATA } from "./compositions/${slug}/${Pascal}";`);
console.log(`  <Composition id="${Pascal}" component={${Pascal}}`);
console.log(`    width={${WIDTH}} height={${HEIGHT}} fps={${FPS}} durationInFrames={${totalFrames}}`);
console.log(`    calculateMetadata={${Pascal.toUpperCase()}_METADATA} />\n`);
console.log(`Then: npm run studio   ·   npx remotion still ${Pascal} --frame=0 --scale=0.5 --output=output/check.png`);
console.log(`      npx remotion render <bundle> ${Pascal} output/${slug}/${name}.mp4 --crf 24`);
console.log(`\nBefore calling this done: render stills across the cut and actually look at them`);
console.log(`(framing / captions / hook / ending) — see .claude/agents/quality-control.md.`);
