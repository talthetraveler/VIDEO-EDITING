#!/usr/bin/env node
/**
 * Apply the "don't cut Tal out before the answer" fix to candidate edits.
 *
 *   node scripts/apply-question-context.mjs --slug meta-shoot \
 *        --candidates scratch/review-candidates.json [--dry]
 *
 * Runs the same detection as check-question-context.mjs, then pulls each
 * flagged beat's in-point BACK so the question that sets up the answer is
 * inside the cut. His rule: "If you're unsure, keep slightly more context
 * rather than cutting me out."
 *
 * Guards:
 *  - never extend past the start of the clip
 *  - never extend back into the previous beat if that beat is from the SAME
 *    clip (would duplicate footage / overlap)
 *  - cap the extension at MAX_EXTEND_S so one bad match can't drag in half a
 *    clip; if the question is further back than that, flag it for a human
 *    instead of silently grabbing 20s
 *
 * Writes patched specs to scratch/patched/<name>.json and rebuilds each
 * composition through build-reel.mjs (which regenerates word-level captions).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { openDb } from "./lib/db.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug", "meta-shoot");
const candidatesPath = opt("candidates");
const dry = args.includes("--dry");

const LOOKBACK_S = 6.0;
const MAX_EXTEND_S = 7.0;
const QUESTION = /\b(are you|where are you|where you|do you|did you|have you|how are|how long|how old|what('| i)?s your|what do you|what is|why do|why are|can i|could i|would you|may i|tell me|who are|is it|excuse me|sorry to bother|i wanted to ask|i have a question|i wanted to give)\b/i;

const root = process.cwd();
const db = openDb(join(root, "public", "footage", slug, "library.db"));
const wordsFor = db.prepare("SELECT word,start_s,end_s FROM words WHERE clip_id=? ORDER BY idx");
const clipByPath = db.prepare("SELECT id FROM clips WHERE path=?");
const momentById = db.prepare("SELECT * FROM moments WHERE id=?");
const editByName = db.prepare("SELECT spec_json FROM edits WHERE name=?");

const candidates = JSON.parse(readFileSync(candidatesPath, "utf8"));
const patchDir = join(root, "scratch", "patched");
mkdirSync(patchDir, { recursive: true });

let patchedEdits = 0;
let patchedBeats = 0;
let tooFarBack = 0;
let blockedByPrev = 0;
const rebuilt = [];
const needsHuman = [];

for (const cand of candidates) {
  const row = editByName.get(cand.name);
  if (!row) continue;
  const spec = JSON.parse(row.spec_json);
  let changed = 0;
  let prev = null; // { clipId, out }

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
    if (!clipId) {
      prev = null;
      continue;
    }

    const all = wordsFor.all(clipId).filter((w) => w.word && w.word.trim());
    const before = all.filter((w) => w.end_s <= inS + 0.15 && w.end_s >= inS - LOOKBACK_S);
    const inside = all.filter((w) => (w.start_s + w.end_s) / 2 >= inS && (w.start_s + w.end_s) / 2 <= outS);
    const beforeText = before.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();
    const insideText = inside.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();

    if (before.length && QUESTION.test(beforeText) && !QUESTION.test(insideText.slice(0, 120))) {
      const mIdx = beforeText.search(QUESTION);
      const wordsBeforeMatch = beforeText.slice(0, mIdx).trim().split(/\s+/).filter(Boolean).length;
      const startWord = before[Math.min(wordsBeforeMatch, before.length - 1)];
      let suggestIn = Math.max(0, (startWord?.start_s ?? inS) - 0.25);

      if (inS - suggestIn > MAX_EXTEND_S) {
        tooFarBack++;
        needsHuman.push({ id: cand.id, name: cand.name, moment_id: item.moment_id ?? null, in: +inS.toFixed(2), would_need: +(inS - suggestIn).toFixed(2), question: beforeText.slice(-90) });
      } else if (prev && prev.clipId === clipId && suggestIn < prev.out) {
        // the question is already covered by the previous beat from this clip
        blockedByPrev++;
      } else {
        item.in = +suggestIn.toFixed(2);
        item.out = +outS.toFixed(2);
        item._question_context_added = +(inS - suggestIn).toFixed(2);
        changed++;
        patchedBeats++;
      }
    }
    prev = { clipId, out: outS };
  }

  if (changed) {
    patchedEdits++;
    spec._revision = `question-context v1 — ${changed} beat(s) pulled back to include the setup question`;
    const file = join(patchDir, cand.name.replace(/[^a-z0-9_-]/gi, "_") + ".json");
    writeFileSync(file, JSON.stringify(spec, null, 2));
    rebuilt.push({ id: cand.id, name: cand.name, changed, file });
  }
}

console.log(`${patchedBeats} beats patched across ${patchedEdits} edits`);
console.log(`${blockedByPrev} skipped (question already covered by the previous beat)`);
console.log(`${tooFarBack} skipped (question further back than ${MAX_EXTEND_S}s — needs a human)`);

if (needsHuman.length) {
  writeFileSync(join(root, "scratch", "question-context-needs-human.json"), JSON.stringify(needsHuman, null, 2));
  console.log(`  → scratch/question-context-needs-human.json`);
}

if (dry) {
  console.log("\n--dry: nothing rebuilt.");
  process.exit(0);
}

console.log(`\nRebuilding ${rebuilt.length} compositions (also regenerates word-level captions)…`);
let ok = 0;
let fail = 0;
for (const r of rebuilt) {
  try {
    execFileSync(process.execPath, [join(root, "scripts", "build-reel.mjs"), "--slug", slug, "--spec", r.file], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    ok++;
  } catch (e) {
    fail++;
    console.error(`✗ ${r.id} ${r.name}: ${String(e.stderr ?? e).slice(0, 200)}`);
  }
}
console.log(`✓ rebuilt ${ok}${fail ? `, ${fail} failed` : ""}`);
