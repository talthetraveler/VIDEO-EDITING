#!/usr/bin/env node
// Raw iCloud clips -> transcript (Groq, cached) -> Frame.io (verified) -> local copy deleted.
//
// Tal, 2026-10-28: "download the past videos, past 150 ... put it in my frame. That way you can
// transcribe it." and "Download the originals (HDR is all iCloud gives), upload them to Frame.io as
// they are, transcribe them all. Convert to normal colour only in the edit."
//
// iCloud.com cannot give SDR video: "Most Compatible" returns the HDR original byte for byte
// (LESSONS 163). So originals go up untouched; build-edit tone-maps at edit time.
//
//   node system/scripts/icloud-ingest.mjs <dir-or-zip>... [--folder "RAW FROM ICLOUD 2026-10-28"]
//        [--delete] [--keep IMG_1042,IMG_1043] [--no-upload]
//
// A file is deleted (with --delete) ONLY when its transcript is cached AND Frame.io confirmed the
// upload by name and size. Resumable: every verified upload is appended to uploads.jsonl and skipped
// on a rerun. Zips are extracted next to themselves and the zip is deleted after extraction.
// Transcripts live in system/projects/icloud-raw/transcripts/ - never pushed (public repo).
import { readdirSync, existsSync, writeFileSync, readFileSync, appendFileSync, rmSync, statSync, mkdirSync } from "node:fs";
import { join, basename, extname, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { loadEnv, extractAudio, groqTranscribe, pool } from "./lib/stt.mjs";
import { makeClient, resolveFolder, deliver, filesIn } from "./lib/frameio-deliver.mjs";

loadEnv();
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const FOLDER = opt("--folder", "RAW FROM ICLOUD 2026-10-28");
const DELETE = args.includes("--delete");
const UPLOAD = !args.includes("--no-upload");
const KEEP = new Set(String(opt("--keep", "")).split(",").filter(Boolean).map((s) => s.toUpperCase()));
const inputs = args.filter((a, i) => !a.startsWith("--") && !["--folder", "--keep"].includes(args[i - 1]));
if (!inputs.length) { console.error("usage: icloud-ingest.mjs <dir-or-zip>... [--folder NAME] [--delete] [--keep IMG_1,IMG_2]"); process.exit(2); }

const PROJ = "C:/Users/taldo/Downloads/videos to edit/system/projects/icloud-raw";
const TX = join(PROJ, "transcripts");
const LOG = join(PROJ, "uploads.jsonl");
const INDEX = join(PROJ, "index.jsonl");
mkdirSync(TX, { recursive: true });
const MEDIA = new Set([".mov", ".mp4", ".m4v"]);

// expand zips, collect media files
const files = [];
for (const inp of inputs) {
  if (/\.zip$/i.test(inp)) {
    const out = inp.replace(/\.zip$/i, "");
    mkdirSync(out, { recursive: true });
    execFileSync("tar", ["-xf", inp, "-C", out]);
    rmSync(inp);
    console.log(`extracted ${basename(inp)} -> ${out}`);
    for (const f of readdirSync(out, { recursive: true })) if (MEDIA.has(extname(f).toLowerCase())) files.push(join(out, f));
  } else if (statSync(inp).isDirectory()) {
    for (const f of readdirSync(inp)) if (MEDIA.has(extname(f).toLowerCase())) files.push(join(inp, f));
  } else files.push(inp);
}
const done = new Map(existsSync(LOG)
  ? readFileSync(LOG, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.ok).map((r) => [r.name, r])
  : []);
const probe = (p) => {
  try {
    const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:format_tags=creation_time",
      "-show_entries", "stream=width,height,color_transfer:stream_tags=rotate", "-select_streams", "v:0", "-of", "json", p], { encoding: "utf8" }));
    return { duration: +(+j.format.duration).toFixed(2), created: j.format.tags?.creation_time ?? null,
      size: `${j.streams[0]?.width}x${j.streams[0]?.height}`, hdr: /arib|smpte2084/.test(j.streams[0]?.color_transfer ?? "") };
  } catch { return {}; }
};
console.log(`${files.length} clips; folder "SHOT IN ISRAEL / ${FOLDER}"; delete=${DELETE}`);

