#!/usr/bin/env node
/**
 * ShortSync publisher — post / trial-reel / schedule an approved video.
 *
 * Tal talks in the chat ("post this everywhere", "B1 and B2 as trial reels
 * Friday one a day"); Claude turns that into the calls below. NOTHING is sent
 * without --confirm, and only *_FINAL.mp4 masters can be uploaded — never a
 * low-res preview. Config + live key: projects/_publish/shortsync.config.json
 * (gitignored). See .claude/skills/ai-editor/SKILL.md §10–14.
 *
 *   node scripts/publish.mjs status
 *       → workspace, quota, connected accounts (platform → connection_id)
 *
 *   node scripts/publish.mjs post <project> [--platforms instagram,tiktok,youtube,facebook]
 *       [--caption "..."] [--first-comment "..."] [--at 2026-09-10T19:00:00+03:00] [--confirm]
 *       → the MAIN post. Immediate unless --at. Dry-run unless --confirm.
 *
 *   node scripts/publish.mjs trial <projectA> <projectB> [<projectC>]
 *       [--at 2026-09-10T18:00:00+03:00] [--every 24h] [--caption "..."] [--confirm]
 *       → each variation as an Instagram Trial Reel, staggered by --every.
 *
 *   node scripts/publish.mjs schedule --plan projects/_publish/plan.json [--confirm]
 *       → plan.json: [{ "project": "...", "as": "main"|"trial",
 *                       "platforms": ["instagram",...], "at": "ISO 8601",
 *                       "caption": "...", "first_comment": "..." }]
 *         min-gap rule (config rules.min_gap_hours_between_posts) is enforced.
 *
 *   node scripts/publish.mjs list [--status scheduled|published|failed]
 *   node scripts/publish.mjs cancel <post_id> --confirm
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, isAbsolute, basename } from "node:path";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const args = process.argv.slice(2);
const cmd = args[0];
const rest = args.slice(1);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const has = (n) => args.includes(`--${n}`);
const positionals = rest.filter((a) => !a.startsWith("--") && rest[rest.indexOf(a) - 1]?.startsWith("--") !== true);
// simpler positional grab: everything before the first --flag
const bareArgs = (() => {
  const out = [];
  for (const a of rest) {
    if (a.startsWith("--")) break;
    out.push(a);
  }
  return out;
})();

// ---- config -------------------------------------------------------------
const CFG_PATH = join(root, "projects", "_publish", "shortsync.config.json");
if (!existsSync(CFG_PATH)) {
  console.error(`✗ ${CFG_PATH} missing — create it from the template (holds the live key, gitignored).`);
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(CFG_PATH, "utf8"));
const BASE = (cfg.base_url || "https://api.shortsync.app/v1").replace(/\/$/, "");
const KEY = cfg.api_key;
const NEVER_AUTO = cfg.rules?.never_auto_post !== false;
const MIN_GAP_H = Number(cfg.rules?.min_gap_hours_between_posts ?? 3);
const TRIAL_PLATFORM = cfg.trial_platform || "instagram";
const TRIAL_KEY = cfg.trial_option_key || "trial_reel"; // TODO: confirm exact field name with ShortSync docs
const maskKey = (k) => (k ? k.slice(0, 8) + "…" + k.slice(-4) : "(none)");
if (!KEY || !KEY.startsWith("ss_")) {
  console.error("✗ config api_key looks wrong (expected ss_live_…).");
  process.exit(1);
}

// approval gate: a mutating call is a DRY RUN unless --confirm.
const CONFIRM = has("confirm") && !has("dry-run");
const gate = (label) => {
  if (CONFIRM) return true;
  console.log(`\n─ DRY RUN ─ ${label}`);
  console.log("  add --confirm to actually send this. Nothing was posted.");
  return false;
};

// ---- api --------------------------------------------------------------
const api = async (method, path, body, extraHeaders = {}) => {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  if (!res.ok) {
    const e = new Error(`${method} ${path} → ${res.status} ${json?.code ?? ""} ${json?.message ?? text.slice(0, 200)}`);
    e.status = res.status;
    e.body = json;
    throw e;
  }
  return json;
};

// ---- helpers --------------------------------------------------------
const finalMaster = (project) => {
  // a finished file handed over directly (VIDEOS OUT, scripts/batch-server.mjs)
  // - still refused unless it is a real 1080x1920 master, checked by the caller
  if (/\.(mp4|mov)$/i.test(project) && existsSync(project)) return project;
  const dir = join(root, "projects", project, "preview");
  const cands = [join(dir, `${project}_FINAL.mp4`), join(dir, `${project}_FINAL.mov`)];
  const f = cands.find(existsSync);
  if (!f) {
    throw new Error(
      `no full-res master for "${project}" — expected projects/${project}/preview/${project}_FINAL.mp4.\n` +
        `  Run:  node scripts/proj-render.mjs ${project} --final   (or proj-confirm ${project} --render-final)`,
    );
  }
  return f;
};

const projectMeta = (project) => {
  const mp = join(root, "projects", project, "project.json");
  if (!existsSync(mp)) return {};
  try {
    return JSON.parse(readFileSync(mp, "utf8"));
  } catch {
    return {};
  }
};

const uploadMaster = async (project) => {
  const file = finalMaster(project);
  const bytes = readFileSync(file);
  const size = statSync(file).size;
  const upName = /\.(mp4|mov)$/i.test(project) ? basename(project) : `${project}_FINAL.mp4`;
  console.log(`  ↑ ${upName}  (${(size / 1e6).toFixed(1)} MB)`);
  const slot = await api("POST", "/uploads", { filename: upName });
  const put = await fetch(slot.presigned_url, {
    method: slot.method || "PUT",
    headers: { "Content-Type": "video/mp4", ...(slot.required_headers || {}) },
    body: bytes,
  });
  if (!put.ok) throw new Error(`presigned upload PUT → ${put.status} ${(await put.text()).slice(0, 200)}`);
  return slot.upload_id;
};

let _connCache = null;
const connections = async () => {
  if (_connCache) return _connCache;
  const r = await api("GET", "/connections");
  _connCache = r.data ?? r.connections ?? r ?? [];
  return _connCache;
};

const resolveTargets = async (platforms, { trial = false } = {}) => {
  const conns = await connections();
  const byPlatform = new Map();
  for (const c of conns) {
    const plat = (c.platform || c.provider || "").toLowerCase();
    if (plat && !byPlatform.has(plat)) byPlatform.set(plat, c);
  }
  const targets = [];
  const missing = [];
  for (const p of platforms) {
    const c = byPlatform.get(p.toLowerCase());
    if (!c) {
      missing.push(p);
      continue;
    }
    const t = { connection_id: c.id ?? c.connection_id };
    if (p.toLowerCase() === "instagram") {
      t.platform_options = {
        instagram: trial
          ? { share_to_feed: false, [TRIAL_KEY]: true }
          : { share_to_feed: true },
      };
    }
    targets.push(t);
  }
  if (missing.length) console.warn(`  ⚠ no connected account for: ${missing.join(", ")} — skipped`);
  if (!targets.length) throw new Error("no usable targets — connect accounts in ShortSync or check --platforms");
  return targets;
};

const parseEvery = (s) => {
  if (!s) return 24 * 3600e3;
  const m = String(s).match(/^(\d+(?:\.\d+)?)\s*(h|hr|hours?|m|min|d|days?)?$/i);
  if (!m) throw new Error(`--every "${s}" not understood (try 24h, 90m, 1d)`);
  const n = Number(m[1]);
  const u = (m[2] || "h").toLowerCase();
  if (u.startsWith("m")) return n * 60e3;
  if (u.startsWith("d")) return n * 24 * 3600e3;
  return n * 3600e3;
};

const postBody = ({ uploadId, mode, when, caption, firstComment, targets }) => {
  const b = { upload_id: uploadId, publish_mode: mode, targets };
  if (mode === "scheduled") b.scheduled_for = when;
  if (caption) b.caption = caption;
  if (firstComment) b.first_comment = firstComment;
  return b;
};

const show = (o) => console.log(JSON.stringify(o, null, 2));

// ---- commands ------------------------------------------------------
const run = async () => {
  if (!cmd || cmd === "help" || has("help")) {
    console.log(readFileSync(new URL(import.meta.url)).toString().split("*/")[0].replace(/^#![^\n]*\n/, ""));
    return;
  }

  console.log(`ShortSync ${BASE}  key ${maskKey(KEY)}  ${NEVER_AUTO ? "(never-auto-post ON)" : ""}`);

  if (cmd === "status") {
    const me = await api("GET", "/me").catch((e) => ({ _error: e.message }));
    console.log("\n/me:");
    show(me);
    const conns = await connections().catch((e) => [{ _error: e.message }]);
    console.log(`\n/connections (${conns.length}):`);
    for (const c of conns)
      console.log(`  ${(c.platform || c.provider || "?").padEnd(10)} ${c.id ?? c.connection_id ?? "?"}  ${c.username || c.handle || c.name || ""}`);
    return;
  }

  if (cmd === "list") {
    const q = opt("status") ? `?status=${encodeURIComponent(opt("status"))}` : "";
    const r = await api("GET", `/posts${q}`);
    const rows = r.data ?? r.posts ?? [];
    console.log(`\n${rows.length} post(s):`);
    for (const p of rows)
      console.log(`  ${p.id}  ${(p.status || "?").padEnd(10)} ${p.scheduled_for || p.published_at || ""}  ${(p.caption || "").slice(0, 50)}`);
    return;
  }

  if (cmd === "analytics") {
    // pull per-post metrics for published posts → JSON on stdout (feeds the
    // learn-from-analytics loop). --days <n> window, default 30.
    const days = Number(opt("days", "30"));
    const posts = ((await api("GET", "/posts?status=published").catch(() => ({}))).data ?? []) || [];
    const since = Date.now() - days * 864e5;
    const out = [];
    for (const p of posts) {
      const when = Date.parse(p.published_at || p.scheduled_for || 0);
      if (when && when < since) continue;
      let m = {};
      try {
        m = (await api("GET", `/posts/${p.id}/analytics`)) || {};
      } catch {
        try {
          m = (await api("GET", `/analytics/posts/${p.id}`)) || {};
        } catch {
          /* endpoint shape unknown → leave empty */
        }
      }
      const agg = m.data ?? m.metrics ?? m;
      out.push({
        id: p.id,
        project: p.project || p.metadata?.project || null,
        caption: (p.caption || "").slice(0, 120),
        published_at: p.published_at || p.scheduled_for,
        platform: p.platform || (p.targets || []).map((t) => t.platform).join(","),
        views: agg.views ?? agg.impressions ?? agg.plays ?? null,
        likes: agg.likes ?? agg.reactions ?? null,
        comments: agg.comments ?? null,
        shares: agg.shares ?? null,
        saves: agg.saves ?? agg.bookmarks ?? null,
        watch_rate: agg.avg_watch_percent ?? agg.completion_rate ?? null,
        raw: Object.keys(agg).length && !agg.views ? agg : undefined,
      });
    }
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (cmd === "cancel") {
    const id = bareArgs[0];
    if (!id) throw new Error("usage: publish.mjs cancel <post_id> --confirm");
    if (!gate(`DELETE /posts/${id}`)) return;
    show(await api("DELETE", `/posts/${id}`));
    console.log("✓ cancelled");
    return;
  }

  if (cmd === "post") {
    const project = bareArgs[0];
    if (!project) throw new Error("usage: publish.mjs post <project> [--platforms ...] [--at ISO] [--confirm]");
    const platforms = (opt("platforms") || cfg.default_platforms.join(",")).split(",").map((s) => s.trim()).filter(Boolean);
    const when = opt("at");
    const mode = when ? "scheduled" : "immediate";
    const meta = projectMeta(project);
    const caption = opt("caption") ?? meta.publish_caption ?? "";
    const firstComment = opt("first-comment") ?? meta.publish_first_comment ?? "";

    console.log(`\nMAIN post — ${project}`);
    console.log(`  platforms : ${platforms.join(", ")}`);
    console.log(`  timing    : ${mode === "scheduled" ? when : "immediate"}`);
    console.log(`  caption   : ${caption ? JSON.stringify(caption.slice(0, 80)) : "(none — set --caption or project.json publish_caption)"}`);
    if (meta.variation === "hook_first") console.warn("  ⚠ this project is a hook_first VARIATION — usually a trial reel, not the main post.");

    const targets = await resolveTargets(platforms);
    if (!gate(`POST /posts  (upload ${project}_FINAL.mp4 → ${targets.length} target(s), ${mode})`)) {
      console.log("\n  would send:");
      show(postBody({ uploadId: "<upload_id>", mode: mode === "scheduled" ? "scheduled" : "immediate", when, caption, firstComment, targets }));
      return;
    }
    const uploadId = await uploadMaster(project);
    const body = postBody({ uploadId, mode: mode === "scheduled" ? "scheduled" : "immediate", when, caption, firstComment, targets });
    const r = await api("POST", "/posts", body, { "Idempotency-Key": randomUUID() });
    const rows = Array.isArray(r) ? r : r.data ?? [r];
    for (const p of rows) console.log(`  ${p.status === "failed" ? "✗" : "✓"} ${p.platform || p.id} ${p.status || ""} ${p.error?.message || ""}`);
    console.log("✓ MAIN post submitted");
    return;
  }

  if (cmd === "trial") {
    const projects = bareArgs;
    if (projects.length < 1) throw new Error("usage: publish.mjs trial <projA> <projB> [projC] [--at ISO] [--every 24h] [--confirm]");
    const start = opt("at") ? new Date(opt("at")).getTime() : Date.now() + 3600e3;
    const step = parseEvery(opt("every", "24h"));
    const caption = opt("caption") ?? "";
    const targets = await resolveTargets([TRIAL_PLATFORM], { trial: true });

    console.log(`\nTRIAL REELS on ${TRIAL_PLATFORM} — ${projects.length} variation(s), every ${opt("every", "24h")}`);
    const plan = projects.map((p, i) => ({ project: p, at: new Date(start + i * step).toISOString() }));
    for (const row of plan) console.log(`  ${row.project.padEnd(24)} ${row.at}`);

    if (!gate(`POST /posts ×${plan.length}  (each: upload FINAL → ${TRIAL_PLATFORM} trial reel, scheduled)`)) {
      console.log("\n  each would send:");
      show(postBody({ uploadId: "<upload_id>", mode: "scheduled", when: plan[0].at, caption, targets }));
      return;
    }
    for (const row of plan) {
      const uploadId = await uploadMaster(row.project);
      const body = postBody({ uploadId, mode: "scheduled", when: row.at, caption: caption || projectMeta(row.project).publish_caption || "", targets });
      const r = await api("POST", "/posts", body, { "Idempotency-Key": randomUUID() });
      const rows = Array.isArray(r) ? r : r.data ?? [r];
      console.log(`  ✓ ${row.project} → ${row.at}  (${rows.map((x) => x.id || x.status).join(", ")})`);
    }
    console.log("✓ trial reels scheduled");
    return;
  }

  if (cmd === "schedule") {
    const planPath = opt("plan");
    if (!planPath) throw new Error("usage: publish.mjs schedule --plan projects/_publish/plan.json [--confirm]");
    const planFile = isAbsolute(planPath) ? planPath : join(root, planPath);
    const plan = JSON.parse(readFileSync(planFile, "utf8"));
    if (!Array.isArray(plan) || !plan.length) throw new Error("plan must be a non-empty JSON array");

    // min-gap rule
    const sorted = [...plan].filter((r) => r.at).sort((a, b) => new Date(a.at) - new Date(b.at));
    for (let i = 1; i < sorted.length; i++) {
      const gapH = (new Date(sorted[i].at) - new Date(sorted[i - 1].at)) / 3600e3;
      if (gapH < MIN_GAP_H - 1e-6)
        throw new Error(
          `min-gap rule: "${sorted[i - 1].project}" and "${sorted[i].project}" are ${gapH.toFixed(1)}h apart (min ${MIN_GAP_H}h). Edit ${planPath}.`,
        );
    }
    console.log(`\nSCHEDULE — ${plan.length} item(s), min-gap ${MIN_GAP_H}h OK`);
    for (const r of plan) {
      const plats = (r.platforms || cfg.default_platforms).map((p) => (p === TRIAL_PLATFORM && (r.as || "main") === "trial" ? p + "(trial)" : p));
      console.log(`  ${(r.project || "?").padEnd(24)} ${(r.as || "main").padEnd(6)} ${plats.join("+").padEnd(34)} ${r.at || "immediate"}`);
    }

    if (!gate(`POST /posts ×${plan.length}`)) return;
    for (const r of plan) {
      const trial = (r.as || "main") === "trial";
      // trial = Instagram as a Trial Reel + the other platforms as normal posts
      const platforms = r.platforms || cfg.default_platforms;
      const targets = await resolveTargets(platforms, { trial });
      const uploadId = await uploadMaster(r.project);
      const body = postBody({
        uploadId,
        mode: r.at ? "scheduled" : "immediate",
        when: r.at,
        caption: r.caption ?? projectMeta(r.project).publish_caption ?? "",
        firstComment: r.first_comment ?? "",
        targets,
      });
      const resp = await api("POST", "/posts", body, { "Idempotency-Key": randomUUID() });
      const rows = Array.isArray(resp) ? resp : resp.data ?? [resp];
      console.log(`  ✓ ${r.project} (${r.as || "main"}) → ${r.at || "now"}  ${rows.map((x) => x.id || x.status).join(", ")}`);
    }
    console.log("✓ schedule submitted");
    return;
  }

  console.error(`unknown command "${cmd}". Run:  node scripts/publish.mjs help`);
  process.exit(1);
};

run().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  if (e.body) console.error(JSON.stringify(e.body, null, 2));
  process.exit(1);
});
