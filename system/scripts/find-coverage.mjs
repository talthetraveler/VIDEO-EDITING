#!/usr/bin/env node
// WHICH OTHER CAMERA WAS ROLLING ON THIS?
//
//   node scripts/find-coverage.mjs              # every project, unused coverage
//   node scripts/find-coverage.mjs <slug>
//   node scripts/find-coverage.mjs --clip <id>
//
// Tal, 2026-09-21, on coffee-kindness:
//   *"why did you use the video of the Muslim guy helping me and then you
//   didn't use the Sony camera? You should use both, because sometimes it's
//   too dark in that video and then you try to change it up but it wasn't
//   good. You should be using mostly the Sony camera video, like the long
//   lens — that's just so much better."*
//
// He is right, and it was not a judgement call, it was a blind spot: I never
// checked whether a second camera existed. It did. C0481.MP4 is 438s of Sony
// on the SAME conversation as the 298s Meta-glasses clip I cut, and the
// difference is not subtle:
//
//     glasses (VID_2026...)  mean luma 48      <- what I used, then graded
//     Sony    (C0481.MP4)    mean luma 113     <- correctly exposed, long lens
//
// Grading a 2.4x underexposed camera is not colour work, it is damage control.
// CLAUDE.md §3 already said camera choice is never finalised automatically —
// but with no tool to find the alternates, the rule had nothing to act on.
//
// HOW IT MATCHES. Two clips cover the same interaction when their transcripts
// share distinctive phrases. Common words ("yes", "thank you", "shalom") are
// everywhere in this footage, so matching is on rare 4-word shingles: the
// score is how many of clip A's rare shingles appear in clip B.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const TRANS = join(ROOT, "projects/_frameio/cache/transcripts");
const INDEX = join(ROOT, "projects/_frameio/cache/discover-index.json");

const idx = JSON.parse(readFileSync(INDEX, "utf8"));
const items = Array.isArray(idx) ? idx : (idx.files ?? Object.values(idx)[0]);
const NAME = new Map(items.map((i) => [i.id, i.name]));
const SIZE = new Map(items.map((i) => [i.id, i.size_mb]));

// A CLIP ALREADY ON THIS DISK IS THE SAME FILM AS ITS FRAME.IO TWIN.
// Beats may refer to a clip either by its Frame.io uuid or by a local id
// ("local-<hash>", from scripts/transcribe-local.mjs). Those are the SAME
// footage. Without this the tool reported every phone-booth project as having
// "100% unused SONY coverage" from C0247/C0251/C0256 — when the edit was
// already cut from exactly those files, just referenced by their local path.
// A false gap is worse than no tool: it sends you re-cutting something that
// was never broken.
const LOCAL = existsSync(join(ROOT, "projects/_frameio/cache/local-sources.json"))
  ? JSON.parse(readFileSync(join(ROOT, "projects/_frameio/cache/local-sources.json"), "utf8"))
  : {};
// Split on BOTH separators. local-sources.json stores Windows paths
// ("C:\Users\...\C0247.MP4"); splitting on "/" alone leaves the whole path, so
// it never matched the Frame.io name and every phone-booth film was reported
// as a camera gap it did not have.
const SEP = new RegExp("[" + String.fromCharCode(92, 92) + "/]");
const base = (p) => String(p).split(SEP).pop().toLowerCase();
const FILE_OF = new Map();                       // any id -> its filename
for (const [id, v] of Object.entries(LOCAL)) if (v?.path) FILE_OF.set(id, base(v.path));
for (const i of items) FILE_OF.set(i.id, String(i.name).toLowerCase());
/** true when two ids are the same underlying file */
const sameFile = (a, b) => {
  const fa = FILE_OF.get(a), fb = FILE_OF.get(b);
  return !!fa && fa === fb;
};

/** Which camera shot this, from the filename convention on these shoots. */
export function camera(name = "") {
  if (/^C\d{4}\./i.test(name)) return "SONY";        // Sony body, long lens
  if (/^VID_\d{8}_/.test(name)) return "GLASSES";    // Meta Ray-Ban POV
  if (/^IMG_/.test(name)) return "IPHONE";
  return "OTHER";
}

const STOP = new Set(("the a an and or but to of in on at for from with is are was were be " +
  "i you he she it we they me him her them us my your his its our their this that " +
  "what how why when where who yes no ok okay so do does did have has had will " +
  "would can could not very just like thank thanks you're i'm it's").split(" "));

