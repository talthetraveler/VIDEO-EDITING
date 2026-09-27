#!/usr/bin/env node
/**
 * Render every cut in scratch/cuts/ to a low-res preview, one bundle for all.
 *
 *   node scripts/render-cuts.mjs --slug meta-shoot [--scale 0.4] [--out output/meta-shoot/cuts]
 *
 * Cut-only compositions (no captions/titles) built by make-cuts.mjs must already
 * exist at src/compositions/<slug>/<Pascal>.tsx. Writes <out>/<name>.mp4 and a
 * combined ALL_CUTS.mp4 (ffmpeg concat, real ffmpeg on PATH).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug", "meta-shoot");
const scale = parseFloat(opt("scale", "0.4"));
const crf = parseInt(opt("crf", "28"), 10);
const preset = opt("preset", "veryfast");
const concurrency = parseInt(opt("concurrency", "0"), 10) || null;
const specSubdir = opt("dir", "scratch/cuts");
const outDir = opt("out", `output/${slug}/cuts`);
const root = process.cwd();

const toPascal = (name) => {
  const p = name.replace(/(^|[-_])([a-z0-9])/gi, (_, __, c) => c.toUpperCase()).replace(/[-_]/g, "");
  return /^[0-9]/.test(p) ? "C" + p : p;
};

const specs = readdirSync(join(root, ...specSubdir.split("/")))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(".json", ""))
  .sort();
const comps = specs
  .map((name) => ({ name, Pascal: toPascal(name) }))
  .filter((c) => {
    const ok = existsSync(join(root, "src", "compositions", slug, `${c.Pascal}.tsx`));
    if (!ok) console.warn(`⚠ no composition for ${c.name} (${c.Pascal})`);
    return ok;
  });
console.log(`${comps.length} cuts to render at scale ${scale}\n`);
mkdirSync(join(root, outDir), { recursive: true });

// throwaway registry with all of them
const regDir = join(root, "src", "compositions", "_cuts");
rmSync(regDir, { recursive: true, force: true });
mkdirSync(regDir, { recursive: true });
writeFileSync(
  join(regDir, "registry.tsx"),
  `import React from "react";
import { Composition } from "remotion";
${comps.map((c) => `import { ${c.Pascal}, ${c.Pascal.toUpperCase()}_METADATA } from "../${slug}/${c.Pascal}";`).join("\n")}
export const CutsRegistry: React.FC = () => (<>
${comps
  .map(
    (c) => `  <Composition id="${c.Pascal}" component={${c.Pascal}} width={1080} height={1920} fps={30} durationInFrames={1} calculateMetadata={${c.Pascal.toUpperCase()}_METADATA} />`,
  )
  .join("\n")}
</>);
`,
);

const rootPath = join(root, "src", "Root.tsx");
let rootSrc = readFileSync(rootPath, "utf8");
if (rootSrc.includes("CutsRegistry")) {
  // A prior run crashed before restoring Root.tsx. Self-heal: prefer the .bak,
  // else strip the injected lines.
  if (existsSync(rootPath + ".bak")) {
    rootSrc = readFileSync(rootPath + ".bak", "utf8");
    console.warn("· recovered Root.tsx from .bak (a prior run didn't clean up)");
  } else {
    rootSrc = rootSrc
      .replace(/^import \{ CutsRegistry \} from "\.\/compositions\/_cuts\/registry";\n/m, "")
      .replace(/\n\s*<CutsRegistry \/>/g, "");
    console.warn("· stripped a stale CutsRegistry injection from Root.tsx");
  }
  writeFileSync(rootPath, rootSrc);
}
// keep a pristine backup on disk so a crash can't leave Root.tsx patched
writeFileSync(rootPath + ".bak", rootSrc);
writeFileSync(
  rootPath,
  `import { CutsRegistry } from "./compositions/_cuts/registry";\n` +
    rootSrc.replace(/return \(\s*\n(\s*)<>/, "return (\n$1<>\n$1  <CutsRegistry />"),
);
const restoreRoot = () => {
  writeFileSync(rootPath, rootSrc);
  rmSync(rootPath + ".bak", { force: true });
};

let bundleLocation;
const browser = await openBrowser("chrome");
const done = [];
try {
  console.log("· bundling…");
  bundleLocation = await bundle({ entryPoint: join(root, "src", "index.ts") });
  for (let i = 0; i < comps.length; i++) {
    const c = comps[i];
    const outPath = join(root, outDir, `${c.name}.mp4`);
    try {
      const composition = await selectComposition({ serveUrl: bundleLocation, id: c.Pascal, puppeteerInstance: browser });
      const secs = (composition.durationInFrames / 30).toFixed(0);
      process.stdout.write(`· [${i + 1}/${comps.length}] ${c.name} (${secs}s)… `);
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation: outPath,
        scale,
        crf,
        x264Preset: preset,
        puppeteerInstance: browser,
        ...(concurrency ? { concurrency } : {}),
      });
      done.push({ name: c.name, outPath });
      console.log("✓");
    } catch (e) {
      console.log(`✗ ${String(e.message ?? e).split("\n")[0]}`);
    }
  }
} finally {
  await browser.close({ silent: true });
  restoreRoot();
  rmSync(regDir, { recursive: true, force: true });
}

// combined reel
const ff = (() => {
  const cands = [
    "ffmpeg",
    ...readdirSync(join(root, "node_modules", "@remotion"))
      .filter((d) => d.startsWith("compositor-"))
      .map((d) => join(root, "node_modules", "@remotion", d, "ffmpeg.exe")),
  ];
  return cands.find((p) => {
    try {
      execFileSync(p, ["-version"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  });
})();
if (done.length && ff) {
  const list = join(root, outDir, "_all.txt");
  writeFileSync(list, done.map((d) => `file '${resolve(d.outPath).replace(/\\/g, "/")}'`).join("\n"));
  const allPath = join(root, outDir, "ALL_CUTS.mp4");
  try {
    execFileSync(ff, ["-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-y", allPath]);
    console.log(`\n✓ ${allPath}`);
  } catch (e) {
    console.log(`\n✗ concat: ${String(e.stderr ?? e).slice(-200)}`);
  }
  rmSync(list, { force: true });
}
console.log(`\n${done.length}/${comps.length} rendered → ${outDir}`);
