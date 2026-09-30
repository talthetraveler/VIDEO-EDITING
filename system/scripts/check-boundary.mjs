// CHECK-BOUNDARY — settle a verify-cut "cuts into a word" flag (LESSONS 68).
//
// A smeared word timestamp says the TIMING is unreliable, not that the flag is
// wrong. This re-transcribes the 3s of SOURCE audio around one cut with a
// second engine (Groq, word timestamps) and prints an RMS envelope in 50ms
// steps, so the call is made on evidence instead of on the look of a 25s word.
//
//   node scripts/check-boundary.mjs <slug> <beat#> [--tail] [--win 1.5]
//
// Beat numbers are 1-based, as verify-cut prints them. --tail checks the
// out-point instead of the in-point. The source is resolved the way
// build-edit.mjs resolves it: local original > HQ span (rebased) > proxy.
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { groqTranscribe } from "./lib/stt.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const CACHE = join(ROOT, "projects/_frameio/cache");
const args = process.argv.slice(2);
const wi = args.indexOf("--win");
const WIN = wi >= 0 ? +args[wi + 1] : 1.5;
const valueAt = new Set([wi, args.indexOf("--at")].filter((i) => i >= 0).map((i) => i + 1));
const [slug, beatArg] = args.filter((a, i) => !a.startsWith("--") && !valueAt.has(i));
const tail = args.includes("--tail");
if (!slug || !beatArg) { console.error("usage: node scripts/check-boundary.mjs <slug> <beat#> [--tail] [--win 1.5]"); process.exit(2); }

const edit = JSON.parse(readFileSync(join(ROOT, "projects", slug, "edit.json"), "utf8"));
const beat = edit.beats[+beatArg - 1];
if (!beat) { console.error(`no beat ${beatArg} in ${slug}`); process.exit(2); }
const opts = beat.find((x) => x && typeof x === "object" && !Array.isArray(x)) ?? {};
// the AUDIO is what can be cut off: follow an audio graft if the beat has one
const id = String(opts.audio?.id ?? beat[0]);
const shift = opts.audio ? opts.audio.at - beat[1] : 0;
// --at <sec>: test an arbitrary source time in this beat's clip (used to
// validate the instrument against a known answer before believing it).
const ai = args.indexOf("--at");
const cut = ai >= 0 ? +args[ai + 1] : (tail ? beat[2] : beat[1]) + shift;

const LOCAL = existsSync(join(CACHE, "local-sources.json")) ? JSON.parse(readFileSync(join(CACHE, "local-sources.json"), "utf8")) : {};
const HQ = {};
for (const f of existsSync(join(CACHE, "hq")) ? readdirSync(join(CACHE, "hq")) : []) {
  if (!f.endsWith(".json")) continue;
  try { for (const [k, v] of Object.entries(JSON.parse(readFileSync(join(CACHE, "hq", f), "utf8")))) HQ[k] = v; } catch {}
}
let src, base = 0, kind;
if (LOCAL[id]?.path && existsSync(LOCAL[id].path)) { src = LOCAL[id].path; kind = "local original"; }
else if (HQ[id] && existsSync(join(CACHE, "hq", `${id}.mp4`)) && cut >= HQ[id].offset && cut <= HQ[id].offset + HQ[id].length) {
  src = join(CACHE, "hq", `${id}.mp4`); base = HQ[id].offset; kind = `hq span (offset ${base})`;
} else { src = join(CACHE, "proxies", `${id}.mp4`); kind = "proxy"; }

const from = Math.max(0, cut - WIN);
const dir = mkdtempSync(join(tmpdir(), "cb-"));
const wav = join(dir, "w.wav");
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", (from - base).toFixed(3), "-i", src, "-t", (2 * WIN).toFixed(3),
  "-vn", "-ac", "1", "-ar", "16000", wav], { stdio: "pipe" });
const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", wav, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], { maxBuffer: 64 << 20 });

console.log(`\n${slug} beat ${beatArg} ${tail ? "OUT" : "IN"}-point ${cut.toFixed(2)}s  clip ${id.slice(0, 12)}  (${kind})`);
let words = [];
try { words = (await groqTranscribe(wav, { words: true })).words ?? []; }
catch (e) { console.log(`  second engine FAILED: ${String(e?.message ?? e).slice(0, 80)} - NOT settled`); }
console.log(`\n  words (Groq, source window ${from.toFixed(2)}-${(from + 2 * WIN).toFixed(2)}s):`);
for (const w of words) {
  const a = from + w.start, b = from + w.end;
  const mark = a < cut && b > cut ? "  <== STRADDLES THE CUT" : "";
  console.log(`    ${a.toFixed(2)}-${b.toFixed(2)}  ${w.word}${mark}`);
}
if (!words.length) console.log("    (no words heard)");

console.log(`\n  RMS dBFS, 50ms steps (| = the cut):`);
const n = pcm.length / 2, step = 800;
let line = [];
for (let s = 0; s + step <= n; s += step) {
  let sum = 0;
  for (let k = s; k < s + step; k++) { const v = pcm.readInt16LE(k * 2) / 32768; sum += v * v; }
  const t = from + s / 16000;
  const db = sum ? 10 * Math.log10(sum / step) : -99;
  line.push(`${Math.abs(t - cut) < 0.025 ? "|" : ""}${t.toFixed(2)}:${db.toFixed(0)}`);
}
for (let i = 0; i < line.length; i += 10) console.log("    " + line.slice(i, i + 10).join("  "));
const straddle = words.some((w) => from + w.start < cut - 0.05 && from + w.end > cut + 0.05);
console.log(`\n  VERDICT (second engine): ${!words.length ? "no words heard - read the RMS" : straddle ? "a word STRADDLES the cut - the flag is REAL" : "no word straddles the cut"}`);
rmSync(dir, { recursive: true, force: true });
process.exitCode = straddle ? 1 : 0;
