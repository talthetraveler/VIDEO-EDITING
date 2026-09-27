#!/usr/bin/env node
/**
 * Turn an indexed shoot into a PROPOSAL worksheet — interactions + compilations,
 * each with 2–3 variations — for Tal + Claude to approve. Builds nothing.
 *
 *   node scripts/proj-catalog.mjs --slug meta-shoot [--out projects/_catalog.json]
 *
 * Pipeline:
 *   npm run index -- "<folder>" --slug <s>   (once, if the shoot isn't indexed)
 *   npm run group / moments / extract-reactions
 *   node scripts/build-full-interactions.mjs  (writes scratch/full/*.json seeds)
 *   node scripts/proj-catalog.mjs --slug <s>  ← THIS: the proposal
 *   → Claude shows Tal the list, Tal picks; then per approved variation:
 *       node scripts/proj-new.mjs --from-full <SEED> ...            (Variation A)
 *       node scripts/proj-new.mjs --from-full <SEED> --hook <M> ... (Variation B)
 *
 * WHY it only proposes: CLAUDE.md §2.8 — ranking a story's moments by score and
 * taking the top N produces a quote collage, not a story. The judgment (which
 * interactions carry a full video, what the real hook is, how a compilation is
 * ordered) is Claude's, done with Tal. This script lays out the raw material and
 * a starting guess; it never assembles a final edit.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { openDb } from "./lib/db.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug", "meta-shoot");
const outPath = join(root, opt("out", "projects/_catalog.json"));

const dbPath = join(root, "public", "footage", slug, "library.db");
if (!existsSync(dbPath)) {
  console.error(`✗ ${dbPath} not found — run:  npm run index -- "<folder>" --slug ${slug}`);
  process.exit(1);
}
const db = openDb(dbPath);
const J = (s) => {
  try {
    return JSON.parse(s || "[]");
  } catch {
    return [];
  }
};
const snippet = (s, n = 90) => (s || "").replace(/\s+/g, " ").trim().slice(0, n);
const titleCase = (s) => (s || "").replace(/\b\w/g, (c) => c.toUpperCase());

// ---- 1. full-story candidates from the vetted seed specs ------------------
const seedDir = join(root, "scratch", "full");
const seedFiles = existsSync(seedDir) ? readdirSync(seedDir).filter((f) => f.endsWith(".json")) : [];
const momInfo = db.prepare("SELECT id, clip_id, in_s, out_s, speech, person, energy, score, tags FROM moments WHERE id=?");

const stories = [];
for (const f of seedFiles) {
  const seedId = f.replace(/\.json$/, "");
  const seed = JSON.parse(readFileSync(join(seedDir, f), "utf8"));
  const moms = (seed.moments || [])
    .map((m) => ({ ...m, info: momInfo.get(m.moment_id) }))
    .filter((m) => m.info);
  if (moms.length < 2) continue;

  let acc = 0;
  const total = moms.reduce((s, m) => s + Math.max(0, m.out - m.in), 0);
  const withPos = moms.map((m) => {
    const frac = total ? acc / total : 0;
    acc += Math.max(0, m.out - m.in);
    return { ...m, frac };
  });
  // suggested hook for Variation B: strongest beat in the back 55% of the talk
  const backHalf = withPos.filter((m) => m.frac >= 0.45);
  const hookPick = (backHalf.length ? backHalf : withPos)
    .slice()
    .sort((a, b) => {
      const ea = a.info.energy === "high" ? 2 : a.info.energy === "medium" ? 1 : 0;
      const eb = b.info.energy === "high" ? 2 : b.info.energy === "medium" ? 1 : 0;
      return eb - ea || (b.info.score ?? 0) - (a.info.score ?? 0) || b.frac - a.frac;
    })[0];

  const persons = [...new Set(moms.map((m) => m.info.person).filter(Boolean))];
  stories.push({
    id: `story:${seedId}`,
    kind: "story",
    seed: seedId,
    title_guess: titleCase(seed.strategy || seedId.replace(/^FI_/, "").replace(/_/g, " ")),
    persons,
    est_duration_s: +total.toFixed(1),
    moment_count: moms.length,
    strategy: seed.strategy ?? null,
    variations: [
      {
        variation_id: "A",
        type: "natural",
        note: "the interaction edited down, chronological. Build: proj-new --from-full " + seedId,
        build: `node scripts/proj-new.mjs --slug ${slug} --name <name>-A --from-full ${seedId} --brief "..."`,
      },
      hookPick && {
        variation_id: "B",
        type: "hook_first",
        hook_moment: hookPick.moment_id,
        hook_window: [hookPick.in, hookPick.out],
        hook_speech: snippet(hookPick.info.speech, 120),
        note:
          `SUGGESTED hook only (strongest back-half beat @ ${Math.round(hookPick.frac * 100)}%). ` +
          `Confirm it's a real curiosity line and trim --hook-in/--hook-out to the punch.`,
        build:
          `node scripts/proj-new.mjs --slug ${slug} --name <name>-B --from-full ${seedId} ` +
          `--hook ${hookPick.moment_id} --hook-in ${hookPick.in} --hook-out ${hookPick.out} --brief "..."`,
      },
    ].filter(Boolean),
    status: "proposed",
  });
}

// ---- 2. raw interaction rows (raw material, flagged) --------------------
const rawInteractions = db
  .prepare("SELECT id, kind, clip_ids, duration_s, summary, person, location, score FROM interactions ORDER BY score DESC")
  .all()
  .map((r) => {
    const clips = J(r.clip_ids);
    const merged = clips.length > 3 || r.duration_s > 90;
    return {
      id: `interaction:${r.id}`,
      kind: "interaction_raw",
      interaction_id: r.id,
      category: r.kind,
      person: r.person,
      location: r.location,
      clip_count: clips.length,
      duration_s: +(r.duration_s ?? 0).toFixed(1),
      score: r.score,
      summary: snippet(r.summary, 160),
      needs_review: merged,
      review_note: merged
        ? "likely several encounters merged (>3 clips or >90s) — read its moments and split before treating as a story (CLAUDE.md §7)."
        : "compact — could be one real interaction; verify the person then add a seed via build-full-interactions.",
      status: "raw",
    };
  });

// ---- 3. compilation proposals from moment clusters --------------------
const allMoments = db
  .prepare("SELECT id, interaction_id, clip_id, in_s, out_s, speech, person, tags, reaction, energy, score FROM moments")
  .all()
  .map((m) => ({ ...m, tagList: J(m.tags) }));

const clusters = {};
const addTo = (key, m) => ((clusters[key] ??= []).push(m));
for (const m of allMoments) {
  const dur = m.out_s - m.in_s;
  if (dur < 1 || dur > 14) continue; // compilation beats are short
  if (m.reaction) addTo(`reaction:${m.reaction}`, m);
  for (const t of m.tagList) addTo(`tag:${String(t).toLowerCase()}`, m);
  if (m.person) addTo(`person:${m.person}`, m);
  if (/\b(salam|shalom|hello|hi|nice to meet)\b/i.test(m.speech || "")) addTo("theme:greetings", m);
}
const comps = Object.entries(clusters)
  .filter(([, ms]) => ms.length >= 4)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 12)
  .map(([key, ms]) => {
    const picked = ms
      .slice()
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 14);
    const byEnergy = [...picked].sort(
      (a, b) => (b.energy === "high" ? 2 : b.energy === "medium" ? 1 : 0) - (a.energy === "high" ? 2 : a.energy === "medium" ? 1 : 0),
    );
    return {
      id: `compilation:${key}`,
      kind: "compilation",
      cluster: key,
      pool_size: ms.length,
      persons: [...new Set(picked.map((m) => m.person).filter(Boolean))],
      candidate_moment_ids: picked.map((m) => m.id),
      est_duration_s: +picked.reduce((s, m) => s + (m.out_s - m.in_s), 0).toFixed(1),
      variations: [
        { variation_id: "A", type: "order:score", moment_ids: picked.map((m) => m.id), note: "strongest beats first" },
        { variation_id: "B", type: "order:energy", moment_ids: byEnergy.map((m) => m.id), note: "highest-energy cold open" },
      ],
      note: "candidate pool only — Claude picks the real set, drops repeats/greetings, and writes a seed spec. Do NOT ship the top-N as-is.",
      status: "proposed",
    };
  });

// ---- write + report -------------------------------------------------
const catalog = {
  slug,
  generated_at: new Date().toISOString(),
  summary: {
    story_candidates: stories.length,
    raw_interactions: rawInteractions.length,
    raw_needs_review: rawInteractions.filter((r) => r.needs_review).length,
    compilation_pools: comps.length,
  },
  stories,
  compilations: comps,
  raw_interactions: rawInteractions,
};
writeFileSync(outPath, JSON.stringify(catalog, null, 2));

console.log(`\n✓ ${outPath}`);
console.log(`\n  STORY CANDIDATES (vetted seeds) — ${stories.length}`);
for (const s of stories)
  console.log(
    `   • ${s.seed.padEnd(28)} ${String(s.est_duration_s).padStart(5)}s  ${s.persons.join("/") || "?"}  ` +
      `→ A natural${s.variations.find((v) => v.variation_id === "B") ? " + B hook-first(" + s.variations.find((v) => v.variation_id === "B").hook_moment + ")" : ""}`,
  );
console.log(`\n  COMPILATION POOLS — ${comps.length}`);
for (const c of comps) console.log(`   • ${c.cluster.padEnd(24)} pool ${String(c.pool_size).padStart(3)}  pick ${c.candidate_moment_ids.length}  ~${c.est_duration_s}s`);
console.log(`\n  RAW INTERACTIONS — ${rawInteractions.length} (${catalog.summary.raw_needs_review} need splitting before use)`);
console.log(`\nNext: Claude reviews projects/_catalog.json with Tal, then builds approved variations with proj-new.`);
