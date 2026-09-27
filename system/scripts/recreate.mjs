#!/usr/bin/env node
/**
 * ONE COMMAND — folder of footage + a reference video → a MAIN + TRIAL edit that
 * follows the reference's *style* (pacing, arc, caption feel, music), built from
 * YOUR clips. The reference is analysed, never copied.
 *
 *   node scripts/recreate.mjs --folder "<dir>" --reference "<file-or-URL>" --slug <name>
 *        [--title "…"] [--house-music] [--no-multisource] [--render]
 *
 * Pipeline
 *   1. analyse the reference        → scratch/refs/<slug>/recipe.json
 *      (cuts/min, median shot, wpm, narration?, 4-act arc, extracted music bed)
 *   2. index the folder             → tighten --batch  (transcripts + kept spans)
 *   3. detect multi-source scenes   → same moment from 2 cameras (POV ↔ zoom)
 *   4. match clips to the arc + apply the reference pacing
 *   5. assemble  projects/<slug>-a  (MAIN, arc order)
 *              projects/<slug>-b    (TRIAL, hook-first ≤45s)
 *   6. --render → proxies on http://localhost:4100
 *
 * Honest scope: for a talking-to-camera reference this is close to hands-off.
 * For a dense montage / heavy motion-graphics reference it produces a first cut
 * on the right rhythm and arc — refine it on the :4100 timeline after.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { analyzeReference } from "./lib/refscan.mjs";
import { groupScenes, interleaveScene } from "./lib/multisource.mjs";
import { buildProject, paceSpan } from "./lib/build-project.mjs";
import { saveProject } from "./lib/project.mjs";
import { mergeTokensToWords } from "./lib/autocut-core.mjs";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const has = (n) => args.includes(`--${n}`);
const round = (n) => Math.round(n * 1000) / 1000;

const folder = opt("folder");
const reference = opt("reference");
const slug = (opt("slug", folder ? basename(folder) : "recreate") || "recreate")
  .replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const title = opt("title", "");
const wantRender = has("render");
const wantMulti = !has("no-multisource");
const houseMusic = has("house-music");
if (!folder || !existsSync(folder) || !reference) {
  console.error('Usage: node scripts/recreate.mjs --folder "<dir>" --reference "<file|URL>" --slug <name> [--title "…"] [--house-music] [--render]');
  process.exit(1);
}

// ---- 1. reference recipe --------------------------------------------
const refDir = join(ROOT, "scratch", "refs", slug);
mkdirSync(refDir, { recursive: true });
const recipePath = join(refDir, "recipe.json");
let recipe;
if (existsSync(recipePath) && !has("re-analyze")) {
  recipe = JSON.parse(readFileSync(recipePath, "utf8"));
  console.log(`· reusing cached recipe (${recipePath})`);
} else {
  recipe = await analyzeReference(reference, slug);
  writeFileSync(recipePath, JSON.stringify(recipe, null, 2));
}
console.log(
  `· recipe: ${recipe.density} · ${recipe.cutsPerMin} cuts/min · median shot ${recipe.medianShotS}s · ` +
    `${recipe.hasNarration ? recipe.wpm + " wpm narration" : "no narration"} · ${recipe.acts.length} acts` +
    (recipe.music ? ` · music ${recipe.music.energy}` : ""),
);

// ---- 2. index the folder ------------------------------------------
const idxSlug = `recreate-${slug}`;
const fdir = join(ROOT, "public", "footage", idxSlug);
const idxFile = join(fdir, `${idxSlug}.index.json`);
if (!existsSync(idxFile) || has("re-index")) {
  console.log(`· indexing the folder (whisper) — ${readdirSync(folder).filter((f) => /\.(mp4|mov|m4v|mkv|webm|avi)$/i.test(f)).length} clips`);
  const r = spawnSync(process.execPath, [join(ROOT, "scripts", "tighten.mjs"), "--batch", folder, "--slug", idxSlug, "--model", "small"], {
    cwd: ROOT, stdio: "inherit",
  });
  if (r.status !== 0) { console.error("✗ folder indexing failed"); process.exit(1); }
}
const index = JSON.parse(readFileSync(idxFile, "utf8"));

// SOURCE-time WORD-LEVEL words per clip (merge whisper BPE tokens first)
const wordsByName = {};
for (const c of index.clips) {
  const f = join(fdir, `${c.name}.captions.raw.json`);
  const toks = existsSync(f)
    ? JSON.parse(readFileSync(f, "utf8"))
        .filter((x) => x.endMs > x.startMs && /[a-z0-9]/i.test(x.text || ""))
        .map((x) => ({ word: x.text || "", start: x.startMs / 1000, end: x.endMs / 1000 }))
    : [];
  wordsByName[c.name] = mergeTokensToWords(toks).map((w) => ({ text: w.word, start: w.start, end: w.end }));
}
const clipPath = (c) => join(ROOT, "public", c.src);

// ---- 3. multi-source scenes -------------------------------------
let scenes;
if (wantMulti) {
  scenes = groupScenes(index.clips.map((c) => ({ name: c.name, path: clipPath(c), transcript: c.transcript, dur: c.originalSeconds, src: c.src })));
  const multi = scenes.filter((s) => s.multi);
  if (multi.length) console.log(`· multi-source: ${multi.length} scene(s) shot from 2 angles → will cut between them`);
  else console.log("· multi-source: none detected (single-camera folder)");
} else {
  scenes = index.clips.map((c, i) => ({ id: `sc${i + 1}`, clips: [{ name: c.name, src: c.src, dur: c.originalSeconds, role: "solo", meta: { dur: c.originalSeconds } }] }));
}

// ---- 4. score + order scenes to the arc ------------------------
const SIGNAL = /\b(safe|love|home|first time|never|always|family|peace|welcome|human|free|proud|scared|afraid|beautiful|amazing|together|truth|believe|kind|surprised|why|because)\b/i;
const scoreClip = (name) => {
  const c = index.clips.find((x) => x.name === name);
  if (!c) return -1;
  const ws = wordsByName[name] || [];
  if (ws.length < 4) return 0.2; // near-silent b-roll — still usable, low rank
  const first = ws.slice(0, 12).map((w) => w.text).join(" ");
  let s = 1;
  if (SIGNAL.test(c.transcript)) s += 2;
  if (SIGNAL.test(first)) s += 2; // strong opening line
  if (/\?$|\?"?\s/.test(first)) s += 1;
  if (c.keptSeconds >= 6 && c.keptSeconds <= 60) s += 1;
  if ((c.greetings || []).length) s += 1;
  return s;
};
const sceneScore = (sc) => Math.max(...sc.clips.map((c) => scoreClip(c.name)));
scenes.forEach((sc) => (sc.score = sceneScore(sc)));
const ranked = [...scenes].sort((a, b) => b.score - a.score);
const hookScene = ranked[0];
const body = ranked.slice(1).sort((a, b) => {
  // keep body roughly in capture order after the hook
  const an = a.clips[0].name, bn = b.clips[0].name;
  return an.localeCompare(bn);
});
const order = [hookScene, ...body];

// ---- 5. build shots at the reference pacing -------------------
const targetShot = recipe.density === "fast" ? Math.max(1.1, recipe.medianShotS) : recipe.density === "medium" ? Math.max(1.8, recipe.medianShotS) : Math.max(3, recipe.medianShotS);
const targetTotal = Math.min(recipe.durationS * 1.25 || 120, 150); // don't overrun the reference length by much

const buildShots = (sceneList, cap) => {
  const shots = [];
  let tl = 0;
  for (const sc of sceneList) {
    if (tl >= cap) break;
    if (sc.multi && sc.clips.length >= 2) {
      const plan = interleaveScene(sc, (cl) => wordsByName[cl.name] || [], { pace: targetShot * 2.2 });
      for (const sh of plan) { shots.push(sh); tl += sh.out - sh.in; if (tl >= cap) break; }
      continue;
    }
    const cl = sc.clips[0];
    const c = index.clips.find((x) => x.name === cl.name);
    if (!c || !c.segments || !c.segments.length) continue;
    for (const [s, e] of c.segments) {
      const paced = paceSpan(cl.src, s, e, wordsByName[cl.name] || [], targetShot);
      for (const sh of paced) { shots.push(sh); tl += sh.out - sh.in; if (tl >= cap) break; }
      if (tl >= cap) break;
    }
  }
  return shots;
};

const mainShots = buildShots(order, targetTotal);
if (!mainShots.length) { console.error("✗ nothing usable in the folder"); process.exit(1); }

const music = houseMusic || !recipe.music ? null : { src: recipe.music.src, volume: 0.08, duck: true };
const mkTitle = title || "ADD TITLE ✏️";

const M = buildProject(mainShots, { slug: `${slug}-a`, title: mkTitle, brief: `recreate: ${basename(folder)} in the style of ${recipe.reference}`, music });
saveProject(`${slug}-a`, M, { label: "recreate MAIN", isDraft: true });
console.log(`✓ projects/${slug}-a — ${M.tracks.video.length} shots · ${M.duration}s · ${M.tracks.captions.length} caption groups${music ? " · reference music" : ""}`);

// ---- TRIAL: hook-first, snappier, ≤45s -----------------------
const trialOrder = [hookScene, ...body.slice(0, 3)];
const trialShots = buildShots(trialOrder, 45).slice(0, 60);
if (trialShots.length) {
  const T = buildProject(trialShots, { slug: `${slug}-b`, title: title || "HOW IT STARTED", brief: "recreate TRIAL (hook-first)", music });
  saveProject(`${slug}-b`, T, { label: "recreate TRIAL", isDraft: true });
  console.log(`✓ projects/${slug}-b — ${T.tracks.video.length} shots · ${T.duration}s · ${T.tracks.captions.length} caption groups`);
}

// ---- 6. render + queue --------------------------------------
if (wantRender) {
  const B = join(ROOT, "scratch", "batch");
  const PREV = join(B, "previews");
  mkdirSync(PREV, { recursive: true });
  for (const [v, V] of [["a", "A"], ...(trialShots.length ? [["b", "B"]] : [])]) {
    console.log(`· rendering ${slug}-${v}…`);
    const r = spawnSync(process.execPath, [join(ROOT, "scripts", "proj-render.mjs"), `${slug}-${v}`, "--scale", "0.4"], { cwd: ROOT, stdio: "inherit" });
    if (r.status === 0) {
      const o = join(ROOT, "projects", `${slug}-${v}`, "preview", `${slug}-${v}.mp4`);
      if (existsSync(o)) execFileSync(process.execPath, ["-e", `require('fs').copyFileSync(${JSON.stringify(o)},${JSON.stringify(join(PREV, `${slug}-${V}.mp4`))})`]);
    }
  }
  const qp = join(B, "queue.json");
  const q = existsSync(qp) ? JSON.parse(readFileSync(qp, "utf8")) : [];
  if (!q.find((x) => x.slug === slug)) { q.push({ slug, title: title || `⚠ set title — ${slug}` }); writeFileSync(qp, JSON.stringify(q, null, 2)); }
  console.log("✓ on the dashboard — http://localhost:4100");
}

console.log(`\nrecipe: ${recipePath}`);
console.log(`review + refine on the timeline at http://localhost:4100  (or: node scripts/proj-render.mjs ${slug}-a)`);
