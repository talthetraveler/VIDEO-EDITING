import { makeClient, filesIn } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const fs = await filesIn(client, acc.id, process.argv[2]);
for (const f of fs.sort((x,y)=>x.name.localeCompare(y.name))) console.log(f.id, String(((f.file_size??0)/1048576).toFixed(1)).padStart(7)+"MB", (f.created_at||"").slice(0,16), f.type, "|", f.name);
console.log(fs.length, "items");
