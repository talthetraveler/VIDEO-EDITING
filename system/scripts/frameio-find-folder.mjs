#!/usr/bin/env node
// READ-ONLY. Find a folder by name anywhere in the tree, PAGING properly.
// folders.list()/files.list() cap at 50 per page — several folders showed
// exactly 50, which means truncation, not a real count.
import { FrameioClient } from "frameio";
import { loadAuth } from "./frameio-login-spa.mjs";
const auth = loadAuth();
const client = new FrameioClient({ token: () => auth.getToken() });
const arr = (r) => { const d = r?.response?.data ?? r?.data ?? r; return Array.isArray(d) ? d : (d ? [d] : []); };
const nm = (o) => (o?.name ?? "?").replace(/\s+/g, " ").trim();
const NEEDLE = (process.argv[2] ?? "edited by claude").toLowerCase();

async function pagedFolders(acct, id) {
  const out = []; 
  for (let page = 1; page <= 20; page++) {
    const r = await client.folders.list(acct, id, { page, page_size: 50 }).catch(() => null);
    const d = arr(r); out.push(...d);
    if (d.length < 50) break;
  }
  return out;
}
const acct = arr(await client.accounts.index())[0];
const projects = arr(await client.projects.accountProjectsIndex(acct.id));
let hits = 0;
async function walk(id, path, depth) {
  if (depth > 5) return;
  const subs = await pagedFolders(acct.id, id);
  for (const s of subs) {
    const p = `${path}/${nm(s)}`;
    if (nm(s).toLowerCase().includes(NEEDLE)) { console.log(`FOUND: ${p}\n  id=${s.id}`); hits++; }
    await walk(s.id, p, depth + 1);
  }
}
for (const p of projects) {
  const root = p.root_folder_id ?? p.root_asset_id;
  if (root) await walk(root, nm(p), 0);
}
console.log(hits ? `\n${hits} match(es)` : `\nNO FOLDER MATCHING "${NEEDLE}"`);
