#!/usr/bin/env node
// Put every local media file that is NOT yet on Frame.io onto Frame.io, under
//   SOCIAL ACCORDS / SHOT IN ISRAEL / FROM LAPTOP <date> / <same relative path>
// so FOOTAGE IN/ and VIDEOS OUT/ can be cleared from the laptop afterwards.
//
// Tal, 2026-10-03: "make sure everything's there in the frame.io and then I go."
//
// Input: projects/_frameio/cache/local-vs-frameio.json (name + exact-size match
// of every local file against frameio-inventory.mjs). Uploads only rows that
// did not match. Resumable: every verified upload is appended to
// projects/_frameio/cache/archive-upload.jsonl and skipped on a rerun.
// Uploads only; never deletes anything, local or remote.
//
//   node system/scripts/frameio-archive.mjs [--dry] [--concurrency 3]
import { readFileSync, existsSync, appendFileSync, statSync } from "node:fs";
import { join, extname, dirname, basename } from "node:path";
import { makeClient, resolveFolder, deliver } from "./lib/frameio-deliver.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit";
const CACHE = join(ROOT, "system/projects/_frameio/cache");
const LOG = join(CACHE, "archive-upload.jsonl");
const DATE = "2026-10-03";
const TOP = `FROM LAPTOP ${DATE}`;
const MEDIA = new Set([".mp4", ".mov", ".m4v", ".jpg", ".jpeg", ".png"]);
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const CONC = args.includes("--concurrency") ? +args[args.indexOf("--concurrency") + 1] : 3;
const LIMIT = args.includes("--limit") ? +args[args.indexOf("--limit") + 1] : Infinity;

const one = (r) => r?.response?.data ?? r?.data ?? r;
const arr = (x) => { const d = one(x); return Array.isArray(d) ? d : d ? [d] : []; };

const rows = JSON.parse(readFileSync(join(CACHE, "local-vs-frameio.json"), "utf8"));
const done = new Set(existsSync(LOG)
  ? readFileSync(LOG, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.ok).map((r) => r.local)
  : []);
const all = rows.filter((r) => !["NAME+SIZE", "SIZE-ONLY"].includes(r.status)
  && MEDIA.has(extname(r.p).toLowerCase()) && r.bytes > 1024 && !done.has(r.p));
const todo = all.slice(0, LIMIT);
const gb = (b) => (b / 1073741824).toFixed(2);
console.log(`${todo.length} files, ${gb(todo.reduce((t, r) => t + r.bytes, 0))} GB to upload (${done.size} already done)`);
if (DRY) { for (const r of todo.slice(0, 20)) console.log("  ", r.p); process.exit(0); }

const client = makeClient();
const base = await resolveFolder(client, ["SHOT IN ISRAEL"]);
const acct = base.accountId;

// get-or-create, exact name only (never the "includes" fallback: a folder
// called "VIDEOS" must not be mistaken for "VIDEOS OUT").
const cache = new Map();
async function child(parentId, name) {
  const key = parentId + "/" + name;
  if (cache.has(key)) return cache.get(key);
  const kids = [];
  const seen = new Set();
  for (let page = 1; page <= 20; page++) {
    const d = arr(await client.folders.list(acct, parentId, { page, page_size: 50 }).catch(() => []));
    const before = seen.size;
    for (const k of d) if (k?.id && !seen.has(k.id)) { seen.add(k.id); kids.push(k); }
    if (d.length < 50 || seen.size === before) break;
  }
  let hit = kids.find((k) => k.type === "folder" && k.name.trim() === name);
  if (!hit) hit = one(await client.folders.create(acct, parentId, { data: { name } }));
  if (!hit?.id) throw new Error(`could not create folder ${name}`);
  cache.set(key, hit.id);
  return hit.id;
}
const folderFor = (() => {
  const chain = new Map();
  return async (relDir) => {
    if (chain.has(relDir)) return chain.get(relDir);
    const p = (async () => {
      let cur = await child(base.folderId, TOP);
      for (const seg of relDir.split(/[\\/]/).filter(Boolean)) cur = await child(cur, seg);
      return cur;
    })();
    chain.set(relDir, p);
    return p;
  };
})();

// create every folder first, sequentially, so parallel uploads never race to
// create the same folder twice
for (const d of [...new Set(todo.map((r) => dirname(r.p)))].sort()) await folderFor(d);

let ok = 0, bad = 0, bytes = 0;
const queue = [...todo];
async function worker() {
  for (let r = queue.shift(); r; r = queue.shift()) {
    const local = join(ROOT, r.p);
    try {
      if (!existsSync(local) || statSync(local).size !== r.bytes) throw new Error("local file changed since the inventory");
      const folderId = await folderFor(dirname(r.p));
      const res = await deliver(local, { accountId: acct, folderId, projectId: base.projectId, trail: [...base.trail, TOP, ...dirname(r.p).split(/[\\/]/)] }, { client });
      appendFileSync(LOG, JSON.stringify({ ok: true, local: r.p, bytes: r.bytes, file_id: res.file_id, folder: `${TOP}/${dirname(r.p)}`, at: new Date().toISOString() }) + "\n");
      ok++; bytes += r.bytes;
      console.log(`  ok ${ok + bad}/${todo.length}  ${gb(bytes)} GB  ${r.p}`);
    } catch (e) {
      appendFileSync(LOG, JSON.stringify({ ok: false, local: r.p, error: String(e.message).slice(0, 300), at: new Date().toISOString() }) + "\n");
      bad++;
      console.log(`  FAIL ${r.p}: ${String(e.message).slice(0, 200)}`);
    }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
console.log(`\nuploaded ${ok}, failed ${bad}, ${gb(bytes)} GB -> SHOT IN ISRAEL / ${TOP}`);
