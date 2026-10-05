#!/usr/bin/env node
// REFERENCE-SHOTS — every shot of a reference, with the words spoken over it.
//
//   node system/scripts/reference-shots.mjs <video> --out <dir> [--min 0.15]
//
// study-reference.mjs samples 8 frames; that is enough to classify a video and
// nowhere near enough to learn how its B-roll follows its script. This writes:
//   <slug>.scenes.txt   every scene-score hit (detected on 240px frames — a 4K
//                       .mov decoded at full size took >10 min per file)
//   <slug>.words.json   Groq turbo with word timestamps (cached: skipped if present)
//   <slug>.shots.md     shot n | in-out | length | score | words under it
//   <slug>.sheetN.jpg   one labelled frame per shot, 8x3 per sheet  <-- LOOK
//
// Built 2026-09-28 measuring Tal's own VO/B-roll reels (formats/voiceover-broll.md).
//
// KNOWN DETECTOR ARTIFACTS — read the sheets before quoting a cut count:
//   - screen recordings (a scrolling website / IG grid) fire every ~0.1s
//   - whip-pans and fast handheld moves fire several times inside one shot
//   - hits under ~0.25 are often motion, not cuts
// In "Tal Dooreck.mp4" 174 hits were ~80 real shots. Count real shots by eye.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from "node:fs";
import { spawnSync, execFileSync } from "node:child_process";
import { basename, join, resolve } from "node:path";
import { loadEnv, groqTranscribe, FF } from "./lib/stt.mjs";

const args = process.argv.slice(2);
const src = resolve(args[0] ?? "");
const out = resolve(args[args.indexOf("--out") + 1] ?? ".");
const minS = +(args.includes("--min") ? args[args.indexOf("--min") + 1] : 0.15);
if (!args[0] || !existsSync(src) || !args.includes("--out")) {
  console.error("usage: node system/scripts/reference-shots.mjs <video> --out <dir> [--min 0.15]");
  process.exit(1);
}
// ffmpeg-static ships no ffprobe beside it; fall back to the one on PATH
const FPsib = FF.replace(/ffmpeg\.exe$/, "ffprobe.exe");
const FP = existsSync(FPsib) ? FPsib : "ffprobe";
mkdirSync(out, { recursive: true });
const slug = basename(src).replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const P = (ext) => join(out, `${slug}.${ext}`);
const dur = +execFileSync(FP, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], { encoding: "utf8" });

// 1. cuts — ffmpeg writes filter measurements to STDERR, so read both streams
if (!existsSync(P("scenes.txt"))) {
  const r = spawnSync(FF, ["-hide_banner", "-nostats", "-i", src, "-vf", "scale=240:-2,select='gt(scene,0.15)',metadata=print", "-an", "-f", "null", "-"],
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const txt = (r.stdout || "") + (r.stderr || "");
  const t = [...txt.matchAll(/pts_time:([\d.]+)/g)].map((m) => m[1]);
  const s = [...txt.matchAll(/scene_score=([\d.]+)/g)].map((m) => m[1]);
  writeFileSync(P("scenes.txt"), t.map((x, i) => `pts_time:${x}\tscene_score=${s[i]}`).join("\n"));
}

// 2. words
if (!existsSync(P("words.json"))) {
  loadEnv();
  const flac = P("flac");
  execFileSync(FF, ["-v", "error", "-y", "-i", src, "-vn", "-ar", "16000", "-ac", "1", "-c:a", "flac", flac]);
  writeFileSync(P("words.json"), JSON.stringify(await groqTranscribe(flac, { words: true }), null, 1));
}

// 3. shots
const cuts = readFileSync(P("scenes.txt"), "utf8").trim().split("\n").filter(Boolean)
  .map((l) => ({ t: +l.match(/pts_time:([\d.]+)/)[1], s: +l.match(/scene_score=([\d.]+)/)[1] }))
  .filter((c) => c.s >= minS);
const words = JSON.parse(readFileSync(P("words.json"), "utf8")).words;
const bounds = [0, ...cuts.map((c) => c.t), dur];
const shots = bounds.slice(0, -1).map((a, i) => {
  const b = bounds[i + 1];
  const w = words.filter((x) => (x.start + x.end) / 2 >= a && (x.start + x.end) / 2 < b).map((x) => x.word.trim()).join(" ");
  return { n: i + 1, a: +a.toFixed(2), b: +b.toFixed(2), len: +(b - a).toFixed(2), score: i ? cuts[i - 1].s : null, words: w };
});
writeFileSync(P("shots.json"), JSON.stringify(shots, null, 1));
writeFileSync(P("shots.md"), shots.map((s) =>
  `${String(s.n).padStart(3)} ${s.a.toFixed(2).padStart(6)}-${s.b.toFixed(2).padStart(6)} ${s.len.toFixed(2).padStart(5)}s ${s.score ? "sc" + s.score.toFixed(2) : "      "} | ${s.words}`).join("\n"));

// 4. contact sheets. drawtext cannot take a Windows "C:/..." fontfile inside a
// filtergraph without escaping hell, so the font is copied next to the frames
// and referenced relatively (cwd = out).
const tmp = join(out, `_f_${slug}`);
rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp);
copyFileSync("C:/Windows/Fonts/arialbd.ttf", join(out, "arialbd.ttf"));
shots.forEach((s, i) => {
  const t = Math.min(s.a + Math.min(s.len / 2, 0.6), dur - 0.05);
  execFileSync(FF, ["-v", "error", "-ss", t.toFixed(2), "-i", src, "-frames:v", "1", "-vf",
    `scale=216:384,drawtext=fontfile=arialbd.ttf:text='${s.n}  ${s.a.toFixed(1)}s':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.7`,
    join(`_f_${slug}`, `${String(i).padStart(4, "0")}.jpg`), "-y"], { cwd: out });
});
const per = 24;
for (let k = 0; k * per < shots.length; k++) {
  execFileSync(FF, ["-v", "error", "-start_number", String(k * per), "-i", join(tmp, "%04d.jpg"), "-frames:v", "1",
    "-vf", "tile=8x3:padding=4:color=white", P(`sheet${k + 1}.jpg`), "-y"]);
}
rmSync(tmp, { recursive: true, force: true });
const wpm = words.length ? (words.length / ((words.at(-1).end - words[0].start) / 60)).toFixed(0) : 0;
console.log(`${slug}: ${dur.toFixed(1)}s, ${shots.length} detected shots (min score ${minS}), ${words.length} words, ${wpm} wpm`);
console.log(`  sheets: ${P("sheet1.jpg")} ... ${Math.ceil(shots.length / per)} total  <-- LOOK AT EVERY ONE`);
