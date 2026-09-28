#!/usr/bin/env node
// BATCH-INVENTORY — one row per clip of a transcribed local batch, in the
// order it was SHOT, so a 400-clip folder can be read as a story.
//
//   node scripts/batch-inventory.mjs <slug>
//
// Reads the transcribe-local cache (local-sources.json, transcripts/,
// translate/) and ffprobe. Writes projects/<slug>/inventory.json and
// INVENTORY.md: capture time, duration, size/shape, rotation, language,
// words, English. Rows are grouped into SESSIONS: a gap of more than
// --gap seconds (default 150) between one clip's end and the next clip's
// start begins a new one. A session is a CANDIDATE encounter only — one
// street can hold many people (CLAUDE.md §7: an interaction is often not one
// conversation). Read the words before trusting a group.
//
// Why capture time: iCloud-web export names (video-4955_singular_display)
// are NOT capture order, and file mtimes are copy stamps.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const CACHE = join(ROOT, "projects/_frameio/cache");
const slug = process.argv[2];
const gapArg = process.argv.indexOf("--gap");
const GAP = gapArg > 0 ? +process.argv[gapArg + 1] : 150;
if (!slug) { console.error("usage: node scripts/batch-inventory.mjs <slug> [--gap 150]"); process.exit(2); }

const src = JSON.parse(readFileSync(join(CACHE, "local-sources.json"), "utf8"));
const ids = Object.entries(src).filter(([, v]) => v.slug === slug);

function probe(path) {
  try {
    const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", path], { encoding: "utf8" }));
    const v = (j.streams || []).find((s) => s.codec_type === "video") || {};
    const tags = { ...(j.format?.tags || {}), ...(v.tags || {}) };
    let rot = 0;
    for (const sd of v.side_data_list || []) if (sd.rotation != null) rot = +sd.rotation;
    if (tags.rotate) rot = +tags.rotate;
    let w = v.width, h = v.height;
    if (Math.abs(rot) === 90 || Math.abs(rot) === 270) [w, h] = [h, w];
    const ct = tags.creation_time || tags["com.apple.quicktime.creationdate"] || null;
    return {
      dur: +(+j.format?.duration || 0).toFixed(2), w, h, rot,
      fps: v.r_frame_rate, created: ct, device: tags["com.apple.quicktime.model"] || tags.model || null,
    };
  } catch (e) { return { error: String(e).slice(0, 80) }; }
}

const rows = [];
for (const [id, s] of ids) {
  const p = probe(s.path);
  const tf = join(CACHE, "transcripts", `${id}.json`);
  const t = existsSync(tf) ? JSON.parse(readFileSync(tf, "utf8")) : {};
  const trf = join(CACHE, "translate", `${id}.json`);
  const tr = existsSync(trf) ? JSON.parse(readFileSync(trf, "utf8")) : null;
  const text = (t.segments || []).map((x) => x.text.trim()).join(" ").trim();
  const en = tr ? (tr.segments || []).map((x) => x.text.trim()).join(" ").trim() : null;
  rows.push({
    id, name: s.name, path: s.path, ...p,
    shape: p.w && p.h ? (p.h / p.w > 1.7 ? "9:16" : p.h / p.w > 1.2 ? "3:4" : p.h / p.w > 0.9 ? "square" : "landscape") : "?",
    lang: t.language || null, silent: !!t.silent || !text, words: (t.words || []).length, text, en,
  });
}

// capture order; clips without a creation time go last, by name
rows.sort((a, b) => {
  const ta = a.created ? Date.parse(a.created) : Infinity, tb = b.created ? Date.parse(b.created) : Infinity;
  return ta - tb || a.name.localeCompare(b.name, undefined, { numeric: true });
});
let sess = 0, prevEnd = null;
for (const r of rows) {
  const st = r.created ? Date.parse(r.created) / 1000 : null;
  if (st == null || prevEnd == null || st - prevEnd > GAP) sess++;
  r.session = sess;
  prevEnd = st != null ? st + (r.dur || 0) : prevEnd;
}

const dir = join(ROOT, "projects", slug);
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "inventory.json"), JSON.stringify(rows, null, 1));
const md = [`# ${slug} — ${rows.length} clips in capture order (session gap ${GAP}s)`, ""];
let cur = 0;
for (const r of rows) {
  if (r.session !== cur) { cur = r.session; md.push("", `## S${cur}`); }
  const when = r.created ? r.created.replace("T", " ").slice(5, 19) : "no-date";
  md.push(`- **${r.name}** \`${r.id}\` ${when} · ${r.dur}s · ${r.shape}${r.rot ? ` rot${r.rot}` : ""} · ${r.lang || "-"}${r.silent ? " · SILENT" : ""}`);
  if (r.text) md.push(`  > ${r.text.slice(0, 600)}`);
  if (r.en && r.lang && !/^en/i.test(r.lang)) md.push(`  > EN: ${r.en.slice(0, 600)}`);
}
writeFileSync(join(dir, "INVENTORY.md"), md.join("\n"));
const by = (k) => Object.entries(rows.reduce((m, r) => ((m[r[k] ?? "?"] = (m[r[k] ?? "?"] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
console.log(`${rows.length} clips, ${sess} sessions, ${rows.filter((r) => r.silent).length} silent, ${rows.filter((r) => !r.created).length} without capture time`);
console.log("shape:", JSON.stringify(by("shape")), " lang:", JSON.stringify(by("lang").slice(0, 6)));
console.log("total minutes:", (rows.reduce((a, r) => a + (r.dur || 0), 0) / 60).toFixed(1));
console.log(`-> projects/${slug}/INVENTORY.md`);
