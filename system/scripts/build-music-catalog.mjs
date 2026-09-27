import { readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
const DIR = join(process.cwd(), "projects/_assets/music");
const files = readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".mp3")).sort();
const out = [];
for (const f of files) {
  const p = join(DIR, f);
  const pr = spawnSync("ffprobe", ["-v","error","-show_entries","format=duration","-of","csv=p=0",p], { encoding:"utf8" });
  const sec = +((pr.stdout||"0").trim()) || 0;
  // volumedetect -> mean_volume / max_volume on stderr (reliable)
  const vd = spawnSync("ffmpeg", ["-hide_banner","-i",p,"-af","volumedetect","-f","null","-"], { encoding:"utf8", maxBuffer:1<<24 });
  const e = (vd.stderr||"") + (vd.stdout||"");
  const mean = (e.match(/mean_volume:\s*(-?[\d.]+)\s*dB/)||[])[1];
  const max = (e.match(/max_volume:\s*(-?[\d.]+)\s*dB/)||[])[1];
  const rms = mean!=null ? +mean : null;
  // crest factor (max - mean): small = heavily compressed/loud/energetic
  const crest = (rms!=null && max!=null) ? +(max - rms).toFixed(1) : null;
  const energy = rms==null ? "?" : (rms > -13 ? "high" : rms > -18 ? "mid" : "low");
  out.push({ file: f, sec: +sec.toFixed(1), rms, maxdb: max!=null?+max:null, crest, energy });
  process.stdout.write(".");
}
writeFileSync(join(DIR,"catalog.json"), JSON.stringify(out,null,2));
console.log(`\n${out.length} tracks -> catalog.json`);
