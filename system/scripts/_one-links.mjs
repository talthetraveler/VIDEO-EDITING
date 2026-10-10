import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const d = one(await client.files.show(acc.id, "46051369-4681-432d-96f3-81187e772f7e", { include: "media_links.original,media_links.high_quality,media_links.efficient" }));
for (const [k, v] of Object.entries(d.media_links ?? {})) console.log(k, JSON.stringify(v).slice(0, 260), "\n");
