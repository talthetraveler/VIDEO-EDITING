#!/usr/bin/env node
/**
 * THE CATALOG — a clean, numbered concept structure.
 *
 *   node scripts/make-catalog.mjs --slug <shoot> [--clean]
 *
 *   01_SHABBAT_SHALOM/  V1_MAIN  V2_DIFFERENT_HOOK  V3_DIFFERENT_PEOPLE ...
 *   02_SHALOM_SALAAM/   ...
 *
 * V1_MAIN is deliberately curated — the strongest beats, best opener, best
 * pacing. Every other variation is then a NAMED, intentional transform of that
 * concept's pool (different cast, faster, funnier, reaction-led, hug-open …),
 * not a random reshuffle. A variation is rejected if its beat sequence
 * duplicates one already emitted in the same group.
 */
import { mkdirSync, writeFileSync, readdirSync, unlinkSync, rmSync } from "node:fs";
import { join } from "node:path";
import { openDb } from "./lib/db.mjs";
import { findPhrases, beatAround, shuffled } from "./lib/phrase.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug");
if (!slug) {
  console.error("Usage: node scripts/make-catalog.mjs --slug <shoot>");
  process.exit(1);
}
const outDir = opt("out", join("edits", slug));
if (args.includes("--clean")) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const db = openDb(join(process.cwd(), "public", "footage", slug, "library.db"));
const clips = db.prepare("SELECT id,path,duration_s FROM clips").all();
const wordsFor = new Map(
  clips.map((c) => [c.id, db.prepare("SELECT word,start_s AS start,end_s AS end FROM words WHERE clip_id=? ORDER BY idx").all(c.id)]),
);

const EMPH = "shabbat|shalom|salam|alaikum|marhaba|peace|jewish|muslim|christian";
const DANGLING =
  /^(it|was|is|are|am|and|but|so|to|the|a|an|that|of|for|i|you|we|they|my|this|in|on|at|with|because|like|do|can|have|has|these|those|some|its|there|from|your|he|she|be|been|just|very|really)$/i;
const cap = (t, max = 6) => {
  const w = (t || "").replace(/\s+/g, " ").trim().split(" ").slice(0, max);
  while (w.length > 2 && DANGLING.test(w[w.length - 1])) w.pop();
  const s = w.join(" ").replace(/[,;:]+$/, "");
  return s.length >= 3 ? s : null;
};

/**
 * Did an actual INTERACTION happen in this clip? A greeting shouted at an empty
 * promenade transcribes identically to one that landed — MAIN was opening on a
 * wide beach shot with nobody in it. Two independent signals:
 *   1. a confidently-detected reaction beat in the same clip (something visible)
 *   2. a reply in the transcript after the greeting (something audible)
 */
const REPLY = /\b(thank you|thanks|you too|how are you|amazing day|nice to meet|god bless|welcome|shukran|toda|my brother|my friend|of course|yes)\b/i;
const reactByClip = new Map();
for (const r of db.prepare("SELECT clip_id, MAX(z) z FROM reactions WHERE z IS NOT NULL GROUP BY clip_id").all()) {
  reactByClip.set(r.clip_id, r.z);
}
const interactionScore = (clipId, textAfterAnchor, dur) => {
  let s = 0;
  const z = reactByClip.get(clipId) ?? 0;
  if (z >= 2.0) s += 2;
  else if (z >= 1.5) s += 1;
  if (REPLY.test(textAfterAnchor)) s += 2;
  if (dur >= 3 && dur <= 7.5) s += 1;
  return s;
};

