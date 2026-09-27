#!/usr/bin/env node
// Search EVERY folder name across every project, with proper paging.
// folders.list ignores {page,page_size} and repeats a page, so results are
// de-duplicated on id and paging stops when a page adds nothing new.
import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.data ?? r;
const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const client = makeClient();
const needle = (process.argv[2] || "").toLowerCase();

async function kids(acct, id) {
  const seen = new Map();
  for (let page = 1; page <= 12; page++) {
    let batch = [];
    try { batch = arr(one(await client.folders.list(acct, id, { page, page_size: 100 }))); } catch { break; }
    const before = seen.size;
    for (const k of batch) seen.set(k.id, k);
    if (seen.size === before) break;            // page repeated -> done
  }
  return [...seen.values()];
}

for (const acc of arr(one(await client.accounts.index()))) {
  for (const pr of arr(one(await client.projects.accountProjectsIndex(acc.id)))) {
    const walk = async (id, path, depth) => {
      if (depth > 7) return;
      for (const k of await kids(acc.id, id)) {
        if (k.type !== "folder") continue;
        const here = `${path} / ${k.name}`;
        if (k.name.toLowerCase().includes(needle)) console.log(`MATCH  ${k.id}  ${here}`);
        await walk(k.id, here, depth + 1);
      }
    };
    await walk(pr.root_folder_id ?? pr.root_asset_id, pr.name, 0);
  }
}
