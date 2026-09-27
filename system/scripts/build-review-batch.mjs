#!/usr/bin/env node
/**
 * Build + render the REVIEW batch (the review-gated workflow in CLAUDE.md §3):
 * low-res proxies with burned-in IDs and title cards, one combined REVIEW_ALL,
 * individual clips kept, a review-manifest.json, and an attempt to auto-open.
 *
 *   node scripts/build-review-batch.mjs --slug meta-shoot \
 *        --out output/meta-shoot --candidates scratch/review-candidates.json
 *
 * Nothing here is final. Nothing writes to approved/ or final/.
 *
 * candidates.json: [{ id, name, classification: "A"|"B", title }] where `name`
 * is the edit name whose composition already exists at
 * src/compositions/<slug>/<Pascal>.tsx.
 *
 * Design notes (learned the hard way):
 * - Remotion <Folder name> and composition ids allow ONLY a-z A-Z 0-9 and "-".
 *   "_Review" / "A1_Wrapped" throw at render time, not at build time.
 * - Each wrapped composition bakes its OWN title card in front of the content,
 *   so (a) an individual proxy self-identifies when opened alone and (b) the
 *   combined reel is a plain ffmpeg concat of the proxies instead of a second
 *   full render of every frame (which doubled the work).
 * - One shared browser across all renders; enforceAudioTrack so silent cards
 *   and clips with audio can still concat with -c copy.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug");
const outBase = opt("out");
const candidatesPath = opt("candidates");
const only = opt("only"); // optional: comma-separated ids, for re-rendering a revision
if (!slug || !outBase || !candidatesPath) {
  console.error("Usage: node scripts/build-review-batch.mjs --slug <slug> --out <dir> --candidates <file>.json [--only A1,B3]");
  process.exit(1);
}
const root = process.cwd();
// candidatesAll = the whole batch (drives the manifest and the combined reel).
// candidates    = what we actually RE-RENDER this run.
// With --only these differ: re-rendering two revised clips must not shrink the
// manifest to two rows, and REVIEW_ALL must still contain all 115 proxies.
const candidatesAll = JSON.parse(readFileSync(candidatesPath, "utf8"));
let candidates = candidatesAll;
if (only) {
  const keep = new Set(only.split(",").map((s) => s.trim()));
  candidates = candidatesAll.filter((c) => keep.has(c.id));
}

const toPascal = (name) => {
  const rawPascal = name.replace(/(^|[-_])([a-z0-9])/gi, (_, __, c) => c.toUpperCase()).replace(/[-_]/g, "");
  return /^[0-9]/.test(rawPascal) ? `C${rawPascal}` : rawPascal;
};

const compDir = join(root, "src", "compositions", slug);
const reviewDir = join(root, "src", "compositions", "_review");
rmSync(reviewDir, { recursive: true, force: true });
mkdirSync(reviewDir, { recursive: true });

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;
const CARD_FRAMES = Math.round(0.9 * FPS);
// Low-res review proxy. The scale MUST produce integer (and, for h264, even)
// dimensions — Remotion throws "height must be an integer, but is 633.6" at
// the stitch step, i.e. AFTER every frame has been rendered. 0.35 → 378x672.
const SCALE = 0.35;
for (const [dim, px] of [["width", WIDTH], ["height", HEIGHT]]) {
  const scaled = px * SCALE;
  if (!Number.isInteger(scaled) || scaled % 2 !== 0) {
    console.error(`✗ SCALE ${SCALE} gives a non-even ${dim} (${scaled}). Pick another scale.`);
    process.exit(1);
  }
}

const fmtDur = (s) => {
  const m = Math.floor(s / 60);
  const ss = Math.round(s % 60);
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

// ---- resolve each candidate's duration from its own .data.json -----------
const resolved = [];
for (const c of candidates) {
  const Pascal = toPascal(c.name);
  const dataPath = join(compDir, `${Pascal}.data.json`);
  if (!existsSync(dataPath)) {
    console.warn(`⚠ skipping ${c.id} (${c.name}) — no ${Pascal}.data.json`);
    continue;
  }
  const data = JSON.parse(readFileSync(dataPath, "utf8"));
  const durationSec = data.beats.reduce((n, b) => n + (b.endSec - b.startSec), 0);
  const contentFrames = Math.max(1, Math.round(durationSec * FPS));
  resolved.push({
    ...c,
    Pascal,
    compId: `${c.id}Wrapped`, // alphanumeric only — Remotion id rule
    durationSec: +durationSec.toFixed(1),
    contentFrames,
    totalFrames: contentFrames + CARD_FRAMES,
  });
}
console.log(`· ${resolved.length}/${candidates.length} candidates resolved`);
if (!resolved.length) process.exit(1);

// ---- one wrapped composition per candidate: title card + content + badge --
for (const c of resolved) {
  writeFileSync(
    join(reviewDir, `${c.compId}.tsx`),
    `import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { ${c.Pascal} } from "../${slug}/${c.Pascal}";
import { ReviewBadge } from "../../components/ReviewBadge";
import { ReviewCard } from "../../components/ReviewCard";

/** REVIEW-STAGE ONLY. ${c.id} = "${c.name}". Never part of a final render. */
export const ${c.compId}: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Series>
      <Series.Sequence durationInFrames={${CARD_FRAMES}} name="card">
        <ReviewCard id="${c.id}" title={${JSON.stringify(c.title ?? "")}} durationLabel="${fmtDur(c.durationSec)}" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={${c.contentFrames}} name="content">
        <AbsoluteFill>
          <${c.Pascal} />
          <ReviewBadge id="${c.id}" />
        </AbsoluteFill>
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
`,
  );
}

// ---- registry (Folder name must be alphanumeric/dashes only) --------------
writeFileSync(
  join(reviewDir, "registry.tsx"),
  `import React from "react";