/** Dialogue beats: one tight phrase-anchored beat per person. */
const dialoguePool = (anchors, window, filter) => {
  const byClip = new Map();
  for (const c of clips) {
    const words = wordsFor.get(c.id) || [];
    if (words.length < 4) continue;
    for (const re of anchors) {
      for (const m of findPhrases(words, re)) {
        const b = beatAround(words, m, { ...window, clipDur: c.duration_s });
        if (!b) continue;
        const fromAnchor = words.slice(m.startIdx, m.startIdx + 9).map((w) => w.word).join(" ");
        const caption = cap(fromAnchor.replace(/^(hey |hi |hello |excuse me |sorry )+/i, ""));
        if (!caption) continue;
        if (filter && !filter(b.text)) continue;
        const dur = +(b.outS - b.inS).toFixed(2);
        const after = words.slice(m.endIdx, m.endIdx + 24).map((w) => w.word).join(" ");
        const cand = {
          clip_id: c.id,
          src: c.path,
          inS: b.inS,
          outS: b.outS,
          dur,
          caption,
          text: b.text,
          q: interactionScore(c.id, after, dur),
        };
        if (!byClip.has(c.id) || cand.q > byClip.get(c.id).q) byClip.set(c.id, cand);
      }
      if (byClip.has(c.id)) break;
    }
  }
  // Best-interaction first: MAIN then opens on a beat where something actually
  // happened, not a greeting into an empty street.
  return [...byClip.values()].sort((a, b) => b.q - a.q || a.dur - b.dur);
};

/**
 * Reaction beats (no caption — placement is trusted, the label is not).
 *
 * `strict` additionally requires the beat to be temporally anchored to a real
 * line (after-line / echo) AND for CLIP to be confident (z ≥ minZ). Use it for
 * reaction-ONLY reels, where a mislabelled beat has no dialogue to redeem it —
 * a loose "hugs" reel was opening on a couple walking at distance. As glue
 * between dialogue beats the loose pool is fine.
 */
const reactionPool = (kinds, { maxDur = 4.2, minScore = 0.6, strict = false, minZ = 1.5 } = {}) => {
  const extra = strict ? ` AND source IN ('after-line','echo') AND z >= ${minZ}` : "";
  const rows = db
    .prepare(
      `SELECT * FROM reactions WHERE kind IN (${kinds.map(() => "?").join(",")}) AND score>=? AND (out_s-in_s)<=?${extra} ORDER BY score DESC`,
    )
    .all(...kinds, minScore, maxDur);
  const seen = new Set();
  return rows
    .filter((r) => (seen.has(r.clip_id) ? false : (seen.add(r.clip_id), true)))
    .map((r) => ({ clip_id: r.clip_id, src: r.src, inS: r.in_s, outS: r.out_s, dur: +(r.out_s - r.in_s).toFixed(2), kind: r.kind, caption: null }));
};

const W_GREET = { before: 2, after: 9, minSec: 2.4, maxSec: 8 };
const W_TALK = { before: 4, after: 20, minSec: 3.5, maxSec: 11 };

// ---------------------------------------------------------------- the pools
const P = {
  shabbat: dialoguePool([/\bshabbat ?shalom\b/i], W_GREET),
  shalom: dialoguePool([/\bshalom\b/i], W_GREET),
  salam: dialoguePool([/\bsalam ?alaikum\b/i, /\bwa ?alaikum ?(as)?salam\b/i, /\bsalam\b/i], W_GREET),
  religion: dialoguePool([/\bi.?m jewish\b/i, /\bare you (a )?(muslim|christian|jewish|arab)\b/i, /\byou.?re (a )?(christian|muslim|jewish)\b/i], W_TALK),
  whereFrom: dialoguePool([/\bwhere are you (guys )?from\b/i, /\bwhere you from\b/i], W_TALK),
  loveIsrael: dialoguePool([/\blove israel\b/i, /\blove it here\b/i, /\bpeople are the best\b/i, /\blove this (country|place)\b/i], W_TALK),
  feelSafe: dialoguePool([/\bfeel safe\b/i, /\bis it safe\b/i, /\bsafe here\b/i], W_TALK),
  nationality: dialoguePool([/\bfrom (russia|germany|poland|canada|nigeria|indonesia|morocco|japan|china|france|italy|spain|brazil|india|england|america)\b/i], W_TALK),
  restaurant: dialoguePool([/\bbest (humus|hummus|food|bakery|dish)\b/i, /\bfor free\b/i, /\bso good\b/i, /\btime to pay\b/i, /\bmy father\b/i], W_TALK),
  unity: dialoguePool([/\bwe are all one\b/i, /\bwe.?re all\b/i, /\bmuslims and jews\b/i, /\bjews and (muslims|arabs)\b/i, /\bbrother\b/i], W_TALK),
  // loose pools — used as GLUE between dialogue beats
  smile: reactionPool(["smile", "group smiling"]),
  laugh: reactionPool(["laugh"]),
  hug: reactionPool(["hug", "arm around"]),
  shake: reactionPool(["handshake", "high five"]),
  anyReact: reactionPool(["smile", "laugh", "hug", "handshake", "arm around", "group smiling", "waving", "surprised"]),
  // strict pools — used for reaction-ONLY reels
  smileStrict: reactionPool(["smile", "group smiling"], { strict: true }),
  reactStrict: reactionPool(
    ["smile", "laugh", "hug", "handshake", "arm around", "group smiling", "waving", "surprised"],
    { strict: true },
  ),
};

