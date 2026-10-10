import { makeClient } from "./lib/frameio-deliver.mjs";
import { writeFileSync, readFileSync } from "node:fs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const dir = "C:/Users/taldo/Downloads/videos to edit/system/projects/_metricool-upload/other";
const idx = JSON.parse(readFileSync(dir + "/index.json", "utf8"));
const lines = [];
for (const f of idx) { const d = one(await client.files.show(acc.id, f.id, { include: "media_links.original" })); lines.push(`o${String(f.n).padStart(2,"0")} ${d.media_links.original.download_url}`); }
writeFileSync(dir + "/orig-urls.txt", lines.join("\n") + "\n");
