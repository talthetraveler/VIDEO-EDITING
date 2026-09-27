#!/usr/bin/env node
/**
 * Read live post analytics from ShortSync and turn them into learnings the next
 * round of variations biases toward. Run this a few days after posts go live.
 *
 *   node scripts/learn-from-analytics.mjs [--days 14]
 *
 * Writes scratch/batch/_learnings.json:
 *   { updatedAt, byProject:{ <project>: {score, views, watch_rate, ...} },
 *     topHooks:[{project, caption, score}], laggards:[...],
 *     nextUp:[<slug>...]   // videos worth more hook variations }
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const B = join(ROOT, "scratch", "batch");
const days = Number((process.argv.find((a) => a.startsWith("--days=")) || "").split("=")[1] || process.argv[process.argv.indexOf("--days") + 1] || 14);

let rows;
try {
  rows = JSON.parse(execFileSync(process.execPath, [join(ROOT, "scripts", "publish.mjs"), "analytics", "--days", String(days)], { cwd: ROOT, encoding: "utf8" }));
} catch (e) {
  console.error("could not pull analytics:", String(e.message).split("\n")[0]);
  process.exit(1);
}
if (!Array.isArray(rows) || !rows.length) {
  console.log("no published-post analytics yet — check back once posts have been live a day or two.");
  process.exit(0);
}

// normalise each metric to 0..1 across the set, then a weighted score
const nums = (k) => rows.map((r) => Number(r[k])).filter((n) => Number.isFinite(n));
const rng = (k) => {
  const v = nums(k);
  if (!v.length) return null;
  const lo = Math.min(...v), hi = Math.max(...v);
  return hi > lo ? { lo, hi } : { lo, hi: lo + 1 };
};
const R = { views: rng("views"), watch_rate: rng("watch_rate"), saves: rng("saves"), shares: rng("shares"), likes: rng("likes"), comments: rng("comments") };
const norm = (r, k) => (R[k] && Number.isFinite(Number(r[k])) ? (Number(r[k]) - R[k].lo) / (R[k].hi - R[k].lo) : 0);
const W = { views: 0.28, watch_rate: 0.3, saves: 0.16, shares: 0.16, comments: 0.06, likes: 0.04 };

for (const r of rows) {
  r.score = +(Object.entries(W).reduce((s, [k, w]) => s + w * norm(r, k), 0)).toFixed(3);
  r.slug = (r.project || "").replace(/-[a-z]$/, "");
}
rows.sort((a, b) => b.score - a.score);

const byProject = {};
for (const r of rows) byProject[r.project || r.id] = { score: r.score, views: r.views, watch_rate: r.watch_rate, saves: r.saves, shares: r.shares, platform: r.platform, caption: r.caption };

// per-slug best score → which videos to invest more variations in
const bySlug = {};
for (const r of rows) {
  if (!r.slug) continue;
  bySlug[r.slug] = Math.max(bySlug[r.slug] ?? 0, r.score);
}
const slugRank = Object.entries(bySlug).sort((a, b) => b[1] - a[1]);
const nextUp = slugRank.filter(([, s]) => s >= (slugRank[0]?.[1] ?? 0) * 0.6).slice(0, 8).map(([s]) => s);

const learnings = {
  updatedAt: new Date().toISOString(),
  window_days: days,
  n: rows.length,
  byProject,
  topHooks: rows.slice(0, 8).map((r) => ({ project: r.project, caption: r.caption, score: r.score, views: r.views, watch_rate: r.watch_rate })),
  laggards: rows.slice(-6).map((r) => ({ project: r.project, caption: r.caption, score: r.score })),
  nextUp, // slugs worth more hook variations
};
writeFileSync(join(B, "_learnings.json"), JSON.stringify(learnings, null, 2));

console.log(`\n══ what's working (last ${days}d, ${rows.length} posts) ══`);
for (const r of rows.slice(0, 8)) console.log(`  ${r.score.toFixed(2)}  ${(r.project || r.id).padEnd(20)} v=${r.views ?? "?"} wr=${r.watch_rate ?? "?"}  "${(r.caption || "").slice(0, 50)}"`);
console.log(`\nmore variations worth making next: ${nextUp.join(", ") || "(need more data)"}`);
console.log(`\n→ scratch/batch/_learnings.json  ·  then: node scripts/make-hooks.mjs <slug> --count 3 --render`);
