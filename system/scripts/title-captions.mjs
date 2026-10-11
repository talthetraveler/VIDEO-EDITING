#!/usr/bin/env node
// TITLE + COUNTER LABELS + CAPTIONS on an ALREADY-EDITED video. The cut is not
// touched (homeless-hangout, 2026-10-11: "I really like them ... put on the
// title in white and yellow ... rejection one, rejection two ... add captions").
//
//   node system/scripts/title-captions.mjs <spec.json> [--preview]
//
// spec: { src, out, words (from align-script.py), hdr: bool,
//         title: [[["DAY 1","yellow"],["OF ASKING","white"]], ...], titleY, titleSize,
//         titleStart (s - e.g. the moment he says yes), labels: [{a, b, text, color}], labelY, capY }
// Caption WORDING is the hand-written script; TIMING is forced alignment of
// that script to this file's audio. --preview renders 720x1280 for the chat.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const specPath = resolve(process.argv[2]);
const PREVIEW = process.argv.includes("--preview");
const S = JSON.parse(readFileSync(specPath, "utf8"));
const here = (p) => resolve(dirname(specPath), p);
const OUT = here(PREVIEW ? S.out.replace(/\.mp4$/, ".preview.mp4") : S.out);
const TMP = join(dirname(OUT), "_png", basename(S.out, ".mp4"));
mkdirSync(TMP, { recursive: true });
const ff = (p) => p.split("\\").join("/").replace(/^([A-Za-z]):/, "$1\\:");

// ------------------------------------------------------------------ captions
const words = JSON.parse(readFileSync(here(S.words), "utf8")).filter((w) => w.show);
const byLine = new Map();
for (const w of words) {
  if (!byLine.has(w.line)) byLine.set(w.line, []);
  byLine.get(w.line).push(w);
}
let caps = [];
for (const ws of byLine.values()) {
  const lineStart = caps.length;
  // split at punctuation first, then into chunks of <=3 words with no 1-word orphan
  let run = [];
  const flush = () => {
    const n = run.length;
    if (!n) return;
    const k = Math.ceil(n / 3), base = Math.floor(n / k);
    let extra = n - base * k, i = 0;
    for (let c = 0; c < k; c++) {
      const len = base + (extra-- > 0 ? 1 : 0), g = run.slice(i, i + len);
      i += len;
      caps.push({ a: g[0].a, b: g[g.length - 1].b, n: g.length, comma: /,$/.test(g[g.length - 1].w),
        text: g.map((x) => x.w).join(" ").replace(/[.,]+$/, "").replace(/,/g, "") });
    }
    run = [];
  };
  for (const w of ws) { run.push(w); if (/[.,?!]$/.test(w.w)) flush(); }
  flush();
  // "Okay, bro." must not flash as OKAY then BRO: a lone word joins its
  // neighbour across a comma (never across a full stop), up to 4 words
  for (let i = lineStart; i < caps.length; i++) {
    const c = caps[i], p = caps[i - 1], nx = caps[i + 1];
    if (c.n !== 1) continue;
    if (i > lineStart && p.comma && p.n + 1 <= 4) {
      p.b = c.b; p.text += " " + c.text; p.n++; p.comma = c.comma; caps.splice(i, 1); i--;
    } else if (c.comma && nx && nx.n + 1 <= 4) {
      nx.a = c.a; nx.text = c.text + " " + nx.text; nx.n++; caps.splice(i, 1); i--;
    }
  }
}
// "captionCase": "sentence" keeps the words as written, first letter capital (Tal's 2026-10-11 screenshot)
const SENT = S.captionCase === "sentence";
for (const c of caps) if (!SENT) c.text = c.text.toUpperCase();
caps.sort((x, y) => x.a - y.a);
caps.forEach((c, i) => {
  const next = caps[i + 1] ? caps[i + 1].a : Infinity;
  c.a = Math.max(0, c.a - 0.04);
  // hold a beat after the last word, never into the next caption
  c.b = Math.min(Math.max(c.b + 0.3, c.a + 0.45), c.a + 2.2, next - 0.02);
});
caps = caps.filter((c) => c.b - c.a >= 0.12);
// "extraCaptions": [{a, b, text}] - a line nobody says out loud but the picture shows (the "No" of a rejection)
for (const e of S.extraCaptions || []) caps.push({ a: e.a, b: e.b, text: e.text, extra: true });
caps.sort((x, y) => x.a - y.a);
// "capYSpans": [{a, b, y}] - move captions for a stretch (an emoji burned into the source sat under them)
for (const c of caps) { const sp = (S.capYSpans || []).find((s) => c.a >= s.a && c.a < s.b); if (sp) c.y = sp.y; }

// captions must sit on speech - measured from this file's own audio
const runs = execFileSync("python", [join(ROOT, "scripts/speech-runs.py"), here(S.src)], { encoding: "utf8" })
  .trim().split(",").map((r) => r.split("-").map(Number));
const off = caps.filter((c) => !c.extra && !runs.some(([a, b]) => Math.min(b, c.b) - Math.max(a, c.a) > 0.05));
console.log(`  ${caps.length} captions, ${off.length} over silence`);
for (const c of off) console.log(`     !! ${c.a.toFixed(2)}-${c.b.toFixed(2)} ${c.text}`);

