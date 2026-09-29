#!/usr/bin/env node
// CAPTION COVERAGE — is every spoken word of every beat actually on screen?
//
//   node scripts/caption-coverage.mjs <slug> [<slug> ...]
//
// Written 2026-09-29 after the caption-hold change silently dropped "not good"
// (a 0.18s line fell under a pre-hold 0.2s floor). Compares, per beat, the
// words of the transcript segments inside the beat window with the words of the
// rendered captions (BUILD-LOG.json). English clips only - a translated clip's
// captions are a different language from its transcript and are skipped.
// Prints missing words; exit 1 if any beat is missing more than 1 word.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const CACHE = join(ROOT, "projects/_frameio/cache");
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']/g, "");
let worst = 0;
for (const slug of process.argv.slice(2)) {
  const edit = JSON.parse(readFileSync(join(ROOT, "projects", slug, "edit.json"), "utf8"));
  const caps = JSON.parse(readFileSync(join(ROOT, "projects", slug, "BUILD-LOG.json"), "utf8")).captions ?? [];
  const fixes = (edit.captionFix ?? []).length;
  let missingTotal = 0, spokenTotal = 0, skipped = 0;
  edit.beats.forEach((b, i) => {
    if (!b || b[0] === "CARD") return;
    const [id, ss, to] = b;
    if (existsSync(join(CACHE, "translate", `${id}.json`))) { skipped++; return; }
    const t = JSON.parse(readFileSync(join(CACHE, "transcripts", `${id}.json`), "utf8"));
    const spoken = (t.words ?? []).filter((w) => (w.start + w.end) / 2 >= ss && (w.start + w.end) / 2 <= to).map((w) => norm(w.word)).filter(Boolean);
    const n = String(i + 1).padStart(2, "0");
    const shown = caps.filter((c) => c.beat === n).flatMap((c) => String(c.text).split(/\s+/)).map(norm).filter(Boolean);
    const bag = new Map(); for (const w of shown) bag.set(w, (bag.get(w) ?? 0) + 1);
    const missing = [];
    for (const w of spoken) { const k = bag.get(w) ?? 0; if (k > 0) bag.set(w, k - 1); else missing.push(w); }
    spokenTotal += spoken.length; missingTotal += missing.length;
    if (missing.length > 1) console.log(`  ${slug} beat ${n}: missing ${missing.length}/${spoken.length}: ${missing.join(" ")}`);
    worst = Math.max(worst, missing.length);
  });
  console.log(`${slug}: ${spokenTotal - missingTotal}/${spokenTotal} spoken words on screen` +
    (skipped ? ` (${skipped} translated beats skipped)` : "") + (fixes ? ` (${fixes} captionFix rules - some "missing" words may be deliberate)` : ""));
}
process.exit(worst > 1 ? 1 : 0);
