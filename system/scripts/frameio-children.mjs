#!/usr/bin/env node
// READ-ONLY. List immediate children of one Frame.io folder id.
import { makeClient } from "./lib/frameio-deliver.mjs";

const folderId = process.argv[2];
if (!folderId) {
  console.error("Usage: node system/scripts/frameio-children.mjs <folderId>");
  process.exit(1);
}

const one = (r) => r?.data ?? r;
const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const client = makeClient();
const account = arr(one(await client.accounts.index()))[0];

const seen = new Map();
for (let page = 1; page <= 20; page++) {
  const batch = arr(one(await client.folders.list(account.id, folderId, { page, page_size: 100 })));
  const before = seen.size;
  for (const item of batch) if (item?.id) seen.set(item.id, item);
  if (batch.length < 100 || seen.size === before) break;
}

for (const item of seen.values()) {
  const kind = item.type || item.kind || item.media_type || "unknown";
  const size = item.file_size ? `${(item.file_size / 1048576).toFixed(1)}MB` : "";
  console.log(`${kind.padEnd(12)} ${item.id}  ${size.padStart(9)}  ${item.name}`);
}
console.log(`\n${seen.size} item(s)`);
