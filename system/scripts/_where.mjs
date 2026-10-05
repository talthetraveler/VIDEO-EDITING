import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const P = {"f77f3cb5-3d67-4d41-9106-9b9ccdf3c298":"TRIALS","e1e6103b-b2a3-43bb-9928-7ececbb8c3d9":"OLD - DELETE"};
for (const id of process.argv.slice(2)) { try { const f = one(await client.files.show(acc.id, id)); console.log((P[f.parent_id]??f.parent_id).padEnd(14), f.name); } catch (e) { console.log("GONE/ERR      ", id, String(e?.message).slice(0,80)); } }
