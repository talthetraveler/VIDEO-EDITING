// Remove the three superseded Day 1 rough drafts this session uploaded to FOR MONTANA TO REVIEW, and drop the
// "V4" from the current one. Exact names only; anything else in the folder is left alone.
import { makeClient, resolveFolder, filesIn } from "../../scripts/lib/frameio-deliver.mjs";
const T = "Day 1 Of Asking Homeless People To Hang Out - Brandon (collab with Chris).mp4";
const OLD = [`ROUGH DRAFT - ${T}`, `ROUGH DRAFT V2 - ${T}`, `ROUGH DRAFT V3 - ${T}`];
const one = (r) => r?.data ?? r;
const client = makeClient();
const d = await resolveFolder(client, ["SHOT IN ISRAEL", "FINAL VIDEOS", "FOR MONTANA TO REVIEW"]);
let files = await filesIn(client, d.accountId, d.folderId);
if (!files.some((f) => f.name === `ROUGH DRAFT V4 - ${T}`)) { console.error("V4 is not in the folder - stopping, nothing deleted"); process.exit(1); }
for (const name of OLD) {
  const hits = files.filter((f) => f.name === name);
  if (hits.length !== 1) { console.log(`   skipped (${hits.length} matches): ${name}`); continue; }
  const live = one(await client.files.show(d.accountId, hits[0].id));
  if (live.parent_id !== d.folderId) { console.log(`   skipped (moved): ${name}`); continue; }
  await client.files.delete(d.accountId, hits[0].id);
  console.log(`   deleted ${name}`);
}
try {
  const v4 = files.find((f) => f.name === `ROUGH DRAFT V4 - ${T}`);
  await client.files.update(d.accountId, v4.id, { data: { name: `ROUGH DRAFT - ${T}` } });
  console.log("   renamed V4 -> ROUGH DRAFT - Day 1 ...");
} catch (e) { console.log("   rename failed (left as V4): " + String(e.message).slice(0, 120)); }
files = await filesIn(client, d.accountId, d.folderId);
console.log("FOLDER NOW:"); for (const f of files) console.log("   - " + f.name);
