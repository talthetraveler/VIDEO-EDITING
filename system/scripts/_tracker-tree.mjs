// Read-only: list FINAL VIDEOS subfolders with file ids, names, sizes, view urls, for the posting tracker.
import { writeFileSync, mkdirSync } from "node:fs";
import { makeClient, filesIn } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const ROOT = "fbfeef86-c1ba-4649-8b93-9ce83df311df";
const out = [];
async function walk(id, path, depth) {
  const items = await filesIn(client, acc.id, id);
  for (const f of items) {
    if (f.type === "folder") { out.push({ kind: "folder", path: path + "/" + f.name, id: f.id }); if (depth < 3) await walk(f.id, path + "/" + f.name, depth + 1); }
    else out.push({ kind: "file", path, id: f.id, name: f.name, mb: +((f.file_size ?? 0) / 1048576).toFixed(1), view_url: f.view_url ?? null, created: (f.created_at || "").slice(0, 10) });
  }
}
await walk(ROOT, "FINAL VIDEOS", 0);
mkdirSync("projects/_metricool-upload/tracker", { recursive: true });
writeFileSync("projects/_metricool-upload/tracker/frameio-tree.json", JSON.stringify(out, null, 1));
const folders = out.filter((x) => x.kind === "folder");
for (const fo of folders) console.log(String(out.filter((x) => x.kind === "file" && x.path === fo.path).length).padStart(4), fo.path, fo.id);
console.log(out.filter((x) => x.kind === "file").length, "files; sample:", JSON.stringify(out.find((x) => x.kind === "file")));
