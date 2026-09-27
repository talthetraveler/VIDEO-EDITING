#!/usr/bin/env node
// READ-ONLY Frame.io connection test.
//
// SDK FACTS (probed against the live API 2026-09-20 — do not re-derive):
//   - POSITIONAL args, not objects: workspaces.index(accountId),
//     projects.accountProjectsIndex(accountId), folders.list(accountId, folderId).
//     Passing {accountId} returns 422 "Invalid value".
//   - Responses are wrapped: { response: { data: [...] } }.
//   - folders.list() returns ONLY SUBFOLDERS. Files come from
//     files.list(accountId, folderId). Listing a folder needs BOTH calls.
//   - Folder names contain stray double spaces ("WHAT  MAKES YOU HAPPY"), so
//     normalise whitespace before matching.
//
// Calls nothing that writes, moves, renames, deletes or changes status.
import { FrameioClient } from "frameio";
import { loadAuth } from "./frameio-login-spa.mjs";

const TARGET = process.argv[2]
  ? process.argv[2].split("/").map((s) => s.trim())
  : ["SHOT IN ISRAEL", "WHAT MAKES YOU HAPPY"];

const auth = loadAuth();
if (!auth) { console.error("Not authenticated — run scripts/frameio-login-spa.mjs"); process.exit(1); }
const client = new FrameioClient({ token: () => auth.getToken() });

const arr = (r) => { const d = r?.response?.data ?? r?.data ?? r; return Array.isArray(d) ? d : (d ? [d] : []); };
const one = (r) => r?.response?.data ?? r?.data ?? r;
const nm = (o) => o?.name ?? o?.display_name ?? "(unnamed)";
const norm = (x) => String(x).replace(/\s+/g, " ").trim().toLowerCase();
const mb = (b) => (b ? (b / 1048576).toFixed(0) + "MB" : "?");

const subfolders = async (a, f) => arr(await client.folders.list(a, f).catch(() => []));
const filesIn    = async (a, f) => arr(await client.files.list(a, f).catch(() => []));

console.log("=== ACCOUNT ===");
const accounts = arr(await client.accounts.index());
const acct = accounts[0];
console.log(`  ${acct.id}  ${nm(acct)}`);

const projects = arr(await client.projects.accountProjectsIndex(acct.id));
console.log("\n=== PROJECTS ===");
for (const p of projects) console.log(`  ${nm(p).trim()}`);

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
  if (ok) { found = { folderId: cur, trail }; break; }
}
if (!found) { console.error(`\nCould not resolve: ${TARGET.join(" / ")}`); process.exit(2); }

console.log(`\n=== TARGET: ${found.trail.join(" / ")} ===`);

const buckets = [{ label: "(root)", id: found.folderId }];
for (const sf of await subfolders(acct.id, found.folderId)) buckets.push({ label: nm(sf).trim(), id: sf.id });

const all = [];
for (const b of buckets) {
  const files = await filesIn(acct.id, b.id);
  if (!files.length) continue;
  console.log(`\n  ${b.label}  —  ${files.length} files`);
  for (const f of files) {
    console.log(`     ${mb(f.file_size).padStart(8)}  ${(f.status ?? "").padEnd(11)}  ${nm(f)}`);
    all.push(f);
  }
}

if (!all.length) { console.log("\n  (no files found)"); process.exit(0); }

const s = all[0];
const d = one(await client.files.show(acct.id, s.id));
const ml = d.media_links ?? {};
console.log(`\n=== ASSET DETAIL: ${nm(d)} ===`);
console.log(`  duration            : ${d.media_metadata?.duration ?? d.duration ?? "?"}`);
console.log(`  size                : ${mb(d.file_size)}`);
console.log(`  media_links         : ${Object.keys(ml).join(", ") || "(none)"}`);
console.log(`  PROXY available     : ${!!(ml.efficient || ml.high_quality || ml.video_h264_360)}`);
console.log(`  ORIGINAL available  : ${!!ml.original}`);
console.log(`  transcription_status: ${d.transcription_status ?? "(none)"}`);

console.log(`\n=== TOTALS ===`);
console.log(`  files visible : ${all.length}`);
console.log(`  total size    : ${mb(all.reduce((t, f) => t + (f.file_size || 0), 0))}`);
console.log(`\nNOTHING WAS MODIFIED — read-only calls only.`);
