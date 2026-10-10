// Full-quality hand-over: download originals from Frame.io and remux to .mp4 with NO re-encode.
import { makeClient } from "./lib/frameio-deliver.mjs";
import { writeFileSync, existsSync, rmSync, readFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const P = "C:/Users/taldo/Downloads/videos to edit/system/projects/_metricool-upload/";
mkdirSync(P + "hq", { recursive: true });
const trials = JSON.parse(readFileSync(P + "intake-trials.json", "utf8"));
const other = JSON.parse(readFileSync(P + "other/index.json", "utf8"));
const want8 = process.argv.slice(2);
const jobs = [];
for (const k of want8) { const t = trials.find((x) => x.id.startsWith(k)); if (t) jobs.push([t.id, k]); }
for (const o of other) if (o.n !== 9) jobs.push([o.id, "o" + String(o.n).padStart(2, "0")]);
for (const [id, key] of jobs) {
  const dst = `${P}hq/${key}.mp4`; if (existsSync(dst)) { console.log("have", key); continue; }
  try {
    const d = one(await client.files.show(acc.id, id, { include: "media_links.original" }));
    const src = `${P}hq/${key}.src`;
    writeFileSync(src, Buffer.from(await (await fetch(d.media_links.original.download_url)).arrayBuffer()));
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-c", "copy", "-movflags", "+faststart", dst]);
    rmSync(src, { force: true });
    const info = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height", "-of", "csv=p=0", dst]).toString().trim();
    console.log("ok", key, (d.file_size / 1048576).toFixed(0) + "MB", info, "|", d.name);
  } catch (e) { console.log("FAIL", key, String(e?.message).slice(0, 120)); }
}
