import { makeClient } from "./lib/frameio-deliver.mjs";
import { writeFileSync } from "node:fs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const d = one(await client.files.show(acc.id, process.argv[2], { include: "media_links.original" }));
writeFileSync(process.argv[3], Buffer.from(await (await fetch(d.media_links.original.download_url)).arrayBuffer()));
console.log("saved", d.name, d.file_size);
