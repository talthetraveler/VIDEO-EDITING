// Rename Frame.io files to their tracker titles (Tal: "u can change all file names in my frame io", 2026-10-10).
// Usage: node scripts/_tracker-rename.mjs <fileId>="New name.ext" ...
import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
for (const pair of process.argv.slice(2)) {
  const i = pair.indexOf("="), id = pair.slice(0, i), name = pair.slice(i + 1);
  try {
    const before = one(await client.files.show(acc.id, id)).name;
    await client.files.update(acc.id, id, { data: { name } });
    const after = one(await client.files.show(acc.id, id)).name;
    console.log(after === name ? "RENAMED" : "NOT RENAMED", "|", before, "->", after);
  } catch (e) { console.log("FAILED", id, e.message); }
}
