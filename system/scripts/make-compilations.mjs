#!/usr/bin/env node
/**
 * Concept-driven compilation generator.
 *
 *   node scripts/make-compilations.mjs --slug <shoot> [--out edits/<shoot>] [--clean]
 *
 * For each CONCEPT (religion reveal, Salam, Shalom, where-are-you-from, feel
 * safe, hugs, …) it finds phrase-anchored beats across every clip, then emits
 * several genuinely different edits by remixing:
 *
 *   who starts · which people appear · their order · which line is used ·
 *   the hook · the pacing/length · the ending
 *
 * A variation is rejected if its ordered beat sequence duplicates one already
 * emitted for that concept, so "variation" never means "same edit, new title".
 */
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { openDb } from "./lib/db.mjs";
import { findPhrases, beatAround, shuffled, rng } from "./lib/phrase.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug");
if (!slug) {
  console.error("Usage: node scripts/make-compilations.mjs --slug <shoot>");
  process.exit(1);
}
const outDir = opt("out", join("edits", slug));
mkdirSync(outDir, { recursive: true });
if (args.includes("--clean")) {
  for (const f of readdirSync(outDir).filter((x) => x.endsWith(".json"))) unlinkSync(join(outDir, f));
}

const db = openDb(join(process.cwd(), "public", "footage", slug, "library.db"));
const clips = db.prepare("SELECT id,path,duration_s FROM clips").all();
const wordsFor = new Map();
for (const c of clips) {
  wordsFor.set(
    c.id,
    db.prepare("SELECT word,start_s AS start,end_s AS end FROM words WHERE clip_id=? ORDER BY idx").all(c.id),
  );
}
const clipById = new Map(clips.map((c) => [c.id, c]));

const GREET_EMPHASIS = "shabbat|shalom|salam|alaikum|marhaba|peace|jewish|muslim|christian";

/** Trim an on-screen caption: 2-6 words, never ending on a function word. */
const DANGLING =
  /^(it|was|is|are|am|and|but|so|to|the|a|an|that|of|for|i|you|we|they|my|this|in|on|at|with|because|like|do|can|have|has|these|those|some|its|there|from|your|he|she|be|been|just|very|really)$/i;
const caption = (text, maxWords = 6) => {
  const w = (text || "").replace(/\s+/g, " ").trim().split(" ").slice(0, maxWords);
  while (w.length > 2 && DANGLING.test(w[w.length - 1])) w.pop();
  const s = w.join(" ").replace(/[,;:]+$/, "");
  return s.length >= 3 ? s : null;
};

