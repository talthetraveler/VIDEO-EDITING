// Read-only: thumbnails + view links for one Frame.io folder, for the posting tracker.
import { writeFileSync, mkdirSync } from "node:fs";
import { makeClient, filesIn } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const dir = "projects/_metricool-upload/tracker/thumbs"; mkdirSync(dir, { recursive: true });
const out = [];
for (const f of (await filesIn(client, acc.id, process.argv[2])).sort((x, y) => x.name.localeCompare(y.name))) {
  const d = one(await client.files.show(acc.id, f.id, { include: "media_links.thumbnail" }));
  const u = d.media_links?.thumbnail?.url ?? d.media_links?.thumbnail?.download_url ?? null;
  let ok = false;
  if (u) { const r = await fetch(u); if (r.ok) { writeFileSync(`${dir}/${f.id.slice(0, 8)}.jpg`, Buffer.from(await r.arrayBuffer())); ok = true; } }
  out.push({ id: f.id, name: f.name, mb: +((f.file_size ?? 0) / 1048576).toFixed(1), created: (f.created_at || "").slice(0, 10), view_url: d.view_url ?? f.view_url ?? null, thumb: ok });
}
writeFileSync(`projects/_metricool-upload/tracker/${process.argv[3]}.json`, JSON.stringify(out, null, 1));
console.log(out.length, "files,", out.filter((x) => x.thumb).length, "thumbs; view_url sample:", out[0]?.view_url);