function text(id) {
  const p = join(TRANS, `${id}.json`);
  if (!existsSync(p)) return "";
  try {
    const t = JSON.parse(readFileSync(p, "utf8"));
    if (t.text) return String(t.text);
    if (t.segments?.length) return t.segments.map((s) => s.text ?? "").join(" ");
    return (t.words ?? []).map((w) => w.word ?? "").join(" ");
  } catch { return ""; }
}

const words = (s) => String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);

/** Rare 4-word shingles — distinctive enough that a shared one means a shared moment. */
function shingles(s) {
  const w = words(s), out = new Set();
  for (let i = 0; i + 4 <= w.length; i++) {
    const g = w.slice(i, i + 4);
    if (g.filter((x) => !STOP.has(x)).length < 2) continue;   // too generic
    out.add(g.join(" "));
  }
  return out;
}

const CACHE = new Map();
const shOf = (id) => {
  if (!CACHE.has(id)) CACHE.set(id, shingles(text(id)));
  return CACHE.get(id);
};

/** Clips that cover the same interaction as `id`, best first. */
export function coverageFor(id, { min = 0.06 } = {}) {
  const a = shOf(id);
  if (a.size < 6) return [];
  const out = [];
  for (const it of items) {
    if (it.id === id) continue;
    const b = shOf(it.id);
    if (b.size < 6) continue;
    let hit = 0;
    for (const g of a) if (b.has(g)) hit++;
    const score = hit / a.size;
    if (score >= min) out.push({ id: it.id, name: it.name, cam: camera(it.name), score, shared: hit });
  }
  return out.sort((x, y) => y.score - x.score);
}

// ---------------------------------------------------------------- reporting
const arg = process.argv[2];

if (arg === "--clip") {
  const id = process.argv[3];
  console.log(`\n${NAME.get(id) ?? id}  [${camera(NAME.get(id))}]\n`);
  for (const c of coverageFor(id).slice(0, 8)) {
    console.log(`  ${(c.score * 100).toFixed(0).padStart(3)}%  ${c.cam.padEnd(8)} ${c.name.padEnd(32)} ${c.shared} shared phrases  ${SIZE.get(c.id) ?? "?"}MB`);
  }
  process.exit(0);
}

const slugs = readdirSync(join(ROOT, "projects")).filter((s) => {
  if (s.startsWith("_")) return false;
  const d = join(ROOT, "projects", s);
  return statSync(d).isDirectory() && existsSync(join(d, "edit.json")) && (!arg || s === arg);
});

console.log(`\nSECOND-CAMERA COVERAGE — ${slugs.length} project(s)\n`);
let gaps = 0;
for (const slug of slugs) {
  const cfg = JSON.parse(readFileSync(join(ROOT, "projects", slug, "edit.json"), "utf8"));
  const used = new Set((cfg.beats ?? []).map((b) => b[0]).filter((x) => x && x !== "CARD"));
  const found = new Map();
  for (const id of used) {
    for (const c of coverageFor(id)) {
      if (used.has(c.id)) continue;                 // already in the edit
      if ([...used].some((u) => sameFile(u, c.id))) continue;   // same file, other id
      const prev = found.get(c.id);
      if (!prev || c.score > prev.score) found.set(c.id, c);
    }
  }
  const alts = [...found.values()].sort((a, b) => b.score - a.score);
  const better = alts.filter((c) => c.cam === "SONY");
  const usedCams = [...used].map((id) => camera(NAME.get(id))).join(",");
  if (!alts.length) { console.log(`ok   ${slug.padEnd(26)} [${usedCams}]  no other camera found`); continue; }
  gaps++;
  console.log(`GAP  ${slug.padEnd(26)} [${usedCams}]`);
  for (const c of alts.slice(0, 4)) {
    const flag = c.cam === "SONY" ? "  <-- SONY, likely better exposed" : "";
    console.log(`       ${(c.score * 100).toFixed(0).padStart(3)}%  ${c.cam.padEnd(8)} ${c.name.padEnd(30)} ${SIZE.get(c.id) ?? "?"}MB${flag}`);
  }
  if (better.length) console.log(`       ^ ${better.length} unused SONY clip(s) on this interaction`);
}
console.log(`\n${gaps} project(s) have unused coverage from another camera.`);