// ---------------------------------------------------------------- concepts
const CONCEPTS = [
  {
    key: "religion-reveal",
    anchors: [/\bare you (a )?(muslim|christian|jewish|arab)\b/i, /\bi.?m jewish\b/i, /\byou.?re (a )?(christian|muslim|jewish)\b/i],
    window: { before: 6, after: 20, minSec: 4, maxSec: 11 },
    hooks: [
      "I TOLD THEM I'M JEWISH",
      "ASKING STRANGERS THEIR RELIGION",
      "THEIR REACTION WHEN I SAY I'M JEWISH",
      "MUSLIM. CHRISTIAN. JEWISH.",
      "WHAT RELIGION ARE YOU?",
      "I ASKED. THEN I TOLD THEM.",
    ],
    variations: 6,
    lengths: [22, 30, 16, 38, 26, 20],
  },
  {
    key: "where-from",
    anchors: [/\bwhere are you (guys )?from\b/i, /\bwhere you from\b/i],
    window: { before: 3, after: 22, minSec: 3.5, maxSec: 11 },
    hooks: [
      "ASKING TOURISTS WHERE THEY'RE FROM",
      "WHERE ARE YOU FROM?",
      "PEOPLE I MET IN ISRAEL TODAY",
      "THE WHOLE WORLD IS HERE",
      "TOURISTS IN ISRAEL",
    ],
    variations: 5,
    lengths: [24, 32, 18, 38, 28],
  },
  {
    key: "salam",
    anchors: [/\bsalam ?alaikum\b/i, /\bwa ?alaikum ?(as)?salam\b/i, /\bsalam\b/i],
    window: { before: 2, after: 9, minSec: 2.4, maxSec: 8 },
    hooks: [
      "SAYING SALAM ALAIKUM TO STRANGERS",
      "SALAM ALAIKUM IN ISRAEL",
      "I GREETED EVERY MUSLIM I SAW",
      "SALAM. EVERY TIME.",
    ],
    variations: 4,
    lengths: [20, 28, 14, 34],
  },
  {
    key: "shalom",
    anchors: [/\bshabbat ?shalom\b/i, /\bshalom\b/i],
    window: { before: 2, after: 9, minSec: 2.4, maxSec: 8 },
    hooks: [
      "SAYING SHABBAT SHALOM TO STRANGERS",
      "SHALOM TO EVERYONE I MET",
      "SHABBAT SHALOM IN TEL AVIV",
      "I SAID SHALOM ALL DAY",
      "SHABBAT?",
    ],
    variations: 5,
    lengths: [20, 30, 15, 36, 24],
  },
  {
    key: "feel-safe",
    anchors: [/\bfeel safe\b/i, /\bis it safe\b/i, /\bsafe here\b/i],
    window: { before: 8, after: 20, minSec: 4, maxSec: 11 },
    hooks: ["DO YOU FEEL SAFE IN ISRAEL?", "I ASKED TOURISTS IF THEY FEEL SAFE", "THE ANSWER SURPRISED ME"],
    variations: 3,
    lengths: [24, 32, 18],
  },
  {
    key: "love-israel",
    anchors: [/\blove israel\b/i, /\blove it here\b/i, /\blove this (country|place)\b/i, /\bpeople are the best\b/i],
    window: { before: 8, after: 18, minSec: 3.5, maxSec: 11 },
    hooks: ["WHAT THEY REALLY THINK ABOUT ISRAEL", "PEOPLE WHO LOVE ISRAEL", "THE SIDE OF ISRAEL YOU DON'T SEE"],
    variations: 3,
    lengths: [26, 34, 18],
  },
  {
    key: "welcome-to-israel",
    anchors: [/\bwelcome to israel\b/i],
    window: { before: 10, after: 14, minSec: 3, maxSec: 10 },
    hooks: ["WELCOMING STRANGERS TO ISRAEL", "WELCOME TO ISRAEL"],
    variations: 2,
    lengths: [22, 30],
  },
  {
    key: "first-time",
    anchors: [/\bfirst time\b/i],
    window: { before: 6, after: 18, minSec: 3.5, maxSec: 10 },
    hooks: ["THEIR FIRST TIME IN ISRAEL", "FIRST TIME HERE"],
    variations: 2,
    lengths: [24, 32],
  },
  {
    key: "free-gift",
    anchors: [/\bfor free\b/i, /\bit.?s free\b/i, /\bon the house\b/i, /\ba gift\b/i, /\bno money\b/i],
    window: { before: 8, after: 18, minSec: 3.5, maxSec: 11 },
    hooks: ["THEY REFUSED TO TAKE MY MONEY", "STRANGERS GAVE ME THINGS FOR FREE", "IT'S FREE FOR YOU"],
    variations: 3,
    lengths: [24, 32, 18],
  },
  {
    key: "best-food",
    anchors: [/\bbest (humus|hummus|food|bakery|dish)\b/i, /\bso good\b/i, /\bthis is amazing\b/i],
    window: { before: 6, after: 18, minSec: 3.5, maxSec: 11 },
    hooks: ["THE BEST FOOD IN ISRAEL", "I ASKED FOR THEIR BEST DISH", "TASTING ISRAEL"],
    variations: 3,
    lengths: [26, 34, 18],
  },
  {
    key: "surprised",
    anchors: [/\bi.?m so surprised\b/i, /\bi didn.?t expect\b/i, /\bshocked\b/i, /\bno way\b/i],
    window: { before: 8, after: 18, minSec: 3.5, maxSec: 11 },
    hooks: ["WHAT SURPRISED THEM ABOUT ISRAEL", "THEY COULDN'T BELIEVE IT"],
    variations: 2,
    lengths: [24, 32],
  },
];

// ------------------------------------------------------- build the beat pools
/** One best beat per clip (= per person) for a concept. */
const poolFor = (concept) => {
  const byClip = new Map();
  for (const c of clips) {
    const words = wordsFor.get(c.id) || [];
    if (words.length < 4) continue;
    for (const re of concept.anchors) {
      for (const match of findPhrases(words, re)) {
        const b = beatAround(words, match, { ...concept.window, clipDur: c.duration_s });
        if (!b) continue;
        // The caption must be the LINE, not the run-up to it. beatAround starts
        // a few words early for breathing room, so caption from the anchor
        // match onward ("are you Jewish", "I'm Jewish") — captioning the window
        // start gave fragments like "I'm sorry to bother".
        const fromAnchor = words
          .slice(match.startIdx, Math.min(words.length, match.startIdx + 9))
          .map((w) => w.word)
          .join(" ");
        const cap = caption(fromAnchor.replace(/^(hey |hi |hello |excuse me |sorry )+/i, ""));
        if (!cap) continue;
        const cand = { clip_id: c.id, src: c.path, inS: b.inS, outS: b.outS, dur: +(b.outS - b.inS).toFixed(2), text: b.text, caption: cap };
        const prev = byClip.get(c.id);
        // prefer the earliest, tightest usable beat in each clip
        if (!prev || cand.dur < prev.dur) byClip.set(c.id, cand);
      }
      if (byClip.has(c.id)) break; // first matching anchor wins for this clip
    }
  }
  return [...byClip.values()];
};

