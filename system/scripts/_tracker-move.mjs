// Move Frame.io files into a folder Tal named (2026-10-10: finished videos go to TO POST ON OTHER PLATFORMS,
// then POSTED / Posted to all platforms once live everywhere). Usage: node scripts/_tracker-move.mjs <folderId> <fileId>...
import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const [dest, ...ids] = process.argv.slice(2);
for (const id of ids) {
  try {
    await client.files.move(acc.id, id, { data: { parent_id: dest } });
    const f = one(await client.files.show(acc.id, id));
    console.log(f.parent_id === dest ? "MOVED" : "NOT MOVED", "|", f.name);
  } catch (e) { console.log("FAILED", id, e.message); }
}
