#!/usr/bin/env node
/**
 * Group consecutive clips into INTERACTIONS and classify each.
 *
 *   node scripts/group-interactions.mjs --slug <shoot> [--gap 120]
 *
 * A new interaction starts when the time gap to the previous clip exceeds --gap
 * seconds (default 120), UNLESS the transcript clearly continues (shared proper
 * nouns / dish words), which bridges a slightly larger gap. Classifies each as
 * greeting | flowers | restaurant | story | street-q | broll | other.
 *
 * Idempotent — rebuilds the interactions table each run.
 */
import { join } from "node:path";
import { openDb } from "./lib/db.mjs";
import { findGreetings, norm } from "./lib/autocut-core.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug");
if (!slug) {
  console.error("Usage: node scripts/group-interactions.mjs --slug <shoot> [--gap 120]");
  process.exit(1);
}
const gap = parseFloat(opt("gap", "120"));

const STOP = new Set(
  "about after again their there these thing think three where which while would could should because people really thank thanks hello you're going gonna wanna".split(
    /\s+/,
  ),
);

const db = openDb(join(process.cwd(), "public", "footage", slug, "library.db"));
const all = db.prepare("SELECT * FROM clips").all();
if (!all.length) {
  console.error("No clips indexed. Run index-footage.mjs first.");
  process.exit(1);
}

/**
 * Capture order comes from the container `creation_time`, NOT the number in the
 * filename — Meta's export numbers files in an order unrelated to when they were
 * shot (seq 1347 predates seq 1243). Only fall back to the sequence id when the
 * clock is missing or degenerate (e.g. an export that stamped every file the
 * same second).
 */
const stamps = all.map((c) => c.created_ms || 0).filter(Boolean);
const distinct = new Set(stamps).size;
const clockSpread = stamps.length > 1 ? (Math.max(...stamps) - Math.min(...stamps)) / 1000 : 0;
const useClock = stamps.length >= all.length * 0.8 && distinct >= all.length * 0.8 && clockSpread > 600;

const clips = useClock
  ? all.sort((a, b) => (a.created_ms || 0) - (b.created_ms || 0))
  : all.sort((a, b) => a.order_index - b.order_index);

const steps = clips.slice(1).map((c, i) => c.order_index - clips[i].order_index).filter((d) => d > 0).sort((a, b) => a - b);
const medStep = steps.length ? steps[Math.floor(steps.length / 2)] : 5;
const seqGap = Math.min(60, Math.max(12, Math.round(medStep * 3.5)));
console.log(
  useClock
    ? `· grouping by capture clock, sorted by creation_time (gap ${gap}s, span ${(clockSpread / 86400).toFixed(1)} days)`
    : `· no usable capture clock — grouping by sequence-id gaps (median step ${medStep}, split at >${seqGap})`,
);

const KW = {
  // real flower words only — "for you" alone matched half the folder
  flowers: /\b(flower|flowers|bouquet|roses?|a gift for you)\b/i,
  restaurant: /\b(restaurant|bakery|baker|kitchen|owner|menu|recipe|family business|how long have you|shekel|falafel|hummus|hommus|shawarma|shakshuka|knafeh|kanafeh|bourekas|coffee shop|cafe|market stall|dish|chef|best thing to eat|time to pay|how much is it)\b/i,
  "street-q": /\b(can i ask you|i wanted to ask|what do you think|where are you from|do you feel|your opinion|how do you feel|what makes you|would you say|do you speak english)\b/i,
  story: /\b(i was born|grew up|my family|years ago|moved here|my story|when i was|i came to|i left|i decided|october 7|my father|my mother)\b/i,
};

const clean = (id) => id; // interaction id helper placeholder

// ---- segment into interactions ----
const groups = [];
let cur = null;
for (const c of clips) {
  const startMs = c.created_ms || 0;
  const endMs = startMs + (c.duration_s || 0) * 1000;
  if (!cur) {
    cur = { clips: [c], startMs, endMs };
    groups.push(cur);
    continue;
  }
  const prevClip = cur.clips[cur.clips.length - 1];
  const gapS = (startMs - cur.endMs) / 1000;
  const seqDelta = c.order_index - prevClip.order_index;
  const prevText = cur.clips.map((x) => x.transcript || "").join(" ").toLowerCase();
  const nouns = new Set(
    (prevText.match(/\b[a-z]{5,}\b/g) || []).filter((w) => !STOP.has(w)),
  );
  const curNouns = ((c.transcript || "").toLowerCase().match(/\b[a-z]{5,}\b/g) || []).filter((w) =>
    nouns.has(w),
  );
  const continues = curNouns.length >= 3;
  const near = useClock ? gapS <= gap : seqDelta <= seqGap;
  const nearish = useClock ? gapS <= gap * 3 : seqDelta <= seqGap * 2.5;
  if (near || (continues && nearish)) {
    cur.clips.push(c);
    cur.endMs = Math.max(cur.endMs, endMs);
  } else {
    cur = { clips: [c], startMs, endMs };
    groups.push(cur);
  }
}

