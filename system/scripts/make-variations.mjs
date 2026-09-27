#!/usr/bin/env node
/**
 * Variation generator — turn the moment library into many edit-JSONs.
 *
 *   node scripts/make-variations.mjs --slug <shoot> [--out edits/<shoot>]
 *
 * Every reel is just a selection over the same indexed moments, so producing a
 * new angle costs nothing. Writes one edit-JSON per variation; feed each to
 * build-reel.mjs.
 *
 * Captions are NOT taken raw from whisper — it writes "Sh abb at Sha lo m".
 * Greeting beats get a clean caption derived from the detected phrase.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { openDb } from "./lib/db.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug");
if (!slug) {
  console.error("Usage: node scripts/make-variations.mjs --slug <shoot>");
  process.exit(1);
}
const outDir = opt("out", join("edits", slug));
mkdirSync(outDir, { recursive: true });

const db = openDb(join(process.cwd(), "public", "footage", slug, "library.db"));
const flat = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Clean, on-screen-safe caption for a greeting beat. */
const greetCaption = (speech) => {
  const f = flat(speech);
  if (/waalaikum(as)?salam/.test(f)) return "Wa Alaikum Salam";
  if (/shabbat?shalom|shabatshalom/.test(f)) return "Shabbat Shalom";
  if (/(as)?salam[ou]?alaikum|assalam/.test(f)) return "Salam Alaikum";
  if (/marhaba/.test(f)) return "Marhaba";
  if (/shalom/.test(f)) return "Shalom";
  if (/peacebeuponyou/.test(f)) return "Peace be upon you";
  return null;
};
/**
 * On-screen caption for a non-greeting beat. His captions are 2-6 words, so
 * take the opening clause rather than dumping the whole utterance.
 */
