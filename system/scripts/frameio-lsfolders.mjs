#!/usr/bin/env node
// List every folder in a project, with proper de-duplicated paging.
import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.data ?? r;
const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const client = makeClient();
const want = (process.argv[2] || "").toLowerCase();
async function kids(acct, id) {
  const seen = new Map();
  for (let page = 1; page <= 12; page++) {
    let b = [];
    try { b = arr(one(await client.folders.list(acct, id, { page, page_size: 100 }))); } catch { break; }
    const before = seen.size;
    for (const k of b) seen.set(k.id, k);
    if (seen.size === before) break;
  }
  return [...seen.values()];
}
for (const acc of arr(one(await client.accounts.index()))) {
  for (const pr of arr(one(await client.projects.accountProjectsIndex(acc.id)))) {
    if (want && !pr.name.toLowerCase().includes(want)) continue;
    console.log(`\nPROJECT ${pr.name}`);
    const walk = async (id, d) => {
      for (const k of await kids(acc.id, id)) {
        if (k.type !== "folder") continue;
        console.log(`${"  ".repeat(d)}${k.id}  ${k.name}`);
        if (d < 3) await walk(k.id, d + 1);
      }
    };
    await walk(pr.root_folder_id ?? pr.root_asset_id, 1);
  }
}
