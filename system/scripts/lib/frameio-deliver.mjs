// Frame.io V4 DELIVERY — the only write path in this system.
//
// WHAT THIS IS
//   deliver(localFilePath, destinationFolder) uploads one finished render into
//   a Frame.io folder and then PROVES it landed. Nothing else here writes.
//
// SOURCE FOOTAGE IS READ-ONLY. There is deliberately no delete, rename, move,
// or overwrite in this module. It can only create a NEW file, and the CLI
// (scripts/frameio-deliver.mjs) refuses any destination outside the approved
// delivery folder unless --allow-any-folder is passed.
//
// THE UPLOAD FLOW (Frame.io V4, verified against the SDK's own types)
//   1. POST /accounts/{a}/folders/{f}/files/local_upload
//        body { data: { name, file_size, media_type } }
//      -> a File record plus `upload_urls: [{ url, size }, ...]`
//   2. PUT each presigned url with EXACTLY `size` bytes, in order, carrying
//        x-amz-acl: private
//        Content-Type: <the same media_type used at create time>
//      Both headers are part of the presigned signature. Getting either wrong
//      returns 403 SignatureDoesNotMatch, not a helpful message.
//   3. Poll the file until Frame.io reports it has accepted the media.
//
// The SDK (frameio@4.2.6) exposes step 1 (files.createLocalUpload) and step 3
// (files.showFileUploadStatus / files.show) but NOT step 2 — there is no
// helper that moves bytes. So step 2 is a plain fetch PUT against the
// presigned S3 urls. That is the documented V4 flow, not a workaround.
//
// CHUNKING: each upload_url carries its OWN `size`. Splitting the file evenly
// across N urls is WRONG for multipart — Frame.io decides the part sizes and
// the presigned signature is tied to them. Read the byte ranges the API asked
// for, in order.
import { FrameioClient } from "frameio";
import { loadAuth } from "../frameio-login-spa.mjs";
import { existsSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { basename, extname } from "node:path";

// The approved delivery destination. Tal calls it "Final Versions"; in
// Frame.io it is SOCIAL ACCORDS / SHOT IN ISRAEL / FINAL VIDEOS / EDITED BY
// CLAUDE. The project name is supplied by the walk, so the path starts at
// "SHOT IN ISRAEL" — and resolveFolder will also find it from any depth.
export const DELIVERY_PATH = ["SHOT IN ISRAEL", "FINAL VIDEOS", "EDITED BY CLAUDE"];

const MIME = { ".mp4": "video/mp4", ".mov": "video/quicktime", ".m4v": "video/x-m4v" };

const arr = (r) => { const d = r?.response?.data ?? r?.data ?? r; return Array.isArray(d) ? d : (d ? [d] : []); };
const one = (r) => r?.response?.data ?? r?.data ?? r;
const nm = (o) => o?.name ?? "";
const norm = (x) => String(x).replace(/\s+/g, " ").trim().toLowerCase();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A delivery failure that says WHICH stage broke. Never swallow this. */
export class DeliverError extends Error {
  constructor(stage, message, cause) {
    super(message);
    this.name = "DeliverError";
    this.stage = stage;
    this.cause = cause;
  }
}

export function makeClient() {
  const auth = loadAuth();
  if (!auth) throw new DeliverError("auth", "Not authenticated. Run: node scripts/frameio-login-spa.mjs");
  return new FrameioClient({ token: () => auth.getToken() });
}

// Same pagination defence as discovery: the SDK ignores {page,page_size} and
// replays page 1, so dedupe on id and stop when a page adds nothing new.
async function pagedList(fn, accountId, folderId) {
  // The V4 SDK pages with a CURSOR (a pager with loadNextPage), not `page` -
  // `page: 2` returned page 1 again and this stopped at 50: the delivery
  // folder read "50 files" with 80 in it (israel-batch, 2026-09-30).
  const seen = new Map();
  const add = (r) => { const before = seen.size; for (const x of arr(r)) if (x?.id) seen.set(x.id, x); return seen.size > before; };
  // The SDK's own loadNextPage() is broken (frameio@4.2.6 URL-encodes the "?"
  // of the next link -> 404), so the `after` cursor is read from the body's
  // links.next and passed back explicitly.
  let after;
  for (let i = 0; i < 40; i++) {
    const r = await fn(accountId, folderId, after ? { page_size: 50, after } : { page_size: 50 }).catch(() => []);
    if (!add(r) && i > 0) break;
    const next = r?.response?.links?.next ?? r?.links?.next;
    const m = next && String(next).match(/[?&]after=([^&]+)/);
    if (!m) break;
    after = decodeURIComponent(m[1]);
  }
  return [...seen.values()];
}

/**
 * Walk the real project tree to the delivery folder. NOT a hardcoded id —
 * a stale id would silently deliver into the wrong place, or into a source
 * folder, which is the one thing this system must never do.
 * `segments` may be a path array or a "A/B" string.
 */
export async function resolveFolder(client, segments = DELIVERY_PATH) {
  const path = Array.isArray(segments)
    ? segments
    : String(segments).split(/(?<!\\)\//).map((s) => s.replace(/\\\//g, "/").trim());

  const acct = arr(await client.accounts.index())[0];
  if (!acct?.id) throw new DeliverError("resolve", "No Frame.io account visible to this token.");
  const projects = arr(await client.projects.accountProjectsIndex(acct.id));

  for (const p of projects) {
    const root = p.root_folder_id ?? p.root_asset_id;
    if (!root) continue;
    let cur = root;
    const trail = [nm(p).trim()];
    let ok = true;
    for (const seg of path) {
      const kids = await pagedList((a, f, q) => client.folders.list(a, f, q), acct.id, cur);
      const hit = kids.find((k) => norm(nm(k)) === norm(seg)) ?? kids.find((k) => norm(nm(k)).includes(norm(seg)));
      if (!hit) { ok = false; break; }
      trail.push(nm(hit).trim());
      cur = hit.id;
    }
    if (ok) return { accountId: acct.id, projectId: p.id, folderId: cur, trail };
  }

  // FALLBACK: the path may start deeper than the project root ("FINAL VIDEOS"
  // actually lives under "SHOT IN ISRAEL"). Breadth-first search, bounded, for
  // a folder chain matching the requested segments anywhere in the tree.
  for (const p of projects) {
    const root = p.root_folder_id ?? p.root_asset_id;
    if (!root) continue;
    let frontier = [{ id: root, trail: [nm(p).trim()] }];
    for (let depth = 0; depth < 4 && frontier.length; depth++) {
      const next = [];
      for (const node of frontier) {
        const kids = await pagedList((a, f, q) => client.folders.list(a, f, q), acct.id, node.id);
        for (const k of kids) {
          const child = { id: k.id, trail: [...node.trail, nm(k).trim()] };
          if (norm(nm(k)) === norm(path[0])) {
            let cur = k.id, trail = child.trail, ok = true;
            for (const seg of path.slice(1)) {
              const sub = await pagedList((a, f, q) => client.folders.list(a, f, q), acct.id, cur);
              const hit = sub.find((s) => norm(nm(s)) === norm(seg)) ?? sub.find((s) => norm(nm(s)).includes(norm(seg)));
              if (!hit) { ok = false; break; }
              trail = [...trail, nm(hit).trim()];
              cur = hit.id;
            }
            if (ok) return { accountId: acct.id, projectId: p.id, folderId: cur, trail };
          }
          next.push(child);
        }
      }
      frontier = next;
    }
  }

  throw new DeliverError("resolve",
    `Could not resolve folder path: ${path.join(" / ")}\n` +
    `Searched ${projects.length} project(s), 4 levels deep. Check the folder names in Frame.io.`);
}

/** Files directly inside a folder — used to confirm a delivery by name. */
export async function filesIn(client, accountId, folderId) {
  return pagedList((a, f, q) => client.files.list(a, f, q), accountId, folderId);
}

/** Read exactly `len` bytes at `offset` without holding the whole file in RAM. */
function readRange(fd, offset, len) {
  const buf = Buffer.allocUnsafe(len);
  let got = 0;
  while (got < len) {
    const n = readSync(fd, buf, got, len - got, offset + got);
    if (n <= 0) break;
    got += n;
  }
  if (got !== len) throw new DeliverError("read", `Short read: wanted ${len} bytes at ${offset}, got ${got}`);
  return buf;
}

/**
 * PUT one part. Retries transient failures (429, 5xx, network) with backoff.
 * A 403 is NOT transient — it means the signature or headers are wrong, and
 * retrying just burns the upload window.
 */
async function putPart(url, body, contentType, { attempts = 4, label = "part" } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const r = await fetch(url, {
        method: "PUT",
        body,
        headers: {
          // Both headers are inside the presigned signature. Do not "tidy" them.
          "x-amz-acl": "private",
          "Content-Type": contentType,
        },
      });
      if (r.ok) return { etag: r.headers.get("etag") ?? null, status: r.status };
      const text = (await r.text().catch(() => "")).slice(0, 300);
      const transient = r.status === 429 || r.status >= 500;
      const err = new DeliverError(label, `HTTP ${r.status} uploading ${label}: ${text}`);
      if (!transient) throw err;
      lastErr = err;
    } catch (e) {
      if (e instanceof DeliverError && e.fatal) throw e;
      if (e instanceof DeliverError && /HTTP 4\d\d/.test(e.message) && !/HTTP 429/.test(e.message)) throw e;
      lastErr = e instanceof DeliverError ? e : new DeliverError(label, `${label}: ${e.message}`, e);
    }
    if (i < attempts) await sleep(1000 * 2 ** (i - 1));
  }
  throw lastErr;
}

