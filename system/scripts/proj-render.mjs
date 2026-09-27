#!/usr/bin/env node
/**
 * Render a project.json to a low-res review MP4.
 *
 *   node scripts/proj-render.mjs <projectName> [--scale 0.4] [--final]
 *
 * project.json is the source of truth. This writes a throwaway Remotion
 * composition from it, renders, and cleans up. --final = scale 1, crf 19.
 *
 * Audio: a gentle cleanup pass runs by default (highpass + mild afftdn +
 * light compression/limiter) — hum/rumble out, street ambience LEFT IN
 * (CLAUDE.md §1). --no-denoise to skip, --denoise-strong for a heavier pass.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import { loadProject, loadPreset } from "./lib/project.mjs";
import { pickEmphasis } from "./lib/emphasis.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const final = args.includes("--final");
const scale = final ? 1 : parseFloat(opt("scale", "0.4"));
if (!name) {
  console.error("Usage: node scripts/proj-render.mjs <projectName> [--scale 0.4] [--final]");
  process.exit(1);
}
if ((1080 * scale) % 2 !== 0) {
  console.error(`✗ scale ${scale} → non-even width`);
  process.exit(1);
}

const p = loadProject(name);
const captionPreset = loadPreset("caption", p.caption_style ?? "tal_phrase");
const titlePreset = loadPreset("title", p.title_style ?? "tal_top_title");
// every distinct per-item title style (pill title, time_jump card, part_label…)
const titleStyleIds = [...new Set([p.title_style ?? "tal_top_title", ...(p.tracks.title ?? []).map((t) => t.style).filter(Boolean)])];
const titlePresets = Object.fromEntries(titleStyleIds.map((id) => [id, loadPreset("title", id)]));

const Pascal = "Proj" + name.replace(/[^a-z0-9]/gi, "");
const compDir = join(root, "src", "compositions", "_proj");
rmSync(compDir, { recursive: true, force: true });
mkdirSync(compDir, { recursive: true });

const data = {
  fps: p.fps,
  width: p.width,
  height: p.height,
  duration: p.duration,
  handle: p.handle ?? null,
  captionLang: p.caption_lang ?? null,
  music: p.tracks.music?.[0]?.src ? { src: p.tracks.music[0].src, volume: p.tracks.music[0].volume ?? 0.1, duck: p.tracks.music[0].duck ?? true } : null,
  dub: p.dub?.src ? { lang: p.dub.lang, src: p.dub.src } : null,
  tracks: {
    video: p.tracks.video,
    broll: p.tracks.broll ?? [],
    title: p.tracks.title ?? [],
    // NAS-Daily style: static yellow span per card. Auto-pick unless hand-set.
    // Index against the SAME tokens CaptionLayer renders (words[] keep original
    // casing; c.text is stored ALL-CAPS).
    captions: (p.tracks.captions ?? []).map((c) =>
      captionPreset.highlight === "keyword" && !c.emphasis
        ? { ...c, emphasis: pickEmphasis(c.words?.length ? c.words.map((w) => w.text).join(" ") : c.text) }
        : c,
    ),
  },
  captionPreset,
  titlePreset,
  titlePresets,
};
writeFileSync(join(compDir, `${Pascal}.data.json`), JSON.stringify(data, null, 2));
writeFileSync(
  join(compDir, `${Pascal}.tsx`),
  `import React from "react";
import data from "./${Pascal}.data.json";
import { ProjectVideo, projectVideoMetadata, type ProjectData } from "../../components/ProjectVideo";
const D = data as unknown as ProjectData;
export const ${Pascal}: React.FC = () => <ProjectVideo data={D} />;
export const ${Pascal.toUpperCase()}_META = projectVideoMetadata(D);
`,
);
writeFileSync(
  join(compDir, "registry.tsx"),
  `import React from "react";
import { Composition } from "remotion";
import { ${Pascal}, ${Pascal.toUpperCase()}_META } from "./${Pascal}";
export const ProjRegistry: React.FC = () => (
  <Composition id="${Pascal}" component={${Pascal}} width={${p.width}} height={${p.height}} fps={${p.fps}} durationInFrames={1} calculateMetadata={${Pascal.toUpperCase()}_META} />
);
`,
);

const rootPath = join(root, "src", "Root.tsx");
const rootBak = rootPath + ".bak";
let rootSrc = readFileSync(rootPath, "utf8");

// if a hard-killed prior run left Root.tsx empty/truncated, recover from .bak
if ((!rootSrc.trim() || !/RemotionRoot/.test(rootSrc)) && existsSync(rootBak)) {
  const bak = readFileSync(rootBak, "utf8");
  if (bak.trim() && /RemotionRoot/.test(bak)) {
    rootSrc = bak;
    writeFileSync(rootPath, bak);
    console.warn("· Root.tsx was empty/broken — restored from Root.tsx.bak");
  }
}
// self-heal a stale injection from a crashed prior run (ProjRegistry only —
// never touch a shoot's own <MetaShootRegistry /> etc.)
if (/ProjRegistry \} from ".\/compositions\/_proj\/registry"/.test(rootSrc)) {
  rootSrc = rootSrc
    .replace(/^import \{ ProjRegistry \} from ".\/compositions\/_proj\/registry";\n/gm, "")
    .replace(/\n\s*<ProjRegistry \/>/g, "");
  console.warn("· cleaned a stale ProjRegistry injection from Root.tsx");
}
if (!/return \(\s*\n(\s*)<>/.test(rootSrc)) {
  console.error("✗ Root.tsx shape changed (expected `return (\\n  <>`). Fix src/Root.tsx by hand.");
  process.exit(1);
}
const pristine = rootSrc;
writeFileSync(rootBak, pristine); // disk-backed restore point for a hard kill
writeFileSync(
  rootPath,
  `import { ProjRegistry } from "./compositions/_proj/registry";\n` +
    rootSrc.replace(/return \(\s*\n(\s*)<>/, "return (\n$1<>\n$1  <ProjRegistry />"),
);

const restore = () => writeFileSync(rootPath, pristine);

// Each bundle() copies public/ (~5GB of footage) into a fresh %TEMP% dir. A
// crashed render never cleans it → the disk fills (this bit us hard). Sweep
// stale remotion bundle/asset dirs — but NEVER one touched in the last 15 min:
// a concurrent render (the dashboard's warm bundle, a batch sibling) is using it.
const tmp = tmpdir();
const STALE_MS = 15 * 60 * 1000;
for (const d of readdirSync(tmp)) {
  if (!/^remotion-(webpack-bundle-|v[\d.]+-assets)/.test(d)) continue;
  const p = join(tmp, d);
  try {
    if (Date.now() - statSync(p).mtimeMs < STALE_MS) continue; // in use — leave it
    rmSync(p, { recursive: true, force: true });
  } catch {
    /* in use / racing — leave it */
  }
}

