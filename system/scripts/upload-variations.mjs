#!/usr/bin/env node
// Upload a folder of finished cuts to FINAL VIDEOS / EDITED BY CLAUDE.
//
// Tal, 2026-09-24, on the kindness variations: *"once you're done with that,
// you don't gotta even show it to me, just put it in the frame IO."*
// That authorisation is for THESE files. Everything else still goes to chat
// first (SKILL.md -> DELIVERY).
//
//   node system/scripts/upload-variations.mjs "<folder>"
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { deliver } from "./lib/frameio-deliver.mjs";

const dir = process.argv[2];
if (!dir) { console.error("usage: upload-variations.mjs <folder>"); process.exit(1); }

const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".mp4")).sort();
if (!files.length) { console.error("no mp4 in that folder"); process.exit(1); }

console.log(`${files.length} file(s) -> SHOT IN ISRAEL / FINAL VIDEOS / EDITED BY CLAUDE\n`);
let ok = 0;
for (const f of files) {
  const p = join(dir, f);
  const mb = (statSync(p).size / 2 ** 20).toFixed(1);
  try {
    const r = await deliver(p);
    console.log(`  OK   ${f.padEnd(34)} ${mb}MB  -> ${r?.id ?? r?.file_id ?? "uploaded"}`);
    ok++;
  } catch (e) {
    console.log(`  FAIL ${f.padEnd(34)} ${String(e.message).slice(0, 90)}`);
  }
}
console.log(`\n${ok}/${files.length} delivered.`);
