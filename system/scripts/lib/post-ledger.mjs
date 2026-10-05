import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
export const LEDGER_PATH = join(ROOT, "projects/_publish/posts-ledger.json");

export function nowIso() {
  return new Date().toISOString();
}

export function loadLedger() {
  if (!existsSync(LEDGER_PATH)) {
    return { schema: 1, updated_at: nowIso(), submissions: [] };
  }
  const raw = JSON.parse(readFileSync(LEDGER_PATH, "utf8"));
  return {
    schema: raw.schema ?? 1,
    updated_at: raw.updated_at ?? null,
    submissions: Array.isArray(raw.submissions) ? raw.submissions : [],
  };
}

export function saveLedger(ledger) {
  mkdirSync(dirname(LEDGER_PATH), { recursive: true });
  ledger.schema = 1;
  ledger.updated_at = nowIso();
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), "utf8");
}

export function projectIdentity(project, explicitTrack = null) {
  const p = String(project || "").trim();
  const m = p.match(/^(.*?)-([ab])$/i);
  const track = explicitTrack || (m ? (m[2].toLowerCase() === "b" ? "trial" : "main") : "main");
  return {
    project: p,
    slug: m ? m[1] : p,
    track,
  };
}

export function recordSubmission(entry) {
  const ledger = loadLedger();
  const postIds = [...new Set((entry.post_ids || []).filter(Boolean))];
  const ident = projectIdentity(entry.project, entry.track);
  const full = {
    id: entry.id || `${ident.project}:${postIds.join(",") || nowIso()}`,
    ...ident,
    source: entry.source || "unknown",
    status: entry.status || "submitted",
    mode: entry.mode || null,
    scheduled_for: entry.scheduled_for || null,
    submitted_at: entry.submitted_at || nowIso(),
    caption: entry.caption || "",
    platforms: entry.platforms || [],
    post_ids: postIds,
    posts: entry.posts || [],
    shortsync: entry.shortsync || {},
    frameio: entry.frameio || {},
  };

  const sameIds = (a, b) => {
    const as = [...new Set(a || [])].sort().join(",");
    const bs = [...new Set(b || [])].sort().join(",");
    return as && as === bs;
  };
  const idx = ledger.submissions.findIndex((r) =>
    sameIds(r.post_ids, full.post_ids) ||
    (r.project === full.project && r.track === full.track && r.submitted_at === full.submitted_at));
  if (idx >= 0) {
    ledger.submissions[idx] = { ...ledger.submissions[idx], ...full };
  } else {
    ledger.submissions.push(full);
  }
  saveLedger(ledger);
  return full;
}

export function updateSubmission(id, patch) {
  const ledger = loadLedger();
  const idx = ledger.submissions.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  ledger.submissions[idx] = { ...ledger.submissions[idx], ...patch };
  saveLedger(ledger);
  return ledger.submissions[idx];
}

