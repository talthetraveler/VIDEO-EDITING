// Read-only: thumbnails for specific Frame.io file ids (posting tracker matching).
import { writeFileSync, mkdirSync } from "node:fs";
import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const dir = "projects/_metricool-upload/tracker/thumbs"; mkdirSync(dir, { recursive: true });
for (const id of process.argv.slice(2)) {
  try {
    const d = one(await client.files.show(acc.id, id, { include: "media_links.thumbnail" }));
    const u = d.media_links?.thumbnail?.url ?? d.media_links?.thumbnail?.download_url;
    const r = u && await fetch(u); if (r?.ok) writeFileSync(`${dir}/${id.slice(0, 8)}.jpg`, Buffer.from(await r.arrayBuffer()));
    console.log(id.slice(0, 8), r?.ok ? "ok" : "no thumb", "|", d.name, "|", d.view_url);
  } catch (e) { console.log(id.slice(0, 8), "FAILED", e.message); }
}
