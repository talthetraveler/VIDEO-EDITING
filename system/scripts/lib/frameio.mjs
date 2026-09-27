// Frame.io V4 API client for the Tal editing system.
//
// AUTH REALITY (verified 2026-09-20 against the live API):
//   Frame.io V4 has NO simple API-key mode. Every endpoint returns
//   401 {"title":"Unauthorized"} identically with or without a header.
//   It requires an Adobe IMS OAuth 2.0 access token, obtained either by
//     (a) Server-to-Server: client_credentials with client_id + client_secret
//         (account must be administered via Adobe Admin Console), or
//     (b) User OAuth: the authorize flow, scopes
//         offline_access openid email profile additional_info.roles
//   A bare 32-hex string is an Adobe *Client ID*, not a token.
//
// CREDENTIALS live in projects/_frameio/credentials.json (gitignored-by-absence;
// this repo is not a git repo). Never hardcode them in a script.
//
// SOURCE FOOTAGE IS READ-ONLY. This client deliberately exposes NO delete,
// rename, move, or overwrite operation against source assets. The only write
// path is uploadToFolder(), and the CLI restricts it to the one approved
// destination folder.
import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
export const FIO_DIR = join(ROOT, "projects/_frameio");
const CRED = join(FIO_DIR, "credentials.json");
const TOKEN_CACHE = join(FIO_DIR, ".token.json");
export const CACHE = join(FIO_DIR, "cache");

const IMS_TOKEN = "https://ims-na1.adobelogin.com/ims/token/v3";
const API = "https://api.frame.io/v4";

// ---------------------------------------------------------------- credentials

export function loadCredentials() {
  if (!existsSync(CRED)) {
    throw new Error(
      `No Frame.io credentials at ${CRED}\n` +
      `Create it with ONE of:\n` +
      `  {"mode":"s2s","client_id":"...","client_secret":"...","scope":"..."}\n` +
      `  {"mode":"token","access_token":"..."}            // short-lived, for testing\n` +
      `  {"mode":"oauth","client_id":"...","client_secret":"...","refresh_token":"..."}`
    );
  }
  return JSON.parse(readFileSync(CRED, "utf8"));
}

/** Returns a bearer token, refreshing and caching as needed. */
export async function getAccessToken() {
  const c = loadCredentials();

  if (c.mode === "token") return c.access_token;

  // reuse a cached token until 60s before expiry
  if (existsSync(TOKEN_CACHE)) {
    const t = JSON.parse(readFileSync(TOKEN_CACHE, "utf8"));
    if (t.expires_at && Date.now() < t.expires_at - 60_000) return t.access_token;
  }

  const body = new URLSearchParams();
  if (c.mode === "s2s") {
    body.set("grant_type", "client_credentials");
    body.set("client_id", c.client_id);
    body.set("client_secret", c.client_secret);
    body.set("scope", c.scope || "openid,AdobeID,additional_info.roles");
  } else if (c.mode === "oauth") {
    body.set("grant_type", "refresh_token");
    body.set("client_id", c.client_id);
    // PUBLIC clients have no secret — sending one makes Adobe reply
    // "unexpected client_secret parameter". Only send it if we actually have one.
    if (c.client_secret && !c.public_client) body.set("client_secret", c.client_secret);
    body.set("refresh_token", c.refresh_token);
  } else {
    throw new Error(`Unknown credential mode: ${c.mode}`);
  }

  const r = await fetch(IMS_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) {
    throw new Error(`IMS token request failed (HTTP ${r.status}): ${JSON.stringify(j)}`);
  }
  mkdirSync(FIO_DIR, { recursive: true });
  writeFileSync(TOKEN_CACHE, JSON.stringify({
    access_token: j.access_token,
    expires_at: Date.now() + (j.expires_in ?? 3600) * 1000,
  }, null, 2));
  return j.access_token;
}

// ------------------------------------------------------------------- requests

async function api(path, opts = {}) {
  const token = await getAccessToken();
  const c = loadCredentials();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...(c.client_id ? { "x-api-key": c.client_id } : {}),
    ...opts.headers,
  };
  const r = await fetch(path.startsWith("http") ? path : `${API}${path}`, { ...opts, headers });
  if (r.status === 401) {
    throw new Error(
      `401 Unauthorized from Frame.io.\n` +
      `The token was rejected. Frame.io V4 needs an Adobe IMS token AND, for most\n` +
      `setups, the x-api-key header set to your Client ID. Check both.`
    );
  }
  if (!r.ok) throw new Error(`Frame.io ${r.status} on ${path}: ${(await r.text()).slice(0, 400)}`);
  return r.json();
}

// --------------------------------------------------------------- read-only ops

export const me = () => api("/me");
export const listAccounts = () => api("/accounts");
export const listWorkspaces = (accountId) => api(`/accounts/${accountId}/workspaces`);
export const listProjects = (accountId, workspaceId) =>
  api(`/accounts/${accountId}/workspaces/${workspaceId}/projects`);

/** Children of a folder. Paginated — returns everything. */
export async function listChildren(accountId, folderId) {
  const out = [];
  let cursor = null;
  do {
    const q = new URLSearchParams({ page_size: "100" });
    if (cursor) q.set("after", cursor);
    const j = await api(`/accounts/${accountId}/folders/${folderId}/children?${q}`);
    out.push(...(j.data ?? []));
    cursor = j.links?.next ? new URL(j.links.next, API).searchParams.get("after") : null;
  } while (cursor);
  return out;
}

