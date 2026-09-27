#!/usr/bin/env node
// Turn a list of clip ids into beats trimmed to the SPEECH, with the padding
// Tal's rules require: ~0.12s before the first word, ~0.45s after the last.
// This makes "never cut anyone off" true by construction instead of something
// that has to be hand-tuned per beat and re-checked.
//
//   node scripts/autotrim.mjs <slug> <id[:from-to]> [id ...]
//
// Optional :from-to restricts to a window inside a long clip.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const TRANS = join(ROOT, "projects/_frameio/cache/transcripts");
const HEAD = 0.12, TAIL = 0.45;

const slug = process.argv[2];
const specs = process.argv.slice(3);
if (!slug || !specs.length) { console.error("usage: node scripts/autotrim.mjs <slug> <id[:from-to]>..."); process.exit(1); }
const OUT = join(ROOT, "projects", slug);
mkdirSync(OUT, { recursive: true });

const beats = [];
for (const spec of specs) {
  let [rawId, win] = spec.split(":");
  const ANSWER = rawId.endsWith("!a");
  if (ANSWER) rawId = rawId.slice(0, -2);
  // accept an 8-char prefix as well as a full uuid
  const all = readdirSync(TRANS).filter((f) => f.endsWith(".json"));
  const hit = all.find((f) => f.startsWith(rawId));
  const id = hit ? hit.replace(/\.json$/, "") : rawId;
  const p = join(TRANS, `${id}.json`);
  if (!existsSync(p)) { console.log(`  !! no transcript for ${id}`); continue; }
  const j = JSON.parse(readFileSync(p, "utf8"));
  let words = (j.words ?? []).slice().sort((a, b) => a.start - b.start);
  if (win) {
    const [a, b] = win.split("-").map(Number);
    words = words.filter((w) => w.start >= a - 0.05 && w.end <= b + 0.05);
  }
  if (!words.length) { console.log(`  !! no word timings for ${id} (re-run transcribe with --words)`); continue; }

  // ANSWER MODE (id!a): start just after the last "happy" — the question
  // "hey excuse me sorry what makes you happy" repeats in all 20 clips and
  // Tal's own edit only keeps it at the top. This yields ~2s per person,
  // which is his measured rate (26.5 cuts/min on "Love is the answer").
  if (ANSWER) {
    let cut = -1;
    words.forEach((w, k) => { if (/happ/i.test(String(w.word))) cut = k; });
    if (cut >= 0 && cut < words.length - 1) words = words.slice(cut + 1);
  }
  if (!words.length) { console.log(`  !! nothing after the question in ${id}`); continue; }

  const first = words[0], last = words[words.length - 1];
  // The tail pad must not run into the NEXT word. With continuous speech there
  // is no gap, so clamp to just after the last word instead of blindly adding
  // 0.45s (which put the pad inside "Sister," and eight other words).
  const allW = (j.words ?? []).slice().sort((a, b) => a.start - b.start);
  const after = allW.find((w) => w.start >= last.end - 0.01);
  const gap = after ? Math.max(0, after.start - last.end) : TAIL;
  const ss = +Math.max(0, first.start - HEAD).toFixed(2);
  const to = +(last.end + Math.min(TAIL, Math.max(0.08, gap - 0.05))).toFixed(2);
  const text = words.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();
  beats.push([id, ss, to, 0.5, text.slice(0, 96)]);
  console.log(`  ${id.slice(0, 8)}  ${ss}->${to}  (${(to - ss).toFixed(1)}s)  ${text.slice(0, 64)}`);
}

const total = beats.reduce((t, b) => t + (b[2] - b[1]), 0);
const cfgPath = join(OUT, "edit.json");
const existing = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")) : {};
writeFileSync(cfgPath, JSON.stringify({ ...existing, beats }, null, 2), "utf8");
console.log(`\n${beats.length} beats, ${total.toFixed(1)}s  ->  projects/${slug}/edit.json`);