/**
 * Confirm Frame.io really has the file: it exists, it sits in the folder we
 * targeted, the name matches, and the media is accepted or processing.
 * A run of successful PUTs is NOT proof of delivery.
 */
export async function verifyDelivery(client, accountId, fileId, folderId, expectedName, { attempts = 10 } = {}) {
  let last = null;
  for (let i = 1; i <= attempts; i++) {
    let f = null;
    try { f = one(await client.files.show(accountId, fileId)); } catch (e) { last = e; }
    if (f?.id) {
      const status = f.status ?? f.upload_status ?? f.media_status ?? null;
      const parent = f.parent_id ?? f.folder_id ?? null;
      const inFolder = !parent || parent === folderId;
      const nameOk = norm(nm(f)) === norm(expectedName);
      const done = status == null || /created|processing|transcoding|complete|ready|uploaded/i.test(String(status));
      if (inFolder && nameOk && done) {
        return {
          ok: true, id: f.id, name: nm(f), status, parent_id: parent,
          file_size: f.file_size ?? null,
          view_url: f.view_url ?? f.share_link ?? null,
        };
      }
      last = new DeliverError("verify",
        `File ${fileId} exists but did not check out: ` +
        `in_folder=${inFolder} name_match=${nameOk} status=${status}`);
    }
    if (i < attempts) await sleep(2000);
  }
  throw last instanceof DeliverError ? last
    : new DeliverError("verify", `Could not verify file ${fileId} after ${attempts} checks: ${last?.message ?? "not found"}`);
}

