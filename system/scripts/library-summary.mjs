#!/usr/bin/env node
/**
 * The FIRST BATCH OUTPUT — a readable report of the indexed library.
 *
 *   node scripts/library-summary.mjs --slug <shoot> [--json]
 *
 * Counts, best-of lists, and suggested video ideas + variations. Writes
 * public/footage/<shoot>/SUMMARY.md (and .json with --json).
 */
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { openDb } from "./lib/db.mjs";

const args = process.argv.slice(2);
const slug = (() => {
  const i = args.indexOf("--slug");
  return i >= 0 ? args[i + 1] : null;
})();
if (!slug) {
  console.error("Usage: node scripts/library-summary.mjs --slug <shoot>");
  process.exit(1);
}
const dir = join(process.cwd(), "public", "footage", slug);
const db = openDb(join(dir, "library.db"));

const one = (q, ...p) => db.prepare(q).get(...p) ?? {};
const all = (q, ...p) => db.prepare(q).all(...p);

const totalClips = one("SELECT COUNT(*) n FROM clips").n;
const totalInter = one("SELECT COUNT(*) n FROM interactions").n;
const kinds = all("SELECT kind, COUNT(*) n, SUM(duration_s) s FROM interactions GROUP BY kind ORDER BY n DESC");
const greetMoments = one("SELECT COUNT(*) n FROM moments WHERE tags LIKE '%greeting:%'").n;
const flowerMoments = one("SELECT COUNT(*) n FROM moments WHERE action LIKE '%flower%' OR speech LIKE '%for you%'").n;
const reactions = one("SELECT COUNT(*) n FROM moments WHERE reaction IN ('smile','laugh','reaction')").n;
const hugs = one("SELECT COUNT(*) n FROM moments WHERE action IN ('hug','handshake')").n;
const broll = one(
  "SELECT COUNT(*) n FROM moments WHERE speech='' OR tags LIKE '%visual:%' OR tags LIKE '%market%' OR tags LIKE '%street%'",
).n;
const langs = all("SELECT language, COUNT(*) n FROM clips WHERE language IS NOT NULL GROUP BY language ORDER BY n DESC");

const bestStories = all(
  "SELECT id,summary,person,duration_s,score FROM interactions WHERE kind IN ('story','restaurant') ORDER BY score DESC, duration_s DESC LIMIT 8",
);
const bestGreetings = all(
  "SELECT m.id,m.speech,m.person,m.clip_id,m.in_s,m.out_s,m.score FROM moments m WHERE m.tags LIKE '%greeting:%' ORDER BY m.score DESC LIMIT 12",
);
const bestReactions = all(
  "SELECT id,speech,reaction,person,clip_id,in_s,out_s,score FROM moments WHERE reaction IN ('smile','laugh','reaction') ORDER BY score DESC LIMIT 12",
);
const bestFlowers = all(
  "SELECT id,speech,person,clip_id,in_s,out_s,score FROM moments WHERE action LIKE '%flower%' OR speech LIKE '%for you%' ORDER BY score DESC LIMIT 10",
);
const bestBroll = all(
  "SELECT id,tags,clip_id,in_s,out_s,score FROM moments WHERE speech='' AND (tags LIKE '%visual:%' OR tags LIKE '%market%' OR tags LIKE '%street%' OR tags LIKE '%food closeup%') ORDER BY score DESC LIMIT 12",
);

const kindN = Object.fromEntries(kinds.map((k) => [k.kind, k.n]));
const ideas = [];
if ((kindN.greeting || 0) + (kindN.flowers || 0) >= 3)
  ideas.push(
    "GREETING REELS — many variations from the greeting moment pool: (v1) Shalom first, (v2) Salam first, (v3) strongest reaction first, (v4) alternate Muslim/Jewish, (v5) 10s, (v6) 15s, (v7) 30s, (v8) only greetings, (v9) greetings + smiles + hugs.",
  );
if ((kindN.flowers || 0) >= 3)
  ideas.push("FLOWER REELS — 'Shalom, these are for you' / 'Salam, these are for you' → handoff → smile/thank-you/hug. Vary hook, person order, duration.");
for (const s of bestStories.slice(0, 3))
  ideas.push(`STORY — ${s.person ? s.person + ": " : ""}${(s.summary || "").slice(0, 90)}… (${s.id}, ${Math.round(s.duration_s)}s)`);
if (broll >= 10) ideas.push("B-ROLL PACK — market / street / food-closeup moments, reusable across every edit.");

const md = `# ${slug} — footage library

TOTAL CLIPS: ${totalClips}
INTERACTIONS: ${totalInter}
${kinds.map((k) => `${k.kind.toUpperCase().padEnd(14)} ${k.n}  (${Math.round(k.s || 0)}s)`).join("\n")}

GREETING MOMENTS: ${greetMoments}
FLOWER MOMENTS: ${flowerMoments}
STRONG REACTIONS: ${reactions}
HUGS / HANDSHAKES: ${hugs}
USEFUL B-ROLL: ${broll}
LANGUAGES: ${langs.map((l) => `${l.language}:${l.n}`).join("  ") || "?"}

## BEST STORIES
${bestStories.map((s) => `- ${s.id}  ${s.person ?? ""}  ${Math.round(s.duration_s)}s  score ${s.score}\n  ${(s.summary || "").slice(0, 160)}`).join("\n") || "- (none)"}

## BEST GREETINGS
${bestGreetings.map((m) => `- ${m.id}  ${m.person ?? ""}  ${m.clip_id} ${m.in_s}-${m.out_s}s  "${m.speech.slice(0, 60)}"`).join("\n") || "- (none)"}

## BEST REACTIONS
${bestReactions.map((m) => `- ${m.id}  ${m.reaction}  ${m.person ?? ""}  ${m.clip_id} ${m.in_s}-${m.out_s}s`).join("\n") || "- (none)"}

## BEST FLOWER MOMENTS
${bestFlowers.map((m) => `- ${m.id}  ${m.person ?? ""}  ${m.clip_id} ${m.in_s}-${m.out_s}s  "${m.speech.slice(0, 60)}"`).join("\n") || "- (none)"}

## BEST B-ROLL
${bestBroll.map((m) => `- ${m.id}  ${JSON.parse(m.tags).join(",")}  ${m.clip_id} ${m.in_s}-${m.out_s}s`).join("\n") || "- (none)"}

## POSSIBLE VIDEO IDEAS
${ideas.map((i) => `- ${i}`).join("\n")}

---
Build a variation:  node scripts/build-reel.mjs --slug ${slug} --spec <edit.json>
Search moments:      node scripts/search.mjs --slug ${slug} "people hugging"
`;

writeFileSync(join(dir, "SUMMARY.md"), md);
console.log(md);
console.log(`\n✓ public/footage/${slug}/SUMMARY.md`);
if (args.includes("--json")) {
  writeFileSync(
    join(dir, "SUMMARY.json"),
    JSON.stringify({ totalClips, totalInter, kinds, greetMoments, flowerMoments, reactions, hugs, broll, langs, bestStories, bestGreetings, bestReactions, bestFlowers, bestBroll, ideas }, null, 2),
  );
  console.log(`✓ public/footage/${slug}/SUMMARY.json`);
}
