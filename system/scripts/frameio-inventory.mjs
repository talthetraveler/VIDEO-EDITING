#!/usr/bin/env node
// READ-ONLY. Every file in every Frame.io project: name, exact bytes, folder path.
// Written to projects/_frameio/cache/inventory.json. Used to prove a local file
// is already safe on Frame.io before anything local is removed.
//
//   node system/scripts/frameio-inventory.mjs
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeClient, filesIn } from "./lib/frameio-deliver.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const arr = (x) => { const d = one(x); return Array.isArray(d) ? d : d ? [d] : []; };
const client = makeClient();

// The SDK ignores paging and returns the same first page; dedupe by id and
// stop when a page adds nothing (same rule as frameio-discover.mjs).
async function subfolders(acct, id) {
  const seen = new Map();
  for (let page = 1; page <= 40; page++) {
    const d = arr(await client.folders.list(acct, id, { page, page_size: 50 }).catch(() => []));
    const before = seen.size;
    for (const k of d) if (k?.id && k.type === "folder") seen.set(k.id, k);
    if (d.length < 50 || seen.size === before) break;
  }
  return [...seen.values()];
}

const out = [];
let folders = 0;
for (const acc of arr(await client.accounts.index())) {
  for (const pr of arr(await client.projects.accountProjectsIndex(acc.id))) {
    const walk = async (id, path) => {
      folders++;
      for (const f of await filesIn(client, acc.id, id).catch(() => [])) {
        if (f.type === "folder") continue;
        out.push({ id: f.id, name: f.name, bytes: f.file_size ?? null, path });
      }
      for (const k of await subfolders(acc.id, id)) await walk(k.id, `${path}/${k.name.trim()}`);
    };
    await walk(pr.root_folder_id ?? pr.root_asset_id, pr.name.trim());
    process.stderr.write(`${pr.name.trim()}: ${out.length} files so far, ${folders} folders\n`);
  }
}
const file = join(ROOT, "projects/_frameio/cache/inventory.json");
writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), folders, files: out }, null, 1));
console.log(`${out.length} files in ${folders} folders -> ${file}`);
