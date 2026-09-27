#!/usr/bin/env node
/**
 * Carve reusable MOMENTS out of each interaction.
 *
 *   node scripts/extract-moments.mjs --slug <shoot>
 *
 * A moment = a tight in/out span with: speech, action, reaction, person, quality,
 * energy, clean_start/end, score. Silent visual moments count too — a strong CLIP
 * match for hug / smile / handshake / food-closeup becomes a moment even with no
 * speech in that window.
 *
 * Idempotent — rebuilds the moments table.
 */
import { join } from "node:path";
import { openDb, blobToF32, cosine } from "./lib/db.mjs";
import { findGreetings } from "./lib/autocut-core.mjs";
import { vocabEmbeddings } from "./lib/clip.mjs";

const args = process.argv.slice(2);
const slug = (() => {
  const i = args.indexOf("--slug");
  return i >= 0 ? args[i + 1] : null;
})();
if (!slug) {
  console.error("Usage: node scripts/extract-moments.mjs --slug <shoot>");
  process.exit(1);
}

const db = openDb(join(process.cwd(), "public", "footage", slug, "library.db"));
const vocab = await vocabEmbeddings();

/**
 * CLIP's raw cosines are NOT comparable across prompts — measured on this
 * corpus every concept sits at 0.20-0.25, so "highest absolute score wins"
 * just picks whichever prompt has the highest baseline (walking, talking-to-
 * camera) no matter what the frame shows. Calibrate per tag: z-score each
 * concept against its own distribution over the whole library, then a tag only
 * fires when the frame is unusually that thing.
 */
const allFrames = db.prepare("SELECT embed FROM frames").all().map((r) => blobToF32(r.embed));
const tagStats = new Map();
for (const v of vocab) {
  const xs = allFrames.map((e) => cosine(e, v.emb));
  const mean = xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (xs.length || 1)) || 1e-6;
  tagStats.set(v.tag, { emb: v.emb, mean, sd });
}
console.log(`· calibrated ${vocab.length} visual tags over ${allFrames.length} frames`);

/** z-score of a frame against one tag: how unusually "that thing" it is. */
const tagZ = (emb, tag) => {
  const st = tagStats.get(tag);
  return st ? (cosine(emb, st.emb) - st.mean) / st.sd : -Infinity;
};

const ACTION_TAGS = ["hug", "handshake", "giving flowers", "receiving flowers", "showing food", "walking", "cooking"];
const REACTION_TAGS = ["smiling", "laughing", "reaction"];
const BROLL_TAGS = ["food closeup", "market", "street", "crowd"];

db.exec("DELETE FROM moments;");
const ins = db.prepare(`INSERT INTO moments
  (id,interaction_id,clip_id,in_s,out_s,speech,action,reaction,person,tags,visual_quality,audio_quality,energy,clean_start,clean_end,score)
  VALUES (@id,@interaction_id,@clip_id,@in_s,@out_s,@speech,@action,@reaction,@person,@tags,@visual_quality,@audio_quality,@energy,@clean_start,@clean_end,@score)`);

const interactions = db.prepare("SELECT * FROM interactions").all();
let n = 0;

/** Best tag from `tags` if it clears `minZ` standard deviations. */
const frameTag = (emb, tags, minZ = 1.5) => {
  let best = null;
  let bestZ = minZ;
  for (const t of tags) {
    const z = tagZ(emb, t);
    if (z > bestZ) {
      bestZ = z;
      best = t;
    }
  }
  return best ? { tag: best, score: +bestZ.toFixed(2) } : null;
};