// --------------------------------------------------------------- selectors
const notIn = (pool, used) => pool.filter((b) => !used.has(b.clip_id));
const take = (pool, { targetSec, minBeats = 4, maxBeats = 9 }) => {
  const out = [];
  let t = 0;
  for (const b of pool) {
    if (out.length >= maxBeats) break;
    if (t >= targetSec && out.length >= minBeats) break;
    out.push(b);
    t += b.dur;
  }
  return out;
};
/** Alternate dialogue with a DIFFERENT person's reaction. */
const interleave = (talk, react, targetSec, maxBeats = 10) => {
  const out = [];
  let t = 0;
  let ri = 0;
  for (const d of talk) {
    if (t >= targetSec || out.length >= maxBeats) break;
    out.push(d);
    t += d.dur;
    const g = react.find((x, k) => k >= ri && x.clip_id !== d.clip_id);
    if (g) {
      ri = react.indexOf(g) + 1;
      out.push(g);
      t += g.dur;
    }
  }
  return out;
};
const zipPools = (a, b) => {
  const o = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) o.push(a[i]);
    if (b[i]) o.push(b[i]);
  }
  return o;
};

// ----------------------------------------------------------------- the plan
const GROUPS = [
  {
    dir: "01_SHABBAT_SHALOM",
    variations: [
      { id: "V1_MAIN", title: "SAYING SHABBAT SHALOM TO STRANGERS", build: (u) => take(P.shabbat, { targetSec: 28 }) },
      { id: "V2_DIFFERENT_HOOK", title: "SHABBAT?", build: (u) => take(shuffled(P.shabbat, 11), { targetSec: 26 }) },
      { id: "V3_DIFFERENT_PEOPLE", title: "SHABBAT SHALOM IN TEL AVIV", build: (u) => take(notIn(P.shabbat, u), { targetSec: 28 }) },
      { id: "V4_FAST_20SEC", title: "I SAID SHABBAT SHALOM ALL DAY", build: () => take([...P.shabbat].sort((a, b) => a.dur - b.dur), { targetSec: 18, maxBeats: 8 }) },
      { id: "V5_REACTIONS", title: "AND THEY SAID IT BACK", build: () => interleave(P.shabbat, P.smile, 26) },
      { id: "V6_HUG_OPEN", title: "SHABBAT SHALOM AND A HUG", build: () => [...take(P.hug, { targetSec: 4, minBeats: 1, maxBeats: 1 }), ...take(P.shabbat, { targetSec: 22 })] },
    ],
  },
  {
    dir: "02_SHALOM_SALAAM",
    variations: [
      { id: "V1_MAIN", title: "SHALOM. SALAAM. SAME STREET.", build: () => take(zipPools(P.shalom, P.salam), { targetSec: 30 }) },
      { id: "V2_SALAAM_FIRST", title: "SAYING SALAAM ALAIKUM TO STRANGERS", build: () => take([...P.salam, ...P.shalom], { targetSec: 28 }) },
      { id: "V3_SHALOM_FIRST", title: "SAYING SHALOM TO STRANGERS", build: () => take([...P.shalom, ...P.salam], { targetSec: 28 }) },
      { id: "V4_FUNNIEST", title: "THEIR REACTIONS WERE THE BEST", build: () => interleave(zipPools(P.salam, P.shalom), P.laugh, 26) },
      { id: "V5_FAST", title: "ONE GREETING, EVERY PERSON", build: () => take([...zipPools(P.shalom, P.salam)].sort((a, b) => a.dur - b.dur), { targetSec: 16, maxBeats: 9 }) },
      { id: "V6_HUMAN", title: "SHALOM, SALAAM, AND A SMILE", build: () => interleave(zipPools(P.salam, P.shalom), P.anyReact, 32) },
    ],
  },
  {
    dir: "03_RELIGION_REACTIONS",
    variations: [
      { id: "V1_MAIN", title: "I TOLD THEM I'M JEWISH", build: () => take(P.religion, { targetSec: 30, minBeats: 4 }) },
      { id: "V2_PERSON_B_OPENS", title: "ASKING STRANGERS THEIR RELIGION", build: () => take(shuffled(P.religion, 23), { targetSec: 28 }) },
      { id: "V3_NEW_PEOPLE", title: "MUSLIM. CHRISTIAN. JEWISH.", build: (u) => take(notIn(P.religion, u), { targetSec: 30 }) },
      { id: "V4_BEST_REACTIONS", title: "THEIR REACTION WHEN I SAY I'M JEWISH", build: () => interleave(P.religion, P.smile, 30) },
      { id: "V5_FUNNY", title: "I ASKED. THEN I TOLD THEM.", build: () => interleave(shuffled(P.religion, 71), P.laugh, 28) },
      { id: "V6_EMOTIONAL", title: "WE'RE ALL ONE", build: () => take([...P.unity, ...P.religion], { targetSec: 38, maxBeats: 7 }) },
    ],
  },
  {
    dir: "04_WHERE_ARE_YOU_FROM",
    variations: [
      { id: "V1_MAIN", title: "ASKING TOURISTS WHERE THEY'RE FROM", build: () => take(P.whereFrom, { targetSec: 30 }) },
      { id: "V2_LOVE_ISRAEL", title: "WHAT THEY REALLY THINK ABOUT ISRAEL", build: () => take([...P.loveIsrael, ...P.whereFrom], { targetSec: 30, maxBeats: 7 }) },
      { id: "V3_FEEL_SAFE", title: "DO YOU FEEL SAFE IN ISRAEL?", build: () => take([...P.feelSafe, ...P.whereFrom], { targetSec: 30, maxBeats: 7 }) },
      { id: "V4_TOURIST_REACTIONS", title: "TOURISTS IN ISRAEL", build: () => interleave(P.whereFrom, P.smile, 30) },
      { id: "V5_NATIONALITIES", title: "THE WHOLE WORLD IS HERE", build: () => take([...P.nationality, ...P.whereFrom], { targetSec: 32, maxBeats: 8 }) },
      { id: "V6_FAST", title: "WHERE ARE YOU FROM?", build: () => take([...P.whereFrom].sort((a, b) => a.dur - b.dur), { targetSec: 18, maxBeats: 8 }) },
    ],
  },
  {
    dir: "05_HUMAN_MOMENTS",
    variations: [
      // Reaction-ONLY reels use the STRICT pool. There are only ~2 confidently
      // detected hugs and 4 laughs in 328 clips, so dedicated hug/laugh reels
      // would be padded with mislabelled shots — those live on as glue instead.
      { id: "V1_MAIN", title: "NO WORDS NEEDED", build: () => take(P.reactStrict, { targetSec: 24, maxBeats: 10 }) },
      { id: "V2_SMILES", title: "THEY ALL SMILED BACK", build: () => take(P.smileStrict, { targetSec: 20, maxBeats: 9 }) },
      { id: "V3_GREETING_CHAIN", title: "SHALOM. SALAAM. A HANDSHAKE.", build: () => [...take(P.shalom, { targetSec: 8, minBeats: 2, maxBeats: 2 }), ...take(P.salam, { targetSec: 8, minBeats: 2, maxBeats: 2 }), ...take(P.shabbat, { targetSec: 8, minBeats: 2, maxBeats: 2 }), ...take(P.reactStrict, { targetSec: 8, minBeats: 2, maxBeats: 3 })] },
      { id: "V4_POSITIVE", title: "THIS IS ISRAEL", build: () => take(shuffled(P.reactStrict, 97), { targetSec: 28, maxBeats: 11 }) },
      { id: "V5_GREETINGS_AND_SMILES", title: "EVERY PERSON SMILED BACK", build: () => interleave(zipPools(P.shalom, P.salam), P.smileStrict, 28) },
    ],
  },
  {
    dir: "06_RESTAURANT_CONVERSATIONS",
    variations: [
      { id: "V1_MAIN", title: "MEETING THE OWNER", build: () => take(P.restaurant, { targetSec: 34, maxBeats: 7 }) },
      { id: "V2_IDENTITY", title: "JEWISH, ARAB, MUSLIM — SAME TABLE", build: () => take([...P.unity, ...P.restaurant], { targetSec: 34, maxBeats: 7 }) },
      { id: "V3_FUNNIEST", title: "THE BEST LINES OF THE DAY", build: () => interleave(P.restaurant, P.laugh, 30) },
      { id: "V4_UNITY", title: "WE'RE ALL BROTHERS HERE", build: () => take(shuffled(P.unity, 41), { targetSec: 34, maxBeats: 8 }) },
      { id: "V5_FOOD_AND_LAUGHTER", title: "THE BEST FOOD IN ISRAEL", build: () => interleave(P.restaurant, P.smile, 32) },
      { id: "V6_SHORT_EMOTIONAL", title: "HE WOULDN'T LET ME PAY", build: () => take(P.restaurant, { targetSec: 18, minBeats: 3, maxBeats: 5 }) },
    ],
  },
];

