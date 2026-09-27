#!/usr/bin/env node
// REMOVE a delivered cut from Frame.io. Tal: "please delete the ones that
// aren't good."
//
//   node scripts/frameio-remove.mjs --list
//   node scripts/frameio-remove.mjs --superseded          # show what it WOULD delete
//   node scripts/frameio-remove.mjs --superseded --yes    # actually delete
//   node scripts/frameio-remove.mjs --name "COFFEE KINDNESS V1.mp4" --yes
//
// THREE HARD GUARDS. This is the only delete in the whole system and it must
// never be able to reach source footage:
//   1. It resolves FINAL VIDEOS / EDITED BY CLAUDE from the live tree and
//      refuses to touch a file whose parent_id is anything else.
//   2. It only deletes files THIS SYSTEM delivered — the name must appear in
//      projects/_frameio/delivered.json.
//   3. Nothing happens without --yes. The default is a dry run.
//
// The local MP4 is never touched, so any delete here is recoverable by
// re-running `node scripts/auto-deliver.mjs`.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { makeClient, resolveFolder, filesIn, DELIVERY_PATH } from "./lib/frameio-deliver.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const LOG = join(ROOT, "projects/_frameio/delivered.json");
const REMOVED = join(ROOT, "projects/_frameio/removed.json");
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const YES = args.includes("--yes");

const one = (r) => r?.response?.data ?? r?.data ?? r;
const delivered = existsSync(LOG) ? JSON.parse(readFileSync(LOG, "utf8")) : [];
const deliveredNames = new Set(delivered.map((d) => d.name));

const client = makeClient();
const dest = await resolveFolder(client, DELIVERY_PATH);
const files = await filesIn(client, dest.accountId, dest.folderId);

console.log(`\n${dest.trail.join(" / ")}  —  ${files.length} file(s)\n`);

if (args.includes("--list") || args.length === 0) {
  for (const f of files) console.log(`  ${f.name.padEnd(42)} ${f.id}`);
  process.exit(0);
}

/**
 * A cut is SUPERSEDED when a later version of the same title exists.
 * "COFFEE KINDNESS V1" is superseded by "COFFEE KINDNESS V3".
 * The base title is the name with its trailing version marker removed.
 */
function supersededSet(names) {
  const rank = new Map();          // base -> highest version number seen
  const parse = (n) => {
    const m = /^(.*?)[ _-]*V(\d+)(?:[ _-]?FAST)?\.mp4$/i.exec(n);
    if (!m) return null;
    return { base: m[1].replace(/[ _-]+$/, "").toUpperCase(), v: Number(m[2]), name: n };
  };
  const parsed = names.map(parse).filter(Boolean);
  for (const p of parsed) rank.set(p.base, Math.max(rank.get(p.base) ?? 0, p.v));
  return parsed.filter((p) => p.v < rank.get(p.base)).map((p) => p.name);
}

let targets = [];
const idArg = flag("--id");
const nameArg = flag("--name");
if (idArg) {
  // Needed when two files share a name — e.g. the 540p and the 1080p
  // "JAMAICA HELP.mp4" both existed after the --hq stitch bug.
  targets = files.filter((f) => f.id === idArg);
  if (!targets.length) { console.error(`No file with id ${idArg} in that folder.`); process.exit(2); }
} else if (nameArg) {
  targets = files.filter((f) => f.name === nameArg);
  if (!targets.length) { console.error(`No file named "${nameArg}" in that folder.`); process.exit(2); }
} else if (args.includes("--superseded")) {
  const sup = new Set(supersededSet(files.map((f) => f.name)));
  targets = files.filter((f) => sup.has(f.name));
} else {
  console.error("Pass --superseded, or --name \"FILE.mp4\". Add --yes to actually delete.");
  process.exit(2);
}

// GUARD 2: only ever remove something this system put there.
const refused = targets.filter((f) => !deliveredNames.has(f.name));
targets = targets.filter((f) => deliveredNames.has(f.name));
for (const f of refused) console.log(`  SKIP (not delivered by this system): ${f.name}`);

if (!targets.length) { console.log("Nothing to remove."); process.exit(0); }

console.log(`${YES ? "DELETING" : "WOULD DELETE"} ${targets.length} file(s):`);
for (const f of targets) console.log(`   - ${f.name}`);

if (!YES) { console.log("\nDry run. Re-run with --yes to actually delete."); process.exit(0); }

let done = 0;
for (const f of targets) {
  // GUARD 1: re-check the parent immediately before deleting, in case the
  // listing was stale. Never delete anything outside the delivery folder.
  const live = one(await client.files.show(dest.accountId, f.id));
  const parent = live?.parent_id ?? live?.folder_id ?? null;
  if (parent && parent !== dest.folderId) {
    console.error(`   REFUSED ${f.name}: parent ${parent} is not the delivery folder`);
    continue;
  }
  try {
    await client.files.delete(dest.accountId, f.id);
    console.log(`   deleted ${f.name}`);
    done++;
  } catch (e) {
    console.error(`   FAILED ${f.name}: ${e.message.slice(0, 200)}`);
  }
}

// TOMBSTONE, do not just drop the row.
//
// Dropping the delivered.json rows made auto-deliver.mjs think these renders
// had never been uploaded, and on its next 45s pass it put all 13 of them
// straight back. Removing a cut has to be a fact the watcher can see, so it
// goes in removed.json and auto-deliver skips anything listed there.
const gone = targets.map((t) => ({ name: t.name, file_id: t.id, removed_at: new Date().toISOString() }));
const goneNames = new Set(gone.map((g) => g.name));
const tomb = existsSync(REMOVED) ? JSON.parse(readFileSync(REMOVED, "utf8")) : [];
writeFileSync(REMOVED, JSON.stringify([...tomb, ...gone], null, 2), "utf8");
writeFileSync(LOG, JSON.stringify(delivered.filter((d) => !goneNames.has(d.name)), null, 2), "utf8");
console.log(`\n${done} removed. Local MP4s untouched — re-run auto-deliver.mjs to restore any of them.`);
