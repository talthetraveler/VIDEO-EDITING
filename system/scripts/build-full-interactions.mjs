#!/usr/bin/env node
/**
 * Build every curated full interaction in scripts/full-interactions.json as a
 * cut-only composition (no captions, no title). One person, one street stop,
 * story order. Long single moments (>13s) are split into ~9s beats so nothing
 * sits static.
 *
 *   node scripts/build-full-interactions.mjs --slug meta-shoot
 *
 * Writes scratch/full/*.json + src/compositions/<slug>/FI*.tsx
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { openDb } from "./lib/db.mjs";

const slug = (() => {
  const i = process.argv.indexOf("--slug");
  return i >= 0 ? process.argv[i + 1] : "meta-shoot";
})();
const root = process.cwd();
const db = openDb(join(root, "public", "footage", slug, "library.db"));
const mom = db.prepare("SELECT clip_id, in_s, out_s, speech FROM moments WHERE id=?");
const wordsOf = db.prepare("SELECT word, start_s, end_s FROM words WHERE clip_id=? AND end_s>start_s ORDER BY idx");

/**
 * Split a long moment into beats at NATURAL pause boundaries (a gap between
 * words > `gap`s), aiming for ~`target`s per beat — never a hard cut mid-word,
 * which is the glitch Tal keeps catching. Also drops dead air > `deadAir`s at
 * the head/tail of the window.
 */
const splitAtPauses = (clipId, inS, outS, { target = 9, gap = 0.4, deadAir = 1.0 } = {}) => {
  const w = wordsOf.all(clipId).filter((x) => x.end_s > inS + 0.02 && x.start_s < outS - 0.02);
  if (w.length < 4) return [[inS, outS]];
  let start = Math.max(inS, w[0].start_s - 0.15);
  const segs = [];
  for (let i = 1; i < w.length; i++) {
    const g = w[i].start_s - w[i - 1].end_s;
    const segLen = w[i - 1].end_s - start;
    if ((g >= gap && segLen >= target) || g >= deadAir) {
      segs.push([+start.toFixed(2), +(w[i - 1].end_s + Math.min(g, 0.3)).toFixed(2)]);
      start = w[i].start_s - 0.1;
    }
  }
  segs.push([+start.toFixed(2), +Math.min(outS, w[w.length - 1].end_s + 0.3).toFixed(2)]);
  // Some people talk 60-90s with NO pause ≥0.4s — splitAtPauses then returns one
  // giant segment. A 73s static shot is its own problem. Hard-chop anything
  // still over 13s into ~11s pieces (a cut between the same speaker keeps
  // energy; it doesn't cut Tal out).
  const out = [];
  for (const [a, b] of segs) {
    if (b - a <= 13) {
      out.push([a, b]);
      continue;
    }
    const n = Math.ceil((b - a) / 11);
    const step = (b - a) / n;
    for (let k = 0; k < n; k++) out.push([+(a + k * step).toFixed(2), +(a + (k + 1) * step).toFixed(2)]);
  }
  return out.filter(([a, b]) => b - a > 0.4);
};
const defs = JSON.parse(readFileSync(join(root, "scripts", "full-interactions.json"), "utf8")).interactions;

const specDir = join(root, "scratch", "full");
rmSync(specDir, { recursive: true, force: true });
mkdirSync(specDir, { recursive: true });

let built = 0;
let failed = 0;
for (const def of defs) {
  // 1. resolve every moment to {clipId, in, out, id}
  const spans = [];
  for (const id of def.moments) {
    const m = mom.get(id);
    if (!m) {
      console.warn(`  ⚠ ${def.name}: unknown ${id}`);
      continue;
    }
    spans.push({ id, clipId: m.clip_id, a: m.in_s, b: m.out_s });
  }
  // 2. merge CONSECUTIVE spans from the same clip that touch — several adjacent
  //    moments off one clip are really one continuous shot, and must be split
  //    as a whole (M0132..M0136 merged into a silent 56s block otherwise).
  const runs = [];
  for (const s of spans) {
    const prev = runs[runs.length - 1];
    if (prev && prev.clipId === s.clipId && s.a <= prev.b + 0.6) {
      prev.b = Math.max(prev.b, s.b);
      prev.ids.push(s.id);
    } else {
      runs.push({ clipId: s.clipId, a: s.a, b: s.b, ids: [s.id] });
    }
  }
  // 3. split each run at pauses / hard-chop, cap the whole interaction at ~82s
  const CAP_S = 82;
  const beats = [];
  let total = 0;
  for (const run of runs) {
    if (total >= CAP_S) break;
    const segs = run.b - run.a > 13 ? splitAtPauses(run.clipId, run.a, run.b) : [[run.a, run.b]];
    for (const [a, b] of segs) {
      if (total >= CAP_S) break;
      // moment_id is only used by build-reel to look up the clip + words; any
      // id whose moment lives on this clip works. Use the run's first.
      beats.push({ moment_id: run.ids[0], in: +a.toFixed(2), out: +b.toFixed(2) });
      total += b - a;
    }
  }
  if (beats.length < 1) {
    failed++;
    continue;
  }
  const specPath = join(specDir, def.name + ".json");
  writeFileSync(
    specPath,
    JSON.stringify({ name: def.name, captions: false, strategy: def.who, moments: beats }, null, 2),
  );
  try {
    const out = execFileSync(process.execPath, [join(root, "scripts", "build-reel.mjs"), "--slug", slug, "--spec", specPath], {
      stdio: ["ignore", "pipe", "pipe"],
    }).toString();
    const b = out.match(/\((\d+) beats, ([\d.]+)s\)/);
    console.log(`  ✓ ${def.name.padEnd(28)} ${b ? b[1].padStart(2) + " beats " + b[2].padStart(5) + "s" : ""}   ${def.who}`);
    built++;
  } catch (e) {
    console.log(`  ✗ ${def.name}: ${String(e.stderr ?? e).split("\n")[0]}`);
    failed++;
  }
}
console.log(`\n${built} full interactions built, ${failed} failed.`);
console.log(`Render: node scripts/render-cuts.mjs --slug ${slug} --dir scratch/full --out output/${slug}/full`);