const DANGLING = /^(it|was|is|are|and|but|so|to|the|a|an|that|of|for|i|you|we|they|my|this|in|on|at|with|because|like|do|can|have|has|these|those|some|its|it's|there)$/i;
const shortCaption = (speech, maxWords = 6) => {
  const clean = (speech || "").replace(/\s+/g, " ").trim();
  if (clean.length < 3) return null;
  const words = clean.split(" ").slice(0, maxWords);
  // don't leave the caption hanging on a function word ("…so much it was")
  while (words.length > 2 && DANGLING.test(words[words.length - 1])) words.pop();
  const cut = words.join(" ").replace(/[,;:]$/, "");
  return cut.length >= 3 ? cut : null;
};

const greetKind = (speech) => {
  const c = greetCaption(speech);
  if (!c) return "other";
  if (c === "Shabbat Shalom" || c === "Shalom") return "shalom";
  if (c === "Salam Alaikum" || c === "Wa Alaikum Salam" || c === "Marhaba" || c === "Peace be upon you") return "salam";
  return "other";
};

// ---- candidate pools ----------------------------------------------------
const greetPool = db
  .prepare(
    `SELECT m.*, (m.out_s - m.in_s) dur FROM moments m
     WHERE m.tags LIKE '%greeting:%' AND (m.out_s-m.in_s) BETWEEN 1.8 AND 9 AND length(m.speech) > 5
     ORDER BY m.score DESC`,
  )
  .all()
  .map((m) => ({ ...m, caption: greetCaption(m.speech), kind: greetKind(m.speech) }))
  .filter((m) => m.caption);

// one beat per source clip — never show the same person twice in a reel
const dedupe = (rows) => {
  const seen = new Set();
  return rows.filter((r) => (seen.has(r.clip_id) ? false : (seen.add(r.clip_id), true)));
};

const shalom = dedupe(greetPool.filter((m) => m.kind === "shalom"));
const salam = dedupe(greetPool.filter((m) => m.kind === "salam"));
const withReaction = dedupe(greetPool.filter((m) => m.reaction));
const withContact = dedupe(greetPool.filter((m) => ["hug", "handshake"].includes(m.action)));

// "for you" alone pulled in every greeting — require an actual gift/flower word.
const flowerPool = dedupe(
  db
    .prepare(
      `SELECT m.*, (m.out_s-m.in_s) dur FROM moments m
       WHERE (m.speech LIKE '%gift%' OR m.speech LIKE '%flower%' OR m.speech LIKE '%bouquet%')
         AND (m.out_s-m.in_s) BETWEEN 2 AND 12 AND length(m.speech) > 12
       ORDER BY m.score DESC`,
    )
    .all(),
);

/** Take beats until the target duration is reached. */
const fill = (rows, targetS) => {
  const out = [];
  let t = 0;
  for (const r of rows) {
    if (t >= targetS) break;
    out.push(r);
    t += r.dur;
  }
  return out;
};

/** Interleave two arrays. */
const zip = (a, b) => {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
};

/** Paint the greeting itself cream/gold — his two-tone caption look. */
const GREET_EMPHASIS = "shabbat|shalom|salam|alaikum|marhaba|peace";

const spec = (name, title, beats, strategy, extra = {}) => ({
  name,
  title,
  titleVariant: "pill",
  strategy,
  emphasize: GREET_EMPHASIS,
  target_duration: Math.round(beats.reduce((s, b) => s + b.dur, 0)),
  moments: beats.map((b) => ({
    moment_id: b.id,
    caption: b.caption ?? shortCaption(b.speech) ?? undefined,
  })),
  ...extra,
});

const variations = [];

if (shalom.length && salam.length) {
  variations.push(
    spec("greetings_shalom_first", "SAYING SHALOM TO STRANGERS", fill([...shalom, ...salam], 26), "Shalom beats first, then Salam"),
    spec("greetings_salam_first", "SAYING SALAM TO STRANGERS", fill([...salam, ...shalom], 26), "Salam beats first, then Shalom"),
    spec("greetings_alternating", "SHALOM. SALAM. SAME STREET.", fill(zip(shalom, salam), 30), "Alternate Jewish / Muslim greetings"),
    spec("greetings_15s", "I SAID SHALOM TO STRANGERS", fill(zip(shalom, salam), 15), "Tightest cut, 15s"),
  );
}
if (withReaction.length >= 4)
  variations.push(spec("greetings_best_reactions", "THE REACTIONS SAY EVERYTHING", fill(withReaction, 24), "Strongest reactions first"));
if (withContact.length >= 3)
  variations.push(spec("greetings_hugs", "STRANGERS WHO HUGGED ME", fill(withContact, 22), "Hug / handshake beats only"));
if (shalom.length >= 6)
  variations.push(spec("greetings_shalom_only", "ONLY SHABBAT SHALOM", fill(shalom, 25), "Shalom greetings only"));
if (salam.length >= 5)
  variations.push(spec("greetings_salam_only", "ONLY SALAM ALAIKUM", fill(salam, 25), "Salam greetings only"));
if (flowerPool.length >= 3)
  variations.push(spec("flowers_gift", "I GAVE STRANGERS FLOWERS", fill(flowerPool, 28), "Flower / gift handoffs"));

// ---- story reels: one per strong interaction ----------------------------
const stories = db
  .prepare(
    `SELECT * FROM interactions WHERE kind IN ('restaurant','story') AND duration_s > 120 ORDER BY score DESC LIMIT 4`,
  )
  .all();
for (const it of stories) {
  // A story is carried by what the person SAYS, in order. Sorting by score
  // pulled greeting beats to the front (greetings score highest), which turned
  // restaurant stories into greeting montages — so exclude greeting-tagged
  // beats here and keep strict chronological order.
  const beats = db
    .prepare(
      `SELECT *, (out_s-in_s) dur FROM moments
       WHERE interaction_id=? AND (out_s-in_s) BETWEEN 2 AND 11
         AND length(speech) > 45 AND tags NOT LIKE '%greeting:%'
       ORDER BY clip_id ASC, in_s ASC`,
    )
    .all(it.id);
  if (beats.length < 4) continue;
  const short = it.id.replace("INT_", "");
  variations.push(
    spec(`story_${short}`, it.kind === "restaurant" ? "MEETING THE OWNER" : "HIS STORY", beats.slice(0, 8), `Story from ${it.id}`, {
      uppercaseCaptions: false,
    }),
  );
}

for (const v of variations) {
  writeFileSync(join(outDir, `${v.name}.json`), JSON.stringify(v, null, 2));
  console.log(`${v.name.padEnd(28)} ${String(v.moments.length).padStart(2)} beats  ~${v.target_duration}s`);
}
console.log(`\n✓ ${variations.length} edit specs -> ${outDir}`);
console.log(`pools: shalom ${shalom.length} · salam ${salam.length} · reactions ${withReaction.length} · contact ${withContact.length} · flowers ${flowerPool.length}`);