for (const it of interactions) {
  const clipIds = JSON.parse(it.clip_ids);
  for (const clipId of clipIds) {
    const clip = db.prepare("SELECT * FROM clips WHERE id=?").get(clipId);
    const words = db.prepare("SELECT word,norm,start_s AS start,end_s AS end FROM words WHERE clip_id=? ORDER BY idx").all(clipId);
    const regions = db.prepare("SELECT start_s AS s,end_s AS e FROM speech WHERE clip_id=? ORDER BY s").all(clipId);
    const frames = db
      .prepare("SELECT t_s AS t, jpg_path, embed FROM frames WHERE clip_id=? ORDER BY t_s")
      .all(clipId)
      .map((r) => ({ ...r, emb: blobToF32(r.embed) }));
    const greets = findGreetings(words);

    // --- speech-anchored moments: one per speech region, padded ---
    for (const r of regions) {
      const inS = Math.max(0, r.s - 0.15);
      const outS = Math.min(clip.duration_s || r.e + 0.6, r.e + 0.6); // hold ~0.6s after the last word for the reaction
      const spWords = words.filter((w) => w.start >= r.s - 0.05 && w.end <= r.e + 0.05);
      const speech = spWords.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();
      const inFrames = frames.filter((f) => f.t >= inS - 0.5 && f.t <= outS + 0.8);
      let action = null;
      let reaction = null;
      const tags = new Set();
      for (const f of inFrames) {
        const a = frameTag(f.emb, ACTION_TAGS);
        const re = frameTag(f.emb, REACTION_TAGS);
        if (a && !action) action = a.tag;
        if (re) reaction = re.tag === "laughing" ? "laugh" : re.tag === "smiling" ? "smile" : "reaction";
        const b = frameTag(f.emb, BROLL_TAGS);
        if (b) tags.add(b.tag);
      }
      const g = greets.find((x) => x.start >= r.s - 0.3 && x.start <= r.e + 0.3);
      if (g) tags.add(`greeting:${g.phrase}`);
      const cleanStart = spWords.length ? (spWords[0].start - r.s > -0.05 ? 1 : 0) : 0;
      const cleanEnd = spWords.length ? 1 : 0;
      // Transcript-first scoring. CLIP on blurry 384px POV frames is a useful
      // RETRIEVAL hint but not ground truth (verified against keyframes: right
      // on a handshake, wrong on "giving flowers"), so visual tags only nudge.
      let score = 0;
      if (speech.length > 8) score += 1;
      if (speech.length > 40) score += 0.5;
      if (g) score += 2;
      if (action) score += 0.4;
      if (reaction) score += 0.3;
      if (outS - inS >= 1.2 && outS - inS <= 12) score += 1;
      ins.run({
        id: `MOMENT_${String(++n).padStart(4, "0")}`,
        interaction_id: it.id,
        clip_id: clipId,
        in_s: +inS.toFixed(2),
        out_s: +outS.toFixed(2),
        speech,
        action,
        reaction,
        person: it.person,
        tags: JSON.stringify([...tags]),
        visual_quality: "ok",
        audio_quality: "ok",
        energy: g || reaction ? "high" : "medium",
        clean_start: cleanStart,
        clean_end: cleanEnd,
        score: +score.toFixed(2),
      });
    }

    // --- silent visual moments: strong CLIP hit with no speech nearby ---
    for (const f of frames) {
      const nearSpeech = regions.some((r) => f.t >= r.s - 0.6 && f.t <= r.e + 0.9);
      if (nearSpeech) continue;
      // No speech to corroborate a silent moment, and the visual signal is weak,
      // so demand a strong outlier (2.5σ) before inventing one.
      const hit =
        frameTag(f.emb, ACTION_TAGS, 2.5) ||
        frameTag(f.emb, ["smiling", "laughing"], 2.5) ||
        frameTag(f.emb, ["food closeup", "market"], 2.5);
      if (!hit) continue;
      const inS = Math.max(0, f.t - 0.8);
      const outS = Math.min(clip.duration_s || f.t + 1, f.t + 1.4);
      ins.run({
        id: `MOMENT_${String(++n).padStart(4, "0")}`,
        interaction_id: it.id,
        clip_id: clipId,
        in_s: +inS.toFixed(2),
        out_s: +outS.toFixed(2),
        speech: "",
        action: ACTION_TAGS.includes(hit.tag) ? hit.tag : null,
        reaction: hit.tag === "laughing" ? "laugh" : hit.tag === "smiling" ? "smile" : null,
        person: it.person,
        tags: JSON.stringify([`visual:${hit.tag}`]),
        visual_quality: "ok",
        audio_quality: "n/a",
        energy: "medium",
        clean_start: 1,
        clean_end: 1,
        score: +(1 + hit.score).toFixed(2),
      });
    }
  }
}

const byKind = db
  .prepare(
    `SELECT i.kind, COUNT(m.id) n FROM moments m JOIN interactions i ON i.id=m.interaction_id GROUP BY i.kind ORDER BY n DESC`,
  )
  .all();
console.log(`✓ ${n} moments`);
for (const r of byKind) console.log(`   ${String(r.n).padStart(4)}  ${r.kind}`);
console.log("Next: node scripts/library-summary.mjs --slug " + slug);
