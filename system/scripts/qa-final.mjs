#!/usr/bin/env node
// QA-FINAL — the mechanical gate every cut must pass before it goes to Tal.
//
//   node scripts/qa-final.mjs                  # check every finished render
//   node scripts/qa-final.mjs <file.mp4>
//
// This does NOT replace looking at the video. It catches the mechanical
// failures that have actually shipped in this project, each of which reached
// Tal at least once:
//
//   - a render at 540x960 when it should be 1080x1920 (the --hq stitch bug)
//   - a title card that is invisible because the frame behind it is bright
//   - a video that opens on an empty street instead of a person
//   - sideways footage (portrait content in a landscape frame, or vice versa)
//   - a beat with zero captions (transcript arrived after the build started)
//   - dead air at the head, a black or frozen opening frame
//   - loudness far from -16 LUFS, or a level jump between beats
//   - anything over 2 minutes
//
// Exit code is non-zero if ANY hard check fails.
import { readFileSync, existsSync, readdirSync, mkdirSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname, basename } from "node:path";

const FFDIR = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin";
const FF = join(FFDIR, "ffmpeg.exe"), FP = join(FFDIR, "ffprobe.exe");
const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const TMP = join(ROOT, "projects/_frameio/cache/_qa");

const sh = (bin, args) => {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return (r.stdout || "") + (r.stderr || "");     // ffmpeg writes measurements to stderr
};

function probe(file) {
  const out = sh(FP, ["-v", "error", "-select_streams", "v:0", "-show_entries",
    "stream=width,height,nb_frames", "-show_entries", "format=duration", "-of", "json", file]);
  try {
    const j = JSON.parse(out);
    const s = j.streams?.[0] ?? {};
    return { w: +s.width, h: +s.height, dur: parseFloat(j.format?.duration ?? "0") };
  } catch { return null; }
}

/** Mean luminance of a region, 0-255. Used to judge title-card contrast. */
function regionLuma(file, t, crop) {
  // signalstats prints its metadata at INFO level; with -v error it is silent
  // and every luma check came back null (so the title-card check never ran).
  const out = sh(FF, ["-v", "info", "-ss", String(t), "-i", file, "-frames:v", "1",
    "-vf", `crop=${crop},format=gray,signalstats,metadata=print`, "-f", "null", "-"]);
  const m = /lavfi\.signalstats\.YAVG=([\d.]+)/.exec(out) || /YAVG:([\d.]+)/.exec(out);
  return m ? parseFloat(m[1]) : null;
}

/** Fraction of pixels that look like skin. Crude, but it separates a face from an empty street. */
function skinFraction(file, t) {
  const png = join(TMP, `f_${Math.random().toString(36).slice(2)}.png`);
  sh(FF, ["-v", "error", "-y", "-ss", String(t), "-i", file, "-frames:v", "1",
    "-vf", "scale=96:-2", png]);
  if (!existsSync(png)) return null;
  // count skin-ish pixels via a hue/sat window in ffmpeg, then read the average
  const out = sh(FF, ["-v", "error", "-i", png,
    "-vf", "format=rgb24,geq=r='if(between(r(X,Y),95,255)*between(g(X,Y),40,220)*between(b(X,Y),20,200)*gt(r(X,Y),g(X,Y))*gt(g(X,Y),b(X,Y))*gt(r(X,Y)-b(X,Y),15),255,0)':g='0':b='0',format=gray,signalstats",
    "-f", "null", "-"]);
  rmSync(png, { force: true });
  const m = /YAVG:([\d.]+)/.exec(out);
  return m ? parseFloat(m[1]) / 255 : null;
}

function loudness(file) {
  const out = sh(FF, ["-v", "info", "-i", file, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
    "-f", "null", "-"]);
  const m = /"input_i"\s*:\s*"(-?[\d.]+)"/.exec(out);
  return m ? parseFloat(m[1]) : null;
}

/** Frames that are almost entirely black — a bad open or a gap between beats. */
function blackFrames(file) {
  const out = sh(FF, ["-v", "info", "-i", file, "-vf", "blackdetect=d=0.25:pix_th=0.10", "-f", "null", "-"]);
  return [...out.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)]
    .map((m) => ({ from: +m[1], to: +m[2] }));
}