export const getAsset = (accountId, fileId) =>
  api(`/accounts/${accountId}/files/${fileId}?include=media_links.original,media_links.high_quality,media_links.efficient,media_links.thumbnail`);

export const getComments = (accountId, fileId) =>
  api(`/accounts/${accountId}/files/${fileId}/comments`);

/**
 * Frame.io auto-generates transcripts (V4). Endpoint shape has moved between
 * releases, so try the known variants and report which worked rather than
 * assuming. Returns null if none are available for this asset.
 */
export async function getTranscript(accountId, fileId) {
  const tries = [
    `/accounts/${accountId}/files/${fileId}/transcript`,
    `/accounts/${accountId}/files/${fileId}/transcription`,
    `/accounts/${accountId}/files/${fileId}?include=transcript`,
  ];
  for (const t of tries) {
    try {
      const j = await api(t);
      if (j && (j.data || j.transcript || j.words || j.segments)) return { endpoint: t, data: j };
    } catch { /* try next */ }
  }
  return null;
}

/**
 * Resolve a human path like
 *   "Social Accords/Assets/Shot in Israel/What Makes You Happy"
 * into a folder id. Case-insensitive, tolerant of ' / ' and ' → ' separators.
 * Reports every candidate when a segment does not match, rather than guessing.
 */
export async function resolvePath(accountId, pathStr, rootFolderId) {
  const segs = pathStr.split(/\s*(?:\/|→|>)\s*/).map((s) => s.trim()).filter(Boolean);
  let current = rootFolderId;
  const trail = [];
  for (const seg of segs) {
    const kids = await listChildren(accountId, current);
    const folders = kids.filter((k) => k.type === "folder" || k.kind === "folder");
    const hit =
      folders.find((f) => f.name?.toLowerCase() === seg.toLowerCase()) ??
      folders.find((f) => f.name?.toLowerCase().includes(seg.toLowerCase()));
    if (!hit) {
      throw new Error(
        `Path segment "${seg}" not found under ${trail.join("/") || "(root)"}.\n` +
        `Available folders here: ${folders.map((f) => f.name).join(" | ") || "(none)"}`
      );
    }
    trail.push(hit.name);
    current = hit.id;
  }
  return { id: current, trail };
}

// ------------------------------------------------------------------ downloads

function pickUrl(asset, quality) {
  const m = asset.media_links ?? asset.data?.media_links ?? {};
  const order = quality === "original"
    ? ["original", "high_quality", "efficient"]
    : ["efficient", "high_quality", "original"];   // proxy-first
  for (const k of order) if (m[k]?.download_url || m[k]?.url) return m[k].download_url ?? m[k].url;
  return null;
}

/**
 * Download an asset. DEFAULTS TO THE PROXY — originals are opt-in, because a
 * shoot is hundreds of GB and Tal explicitly does not want that pulled down
 * for discovery. Caches by asset id; never re-downloads.
 */
export async function download(accountId, fileId, { quality = "proxy", destDir, name } = {}) {
  const asset = await getAsset(accountId, fileId);
  const a = asset.data ?? asset;
  const filename = name ?? `${fileId}__${(a.name ?? "asset").replace(/[^\w.\-]+/g, "_")}`;
  const dir = destDir ?? join(CACHE, quality === "original" ? "originals" : "proxies");
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, filename);

  if (existsSync(dest) && statSync(dest).size > 0) return { path: dest, cached: true, asset: a };

  const url = pickUrl(asset, quality);
  if (!url) throw new Error(`No ${quality} media link on asset ${fileId}. Available: ${Object.keys(a.media_links ?? {}).join(", ") || "none"}`);

  const r = await fetch(url);
  if (!r.ok) throw new Error(`Download failed HTTP ${r.status} for ${fileId}`);
  await pipeline(Readable.fromWeb(r.body), createWriteStream(dest));
  return { path: dest, cached: false, asset: a };
}

// -------------------------------------------------------------------- uploads

/**
 * Upload a finished master. THE ONLY WRITE OPERATION IN THIS CLIENT.
 * Frame.io V4 upload is: create the file record (returns presigned PUT urls)
 * then PUT the bytes. Never call this against a source folder.
 */
export async function uploadToFolder(accountId, folderId, filePath, displayName) {
  const size = statSync(filePath).size;
  const name = displayName ?? basename(filePath);

  const created = await api(`/accounts/${accountId}/folders/${folderId}/files/local_upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { name, file_size: size } }),
  });

  const d = created.data ?? created;
  const urls = d.upload_urls ?? d.upload_url ?? [];
  const list = Array.isArray(urls) ? urls : [urls];
  if (!list.length) throw new Error(`No upload URL returned for ${name}: ${JSON.stringify(created).slice(0, 300)}`);

  const buf = readFileSync(filePath);
  const chunk = Math.ceil(buf.length / list.length);
  for (let i = 0; i < list.length; i++) {
    const part = buf.subarray(i * chunk, Math.min((i + 1) * chunk, buf.length));
    const u = typeof list[i] === "string" ? list[i] : list[i].url;
    const r = await fetch(u, { method: "PUT", body: part, headers: { "Content-Type": "video/mp4" } });
    if (!r.ok) throw new Error(`Chunk ${i + 1}/${list.length} failed HTTP ${r.status}`);
  }
  return { id: d.id, name, size };
}

// ---------------------------------------------------------------------- cache

export function cachePut(key, obj) {
  const f = join(CACHE, "meta", `${key}.json`);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(obj, null, 2), "utf8");
  return f;
}
export function cacheGet(key) {
  const f = join(CACHE, "meta", `${key}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}
