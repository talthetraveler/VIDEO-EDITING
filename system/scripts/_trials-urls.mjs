import { makeClient, filesIn } from "./lib/frameio-deliver.mjs";
import { writeFileSync } from "node:fs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const fs = (await filesIn(client, acc.id, "f77f3cb5-3d67-4d41-9106-9b9ccdf3c298")).filter(f => f.type === "file" && (f.created_at||"") >= "2026-10-03");
const out = [];
for (const f of fs.sort((x,y)=>x.name.localeCompare(y.name))) {
  const d = one(await client.files.show(acc.id, f.id, { include: "media_links.original,media_links.high_quality" }));
  const ml = d.media_links ?? {};
  const u = ml.original?.download_url ?? ml.original?.url ?? ml.high_quality?.download_url ?? null;
  out.push({ id: f.id, name: f.name, mb: +(f.file_size/1048576).toFixed(1), url: u });
  console.log(f.name, "|", u ? u.slice(0, 60) + "… len " + u.length : "NO URL", "| keys", Object.keys(ml).join(","));
}
writeFileSync("C:/Users/taldo/Downloads/videos to edit/system/projects/_frameio/cache/trials-urls.json", JSON.stringify(out, null, 1));
console.log(out.length);
