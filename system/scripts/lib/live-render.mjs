/**
 * Warm-bundle fast re-render.
 *
 * The batch path (scripts/proj-render.mjs) bundles public/ (~5 GB, ≈90 s) and
 * rewrites src/Root.tsx on EVERY render. For the review dashboard's
 * "Apply + re-render" that is the whole latency. This module bundles ONCE per
 * process, then every re-render just passes the project timeline as inputProps
 * to renderMedia against the warm serveUrl. Seconds, not minutes. No Root.tsx
 * rewrite, so the truncation-risk is gone too.
 *
 *   import { warmup, renderLive } from "./lib/live-render.mjs";
 *   await warmup();                       // once, at server startup
 *   await renderLive("v02-morocco-a", { scale: 0.5, outPath, onLog });
 *
 * Renders are serialised (shared browser instance).
 */
import { mkdirSync, rmSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import { loadProject, loadPreset } from "./project.mjs";
import { pickEmphasis } from "./emphasis.mjs";

const ROOT = process.cwd();

// ---- build the ProjectData blob the <Live> composition receives as inputProps
//      (mirrors the `data` object in scripts/proj-render.mjs) ----
export const projectToData = (name) => {
  const p = loadProject(name);
  const captionPreset = loadPreset("caption", p.caption_style ?? "tal_phrase");
  const titlePreset = loadPreset("title", p.title_style ?? "tal_top_title");
  const titleStyleIds = [
    ...new Set([p.title_style ?? "tal_top_title", ...(p.tracks.title ?? []).map((t) => t.style).filter(Boolean)]),
  ];
  const titlePresets = Object.fromEntries(titleStyleIds.map((id) => [id, loadPreset("title", id)]));
  // NAS-Daily style: static yellow span per card. Auto-pick unless hand-set.
  // Index against the SAME tokens CaptionLayer renders (words[] when present —
  // they keep the original casing; c.text is stored ALL-CAPS).
  const emphSrc = (c) => (c.words?.length ? c.words.map((w) => w.text).join(" ") : c.text);
  const captions = (p.tracks.captions ?? []).map((c) =>
    captionPreset.highlight === "keyword" && !c.emphasis ? { ...c, emphasis: pickEmphasis(emphSrc(c)) } : c,
  );
  return {
    fps: p.fps,
    width: p.width,
    height: p.height,
    duration: p.duration,
    handle: p.handle ?? null,
    music: p.tracks.music?.[0]?.src ? { src: p.tracks.music[0].src, volume: p.tracks.music[0].volume ?? 0.1, duck: p.tracks.music[0].duck ?? true } : null,
    dub: p.dub?.src ? { lang: p.dub.lang, src: p.dub.src } : null,
    captionLang: p.caption_lang ?? null,
    tracks: {
      video: p.tracks.video,
      broll: p.tracks.broll ?? [],
      title: p.tracks.title ?? [],
      captions,
    },
    captionPreset,
    titlePreset,
    titlePresets,
  };
};

// ---- one warm bundle per process ----
let warmServe = null;
let warming = null;

const sweepStaleBundles = () => {
  const tmp = tmpdir();
  for (const d of readdirSync(tmp)) {
    if (/^remotion-(webpack-bundle-|v[\d.]+-assets)/.test(d)) {
      try {
        rmSync(join(tmp, d), { recursive: true, force: true });
      } catch {
        /* in use — leave it */
      }
    }
  }
};

export const warmup = async (log = console.log) => {
  if (warmServe) return warmServe;
  if (warming) return warming;
  warming = (async () => {
    sweepStaleBundles();
    log("· warm bundle: building once (this is the only slow bundle)…");
    const t0 = Date.now();
    warmServe = await bundle({ entryPoint: join(ROOT, "src", "index.ts") });
    log(`· warm bundle ready in ${((Date.now() - t0) / 1000).toFixed(0)}s → re-renders are now fast`);
    warming = null;
    return warmServe;
  })();
  return warming;
};

export const isWarm = () => !!warmServe;

// ---- reusable browser (recreated if a render throws) ----
let browser = null;
const getBrowser = async () => {
  if (browser) return browser;
  browser = await openBrowser("chrome");
  return browser;
};
const dropBrowser = async () => {
  try {
    await browser?.close({ silent: true });
  } catch {
    /* noop */
  }
  browser = null;
};

// ---- serialised render queue (shared browser) ----
let chain = Promise.resolve();

/**
 * Re-render <name>'s project.json to outPath against the warm bundle.
 * scale 0.5 → 540×960. Returns { ok, ms, error }.
 */
export const renderLive = (name, { scale = 0.5, outPath, crf = 30, onLog = () => {}, onProgress = () => {} } = {}) => {
  const job = chain.then(async () => {
    const t0 = Date.now();
    if ((1080 * scale) % 2 !== 0) return { ok: false, error: `scale ${scale} → non-even width` };
    const progPath = join(dirname(outPath), ".progress");
    const setProg = (n) => { try { mkdirSync(dirname(outPath), { recursive: true }); writeFileSync(progPath, String(n)); } catch { /* noop */ } };
    try {
      await warmup(onLog);
      const data = projectToData(name);
      const br = await getBrowser();
      const composition = await selectComposition({
        serveUrl: warmServe,
        id: "Live",
        inputProps: data,
        puppeteerInstance: br,
      });
      mkdirSync(dirname(outPath), { recursive: true });
      onLog(`· fast re-render ${name}: ${(composition.durationInFrames / data.fps).toFixed(1)}s @ scale ${scale}\n`);
      setProg(0);
      await renderMedia({
        composition,
        serveUrl: warmServe,
        codec: "h264",
        outputLocation: outPath,
        inputProps: data,
        scale,
        crf,
        x264Preset: "veryfast",
        puppeteerInstance: br,
        onProgress: ({ progress }) => { const n = Math.round(progress * 100); setProg(n); onProgress(n); },
      });
      try { rmSync(progPath, { force: true }); } catch { /* noop */ }
      const ms = Date.now() - t0;
      onLog(`✓ ${outPath} in ${(ms / 1000).toFixed(1)}s\n`);
      return { ok: true, ms };
    } catch (e) {
      await dropBrowser(); // a hung/broken headless-chrome is the #1 repeat-failure cause
      try { rmSync(progPath, { force: true }); } catch { /* noop */ }
      onLog(`✗ fast re-render ${name} failed: ${String(e.message).split("\n")[0]}\n`);
      return { ok: false, error: String(e.message).split("\n")[0], ms: Date.now() - t0 };
    }
  });
  chain = job.catch(() => {});
  return job;
};

export const shutdownLive = async () => {
  await dropBrowser();
  if (warmServe) {
    try {
      rmSync(warmServe, { recursive: true, force: true });
    } catch {
      /* noop */
    }
    warmServe = null;
  }
};