// --------------------------------------------------------------- variations
const seqKey = (beats) => beats.map((b) => `${b.clip_id}@${b.inS}`).join("|");

const ORDERINGS = [
  { name: "shuffled", fn: (p, seed) => shuffled(p, seed) },
  { name: "shortest-first", fn: (p) => [...p].sort((a, b) => a.dur - b.dur) },
  { name: "longest-first", fn: (p) => [...p].sort((a, b) => b.dur - a.dur) },
  { name: "reverse-shuffled", fn: (p, seed) => shuffled(p, seed).reverse() },
];

const out = [];
for (const concept of CONCEPTS) {
  const pool = poolFor(concept);
  if (pool.length < 3) {
    console.log(`· ${concept.key.padEnd(20)} only ${pool.length} beats — skipped`);
    continue;
  }
  const seen = new Set();
  let made = 0;
  for (let v = 0; v < concept.variations * 3 && made < concept.variations; v++) {
    const seed = (concept.key.length * 7919 + v * 104729) >>> 0;
    const ordering = ORDERINGS[v % ORDERINGS.length];
    let ordered = ordering.fn(pool, seed);
    // rotate so a DIFFERENT person opens each variation
    const startAt = v % ordered.length;
    ordered = [...ordered.slice(startAt), ...ordered.slice(0, startAt)];
    // drop a different slice each time so the cast changes, not just the order
    const r = rng(seed);
    if (ordered.length > 4) ordered = ordered.filter(() => r() > 0.18);

    // Fill to the target length, but a compilation is about SHOWING MANY PEOPLE:
    // always take at least 3 (cap 9) even if that overshoots the target.
    const targetSec = concept.lengths[made % concept.lengths.length];
    const MIN_BEATS = 3;
    const MAX_BEATS = 9;
    const beats = [];
    let t = 0;
    for (const b of ordered) {
      if (beats.length >= MAX_BEATS) break;
      if (t >= targetSec && beats.length >= MIN_BEATS) break;
      beats.push(b);
      t += b.dur;
    }
    if (beats.length < MIN_BEATS) continue;
    const key = seqKey(beats);
    if (seen.has(key)) continue;
    seen.add(key);

    const hook = concept.hooks[made % concept.hooks.length];
    out.push({
      name: `${concept.key}_v${made + 1}`,
      title: hook,
      titleVariant: "pill",
      emphasize: GREET_EMPHASIS,
      strategy: `${concept.key} · ${ordering.name} · opens with ${beats[0].clip_id} · ${beats.length} people · ~${Math.round(t)}s`,
      target_duration: Math.round(t),
      moments: beats.map((b) => ({
        inline: { src: b.src, startSec: b.inS, endSec: b.outS },
        caption: b.caption,
      })),
    });
    made++;
  }
  console.log(`· ${concept.key.padEnd(20)} pool ${String(pool.length).padStart(3)} beats -> ${made} variations`);
}

// =========================================================================
// REACTION BEATS — the moments between and after the words.
// Placement comes from word timings (solid); the CLIP `kind` is only a sort
// key, so these beats carry NO caption. That is also the better edit: silent
// human moments are the connective tissue, not another line of text.
// =========================================================================
const reactionsBy = (kinds, { minScore = 0.6, maxDur = 4.5 } = {}) => {
  const rows = db
    .prepare(
      `SELECT * FROM reactions WHERE kind IN (${kinds.map(() => "?").join(",")})
       AND score >= ? AND (out_s - in_s) <= ? ORDER BY score DESC`,
    )
    .all(...kinds, minScore, maxDur);
  const seen = new Set();
  return rows
    .filter((r) => (seen.has(r.clip_id) ? false : (seen.add(r.clip_id), true))) // one per person
    .map((r) => ({ clip_id: r.clip_id, src: r.src, inS: r.in_s, outS: r.out_s, dur: +(r.out_s - r.in_s).toFixed(2), kind: r.kind, caption: null }));
};

const REACTION_CONCEPTS = [
  { key: "smiles", kinds: ["smile", "group smiling"], hooks: ["THEY ALL SMILED BACK", "JUST SMILES", "THE SMILES SAY IT ALL"], variations: 3, lengths: [16, 22, 12] },
  { key: "laughs", kinds: ["laugh"], hooks: ["LAUGHING WITH STRANGERS", "WE LAUGHED ALL DAY", "JUST LAUGHTER"], variations: 3, lengths: [16, 22, 12] },
  { key: "hugs-handshakes", kinds: ["hug", "handshake", "high five", "arm around"], hooks: ["STRANGERS WHO HUGGED ME", "HANDSHAKES AND HUGS", "EVERY HANDSHAKE TODAY"], variations: 3, lengths: [20, 26, 14] },
  { key: "human-moments", kinds: ["smile", "laugh", "hug", "handshake", "arm around", "group smiling", "waving", "high five"], hooks: ["NO WORDS NEEDED", "HUMAN MOMENTS IN ISRAEL", "THIS IS ISRAEL", "JUST PEOPLE"], variations: 4, lengths: [22, 30, 16, 26] },
];

