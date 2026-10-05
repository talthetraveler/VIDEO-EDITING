import { makeClient } from "./lib/frameio-deliver.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const TRIALS = "f77f3cb5-3d67-4d41-9106-9b9ccdf3c298";
const subs = one(await client.folders.list(acc.id, TRIALS)) ?? [];
let old = (Array.isArray(subs) ? subs : [subs]).find(k => k.type === "folder" && k.name === "OLD - DELETE");
if (!old) old = one(await client.folders.create(acc.id, TRIALS, { data: { name: "OLD - DELETE" } }));
console.log("OLD folder", old.id);
const ids = process.argv.slice(2);
for (const id of ids) {
  try { await client.files.move(acc.id, id, { data: { parent_id: old.id } });
    const f = one(await client.files.show(acc.id, id));
    console.log(f.parent_id === old.id ? "MOVED " : "NOT MOVED ", f.name);
  } catch (e) { console.log("FAIL", id, e?.message?.slice(0,200)); }
}