// ---- classify + score ----
/**
 * Order matters: the most specific signal wins. `greetDensity` (greetings per
 * minute) separates a greeting montage — many quick "Shabbat Shalom"s — from a
 * long conversation that merely opens with one.
 */
const classify = (text, clipCount, durS, greetHits) => {
  const t = text.toLowerCase();
  const greetDensity = greetHits / Math.max(durS / 60, 0.2);
  if (KW.flowers.test(t)) return "flowers";
  if (KW.restaurant.test(t)) return "restaurant";
  if (greetDensity >= 4) return "greeting"; // a run of quick greetings
  if (KW.story.test(t)) return "story";
  if (KW["street-q"].test(t)) return "street-q";
  if (greetHits > 0 && durS < 90) return "greeting";
  if (clipCount >= 4 && durS > 120) return "story";
  if (t.replace(/\b(music|blank audio|speaking in foreign language|audience chattering|laughter|birds chirping)\b/gi, "").trim().length < 25)
    return "broll";
  if (greetHits > 0) return "greeting";
  return "other";
};

db.exec("DELETE FROM interactions;");
const ins = db.prepare(`INSERT INTO interactions
  (id,kind,clip_ids,start_ms,duration_s,summary,person,location,score)
  VALUES (?,?,?,?,?,?,?,?,?)`);

const PEOPLE = [
  [/muslim|islam|mosque|ramadan|eid|hijab|quran/i, "Muslim"],
  [/christian|church|jesus|cross|orthodox/i, "Christian"],
  [/jewish|shabbat|synagogue|kippah|torah|rabbi/i, "Jewish"],
  [/nigeria|nigerian/i, "Nigerian"],
  [/korea|korean/i, "South Korean"],
  [/druze/i, "Druze"],
  [/bedouin/i, "Bedouin"],
];
const LOCS = [/jaffa|yafo/i, /tel aviv/i, /jerusalem/i, /haifa/i, /nazareth/i, /akko|acre/i];

let n = 0;
for (const g of groups) {
  const text = g.clips.map((c) => c.transcript || "").join("  ").trim();
  const sumDur = g.clips.reduce((s, c) => s + (c.duration_s || 0), 0);
  const durS = useClock ? (g.endMs - g.startMs) / 1000 || sumDur : sumDur;
  const wordsAll = db
    .prepare(
      `SELECT word,start_s AS start,end_s AS end, norm FROM words WHERE clip_id IN (${g.clips
        .map(() => "?")
        .join(",")}) ORDER BY clip_id, idx`,
    )
    .all(...g.clips.map((c) => c.id));
  const greetHits = findGreetings(wordsAll).length;
  const kind = classify(text, g.clips.length, durS, greetHits);
  const person = PEOPLE.find(([re]) => re.test(text))?.[1] ?? null;
  const location = LOCS.find((re) => re.test(text)) ? text.match(LOCS.find((re) => re.test(text)))[0] : null;

  // score: has speech + reasonable length + greeting/story signal
  let score = 0;
  if (text.length > 40) score += 1;
  if (greetHits) score += greetHits * 0.5;
  if (kind === "story" && durS > 60) score += 1.5;
  if (kind === "restaurant") score += 1;
  if (durS >= 6 && durS <= 180) score += 1;
  score = +score.toFixed(2);

  const id = `INT_${String(++n).padStart(4, "0")}`;
  ins.run(
    id,
    kind,
    JSON.stringify(g.clips.map((c) => c.id)),
    g.startMs,
    +durS.toFixed(1),
    text.slice(0, 400),
    person,
    location,
    score,
  );
}

const byKind = db.prepare("SELECT kind, COUNT(*) n FROM interactions GROUP BY kind ORDER BY n DESC").all();
console.log(`✓ ${n} interactions from ${clips.length} clips (gap ${gap}s)`);
for (const r of byKind) console.log(`   ${String(r.n).padStart(4)}  ${r.kind}`);
console.log("Next: node scripts/extract-moments.mjs --slug " + slug);
void clean;
