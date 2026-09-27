/**
 * Analyse a REFERENCE video into a reusable "recipe" — pacing, arc, caption
 * style hint, and its music bed. The reference is NEVER copied into the output;
 * only its structure and (with the user's say-so) its music track are used.
 *
 *   const recipe = await analyzeReference(pathOrUrl, "myslug");
 *
 * recipe = {
 *   durationS, cutsPerMin, medianShotS, shortShotS, longShotS,
 *   wpm, hasNarration, density: "calm"|"medium"|"fast",
 *   acts: [{ startS, endS, label }],
 *   music: { src, energy: "low"|"mid"|"high", mood } | null,
 *   captionHint: "keyword" | "none",
 * }
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, copyFileSync, readdirSync, rmSync } from "node:fs";
import { join, basename, extname } from "node:path";

const ROOT = process.cwd();
const round = (n) => Math.round(n * 100) / 100;
const ff = (a) => execFileSync("ffmpeg", ["-hide_banner", ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const ffErr = (a) => {
  try {
    return ff(a);
  } catch (e) {
    return String(e.stdout || "") + String(e.stderr || "");
  }
};

export function resolveReference(input, slug) {
  const dir = join(ROOT, "scratch", "refs", slug);
  mkdirSync(dir, { recursive: true });
  const dst = join(dir, "reference.mp4");
  if (/^https?:\/\//i.test(input)) {
    if (!existsSync(dst)) {
      console.log(`· downloading reference: ${input}`);
      const r = spawnSync(
        join(ROOT, "bin", "yt-dlp.exe"),
        ["-f", "bv*[height<=1080]+ba/b[height<=1080]/b", "--merge-output-format", "mp4", "-o", dst, input],
        { cwd: ROOT, stdio: "inherit" },
      );
      if (r.status !== 0 || !existsSync(dst)) throw new Error("yt-dlp failed to fetch the reference");
    }
    return dst;
  }
  if (!existsSync(input)) throw new Error(`reference not found: ${input}`);
  if (!existsSync(dst)) copyFileSync(input, dst);
  return dst;
}

function detectCuts(video) {
  // scdet emits `lavfi.scd.time` per detected scene change. threshold 6 lands
  // near the real cut count on a fast edit; a calm one just reports fewer.
  const out = ffErr(["-i", video, "-vf", "scdet=s=0:threshold=6,metadata=print:file=-", "-f", "null", "-"]);
  const times = [];
  for (const m of out.matchAll(/lavfi\.scd\.time=([\d.]+)/g)) times.push(Number(m[1]));
  return [...new Set(times.map((t) => Math.round(t * 100) / 100))].sort((a, b) => a - b);
}

function probeDuration(video) {
  try {
    return Number(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], {
        encoding: "utf8",
      }).trim(),
    );
  } catch {
    return 0;
  }
}

// momentary loudness curve (1 value / ~0.4 s) from ebur128
function energyCurve(video) {
  const out = ffErr(["-i", video, "-af", "ebur128=metadata=1,ametadata=mode=print:file=-", "-f", "null", "-"]);
  const pts = [];
  let t = null;
  for (const line of out.split("\n")) {
    const mt = line.match(/pts_time:([\d.]+)/);
    if (mt) t = Number(mt[1]);
    const ml = line.match(/lavfi\.r128\.M=(-?[\d.]+)/);
    if (ml && t != null) pts.push({ t, m: Number(ml[1]) });
  }
  return pts;
}

function extractMusic(video, slug) {
  const musDir = join(ROOT, "public", "footage", "music");
  mkdirSync(musDir, { recursive: true });
  const dst = join(musDir, `ref-${slug}.wav`);
  if (existsSync(dst)) return `footage/music/ref-${slug}.wav`;
  const py = join(ROOT, ".venv-dub", "Scripts", "python.exe");
  if (!existsSync(py)) {
    console.log("· (demucs venv missing — skipping reference music extraction)");
    return null;
  }
  const work = join(ROOT, "scratch", "refs", slug, "demucs");
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  console.log("· separating the reference music bed (demucs, CPU — a minute or two)…");
  const r = spawnSync(py, ["-m", "demucs", "--two-stems", "vocals", "-n", "htdemucs", "-o", work, video], {
    cwd: ROOT,
    stdio: "inherit",
    timeout: 20 * 60 * 1000,
  });
  if (r.status !== 0) {
    console.log("· demucs failed — no reference music");
    return null;
  }
  // htdemucs/<name>/no_vocals.wav
  const stem = (() => {
    const a = join(work, "htdemucs");
    if (!existsSync(a)) return null;
    for (const d of readdirSync(a)) {
      const f = join(a, d, "no_vocals.wav");
      if (existsSync(f)) return f;
    }
    return null;
  })();
  if (!stem) return null;
  copyFileSync(stem, dst);
  return `footage/music/ref-${slug}.wav`;
}

export async function analyzeReference(input, slug) {
  const video = resolveReference(input, slug);
  const durationS = probeDuration(video);
  console.log(`· reference: ${round(durationS)}s`);

  const cuts = detectCuts(video);
  const bounds = [0, ...cuts, durationS];
  const shotLens = [];
  for (let i = 1; i < bounds.length; i++) if (bounds[i] - bounds[i - 1] > 0.15) shotLens.push(bounds[i] - bounds[i - 1]);
  shotLens.sort((a, b) => a - b);
  let med = shotLens[Math.floor(shotLens.length / 2)] || durationS;
  const cutsPerMin = durationS ? (cuts.length / durationS) * 60 : 0;
  if (med < 0.8) med = 0.8; // scdet over-counts flashes on kinetic edits — floor the shot length
  console.log(`· ${cuts.length} cuts · ${round(cutsPerMin)} cuts/min · median shot ${round(med)}s`);

  // transcribe (reuse tighten's whisper path — writes .captions.raw.json)
  const refSlug = `_ref-${slug}`;
  const fdir = join(ROOT, "public", "footage", refSlug);
  const name = basename(video, extname(video)).replace(/[^a-z0-9-_]/gi, "_");
  if (!existsSync(join(fdir, `${name}.captions.raw.json`))) {
    console.log("· transcribing the reference (for pacing / narration)…");
    spawnSync(process.execPath, [join(ROOT, "scripts", "tighten.mjs"), video, "--slug", refSlug, "--model", "small"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
  let words = [];
  try {
    words = JSON.parse(readFileSync(join(fdir, `${name}.captions.raw.json`), "utf8")).filter((c) => c.endMs > c.startMs);
  } catch {
    /* no transcript */
  }
  const spoken = words.reduce((n, w) => n + (w.endMs - w.startMs) / 1000, 0);
  const wpm = durationS ? (words.length / durationS) * 60 : 0;
  const hasNarration = durationS > 0 && spoken / durationS > 0.35;

  const density = cutsPerMin >= 34 ? "fast" : cutsPerMin >= 20 ? "medium" : "calm";

  // acts: split on the biggest loudness jumps + long word gaps (max 4 acts)
  const curve = energyCurve(video);
  const acts = [];
  if (durationS) {
    const marks = [0];
    // long silences between words
    for (let i = 1; i < words.length; i++) {
      if (words[i].startMs / 1000 - words[i - 1].endMs / 1000 > 1.6) marks.push(words[i].startMs / 1000);
    }
    // loudness jumps
    for (let i = 4; i < curve.length; i++) {
      if (curve[i].m - curve[i - 4].m > 6) marks.push(curve[i].t);
    }
    marks.push(durationS);
    const uniq = [...new Set(marks.map((m) => Math.round(m)))].sort((a, b) => a - b);
    // keep boundaries that carve roughly equal quarters
    const picks = [0];
    for (const q of [0.25, 0.5, 0.75]) {
      const want = durationS * q;
      picks.push(uniq.reduce((best, m) => (Math.abs(m - want) < Math.abs(best - want) ? m : best), want));
    }
    picks.push(durationS);
    const labels = ["hook / problem", "context", "turn / proof", "payoff / close"];
    for (let i = 0; i < picks.length - 1; i++) {
      if (picks[i + 1] - picks[i] < 2) continue;
      acts.push({ startS: round(picks[i]), endS: round(picks[i + 1]), label: labels[i] || `act ${i + 1}` });
    }
  }

  const musicSrc = extractMusic(video, slug);
  let music = null;
  if (musicSrc) {
    // crude energy read of the extracted bed
    const e = energyCurve(join(ROOT, "public", musicSrc.replace(/^footage\//, "footage/")));
    const avg = e.length ? e.reduce((n, x) => n + x.m, 0) / e.length : -30;
    music = { src: musicSrc, energy: avg > -16 ? "high" : avg > -24 ? "mid" : "low", mood: density === "fast" ? "driving" : "warm" };
  }

  const recipe = {
    reference: basename(video),
    durationS: round(durationS),
    cutsPerMin: round(cutsPerMin),
    medianShotS: round(med),
    shortShotS: round(shotLens[Math.floor(shotLens.length * 0.2)] || med * 0.6),
    longShotS: round(shotLens[Math.floor(shotLens.length * 0.85)] || med * 1.8),
    wpm: round(wpm),
    hasNarration,
    density,
    acts,
    music,
    captionHint: hasNarration ? "keyword" : "none",
  };
  return recipe;
}
