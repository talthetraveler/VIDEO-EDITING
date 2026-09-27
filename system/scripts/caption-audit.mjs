#!/usr/bin/env node
// FIND MISHEARD WORDS AUTOMATICALLY.
//
// Tal: "it says 'it took me three HERE' but it should be YEAR. You got to use
// the system to know, fixing words automatically."
//
// There is no button that knows a word is wrong. But there IS a reliable
// signal: transcribe the same audio with a SECOND, BIGGER model and diff them.
// Where whisper-large-v3-turbo and whisper-large-v3 disagree is exactly where
// the model was guessing. Proven on this footage:
//     turbo    : "it take me actually three HERE to build my house"
//     large-v3 : "it take me actually three YEARS to build my house"
//
// Both outputs are valid English, so no spellcheck or confidence threshold
// would ever have caught it. Model disagreement does.
//
// Cheap: large-v3 is the same $0.04/hr. A whole shoot costs about a cent.
//
//   node scripts/caption-audit.mjs <EDIT.json>            # audit clips in an edit
//   node scripts/caption-audit.mjs <EDIT.json> --write    # append to CORRECTIONS.json
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { groqTranscribe, GROQ_LARGE } from "./lib/stt.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const AUDIO = join(ROOT, "projects/_frameio/cache/audio");
const TRANS = join(ROOT, "projects/_frameio/cache/transcripts");
const INDEX = join(ROOT, "projects/_frameio/cache/discover-index.json");

const editPath = process.argv[2];
if (!editPath) { console.error("usage: node scripts/caption-audit.mjs <EDIT.json> [--write]"); process.exit(1); }
const WRITE = process.argv.includes("--write");
const edit = JSON.parse(readFileSync(editPath, "utf8"));

const idx = JSON.parse(readFileSync(INDEX, "utf8"));
const byTag = {};
for (const f of idx.files) {
  const m = /^DJI_\d+_(\d{4})_/.exec(f.name) ?? /_(\d{4})_D?\.MP4$/i.exec(f.name);
  if (m) byTag[m[1]] = f.id;
}

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();

// classic LCS diff over word arrays — we want the substitutions, not a score
function diffWords(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push(["=", a[i]]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push(["-", a[i]]); i++; }
    else { ops.push(["+", b[j]]); j++; }
  }
  while (i < n) ops.push(["-", a[i++]]);
  while (j < m) ops.push(["+", b[j++]]);
  return ops;
}

const tags = [...new Set(edit.beats.map((b) => b[0]))];
console.log(`\nCAPTION AUDIT — ${tags.length} clips, turbo vs ${GROQ_LARGE}\n`);

const found = [];
for (const tag of tags) {
  const id = byTag[tag];
  if (!id) { console.log(`  ${tag}: no id`); continue; }
  const tp = join(TRANS, `${id}.json`);
  if (!existsSync(tp)) { console.log(`  ${tag}: no transcript`); continue; }
  const turbo = JSON.parse(readFileSync(tp, "utf8"));
  const af = readdirSync(AUDIO).find((f) => f.startsWith(id));
  if (!af) { console.log(`  ${tag}: no cached audio`); continue; }

  let big;
  try { big = await groqTranscribe(join(AUDIO, af), { model: GROQ_LARGE }); }
  catch (e) { console.log(`  ${tag}: large-v3 failed — ${e.message.slice(0, 60)}`); continue; }

  const A = norm(turbo.segments.map((s) => s.text).join(" ")).split(" ");
  const B = norm(big.segments.map((s) => s.text).join(" ")).split(" ");
  const ops = diffWords(A, B);

  // collect runs of (-x +y) — a substitution, i.e. the models heard different words
  const subs = [];
  for (let k = 0; k < ops.length; k++) {
    if (ops[k][0] !== "-") continue;
    const del = [], ins = [];
    let p = k;
    while (p < ops.length && ops[p][0] === "-") del.push(ops[p++][1]);
    while (p < ops.length && ops[p][0] === "+") ins.push(ops[p++][1]);
    if (del.length && ins.length && del.length <= 4 && ins.length <= 4) {
      const ctx = ops.slice(Math.max(0, k - 3), k).filter((o) => o[0] === "=").map((o) => o[1]).join(" ");
      subs.push({ ctx, turbo: del.join(" "), large: ins.join(" ") });
    }
    k = p - 1;
  }

  if (!subs.length) { console.log(`  ${tag}: models agree`); continue; }
  console.log(`  ${tag}: ${subs.length} disagreement(s)`);
  for (const s of subs) {
    console.log(`      ...${s.ctx}  [turbo] "${s.turbo}"  vs  [large-v3] "${s.large}"`);
    found.push(s);
  }
}

console.log(`\n${found.length} word(s) where the two models disagree — these are the guesses.`);
console.log(`Listen before trusting either one. large-v3 is usually right, but not always.`);

if (WRITE && found.length) {
  const cf = join(dirname(editPath), "CORRECTIONS.json");
  const j = existsSync(cf) ? JSON.parse(readFileSync(cf, "utf8")) : { corrections: {} };
  j.corrections = j.corrections ?? {};
  let added = 0;
  for (const s of found) {
    if (s.turbo && s.large && !(s.turbo in j.corrections)) { j.corrections[s.turbo] = s.large; added++; }
  }
  j._audited = new Date().toISOString();
  writeFileSync(cf, JSON.stringify(j, null, 2), "utf8");
  console.log(`\n${added} entr(ies) appended to ${cf} — REVIEW THEM, they are suggestions not truth.`);
}
