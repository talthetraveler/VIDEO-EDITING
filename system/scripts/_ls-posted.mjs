// List the subfolders of FINAL VIDEOS / POSTED (read-only).
import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const d = one(await client.folders.list(acc.id, "a555fd61-ed24-40e4-8641-89b73aff07f3", { page_size: 50 }));
for (const k of Array.isArray(d) ? d : []) if (k.type === "folder") console.log(k.id, "|", k.name);
