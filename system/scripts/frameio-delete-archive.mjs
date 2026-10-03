// Delete a "FROM LAPTOP <date>" archive folder from Frame.io (and everything in it).
// Tal, 2026-10-03: "delete in the frame IO, shot in Israel / from laptop, I don't need those."
//
//   node system/scripts/frameio-delete-archive.mjs "FROM LAPTOP 2026-10-03"        # dry run
//   node system/scripts/frameio-delete-archive.mjs "FROM LAPTOP 2026-10-03" --yes
//
// GUARD: refuses any folder whose exact name does not start with "FROM LAPTOP".
// It cannot reach source footage or EDITED BY CLAUDE.
import { makeClient, resolveFolder, filesIn } from "./lib/frameio-deliver.mjs";

const name = process.argv[2];
const YES = process.argv.includes("--yes");
if (!name || !/^FROM LAPTOP /i.test(name)) { console.error('Pass the folder name, e.g. "FROM LAPTOP 2026-10-03".'); process.exit(2); }

const client = makeClient();
const r = await resolveFolder(client, ["SHOT IN ISRAEL", name]);
const leaf = r.trail[r.trail.length - 1];
if (leaf.toUpperCase() !== name.toUpperCase()) { console.error(`REFUSED: resolved to "${r.trail.join(" / ")}", not an exact match.`); process.exit(1); }

const arr = (x) => Array.isArray(x) ? x : (x?.data ?? []);
let files = 0, folders = 0;
async function count(id) {
  files += (await filesIn(client, r.accountId, id)).length;
  const subs = arr(await client.folders.list(r.accountId, id, { page_size: 50 }).catch(() => []));
  for (const s of subs) { folders++; await count(s.id); }
}
await count(r.folderId);
console.log(`${r.trail.join(" / ")}  ->  ${files}+ files in ${folders}+ subfolders (first page per folder)`);
if (!YES) { console.log("Dry run. Add --yes to delete the whole folder."); process.exit(0); }
await client.folders.delete(r.accountId, r.folderId);
console.log("DELETED folder", r.folderId);
