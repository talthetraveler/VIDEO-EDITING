#!/usr/bin/env node
// FINISH — the last two stages of the pipeline, in the right order:
//
//   render MP4  ->  QA (selfreview gate)  ->  deliver()  ->  verify  ->  done
//
//   node scripts/finish.mjs <slug> [render.mp4]
//   node scripts/finish.mjs <slug> --force-deliver     # deliver despite QA flags
//
// THE GATE IS REAL. selfreview.mjs exits non-zero when it finds a defect, and
// this refuses to upload on a non-zero exit. That is the whole point: Tal
// should be giving creative direction, not doing QA. --force-deliver exists
// only for a flag I have looked at myself and judged cosmetic — and it says so
// loudly in the output so it can never look like a clean pass.
//
// On any failure the local MP4 is kept and the edit is NOT marked delivered.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { deliver, DeliverError, DELIVERY_PATH } from "./lib/frameio-deliver.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const forceDeliver = args.includes("--force-deliver");
const skipQA = args.includes("--skip-qa");
const nameFlag = (() => { const i = args.indexOf("--name"); return i >= 0 ? args[i + 1] : null; })();

if (!slug) {
  console.error("usage: node scripts/finish.mjs <slug> [render.mp4] [--name \"Display.mp4\"] [--force-deliver]");
  process.exit(2);
}

const projDir = join(ROOT, "projects", slug);
const editPath = join(projDir, "edit.json");
if (!existsSync(editPath)) { console.error(`No edit.json at ${editPath}`); process.exit(2); }
const edit = JSON.parse(readFileSync(editPath, "utf8"));

const explicit = args.filter((a) => !a.startsWith("--") && a !== slug && a !== nameFlag)[0];
const mp4 = explicit
  ? (existsSync(explicit) ? explicit : join(projDir, explicit))
  : join(projDir, edit.out ?? `${slug.toUpperCase()}.mp4`);

if (!existsSync(mp4)) { console.error(`No render at ${mp4}. Build it first: node scripts/build-edit.mjs ${slug}`); process.exit(2); }

const mb = (b) => (b / 1048576).toFixed(1) + " MB";
console.log(`\nFINISH  ${slug}  ->  ${basename(mp4)}\n`);

// ---------------------------------------------------------------- 1. QA gate
let qaOk = true;
if (skipQA) {
  console.log("QA SKIPPED (--skip-qa). This render has NOT been checked.\n");
  qaOk = false;
} else {
  const r = spawnSync(process.execPath, [join(ROOT, "scripts/selfreview.mjs"), editPath, mp4],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  process.stdout.write(r.stdout ?? "");
  if (r.stderr) process.stderr.write(r.stderr);
  qaOk = r.status === 0;
}

if (!qaOk && !forceDeliver) {
  console.error("\nQA GATE FAILED — NOT DELIVERED.");
  console.error(`Local file: ${mp4}  (kept)`);
  console.error("Fix the flags above, rebuild, and run finish again.");
  console.error("If a flag is genuinely cosmetic and you have looked at it: --force-deliver");
  process.exit(1);
}
if (!qaOk && forceDeliver) {
  console.log("\n*** QA FLAGGED THIS RENDER AND --force-deliver WAS USED. ***");
  console.log("*** It is being uploaded with known flags. Not a clean pass. ***\n");
}

// --------------------------------------------------------------- 2. deliver
const displayName = nameFlag ?? basename(mp4);
console.log(`DELIVERING  ${displayName}  (${mb(statSync(mp4).size)})`);

try {
  const res = await deliver(mp4, DELIVERY_PATH, {
    displayName,
    onProgress: (p) => console.log(`  … ${p.stage}${p.bytes ? ` (${mb(p.bytes)})` : ""}`),
  });

  console.log("");
  console.log("DELIVERED");
  console.log(`  file      : ${res.name}`);
  console.log(`  file_id   : ${res.file_id}`);
  console.log(`  folder    : ${res.folder_path}`);
  console.log(`  size      : ${mb(res.size)} in ${res.parts} part(s)`);
  console.log(`  status    : ${res.status}`);
  if (res.view_url) console.log(`  url       : ${res.view_url}`);

  // ------------------------------------------------------- 3. mark complete
  const rec = {
    slug, render: mp4, delivered_at: new Date().toISOString(),
    qa_passed: qaOk, forced: !qaOk && forceDeliver, ...res,
  };
  const log = join(ROOT, "projects/_frameio/delivered.json");
  const all = existsSync(log) ? JSON.parse(readFileSync(log, "utf8")) : [];
  all.push(rec);
  mkdirSync(dirname(log), { recursive: true });
  writeFileSync(log, JSON.stringify(all, null, 2), "utf8");
  writeFileSync(join(projDir, "DELIVERED.json"), JSON.stringify(rec, null, 2), "utf8");
  console.log(`\nmarked complete -> projects/${slug}/DELIVERED.json`);
} catch (e) {
  console.error("");
  console.error("RENDER COMPLETE");
  console.error("FRAME.IO UPLOAD FAILED");
  console.error(`Local file: ${mp4}  (kept — nothing was deleted)`);
  console.error(`Stage: ${e instanceof DeliverError ? e.stage : "unknown"}`);
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
