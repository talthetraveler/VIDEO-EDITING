#!/usr/bin/env node
// DELIVER a finished render to Frame.io.
//
//   node scripts/frameio-deliver.mjs projects/jamaica-bike/JAMAICA_V14.mp4
//   node scripts/frameio-deliver.mjs <file> --name "JAMAICA — BIKE — V14.mp4"
//   node scripts/frameio-deliver.mjs --resolve          # just prove the folder resolves
//
// SAFETY: the destination is locked to FINAL VIDEOS / EDITED BY CLAUDE.
// Passing --folder requires --allow-any-folder as well, so a typo can never
// drop a render into a source-footage folder.
import { deliver, resolveFolder, makeClient, filesIn, DELIVERY_PATH, DeliverError } from "./lib/frameio-deliver.mjs";
import { basename, join } from "node:path";
import { statSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const ROOT_DIR = "C:/Users/taldo/Downloads/videos to edit/system";

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const has = (n) => args.includes(n);

const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--name" && args[args.indexOf(a) - 1] !== "--folder");
const folderArg = flag("--folder");
const mb = (b) => (b / 1048576).toFixed(1) + " MB";

if (folderArg && !has("--allow-any-folder")) {
  console.error("--folder is locked. The delivery destination is FINAL VIDEOS / EDITED BY CLAUDE.");
  console.error("If you really mean another folder, add --allow-any-folder. Never point it at source footage.");
  process.exit(2);
}
const destination = folderArg ?? DELIVERY_PATH;

if (has("--resolve")) {
  const client = makeClient();
  const d = await resolveFolder(client, destination);
  const existing = await filesIn(client, d.accountId, d.folderId);
  console.log(`RESOLVED: ${d.trail.join(" / ")}`);
  console.log(`  folder_id : ${d.folderId}`);
  console.log(`  account_id: ${d.accountId}`);
  console.log(`  contains  : ${existing.length} file(s)`);
  for (const f of existing.slice(0, 20)) console.log(`      - ${f.name}`);
  process.exit(0);
}

if (!file) {
  console.error("usage: node scripts/frameio-deliver.mjs <render.mp4> [--name \"Display Name.mp4\"] [--resolve]");
  process.exit(2);
}

const size = statSync(file).size;
console.log(`DELIVERING  ${basename(file)}  (${mb(size)})`);

try {
  const res = await deliver(file, destination, {
    displayName: flag("--name") ?? undefined,
    onProgress: (p) => console.log(`  … ${p.stage}${p.bytes ? ` (${mb(p.bytes)})` : ""}`),
  });
  // Record it the same way auto-deliver.mjs does. Without this, a file
  // uploaded by hand is invisible to the rest of the system — frameio-remove
  // refused to clean one up because it "was not delivered by this system".
  try {
    const log = join(ROOT_DIR, "projects/_frameio/delivered.json");
    const all = existsSync(log) ? JSON.parse(readFileSync(log, "utf8")) : [];
    all.push({ slug: "(manual)", render: file, render_mtime: statSync(file).mtimeMs,
      delivered_at: new Date().toISOString(), ...res });
    writeFileSync(log, JSON.stringify(all, null, 2), "utf8");
  } catch (e) { console.error(`  (could not update delivered.json: ${e.message})`); }

  console.log("");
  console.log("FRAME.IO UPLOAD OK");
  console.log(`  file      : ${res.name}`);
  console.log(`  file_id   : ${res.file_id}`);
  console.log(`  folder    : ${res.folder_path}`);
  console.log(`  folder_id : ${res.folder_id}`);
  console.log(`  size      : ${mb(res.size)} in ${res.parts} part(s)`);
  console.log(`  status    : ${res.status ?? "(none reported)"}${res.upload_status ? ` / upload ${res.upload_status}` : ""}`);
  if (res.view_url) console.log(`  url       : ${res.view_url}`);
} catch (e) {
  // Never mark an edit delivered on a failure, and never delete the local file.
  console.error("");
  console.error("RENDER COMPLETE");
  console.error("FRAME.IO UPLOAD FAILED");
  console.error(`Local file: ${file}  (kept — nothing was deleted)`);
  console.error(`Stage: ${e instanceof DeliverError ? e.stage : "unknown"}`);
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