let serveUrl;
const browser = await openBrowser("chrome");
try {
  console.log("· bundling…");
  serveUrl = await bundle({ entryPoint: join(root, "src", "index.ts") });
  const composition = await selectComposition({ serveUrl, id: Pascal, puppeteerInstance: browser });
  const outDir = join(root, "projects", name, "preview");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${name}${final ? "_FINAL" : ""}.mp4`);
  const progPath = join(outDir, ".progress");
  const setProg = (n) => { try { writeFileSync(progPath, String(n)); } catch { /* noop */ } };
  console.log(`· rendering ${(composition.durationInFrames / p.fps).toFixed(1)}s at scale ${scale}…`);
  const denoise = !args.includes("--no-denoise");
  const rawOut = denoise ? outPath.replace(/\.mp4$/, ".raw.mp4") : outPath;
  setProg(0);
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: rawOut,
    scale,
    crf: Number(opt("crf", final ? 19 : 28)),
    x264Preset: opt("preset", final ? "medium" : "veryfast"),
    puppeteerInstance: browser,
    onProgress: (() => {
      let last = -1;
      return ({ progress }) => {
        const n = Math.round(progress * 100);
        if (n === last) return;
        setProg(n);
        if (n % 10 === 0) console.log(`  render ${n}%`);
        last = n;
      };
    })(),
  });
  setProg(denoise ? 96 : 100);

  if (denoise) {
    // gentle: rumble/hum out, street ambience LEFT IN (CLAUDE.md §1)
    const strong = args.includes("--denoise-strong");
    const af = [
      "highpass=f=80",
      `afftdn=nf=${strong ? -30 : -21}:tn=1`,
      "acompressor=threshold=-20dB:ratio=2.5:attack=15:release=200:makeup=2",
      "alimiter=limit=0.97",
    ].join(",");
    // the bundled @remotion ffmpeg is --disable-filters (scale/concat only) —
    // these filters need a real build. Prefer system ffmpeg.
    let ff = "ffmpeg";
    try {
      execFileSync(ff, ["-version"], { stdio: "ignore" });
    } catch {
      ff = readdirSync(join(root, "node_modules", "@remotion"))
        .filter((d) => d.startsWith("compositor-"))
        .map((d) => join(root, "node_modules", "@remotion", d, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"))
        .find(existsSync);
      console.warn("· ⚠ system ffmpeg not found — trying bundled (may lack audio filters)");
    }
    console.log(`· audio cleanup${strong ? " (strong)" : ""}: ${af}`);
    try {
      execFileSync(
        ff,
        ["-hide_banner", "-loglevel", "error", "-y", "-i", rawOut, "-af", af, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", outPath],
        { stdio: ["ignore", "ignore", "inherit"] },
      );
      rmSync(rawOut, { force: true });
    } catch (e) {
      console.warn(`· ⚠ audio cleanup failed (${String(e.message).split("\n")[0]}) — keeping raw audio`);
      rmSync(outPath, { force: true });
      renameSync(rawOut, outPath);
    }
  }
  console.log(`✓ ${outPath}  (${composition.width * scale}x${composition.height * scale})`);
} finally {
  await browser.close({ silent: true });
  restore();
  try { rmSync(join(root, "projects", name, "preview", ".progress"), { force: true }); } catch { /* noop */ }
  rmSync(compDir, { recursive: true, force: true });
  // drop this run's bundle copy (and its sibling asset dir) so the disk doesn't creep
  if (serveUrl) {
    try {
      rmSync(serveUrl, { recursive: true, force: true });
    } catch {
      /* noop */
    }
  }
}