import { Composition, Folder } from "remotion";
${resolved.map((c) => `import { ${c.compId} } from "./${c.compId}";`).join("\n")}

/** Auto-generated by scripts/build-review-batch.mjs — review stage only. */
export const ReviewRegistry: React.FC = () => (
  <Folder name="Review">
${resolved
  .map(
    (c) => `    <Composition id="${c.compId}" component={${c.compId}}
      width={${WIDTH}} height={${HEIGHT}} fps={${FPS}} durationInFrames={${c.totalFrames}} />`,
  )
  .join("\n")}
  </Folder>
);
`,
);

const rootPath = join(root, "src", "Root.tsx");
let rootSrc = readFileSync(rootPath, "utf8");
if (!rootSrc.includes("ReviewRegistry")) {
  rootSrc = rootSrc.replace(
    /import \{ MetaShootRegistry \} from ".\/compositions\/meta-shoot\/registry";/,
    `import { MetaShootRegistry } from "./compositions/meta-shoot/registry";\nimport { ReviewRegistry } from "./compositions/_review/registry";`,
  );
  rootSrc = rootSrc.replace(/<MetaShootRegistry \/>/, `<MetaShootRegistry />\n      <ReviewRegistry />`);
  writeFileSync(rootPath, rootSrc);
  console.log("✓ wired ReviewRegistry into src/Root.tsx");
}

// ---- bundle once, render every proxy with ONE shared browser --------------
console.log("· bundling…");
const bundleLocation = await bundle({ entryPoint: join(root, "src", "index.ts") });
console.log("· bundled:", bundleLocation);

const individualDir = join(outBase, "review", "individual");
const reviewAllDir = join(outBase, "review", "review-all");
mkdirSync(individualDir, { recursive: true });
mkdirSync(reviewAllDir, { recursive: true });

const browser = await openBrowser("chrome");

// Verification stills FIRST, off the same bundle — so a caption/framing defect
// is visible within a minute instead of after the whole batch. "Never assume a
// render is right because it compiled."
const stillsDir = join(outBase, "review", "_stills");
mkdirSync(stillsDir, { recursive: true });
const stillTargets = resolved.slice(0, 3);
for (const c of stillTargets) {
  for (const frame of [CARD_FRAMES + 20, CARD_FRAMES + Math.round(c.contentFrames / 2)]) {
    try {
      const comp = await selectComposition({ serveUrl: bundleLocation, id: c.compId, puppeteerInstance: browser });
      const { renderStill } = await import("@remotion/renderer");
      await renderStill({
        composition: comp,
        serveUrl: bundleLocation,
        output: join(stillsDir, `${c.id}_f${frame}.png`),
        frame,
        scale: 0.5,
        puppeteerInstance: browser,
      });
    } catch (e) {
      console.warn(`⚠ still ${c.id}@${frame} failed: ${String(e.message ?? e).split("\n")[0]}`);
    }
  }
}
console.log(`· verification stills → ${stillsDir}`);

const manifest = [];
const rendered = [];
const failures = [];
const t0 = Date.now();

for (let i = 0; i < resolved.length; i++) {
  const c = resolved[i];
  const outPath = join(individualDir, `${c.id}.mp4`);
  const pct = `${i + 1}/${resolved.length}`;
  try {
    const composition = await selectComposition({ serveUrl: bundleLocation, id: c.compId, puppeteerInstance: browser });
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outPath,
      scale: SCALE,
      crf: 30,
      x264Preset: "veryfast",
      enforceAudioTrack: true,
      puppeteerInstance: browser,
// eslint-disable-next-line no-empty-function
      onProgress: () => {},
    });
    rendered.push({ c, outPath });
    const el = (Date.now() - t0) / 1000;
    console.log(`· [${pct}] ${c.id} (${c.durationSec}s) → ${c.id}.mp4   [${el.toFixed(0)}s elapsed]`);
  } catch (e) {
    failures.push({ id: c.id, name: c.name, error: String(e.message ?? e).split("\n")[0] });
    console.error(`✗ [${pct}] ${c.id} FAILED: ${String(e.message ?? e).split("\n")[0]}`);
  }
  manifest.push({
    id: c.id,
    classification: c.classification,
    title: c.title ?? null,
    edit_name: c.name,
    duration: c.durationSec,
    status: failures.some((f) => f.id === c.id) ? "RENDER_FAILED" : "REVIEW",
    preview: `review/individual/${c.id}.mp4`,
  });
}
await browser.close({ silent: true });

// ---- combined REVIEW_ALL = concat of the proxies (cards already baked in) --
let version = 1;
while (existsSync(join(reviewAllDir, `REVIEW_ALL_v${version}.mp4`))) version++;
const reviewAllPath = join(reviewAllDir, `REVIEW_ALL_v${version}.mp4`);

const ffmpegBin = (() => {
  const dir = join(root, "node_modules", "@remotion");
  if (!existsSync(dir)) return null;
  const cands = readdirSync(dir)
    .filter((d) => d.startsWith("compositor-"))
    .map((d) => join(dir, d, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"));
  return cands.find((p) => existsSync(p)) ?? null;
})();

// The combined reel is EVERY proxy on disk in candidate order — not just the
// ones re-rendered this run. Otherwise `--only A1,A4` produces a 2-clip
// "REVIEW_ALL" that silently replaces the real one.
const reelParts = candidatesAll
  .map((c) => ({ c, outPath: join(individualDir, `${c.id}.mp4`) }))
  .filter((r) => existsSync(r.outPath));

let concatOk = false;
if (reelParts.length && ffmpegBin) {
  const listPath = join(reviewAllDir, `_concat_v${version}.txt`);
  // ffmpeg's concat demuxer resolves each `file` relative to the LIST FILE's
  // own directory, not the cwd — relative paths here produced
  // "review-all/output/meta-shoot/.../A1.mp4". Always write absolute paths.
  writeFileSync(
    listPath,
    reelParts.map((r) => `file '${resolve(r.outPath).replace(/\\/g, "/")}'`).join("\n"),
  );
  console.log(`· concatenating ${reelParts.length} proxies → REVIEW_ALL_v${version}.mp4`);
  try {
    execFileSync(ffmpegBin, ["-hide_banner", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", "-y", reviewAllPath], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    concatOk = existsSync(reviewAllPath);
  } catch {
    try {
      execFileSync(
        ffmpegBin,
        ["-hide_banner", "-f", "concat", "-safe", "0", "-i", listPath, "-c:v", "libx264", "-crf", "30", "-preset", "veryfast", "-c:a", "aac", "-y", reviewAllPath],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
      concatOk = existsSync(reviewAllPath);
    } catch (e) {
      console.error("✗ concat failed:", String(e.stderr ?? e).slice(-400));
    }
  }
  rmSync(listPath, { force: true });
}

// Manifest is MERGED, never replaced: a `--only A1,A4` revision must update
// those two rows and leave the other 113 (and any status Tal has set, e.g.
// APPROVED) intact.
const manifestPath = join(outBase, "review", "review-manifest.json");
const prior = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : [];
const priorById = new Map(prior.map((m) => [m.id, m]));
const freshById = new Map(manifest.map((m) => [m.id, m]));
const merged = candidatesAll
  .map((c) => {
    const fresh = freshById.get(c.id);
    const old = priorById.get(c.id);
    if (fresh && old) return { ...old, ...fresh, status: old.status === "APPROVED" ? "REVISION_REQUESTED" : fresh.status };
    return fresh ?? old ?? null;
  })
  .filter(Boolean);
writeFileSync(manifestPath, JSON.stringify(merged, null, 2));

// ---- open the combined file with the OS default player --------------------
let opened = false;
if (concatOk) {
  try {
    if (process.platform === "win32") execFileSync("cmd", ["/c", "start", "", reviewAllPath], { stdio: "ignore" });
    else if (process.platform === "darwin") execFileSync("open", [reviewAllPath], { stdio: "ignore" });
    else execFileSync("xdg-open", [reviewAllPath], { stdio: "ignore" });
    opened = true;
  } catch {
    opened = false;
  }
}

const totalSec = reelParts.reduce((n, r) => n + (r.c.durationSec ?? 0) + CARD_FRAMES / FPS, 0);
console.log(`\nREVIEW READY\n`);
console.log(`${rendered.length} candidates rendered (${rendered.filter((r) => r.c.classification === "A").length} full stories, ${rendered.filter((r) => r.c.classification === "B").length} compilations).`);
if (failures.length) console.log(`${failures.length} FAILED: ${failures.map((f) => f.id).join(", ")}`);
console.log(`\nCombined review (~${fmtDur(totalSec)}):`);
console.log(`  ${concatOk ? reviewAllPath : "(concat failed — individual clips are still there)"}`);
console.log(`Individual clips:\n  ${individualDir}`);
console.log(`Manifest:\n  ${manifestPath}`);
console.log(opened ? `\nOpened REVIEW_ALL_v${version}.mp4 in the default player.` : `\nNot auto-opened — open the path above manually.`);
console.log(`\nWaiting for your selections.`);