// "cuts": [[a, b], ...] in SOURCE seconds are removed from picture and sound ("you can't hear anything, take
// that part"). Captions and labels inside a cut are dropped; everything after it moves earlier.
const CUTS = (S.cuts || []).slice().sort((x, y) => x[0] - y[0]);
const shift = (t) => t - CUTS.reduce((s, [a, b]) => s + Math.max(0, Math.min(t, b) - a), 0);
// a caption goes when a cut removes more than half of it
const lost = (c) => CUTS.reduce((s, [a, b]) => s + Math.max(0, Math.min(c.b, b) - Math.max(c.a, a)), 0) > (c.b - c.a) / 2;
caps = caps.filter((c) => !lost(c)).map((c) => ({ ...c, a: shift(c.a), b: shift(c.b) }));
for (const l of S.labels) { l.a = shift(l.a); l.b = shift(l.b); }
const cutExpr = CUTS.map(([a, b]) => `between(t\,${a}\,${b})`).join("+");

const capMeta = JSON.parse(execFileSync("python", [join(ROOT, "scripts/render-caption.py"), join(TMP, "cap"), "940", String(S.capSize || 74)],
  { input: JSON.stringify(caps.map((c) => ({ text: c.text, style: S.captionStyle || "street", emphasis: true, keepcase: SENT }))), encoding: "utf8" }).trim());

// ------------------------------------------------------------ title + labels
const labelIn = [{ lines: S.title, size: S.titleSize || 66, maxw: 900, file: join(TMP, "title.png") },
  ...S.labels.map((l, i) => ({ lines: [[[l.text, l.color || "white"]]], size: l.size || 92, maxw: 900, file: join(TMP, `label${i}.png`) })),
  ...(S.stamp ? [{ lines: [[[S.stamp.text, "white"]]], size: S.stamp.size || 40, maxw: 700, file: join(TMP, "stamp.png") }] : [])];
const labMeta = JSON.parse(execFileSync("python", [join(ROOT, "scripts/render-label.py")],
  { input: JSON.stringify(labelIn), encoding: "utf8" }).trim());

// --------------------------------------------------------------------- graph
const H = 1920;
// HLG phone exports -> SDR bt709. Everything leaves limited-range yuv420p (CLAUDE.md 7).
const base = S.hdr
  ? "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,scale=1080:1920:flags=lanczos,format=yuv420p"
  : "scale=1080:1920:flags=lanczos:in_range=auto:out_range=tv,format=yuv420p";
const AIN = S.audio ? 1 : 0;
const parts = CUTS.length
  ? [`[0:v]select='not(${cutExpr})',setpts=N/FRAME_RATE/TB,${base}[b0]`,
     `[${AIN}:a]aselect='not(${cutExpr})',asetpts=N/SR/TB[a]`]
  : [`[0:v]${base}[b0]`];
let prev = "[b0]", n = 0;
const add = (file, y, enable, x = "(W-w)/2") => {
  const en = enable ? `:enable='between(t\\,${enable[0].toFixed(3)}\\,${enable[1].toFixed(3)})'` : "";
  parts.push(`movie='${ff(file)}'[m${n}]`);
  parts.push(`${prev}[m${n}]overlay=x=${x}:y=${y}-h/2:eval=init${en}[o${n}]`);
  prev = `[o${n}]`; n++;
};
add(labMeta[0].file, Math.round(H * (S.titleY || 0.2)), (S.titleStart || S.titleEnd) ? [S.titleStart || 0, S.titleEnd || 1e6] : null);
S.labels.forEach((l, i) => add(labMeta[i + 1].file, Math.round(H * (l.y || S.labelY || 0.36)), [l.a, l.b]));
caps.forEach((c, i) => capMeta[i] && add(capMeta[i].file, Math.round(H * (c.y || S.capY || 0.66)), [c.a, c.b]));
// "stamp": {text, size, y} - the account handle, bold, top right, for the whole video
if (S.stamp) add(labMeta[labMeta.length - 1].file, Math.round(H * (S.stamp.y || 0.135)), null, "W-w-36");
parts.push(`${prev}${PREVIEW ? "scale=720:1280" : "null"}[v]`);
const graph = join(TMP, "graph.txt");
writeFileSync(graph, parts.join(";\n"), "utf8");

// "audio": a replacement soundtrack (e.g. voice lifted, music ducked under speech) - same length as src
const AUD = S.audio ? ["-i", here(S.audio)] : [];
execFileSync("ffmpeg", ["-v", "error", "-stats", "-y", "-i", here(S.src), ...AUD, "-/filter_complex", graph,
  "-map", "[v]", "-map", CUTS.length ? "[a]" : `${AIN}:a`, "-c:v", "libx264", "-preset", PREVIEW ? "veryfast" : "medium",
  "-crf", PREVIEW ? "27" : "18", "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709",
  "-color_primaries", "bt709", "-color_trc", "bt709", ...(PREVIEW ? ["-c:a", "aac", "-b:a", "128k"] : (S.audio || CUTS.length) ? ["-c:a", "aac", "-b:a", "192k"] : ["-c:a", "copy"]),
  "-movflags", "+faststart", ...(S.t ? ["-t", String(S.t)] : []), OUT], { stdio: "inherit" });
writeFileSync(OUT.replace(/\.mp4$/, ".captions.json"), JSON.stringify(caps, null, 1), "utf8");
console.log(`  -> ${OUT}`);
