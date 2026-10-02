#!/usr/bin/env node
// MAKE-VARIATION — a new edit from an existing, already-verified edit.
//
//   node scripts/make-variation.mjs <from-slug> <new-slug> --order 3,1,2,4...   (1-based beat numbers)
//   node scripts/make-variation.mjs <from-slug> <new-slug> --first 5            (move beat 5 to the front)
//   node scripts/make-variation.mjs <from-slug> <new-slug> --keep 1,2,5,7        (subset, in this order)
//   node scripts/make-variation.mjs <from-slug> <new-slug> --prepend <id>:<a>-<b>  (a new hook beat, trimmed with autotrim)
//   plus  --title "LINE 1\nLINE 2"  --out "NAME.mp4"
//
// Tal, 2026-09-29: *"you can make variations … starting with different
// people … you can make a bunch of content up from all this."* A variation
// reuses beats that were already cut on word boundaries, verified and caption-
// read, so its risk is in the ORDER, not the cuts. It is still rebuilt and
// re-gated (verify-cut, selfreview, caption-coverage) like any other edit.
// Every variation records where it came from in edit.json `"variationOf"`.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const a = process.argv.slice(2);
const [from, to] = a;
const opt = (k) => (a.includes(k) ? a[a.indexOf(k) + 1] : null);
if (!from || !to) { console.error("usage: node scripts/make-variation.mjs <from-slug> <new-slug> [--order|--first|--keep|--prepend] [--title] [--out]"); process.exit(2); }
const src = JSON.parse(readFileSync(join(ROOT, "projects", from, "edit.json"), "utf8"));
let beats = src.beats.slice();
const nums = (s) => s.split(",").map((x) => parseInt(x, 10) - 1);
if (opt("--order") || opt("--keep")) beats = nums(opt("--order") ?? opt("--keep")).map((i) => { if (!src.beats[i]) throw new Error(`no beat ${i + 1}`); return src.beats[i]; });
if (opt("--first")) { const i = parseInt(opt("--first"), 10) - 1; beats = [src.beats[i], ...src.beats.filter((_, k) => k !== i)]; }
if (opt("--hook")) {
  // tease: copy already-verified beat(s) N or N-M to the front, optionally narrowed
  // to N:a-b (a,b = source seconds, must sit on word gaps - verify-cut checks it).
  // The story then plays in full; the builder allows the jump back (LESSONS 61).
  const [range, span] = opt("--hook").split(":");
  const [n1, n2 = n1] = range.split("-").map((x) => parseInt(x, 10) - 1);
  const hook = src.beats.slice(n1, n2 + 1).map((b) => {
    const c = JSON.parse(JSON.stringify(b));
    c[4] = `HOOK: ${c[4] ?? ""}`;
    return c;
  });
  if (!hook.length) throw new Error(`no beat ${range}`);
  if (span) { const [x, y] = span.split("-").map(Number); hook[0][1] = x; hook[hook.length - 1][2] = y; }
  beats = [...hook, ...beats];
}
if (opt("--prepend")) {
  // trim the hook beat to speech with autotrim, in a scratch slug, then take its beat
  const scratch = `${to}__hook`;
  execFileSync("node", [join(ROOT, "scripts/autotrim.mjs"), scratch, opt("--prepend")], { cwd: ROOT, stdio: "pipe" });
  const hook = JSON.parse(readFileSync(join(ROOT, "projects", scratch, "edit.json"), "utf8")).beats[0];
  if (!hook) throw new Error("hook beat not produced");
  hook[4] = `HOOK: ${hook[4] ?? ""}`;
  beats = [hook, ...beats];
}
const out = { ...src, beats, variationOf: from };
if (opt("--title")) out.title = opt("--title").replace(/\\n/g, "\n");
out.out = opt("--out") ?? `${to.toUpperCase().replace(/-/g, "_")}.mp4`;
mkdirSync(join(ROOT, "projects", to), { recursive: true });
writeFileSync(join(ROOT, "projects", to, "edit.json"), JSON.stringify(out, null, 1));
// THE TRANSLATIONS TRAVEL WITH THE EDIT. A project's hand-written
// Hebrew/Arabic -> English map lives in its own CORRECTIONS.json, which
// build-edit.mjs reads from the PROJECT folder. A copied edit without it
// renders the raw Hebrew as captions (sa-hospital-crown-story-v3, 2026-10-02:
// "We heard you love Barbie" came out as garbled Hebrew on the first render).
const corr = join(ROOT, "projects", from, "CORRECTIONS.json");
if (existsSync(corr)) { copyFileSync(corr, join(ROOT, "projects", to, "CORRECTIONS.json")); console.log("  copied CORRECTIONS.json (caption translations)"); }
console.log(`${to}: ${beats.length} beats from ${from} -> projects/${to}/edit.json (out ${out.out})`);
