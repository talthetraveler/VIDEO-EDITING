#!/usr/bin/env node
/**
 * Reconcile ShortSync post status with Tal's local review state, manifest, and
 * optionally Frame.io.
 *
 * Read-only by default:
 *   node scripts/reconcile-posts.mjs
 *
 * Persist local "published/failed/partial" status:
 *   node scripts/reconcile-posts.mjs --confirm
 *
 * Also move delivered Frame.io finals into POSTED:
 *   node scripts/reconcile-posts.mjs --confirm --move-frameio
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";
import { loadLedger, saveLedger, ROOT } from "./lib/post-ledger.mjs";
import { DELIVERY_PATH, filesIn, makeClient, resolveFolder } from "./lib/frameio-deliver.mjs";

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const opt = (n, d = null) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};

const CONFIRM = has("confirm");
const MOVE_FRAMEIO = has("move-frameio");
const ONLY = opt("only");
const CFG_PATH = join(ROOT, "projects/_publish/shortsync.config.json");
const REVIEW_PATH = join(ROOT, "scratch/batch/review.json");
const DELIVERED_PATH = join(ROOT, "projects/_frameio/delivered.json");

if (!existsSync(CFG_PATH)) {
  console.error(`No ShortSync config at ${CFG_PATH}`);
  process.exit(2);
}
const cfg = JSON.parse(readFileSync(CFG_PATH, "utf8"));
const BASE = (cfg.base_url || "https://api.shortsync.app/v1").replace(/\/$/, "");
if (!cfg.api_key?.startsWith("ss_")) {
  console.error("ShortSync api_key missing/invalid.");
  process.exit(2);
}

const api = async (path) => {
  const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${cfg.api_key}` } });
  const text = await r.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { _raw: text }; }
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status} ${json?.message || text.slice(0, 200)}`);
  return json;
};

const arr = (r) => Array.isArray(r) ? r : r?.data ?? r?.posts ?? [];
const one = (r) => r?.response?.data ?? r?.data ?? r;
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
const terminalPublished = (s) => /^(published|posted|live|success|completed?)$/i.test(String(s || ""));
const terminalFailed = (s) => /^(failed|error|cancelled|canceled|rejected)$/i.test(String(s || ""));
const trackKey = (track) => track === "trial" ? "t" : "m";

function summarize(posts) {
  if (!posts.length) return "unknown";
  const statuses = posts.map((p) => String(p.status || "").toLowerCase());
  if (statuses.every(terminalPublished)) return "published";
  if (statuses.every(terminalFailed)) return "failed";
  if (statuses.some(terminalFailed) && statuses.some(terminalPublished)) return "partial";
  if (statuses.some((s) => s === "scheduled")) return "scheduled";
  return statuses[0] || "submitted";
}

function deliveredFor(entry) {
  if (!existsSync(DELIVERED_PATH)) return null;
  const rows = JSON.parse(readFileSync(DELIVERED_PATH, "utf8"));
  const candidates = rows.filter((r) => {
    const slug = String(r.slug || "");
    const render = String(r.render || "");
    const name = String(r.name || "");
    return slug === entry.project || slug === entry.slug ||
      render.includes(`/projects/${entry.project}/`) || render.includes(`\\projects\\${entry.project}\\`) ||
      norm(name).includes(norm(entry.slug).replace(/-/g, " "));
  });
  candidates.sort((a, b) => Date.parse(b.delivered_at || 0) - Date.parse(a.delivered_at || 0));
  return candidates[0] || null;
}

function updateReview(entries) {
  if (!existsSync(REVIEW_PATH)) return 0;
  const rev = JSON.parse(readFileSync(REVIEW_PATH, "utf8"));
  let changed = 0;
  for (const e of entries) {
    if (!rev[e.slug]) continue;
    const k = trackKey(e.track);
    const next = ["published", "partial", "failed", "scheduled"].includes(e.status) ? e.status : rev[e.slug][k];
    if (next && rev[e.slug][k] !== next) {
      rev[e.slug][k] = next;
      changed++;
    }
    if (e.status === "published") rev[e.slug].status = "published";
  }
  if (changed && CONFIRM) writeFileSync(REVIEW_PATH, JSON.stringify(rev, null, 2), "utf8");
  return changed;
}

function updateManifest(entries) {
  const manifestPath = join(ROOT, "Videos Edited by AI/VIDEO-MANIFEST.json");
  if (!existsSync(manifestPath)) return 0;
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  let changed = 0;
  for (const e of entries.filter((x) => x.status === "published")) {
    const delivered = e.frameio?.file_id ? e.frameio : deliveredFor(e);
    const hit = (m.videos || []).find((v) =>
      v.project === e.project || v.project === e.slug ||
      (delivered?.name && norm(v.filename) === norm(delivered.name)) ||
      (delivered?.render && norm(v.filename) === norm(basename(delivered.render))));
    if (!hit) continue;
    hit.posted = true;
    hit.posted_date = e.published_at || e.updated_at || new Date().toISOString();
    hit.platforms = e.platforms?.length ? e.platforms : hit.platforms;
    hit.shortsync_id = e.post_ids?.join(",");
    changed++;
  }
  if (changed && CONFIRM) {
    m.generated = new Date().toISOString();
    writeFileSync(manifestPath, JSON.stringify(m, null, 2), "utf8");
  }
  return changed;
}

async function moveFrameio(entries) {
  if (!MOVE_FRAMEIO) return { moved: 0, skipped: 0 };
  const published = entries.filter((e) => e.status === "published" && !e.frameio?.posted_folder_id);
  if (!published.length) return { moved: 0, skipped: 0 };

  const client = makeClient();
  const source = await resolveFolder(client, DELIVERY_PATH);
  const posted = await resolveFolder(client, [...DELIVERY_PATH, "POSTED"]);
  const sourceFiles = await filesIn(client, source.accountId, source.folderId);
  let moved = 0;
  let skipped = 0;

  for (const e of published) {
    const delivered = e.frameio?.file_id ? e.frameio : deliveredFor(e);
    const fileId = delivered?.file_id;
    const name = delivered?.name;
    if (!fileId) {
      console.log(`  Frame.io skip ${e.project}: no delivered file recorded`);
      skipped++;
      continue;
    }
    const listed = sourceFiles.find((f) => f.id === fileId || (name && norm(f.name) === norm(name)));
    if (!listed) {
      console.log(`  Frame.io skip ${e.project}: file is not in the approved delivery folder`);
      skipped++;
      continue;
    }
    const live = one(await client.files.show(source.accountId, listed.id));
    const parent = live?.parent_id ?? live?.folder_id ?? null;
    if (parent && parent !== source.folderId) {
      console.log(`  Frame.io skip ${e.project}: parent is not EDITED BY CLAUDE`);
      skipped++;
      continue;
    }
    console.log(`  ${CONFIRM ? "move" : "would move"} ${listed.name} -> ${posted.trail.join(" / ")}`);
    if (CONFIRM) {
      // { data: {...} }, not { body: {...} }: the V4 SDK answers 422 "Unexpected field: body"
      // (measured 2026-10-04 moving the balloon final into STRANGER HELI BALLOON).
      await client.files.move(source.accountId, listed.id, { data: { parent_id: posted.folderId } });
      e.frameio = {
        ...e.frameio,
        file_id: listed.id,
        name: listed.name,
        posted_folder_id: posted.folderId,
        posted_folder_path: posted.trail.join(" / "),
        moved_to_posted_at: new Date().toISOString(),
      };
    }
    moved++;
  }
  return { moved, skipped };
}

const ledger = loadLedger();
let submissions = ledger.submissions;
if (ONLY) submissions = submissions.filter((e) => e.project === ONLY || e.slug === ONLY);
if (!submissions.length) {
  console.log("No ShortSync submissions in projects/_publish/posts-ledger.json yet.");
  process.exit(0);
}

const posts = arr(await api("/posts"));
const byId = new Map(posts.map((p) => [p.id, p]));
const changed = [];

for (const e of submissions) {
  const livePosts = (e.post_ids || []).map((id) => byId.get(id)).filter(Boolean);
  const status = summarize(livePosts);
  const prev = e.status;
  e.posts = livePosts.map((p) => ({
    id: p.id,
    platform: p.platform || p.provider || null,
    status: p.status || null,
    scheduled_for: p.scheduled_for || null,
    published_at: p.published_at || null,
    url: p.platform_url || p.url || null,
  }));
  e.platforms = [...new Set(e.posts.map((p) => p.platform).filter(Boolean).concat(e.platforms || []))];
  e.status = status;
  e.updated_at = new Date().toISOString();
  const pubs = e.posts.map((p) => p.published_at).filter(Boolean).sort();
  if (pubs.length) e.published_at = pubs[pubs.length - 1];
  if (prev !== status) changed.push(e);
}

console.log(`ShortSync reconcile: ${submissions.length} submission(s), ${changed.length} status change(s)`);
for (const e of submissions) {
  console.log(`  ${e.project.padEnd(28)} ${String(e.track).padEnd(5)} ${String(e.status).padEnd(10)} ${e.post_ids?.join(",") || "(no ids)"}`);
}

const reviewChanges = updateReview(submissions);
const manifestChanges = updateManifest(submissions);
const frameio = await moveFrameio(submissions);

if (CONFIRM) {
  saveLedger(ledger);
  // Rebuild manifest so folder-derived stage data stays current after updates.
  spawnSync(process.execPath, [join(ROOT, "scripts/video-manifest.mjs")], { cwd: ROOT, stdio: "ignore" });
}

console.log("");
if (!CONFIRM) {
  console.log("Dry run. Add --confirm to write the ledger/review/manifest updates.");
  if (MOVE_FRAMEIO) console.log("Frame.io was also dry-run; --confirm is required to move files.");
} else {
  console.log(`Wrote ledger. Review changes: ${reviewChanges}. Manifest matches: ${manifestChanges}. Frame.io moved: ${frameio.moved}, skipped: ${frameio.skipped}.`);
}

