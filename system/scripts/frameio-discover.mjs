#!/usr/bin/env node
// Frame.io DISCOVERY — understand a shoot cheaply, before touching originals.
//
// VERIFIED FACTS (probed live 2026-09-20 — do not re-derive):
//   - media links are NOT returned by default. Request them:
//       files.show(accountId, fileId, { include: "media_links.thumbnail,..." })
//     A comma-separated STRING works; an array only returns the first entry;
//     {query:{include}} is ignored entirely.
//   - The V4 API does NOT expose transcripts. `include: transcript` -> 422
//     "Unexpected field"; /transcript, /transcription, /transcripts, /captions
//     all -> 404 "no route found". Frame.io transcription is UI-only.
//     => we download the 180p rendition and transcribe locally.
//   - folders.list() returns SUBFOLDERS only; files.list() returns FILES.
//
// READ-ONLY against Frame.io. Downloads only tiny proxies.
//
//   node scripts/frameio-discover.mjs "SHOT IN ISRAEL/WHAT MAKES YOU HAPPY"
//   node scripts/frameio-discover.mjs <path> --fetch     also pull 180p proxies
import { FrameioClient } from "frameio";
import { loadAuth } from "./frameio-login-spa.mjs";
import { mkdirSync, writeFileSync, existsSync, statSync, createWriteStream, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const CACHE = join(ROOT, "projects/_frameio/cache");
const PROXY_DIR = join(CACHE, "proxies");
const INDEX_DIR = join(CACHE, "index");

// lightweight only — original is requested separately, per selected clip
const LIGHT = "media_links.thumbnail,media_links.scrub_sheet,media_links.video_h264_180,media_links.efficient";

const args = process.argv.slice(2);
// A folder name may itself contain a slash ("SHALOM/SALAM"), so split on "/"
// only when it is NOT escaped as "\/".
const TARGET = (args.find((a) => !a.startsWith("--")) ?? "SHOT IN ISRAEL/WHAT MAKES YOU HAPPY")
  .split(/(?<!\\)\//).map((s) => s.replace(/\\\//g, "/").trim());
const FETCH = args.includes("--fetch");

const auth = loadAuth();
if (!auth) { console.error("Not authenticated."); process.exit(1); }
const client = new FrameioClient({ token: () => auth.getToken() });

const arr = (r) => { const d = r?.response?.data ?? r?.data ?? r; return Array.isArray(d) ? d : (d ? [d] : []); };
const one = (r) => r?.response?.data ?? r?.data ?? r;
const nm = (o) => o?.name ?? "(unnamed)";
const norm = (x) => String(x).replace(/\s+/g, " ").trim().toLowerCase();
const mb = (b) => (b ? (b / 1048576).toFixed(1) : "?");

// PAGED. The API caps a page at 50; several folders returned exactly 50, which
// is truncation, not a real count. An un-paged list silently hid the
// "EDITED BY CLAUDE" folder and would have hidden most of HOSPITAL KIDS TO TOYS.
const paged = async (fn, a, f) => {
  // The SDK ignores {page,page_size}: every request returns the SAME first
  // page. Looping 40x produced 2001 entries for a folder with 134 real files.
  // Dedupe by id and stop as soon as a page adds nothing new.
  const seen = new Map();
  for (let page = 1; page <= 40; page++) {
    const d = arr(await fn(a, f, { page, page_size: 50 }).catch(() => []));
    const before = seen.size;
    for (const x of d) if (x?.id) seen.set(x.id, x);
    if (d.length < 50 || seen.size === before) break;   // no new ids -> done
  }
  return [...seen.values()];
};
const subfolders = async (a, f) => paged((x, y, q) => client.folders.list(x, y, q), a, f);
const filesIn = async (a, f) => paged((x, y, q) => client.files.list(x, y, q), a, f);

mkdirSync(PROXY_DIR, { recursive: true });
mkdirSync(INDEX_DIR, { recursive: true });

const acct = arr(await client.accounts.index())[0];
const projects = arr(await client.projects.accountProjectsIndex(acct.id));

let found = null;
for (const p of projects) {
  const root = p.root_folder_id ?? p.root_asset_id;
  if (!root) continue;
  let cur = root, trail = [nm(p).trim()], ok = true;
  for (const seg of TARGET) {
    const kids = await subfolders(acct.id, cur);
    const hit = kids.find((k) => norm(nm(k)) === norm(seg)) ?? kids.find((k) => norm(nm(k)).includes(norm(seg)));
    if (!hit) { ok = false; break; }
    trail.push(nm(hit).trim()); cur = hit.id;
  }
  if (ok) { found = { id: cur, trail }; break; }
}
if (!found) { console.error(`Could not resolve: ${TARGET.join(" / ")}`); process.exit(2); }
console.log(`TARGET: ${found.trail.join(" / ")}\n`);

// gather every file in the folder and one level of sub-shoots
const buckets = [{ label: "(root)", id: found.id }];
for (const sf of await subfolders(acct.id, found.id)) buckets.push({ label: nm(sf).trim(), id: sf.id });

const index = [];
for (const b of buckets) {
  for (const f of await filesIn(acct.id, b.id)) {
    let d = f;
    try { d = one(await client.files.show(acct.id, f.id, { include: LIGHT })) ?? f; } catch {}
    const ml = d.media_links ?? {};
    const pick = (k) => ml[k]?.download_url ?? ml[k]?.url ?? null;
    index.push({
      id: f.id, bucket: b.label, name: nm(f),
      size_mb: +mb(f.file_size),
      duration: d.media_metadata?.duration ?? null,
      media_type: f.media_type ?? null,
      links: {
        thumbnail: pick("thumbnail"),
        scrub_sheet: pick("scrub_sheet"),
        p180: pick("video_h264_180"),
        efficient: pick("efficient"),
      },
    });
  }
}

const withProxy = index.filter((f) => f.links.p180 || f.links.efficient).length;
console.log(`${index.length} files · ${index.reduce((t, f) => t + f.size_mb, 0).toFixed(0)}MB originals`);
console.log(`180p/efficient proxy available: ${withProxy}/${index.length}`);
console.log(`scrub sheets: ${index.filter((f) => f.links.scrub_sheet).length}  thumbnails: ${index.filter((f) => f.links.thumbnail).length}\n`);
for (const b of buckets) {
  const fs_ = index.filter((f) => f.bucket === b.label);
  if (fs_.length) console.log(`  ${b.label}: ${fs_.length} files`);
}

// PER-SHOOT index, then a merged master. Writing one shared file meant
// discovering a second folder silently destroyed the first folder's index.
const slug = found.trail[found.trail.length - 1].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
writeFileSync(join(INDEX_DIR, slug + ".json"), JSON.stringify({ target: found.trail, files: index }, null, 2));
const merged = new Map();
for (const fn of readdirSync(INDEX_DIR).filter((f) => f.endsWith(".json"))) {
  const j = JSON.parse(readFileSync(join(INDEX_DIR, fn), "utf8"));
  for (const f of j.files) merged.set(f.id, { ...f, shoot: j.target[j.target.length - 1] });
}
writeFileSync(join(CACHE, "discover-index.json"), JSON.stringify({ target: found.trail, files: [...merged.values()] }, null, 2));
console.log("index -> cache/index/" + slug + ".json   merged master: " + merged.size + " files");

if (FETCH) {
  console.log(`\nfetching 180p proxies (tiny — NOT originals)…`);
  let got = 0, bytes = 0;
  for (const f of index) {
    // efficient (640x360, H.264 + AAC) — the 180p rendition is VIDEO-ONLY,
    // confirmed by ffprobe, so it is useless for transcription.
    const url = f.links.efficient ?? f.links.p180;
    if (!url) continue;
    const dest = join(PROXY_DIR, `${f.id}.mp4`);
    if (existsSync(dest) && statSync(dest).size > 0) { got++; bytes += statSync(dest).size; continue; }
    try {
      const r = await fetch(url);
      if (!r.ok) { console.log(`  ${f.name}: HTTP ${r.status}`); continue; }
      await pipeline(Readable.fromWeb(r.body), createWriteStream(dest));
      got++; bytes += statSync(dest).size;
      process.stdout.write(`\r  ${got}/${index.length}  ${(bytes / 1048576).toFixed(0)}MB`);
    } catch (e) { console.log(`\n  ${f.name}: ${e.message.slice(0, 60)}`); }
  }
  console.log(`\n\nproxies: ${got} files, ${(bytes / 1048576).toFixed(0)}MB total -> ${PROXY_DIR}`);
  console.log(`(originals untouched — ${index.reduce((t, f) => t + f.size_mb, 0).toFixed(0)}MB not downloaded)`);
}
