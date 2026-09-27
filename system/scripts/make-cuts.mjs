#!/usr/bin/env node
/**
 * Generate a big batch of CUT-ONLY edit-JSONs (no captions, no title cards) —
 * "just do a bunch of cuts, best parts, as many as you can".
 *
 *   node scripts/make-cuts.mjs --slug meta-shoot [--build]
 *
 * Two families:
 *   FULL_*  one interaction, its moments in chronological (capture) order,
 *           junk moments dropped. The real conversation, tightened.
 *   COMP_*  best moments across many clips for one concept, one per person,
 *           ranked, a few length variations.
 *
 * Writes scratch/cuts/*.json. With --build, also runs build-reel on each.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { openDb } from "./lib/db.mjs";

const args = process.argv.slice(2);
const slug = (() => {
  const i = args.indexOf("--slug");
  return i >= 0 ? args[i + 1] : "meta-shoot";
})();
const doBuild = args.includes("--build");
const root = process.cwd();
const db = openDb(join(root, "public", "footage", slug, "library.db"));
const outDir = join(root, "scratch", "cuts");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const JUNK = /foreign language|BLANK ?AUDIO|^\s*$|^(music|applause|laughter|singing|noise)\b/i;
const isReal = (s) => s && s.trim().length >= 6 && !JUNK.test(s.trim());
const clipOf = db.prepare("SELECT created_ms, order_index FROM clips WHERE id=?");

const allMoments = db
  .prepare("SELECT m.*, i.kind AS ikind, i.person AS iperson, i.location AS iloc FROM moments m LEFT JOIN interactions i ON i.id=m.interaction_id")
  .all()
  .map((m) => ({ ...m, tags: (() => { try { return JSON.parse(m.tags || "[]"); } catch { return []; } })() }));

const write = (name, strategy, moments) => {
  if (moments.length < 2) return null;
  const spec = { name, captions: false, strategy, target_duration: null, moments };
  writeFileSync(join(outDir, name + ".json"), JSON.stringify(spec, null, 2));
  return name;
};

// ---------- FULL INTERACTIONS ------------------------------------------------
// chronological by capture time of the moment's clip, then in_s
const fullInteractions = [
  ["FULL_BAKERY_MAHMOUD", "INT_0001", "Bakery, one owner (Mahmoud). Try the food -> won't let me pay -> 'the side you don't see online'."],
  ["FULL_BAKERY_AHMADI", "INT_0002", "Bakery + Ahmadi Muslim identity: 'love for all, hatred for none'."],
  ["FULL_AMERICAN_MUSLIM", "INT_0007", "American Muslim tourist: 'I just landed and saw Muslims everywhere' -> what it's like being Muslim here -> hope for the future."],
  ["FULL_MEET_BADIK", "INT_0037", "One named person (Badik): name -> what he wishes people knew about Israel -> his invitation."],
  ["FULL_SRI_LANKA", "INT_0028", "Sri Lankan worker who loves Israel, studied it back home, offers to help clean up."],
  ["FULL_FLOWER_TWIST", "INT_0043", "Flower handoff that turns into a story: thought she was Jewish, she's Christian, caretaker and sister, from Russia."],
  ["FULL_JUGGLE_STREET", "INT_0005", "Playful: strangers on the street, tricks, catch, 'first time', tourists from Berlin."],
  ["FULL_NIGERIAN", "INT_0029", "Nigerian man living in Israel — short, warm."],
  ["FULL_ACRE_CHRISTIAN", "INT_0024", "Christian in Acre — greeting into a conversation."],
];

// a fresh-approach line, after we're already into a conversation, means a NEW
// person — the interaction grouping merged several encounters.
const FRESH_APPROACH = /^\s*(hi\b|hey\b|hello\b|excuse me|sorry to bother|sorry,? (do|are)|i'?m sorry to bother|salam ?alaikum\b.*(do you|are you)|shabbat shalom\b.*(excuse|sorry))/i;
const MAX_BEAT_S = 12; // split anything longer into ~9s chunks
const TARGET_RAW_S = 80;

for (const [name, intId, strategy] of fullInteractions) {
  const ms = allMoments
    .filter((m) => m.interaction_id === intId && isReal(m.speech))
    .map((m) => {
      const c = clipOf.get(m.clip_id) || {};
      return { m, key: (c.created_ms || 0) * 1e4 + (c.order_index || 0) * 100 + m.in_s };
    })
    .sort((a, b) => a.key - b.key)
    .map((x) => x.m);

  const beats = [];
  let total = 0;
  let clipsUsed = new Set();
  for (const m of ms) {
    const prev = beats[beats.length - 1];
    if (prev && prev.moment_id === m.id) continue;
    // skip overlapping same-clip fragments
    const lastM = beats.length ? allMoments.find((x) => x.id === beats[beats.length - 1].moment_id) : null;
    if (lastM && lastM.clip_id === m.clip_id && m.in_s < lastM.out_s + 0.4) continue;

    // once we're 35s+ in and several clips deep, a fresh "excuse me / hi" is a
    // different person — stop, this is where the real conversation ends.
    if (total > 35 && clipsUsed.size >= 2 && FRESH_APPROACH.test(m.speech)) break;

    const dur = m.out_s - m.in_s;
    if (dur > MAX_BEAT_S) {
      // split the long moment into <=9s pieces
      const n = Math.ceil(dur / 9);
      const step = dur / n;
      for (let k = 0; k < n && total < TARGET_RAW_S; k++) {
        beats.push({ moment_id: m.id, in: +(m.in_s + k * step).toFixed(2), out: +(m.in_s + (k + 1) * step).toFixed(2) });
        total += step;
      }
    } else {
      beats.push({ moment_id: m.id });
      total += dur;
    }
    clipsUsed.add(m.clip_id);
    if (total > TARGET_RAW_S) break;
  }
  write(name, strategy, beats);
}

// ---------- CONCEPT COMPILATIONS ------------------------------------------------
const rng = (seed) => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pickByConcept = (re, { min = 2, max = 11, want = 10, seed = 1, exclude = /$^/ }) => {
  const cands = allMoments
    .filter((m) => isReal(m.speech) && re.test(m.speech) && !exclude.test(m.speech))
    .filter((m) => m.out_s - m.in_s >= min && m.out_s - m.in_s <= max)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  // one moment per clip, keep the highest-scoring
  const seen = new Set();
  const uniq = [];
  for (const m of cands) {
    if (seen.has(m.clip_id)) continue;
    seen.add(m.clip_id);
    uniq.push(m);
  }
  const r = rng(seed);
  // light shuffle of the top pool so variations differ
  const pool = uniq.slice(0, Math.max(want + 6, 12));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, want);
};

const concepts = [
  ["COMP_SHABBAT_SHALOM", /shabbat shalom/i, { exclude: /salam|flower|gift/i }],
  ["COMP_SALAM_ALAIKUM", /salam ?alaikum|assalam/i, { exclude: /shabbat/i }],
  ["COMP_SHALOM_AND_SALAM", /shabbat shalom|salam ?alaikum/i, {}],
  ["COMP_GIVING_FLOWERS", /flower|for you.*(free|gift)|gift.*free|these are for you|make your day/i, {}],
  ["COMP_RELIGION_REVEAL", /are you (muslim|jewish|christian)|i'?m (jewish|muslim)|we are brothers|my brother/i, {}],
  ["COMP_WHERE_FROM", /where are you from|welcome to israel|first time in israel|you'?re from/i, {}],
  ["COMP_FEEL_SAFE", /feel safe|as a muslim|as a christian|people are (nice|warm|kind)|not what (they|you) (say|see)/i, {}],
  ["COMP_RESTAURANT_KIND", /on the house|for free|first time|your (guest|guy)|no.*pay|habibi|enjoy/i, {}],
  ["COMP_WARM_GOODBYES", /love you|god bless|stay strong|keep smiling|have an amazing day|nice to meet you|thank you so much/i, {}],
  ["COMP_BEYOND_HEADLINES", /don'?t see online|media|the side of|no one sees|come see it|beyond|they say online/i, {}],
];

for (const [base, re, opts] of concepts) {
  // short + long variation; skip the long one if it would just repeat A
  const shortM = pickByConcept(re, { ...opts, want: 6, seed: base.length * 7 + 6 });
  write(`${base}_A`, `${base} · tight 6-beat`, shortM.map((m) => ({ moment_id: m.id })));
  const longM = pickByConcept(re, { ...opts, want: 11, seed: base.length * 13 + 11 });
  const sigA = shortM.map((m) => m.id).join(",");
  const sigB = longM.slice(0, 6).map((m) => m.id).join(",");
  if (longM.length > 7 && sigA !== sigB) {
    write(`${base}_B`, `${base} · longer ${longM.length}-beat, different order`, longM.map((m) => ({ moment_id: m.id })));
  }
}

// ---------- report + optional build ------------------------------------------
const { readdirSync } = await import("node:fs");
const files = readdirSync(outDir).filter((f) => f.endsWith(".json")).sort();
console.log(`\n${files.length} cut specs → scratch/cuts/\n`);

if (doBuild) {
  let ok = 0;
  let fail = 0;
  for (const f of files) {
    try {
      const out = execFileSync(process.execPath, [join(root, "scripts", "build-reel.mjs"), "--slug", slug, "--spec", join(outDir, f)], {
        stdio: ["ignore", "pipe", "pipe"],
      }).toString();
      const beats = out.match(/\((\d+) beats, ([\d.]+)s\)/);
      console.log(`  ✓ ${f.replace(".json", "").padEnd(28)} ${beats ? beats[1] + " beats " + beats[2] + "s" : ""}`);
      ok++;
    } catch (e) {
      console.log(`  ✗ ${f}: ${String(e.stderr ?? e).split("\n")[0]}`);
      fail++;
    }
  }
  console.log(`\n${ok} built, ${fail} failed. Next: node scripts/render-cuts.mjs`);
}
