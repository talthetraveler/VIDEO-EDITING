// Build the tracker's "Trial reels" rows WITH thumbnails (Tal, 2026-10-11: "see there trial reels
// scheduled/posted and a lil thumbnail"). Read-only against Metricool/ShortSync.
//   node scripts/_tracker-trials.mjs projects/_metricool-upload/tracker/seed/trials-<date>.txt
// Input lines: date|time|title|metricool media file id|source|[status]. ShortSync's Instagram trials
// are read live and matched to the local render through each ib-* project's deliver.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const TR = join(ROOT, "projects/_metricool-upload/tracker"), TH = join(TR, "pub/thumbs");
mkdirSync(TH, { recursive: true });
const grab = (src, out, ss = "1.5") => { if (existsSync(out)) return true;
  try { execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", ss, "-i", src, "-frames:v", "1", "-vf", "scale=160:-2", "-q:v", "5", out], { stdio: "pipe", timeout: 90000 }); return existsSync(out); } catch { return false; } };
const rows = [];
for (const ln of readFileSync(process.argv[2], "utf8").split(/\r?\n/).filter(Boolean)) {
  const [date, time, text, id, by, st] = ln.split("|");
  const f = `t_${id.slice(-10)}.jpg`;
  const ok = grab(`https://static.metricool.com/planner/202610/7272755-file-${id}.mp4`, join(TH, f));
  rows.push({ date, time, text, by, s: st === "posted" ? "posted" : "scheduled", note: st === "sent" ? "sent, not confirmed live" : "", thumb: ok ? "thumbs/" + f : "", tool: "Metricool" });
}
// ShortSync
const cfg = JSON.parse(readFileSync(join(ROOT, "projects/_publish/shortsync.config.json"), "utf8"));
const base = (cfg.base_url || "https://api.shortsync.app/v1").replace(/\/$/, ""), key = cfg.api_key || cfg.key || cfg.token;
const H = { headers: { Authorization: "Bearer " + key } };
const local = {};
for (const d of readdirSync(join(ROOT, "projects"))) { const p = join(ROOT, "projects", d, "deliver.json"); if (!existsSync(p)) continue;
  try { const j = JSON.parse(readFileSync(p, "utf8")); for (const x of [].concat(j)) if (x?.file && x?.render) local[x.file] = join(ROOT, "projects", d, x.render); } catch {} }
// fallback: finished files Tal kept under VIDEOS OUT, by exact file name (previews folders last)
const VO = "C:/Users/taldo/Downloads/videos to edit/VIDEOS OUT";
const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const q = join(d, e.name);
  if (e.isDirectory()) walk(q); else if (/\.mp4$/i.test(e.name) && (!local[e.name] || /previews/i.test(local[e.name]))) local[e.name] = q; } };
if (existsSync(VO)) walk(VO);
const j = await (await fetch(base + "/posts?platform=instagram&limit=100", H)).json();
const seen = new Set(); let miss = [];
for (const p of (j.data || j.posts || j.items || [])) {
  if (p.publish_mode === "draft" || !p.scheduled_for) continue;
  if (!(p.status === "scheduled" || (p.status === "published" && p.scheduled_for >= "2026-10-10"))) continue;
  const k = p.scheduled_for + (p.title || ""); if (seen.has(k)) continue; seen.add(k);
  const il = new Date(new Date(p.scheduled_for).getTime() + 3 * 3600e3).toISOString();
  let thumb = "";
  try { const u = await (await fetch(base + "/uploads/" + p.upload_id, H)).json(); const src = local[u.filename];
    if (src && existsSync(src)) { const f = `s_${p.upload_id.slice(0, 8)}.jpg`; if (grab(src, join(TH, f))) thumb = "thumbs/" + f; } else miss.push(u.filename); } catch {}
  rows.push({ date: il.slice(0, 10), time: il.slice(11, 16), text: (p.title || "").replace(/\s+/g, " ").trim(), by: "Street POV (ShortSync)", s: p.status === "published" ? "posted" : "scheduled", note: "", thumb, tool: "ShortSync", url: p.platform_url || "" });
}
rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
writeFileSync(join(TR, "seed/trials-rows.json"), JSON.stringify({ rows }, null, 0));
const byDay = {}; for (const r of rows) byDay[r.date] = (byDay[r.date] || 0) + 1;
console.log(rows.length, "rows;", rows.filter((r) => r.thumb).length, "with thumbnail"); console.log(JSON.stringify(byDay)); if (miss.length) console.log("no local render for:", miss);
