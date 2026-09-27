#!/usr/bin/env node
/**
 * Extract HUMAN REACTION beats — the moments between and after the words.
 *
 *   node scripts/extract-reactions.mjs --slug <shoot>
 *
 * The best part of this footage is usually not the sentence, it's the half-second
 * after it: the smile once they hear "I'm Jewish", the laugh, the handshake, the
 * pause where you both grin. Those are now first-class, editable beats.
 *
 * Three sources, none of which trust vision to ASSERT anything:
 *   1. after-line   — the window right after a key phrase ends (the reaction to it)
 *   2. gap          — a silent pause ≥1.2s between speech regions ("in between")
 *   3. echo         — they repeat the greeting back to you
 * CLIP then RANKS those candidate windows (smile / laugh / hug / handshake /
 * high-five / wave / surprised / group) via per-tag z-scores. Vision picks the
 * best candidate; it never invents one.
 *
 * Writes the `reactions` table.
 */
import { join } from "node:path";
import { openDb, blobToF32, cosine } from "./lib/db.mjs";
import { vocabEmbeddings, REACTION_VOCAB } from "./lib/clip.mjs";
import { findPhrases } from "./lib/phrase.mjs";

const args = process.argv.slice(2);
const slug = (() => {
  const i = args.indexOf("--slug");
  return i >= 0 ? args[i + 1] : null;
})();
if (!slug) {
  console.error("Usage: node scripts/extract-reactions.mjs --slug <shoot>");
  process.exit(1);
}

