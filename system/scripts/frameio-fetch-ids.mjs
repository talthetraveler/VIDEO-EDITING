#!/usr/bin/env node
// Download the "efficient" proxy (640x360, H.264 + AAC) for a list of Frame.io
// file ids. READ-ONLY against Frame.io. Resumable: a file already saved is skipped.
//
//   node system/scripts/frameio-fetch-ids.mjs <ids.json> <out dir>
//   ids.json: [{ "id": "...", "name": "..." }, ...]
import { FrameioClient } from "frameio";
import { loadAuth } from "./frameio-login-spa.mjs";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const [idsFile, outDir] = process.argv.slice(2);
const items = JSON.parse(readFileSync(idsFile, "utf8"));
mkdirSync(outDir, { recursive: true });

const auth = loadAuth();
if (!auth) { console.error("Not authenticated."); process.exit(1); }
const client = new FrameioClient({ token: () => auth.getToken() });
const arr = (r) => { const d = r?.response?.data ?? r?.data ?? r; return Array.isArray(d) ? d : (d ? [d] : []); };
const one = (r) => r?.response?.data ?? r?.data ?? r;
const acct = arr(await client.accounts.index())[0];

let ok = 0, skipped = 0, noProxy = 0, failed = 0;
for (const [i, it] of items.entries()) {
  const dest = join(outDir, `${it.id}.mp4`);
  if (existsSync(dest) && statSync(dest).size > 0) { skipped++; continue; }
  try {
    const d = one(await client.files.show(acct.id, it.id, { include: "media_links.efficient" }));
    const url = d?.media_links?.efficient?.download_url ?? d?.media_links?.efficient?.url;
    if (!url) { noProxy++; console.log("no proxy", it.name); continue; }
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    await pipeline(Readable.fromWeb(r.body), createWriteStream(dest + ".part"));
    renameSync(dest + ".part", dest);
    ok++;
  } catch (e) {
    failed++;
    console.log("failed", it.name, String(e.message ?? e).slice(0, 120));
  }
  if ((i + 1) % 25 === 0) console.log(`${i + 1}/${items.length} saved=${ok} skipped=${skipped} noProxy=${noProxy} failed=${failed}`);
}
console.log(`done saved=${ok} skipped=${skipped} noProxy=${noProxy} failed=${failed}`);
