#!/usr/bin/env node
// READ TAL'S FRAME.IO COMMENTS — the feedback loop.
//
//   node scripts/frameio-comments.mjs                 # every delivered cut
//   node scripts/frameio-comments.mjs --since 2h      # only what is new
//   node scripts/frameio-comments.mjs --file <id>
//
// Tal, 2026-09-21: *"put them on Frame.io, that way I can add comments ...
// you can see the timestamp ... and then you can study — that's a skill."*
//
// Frame.io comments carry a TIMESTAMP into the video, so "the caption here is
// wrong" is anchored to the exact frame. This prints
//     VIDEO · 0:47 · "his answer is cut off"
// which maps straight onto a beat in that project's edit.json.
//
// Comments are Tal's words about the work. They are direction, and they get
// appended to LESSONS.md the same turn they are read — that file is the memory
// and it must grow on its own.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { makeClient, filesIn, resolveFolder, DELIVERY_PATH } from "./lib/frameio-deliver.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

const sinceArg = flag("--since");
const sinceMs = sinceArg
  ? Date.now() - (parseFloat(sinceArg) * (/h/i.test(sinceArg) ? 3600e3 : /d/i.test(sinceArg) ? 86400e3 : 60e3))
  : null;

const one = (r) => r?.response?.data ?? r?.data ?? r;
const arr = (r) => { const d = one(r); return Array.isArray(d) ? d : (d ? [d] : []); };
const ts = (s) => {
  if (s == null) return null;
  const t = Math.round(Number(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

const client = makeClient();
const dest = await resolveFolder(client, DELIVERY_PATH);

// The local delivery log tells us which slug produced which file, so a comment
// can be traced back to the edit.json that needs changing.
const logPath = join(ROOT, "projects/_frameio/delivered.json");
const delivered = existsSync(logPath) ? JSON.parse(readFileSync(logPath, "utf8")) : [];
const slugFor = (fileId) => delivered.find((d) => d.file_id === fileId)?.slug ?? "?";

const only = flag("--file");
const files = only
  ? [{ id: only, name: "(by id)" }]
  : await filesIn(client, dest.accountId, dest.folderId);

console.log(`\nCOMMENTS on ${dest.trail.join(" / ")}  —  ${files.length} file(s)` +
  (sinceArg ? `, newer than ${sinceArg}` : "") + "\n");

let total = 0;
for (const f of files) {
  let cs = [];
  try { cs = arr(await client.comments.list(dest.accountId, f.id, { page: 1, page_size: 50 })); }
  catch (e) { console.log(`  ! ${f.name}: could not read comments (${e.message.slice(0, 120)})`); continue; }

  const fresh = cs.filter((c) => !sinceMs || new Date(c.inserted_at ?? c.created_at ?? 0).getTime() >= sinceMs);
  if (!fresh.length) continue;

  console.log(`${f.name}   [slug: ${slugFor(f.id)}]   file_id ${f.id}`);
  for (const c of fresh) {
    const at = ts(c.timestamp ?? c.frame_timestamp ?? null);
    const who = c.owner?.name ?? c.author?.name ?? "";
    console.log(`   ${at ? `· ${at.padStart(5)} ` : "·       "} ${JSON.stringify(c.text ?? "")}${who ? `   — ${who}` : ""}`);
    total++;
  }
  console.log("");
}

if (!total) console.log("(no comments yet)");
else console.log(`${total} comment(s). Each one that is a correction goes into LESSONS.md NOW, not later.`);