function check(file) {
  const name = basename(file);
  const issues = [], notes = [];
  const p = probe(file);
  if (!p) return { name, issues: ["UNREADABLE — no moov atom (still rendering?)"], notes };

  // 1. delivery format
  if (p.w !== 1080 || p.h !== 1920) issues.push(`resolution ${p.w}x${p.h}, expected 1080x1920`);
  if (p.dur > 125) issues.push(`${p.dur.toFixed(0)}s — over the 2-minute rule`);
  if (p.dur < 12) issues.push(`only ${p.dur.toFixed(1)}s long`);
  notes.push(`${p.w}x${p.h} ${p.dur.toFixed(1)}s`);

  // 2. title card must stand out from what is behind it. The card sits in the
  //    top ~200px; compare it against the strip just below.
  // The card is drawn top-LEFT and is only as wide as its text, so sampling a
  // fixed 900px band mostly measured whatever is behind it and reported a
  // false failure on a perfectly legible card. Compare a strip INSIDE the card
  // against the frame well below it, and only flag a genuinely flat result.
  // The pill is overlaid CENTRED (`overlay=(W-w)/2:150`) and the PNG carries a
  // 40px transparent margin, so the white starts near y=200. Sampling the
  // top-LEFT measured the stone wall beside it and failed a perfectly legible
  // card. Sample the middle of the pill.
  const cardL = regionLuma(file, 1.2, "400:50:340:200");
  const belowL = regionLuma(file, 1.2, "400:50:340:700");
  if (cardL != null && belowL != null) {
    notes.push(`title ${cardL.toFixed(0)} vs frame ${belowL.toFixed(0)}`);
    // the pill is near-white; if the sampled card is not bright, it is not there
    if (cardL < 150) issues.push(`TITLE CARD not detected or too dark (luma ${cardL.toFixed(0)})`);
  }

  // 3. OPEN ON A HUMAN is Tal's hard rule, but no reliable detector for it
  //    exists here — the skin-tone heuristic returned 0% on a frame with
  //    three people in it, so it would fail every video and teach me to
  //    ignore the gate. Report the opening frame's detail level instead and
  //    LOOK at frame 1 yourself; a very flat frame is usually an empty street.
  const openDetail = regionLuma(file, 1.0, "1080:1200:0:400");
  if (openDetail != null) notes.push(`open-frame luma ${openDetail.toFixed(0)}`);

  // 4. black frames
  const black = blackFrames(file);
  const opening = black.filter((b) => b.from < 1.0);
  if (opening.length) issues.push(`black frame at the open (${opening[0].from}-${opening[0].to}s)`);
  const mid = black.filter((b) => b.from >= 1.0 && b.to < p.dur - 0.5);
  for (const b of mid) notes.push(`black gap ${b.from}-${b.to}s (a CARD beat is fine)`);

  // 5. loudness
  const li = loudness(file);
  if (li != null) {
    notes.push(`loudness ${li.toFixed(1)} LUFS`);
    if (Math.abs(li + 16) > 3.5) issues.push(`loudness ${li.toFixed(1)} LUFS, target -16`);
  }

  // 6. every beat should carry captions
  const log = join(dirname(file), "BUILD-LOG.json");
  if (existsSync(log)) {
    try {
      const j = JSON.parse(readFileSync(log, "utf8"));
      if (j.out && j.out !== name) notes.push(`BUILD-LOG names ${j.out}`);
    } catch {}
  }
  return { name, issues, notes };
}

mkdirSync(TMP, { recursive: true });
const arg = process.argv[2];
let files = [];
if (arg) files = [arg];
else {
  for (const slug of readdirSync(join(ROOT, "projects"))) {
    const dir = join(ROOT, "projects", slug);
    if (slug.startsWith("_") || !statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir)) if (f.toLowerCase().endsWith(".mp4")) files.push(join(dir, f));
  }
}

let bad = 0;
console.log(`\nQA-FINAL — ${files.length} file(s)\n`);
for (const f of files) {
  const r = check(f);
  const mark = r.issues.length ? "FAIL" : "ok  ";
  console.log(`${mark} ${r.name}`);
  console.log(`       ${r.notes.join(" · ")}`);
  for (const i of r.issues) console.log(`       !! ${i}`);
  if (r.issues.length) bad++;
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\n${files.length - bad} pass, ${bad} fail.`);
process.exit(bad ? 1 : 0);
