#!/usr/bin/env node
// Find a folder by name (case-insensitive substring) and list everything in it.
//   node scripts/frameio-find.mjs "fabian and avi"
import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.data ?? r;
const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const client = makeClient();
const needle = (process.argv[2] || "").toLowerCase();

const accs = arr(one(await client.accounts.index()));
let target = null;
for (const acc of accs) {
  for (const pr of arr(one(await client.projects.accountProjectsIndex(acc.id)))) {
    const seen = new Set();
    const walk = async (id, depth) => {
      if (target || depth > 6 || seen.has(id)) return;
      seen.add(id);
      for (const k of arr(one(await client.folders.list(acc.id, id)))) {
        if (k.type !== "folder") continue;
        if (k.name.toLowerCase().includes(needle)) { target = { acc: acc.id, id: k.id, name: k.name }; return; }
        await walk(k.id, depth + 1);
      }
    };
    await walk(pr.root_folder_id ?? pr.root_asset_id, 0);
    if (target) break;
  }
  if (target) break;
}
if (!target) { console.error(`no folder matching "${needle}"`); process.exit(1); }
console.log(`FOLDER  ${target.name}\n  id ${target.id}\n`);

// folders.list() returns SUBFOLDERS ONLY; files.list() returns the FILES.
// Listing a folder with folders.list alone reports "0 file(s)" for a folder
// that plainly has 36 clips in it.
const files = [];
const walk2 = async (id, path) => {
  for (const f of arr(one(await client.files.list(target.acc, id)))) {
    files.push({ id: f.id, name: f.name, path,
      mb: f.file_size ? +(f.file_size / 1048576).toFixed(1) : null });
  }
  for (const k of arr(one(await client.folders.list(target.acc, id)))) {
    if (k.type === "folder") await walk2(k.id, `${path}/${k.name}`);
  }
};
await walk2(target.id, "");
for (const f of files) console.log(`${f.id}  ${String(f.mb ?? "?").padStart(9)}MB  ${f.path}/${f.name}`);
console.log(`\n${files.length} file(s)`);