for (const rc of REACTION_CONCEPTS) {
  const pool = reactionsBy(rc.kinds);
  if (pool.length < 4) {
    console.log(`· ${rc.key.padEnd(20)} only ${pool.length} beats — skipped`);
    continue;
  }
  const seen = new Set();
  let made = 0;
  for (let v = 0; v < rc.variations * 3 && made < rc.variations; v++) {
    const seed = (rc.key.length * 6151 + v * 92821) >>> 0;
    let ordered = shuffled(pool, seed);
    const startAt = v % ordered.length;
    ordered = [...ordered.slice(startAt), ...ordered.slice(0, startAt)];
    const r = rng(seed);
    if (ordered.length > 6) ordered = ordered.filter(() => r() > 0.2);
    const target = rc.lengths[made % rc.lengths.length];
    const beats = [];
    let t = 0;
    for (const b of ordered) {
      if (beats.length >= 12) break;
      if (t >= target && beats.length >= 4) break;
      beats.push(b);
      t += b.dur;
    }
    if (beats.length < 4) continue;
    const key = seqKey(beats);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name: `${rc.key}_v${made + 1}`,
      title: rc.hooks[made % rc.hooks.length],
      titleVariant: "pill",
      strategy: `${rc.key} · reaction-only · opens on a ${beats[0].kind} · ${beats.length} people · ~${Math.round(t)}s`,
      target_duration: Math.round(t),
      moments: beats.map((b) => ({ inline: { src: b.src, startSec: b.inS, endSec: b.outS } })),
    });
    made++;
  }
  console.log(`· ${rc.key.padEnd(20)} pool ${String(pool.length).padStart(3)} beats -> ${made} variations`);
}

// ---- interleaved: dialogue from one person, reaction from ANOTHER ---------
// question→answer→question→answer is flat. Cutting to a different person's
// smile/laugh between lines is what makes it feel human.
const INTERLEAVED = [
  { key: "religion-reveal", hook: "I TOLD THEM I'M JEWISH", suffix: "human" },
  { key: "shalom", hook: "SHALOM, AND WHAT CAME BACK", suffix: "human" },
  { key: "salam", hook: "SALAM ALAIKUM, AND WHAT CAME BACK", suffix: "human" },
  { key: "where-from", hook: "WHERE ARE YOU FROM?", suffix: "human" },
];
const glue = reactionsBy(["smile", "laugh", "hug", "handshake", "group smiling", "arm around"], { maxDur: 3.6 });
for (const il of INTERLEAVED) {
  const concept = CONCEPTS.find((c) => c.key === il.key);
  if (!concept) continue;
  const pool = poolFor(concept);
  if (pool.length < 3 || glue.length < 3) continue;
  for (let v = 0; v < 2; v++) {
    const seed = (il.key.length * 3571 + v * 51199) >>> 0;
    const talk = shuffled(pool, seed);
    const react = shuffled(glue, seed + 17);
    const beats = [];
    let t = 0;
    let ri = 0;
    for (let i = 0; i < talk.length && t < 30 && beats.length < 10; i++) {
      beats.push(talk[i]);
      t += talk[i].dur;
      // glue beat must be a DIFFERENT person than the line we just heard
      const g = react.find((x, k) => k >= ri && x.clip_id !== talk[i].clip_id);
      if (g) {
        ri = react.indexOf(g) + 1;
        beats.push(g);
        t += g.dur;
      }
    }
    if (beats.length < 4) continue;
    out.push({
      name: `${il.key}_${il.suffix}_v${v + 1}`,
      title: il.hook,
      titleVariant: "pill",
      emphasize: GREET_EMPHASIS,
      strategy: `${il.key} interleaved with other people's reactions · opens with ${beats[0].clip_id} · ~${Math.round(t)}s`,
      target_duration: Math.round(t),
      moments: beats.map((b) => ({
        inline: { src: b.src, startSec: b.inS, endSec: b.outS },
        ...(b.caption ? { caption: b.caption } : {}),
      })),
    });
  }
  console.log(`· ${(il.key + "+reactions").padEnd(20)} -> 2 interleaved variations`);
}

for (const v of out) writeFileSync(join(outDir, `${v.name}.json`), JSON.stringify(v, null, 2));
console.log(`\n✓ ${out.length} compilation specs -> ${outDir}`);
