#!/usr/bin/env node
// List every file inside a folder id (recursing into subfolders).
//   node scripts/frameio-ls.mjs <folderId>
import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.data ?? r;
const client = makeClient();
const acc = (Array.isArray(one(await client.accounts.index())) ? one(await client.accounts.index())[0] : one(await client.accounts.index()));
const root = process.argv[2];
const out = [];
const walk = async (id, path) => {
  let kids = [];
  try { kids = one(await client.folders.list(acc.id, id)) ?? []; } catch { return; }
  for (const k of (Array.isArray(kids) ? kids : [kids])) {
    if (k.type === "folder") await walk(k.id, `${path}/${k.name}`);
    else out.push({ id: k.id, name: k.name, path, mb: k.file_size ? +(k.file_size / 1048576).toFixed(1) : null });
  }
};
await walk(root, "");
for (const f of out) console.log(`${f.id}  ${String(f.mb ?? "?").padStart(8)}MB  ${f.path}/${f.name}`);
console.log(`\n${out.length} file(s)`);
