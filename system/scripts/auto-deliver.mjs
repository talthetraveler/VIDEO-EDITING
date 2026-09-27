#!/usr/bin/env node
// AUTO-DELIVER — watch projects/ and upload every finished render, once.
//
//   node scripts/auto-deliver.mjs --watch 45          # poll every 45s
//   node scripts/auto-deliver.mjs                     # one pass
//
// Tal: *"if you can handle it, you can run this up in the background
// simultaneously."* This is that: builds run in parallel and each one is
// delivered the moment it is finished, instead of waiting for the whole batch.
//
// SAFE BY CONSTRUCTION:
//   - A render is only considered finished when ffprobe can read a duration
//     from it. A half-written MP4 has no moov atom yet and is skipped, which
//     is how a 2.8 MB fragment of a 15 MB file almost went up.
//   - Every file is delivered ONCE. projects/<slug>/DELIVERED.json is the
//     record; a re-render with a new mtime is re-delivered as a new version.
//   - It only ever creates files in FINAL VIDEOS / EDITED BY CLAUDE.
import { readdirSync, existsSync, statSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { spawnSync } from "node:child_process";
import { deliver, makeClient, DELIVERY_PATH, DeliverError } from "./lib/frameio-deliver.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const PROJ = join(ROOT, "projects");
const FP = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffprobe.exe";
const LOG = join(ROOT, "projects/_frameio/delivered.json");

const args = process.argv.slice(2);
const watchS = (() => { const i = args.indexOf("--watch"); return i >= 0 ? Number(args[i + 1] || 45) : 0; })();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mb = (b) => (b / 1048576).toFixed(1) + " MB";

/** A finished MP4 is one ffprobe can read a duration from. */
function finishedDuration(p) {
  const r = spawnSync(FP, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], { encoding: "utf8" });
  const d = parseFloat((r.stdout || "").trim());
  return Number.isFinite(d) && d > 1 ? d : null;
}

/** Human title for Frame.io from the project slug + render name. */
function displayName(slug, file) {
  const base = basename(file, ".mp4").replace(/_/g, " ").replace(/\s+/g, " ").trim();
  return `${base}.mp4`;
}

function candidates() {
  const out = [];
  for (const slug of readdirSync(PROJ)) {
    const dir = join(PROJ, slug);
    if (slug.startsWith("_") || !statSync(dir).isDirectory()) continue;
    if (!existsSync(join(dir, "edit.json")) && !existsSync(join(dir, "EDIT.json"))) continue;
    for (const f of readdirSync(dir)) {
      if (!f.toLowerCase().endsWith(".mp4")) continue;
      if (/_PREVIEW\.mp4$/i.test(f)) continue;           // working previews stay local
      out.push({ slug, dir, file: join(dir, f), name: f });
    }
  }
  return out;
}

function alreadySent(rec, file, mtime) {
  return rec.some((d) => d.render === file && Math.abs((d.render_mtime ?? 0) - mtime) < 1000);
}

/**
 * Cuts deliberately removed from Frame.io (scripts/frameio-remove.mjs).
 * Without this the remover and the watcher fight each other: removing a file
 * drops its delivered.json row, the watcher sees an "undelivered" render on
 * disk and puts it straight back. It did exactly that with 13 files.
 */
function tombstoned() {
  const p = join(ROOT, "projects/_frameio/removed.json");
  if (!existsSync(p)) return new Set();
  try { return new Set(JSON.parse(readFileSync(p, "utf8")).map((r) => r.name)); }
  catch { return new Set(); }
}

async function pass(client) {
  const rec = existsSync(LOG) ? JSON.parse(readFileSync(LOG, "utf8")) : [];
  const dead = tombstoned();
  let sent = 0;
  for (const c of candidates()) {
    const st = statSync(c.file);
    if (alreadySent(rec, c.file, st.mtimeMs)) continue;
    if (dead.has(displayName(c.slug, c.file))) continue;   // deliberately removed
    if (Date.now() - st.mtimeMs < 8000) continue;        // still being written
    const dur = finishedDuration(c.file);
    if (!dur) { console.log(`  · ${c.name} not finished yet (no duration) — skipping this pass`); continue; }

    const name = displayName(c.slug, c.file);
    console.log(`\nDELIVERING ${name}  ${mb(st.size)}  ${dur.toFixed(1)}s   [${c.slug}]`);
    try {
      const res = await deliver(c.file, DELIVERY_PATH, { client, displayName: name });
      console.log(`  OK  ${res.file_id}  ${res.parts} part(s)  ${res.status}`);
      rec.push({ slug: c.slug, render: c.file, render_mtime: st.mtimeMs, duration_s: +dur.toFixed(2),
        delivered_at: new Date().toISOString(), ...res });
      mkdirSync(dirname(LOG), { recursive: true });
      writeFileSync(LOG, JSON.stringify(rec, null, 2), "utf8");
      writeFileSync(join(c.dir, "DELIVERED.json"), JSON.stringify(rec[rec.length - 1], null, 2), "utf8");
      sent++;
    } catch (e) {
      // Never mark delivered, never delete the local file.
      console.error(`  FRAME.IO UPLOAD FAILED  [${c.slug}]`);
      console.error(`  Local file: ${c.file}  (kept)`);
      console.error(`  Stage: ${e instanceof DeliverError ? e.stage : "unknown"}`);
      console.error(`  Error: ${e.message.slice(0, 300)}`);
    }
  }
  return sent;
}

const client = makeClient();
if (!watchS) {
  const n = await pass(client);
  console.log(`\n${n} delivered.`);
} else {
  console.log(`auto-deliver watching projects/ every ${watchS}s — Ctrl-C to stop\n`);
  for (;;) {
    try { await pass(client); } catch (e) { console.error(`pass failed: ${e.message.slice(0, 200)}`); }
    await sleep(watchS * 1000);
  }
}
