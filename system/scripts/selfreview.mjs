#!/usr/bin/env node
// SELF-REVIEW GATE — run this on EVERY cut before Tal ever sees it.
//
// Tal: "Before giving me a video, you should just watch it one time yourself so
// you can see if there's any mistakes. The V1 should have been like the V6."
//
// He is right, and the failures so far were all things I could have caught:
//   V1  centre-crop decapitated people        -> visible in ONE contact sheet
//   V2  captions drifted out of sync          -> visible in the caption dump
//   V4  "let's make that happen" snapped shut -> caught by verify-cut
//   V5  "FOR YOWEBLLRTHDAY" overlapping       -> visible in ONE contact sheet
//   V5  "three here" instead of "three years" -> READABLE in the caption dump
//
// None of those needed Tal. They needed me to look. This produces everything
// needed to look, in one command:
//   1. a contact sheet of the rendered frames (framing, overlaps, black frames)
//   2. the exact caption list with timings, so the WORDS can be read
//   3. ASR sanity flags — captions that do not parse as sensible English
//   4. the boundary + post-render audio verification
//
//   node scripts/selfreview.mjs projects/<slug>/EDIT.json <render.mp4>
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";

const FFDIR = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin";
const FF = join(FFDIR, "ffmpeg.exe"), FP = join(FFDIR, "ffprobe.exe");
const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const TRANS = join(ROOT, "projects/_frameio/cache/transcripts");
const INDEX = join(ROOT, "projects/_frameio/cache/discover-index.json");

const editPath = process.argv[2], mp4 = process.argv[3];
if (!editPath || !mp4) { console.error("usage: node scripts/selfreview.mjs <EDIT.json> <render.mp4>"); process.exit(1); }
const edit = JSON.parse(readFileSync(editPath, "utf8"));
const OUT = join(dirname(editPath), "_review");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const dur = parseFloat(execFileSync(FP, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], { encoding: "utf8" }));
console.log(`\nSELF-REVIEW  ${basename(mp4)}  ${dur.toFixed(1)}s\n`);

// ---- 1. contact sheet, sampled INSIDE each beat (not at the cut) -----------
let acc = 0;
const stamps = [];
for (const b of edit.beats) {
  const len = b[2] - b[1];
  stamps.push(acc + len * 0.35, acc + len * 0.75);   // two looks per beat
  acc += len;
}
const shots = stamps.filter((t) => t < dur - 0.2);
shots.forEach((t, i) => {
  execFileSync(FF, ["-v", "error", "-ss", String(t.toFixed(2)), "-i", mp4, "-frames:v", "1",
    "-vf", "scale=150:-1", join(OUT, `f${String(i).padStart(2, "0")}.jpg`), "-y"], { stdio: "pipe" });
});
// Use ffmpeg's `tile` filter rather than hstack+vstack: it handles a ragged
// last row natively. Stacking manually failed on uneven widths twice.
const sheet = join(OUT, "SHEET.jpg");
const cols = 6, rowsN = Math.ceil(shots.length / cols);
execFileSync(FF, ["-v", "error", "-framerate", "1", "-i", join(OUT, "f%02d.jpg"),
  "-vf", `tile=${cols}x${rowsN}:margin=4:padding=3:color=black`, "-frames:v", "1",
  sheet, "-y"], { stdio: "pipe" });
console.log(`1. CONTACT SHEET -> ${sheet}   (LOOK AT IT — framing, decapitation, overlapping text)`);

// ---- 2 & 3. caption dump + ASR sanity -------------------------------------
const idx = JSON.parse(readFileSync(INDEX, "utf8"));
const byTag = {};
for (const f of idx.files) {
  const m = /^DJI_\d+_(\d{4})_/.exec(f.name) ?? /_(\d{4})_D?\.MP4$/i.exec(f.name);
  if (m) byTag[m[1]] = f.id;
}

// Phrases that are grammatically or semantically impossible. This is the layer
// that catches "three HERE" — both words are real English, so no spellchecker
// and no confidence score would ever flag it. Only reading it does.
const NONSENSE = [
  [/\b(two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(here|hear|year|ear)\b/i, "number + 'here/year' — almost certainly 'YEARS'"],
  [/\bit take me\b/i, "'it take me' — likely 'it took me'"],
  [/\bthe reach\b/i, "'the reach' — likely 'we'd have reached'"],
  [/\b(\w+)\s+\1\b/i, "word repeated back-to-back — possible stutter artefact"],
  [/\b[a-z]{1,2}\s+[a-z]{1,2}\s+[a-z]{1,2}\b/i, "three very short tokens in a row — possible garbled run"],
];

console.log(`\n2. CAPTIONS — read every line. If a line does not make sense, it is wrong.\n`);
let capCount = 0, flagged = 0;
acc = 0;
for (const b of edit.beats) {
  const [tag, ss, to] = b;
  // a beat may carry a full frame.io uuid directly (generic builder) or a
  // short DJI tag (jamaica). Accept both.
  const id = /^[0-9a-f]{8}-/.test(String(tag)) ? tag : byTag[tag];
  const p = id ? join(TRANS, `${id}.json`) : null;
  const j = p && existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
  const words = (j.words ?? []).filter((w) => w.end > ss && w.start < to).sort((x, y) => x.start - y.start);
  const line = words.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();
  capCount += Math.ceil(words.length / 3);
  const hits = NONSENSE.filter(([re]) => re.test(line));
  const mark = hits.length ? "  <-- CHECK" : "";
  console.log(`   ${(acc).toFixed(1).padStart(5)}s  ${tag}  ${line.slice(0, 150)}${mark}`);
  for (const [, why] of hits) { console.log(`             ! ${why}`); flagged++; }
  acc += (to - ss);
}
console.log(`\n   ${capCount} captions, ${flagged} flagged as possible ASR errors.`);

// ---- 4. boundary + post-render audio --------------------------------------
console.log(`\n3. BOUNDARY + AUDIO VERIFICATION`);
let vrc = 0;
try {
  const v = execFileSync("node", [join(ROOT, "scripts/verify-cut.mjs"), editPath, "--render", mp4],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  console.log(String(v).split("\n").filter((l) => /CUT |cut\(s\)|issue|clean|Safe|FIX/.test(l)).join("\n"));
} catch (e) {
  vrc = 1;
  console.log(String(e.stdout ?? "").split("\n").filter((l) => /CUT |cut\(s\)|issue|FIX|->/.test(l)).join("\n"));
}

console.log(`\nDO NOT SEND until the contact sheet has been LOOKED AT and every flagged caption resolved.`);
process.exit(flagged || vrc ? 1 : 0);
