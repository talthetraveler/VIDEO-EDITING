#!/usr/bin/env node
/**
 * Hybrid moment search — visual (CLIP) + transcript, over the indexed library.
 *
 *   node scripts/search.mjs --slug <shoot> "person receiving flowers" [--k 15] [--kind greeting]
 *
 * Ranks frames by CLIP cosine to the query text, folds in transcript matches,
 * and returns the moments that contain the strongest hits — with clip src, in/out
 * seconds, and the keyframe jpg to eyeball.
 */
import { join } from "node:path";
import { openDb, blobToF32, cosine } from "./lib/db.mjs";
import { embedText } from "./lib/clip.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug");
const query = args.find((a, i) => !a.startsWith("--") && !["--slug", "--k", "--kind"].includes(args[i - 1]));
if (!slug || !query) {
  console.error('Usage: node scripts/search.mjs --slug <shoot> "<query>" [--k 15] [--kind greeting]');
  process.exit(1);
}
const k = parseInt(opt("k", "15"), 10);
const kindFilter = opt("kind");

const db = openDb(join(process.cwd(), "public", "footage", slug, "library.db"));
const [q] = await embedText(query);

// visual: score every frame
const frames = db.prepare("SELECT clip_id,t_s,jpg_path,embed FROM frames").all();
const fscored = frames
  .map((f) => ({ clip_id: f.clip_id, t: f.t_s, jpg: f.jpg_path, s: cosine(q, blobToF32(f.embed)) }))
  .sort((a, b) => b.s - a.s);

// transcript: crude term overlap
const terms = query.toLowerCase().match(/[a-z]{3,}/g) || [];
const tmatch = new Map();
for (const m of db.prepare("SELECT id,clip_id,in_s,out_s,speech,tags,interaction_id FROM moments").all()) {
  const hay = (m.speech + " " + m.tags).toLowerCase();
  const hits = terms.filter((t) => hay.includes(t)).length;
  if (hits) tmatch.set(m.id, hits / terms.length);
}

// fold frame scores into the moments whose span contains them
const moments = db
  .prepare(
    `SELECT m.*, i.kind FROM moments m LEFT JOIN interactions i ON i.id=m.interaction_id` +
      (kindFilter ? ` WHERE i.kind = ?` : ``),
  )
  .all(...(kindFilter ? [kindFilter] : []));

const scoreMoment = (m) => {
  const inFrames = fscored.filter((f) => f.clip_id === m.clip_id && f.t >= m.in_s - 0.5 && f.t <= m.out_s + 0.8);
  const vis = inFrames.length ? Math.max(...inFrames.map((f) => f.s)) : 0;
  const txt = tmatch.get(m.id) ?? 0;
  return { m, vis: +vis.toFixed(3), txt: +txt.toFixed(2), total: +(vis + 0.35 * txt + 0.05 * (m.score || 0)).toFixed(3) };
};

const ranked = moments.map(scoreMoment).sort((a, b) => b.total - a.total).slice(0, k);

console.log(`\nquery: "${query}"${kindFilter ? `  kind=${kindFilter}` : ""}\n`);
for (const r of ranked) {
  const { m } = r;
  console.log(
    `${m.id}  ${r.total}  [vis ${r.vis} txt ${r.txt}]  ${m.kind ?? "?"}  ${m.person ?? ""}\n` +
      `   ${m.clip_id}  ${m.in_s}-${m.out_s}s  ${m.action ?? ""}${m.reaction ? "/" + m.reaction : ""}\n` +
      `   "${(m.speech || "(silent)").slice(0, 80)}"`,
  );
}
console.log(`\n${ranked.length} results. Put the good MOMENT ids into an edit.json and run build-reel.mjs.`);
