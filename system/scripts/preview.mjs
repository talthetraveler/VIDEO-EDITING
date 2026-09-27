#!/usr/bin/env node
/**
 * Render ONE composition to a low-res preview MP4 for in-chat review.
 *
 *   node scripts/preview.mjs --comp FULL01BAKERYMAHMOUD [--scale 0.4] [--out scratch/preview]
 *
 * The one-at-a-time review loop: build a cut -> preview it here -> Tal reacts ->
 * fix -> preview again. Nothing is registered in Root.tsx permanently; this
 * writes a throwaway registry, bundles, renders, and cleans up.
 *
 * Uses Remotion's bundled ffmpeg for ENCODING (that works fine — only the
 * filter set is stripped). Real ffmpeg (now on PATH) is for drawtext / concat.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const comp = opt("comp");
const slug = opt("slug", "meta-shoot");
const scale = parseFloat(opt("scale", "0.4")); // 0.4 * 1080x1920 = 432x768
const outDir = opt("out", "scratch/preview");
if (!comp) {
  console.error("Usage: node scripts/preview.mjs --comp <PascalName> [--scale 0.4]");
  process.exit(1);
}
const root = process.cwd();
const compFile = join(root, "src", "compositions", slug, `${comp}.tsx`);
if (!existsSync(compFile)) {
  console.error(`✗ ${compFile} not found — build it first (scripts/build-reel.mjs).`);
  process.exit(1);
}
mkdirSync(join(root, outDir), { recursive: true });

for (const [dim, px] of [["w", 1080], ["h", 1920]]) {
  if ((px * scale) % 2 !== 0) {
    console.error(`✗ scale ${scale} → non-even ${dim} (${px * scale}); pick 0.4, 0.5, 0.35…`);
    process.exit(1);
  }
}

// throwaway registry with just this composition
const previewDir = join(root, "src", "compositions", "_preview");
rmSync(previewDir, { recursive: true, force: true });
mkdirSync(previewDir, { recursive: true });
writeFileSync(
  join(previewDir, "registry.tsx"),
  `import React from "react";
import { Composition } from "remotion";
import { ${comp}, ${comp.toUpperCase()}_METADATA } from "../${slug}/${comp}";
export const PreviewRegistry: React.FC = () => (
  <Composition id="${comp}" component={${comp}}
    width={1080} height={1920} fps={30} durationInFrames={1}
    calculateMetadata={${comp.toUpperCase()}_METADATA} />
);
`,
);

const rootPath = join(root, "src", "Root.tsx");
const rootSrc = readFileSync(rootPath, "utf8");
if (!/return \(\s*\n\s*<>/.test(rootSrc)) {
  console.error("✗ Root.tsx shape changed — can't inject PreviewRegistry safely.");
  process.exit(1);
}
const patched =
  `import { PreviewRegistry } from "./compositions/_preview/registry";\n` +
  rootSrc.replace(/return \(\s*\n(\s*)<>/, "return (\n$1<>\n$1  <PreviewRegistry />");
writeFileSync(rootPath, patched);

console.log("· bundling…");
const bundleLocation = await bundle({ entryPoint: join(root, "src", "index.ts") });
const browser = await openBrowser("chrome");
try {
  const composition = await selectComposition({ serveUrl: bundleLocation, id: comp, puppeteerInstance: browser });
  const outPath = join(root, outDir, `${comp}.mp4`);
  console.log(`· rendering ${comp} (${(composition.durationInFrames / 30).toFixed(1)}s) at scale ${scale}…`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outPath,
    scale,
    crf: 28,
    x264Preset: "veryfast",
    puppeteerInstance: browser,
  });
  console.log(`✓ ${outPath}`);
  console.log(`  ${composition.width * scale}x${composition.height * scale}`);
} finally {
  await browser.close({ silent: true });
  // restore Root.tsx
  writeFileSync(rootPath, rootSrc);
  rmSync(previewDir, { recursive: true, force: true });
}
