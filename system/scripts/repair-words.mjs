#!/usr/bin/env node
/**
 * Repair an existing library whose `words` table holds whisper BPE sub-word
 * tokens instead of words ("Sh" "abb" "at" -> "Shabbat").
 *
 *   node scripts/repair-words.mjs --slug <shoot>
 *
 * Rewrites `words` and `clips.transcript` in place using the leading-space word
 * boundary rule. No re-transcription needed — the timings are already there.
 */
import { join } from "node:path";
import { openDb } from "./lib/db.mjs";
import { mergeTokensToWords } from "./lib/autocut-core.mjs";

const args = process.argv.slice(2);
const slug = (() => {
  const i = args.indexOf("--slug");
  return i >= 0 ? args[i + 1] : null;
})();
if (!slug) {
  console.error("Usage: node scripts/repair-words.mjs --slug <shoot>");
  process.exit(1);
}

const db = openDb(join(process.cwd(), "public", "footage", slug, "library.db"));
const clips = db.prepare("SELECT id FROM clips").all();
const del = db.prepare("DELETE FROM words WHERE clip_id=?");
const ins = db.prepare("INSERT INTO words (clip_id,idx,word,norm,start_s,end_s) VALUES (?,?,?,?,?,?)");
const upd = db.prepare("UPDATE clips SET transcript=? WHERE id=?");

let changed = 0;
let before = 0;
let after = 0;
db.transaction(() => {
  for (const c of clips) {
    const toks = db
      .prepare("SELECT word,start_s AS start,end_s AS end FROM words WHERE clip_id=? ORDER BY idx")
      .all(c.id);
    if (!toks.length) continue;
    const words = mergeTokensToWords(toks);
    before += toks.length;
    after += words.length;
    if (words.length === toks.length) continue;
    del.run(c.id);
    words.forEach((w, k) => ins.run(c.id, k, w.word, w.norm, w.start, w.end));
    upd.run(words.map((w) => w.word).join(" "), c.id);
    changed++;
  }
})();

console.log(`✓ repaired ${changed} clips · ${before} tokens -> ${after} words`);
const sample = db.prepare("SELECT transcript FROM clips WHERE length(transcript)>60 LIMIT 3").all();
for (const s of sample) console.log("  ", s.transcript.slice(0, 110));
console.log("\nRe-run: group-interactions -> extract-moments -> make-variations -> build-reel");