// ------------------------------------------------------------------ emit
const seqKey = (b) => b.map((x) => `${x.clip_id}@${x.inS}`).join("|");
let total = 0;
for (const g of GROUPS) {
  const dir = join(outDir, g.dir);
  mkdirSync(dir, { recursive: true });
  const used = new Set(); // cast of V1_MAIN, so V3 can pick a different one
  const seen = new Set();
  let made = 0;
  for (const v of g.variations) {
    let beats;
    try {
      beats = v.build(used) || [];
    } catch {
      beats = [];
    }
    beats = beats.filter(Boolean);
    if (beats.length < 3) {
      console.log(`   ${g.dir}/${v.id.padEnd(22)} — not enough beats, skipped`);
      continue;
    }
    const key = seqKey(beats);
    if (seen.has(key)) {
      console.log(`   ${g.dir}/${v.id.padEnd(22)} — duplicate sequence, skipped`);
      continue;
    }
    seen.add(key);
    if (v.id === "V1_MAIN") for (const b of beats) used.add(b.clip_id);
    const secs = beats.reduce((s, b) => s + b.dur, 0);
    writeFileSync(
      join(dir, `${v.id}.json`),
      JSON.stringify(
        {
          name: `${g.dir}__${v.id}`,
          title: v.title,
          titleVariant: "pill",
          emphasize: EMPH,
          strategy: `${g.dir} ${v.id} · ${beats.length} beats · opens on ${beats[0].clip_id}${beats[0].caption ? ` ("${beats[0].caption}")` : " (reaction)"}`,
          target_duration: Math.round(secs),
          moments: beats.map((b) => ({
            inline: { src: b.src, startSec: b.inS, endSec: b.outS },
            ...(b.caption ? { caption: b.caption } : {}),
          })),
        },
        null,
        2,
      ),
    );
    console.log(`   ${g.dir}/${v.id.padEnd(22)} ${String(beats.length).padStart(2)} beats  ${String(Math.round(secs)).padStart(3)}s`);
    made++;
    total++;
  }
  console.log(`${g.dir}: ${made} variations\n`);
}
console.log(`✓ ${total} catalog edits -> ${outDir}`);
console.log(
  "pools: " +
    Object.entries(P)
      .map(([k, v]) => `${k}:${v.length}`)
      .join("  "),
);
