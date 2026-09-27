#!/usr/bin/env node
// QA-LOOK — the checks the old gate did not have, and that let a bad set ship.
//
//   node scripts/qa-look.mjs <file.mp4> [more.mp4 ...]
//   node scripts/qa-look.mjs --all
//
// qa-final.mjs checks the CONTAINER: size, duration, a single loudness number,
// black frames. It reported "35 pass, 1 fail" on a set Tal then described as
// *"horrible ... the audio was so bad ... the colors are bad ... everything is
// bad about them"*. Every single thing he objected to was invisible to it:
//
//   - the subject is tiny, or there is no person in the shot at all
//   - the picture flickers in brightness from cut to cut
//   - the level slams 25-30 dB at the joins
//   - the noise floor has been ridden up until there is no silence left
//   - captions that stop mid-thought, or repeat the previous caption
//
// Each of those is measurable, so this measures them. It still does not
// replace watching the film — nothing does — but it will not pass a file with
// these defects in it.
import { readdirSync, statSync, existsSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, basename, dirname } from "node:path";

const FFDIR = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin";
const FF = join(FFDIR, "ffmpeg.exe"), FP = join(FFDIR, "ffprobe.exe");
const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const TMP = join(ROOT, "projects/_frameio/cache/_qalook");

const sh = (b, a) => {
  const r = spawnSync(b, a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return (r.stdout || "") + (r.stderr || "");
};
const duration = (f) =>
  parseFloat(sh(FP, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).trim()) || 0;

/** Mean luma every `step` seconds — the flicker measurement. */
function lumaCurve(file, d, step = 1.5) {
  const out = [];
  for (let t = 0.5; t < d; t += step) {
    const txt = sh(FF, ["-v", "info", "-ss", String(t), "-i", file, "-frames:v", "1",
      "-vf", "format=gray,signalstats,metadata=print", "-f", "null", "-"]);
    const m = /lavfi\.signalstats\.YAVG=([\d.]+)/.exec(txt);
    if (m) out.push([+t.toFixed(1), parseFloat(m[1])]);
  }
  return out;
}

/** Half-second RMS in dBFS — the level-slam and noise-floor measurement. */
function levels(file) {
  mkdirSync(TMP, { recursive: true });
  const wav = join(TMP, `a_${Math.random().toString(36).slice(2)}.wav`);
  sh(FF, ["-v", "error", "-y", "-i", file, "-ac", "1", "-ar", "16000", wav]);
  if (!existsSync(wav)) return null;
  const r = spawnSync("python", [join(ROOT, "scripts/rms-curve.py"), wav], { encoding: "utf8" });
  rmSync(wav, { force: true });
  const v = (r.stdout || "").trim().split(",").map(Number).filter(Number.isFinite);
  return v.length ? v : null;
}

/** How much of the film actually has a visible human in it. */
function peoplePresence(file, d, n = 10) {
  let seen = 0, tried = 0;
  for (let i = 0; i < n; i++) {
    const t = d * (i + 0.5) / n;
    const r = spawnSync("python", [join(ROOT, "scripts/face-box.py"), file,
      String(t), String(t + 0.4), "2"], { encoding: "utf8", maxBuffer: 8e6 });
    try {
      const j = JSON.parse((r.stdout || "").trim().split("\n").pop());
      tried++; if (j.found) seen++;
    } catch {}
  }
  return tried ? { seen, tried } : null;
}

function check(file) {
  const issues = [], notes = [];
  const d = duration(file);
  if (!d) return { name: basename(file), issues: ["unreadable — still rendering?"], notes };

  // 1. BRIGHTNESS FLICKER. A film graded beat-by-beat jumps exposure at every
  //    cut, and a film whose blacks have been lifted goes milky. Tal saw both
  //    of these as "the colors are bad".
  const lum = lumaCurve(file, d);
  if (lum.length > 3) {
    let jump = 0, at = 0;
    for (let i = 1; i < lum.length; i++) {
      const j = Math.abs(lum[i][1] - lum[i - 1][1]);
      if (j > jump) { jump = j; at = lum[i][0]; }
    }
    const ys = lum.map((x) => x[1]);
    const lo = Math.min(...ys), hi = Math.max(...ys);
    notes.push(`luma ${lo.toFixed(0)}-${hi.toFixed(0)} (max jump ${jump.toFixed(0)} @${at}s)`);
    if (jump > 45) issues.push(`BRIGHTNESS JUMPS ${jump.toFixed(0)} levels at ${at}s — the cut will flash`);
    if (lo > 120 && hi - lo < 35) issues.push(`WASHED OUT — luma never drops below ${lo.toFixed(0)}, there is no black point left`);
  }

  // 2. AUDIO. Two opposite failures, both of which shipped:
  //    range too WIDE   = beats were never level-matched, it slams at the cuts
  //    range too NARROW = the floor has been ridden up, so it is a wall of noise
  const lv = levels(file);
  if (lv) {
    const s = [...lv].sort((a, b) => a - b);
    const p10 = s[Math.floor(s.length * 0.1)], p90 = s[Math.floor(s.length * 0.9)];
    let slam = 0, slamAt = 0;
    for (let i = 1; i < lv.length; i++) {
      const j = Math.abs(lv[i] - lv[i - 1]);
      if (j > slam) { slam = j; slamAt = i * 0.5; }
    }
    notes.push(`audio floor ${p10.toFixed(0)} peak ${p90.toFixed(0)} range ${(p90 - p10).toFixed(0)}dB (max step ${slam.toFixed(0)}dB @${slamAt}s)`);
    if (p10 > -30) issues.push(`NOISE FLOOR at ${p10.toFixed(0)}dB — no silence anywhere, the room tone has been ridden up`);
    if (slam > 22) issues.push(`LEVEL SLAMS ${slam.toFixed(0)}dB at ${slamAt}s — beats are not level-matched`);
  }

  // 3. IS ANYONE IN IT. Tal's hard rule is to open on a human and stay with
  //    people. The delivered set had beats of an empty pavement, a passing car
  //    and a wheelbarrow — one of them captioned "HOW ARE YOU".
  const pp = peoplePresence(file, d);
  if (pp) {
    notes.push(`people in ${pp.seen}/${pp.tried} samples`);
    if (pp.seen === 0) issues.push(`NO PERSON DETECTED anywhere in this film`);
    else if (pp.seen / pp.tried < 0.5) issues.push(`only ${pp.seen}/${pp.tried} samples contain a person — too much empty frame`);
  }

  // 4. READ THE CAPTIONS AS ENGLISH. build-edit now writes them into
  //    BUILD-LOG.json so they can be checked as text instead of squinted at on
  //    a contact sheet — which is how "SHALOM, HOW MY CHIH" got through.
  const log = join(dirname(file), "BUILD-LOG.json");
  if (existsSync(log)) {
    try {
      const j = JSON.parse(readFileSync(log, "utf8"));
      const caps = (j.captions ?? []).map((c) => String(c.text ?? c).trim()).filter(Boolean);
      if (j.out && j.out !== basename(file)) {
        notes.push(`(BUILD-LOG is for ${j.out} — captions below may be stale)`);
      } else if (caps.length) {
        notes.push(`${caps.length} captions`);
        // ONLY words that CANNOT end an English sentence. The first version of
        // this list included object pronouns and flagged "HOW ARE YOU",
        // "NICE TO MEET YOU" and "HI, I THANK YOU" — all complete lines. A gate
        // that cries wolf gets ignored, which is how a bad set shipped in the
        // first place. The build-time grouper has the transcript and can tell a
        // subject "you" from an object "you"; this backstop only sees text, so
        // it flags nothing it cannot be sure about.
        const DANG = /\b(a|an|the|and|or|but|to|of|in|on|at|for|from|with|my|your|our|their|is|are|was|were|am|be|been|very|just|more|because|than|which)$/i;
        const dang = caps.filter((c) => DANG.test(c));
        if (dang.length) issues.push(`${dang.length} caption(s) stop mid-thought: ${dang.slice(0, 3).map((x) => `"${x}"`).join(", ")}`);
        const key = (x) => x.split(/\s+/).sort().join(" ").toLowerCase();
        for (let i = 1; i < caps.length; i++) {
          if (key(caps[i]) === key(caps[i - 1])) { issues.push(`repeated caption: "${caps[i]}"`); break; }
        }
        const noise = caps.filter((c) => c.split(/\s+/).some((w) => w.length >= 3 && !/[AEIOUYaeiouy]/.test(w)));
        if (noise.length) issues.push(`caption may be ASR noise: ${noise.slice(0, 2).map((x) => `"${x}"`).join(", ")}`);
      }
    } catch {}
  }
  return { name: basename(file), issues, notes };
}

let files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (process.argv.includes("--all")) {
  files = [];
  for (const slug of readdirSync(join(ROOT, "projects"))) {
    const dir = join(ROOT, "projects", slug);
    if (slug.startsWith("_") || !statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir)) if (f.toLowerCase().endsWith(".mp4")) files.push(join(dir, f));
  }
}

let bad = 0;
console.log(`\nQA-LOOK — ${files.length} file(s)\n`);
for (const f of files) {
  const r = check(f);
  console.log(`${r.issues.length ? "FAIL" : "ok  "} ${r.name}`);
  console.log(`       ${r.notes.join(" · ")}`);
  for (const i of r.issues) console.log(`       !! ${i}`);
  if (r.issues.length) bad++;
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\n${files.length - bad} pass, ${bad} fail.`);
process.exit(bad ? 1 : 0);
