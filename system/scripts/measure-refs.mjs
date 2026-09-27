#!/usr/bin/env node
// Measure a list of reference videos the right way.
//
// Cut detection is THRESHOLD-SENSITIVE: 0.30 misses real cuts between
// similar-looking shots (beach after beach) and once made this repo record
// "his biggest reel has ZERO cuts" when it has 4. Measure at 0.20, and report
// 0.30 alongside so the gap is visible.
//
//   node scripts/measure-refs.mjs <file> [file...]
import { execFileSync, spawnSync } from "node:child_process";
import { basename } from "node:path";

const FFDIR = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin";
const FF = `${FFDIR}/ffmpeg.exe`, FP = `${FFDIR}/ffprobe.exe`;

// ffmpeg writes filter MEASUREMENTS to stderr; execFileSync returns only
// stdout. Reading one stream reported 0 cuts on a video with 17.
const both = (bin, args) => {
  // execFileSync returns ONLY stdout on success, and ffmpeg writes filter
  // MEASUREMENTS to stderr — so the success path silently lost every scene
  // score and reported 0 cuts on videos with 25. spawnSync exposes both.
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return (r.stdout || "") + (r.stderr || "");
};

const rows = [];
for (const f of process.argv.slice(2)) {
  let dur = 0, wh = "?";
  try {
    dur = parseFloat(execFileSync(FP, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).trim());
    wh = execFileSync(FP, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", f], { encoding: "utf8" }).trim();
  } catch { console.log(`  !! cannot read ${basename(f)}`); continue; }
  if (!dur) continue;

  const count = (th) => (both(FF, ["-hide_banner", "-i", f, "-vf", `select='gt(scene,${th})',metadata=print`, "-an", "-f", "null", "-"]).match(/lavfi\.scene_score/g) ?? []).length;
  const c20 = count(0.20), c30 = count(0.30);
  rows.push({
    name: basename(f).replace(/\.mp4$/i, "").slice(0, 46),
    dur: +dur.toFixed(0), wh,
    c30, c20,
    perMin: +(c20 / (dur / 60)).toFixed(1),
    avgShot: +(dur / (c20 + 1)).toFixed(2),
  });
}

rows.sort((a, b) => b.perMin - a.perMin);
console.log("\n" + "name".padEnd(48) + "dur".padStart(5) + "  res".padEnd(12) + "@.30".padStart(6) + "@.20".padStart(6) + "  /min".padStart(7) + "  avg".padStart(7));
for (const r of rows) {
  console.log(
    r.name.padEnd(48) +
    String(r.dur + "s").padStart(5) + "  " + r.wh.padEnd(10) +
    String(r.c30).padStart(6) + String(r.c20).padStart(6) +
    String(r.perMin).padStart(7) + String(r.avgShot + "s").padStart(8)
  );
}
console.log(`\nBands:  FAST >20/min (many people, cut IS the structure)`);
console.log(`        MID  8-20/min (a conversation that breathes)`);
console.log(`        SLOW <8/min  (one subject; hold the shot)`);
