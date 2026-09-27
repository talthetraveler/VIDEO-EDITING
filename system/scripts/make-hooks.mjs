#!/usr/bin/env node
/**
 * Extra HOOK variations of a finished video — same interview, different cold open.
 *
 *   node scripts/make-hooks.mjs <slug> [--count 2] [--from a] [--render]
 *
 * Reads projects/<slug>-<from>/project.json, scores its caption lines as
 * cold-opens, and for the top N (skipping the one -b already uses) writes
 * projects/<slug>-c, -d, … : that line's clip lifted to the front, capped ~45s,
 * recaptioned. Feeds the "post many variations, keep what performs" loop.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pickEmphasis } from "./lib/emphasis.mjs";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const count = Number(opt("count", "2"));
const from = opt("from", "a");
const wantRender = args.includes("--render");
if (!slug) { console.error("Usage: node scripts/make-hooks.mjs <slug> [--count 2] [--render]"); process.exit(1); }

const baseDir = join(ROOT, "projects", `${slug}-${from}`);
if (!existsSync(join(baseDir, "project.json"))) { console.error(`no project ${slug}-${from}`); process.exit(1); }
const base = JSON.parse(readFileSync(join(baseDir, "project.json"), "utf8"));

// clip index for a timeline time
const clipAt = (t) => {
  let acc = 0;
  for (let i = 0; i < base.tracks.video.length; i++) {
    const c = base.tracks.video[i];
    const d = (c.sourceOut - c.sourceIn) / (c.speed || 1);
    if (t >= acc - 0.05 && t < acc + d + 0.05) return i;
    acc += d;
  }
  return base.tracks.video.length - 1;
};

const total = base.duration || 60;
const SIGNAL = /\b(safe|love|home|first time|never|always|family|peace|welcome|human|free|proud|scared|afraid|beautiful|amazing|together|truth|believe|kind|surprised|feel|because)\b/i;
const cands = [];
for (const g of base.tracks.captions) {
  if (g.start < total * 0.35) continue; // a later line as the cold open = tension
  const wc = g.text.split(/\s+/).length;
  if (wc < 3 || wc > 13) continue;
  let sc = 0;
  if (/[.?!]$/.test(g.text.trim())) sc += 2;
  if (SIGNAL.test(g.text)) sc += 2;
  if (pickEmphasis(g.words?.length ? g.words.map((w) => w.text).join(" ") : g.text).length) sc += 1;
  if (g.start > total * 0.6) sc += 1;
  const ci = clipAt(g.start);
  cands.push({ text: g.text.trim(), start: g.start, clip: ci, score: sc });
}
// one candidate per clip, best line; sorted by score
const byClip = {};
for (const c of cands) if (!byClip[c.clip] || c.score > byClip[c.clip].score) byClip[c.clip] = c;
let picks = Object.values(byClip).sort((a, b) => b.score - a.score);

// skip the clip -b already opens on
if (existsSync(join(ROOT, "projects", `${slug}-b`, "project.json"))) {
  try {
    const b = JSON.parse(readFileSync(join(ROOT, "projects", `${slug}-b`, "project.json"), "utf8"));
    const bOpenSrc = b.tracks.video[0]?.src;
    picks = picks.filter((p) => base.tracks.video[p.clip]?.src !== bOpenSrc);
  } catch { /* noop */ }
}
picks = picks.slice(0, count);
if (!picks.length) { console.log("no distinct extra hook found"); process.exit(0); }

const letters = ["c", "d", "e", "f", "g"];
const run = (proj, a) => spawnSync(process.execPath, [join(ROOT, "scripts", "proj-op.mjs"), proj, ...a], { cwd: ROOT, stdio: "pipe" });
const made = [];
picks.forEach((pk, i) => {
  const v = letters[i];
  const proj = `${slug}-${v}`;
  const dir = join(ROOT, "projects", proj);
  rmSync(dir, { recursive: true, force: true });
  cpSync(baseDir, dir, { recursive: true });
  // fresh id + drop stale meta/revisions so it's a clean draft
  const p = JSON.parse(readFileSync(join(dir, "project.json"), "utf8"));
  p.id = proj;
  writeFileSync(join(dir, "project.json"), JSON.stringify(p, null, 2));
  rmSync(join(dir, "revisions"), { recursive: true, force: true });
  rmSync(join(dir, "meta.json"), { force: true });
  rmSync(join(dir, "AI_DRAFT.json"), { force: true });

  const hookClipId = p.tracks.video[pk.clip].id;
  run(proj, ["move_clip", "--clip", hookClipId, "--to", "0"]);
  // cap ~45s — delete trailing clips
  let acc = 0;
  const keep = [];
  const cur = JSON.parse(readFileSync(join(dir, "project.json"), "utf8"));
  for (const c of cur.tracks.video) {
    const d = (c.sourceOut - c.sourceIn) / (c.speed || 1);
    if (acc > 45 && keep.length) break;
    keep.push(c.id);
    acc += d;
  }
  for (const c of cur.tracks.video) if (!keep.includes(c.id)) run(proj, ["delete_clip", "--clip", c.id]);
  run(proj, ["set_title_text", "--text", "HOW IT STARTED"]);
  spawnSync(process.execPath, [join(ROOT, "scripts", "proj-recaption.mjs"), proj, "--style", "nas_caption"], { cwd: ROOT, stdio: "inherit" });
  const done = JSON.parse(readFileSync(join(dir, "project.json"), "utf8"));
  made.push({ proj, hook: pk.text, dur: done.duration, clips: done.tracks.video.length });
  console.log(`✓ ${proj} — opens on "${pk.text}" · ${done.duration}s · ${done.tracks.video.length} clips`);
});

if (wantRender) {
  const PREV = join(ROOT, "scratch", "batch", "previews");
  mkdirSync(PREV, { recursive: true });
  for (const m of made) {
    spawnSync(process.execPath, [join(ROOT, "scripts", "proj-render.mjs"), m.proj, "--scale", "0.4"], { cwd: ROOT, stdio: "inherit" });
    const o = join(ROOT, "projects", m.proj, "preview", `${m.proj}.mp4`);
    const V = m.proj.slice(-1).toUpperCase(); // -c → C
    if (existsSync(o)) cpSync(o, join(PREV, `${slug}-${V}.mp4`));
  }
}
console.log(`\n${made.length} hook variation(s). Schedule them with: node scripts/schedule-trials.mjs --only ${slug}`);
