import { makeClient, filesIn } from "./lib/frameio-deliver.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const out = "C:/Users/taldo/Downloads/videos to edit/system/projects/_metricool-upload/other"; mkdirSync(out, { recursive: true });
const fs = (await filesIn(client, acc.id, "a473f7b4-7e2d-4cac-8714-dd36bff3c705")).filter(f => f.type === "file").sort((x,y)=>x.name.localeCompare(y.name));
const idx = [];
let i = 0;
for (const f of fs) { i++;
  const d = one(await client.files.show(acc.id, f.id, { include: "media_links.video_h264_180,media_links.efficient" }));
  const ml = d.media_links ?? {}; const u = (ml.video_h264_180 ?? ml.efficient)?.download_url ?? (ml.video_h264_180 ?? ml.efficient)?.url;
  const b = Buffer.from(await (await fetch(u)).arrayBuffer()); writeFileSync(`${out}/o${String(i).padStart(2,"0")}.mp4`, b);
  idx.push({ n: i, id: f.id, name: f.name, mb: +(f.file_size/1048576).toFixed(1) }); console.log(i, f.name, b.length);
}
writeFileSync(`${out}/index.json`, JSON.stringify(idx, null, 1));
