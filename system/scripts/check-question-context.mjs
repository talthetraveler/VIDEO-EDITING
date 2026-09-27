#!/usr/bin/env node
/**
 * "Did we cut Tal out before the answer?" — a real check, not a vibe.
 *
 *   node scripts/check-question-context.mjs --slug meta-shoot \
 *        --candidates scratch/review-candidates.json [--id B7]
 *
 * For every beat in every candidate edit, look BACKWARD in that clip's word
 * timings from the beat's in-point. If the words immediately before the cut
 * contain a question (a question word / question phrasing) and that question is
 * NOT inside the beat, the beat probably starts on the answer with the setup
 * missing — which is exactly the "you cut me out, it was too fast" defect.
 *
 * Emits a per-beat report + a suggested new in-point (`suggest_in`) that pulls
 * the start back far enough to include the question. Nothing is auto-applied:
 * changing an in-point is an editorial decision, and the rule is "if unsure,
 * keep MORE context", so a human confirms.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { openDb } from "./lib/db.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug", "meta-shoot");
const candidatesPath = opt("candidates");
const onlyId = opt("id");
const outPath = opt("out", `scratch/question-context-${slug}.json`);

// How far back to look for a question before the cut, and the phrasings that
// count as one. These are HIS questions — the setup that makes an answer land.
const LOOKBACK_S = 6.0;
const QUESTION = /\b(are you|where are you|where you|do you|did you|have you|how are|how long|how old|what('| i)?s your|what do you|what is|why do|why are|can i|could i|would you|may i|tell me|who are|is it|excuse me|sorry to bother|i wanted to ask|i have a question|i wanted to give)\b/i;

const db = openDb(join(process.cwd(), "public", "footage", slug, "library.db"));
const wordsFor = db.prepare("SELECT word,start_s,end_s FROM words WHERE clip_id=? ORDER BY idx");
const clipByPath = db.prepare("SELECT id FROM clips WHERE path=?");
const momentById = db.prepare("SELECT * FROM moments WHERE id=?");
const clipById = db.prepare("SELECT * FROM clips WHERE id=?");
const editByName = db.prepare("SELECT spec_json FROM edits WHERE name=?");

const candidates = JSON.parse(readFileSync(candidatesPath, "utf8")).filter((c) => !onlyId || c.id === onlyId);

const report = [];
let flaggedBeats = 0;
let totalBeats = 0;

for (const cand of candidates) {
  const row = editByName.get(cand.name);
  if (!row) continue;
  const spec = JSON.parse(row.spec_json);
  const beats = [];

  for (const item of spec.moments ?? []) {
    let clipId;
    let inS;
    let outS;
    if (item.inline) {
      clipId = clipByPath.get(item.inline.src)?.id;
      inS = item.in ?? item.inline.startSec;
      outS = item.out ?? item.inline.endSec;
    } else {
      const m = momentById.get(item.moment_id);
      if (!m) continue;
      clipId = m.clip_id;
      inS = item.in ?? m.in_s;
      outS = item.out ?? m.out_s;
    }
    if (!clipId) continue;
    totalBeats++;

    const all = wordsFor.all(clipId).filter((w) => w.word && w.word.trim());
    const before = all.filter((w) => w.end_s <= inS + 0.15 && w.end_s >= inS - LOOKBACK_S);
    const inside = all.filter((w) => (w.start_s + w.end_s) / 2 >= inS && (w.start_s + w.end_s) / 2 <= outS);
    const beforeText = before.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();
    const insideText = inside.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();

    const questionBefore = QUESTION.test(beforeText);
    const questionInside = QUESTION.test(insideText.slice(0, 120));

    if (questionBefore && !questionInside && before.length) {
      // pull the in-point back to the first word of the question phrase
      const mIdx = beforeText.search(QUESTION);
      const wordsBeforeMatch = beforeText.slice(0, mIdx).trim().split(/\s+/).filter(Boolean).length;
      const startWord = before[Math.min(wordsBeforeMatch, before.length - 1)];
      const suggestIn = Math.max(0, (startWord?.start_s ?? inS) - 0.25);
      flaggedBeats++;
      beats.push({
        moment_id: item.moment_id ?? null,
        clip_id: clipId,
        in: +inS.toFixed(2),
        out: +outS.toFixed(2),
        suggest_in: +suggestIn.toFixed(2),
        extra_context_s: +(inS - suggestIn).toFixed(2),
        question_cut: beforeText.slice(-90),
        answer_starts: insideText.slice(0, 70),
      });
    }
  }

  if (beats.length) {
    report.push({
      id: cand.id,
      classification: cand.classification,
      name: cand.name,
      title: cand.title,
      beats_flagged: beats.length,
      beats,
    });
  }
}

report.sort((a, b) => b.beats_flagged - a.beats_flagged);
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`Checked ${candidates.length} candidates · ${totalBeats} beats`);
console.log(`${flaggedBeats} beats start on an answer with the question cut off, across ${report.length} videos.\n`);
console.log("Worst offenders:");
for (const r of report.slice(0, 15)) {
  console.log(`  ${r.id.padEnd(5)} ${String(r.beats_flagged).padStart(2)} beats  ${r.name}`);
  const b = r.beats[0];
  console.log(`         e.g. cut "${b.question_cut}" → starts on "${b.answer_starts}"  (+${b.extra_context_s}s would restore it)`);
}
console.log(`\nFull report: ${outPath}`);
console.log(`Nothing auto-applied — in-points are an editorial call.`);
