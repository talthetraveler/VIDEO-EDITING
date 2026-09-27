#!/usr/bin/env node
// AUTO-INTAKE — loose clips dropped in FOOTAGE IN become a named shoot folder.
//
// Tal, 2026-09-24: *"every time that I paste footage in, it should make like a
// folder and put those videos in there automatically ... and then I can write
// you here one or two sentences about how I want you to edit it."*
//
//   node system/scripts/intake.mjs            # group whatever is loose
//   node system/scripts/intake.mjs --name "coffee shop"
//   node system/scripts/intake.mjs --dry
//
// WHAT IT DOES
//   - finds loose media sitting directly in FOOTAGE IN
//   - reads each clip's real CAPTURE time from the container, because Meta and
//     iPhone filenames are not in capture order and file mtimes are just
//     download stamps (CLAUDE.md 7)
//   - creates ONE folder named for the day it was shot
//   - MOVES the clips in, renamed 01..NN in true capture order, keeping the
//     original name so nothing is lost
//   - writes BRIEF.md for Tal's one or two sentences, and CLIPS.md with the
//     probed facts
//
// It never touches anything already inside a shoot folder, so running it twice
// is safe.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit";
const IN = join(ROOT, "FOOTAGE IN");
const MEDIA = new Set([".mp4", ".mov", ".m4v", ".mkv", ".avi", ".webm", ".mts", ".insv"]);

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const nameArg = args.includes("--name") ? args[args.indexOf("--name") + 1] : null;

function probe(file) {
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries",
      "format=duration,size:format_tags=creation_time",
      "-show_entries", "stream=width,height,codec_type,r_frame_rate",
      "-of", "json", file], { encoding: "utf8" });
    const j = JSON.parse(out);
    const v = (j.streams ?? []).find((s) => s.codec_type === "video") ?? {};
    const a = (j.streams ?? []).find((s) => s.codec_type === "audio");
    const t = j.format?.tags?.creation_time;
    return {
      dur: +(j.format?.duration ?? 0),
      w: v.width ?? 0, h: v.height ?? 0,
      fps: v.r_frame_rate && v.r_frame_rate !== "0/0"
        ? Math.round(eval(v.r_frame_rate) * 100) / 100 : null,
      audio: !!a,
      shot: t ? new Date(t) : null,
      ok: true,
    };
  } catch (e) {
    return { ok: false, err: String(e.message).split("\n")[0].slice(0, 90) };
  }
}

const loose = readdirSync(IN)
  .filter((f) => MEDIA.has(extname(f).toLowerCase()))
  .filter((f) => statSync(join(IN, f)).isFile());

if (!loose.length) {
  console.log("Nothing loose in FOOTAGE IN — already filed.");
  process.exit(0);
}

console.log(`${loose.length} loose clip(s). Probing…\n`);
const clips = loose.map((f) => {
  const p = join(IN, f);
  return { file: f, path: p, size: statSync(p).size, ...probe(p) };
});

const broken = clips.filter((c) => !c.ok);
for (const b of broken) console.log(`  !! ${b.file} — will not probe: ${b.err}`);

// TRUE CAPTURE ORDER. Fall back to mtime only when the container has no
// creation_time, and say so rather than pretending the order is known.
const noStamp = clips.filter((c) => c.ok && !c.shot);
clips.sort((a, b) => {
  const ta = a.shot?.getTime() ?? statSync(a.path).mtimeMs;
  const tb = b.shot?.getTime() ?? statSync(b.path).mtimeMs;
  return ta - tb;
});

const stamped = clips.filter((c) => c.shot);
const day = stamped.length
  ? stamped[0].shot.toISOString().slice(0, 10)
  : new Date(statSync(clips[0].path).mtimeMs).toISOString().slice(0, 10);

let base = nameArg ? `${day} ${nameArg}` : `${day} shoot`;
let folder = join(IN, base);
let n = 2;
while (existsSync(folder)) folder = join(IN, `${base} ${n++}`);

const totalDur = clips.reduce((t, c) => t + (c.dur || 0), 0);
const totalGB = clips.reduce((t, c) => t + c.size, 0) / 2 ** 30;

console.log(`\nfolder: FOOTAGE IN/${folder.split(/[\\/]/).pop()}`);
console.log(`  ${"new".padEnd(8)} ${"duration".padEnd(9)} ${"size".padEnd(8)} ${"what".padEnd(18)} shot at`);
const plan = clips.map((c, i) => {
  const num = String(i + 1).padStart(2, "0");
  const newName = `${num}${extname(c.file).toLowerCase()}`;
  const what = c.ok ? `${c.w}x${c.h}${c.fps ? ` ${c.fps}fps` : ""}${c.audio ? "" : " NO AUDIO"}` : "unreadable";
  console.log(`  ${newName.padEnd(8)} ${(c.dur ? `${c.dur.toFixed(1)}s` : "-").padEnd(9)} ` +
    `${`${(c.size / 2 ** 20).toFixed(0)}MB`.padEnd(8)} ${what.padEnd(18)} ` +
    `${c.shot ? c.shot.toISOString().replace("T", " ").slice(0, 19) : "(no stamp — used file date)"}`);
  return { ...c, newName };
});

console.log(`\n  ${clips.length} clips, ${(totalDur / 60).toFixed(1)} min, ${totalGB.toFixed(2)} GB`);
if (noStamp.length) console.log(`  !! ${noStamp.length} clip(s) carry no capture time — order is a guess for those`);

if (DRY) { console.log("\n--dry, nothing moved."); process.exit(0); }

mkdirSync(folder, { recursive: true });
for (const c of plan) renameSync(c.path, join(folder, c.newName));

const rows = plan.map((c) =>
  `| ${c.newName} | ${c.dur ? `${c.dur.toFixed(1)}s` : "?"} | ${c.w}x${c.h} | ` +
  `${c.audio ? "yes" : "**no**"} | ${c.shot ? c.shot.toISOString().replace("T", " ").slice(0, 19) : "unknown"} | ` +
  `\`${c.file}\` |`).join("\n");

writeFileSync(join(folder, "CLIPS.md"),
  `# Clips — probed, not guessed\n\n` +
  `${clips.length} clips, ${(totalDur / 60).toFixed(1)} min total.\n` +
  `Numbered in **true capture order** from each container's \`creation_time\`.\n` +
  (noStamp.length ? `\n> ${noStamp.length} clip(s) had no capture time; those used the file date and their order is a guess.\n` : "") +
  `\n| # | length | size | audio | shot at | original name |\n|---|---|---|---|---|---|\n${rows}\n`,
  "utf8");

writeFileSync(join(folder, "BRIEF.md"),
  `# What do you want from this?\n\n` +
  `One or two sentences is enough. Or just say it in the chat — either works.\n\n` +
  `---\n\n\n`, "utf8");

console.log(`\nfiled. wrote CLIPS.md and BRIEF.md`);
console.log(`say "edit this" (and a sentence about what you want) and I'll start.`);
