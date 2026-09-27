#!/usr/bin/env node
// Walk the Frame.io project tree and print folders (and optionally their files).
//   node scripts/frameio-tree.mjs [--files] [--match FABIAN]
import { makeClient } from "./lib/frameio-deliver.mjs";
const args = process.argv.slice(2);
const SHOW_FILES = args.includes("--files");
const MATCH = (() => { const i = args.indexOf("--match"); return i >= 0 ? args[i + 1].toLowerCase() : null; })();
const one = (r) => r?.data ?? r;
const client = makeClient();

const accounts = one(await client.accounts.index());
for (const acc of (Array.isArray(accounts) ? accounts : [accounts])) {
  const projects = one(await client.projects.accountProjectsIndex(acc.id));
  for (const pr of (Array.isArray(projects) ? projects : [projects])) {
    console.log(`\nPROJECT  ${pr.name}`);
    const seen = new Set();
    const walk = async (folderId, depth, path) => {
      if (depth > 5 || seen.has(folderId)) return;
      seen.add(folderId);
      let kids = [];
      try { kids = one(await client.folders.list(acc.id, folderId)) ?? []; } catch { return; }
      for (const k of (Array.isArray(kids) ? kids : [kids])) {
        const isFolder = k.type === "folder" || k.kind === "folder" || !!k.folder_id === false && !k.media_type;
        const here = `${path}/${k.name}`;
        if (k.type === "folder") {
          const hit = MATCH && k.name.toLowerCase().includes(MATCH);
          console.log(`${"  ".repeat(depth)}[${k.id.slice(0, 8)}] ${k.name}${hit ? "   <-- MATCH" : ""}`);
          await walk(k.id, depth + 1, here);
        } else if (SHOW_FILES) {
          console.log(`${"  ".repeat(depth)}   . ${k.name}  ${k.id}`);
        }
      }
    };
    await walk(pr.root_folder_id ?? pr.root_asset_id, 1, pr.name);
  }
}