// 1. transcripts (cached per clip name)
await pool(files, 4, async (p) => {
  const name = basename(p);
  const o = join(TX, name.replace(/\.\w+$/, ".json"));
  if (existsSync(o)) return;
  const a = join(tmpdir(), `icloud-${name}.flac`);
  try {
    extractAudio(p, a);
    const r = await groqTranscribe(a, { words: true });
    writeFileSync(o, JSON.stringify(r));
    console.log(`  tx ${name} [${r.language}] ${(r.segments || []).map((s) => s.text).join(" ").slice(0, 110)}`);
  } catch (e) { console.log(`  tx ${name} FAILED ${e.message}`); }
  finally { rmSync(a, { force: true }); }
});
// one index line per clip (duration, capture time, HDR, language, full text) - the shortlist reads this
const indexed = new Set(existsSync(INDEX) ? readFileSync(INDEX, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).name) : []);
for (const p of files) {
  const name = basename(p), o = join(TX, name.replace(/\.\w+$/, ".json"));
  if (indexed.has(name) || !existsSync(o)) continue;
  const r = JSON.parse(readFileSync(o, "utf8"));
  const text = (r.segments || []).map((s) => s.text).join(" ").replace(/\s+/g, " ").trim();
  appendFileSync(INDEX, JSON.stringify({ name, ...probe(p), language: r.language, text }) + "\n");
}

// 2. upload, verified
let dest;
if (UPLOAD) {
  const client = makeClient();
  const base = await resolveFolder(client, ["SHOT IN ISRAEL"]);
  const one = (r) => r?.response?.data ?? r?.data ?? r;
  const kids = await (async () => { const out = []; let after;
    for (let i = 0; i < 20; i++) {
      const r = await client.folders.list(base.accountId, base.folderId, after ? { page_size: 50, after } : { page_size: 50 });
      const d = one(r); out.push(...(Array.isArray(d) ? d : []));
      const m = String(r?.response?.links?.next ?? r?.links?.next ?? "").match(/[?&]after=([^&]+)/);
      if (!m) break; after = decodeURIComponent(m[1]);
    } return out; })();
  let hit = kids.find((k) => k.type === "folder" && k.name.trim() === FOLDER);
  if (!hit) { hit = one(await client.folders.create(base.accountId, base.folderId, { data: { name: FOLDER } })); console.log(`created folder ${FOLDER}`); }
  dest = { accountId: base.accountId, folderId: hit.id, trail: [...base.trail, FOLDER] };
  const remote = new Map((await filesIn(client, dest.accountId, dest.folderId)).map((f) => [f.name, f]));
  await pool(files, 3, async (p) => {
    const name = basename(p), bytes = statSync(p).size;
    const r = remote.get(name);
    if (done.has(name) || (r && (r.file_size ?? r.filesize) === bytes)) { if (!done.has(name)) { done.set(name, { name, bytes, ok: true }); appendFileSync(LOG, JSON.stringify({ name, bytes, ok: true, file_id: r.id, note: "already there" }) + "\n"); } return; }
    try {
      const v = await deliver(p, dest, { client });
      const rec = { name, bytes, ok: true, file_id: v.file_id, at: new Date().toISOString() };
      appendFileSync(LOG, JSON.stringify(rec) + "\n"); done.set(name, rec);
      console.log(`  up ${name} ${(bytes / 1048576).toFixed(0)} MB verified`);
    } catch (e) { appendFileSync(LOG, JSON.stringify({ name, bytes, ok: false, error: e.message }) + "\n"); console.log(`  up ${name} FAILED ${e.stage ?? ""} ${e.message}`); }
  });
}

// 3. delete local only when transcript + verified upload of the same size exist
let freed = 0, kept = [];
for (const p of files) {
  const name = basename(p), stem = name.replace(/\.\w+$/, "").toUpperCase();
  const ok = existsSync(join(TX, name.replace(/\.\w+$/, ".json"))) && done.get(name)?.bytes === statSync(p).size;
  if (!DELETE || KEEP.has(stem) || !ok) { kept.push(`${name}${ok ? "" : " (NOT safe: missing transcript or upload)"}`); continue; }
  freed += statSync(p).size; rmSync(p);
}
for (const d of new Set(files.map(dirname))) { try { if (!readdirSync(d).length) rmSync(d, { recursive: true }); } catch {} }
console.log(`done. uploaded+verified ${[...done.values()].length} total; freed ${(freed / 1073741824).toFixed(2)} GB; kept ${kept.length}`);
for (const k of kept) console.log("  kept", k);