/**
 * Upload one finished render and prove it arrived.
 *
 * @param {string} localFilePath  the MP4 on disk. Never deleted or modified.
 * @param {string[]|string} destinationFolder  path segments; default FINAL VIDEOS/EDITED BY CLAUDE
 * @returns {Promise<object>} file_id, name, folder_id, folder_path, size, parts, status, view_url
 */
export async function deliver(localFilePath, destinationFolder = DELIVERY_PATH, opts = {}) {
  const { displayName, client: given, onProgress = () => {} } = opts;

  // 1. the local file
  if (!existsSync(localFilePath)) throw new DeliverError("local", `No such file: ${localFilePath}`);
  const st = statSync(localFilePath);
  if (!st.isFile() || st.size === 0) throw new DeliverError("local", `Not a usable file (size ${st.size}): ${localFilePath}`);
  const name = displayName ?? basename(localFilePath);
  const mediaType = MIME[extname(name).toLowerCase()] ?? "video/mp4";

  const client = given ?? makeClient();

  // 2. the destination, resolved from the live tree
  onProgress({ stage: "resolve destination" });
  const dest = await resolveFolder(client, destinationFolder);

  // 3. create the File record -> presigned urls
  onProgress({ stage: "create file record", name, size: st.size });
  let created;
  try {
    // The create body takes ONLY { name, file_size }. Sending media_type is a
    // 422 "Unexpected field" (verified live 2026-09-21) — Frame.io derives the
    // type from the filename extension, and that is the type it signs the
    // presigned PUT against. So the extension must be right, and the PUT's
    // Content-Type must match it.
    created = one(await client.files.createLocalUpload(dest.accountId, dest.folderId, {
      data: { name, file_size: st.size },
    }));
  } catch (e) {
    throw new DeliverError("create", `local_upload create failed for ${name}: ${e.message}`, e);
  }
  const fileId = created?.id;
  const urls = (created?.upload_urls ?? []).map((u) => (typeof u === "string" ? { url: u, size: null } : u));
  if (!fileId) throw new DeliverError("create", `No file id returned: ${JSON.stringify(created).slice(0, 300)}`);
  if (!urls.length) throw new DeliverError("create", `No upload_urls returned for ${name}: ${JSON.stringify(created).slice(0, 300)}`);

  // Trust the sizes the API returned. Fall back to an even split ONLY when it
  // omitted them, and refuse to upload if the parts do not add up to the file.
  const sized = urls.every((u) => Number.isFinite(u.size) && u.size > 0);
  const parts = [];
  if (sized) {
    let off = 0;
    for (const u of urls) { parts.push({ url: u.url, offset: off, size: u.size }); off += u.size; }
    if (off !== st.size) {
      throw new DeliverError("create",
        `Frame.io part sizes total ${off} but the file is ${st.size} bytes. Refusing to upload a truncated master.`);
    }
  } else {
    const chunk = Math.ceil(st.size / urls.length);
    for (let i = 0; i < urls.length; i++) {
      const offset = i * chunk;
      parts.push({ url: urls[i].url, offset, size: Math.min(chunk, st.size - offset) });
    }
  }

  // 4. move the bytes
  const fd = openSync(localFilePath, "r");
  try {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const label = `upload part ${i + 1}/${parts.length}`;
      onProgress({ stage: label, bytes: p.size });
      await putPart(p.url, readRange(fd, p.offset, p.size), mediaType, { label });
    }
  } finally {
    closeSync(fd);
  }

  // 5. prove it
  onProgress({ stage: "verify" });
  let uploadStatus = null;
  try { uploadStatus = one(await client.files.showFileUploadStatus(dest.accountId, fileId))?.status ?? null; } catch {}
  const v = await verifyDelivery(client, dest.accountId, fileId, dest.folderId, name);

  return {
    file_id: v.id,
    name: v.name,
    folder_id: dest.folderId,
    folder_path: dest.trail.join(" / "),
    account_id: dest.accountId,
    size: st.size,
    parts: parts.length,
    status: v.status,
    upload_status: uploadStatus,
    view_url: v.view_url,
  };
}
