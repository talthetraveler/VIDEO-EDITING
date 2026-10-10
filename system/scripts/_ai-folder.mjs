// List FINAL VIDEOS and make sure "EDITED AI VIDEOS" exists inside it (creates a folder only; moves nothing).
import { makeClient, resolveFolder } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const d = await resolveFolder(client, ["SHOT IN ISRAEL", "FINAL VIDEOS"]);
console.log("FINAL VIDEOS:", d.trail.join(" / "), d.folderId);
const kids = one(await client.folders.list(d.accountId, d.folderId, { page_size: 100 }));
const list = Array.isArray(kids) ? kids : (kids.data ?? []);
for (const k of list) console.log("   -", k.type ?? "", k.name);
let hit = list.find((k) => /edited ai videos/i.test(k.name ?? ""));
if (!hit && process.argv.includes("--create")) {
  hit = one(await client.folders.create(d.accountId, d.folderId, { data: { name: "EDITED AI VIDEOS" } }));
  console.log("created", hit.id, hit.name);
}
console.log(hit ? "AI folder: " + hit.id : "AI folder missing");
