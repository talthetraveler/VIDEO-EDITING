// Read-only: walk the Frame.io project tree (folders + files) for the posting tracker.
import { writeFileSync, mkdirSync } from "node:fs";
import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const arr = (r) => { const d = one(r); return Array.isArray(d) ? d : (d?.data ?? []); };
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const PROJECT = "74af6ae5-c17c-461a-9448-bd630af8dbe5";
const proj = one(await client.projects.show(acc.id, PROJECT));
const MAXD = +(process.argv[2] ?? 5);
async function all(fn, id) {
  const seen = new Map(); let after;
  for (let i = 0; i < 40; i++) {
    const r = await fn(acc.id, id, after ? { page_size: 50, after } : { page_size: 50 }).catch(() => null);
    if (!r) break; const n = seen.size; for (const x of arr(r)) if (x?.id) seen.set(x.id, x);
    const next = r?.response?.links?.next ?? r?.links?.next; const m = next && String(next).match(/[?&]after=([^&]+)/);
    if (!m || seen.size === n) break; after = decodeURIComponent(m[1]);
  }
  return [...seen.values()];
}
const out = [];
async function walk(id, path, depth) {
  const kids = await all((x, f, q) => client.folders.list(x, f, q), id);
  const files = kids.filter((k) => k.type === "file"), folders = kids.filter((k) => k.type === "folder");
  // folders.list may return only folders on some SDK builds: fall back to files.list
  const fl = files.length ? files : (await all((x, f, q) => client.files.list(x, f, q), id)).filter((k) => k.type === "file");
  console.log(String(fl.length).padStart(4), path);
  for (const f of fl) out.push({ path, id: f.id, name: f.name, mb: +((f.file_size ?? 0) / 1048576).toFixed(1), view_url: f.view_url ?? null, created: (f.created_at || "").slice(0, 10) });
  if (depth < MAXD) for (const fo of folders) await walk(fo.id, path + " / " + fo.name, depth + 1);
}
await walk(proj.root_folder_id, proj.name ?? "PROJECT", 0);
mkdirSync("projects/_metricool-upload/tracker", { recursive: true });
writeFileSync("projects/_metricool-upload/tracker/frameio-tree.json", JSON.stringify(out, null, 1));
console.log(out.length, "files total");