const db = openDb(join(process.cwd(), "public", "footage", slug, "library.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS reactions (
    id          TEXT PRIMARY KEY,
    clip_id     TEXT NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    src         TEXT,
    in_s        REAL, out_s REAL,
    source      TEXT,   -- after-line | gap | echo
    kind        TEXT,   -- smile | laugh | hug | handshake | high five | waving | surprised | group smiling | pause
    after_phrase TEXT,  -- the line this is a reaction TO
    z           REAL,   -- CLIP z-score of the winning tag
    score       REAL
  );
  CREATE INDEX IF NOT EXISTS ix_react_clip ON reactions(clip_id);
  CREATE INDEX IF NOT EXISTS ix_react_kind ON reactions(kind);
`);
db.exec("DELETE FROM reactions;");

// ---- calibrate CLIP per tag (absolute cosines are not comparable) ----------
const vocab = await vocabEmbeddings();
const allFrames = db.prepare("SELECT embed FROM frames").all().map((r) => blobToF32(r.embed));
const stats = new Map();
for (const v of vocab) {
  const xs = allFrames.map((e) => cosine(e, v.emb));
  const mean = xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (xs.length || 1)) || 1e-6;
  stats.set(v.tag, { emb: v.emb, mean, sd });
}
const zOf = (emb, tag) => {
  const st = stats.get(tag);
  return st ? (cosine(emb, st.emb) - st.mean) / st.sd : -Infinity;
};
/** Best reaction tag for a set of frames, or null. */
const rankFrames = (frames) => {
  let best = null;
  for (const f of frames) {
    for (const tag of REACTION_VOCAB) {
      const z = zOf(f.emb, tag);
      if (!best || z > best.z) best = { tag, z: +z.toFixed(2), t: f.t };
    }
  }
  return best;
};

// key lines a reaction can follow
const ANCHORS = [
  [/\bi.?m jewish\b/i, "I'm Jewish"],
  [/\bare you (a )?(muslim|christian|jewish|arab)\b/i, "asking their religion"],
  [/\bshabbat ?shalom\b/i, "Shabbat Shalom"],
  [/\bsalam ?alaikum\b/i, "Salam Alaikum"],
  [/\bshalom\b/i, "Shalom"],
  [/\bwhere are you (guys )?from\b/i, "where are you from"],
  [/\bwelcome to israel\b/i, "Welcome to Israel"],
];
const LAUGH = /\b(laugh|laughter|laughing|haha|hahaha)\b/i;

const clips = db.prepare("SELECT id,path,duration_s FROM clips").all();
const ins = db.prepare(`INSERT OR REPLACE INTO reactions
  (id,clip_id,src,in_s,out_s,source,kind,after_phrase,z,score)
  VALUES (?,?,?,?,?,?,?,?,?,?)`);

let n = 0;
const add = (clip, inS, outS, source, hit, afterPhrase) => {
  const dur = outS - inS;
  if (dur < 1.1 || dur > 6.5) return;
  const kind = hit ? (hit.tag === "smiling" ? "smile" : hit.tag === "laughing" ? "laugh" : hit.tag) : "pause";
  // score: vision confidence + a bonus for reacting to a strong line
  let score = hit ? hit.z : 0.4;
  if (afterPhrase === "I'm Jewish") score += 1.2;
  if (afterPhrase && /shalom|salam/i.test(afterPhrase)) score += 0.5;
  if (source === "echo") score += 0.8;
  ins.run(
    `REACT_${String(++n).padStart(4, "0")}`,
    clip.id,
    clip.path,
    +inS.toFixed(2),
    +outS.toFixed(2),
    source,
    kind,
    afterPhrase ?? null,
    hit ? hit.z : null,
    +score.toFixed(2),
  );
};

db.transaction(() => {
  for (const clip of clips) {
    const words = db
      .prepare("SELECT word,start_s AS start,end_s AS end FROM words WHERE clip_id=? ORDER BY idx")
      .all(clip.id);
    const frames = db
      .prepare("SELECT t_s AS t, embed FROM frames WHERE clip_id=? ORDER BY t_s")
      .all(clip.id)
      .map((r) => ({ t: r.t, emb: blobToF32(r.embed) }));
    if (!frames.length) continue;
    const framesIn = (a, b) => frames.filter((f) => f.t >= a - 0.6 && f.t <= b + 0.6);
    const regions = db.prepare("SELECT start_s AS s,end_s AS e FROM speech WHERE clip_id=? ORDER BY s").all(clip.id);

    // 1) after-line: the reaction to a key phrase
    for (const [re, label] of ANCHORS) {
      for (const m of findPhrases(words, re)) {
        const inS = m.endSec + 0.05;
        const outS = Math.min(clip.duration_s ?? inS + 3.2, inS + 3.2);
        add(clip, inS, outS, "after-line", rankFrames(framesIn(inS, outS)), label);
      }
    }

    // 2) gap: a real pause between speech — "the moments in between"
    for (let i = 1; i < regions.length; i++) {
      const gapS = regions[i].s - regions[i - 1].e;
      if (gapS < 1.2) continue;
      const inS = regions[i - 1].e + 0.1;
      const outS = Math.min(regions[i].s - 0.05, inS + 4);
      add(clip, inS, outS, "gap", rankFrames(framesIn(inS, outS)), null);
    }

    // 3) echo: they say the greeting BACK — second occurrence in the clip
    for (const [re, label] of ANCHORS.slice(2, 5)) {
      const hits = findPhrases(words, re);
      for (const m of hits.slice(1)) {
        const inS = Math.max(0, m.startSec - 0.35);
        const outS = Math.min(clip.duration_s ?? m.endSec + 1.6, m.endSec + 1.6);
        add(clip, inS, outS, "echo", rankFrames(framesIn(inS, outS)), label);
      }
    }

    // 4) explicit laughter markers in the transcript
    for (const m of findPhrases(words, LAUGH)) {
      const inS = Math.max(0, m.startSec - 1.0);
      const outS = Math.min(clip.duration_s ?? m.endSec + 1.5, m.endSec + 1.5);
      add(clip, inS, outS, "after-line", rankFrames(framesIn(inS, outS)) ?? { tag: "laughing", z: 1.0 }, "laughter");
    }
  }
})();

const byKind = db.prepare("SELECT kind,COUNT(*) n FROM reactions GROUP BY kind ORDER BY n DESC").all();
const bySrc = db.prepare("SELECT source,COUNT(*) n FROM reactions GROUP BY source ORDER BY n DESC").all();
console.log(`✓ ${n} reaction beats`);
console.log("  by kind:   " + byKind.map((r) => `${r.kind}:${r.n}`).join("  "));
console.log("  by source: " + bySrc.map((r) => `${r.source}:${r.n}`).join("  "));
const top = db.prepare("SELECT kind,after_phrase,clip_id,in_s,out_s,z FROM reactions ORDER BY score DESC LIMIT 8").all();
console.log("\n  strongest:");
for (const r of top)
  console.log(`   ${r.kind.padEnd(13)} after "${r.after_phrase ?? "-"}"  ${r.clip_id.slice(0, 26)} ${r.in_s}-${r.out_s}s  z=${r.z ?? "-"}`);
