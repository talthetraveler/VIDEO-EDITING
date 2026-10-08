// Remove SUPERSEDED versions from SHOT IN ISRAEL / FINAL VIDEOS / EDITED AI VIDEOS (Tal, 2026-10-08:
// "you have many of the same thing in my frame io, just remove the variations and use the most recent one").
//   node system/scripts/frameio-ai-cleanup.mjs          # dry run: shows what it WOULD delete
//   node system/scripts/frameio-ai-cleanup.mjs --yes    # deletes
// Guards: only this one folder; only a file whose title has a later version in the same folder; logs to removed.json.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { makeClient, resolveFolder, filesIn } from "./lib/frameio-deliver.mjs";
const REMOVED = "C:/Users/taldo/Downloads/videos to edit/system/projects/_frameio/removed.json";
const YES = process.argv.includes("--yes");
const client = makeClient();
const dest = await resolveFolder(client, ["SHOT IN ISRAEL", "FINAL VIDEOS", "EDITED AI VIDEOS"]);
if (!/EDITED AI VIDEOS$/i.test(dest.trail.join(" / "))) { console.error("wrong folder", dest.trail); process.exit(2); }
const files = await filesIn(client, dest.accountId, dest.folderId);
const parse = (n) => { const m = /^(.*?)(?:\s+V(\d+))?\.mp4$/i.exec(n); return m ? { base: m[1].trim().toUpperCase(), v: Number(m[2] ?? 1) } : null; };
const top = new Map();
for (const f of files) { const p = parse(f.name); if (p) top.set(p.base, Math.max(top.get(p.base) ?? 0, p.v)); }
const targets = files.filter((f) => { const p = parse(f.name); return p && p.v < top.get(p.base); });
console.log(`${dest.trail.join(" / ")} — ${files.length} file(s)`);
for (const f of files) console.log(`  ${targets.includes(f) ? "REMOVE" : "keep  "}  ${f.name}`);
if (!YES) { console.log(`\nDry run: ${targets.length} to remove. Add --yes.`); process.exit(0); }
const gone = [];
for (const f of targets) { await client.files.delete(dest.accountId, f.id); console.log("   deleted", f.name); gone.push({ name: f.name, file_id: f.id, removed_at: new Date().toISOString() }); }
const prev = existsSync(REMOVED) ? JSON.parse(readFileSync(REMOVED, "utf8")) : [];
writeFileSync(REMOVED, JSON.stringify([...prev, ...gone], null, 2));
const after = await filesIn(client, dest.accountId, dest.folderId);
console.log(`now ${after.length} file(s)`);
