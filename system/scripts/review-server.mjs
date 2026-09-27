#!/usr/bin/env node
/**
 * Local reel review + publish dashboard.  node scripts/review-server.mjs → :4100
 *
 * REVIEW tab: watch each pair (main + trial). Per video:
 *   Post main  → schedules main to all platforms, next free 09:00 (Israel)
 *   Post trial → schedules trial (IG trial reel + all), next free 20:00
 *   Post both  → both on the same day
 *   Changes    → save a note, stays in Review
 *   Reject     → drops it
 * On a Post action the card moves to the PUBLISHED tab.
 *
 * PUBLISHED tab: live from the ShortSync API (GET /posts) — scheduled / published
 * / failed, with the platform links.
 *
 * A file scratch/batch/HOLD blocks the auto path; explicit Post buttons here are
 * a human click = consent, so they post regardless.
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, statSync, createReadStream, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { warmup, renderLive, shutdownLive, isWarm, projectToData } from "./lib/live-render.mjs";

const ROOT = process.cwd();
const B = join(ROOT, "scratch", "batch");
const PREV = join(B, "previews");
const PORT = 4100;
const TZ = "+03:00";
const MORNING = "09:00:00";
const EVENING = "20:00:00";
const PLATFORMS = ["instagram", "tiktok", "youtube", "facebook", "threads", "twitter", "bluesky", "pinterest", "snapchat", "mastodon"];
const CFG = JSON.parse(readFileSync(join(ROOT, "projects", "_publish", "shortsync.config.json"), "utf8"));

const loadQueue = () => JSON.parse(readFileSync(join(B, "queue.json"), "utf8"));
const revPath = join(B, "review.json");
const loadRev = () => (existsSync(revPath) ? JSON.parse(readFileSync(revPath, "utf8")) : {});
const saveRev = (r) => writeFileSync(revPath, JSON.stringify(r, null, 2));
// per-track (main = .m, trial = .t) status: "pending"|"scheduling"|"scheduled"|"error".
// whole-video .status still carries "editing"|"changes_requested"|"rejected".
const migrate = (r) => {
  let touched = false;
  for (const k of Object.keys(r)) {
    const e = r[k];
    if (e && e.m === undefined) {
      const sc = e.scope || "main";
      const done = e.status === "scheduled" || e.status === "published";
      const doneSt = e.status === "published" ? "scheduled" : e.status;
      e.m = sc === "trial" ? "pending" : done || e.status === "scheduling" || e.status === "error" ? doneSt || e.status : "pending";
      e.t = sc === "main" ? "pending" : done || e.status === "scheduling" || e.status === "error" ? doneSt || e.status : "pending";
      touched = true;
    }
  }
  return touched;
};
let rev = loadRev();
if (!rev["v01-priest"]) rev["v01-priest"] = { m: "scheduled", t: "scheduled", day: 1, status: "published" };
if (migrate(rev)) saveRev(rev);
saveRev(rev);

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};
const dateForDay = (day) => {
  const d = new Date(tomorrow() + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + (day - 1));
  return d.toISOString().slice(0, 10);
};
const nextFreeDay = () => {
  rev = loadRev();
  const used = Object.values(rev)
    .filter((v) => v.day && (["scheduled", "scheduling", "published"].includes(v.m) || ["scheduled", "scheduling", "published"].includes(v.t)))
    .map((v) => v.day);
  let d = 1;
  while (used.includes(d)) d++;
  return d;
};
const hookLineOf = (slug) => {
  try {
    return JSON.parse(readFileSync(join(B, "state.json"), "utf8")).plan.find((p) => p.slug === slug)?.hook_line || null;
  } catch {
    return null;
  }
};
const preview = (slug, v) => (existsSync(join(PREV, `${slug}-${v}.mp4`)) ? `/media/${slug}-${v}.mp4` : null);

// live render progress (0-100) written by proj-render.mjs / live-render.mjs
const renderPct = (slug, v) => {
  const f = join(ROOT, "projects", `${slug}-${v}`, "preview", ".progress");
  if (!existsSync(f)) return null;
  const n = parseInt(readFileSync(f, "utf8").trim(), 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
};

const stageOf = (slug, v) => {
  if (preview(slug, v) && renderPct(slug, v) == null) return "ready";
  if (renderPct(slug, v) != null) return "rendering";
  if (existsSync(projJson(`${slug}-${v}`))) return "rendering";
  return v === "b" ? "none" : "building";
};
const listVideos = () => {
  rev = loadRev();
  return loadQueue().map((q, i) => {
    const st = rev[q.slug] || { status: "pending" };
    return {
      slug: q.slug,
      n: i + 1,
      title: q.title,
      comp: !!q.comp,
      hookLine: hookLineOf(q.slug),
      main: preview(q.slug, "A"),
      trial: preview(q.slug, "B"),
      mainStage: stageOf(q.slug, "a"),
      trialStage: stageOf(q.slug, "b"),
      mPct: renderPct(q.slug, "a"),
      tPct: renderPct(q.slug, "b"),
      status: st.status || "",
      mStatus: st.m || "pending",
      tStatus: st.t || "pending",
      hasTrial: !!preview(q.slug, "B"),
      changes: st.changes || "",
      day: st.day || null,
      date: st.day ? dateForDay(st.day) : null,
      archived: !!(q.archived || st.archived),
    };
  });
};

// ---- manual edit: read / apply caption + title text edits, re-render preview
const projJson = (proj) => join(ROOT, "projects", proj, "project.json");
const readEdit = (slug, v) => {
  const f = projJson(`${slug}-${v}`);
  if (!existsSync(f)) return null;
  const p = JSON.parse(readFileSync(f, "utf8"));
  return {
    title: p.tracks.title?.[0]?.text || "",
    captions: (p.tracks.captions || []).map((c) => ({ id: c.id, t: +c.start.toFixed(1), text: c.text })),
  };
};
const runOp = (proj, args) =>
  new Promise((res) => {
    const p = spawn(process.execPath, [join(ROOT, "scripts", "proj-op.mjs"), proj, ...args], { cwd: ROOT });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("close", (c) => res({ code: c, out }));
  });

// full project state for the timeline editor
const readProject = (slug, v) => {
  const f = projJson(`${slug}-${v}`);
  if (!existsSync(f)) return null;
  const p = JSON.parse(readFileSync(f, "utf8"));
  return {
    title: p.tracks.title?.[0]?.text || "",
    duration: +(p.duration || 0).toFixed(2),
    clips: (p.tracks.video || []).map((c) => ({
      id: c.id,
      name: c.src.split("/").pop().replace(/_singular_display\.[Mm][Pp]4$/, ""),
      in: +c.sourceIn.toFixed(2),
      out: +c.sourceOut.toFixed(2),
      tl: +(c.timelineStart || 0).toFixed(2),
      dur: +((c.sourceOut - c.sourceIn) / (c.speed || 1)).toFixed(2),
    })),
    captions: (p.tracks.captions || []).map((c) => ({ id: c.id, t: +c.start.toFixed(1), text: c.text })),
  };
};

// Fast preview re-render. Tries the warm-bundle in-process path first (seconds);
// falls back to the standalone proj-render.mjs subprocess (bundles, ~minutes) if
// the warm path errors. Copies the result into scratch/batch/previews and
// updates review.json.
const rerenderPreview = (slug, v, note) => {
  const proj = `${slug}-${v}`;
  const V = v.toUpperCase();
  const logP = join(B, `edit-${slug}.log`);
  writeFileSync(logP, "");
  // a batch re-cut is rendering — don't fight it for the GPU/bundle; edits are
  // saved to project.json regardless, they render on the next manual trigger.
  if (existsSync(join(B, "BATCH_LOCK"))) {
    writeFileSync(logP, "· a batch re-render is running — your edit is saved; re-render when it finishes\n");
    rev = loadRev();
    rev[slug] = { ...rev[slug], status: "changes_requested", changes: (note || "edited ") + V + " (queued — batch running)" };
    saveRev(rev);
    return;
  }
  const app = (d) => {
    try {
      writeFileSync(logP, readFileSync(logP, "utf8") + d);
    } catch {
      /* noop */
    }
  };
  const outPath = join(ROOT, "projects", proj, "preview", `${proj}.mp4`);
  const publish = () => {
    if (existsSync(outPath)) {
      try {
        copyFileSync(outPath, join(PREV, `${slug}-${V}.mp4`));
      } catch {
        /* noop */
      }
    }
  };
  const finish = (okStr) => {
    rev = loadRev();
    rev[slug] = { ...rev[slug], status: "changes_requested", changes: (note || "edited ") + V + okStr };
    saveRev(rev);
  };
  const fallback = () => {
    app("\n· warm path failed — falling back to full proj-render subprocess\n");
    const r = spawn(process.execPath, [join(ROOT, "scripts", "proj-render.mjs"), proj, "--scale", "0.5", "--no-denoise"], { cwd: ROOT });
    r.stdout.on("data", app);
    r.stderr.on("data", app);
    r.on("close", (code) => {
      publish();
      finish(code ? " (render failed)" : "");
    });
  };
  renderLive(proj, { scale: 0.5, outPath, onLog: app })
    .then((res) => {
      if (res.ok) {
        publish();
        finish("");
      } else {
        fallback();
      }
    })
    .catch(fallback);
};

// apply timeline ops (delete/move/trim), then recaption if clips changed, then
// caption-text overrides, then low-res re-render
const applyProject = async (slug, v, { title, ops = [], captions = {}, dropCaptions = [], skipPreview = false }) => {
  const proj = `${slug}-${v}`;
  rev = loadRev();
  rev[slug] = { ...(rev[slug] || {}), status: "editing" };
  saveRev(rev);
  const cur0 = readProject(slug, v);
  let clipsChanged = false;
  for (const o of ops) {
    if (o.op === "delete") {
      await runOp(proj, ["delete_clip", "--clip", o.clip]);
      clipsChanged = true;
    } else if (o.op === "move") {
      await runOp(proj, ["move_clip", "--clip", o.clip, "--to", String(o.to)]);
      clipsChanged = true;
    } else if (o.op === "trim") {
      await runOp(proj, ["trim_clip", "--clip", o.clip, "--in", String(o.in), "--out", String(o.out)]);
      clipsChanged = true;
    } else if (o.op === "split") {
      await runOp(proj, ["split_clip", "--clip", o.clip, "--at", String(o.at)]);
      clipsChanged = true;
    }
  }
  if (title && title.trim() && title.trim() !== cur0.title) await runOp(proj, ["set_title_text", "--text", title.trim()]);
  // ingest projects carry a _ingest_words sidecar → proj-op's regenCaptions already
  // rebuilt the caption track instantly during the clip ops. Only shoot-library
  // projects need the slow whisper re-pass.
  const isIngest = existsSync(projJson(proj)) && !!JSON.parse(readFileSync(projJson(proj), "utf8"))._ingest_words;
  if (clipsChanged && !isIngest) await new Promise((r) => { const p = spawn(process.execPath, [join(ROOT, "scripts", "proj-recaption.mjs"), proj], { cwd: ROOT }); p.on("close", r); });
  // caption text overrides — match by nearest current id/text (post-recaption ids may differ)
  const after = readProject(slug, v);
  for (const [id, text] of Object.entries(captions)) {
    const src = cur0.captions.find((c) => c.id === id);
    if (!src || text == null || text === src.text) continue;
    const tgt = after.captions.find((c) => c.id === id) || after.captions.find((c) => Math.abs(c.t - src.t) < 0.4);
    if (tgt) await runOp(proj, ["set_caption_text", "--id", tgt.id, "--text", text]);
  }
  // caption removals — same fuzzy match; do these last so time-matching is stable
  for (const id of dropCaptions) {
    const src = cur0.captions.find((c) => c.id === id);
    if (!src) continue;
    const now = readProject(slug, v);
    const tgt = now.captions.find((c) => c.id === id) || now.captions.find((c) => Math.abs(c.t - src.t) < 0.4 && c.text.slice(0, 12) === src.text.slice(0, 12)) || now.captions.find((c) => Math.abs(c.t - src.t) < 0.3);
    if (tgt) await runOp(proj, ["remove_caption", "--id", tgt.id]);
  }
  // ---- record the manual revision so the system can study/learn from it ----
  try {
    const mePath = join(B, "manual-edits.json");
    const me = existsSync(mePath) ? JSON.parse(readFileSync(mePath, "utf8")) : [];
    const now = readProject(slug, v);
    me.push({
      at: new Date().toISOString(),
      slug, v, hookLine: hookLineOf(slug),
      title_before: cur0.title, title_after: now.title,
      clips_before: cur0.clips.length, clips_after: now.clips.length,
      deleted_clips: ops.filter((o) => o.op === "delete").map((o) => o.clip),
      reordered: ops.some((o) => o.op === "move"),
      trims: ops.filter((o) => o.op === "trim"),
      caption_text_edits: Object.entries(captions).map(([id, t]) => ({ was: cur0.captions.find((c) => c.id === id)?.text, now: t })),
      duration_before: cur0.duration, duration_after: now.duration,
    });
    writeFileSync(mePath, JSON.stringify(me, null, 2));
  } catch {
    /* noop */
  }
  if (!skipPreview) rerenderPreview(slug, v, "edited ");
};
const applyEdit = async (slug, v, title, captions) => {
  const proj = `${slug}-${v}`;
  rev = loadRev();
  rev[slug] = { ...(rev[slug] || {}), status: "editing" };
  saveRev(rev);
  const cur = readEdit(slug, v);
  if (title && title.trim() && title.trim() !== cur.title) await runOp(proj, ["set_title_text", "--text", title.trim()]);
  for (const [id, text] of Object.entries(captions || {})) {
    const old = cur.captions.find((c) => c.id === id);
    if (old && text != null && text !== old.text) await runOp(proj, ["set_caption_text", "--id", id, "--text", text]);
  }
  // re-render the LOW-RES preview only (full-res happens on publish)
  rerenderPreview(slug, v, "manually edited ");
};

// ---- schedule: render full-res if needed, then publish.mjs schedule --confirm
// when: "calendar" (next free day, morning/evening slot) | "now" (~10 min out, today)
const scheduleVideo = (slug, scope, when = "calendar") => {
  // scope is "main" or "trial" — exactly the one the button chose. Never the other.
  rev = loadRev();
  const track = scope === "trial" ? "t" : "m";
  const day = rev[slug]?.day || nextFreeDay();
  rev[slug] = { ...(rev[slug] || {}), [track]: "scheduling", day: when === "now" ? rev[slug]?.day || null : day, changes: rev[slug]?.changes || "" };
  saveRev(rev);
  const q = loadQueue().find((x) => x.slug === slug);
  const date = dateForDay(day);
  const nowAt = (() => {
    const d = new Date(Date.now() + 10 * 60 * 1000); // ~10 min out — time for a final render
    return d.toISOString().slice(0, 19) + TZ;
  })();
  const capMain = q.title.replace(/\s*[·—-].*$/, "").replace(/^POV:\s*/i, "").trim();
  const capTrial = (hookLineOf(slug) ? hookLineOf(slug) + " — " : "") + q.title.replace(/^POV:\s*/i, "").trim();
  const rows = [];
  if (scope === "main")
    rows.push({ project: `${slug}-a`, as: "main", at: when === "now" ? nowAt : `${date}T${MORNING}${TZ}`, platforms: PLATFORMS, caption: capMain });
  if (scope === "trial" && existsSync(join(PREV, `${slug}-B.mp4`)))
    rows.push({ project: `${slug}-b`, as: "trial", at: when === "now" ? nowAt : `${date}T${EVENING}${TZ}`, platforms: PLATFORMS, caption: capTrial });
  if (!rows.length) {
    rev = loadRev();
    rev[slug][track] = "error";
    saveRev(rev);
    return;
  }
  const planPath = join(B, `plan-${slug}.json`);
  writeFileSync(planPath, JSON.stringify(rows, null, 2));
  const steps = [];
  for (const r of rows)
    if (!existsSync(join(ROOT, "projects", r.project, "preview", `${r.project}_FINAL.mp4`)))
      steps.push(["scripts/proj-render.mjs", r.project, "--final", "--crf", "20", "--preset", "fast"]);
  steps.push(["scripts/publish.mjs", "schedule", "--plan", planPath, "--confirm"]);
  const logPath = join(B, `sched-${slug}.log`);
  writeFileSync(logPath, `${slug} scope=${scope} day=${day} ${date}\n`);
  const next = (idx) => {
    if (idx >= steps.length) {
      const log = readFileSync(logPath, "utf8");
      rev = loadRev();
      rev[slug] = { ...rev[slug], status: log.includes("✓ schedule submitted") ? "scheduled" : "error", at: new Date().toISOString() };
      saveRev(rev);
      return;
    }
    const p = spawn(process.execPath, [join(ROOT, ...steps[idx][0].split("/")), ...steps[idx].slice(1)], { cwd: ROOT });
    const app = (d) => writeFileSync(logPath, readFileSync(logPath, "utf8") + d);
    p.stdout.on("data", app);
    p.stderr.on("data", app);
    p.on("close", (c) => {
      app(`\n[step ${idx} exit ${c}]\n`);
      if (c === 0) next(idx + 1);
      else {
        rev = loadRev();
        rev[slug][track] = "error";
        saveRev(rev);
      }
    });
  };
  next(0);
};

// ---- ShortSync published/scheduled feed ----
let feedCache = { at: 0, rows: [] };
const shortsyncFeed = async () => {
  if (Date.now() - feedCache.at < 20000) return feedCache.rows;
  try {
    const r = await fetch(`${CFG.base_url}/posts`, { headers: { Authorization: `Bearer ${CFG.api_key}` } });
    const j = await r.json();
    const rows = (j.data || j.posts || []).map((p) => ({
      id: p.id,
      platform: p.platform,
      status: p.status,
      when: p.published_at || p.scheduled_for,
      caption: (p.caption || "").slice(0, 80),
      url: p.platform_url || null,
    }));
    feedCache = { at: Date.now(), rows };
  } catch (e) {
    feedCache = { at: Date.now(), rows: [{ id: "-", platform: "-", status: "api error: " + e.message, when: "", caption: "" }] };
  }
  return feedCache.rows;
};

// ---- HTTP ----
const HTML = `<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Reel review</title><style>
*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0;font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;background:#0d0d10;color:#e8e8ea}
header{position:sticky;top:0;background:#0d0d10;border-bottom:1px solid #26262c;padding:12px 20px;z-index:5;display:flex;gap:18px;align-items:center}
header b{font-weight:700}.sub{color:#8a8a92;font-size:13px}
.tab{background:none;border:0;color:#8a8a92;font:inherit;font-weight:600;cursor:pointer;padding:6px 10px;border-radius:8px}
.tab.on{background:#22222a;color:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:18px;padding:20px}
.card{background:#16161b;border:1px solid #26262c;border-radius:14px;overflow:hidden}
.card h3{margin:0;padding:12px 14px;font-size:13.5px;display:flex;justify-content:space-between;gap:8px;align-items:center}
.n{color:#6a6a72}
.vids{display:flex;gap:8px;padding:0 12px}
.vids figure{margin:0;flex:1;min-width:0}
.vids figcaption{font-size:11px;color:#8a8a92;padding:4px 0}
video{width:100%;border-radius:8px;background:#000;aspect-ratio:9/16}
.norender{width:100%;aspect-ratio:9/16;border-radius:8px;background:#0a0a0d;border:1px dashed #333;display:flex;align-items:center;justify-content:center;color:#666;font-size:12px}
.hookline{font-size:12px;color:#c9c9cf;padding:8px 14px;font-style:italic}
.act{display:flex;gap:6px;padding:12px 14px;flex-wrap:wrap}
button.b{font:inherit;border:0;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:600;font-size:13px}
.main{background:#2ea043;color:#fff}.trial{background:#8957e5;color:#fff}.both{background:#1f6feb;color:#fff}
.b.cal{background:#1b2b3a;color:#8fc9e8;border:1px solid #2a4a63}
.warn{background:#30302f;color:#e8e8ea;border:1px solid #444}.bad{background:#3a1d1d;color:#ff9b9b}
textarea{width:100%;background:#0d0d10;border:1px solid #333;color:#e8e8ea;border-radius:8px;padding:8px;font:inherit;resize:vertical;min-height:36px}
.badge{font-size:11px;padding:3px 8px;border-radius:20px;font-weight:700;white-space:nowrap}
.b-pending{background:#33301a;color:#e8c860}.b-scheduled{background:#123a1c;color:#7ee08a}.b-published{background:#0f2f3a;color:#6fd6e8}
.b-scheduling{background:#1a2f3a;color:#7ec8e0}.b-error{background:#3a1d1d;color:#ff9b9b}.b-x{background:#222;color:#666}
.trk{display:flex;gap:6px;align-items:center;padding:6px 14px 0;font-size:10px;color:#8a8a92;font-weight:700}
.trk .badge{font-size:10px;padding:2px 7px}
.b-scheduling{background:#1a2f3a;color:#7ec8e0}.b-changes_requested{background:#3a2a12;color:#e0a860}
.b-rejected{background:#3a1d1d;color:#ff9b9b}.b-error{background:#3a1d1d;color:#ff9b9b}.b-editing{background:#1a2f3a;color:#7ec8e0}
.flags{margin:0 14px 8px;padding:7px 10px;background:#3a1d1d;border:1px solid #5a2a2a;border-radius:8px;color:#ffb0b0;font-size:12px}
.card.arch{opacity:.5}
#summary a{margin-left:8px;text-decoration:underline}
.cardtitle{cursor:text;border-bottom:1px dashed transparent}
.cardtitle:hover{border-bottom-color:#555}
.cardtitle-in{font:inherit;font-size:15px;font-weight:700;background:#0d0d10;border:1px solid #3fb950;color:#fff;border-radius:5px;padding:2px 6px;width:90%}
.qedbar{display:flex;gap:6px;padding:6px 14px 0}
.b.qe{background:#1b2b22;color:#8fe0b0;border:1px solid #2a5540;font-size:12px;padding:5px 10px}
.qed{margin:8px 14px 4px;background:#0f0f13;border:1px solid #2a2a32;border-radius:10px;padding:10px}
.qed-load{color:#888;font-size:12px;padding:6px}
.qed-hd{font-size:11px;color:#8a8a92;margin-bottom:8px}
.qed-row{display:flex;gap:8px;align-items:center;margin-bottom:8px;font-size:12px}
.qed-row span{color:#8a8a92;width:34px;flex:none}
.qed-title{flex:1;background:#0d0d10;border:1px solid #2c2c34;color:#e8e8ea;border-radius:6px;padding:6px 8px;font:inherit;font-size:13px}
.qed-caps{max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:3px;margin-bottom:8px}
.qed-cap{display:flex;gap:6px;align-items:center}
.qed-cap b{color:#666;font-size:10px;width:34px;flex:none;text-align:right;font-weight:400}
.qed-cap input{flex:1;background:#0d0d10;border:1px solid #2c2c34;color:#e8e8ea;border-radius:5px;padding:4px 8px;font:inherit;font-size:12px}
.qed-cap.del input{opacity:.35;text-decoration:line-through}
.qed-x{background:none;border:0;color:#7a7a82;cursor:pointer;font-size:15px;padding:0 4px}
.qed-x:hover{color:#ff9b9b}
.qed-act{display:flex;gap:8px}
.slot-A,.slot-B{position:relative}
.rpb{position:absolute;left:0;right:0;bottom:0;background:rgba(10,10,14,.82);padding:5px 8px;font-size:11px;color:#cfe0ff;font-weight:700;display:flex;align-items:center;gap:8px;border-radius:0 0 10px 10px;backdrop-filter:blur(2px)}
.rpb-bar{position:absolute;left:0;bottom:0;height:3px;background:#3fb950;transition:width .3s}
.rpb span{position:relative;z-index:1}
.edit{background:#30302f;color:#e8e8ea;border:1px solid #444}.dl{background:none;color:#6fd6e8;border:1px solid #2a4a55;text-decoration:none}
/* CapCut-style timeline editor */
#ov{position:fixed;inset:0;background:#0a0a0c;display:none;z-index:20;overflow:auto}
#ov.on{display:flex;flex-direction:column}
.ed{flex:1;display:flex;flex-direction:column;min-height:0}
.edtop{display:flex;gap:16px;padding:14px 18px;border-bottom:1px solid #222;align-items:center}
.edtop .ti{flex:1;background:#141418;border:1px solid #333;color:#e8e8ea;border-radius:8px;padding:8px 10px;font:inherit;font-size:14px}
.edtop .x{background:none;border:0;color:#888;font-size:22px;cursor:pointer;padding:0 6px}
.edmid{flex:1;display:flex;gap:14px;padding:16px 18px;min-height:0}
.edprev{flex:none;width:300px;display:flex;flex-direction:column;gap:8px}
.edprev video{width:100%;aspect-ratio:9/16;border-radius:10px;background:#000}
#ed-player{width:100%;aspect-ratio:9/16;border-radius:10px;overflow:hidden;background:#000}
#ed-player>*{width:100%;height:100%}
.transport{display:flex;gap:8px;justify-content:center}
.transport button{background:#1b1b22;border:1px solid #333;color:#e8e8ea;border-radius:8px;padding:6px 12px;cursor:pointer;font:inherit;font-weight:600}
.edcaps{flex:1;min-width:0;overflow:auto;border:1px solid #222;border-radius:10px;padding:8px}
.edcaps h4{margin:0 0 6px;font-size:11px;color:#888;text-transform:uppercase}
.edcaps .cap{display:flex;gap:6px;align-items:center;margin-bottom:3px}
.edcaps .cap b{color:#666;font-size:10px;width:36px;flex:none;text-align:right;font-weight:400}
.edcaps .cap input{flex:1;background:#0d0d10;border:1px solid #2c2c34;color:#e8e8ea;border-radius:5px;padding:4px 8px;font:inherit;font-size:12px}
.edcaps .cap.neg input{border-color:#5a2a2a;color:#ff9b9b}
.edcaps .cap .capx{background:none;border:0;color:#7a7a82;cursor:pointer;font-size:15px;line-height:1;padding:0 4px}
.edcaps .cap .capx:hover{color:#ff9b9b}
.edcaps .cap.del input{opacity:.35;text-decoration:line-through}
.edcaps .cap.del .capx{color:#3fb950}
/* the timeline */
.edtl{flex:none;border-top:1px solid #222;background:#111114;padding:8px 0 14px}
.tlbar{display:flex;gap:6px;align-items:center;padding:0 18px 8px}
.tlbar button{background:#1b1b22;border:1px solid #333;color:#ccc;border-radius:6px;padding:4px 9px;cursor:pointer;font:inherit;font-size:12px}
.tlbar .zoom{margin-left:auto;display:flex;gap:6px;align-items:center;color:#888;font-size:12px}
.tlwrap{position:relative;overflow-x:auto;overflow-y:hidden;padding:0 18px}
.tlinner{position:relative;height:150px}
.ruler{position:relative;height:20px;border-bottom:1px solid #2a2a30;color:#777;font-size:10px}
.ruler .tick{position:absolute;top:0;height:20px;border-left:1px solid #2a2a30;padding-left:3px}
.track{position:absolute;left:0;right:0;height:56px;background:#0c0c0f;border-radius:6px}
.track.vid{top:24px}.track.cap{top:88px;height:36px}
.seg{position:absolute;top:3px;height:50px;background:linear-gradient(180deg,#2b3d5f,#22304a);border:1px solid #3d5a86;border-radius:6px;overflow:hidden;cursor:grab;user-select:none}
.seg.sel{border-color:#7ea8ff;box-shadow:0 0 0 2px rgba(126,168,255,.4)}
.seg.pc{background:linear-gradient(180deg,#3a3560,#2c2848);border-color:#5c4f8c}
.seg.dragging{opacity:.8;cursor:grabbing;z-index:5}
.seg .lbl{padding:4px 6px;font-size:10px;color:#cfe0ff;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
.seg .sub{padding:0 6px;font-size:9px;color:#9fb6da;pointer-events:none}
.seg .h{position:absolute;top:0;width:8px;height:100%;cursor:ew-resize;background:rgba(126,168,255,.25)}
.seg .h.l{left:0}.seg .h.r{right:0}
.capseg{position:absolute;top:3px;height:30px;background:#3a3320;border:1px solid #6a5a2a;border-radius:5px;font-size:9px;color:#e8c860;padding:2px 4px;overflow:hidden;white-space:nowrap;cursor:pointer}
.capseg.neg{background:#3a1d1d;border-color:#5a2a2a;color:#ff9b9b}
.playhead{position:absolute;top:0;width:2px;background:#ff5252;z-index:8;pointer-events:none}
.playhead::before{content:'';position:absolute;top:-2px;left:-5px;border:6px solid transparent;border-top-color:#ff5252}
.edbot{display:flex;gap:8px;padding:12px 18px;border-top:1px solid #222}
.edmusic{display:flex;gap:10px;align-items:center;padding:8px 18px;border-top:1px solid #222;font-size:12px}
.edmusic select{background:#141418;border:1px solid #333;color:#e8e8ea;border-radius:6px;padding:4px 8px;font:inherit;font-size:12px;max-width:280px}
.edmusic input[type=range]{width:120px}
.calwrap{margin:16px 20px 0}
.cal-hd{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:11px;color:#8a8a92;font-weight:700;padding:0 2px 6px}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cal-cell{min-height:96px;background:#111114;border:1px solid #22222a;border-radius:8px;padding:5px 5px 4px;display:flex;flex-direction:column;gap:3px}
.cal-cell.today{border-color:#3fb950;box-shadow:inset 0 0 0 1px rgba(63,185,80,.3)}
.cal-cell.past{opacity:.5}
.cal-dnum{font-size:11px;color:#8a8a92;font-weight:700}
.cal-cell.today .cal-dnum{color:#3fb950}
.cal-chip{font-size:10px;line-height:1.25;padding:3px 5px;border-radius:5px;cursor:pointer;background:#1b2b3a;color:#9fd0e8;border:1px solid #2a4a63;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cal-chip:hover{filter:brightness(1.25)}
.cal-chip .cal-trk{font-weight:700;opacity:.85}
.cal-chip.s-scheduled{background:#12253a;color:#8fc9e8;border-color:#2a5578}
.cal-chip.s-scheduling{background:#2a2412;color:#e0c060;border-color:#5a4a20}
.cal-chip.s-published{background:#123a1c;color:#7ee08a;border-color:#2a6a3a}
.cal-chip.s-error{background:#3a1d1d;color:#ff9b9b;border-color:#5a2a2a}
.cal-un{margin:12px 20px;padding:8px 12px;background:#2a2412;border:1px solid #5a4a20;border-radius:8px;color:#e0c060;font-size:12px}
#cal-peek{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:30}
.cal-peek-in{display:flex;flex-direction:column;gap:10px;align-items:center}
table{width:calc(100% - 40px);margin:20px;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #26262c}th{color:#8a8a92;font-weight:600}
.st-published{color:#7ee08a}.st-scheduled{color:#6fd6e8}.st-failed{color:#ff9b9b}
a{color:#6fd6e8}
</style></head><body>
<header><b>Reel review</b>
<button class="tab on" id=t-review onclick="tab('review')">Review</button>
<button class=tab id=t-published onclick="tab('published')">📅 Content calendar</button>
<span class=sub id=summary></span></header>
<div id=review class=grid></div>
<div id=published hidden></div>
<div id=ov><div class=ed id=ed></div></div>
<script>
let VIEW='review',BUILT={};
function tab(v){VIEW=v;document.getElementById('review').hidden=v!=='review';document.getElementById('published').hidden=v!=='published';
 document.getElementById('t-review').className='tab'+(v==='review'?' on':'');document.getElementById('t-published').className='tab'+(v==='published'?' on':'');
 if(v==='published')loadPublished();}
const fmt=s=>(s||'').replace(/_/g,' ');
const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const anyPlaying=()=>[...document.querySelectorAll('video')].some(v=>!v.paused&&!v.ended);

// incremental: build a card once, then only patch badge + fill video src.
async function load(){
 let r;
 try{ r=await (await fetch('/api/list')).json(); }
 catch(e){ return; }   // server restarting / offline — the interval retries
 const vs=r.videos;
 const done=t=>['scheduled','published'].includes(t);
 const isReviewing=v=>{
   if(v.status==='rejected'||v.status==='published')return false;
   if(v.status==='editing'||v.status==='changes_requested')return true;
   const mDone=done(v.mStatus), tDone=!v.hasTrial||done(v.tStatus);
   return !(mDone&&tDone);
 };
 const reviewable=vs.filter(isReviewing);
 const archived=reviewable.filter(v=>v.archived);
 const inreview=reviewable.filter(v=>window.SHOW_ARCHIVED||!v.archived);
 const gone=vs.filter(v=>!isReviewing(v));
 const sum=document.getElementById('summary');
 sum.textContent=(r.held?'⏸ auto-post held · ':'')+(r.batch?('🔄 re-cutting all videos: '+r.batch.done+' done'+(r.batch.failed?', '+r.batch.failed+' failed':'')+' · '):'')+(r.warm?'⚡ fast re-render · ':'⏳ warming bundle · ')+(inreview.length-(window.SHOW_ARCHIVED?archived.length:0))+' to review · '+gone.length+' scheduled/published · ';
 if(archived.length){const t=document.createElement('a');t.href='#';t.style.color='#8a8a92';t.textContent=window.SHOW_ARCHIVED?('hide '+archived.length+' archived'):('show '+archived.length+' archived');t.onclick=e=>{e.preventDefault();window.SHOW_ARCHIVED=!window.SHOW_ARCHIVED;[...document.getElementById('review').children].forEach(el=>el.remove());load();};sum.appendChild(t);}else{sum.append(vs.length+' total');}
 const grid=document.getElementById('review');
 const want=new Set(inreview.map(v=>v.slug));
 // remove cards that left review
 [...grid.children].forEach(el=>{if(el.dataset.slug&&!want.has(el.dataset.slug))el.remove();});
 if(!inreview.length&&!grid.children.length){grid.innerHTML='<p style="padding:20px;color:#666">nothing to review</p>';return;}
 for(const v of inreview){
  let el=grid.querySelector('[data-slug="'+v.slug+'"]');
  if(!el){el=document.createElement('div');el.className='card';el.dataset.slug=v.slug;el.innerHTML=cardHTML(v);grid.appendChild(el);}
  // patch per-track badges + hide a Post button once that track is scheduled
  const setTrk=(sel,ts)=>{const b=el.querySelector(sel);if(b){b.className='badge b-'+ts;b.textContent=ts;}};
  setTrk('.bd-m',v.mStatus); setTrk('.bd-t',v.hasTrial?v.tStatus:'—');
  const mDone2=['scheduled','scheduling','published'].includes(v.mStatus);
  const tDone2=!v.hasTrial||['scheduled','scheduling','published'].includes(v.tStatus);
  el.querySelectorAll('button[data-a="postnow_main"],button[data-a="cal_main"]').forEach(b=>b.style.display=mDone2?'none':'');
  el.querySelectorAll('button[data-a="postnow_trial"],button[data-a="cal_trial"]').forEach(b=>b.style.display=tDone2?'none':'');
  const dd=el.querySelector('.card .datestamp'); if(dd)dd.textContent=v.date?('→ '+v.date):'';
  el.classList.toggle('arch',!!v.archived);
  const ab=el.querySelector('button[data-a="archive"],button[data-a="unarchive"]');
  if(ab){ab.dataset.a=v.archived?'unarchive':'archive';ab.textContent=v.archived?'Unarchive':'Archive';}
  // fill in a video that finished rendering
  patchVid(el,'A',v.main,v.mainStage,v.mPct);
  patchVid(el,'B',v.trial,v.trialStage,v.tPct);
 }
}
function patchVid(el,V,src,stage,pct){
 const slot=el.querySelector('.slot-'+V);if(!slot)return;
 const rendering=(pct!=null);
 if(src&&!slot.querySelector('video')){
  const keep=slot.querySelector('.rpb');
  slot.innerHTML='<video src="'+src+'" controls preload=metadata playsinline></video>';
  if(keep)slot.appendChild(keep);
 }
 if(!src&&!slot.querySelector('video')&&!slot.querySelector('.norender')){
  const msg=rendering?'preparing…':(V==='B'?({none:'no hook variation — main only',building:'picking hook…',rendering:'trial rendering…'}[stage]||'no trial'):({building:'building…',rendering:'main rendering…'}[stage]||'rendering…'));
  slot.innerHTML='<div class=norender>'+msg+'</div>';
 }
 // progress badge — sits over the video / placeholder while a render is in flight
 let pb=slot.querySelector('.rpb');
 if(rendering){
  if(!pb){pb=document.createElement('div');pb.className='rpb';slot.appendChild(pb);}
  pb.innerHTML='<div class=rpb-bar style="width:'+Math.max(2,pct)+'%"></div><span>'+(pct<1?'starting…':('rendering '+pct+'%'))+'</span>';
 }else if(pb){pb.remove();const nr=slot.querySelector('.norender');if(nr&&/preparing/.test(nr.textContent))nr.textContent='rendering…';}
}
function cardHTML(v){
 return '<h3><span><span class=n>#'+v.n+(v.comp?' ▣':'')+'</span> <span class=cardtitle data-slug="'+v.slug+'" title="click to rename">'+esc(v.title)+'</span></span>'+
  '<span class=datestamp style="font-size:11px;color:#8a8a92">'+(v.date?'→ '+v.date:'')+'</span></h3>'+
  '<div class=trk><span>MAIN</span><span class="badge bd-m b-'+v.mStatus+'">'+v.mStatus+'</span>'+
   '<span>TRIAL</span><span class="badge bd-t b-'+(v.hasTrial?v.tStatus:'x')+'">'+(v.hasTrial?v.tStatus:'—')+'</span></div>'+
  '<div class=vids><figure><div class="slot-A"></div><figcaption>MAIN → morning, all platforms</figcaption></figure>'+
  '<figure><div class="slot-B"></div><figcaption>TRIAL → night, IG trial reel + all</figcaption></figure></div>'+
  (v.hookLine?'<div class=hookline>hook: '+esc(v.hookLine)+'</div>':'')+
  '<div class=qedbar data-slug="'+v.slug+'"><button class="b qe" data-qe="a">✎ Quick-edit main</button>'+
   (v.hasTrial?'<button class="b qe" data-qe="b">✎ Quick-edit trial</button>':'')+'</div>'+
  '<div class=qed id="qed-'+v.slug+'" hidden></div>'+
  '<div class=act data-slug="'+v.slug+'">'+
   '<button class="b main" data-a="postnow_main" title="render final + publish ~10 min from now">⚡ Post main now</button>'+
   '<button class="b cal" data-a="cal_main" title="add to the content calendar (next free morning)">📅 Calendar</button>'+
   '<button class="b trial" data-a="postnow_trial" title="render final + publish ~10 min from now">⚡ Post trial now</button>'+
   '<button class="b cal" data-a="cal_trial" title="add to the content calendar (next free night)">📅 Calendar</button>'+
   '<button class="b edit" data-a="edit" data-v="a">Timeline main</button>'+
   '<button class="b edit" data-a="edit" data-v="b">Timeline trial</button>'+
   (v.main?'<a class="b dl" href="'+v.main+'" download>DL main</a>':'')+
   (v.trial?'<a class="b dl" href="'+v.trial+'" download>DL trial</a>':'')+
   '<button class="b warn" data-a="changes">Save note</button>'+
   '<button class="b warn" data-a="'+(v.archived?'unarchive':'archive')+'">'+(v.archived?'Unarchive':'Archive')+'</button>'+
   '<button class="b bad" data-a="reject">Reject</button>'+
  '</div><div class=ep id="ep-'+v.slug+'"></div>'+
  '<div style="padding:0 14px 12px"><textarea id="ta-'+v.slug+'" placeholder="note...">'+esc(v.changes)+'</textarea></div>';
}
let CAL_MP4={};
async function loadPublished(){
 const rows=await (await fetch('/api/published')).json();
 const mine=await (await fetch('/api/scheduled')).json();
 CAL_MP4={};
 const byDay={};
 for(const m of mine){
  const d=m.date||'unscheduled';
  (byDay[d]=byDay[d]||[]).push(m);
  if(m.mp4)CAL_MP4[m.slug+'-'+m.track]=m.mp4;
 }
 // 6-week grid starting from the Sunday of this week
 const today=new Date();today.setHours(0,0,0,0);
 const start=new Date(today);start.setDate(start.getDate()-start.getDay());
 const iso=x=>x.toISOString().slice(0,10);
 const dow=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 let cells='';
 for(let w=0;w<6;w++){
  for(let d=0;d<7;d++){
   const cur=new Date(start);cur.setDate(start.getDate()+w*7+d);
   const k=iso(cur), isToday=k===iso(today), past=cur<today;
   const items=(byDay[k]||[]);
   cells+='<div class="cal-cell'+(isToday?' today':'')+(past?' past':'')+'">'+
    '<div class=cal-dnum>'+(cur.getDate()===1||(w===0&&d===0)?(cur.toLocaleString('en',{month:'short'})+' '):'')+cur.getDate()+'</div>'+
    items.map(m=>'<div class="cal-chip s-'+m.status+'" data-mp4="'+(m.mp4||'')+'" title="'+esc(m.title)+' — '+m.track+' — '+m.status+'">'+
      '<span class=cal-trk>'+(m.track==='trial'?'▽ trial':'● main')+'</span> #'+m.n+' '+esc(m.title.replace(/\\s*[·—-].*$/,'').slice(0,26))+'</div>').join('')+
    '</div>';
  }
 }
 const unsch=(byDay['unscheduled']||[]);
 document.getElementById('published').innerHTML=
  '<div class=calwrap><div class=cal-hd>'+dow.map(x=>'<div>'+x+'</div>').join('')+'</div>'+
   '<div class=cal-grid>'+cells+'</div></div>'+
  (unsch.length?'<div class=cal-un><b>needs a slot:</b> '+unsch.map(m=>'#'+m.n+' '+esc(m.title)+' ('+m.track+', '+m.status+')').join(' · ')+'</div>':'')+
  '<h4 style="margin:18px 20px 6px;color:#8a8a92;text-transform:uppercase;font-size:11px">platform delivery (ShortSync)</h4>'+
  '<table><tr><th>platform</th><th>status</th><th>when</th><th>caption</th><th>link</th></tr>'+
   rows.map(p=>'<tr><td>'+p.platform+'</td><td class="st-'+p.status+'">'+p.status+'</td><td>'+(p.when||'').replace('T',' ').slice(0,16)+'</td><td>'+esc(p.caption)+'</td><td>'+(p.url?'<a target=_blank href="'+p.url+'">open</a>':'')+'</td></tr>').join('')+'</table>'+
  '<div id=cal-peek hidden></div>';
}
document.addEventListener('click',e=>{
 if(e.target.closest('#cal-peek')&&!e.target.closest('video')){document.getElementById('cal-peek').hidden=true;return;}
 const chip=e.target.closest('.cal-chip');if(!chip)return;
 const mp4=chip.dataset.mp4, peek=document.getElementById('cal-peek');
 if(!mp4||!peek)return;
 peek.hidden=false;
 peek.innerHTML='<div class=cal-peek-in><video src="'+mp4+'" controls autoplay style="max-height:70vh;border-radius:10px"></video><div style="color:#8a8a92;font-size:12px">click outside to close</div></div>';
});
// ================= CapCut-style timeline editor =================
let ED=null,PREVLIB=null;
// lazy-load the esbuild-bundled <Player> mount (≈1MB) on first Edit open
function ensurePreviewLib(){
 if(window.__mountPreview)return Promise.resolve();
 if(PREVLIB)return PREVLIB;
 PREVLIB=new Promise((res)=>{const s=document.createElement('script');s.src='/editor-preview.js';s.onload=res;s.onerror=()=>res();document.head.appendChild(s);});
 return PREVLIB;
}
async function openEdit(slug,v){
 const d=await (await fetch('/api/project?slug='+slug+'&v='+v)).json();
 if(d.error){alert('no project for '+slug+'-'+v+' yet — still rendering');return;}
 let base=null;
 try{base=await (await fetch('/api/livedata?slug='+slug+'&v='+v)).json();}catch(e){}
 ED={slug,v,orig:d,base:(base&&!base.error?base:null),title:d.title,zoom:9,sel:null,playT:0,player:null,playing:false,
   clips:d.clips.map(c=>({id:c.id,srcId:c.id,name:c.name,in:c.in,out:c.out})),
   caps:d.captions.map(c=>({id:c.id,t:c.t,text:c.text})),
   capEdits:{}, capDel:{}};
 buildEditor();document.getElementById('ov').classList.add('on');
 document.onkeydown=edKey;
}
function closeEd(){try{ED&&ED._phPoll&&clearInterval(ED._phPoll);}catch(e){}
 try{ED&&ED.player&&ED.player.destroy();}catch(e){}
 document.getElementById('ov').classList.remove('on');document.onkeydown=null;ED=null;}
const cdur=c=>Math.max(0.1,c.out-c.in);
const totalDur=()=>ED.clips.reduce((s,c)=>s+cdur(c),0);
const NEG=/\b(palestin|occupation|apartheid|genocide|coloniz|nakba|from the river|i don.?t like israel|hate israel|israel is (bad|fake|stolen)|i don.?t feel safe|not safe|kill(ing)? (the )?(jews|arabs|civilians))\b/i;

// rebuild a full ProjectData from ED.base + the live edits, for the <Player>.
// Approximate for captions (shifts them with their clip) — exact recaption still
// runs server-side on Apply. Video edits (trim/reorder/delete/split) are exact.
function buildLiveData(){
 const base=ED.base; if(!base)return null;
 const vById={}; base.tracks.video.forEach(c=>vById[c.id]=c);
 let tl=0; const vid=[]; const pieces=[];
 for(const c of ED.clips){
  const src=vById[c.srcId]||base.tracks.video[0];
  const spd=src.speed||1, dur=Math.max(0.1,c.out-c.in);
  vid.push(Object.assign({},src,{id:c.id,sourceIn:c.in,sourceOut:c.out,timelineStart:+tl.toFixed(3),speed:spd}));
  pieces.push({srcId:c.srcId,in:c.in,out:c.out,newStart:tl,spd});
  tl+=dur/spd;
 }
 const caps=[];
 for(const cap of base.tracks.captions){
  if(ED.capDel&&ED.capDel[cap.id])continue;             // dropped in the editor
  const bc=base.tracks.video.find(vv=>{const s=vv.timelineStart||0;const e=s+((vv.sourceOut-vv.sourceIn)/(vv.speed||1));return cap.start>=s-0.01&&cap.start<e+0.05;});
  if(!bc)continue;
  const srcPos=bc.sourceIn+(cap.start-(bc.timelineStart||0))*(bc.speed||1);
  const pc=pieces.find(p=>p.srcId===bc.id&&srcPos>=p.in-0.06&&srcPos<=p.out+0.06); // clip deleted / trimmed away → drop
  if(!pc)continue;
  const edited=ED.capEdits[cap.id]!=null&&ED.capEdits[cap.id]!==cap.text;
  const txt=edited?ED.capEdits[cap.id]:cap.text;
  if(NEG.test(txt))continue;                            // positivity guard in preview too
  const ns=pc.newStart+(srcPos-pc.in)/pc.spd, d=Math.max(0.2,cap.end-cap.start);
  const o=Object.assign({},cap,{text:txt,start:+ns.toFixed(3),end:+(ns+d).toFixed(3)});
  if(edited){
   // the per-word timings no longer match the new text — CaptionLayer renders
   // words[] when present, so spread the NEW words evenly across the window
   const ws=txt.split(/\s+/).filter(Boolean), step=(o.end-o.start)/Math.max(1,ws.length);
   o.words=ws.map((t,k)=>({text:t,start:+(o.start+k*step).toFixed(3),end:+(o.start+(k+1)*step).toFixed(3)}));
   delete o.emphasis;                                   // re-pick on the MP4 render
  }
  caps.push(o);
 }
 caps.sort((a,b)=>a.start-b.start);
 // after a reorder/trim two captions can land on top of each other → clamp so
 // they never overlap and never show out of order (the "jumbled captions" bug)
 for(let i=0;i<caps.length-1;i++){
  if(caps[i].end>caps[i+1].start)caps[i].end=Math.max(caps[i].start+0.2,caps[i+1].start-0.02);
 }
 for(let i=caps.length-1;i>0;i--){
  if(caps[i].text===caps[i-1].text&&Math.abs(caps[i].start-caps[i-1].start)<0.5)caps.splice(i,1);
 }
 const title=(base.tracks.title||[]).map((t,i)=>i===0?Object.assign({},t,{text:ED.title||t.text}):t);
 return Object.assign({},base,{music:base.music||null,dub:base.dub||null,duration:tl,tracks:Object.assign({},base.tracks,{video:vid,title,captions:caps})});
}
function livePreviewSync(){if(ED&&ED.player){const d=buildLiveData();if(d)ED.player.update(d);}}

function buildEditor(){
 const LANGS=[['src','Captions: Original'],['es','Español'],['ar','العربية'],['he','עברית'],['fr','Français'],['pt','Português'],['de','Deutsch'],['ru','Русский'],['hi','हिन्दी']];
 const curLang=(ED.base&&ED.base.captionLang)||'src';
 document.getElementById('ed').innerHTML=
 '<div class=edtop><b>Edit '+ED.v.toUpperCase()+'</b>'+
   '<input class=ti id=ed-title value="'+esc(ED.title)+'">'+
   '<select id=ed-lang class=ti style="flex:none;width:auto;min-width:150px">'+
     LANGS.map(function(l){return '<option value="'+l[0]+'"'+(l[0]===curLang?' selected':'')+'>'+l[1]+'</option>';}).join('')+
   '</select>'+
   '<span style="color:#888;font-size:12px" id=ed-dur></span>'+
   '<button class=x id=ed-x>✕</button></div>'+
 '<div class=edmid>'+
   '<div class=edprev><div id=ed-player></div>'+
     '<div class=transport><button id=ed-split>✂ Split</button><button id=ed-del>🗑 Delete</button></div>'+
     '<div style="font-size:11px;color:#3fb950" id=ed-pvnote>● live preview — updates as you edit · MP4 only renders on Apply/Publish</div></div>'+
   '<div class=edcaps id=ed-caps><h4>captions — edit text · × removes a line</h4>'+
     ED.caps.map(c=>'<div class="cap'+(NEG.test(c.text)?' neg':'')+((ED.capDel&&ED.capDel[c.id])?' del':'')+'"><b>'+c.t+'s</b><input data-cid="'+c.id+'" value="'+esc(c.text)+'"><button class=capx data-cid="'+c.id+'" title="remove / restore this caption">×</button></div>').join('')+
   '</div>'+
 '</div>'+
 '<div class=edtl><div class=tlbar>'+
   '<button id=ed-zin>zoom +</button><button id=ed-zout>zoom −</button>'+
   '<span style="color:#666;font-size:12px">drag clip = reorder · drag edge = trim · click ruler = seek</span>'+
   '<span class=zoom><button class="b bad" id=ed-reset>reset</button></span></div>'+
   '<div class=tlwrap id=ed-wrap><div class=tlinner id=ed-inner></div></div>'+
 '</div>'+
 '<div class=edmusic id=ed-music><b>♪ music</b>'+
   '<select id=ed-mtrack><option value="">— none —</option></select>'+
   '<input id=ed-mvol type=range min=0 max=30 step=1 title="volume %">'+
   '<span id=ed-mvoltxt style="color:#8a8a92;font-size:11px;width:34px">10%</span>'+
   '<label style="font-size:11px;color:#8a8a92"><input type=checkbox id=ed-mduck checked> duck under voice</label>'+
   '<button id=ed-mplay class="b" style="padding:4px 10px">▶</button>'+
   '<span id=ed-mnote style="font-size:11px;color:#666"></span></div>'+
 '<div class=edmusic id=ed-dubrow><b>🎙 dub</b>'+
   '<select id=ed-dublang><option value="">original audio</option>'+
     '<option value=es>Spanish</option><option value=ar>Arabic</option><option value=he>Hebrew</option>'+
     '<option value=fr>French</option><option value=pt>Portuguese</option><option value=de>German</option>'+
     '<option value=hi>Hindi</option><option value=ru>Russian</option><option value=it>Italian</option><option value=tr>Turkish</option></select>'+
   '<button id=ed-dubgo class="b" style="padding:4px 10px">Dub</button>'+
   '<span id=ed-dubnote style="font-size:11px;color:#8a8a92">AI voice replaces the speech · ~5–15 min</span></div>'+
 '<div class=edbot><button class="b main" id=ed-apply>Apply + render preview</button>'+
   '<button class="b main" id=ed-apply-postnow title="apply edits, render final, publish this '+ED.v.toUpperCase()+' ~10 min from now">⚡ Apply + Post now</button>'+
   '<button class="b cal" id=ed-apply-cal title="apply edits, then add to the content calendar">📅 Apply + Calendar</button>'+
   '<button class="b warn" id=ed-cancel>Cancel</button></div>';
 renderTL();bindTL();
 const mount=document.getElementById('ed-player');
 const note=document.getElementById('ed-pvnote');
 if(ED.base){
  ensurePreviewLib().then(()=>{
   if(!ED||!window.__mountPreview){if(note){note.textContent='live preview unavailable — edits still apply on Apply';note.style.color='#888';}return;}
   const d=buildLiveData();
   ED.player=window.__mountPreview(mount,d);
   // timeline playhead follows the player during playback (event + poll fallback)
   try{ED.player.onFrame&&ED.player.onFrame(function(sec){if(!ED)return;ED.playT=sec;movePlayhead();});}catch(x){}
   if(ED._phPoll)clearInterval(ED._phPoll);
   ED._phPoll=setInterval(function(){
    if(!ED||!ED.player){return;}
    try{const s=ED.player.getSeconds();if(typeof s==='number'&&Math.abs(s-ED.playT)>0.06){ED.playT=s;movePlayhead();}}catch(x){}
   },120);
  });
 }else if(note){note.textContent='live preview unavailable for this clip — edits still apply on Apply';note.style.color='#888';}
 // live-update the preview whenever a caption field changes
 document.getElementById('ed-caps').addEventListener('input',e=>{
  const i=e.target.closest('input[data-cid]');if(!i)return;
  const o=ED.orig.captions.find(c=>c.id===i.dataset.cid);
  if(o){if(i.value!==o.text)ED.capEdits[i.dataset.cid]=i.value;else delete ED.capEdits[i.dataset.cid];}
  i.parentElement.classList.toggle('neg',NEG.test(i.value));
  livePreviewSync();
 });
 document.getElementById('ed-title').addEventListener('input',e=>{ED.title=e.target.value;livePreviewSync();});
 // ---- music row ----
 (async()=>{
  const sel=document.getElementById('ed-mtrack'), vol=document.getElementById('ed-mvol'),
        voltxt=document.getElementById('ed-mvoltxt'), duck=document.getElementById('ed-mduck'),
        play=document.getElementById('ed-mplay');
  const cat=await (await fetch('/api/music/list')).json();
  const byMood={};for(const t of cat)(byMood[t.mood||'other']=byMood[t.mood||'other']||[]).push(t);
  for(const mood of Object.keys(byMood).sort()){
    const og=document.createElement('optgroup');og.label=mood;
    for(const t of byMood[mood].sort((a,b)=>a.file.localeCompare(b.file))){
      const o=document.createElement('option');o.value=t.file;o.textContent=t.file.replace(/\.mp3$/,'')+'  ('+Math.round(t.sec)+'s)';og.appendChild(o);}
    sel.appendChild(og);
  }
  const cur=ED.base&&ED.base.music;
  if(cur&&cur.src){sel.value=cur.src.split('/').pop();vol.value=Math.round((cur.volume||0.1)*100);duck.checked=cur.duck!==false;}
  else{vol.value=10;}
  voltxt.textContent=vol.value+'%';
  let au=null;
  const stopAu=()=>{if(au){au.pause();au=null;play.textContent='▶';}};
  play.onclick=()=>{if(au){stopAu();return;}if(!sel.value)return;au=new Audio('/media-music/'+encodeURIComponent(sel.value));au.volume=Math.min(1,vol.value/100*3);au.play();play.textContent='❚❚';au.onended=stopAu;};
  const mnote=document.getElementById('ed-mnote');
  const push=async()=>{
   // reflect in the live player immediately — no MP4 wait
   if(ED.base){ED.base.music=sel.value?{src:'footage/music/'+sel.value,volume:+vol.value/100,duck:duck.checked}:null;livePreviewSync();}
   if(mnote)mnote.textContent='saving + re-rendering card…';
   try{
    const r=await fetch('/api/music',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({slug:ED.slug,v:ED.v,track:sel.value,vol:+vol.value/100,duck:duck.checked})});
    const j=await r.json();
    if(mnote)mnote.textContent=j.ok?'saved ✓':'save failed';
   }catch(e){if(mnote)mnote.textContent='save failed';}
  };
  vol.oninput=()=>{voltxt.textContent=vol.value+'%';if(au)au.volume=Math.min(1,vol.value/100*3);};
  let vt;vol.onchange=()=>{clearTimeout(vt);vt=setTimeout(push,150);};
  sel.onchange=()=>{stopAu();push();};
  duck.onchange=push;
 })();
 // ---- dub row ----
 (function(){
  const sel=document.getElementById('ed-dublang'), go=document.getElementById('ed-dubgo'), note=document.getElementById('ed-dubnote');
  const cur=ED.base&&ED.base.dub;
  if(cur&&cur.lang){sel.value=cur.lang;go.textContent='Re-dub';note.textContent='dubbed → '+cur.lang+' · pick "original audio" + Dub to remove';}
  let poll=null;
  const stopPoll=()=>{if(poll){clearInterval(poll);poll=null;}};
  go.onclick=async()=>{
   const lang=sel.value;
   if(!confirm(lang?('Dub '+ED.slug+' '+ED.v.toUpperCase()+' → '+sel.selectedOptions[0].text+'?\\nAI voice, ~5–15 min on CPU. Runs in the background.'):('Remove the dub and go back to the original audio?')))return;
   go.disabled=true;go.textContent=lang?'dubbing…':'removing…';note.textContent='started — you can keep working; this runs in the background';
   await fetch('/api/dub',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug:ED.slug,v:ED.v,lang})});
   stopPoll();
   poll=setInterval(async()=>{
    try{
     const j=await (await fetch('/api/dub-status?slug='+ED.slug+'&v='+ED.v)).json();
     const tail=(j.log||'').trim().split('\\n').pop()||'';
     note.textContent=tail.slice(0,80);
     if(/dub done|dub failed/.test(j.log)){stopPoll();go.disabled=false;go.textContent=lang?'Re-dub':'Dub';
       if(/dub done/.test(j.log)){note.textContent=lang?('✓ dubbed → '+lang+' — re-render to hear it'):'✓ back to original audio';
         if(ED.base){ED.base.dub=lang?{lang,src:'footage/dub/'+ED.slug+'-'+ED.v+'-'+lang+'.m4a'}:null;livePreviewSync();}}
       else note.textContent='✗ dub failed — check the terminal';}
    }catch(e){}
   },5000);
  };
 })();
 const langSel=document.getElementById('ed-lang');
 if(langSel)langSel.addEventListener('change',async e=>{
  const lang=e.target.value;const note=document.getElementById('ed-pvnote');
  const was=note?note.textContent:'';if(note){note.textContent='translating captions to '+e.target.selectedOptions[0].text+'…';note.style.color='#e0a860';}
  langSel.disabled=true;
  try{
   const r=await (await fetch('/api/caption-lang',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug:ED.slug,v:ED.v,lang})})).json();
   if(r.ok&&r.data){ED.base=r.data;livePreviewSync();}
   else if(note){note.textContent='translation failed: '+(r.error||'?');note.style.color='#ff9b9b';}
  }catch(err){if(note){note.textContent='translation failed';note.style.color='#ff9b9b';}}
  langSel.disabled=false;
  if(note&&note.style.color==='rgb(224, 168, 96)'){note.textContent=was;note.style.color='#3fb950';}
 });
}
function renderTL(){
 const z=ED.zoom, W=Math.max(600,totalDur()*z+40);
 let x=0,segs='';
 ED.clips.forEach((c,i)=>{const w=cdur(c)*z;
   const isPiece=c.srcId!==c.id;
   segs+='<div class="seg'+(ED.sel===c.id?' sel':'')+(isPiece?' pc':'')+'" data-id="'+c.id+'" style="left:'+x+'px;width:'+w+'px">'+
     '<div class="h l"></div><div class=lbl>'+esc(c.name)+(isPiece?' ·'+(i+1):'')+'</div><div class=sub>'+c.in.toFixed(1)+'–'+c.out.toFixed(1)+' ('+cdur(c).toFixed(1)+'s)</div><div class="h r"></div></div>';
   x+=w;});
 // caption blocks at their LIVE positions (from the same mapping the player uses)
 let caps='';
 try{
  const d=buildLiveData();
  if(d)for(const cp of d.tracks.captions)caps+='<div class="capseg'+(NEG.test(cp.text)?' neg':'')+'" style="left:'+(cp.start*z)+'px;width:'+Math.max(20,(cp.end-cp.start)*z)+'px" title="'+esc(cp.text)+'">'+esc(cp.text.slice(0,14))+'</div>';
 }catch(e){}
 if(!caps)ED.caps.forEach(c=>{if(ED.capDel&&ED.capDel[c.id])return;caps+='<div class="capseg" style="left:'+(c.t*z)+'px;width:'+Math.max(24,z*1.2)+'px" title="'+esc(ED.capEdits[c.id]??c.text)+'">'+esc((ED.capEdits[c.id]??c.text).slice(0,12))+'</div>';});
 let ruler='';for(let s=0;s<=totalDur()+5;s+=5)ruler+='<div class=tick style="left:'+(s*z)+'px">'+s+'s</div>';
 document.getElementById('ed-inner').innerHTML=
   '<div class=ruler style="width:'+W+'px" id=ed-ruler>'+ruler+'</div>'+
   '<div class="track vid" style="width:'+W+'px" id=ed-vtrack>'+segs+'</div>'+
   '<div class="track cap" style="width:'+W+'px">'+caps+'</div>'+
   '<div class=playhead id=ed-ph style="height:120px;left:'+(ED.playT*z)+'px"></div>';
 document.getElementById('ed-dur').textContent='~'+totalDur().toFixed(1)+'s';
 livePreviewSync();
}
function movePlayhead(){const ph=document.getElementById('ed-ph');if(ph)ph.style.left=(ED.playT*ED.zoom)+'px';}
function bindTL(){
 const inner=document.getElementById('ed-inner');
 // seek on ruler / track click
 inner.addEventListener('pointerdown',ev=>{
  const seg=ev.target.closest('.seg');
  if(!seg){ // ruler/empty → seek
   const r=inner.getBoundingClientRect();const t=Math.max(0,(ev.clientX-r.left+inner.parentElement.scrollLeft)/ED.zoom);
   ED.playT=t;movePlayhead();try{ED.player&&ED.player.seek(t);}catch(e){}
   return;
  }
  const id=seg.dataset.id;ED.sel=id;
  if(ev.target.classList.contains('h')){ // trim
   const edge=ev.target.classList.contains('l')?'in':'out';const c=ED.clips.find(x=>x.id===id);
   const sx=ev.clientX,i0=c.in,o0=c.out;
   const mv=e2=>{const d=(e2.clientX-sx)/ED.zoom;
    if(edge==='in')c.in=Math.min(c.out-0.3,Math.max(0,i0+d));
    else c.out=Math.max(c.in+0.3,o0+d);renderTL();};
   const up=()=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);renderTL();};
   document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);ev.preventDefault();return;
  }
  // drag body → reorder
  const sx=ev.clientX;let moved=false;seg.classList.add('dragging');
  const mv=e2=>{const d=e2.clientX-sx;if(Math.abs(d)>3)moved=true;seg.style.transform='translateX('+d+'px)';
   // find target index by pointer x among segment centers
   const segsEls=[...inner.querySelectorAll('.seg')];const cx=e2.clientX;
   let ti=segsEls.length-1;for(let k=0;k<segsEls.length;k++){const rr=segsEls[k].getBoundingClientRect();if(cx<rr.left+rr.width/2){ti=k;break;}}
   seg._ti=ti;};
  const up=()=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);
   seg.classList.remove('dragging');seg.style.transform='';
   if(moved&&seg._ti!=null){const from=ED.clips.findIndex(x=>x.id===id);let to=seg._ti;const c=ED.clips.splice(from,1)[0];if(to>from)to--;ED.clips.splice(to,0,c);}
   renderTL();};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);
 });
 renderTL();
}
function edKey(e){
 if(!ED)return;
 if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT'))return;
 if(e.key==='Escape'){closeEd();return;}
 if((e.key==='Delete'||e.key==='Backspace')&&ED.sel){edDelete();return;}
 if(e.key==='s'&&ED.sel){edSplit();return;}
 if(e.key===' '){e.preventDefault();try{ED.player&&(ED.player.playing?ED.player.pause():ED.player.play());}catch(x){}}
}
// turn the live ED.clips timeline into a minimal, ordered op list for proj-op.
// SPLITS first (server ids become <src>, <src>b, <src>bb…), then DELETES, then
// TRIMs on the resulting pieces, then MOVEs (ascending target index).
function computeOps(){
 const orig=ED.orig.clips, ops=[], moves=[], serverId={};
 const bySrc={};
 ED.clips.forEach(c=>{(bySrc[c.srcId]=bySrc[c.srcId]||[]).push(c);});
 const splitAt=ED.splitAt||{};
 for(const o of orig){
  const parts=(bySrc[o.id]||[]).slice().sort((a,b)=>a.in-b.in);
  if(!parts.length)continue;
  // split points come from edSplit's explicit record (geometry is unreliable once
  // pieces are trimmed apart). Recreate the partition, predict server ids.
  const cuts=(splitAt[o.id]||[]).map(Number).filter(x=>x>o.in+0.06&&x<o.out-0.06).sort((a,b)=>a-b);
  let sid=o.id;
  cuts.forEach((at,k)=>{ops.push({op:'split',clip:sid,at:+at.toFixed(3)});sid=o.id+'b'.repeat(k+1);});
  const slots=[o.in,...cuts,o.out];               // slots[k]..slots[k+1] → id o.id+'b'*k
  const used=new Set();
  for(let k=0;k<slots.length-1;k++){
   const lo=slots[k],hi=slots[k+1],mid=(lo+hi)/2,gid=o.id+'b'.repeat(k);
   // the piece whose original range covered this slot (its centre falls inside)
   const piece=parts.find((p,pi)=>!used.has(pi)&&((p.in<=mid+0.06&&p.out>=mid-0.06)||Math.abs(p.in-lo)<0.12));
   if(!piece){ops.push({op:'delete',clip:gid});continue;}
   used.add(parts.indexOf(piece));
   serverId[piece.id]=gid;
   if(Math.abs(piece.in-lo)>0.05||Math.abs(piece.out-hi)>0.05)
    ops.push({op:'trim',clip:gid,in:+piece.in.toFixed(3),out:+piece.out.toFixed(3)});
  }
 }
 for(const o of orig)if(!(bySrc[o.id]||[]).length)ops.push({op:'delete',clip:o.id});
 ED.clips.forEach((c,i)=>{const gid=serverId[c.id]||c.srcId;moves.push({op:'move',clip:gid,to:i});});
 moves.sort((a,b)=>a.to-b.to);
 return ops.concat(moves);
}
function edDelete(){if(!ED.sel)return;if(ED.clips.length<=1){alert('keep at least one clip');return;}ED.clips=ED.clips.filter(c=>c.id!==ED.sel);ED.sel=null;renderTL();}
function edSplit(){
 let pt=ED.playT;try{if(ED.player){const s=ED.player.getSeconds();if(s>0)pt=s;}}catch(e){}
 ED.playT=pt;movePlayhead();
 let acc=0;for(const c of ED.clips){const w=cdur(c);if(pt>=acc-0.001&&pt<acc+w){
  const at=+(c.in+(pt-acc)).toFixed(3);
  if(at-c.in<0.4||c.out-at<0.4){alert('too close to a clip edge to split there');return;}
  const nc={id:'p'+(ED._pc=(ED._pc||0)+1),srcId:c.srcId,name:c.name,in:at,out:c.out};
  c.out=at;
  ED.clips.splice(ED.clips.indexOf(c)+1,0,nc);
  ED.splitAt=ED.splitAt||{};
  ED.splitAt[c.srcId]=[...new Set([...(ED.splitAt[c.srcId]||[]),at])].sort((a,b)=>a-b);
  ED.sel=nc.id;renderTL();return;}
  acc+=w;}
 alert('move the playhead onto a clip first (click the timeline)');
}
document.getElementById('ov').addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||!ED)return;
 if(b.classList.contains('capx')){
  const cid=b.dataset.cid;ED.capDel=ED.capDel||{};
  if(ED.capDel[cid])delete ED.capDel[cid];else ED.capDel[cid]=1;
  b.parentElement.classList.toggle('del',!!ED.capDel[cid]);
  livePreviewSync();return;
 }
 if(b.id==='ed-x'||b.id==='ed-cancel'){closeEd();return;}
 if(b.id==='ed-zin'){ED.zoom=Math.min(40,ED.zoom*1.4);renderTL();return;}
 if(b.id==='ed-zout'){ED.zoom=Math.max(3,ED.zoom/1.4);renderTL();return;}
 if(b.id==='ed-del'){edDelete();return;}
 if(b.id==='ed-split'){edSplit();return;}
 if(b.id==='ed-reset'){try{ED.player&&ED.player.destroy();}catch(e){}ED.player=null;ED.clips=ED.orig.clips.map(c=>({id:c.id,srcId:c.id,name:c.name,in:c.in,out:c.out}));ED.capEdits={};ED.capDel={};ED.splitAt={};ED._pc=0;ED.sel=null;ED.title=ED.orig.title;buildEditor();return;}
 if(b.id==='ed-apply'||b.id==='ed-apply-postnow'||b.id==='ed-apply-cal'){
  const post=b.id==='ed-apply-postnow'?'postnow':b.id==='ed-apply-cal'?'cal':null;
  const scope=ED.v==='b'?'trial':'main';
  if(post&&!confirm((post==='postnow'?'PUBLISH NOW':'Add to calendar')+' — '+ED.slug+' '+scope+' after applying these edits?'))return;
  ED.title=document.getElementById('ed-title').value;
  document.querySelectorAll('#ed-caps input[data-cid]').forEach(i=>{const o=ED.orig.captions.find(c=>c.id===i.dataset.cid);if(o&&i.value!==o.text)ED.capEdits[i.dataset.cid]=i.value;});
  const ops=computeOps();
  b.textContent='working…';b.disabled=true;
  await fetch('/api/apply',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug:ED.slug,v:ED.v,title:ED.title,ops,captions:ED.capEdits,dropCaptions:Object.keys(ED.capDel||{}),then:post})});
  closeEd();load();return;
 }
});

// ---- inline card title rename ----
document.addEventListener('click',e=>{
 const t=e.target.closest('.cardtitle');if(!t||t.querySelector('input'))return;
 const slug=t.dataset.slug, old=t.textContent;
 const i=document.createElement('input');i.value=old;i.className='cardtitle-in';
 t.textContent='';t.appendChild(i);i.focus();i.select();
 const done=async(save)=>{
  const val=i.value.trim();
  t.textContent=save&&val?val:old;
  if(save&&val&&val!==old){
   await fetch('/api/card-edit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,title:val})});
   load();
  }
 };
 i.onblur=()=>done(true);
 i.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();i.blur();}if(ev.key==='Escape'){i.onblur=null;done(false);}};
});

// ---- quick-edit panel: title + captions inline on the card, no fullscreen ----
async function openQuickEdit(slug,v){
 const box=document.getElementById('qed-'+slug);
 if(!box.hidden && box.dataset.v===v){box.hidden=true;return;}
 box.dataset.v=v;box.hidden=false;box.innerHTML='<div class=qed-load>loading '+(v==='b'?'trial':'main')+'…</div>';
 let d;try{d=await (await fetch('/api/project?slug='+slug+'&v='+v)).json();}catch(e){box.innerHTML='<div class=qed-load>could not load</div>';return;}
 if(d.error){box.innerHTML='<div class=qed-load>'+esc(d.error)+'</div>';return;}
 box.innerHTML=
  '<div class=qed-hd><b>Quick-edit '+(v==='b'?'TRIAL':'MAIN')+'</b> — text only; use Timeline for clip cuts</div>'+
  '<label class=qed-row><span>title</span><input class=qed-title value="'+esc(d.title)+'"></label>'+
  '<div class=qed-caps>'+d.captions.map(c=>'<div class=qed-cap><b>'+c.t+'s</b><input data-cid="'+c.id+'" value="'+esc(c.text)+'"><button class=qed-x data-cid="'+c.id+'">×</button></div>').join('')+'</div>'+
  '<div class=qed-act><button class="b main qed-save">Save + re-render</button><button class="b warn qed-close">Close</button></div>';
 box._orig={title:d.title,caps:Object.fromEntries(d.captions.map(c=>[c.id,c.text]))};
 box._del={};
}
document.addEventListener('click',async e=>{
 const qb=e.target.closest('button[data-qe]');
 if(qb){openQuickEdit(qb.closest('[data-slug]').dataset.slug,qb.dataset.qe);return;}
 const box=e.target.closest('.qed');
 if(box){
  const slug=box.id.replace('qed-',''),v=box.dataset.v;
  if(e.target.classList.contains('qed-x')){
   const cid=e.target.dataset.cid;box._del[cid]=!box._del[cid];
   e.target.parentElement.classList.toggle('del',box._del[cid]);return;
  }
  if(e.target.classList.contains('qed-close')){box.hidden=true;return;}
  if(e.target.classList.contains('qed-save')){
   const title=box.querySelector('.qed-title').value.trim();
   const caps={};box.querySelectorAll('input[data-cid]').forEach(i=>{const cid=i.dataset.cid;if(i.value!==box._orig.caps[cid])caps[cid]=i.value;});
   const drop=Object.keys(box._del).filter(k=>box._del[k]);
   e.target.textContent='working…';e.target.disabled=true;
   await fetch('/api/apply',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,v,title,ops:[],captions:caps,dropCaptions:drop})});
   box.hidden=true;load();
  }
 }
});

document.addEventListener('click',async e=>{
 const btn=e.target.closest('button[data-a]');if(!btn)return;
 const slug=btn.closest('[data-slug]').dataset.slug, a=btn.dataset.a;
 if(a==='edit'){openEdit(slug,btn.dataset.v);return;}
 if(a.startsWith('postnow_')||a.startsWith('cal_')){
  const trk=a.split('_')[1];
  const now=a.startsWith('postnow_');
  if(!confirm((now?'PUBLISH NOW':'Add to content calendar')+' — '+slug+' ('+trk+')?\\n'+(now?'Final render + goes live ~10 min from now on all platforms.':'Renders final + schedules for the next free '+(trk==='trial'?'night':'morning')+' slot.')))return;
  // optimistic: show the change on the card straight away
  const card=btn.closest('.card');const bd=card&&card.querySelector(trk==='trial'?'.bd-t':'.bd-m');
  if(bd){bd.className='badge b-scheduling';bd.textContent='scheduling';}
  card&&card.querySelectorAll('button[data-a="postnow_'+trk+'"],button[data-a="cal_'+trk+'"]').forEach(b=>b.style.display='none');
 }
 const changes=a==='changes'?document.getElementById('ta-'+slug).value:undefined;
 await fetch('/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,action:a,changes})});
 load();
});
load();
ensurePreviewLib();
setInterval(()=>{
 if(VIEW!=='review'||document.querySelector('.ep.on'))return;
 if(document.querySelector('.qed:not([hidden]),.cardtitle-in'))return;  // mid inline-edit
 const rendering=!!document.querySelector('.rpb');
 if(rendering||!anyPlaying())load();          // during a render, refresh even mid-playback
},2500);
</script></body></html>`;

const server = createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(HTML);
  }
  if (u.pathname === "/api/list") {
    let batch = null;
    if (existsSync(join(B, "BATCH_LOCK"))) {
      try {
        const st = JSON.parse(readFileSync(join(B, "recut-state.json"), "utf8"));
        batch = { running: true, done: Object.keys(st.done || {}).length, failed: Object.keys(st.failed || {}).length };
      } catch {
        batch = { running: true, done: 0, failed: 0 };
      }
    }
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ held: existsSync(join(B, "HOLD")), warm: isWarm(), batch, videos: listVideos() }));
  }
  if (u.pathname === "/api/published") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(await shortsyncFeed()));
  }
  if (u.pathname === "/api/scheduled") {
    rev = loadRev();
    const q = loadQueue();
    const rows = [];
    for (const [slug, st] of Object.entries(rev)) {
      const idx = q.findIndex((x) => x.slug === slug);
      const base = { slug, n: idx + 1, title: q[idx]?.title || slug, day: st.day, date: st.day ? dateForDay(st.day) : null };
      if (["scheduled", "scheduling", "published"].includes(st.m)) rows.push({ ...base, track: "main", status: st.m, mp4: preview(slug, "A") });
      if (["scheduled", "scheduling", "published"].includes(st.t)) rows.push({ ...base, track: "trial", status: st.t, mp4: preview(slug, "B") });
    }
    rows.sort((a, b) => (a.day || 0) - (b.day || 0));
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(rows));
  }
  if (u.pathname === "/api/project" && req.method === "GET") {
    const d = readProject(u.searchParams.get("slug"), u.searchParams.get("v") || "a");
    res.writeHead(d ? 200 : 404, { "content-type": "application/json" });
    return res.end(JSON.stringify(d || { error: "no project" }));
  }
  // full ProjectData (video/title/caption tracks + presets) for the instant <Player>
  if (u.pathname === "/api/livedata" && req.method === "GET") {
    try {
      const proj = `${u.searchParams.get("slug")}-${u.searchParams.get("v") || "a"}`;
      const d = projectToData(proj);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(d));
    } catch (e) {
      res.writeHead(404, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: String(e.message) }));
    }
  }
  // the esbuild-bundled <Player> mount
  if (u.pathname === "/editor-preview.js") {
    const f = join(ROOT, "scratch", "editor-preview", "bundle.js");
    if (!existsSync(f)) {
      res.writeHead(503);
      return res.end("// editor preview not built yet");
    }
    res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
    return res.end(readFileSync(f));
  }
  // static assets the <Player> pulls via staticFile(): source clips + flag SVGs
  if (/^\/(footage|twemoji|fonts)\//.test(u.pathname)) {
    const rel = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    const f = join(ROOT, "public", rel);
    if (!f.startsWith(join(ROOT, "public")) || !existsSync(f)) {
      res.writeHead(404);
      return res.end();
    }
    const ext = f.split(".").pop().toLowerCase();
    const ct = { mp4: "video/mp4", mov: "video/quicktime", mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", svg: "image/svg+xml", woff2: "font/woff2", woff: "font/woff", png: "image/png", jpg: "image/jpeg" }[ext] || "application/octet-stream";
    const size = statSync(f).size;
    const range = req.headers.range;
    if (range && (ext === "mp4" || ext === "mov" || ext === "mp3" || ext === "m4a" || ext === "wav")) {
      const [s, e] = range.replace("bytes=", "").split("-");
      const start = parseInt(s, 10);
      const end = e ? parseInt(e, 10) : size - 1;
      res.writeHead(206, { "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes", "content-length": end - start + 1, "content-type": ct });
      return createReadStream(f, { start, end }).pipe(res);
    }
    res.writeHead(200, { "content-length": size, "content-type": ct });
    return createReadStream(f).pipe(res);
  }
  // caption language switch: translate (if needed) + set caption_lang, return fresh livedata
  if (u.pathname === "/api/caption-lang" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", async () => {
      const { slug, v, lang } = JSON.parse(body || "{}");
      const proj = `${slug}-${v || "a"}`;
      const run = (args) =>
        new Promise((resolve) => {
          const p = spawn(process.execPath, [join(ROOT, "scripts", "proj-op.mjs"), proj, ...args], { cwd: ROOT });
          let out = "";
          p.stdout.on("data", (d) => (out += d));
          p.stderr.on("data", (d) => (out += d));
          p.on("close", (code) => resolve({ code, out }));
        });
      try {
        if (lang && lang !== "src") {
          const t = await run(["translate_captions", "--lang", lang]);
          if (t.code !== 0) throw new Error(t.out.split("\n").filter(Boolean).pop());
        }
        const s = await run(["set_caption_lang", "--lang", lang || "src"]);
        if (s.code !== 0) throw new Error(s.out.split("\n").filter(Boolean).pop());
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, data: projectToData(proj) }));
      } catch (e) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
      }
    });
    return;
  }
  if (u.pathname === "/api/music/list") {
    let cat = [];
    try { cat = JSON.parse(readFileSync(join(ROOT, "projects/_assets/music/catalog.json"), "utf8")); } catch {}
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(cat));
  }
  if (u.pathname.startsWith("/media-music/")) {
    const f = join(ROOT, "projects/_assets/music", decodeURIComponent(u.pathname.slice(13)));
    if (!f.startsWith(join(ROOT, "projects/_assets/music")) || !existsSync(f)) { res.writeHead(404); return res.end(); }
    const size = statSync(f).size, range = req.headers.range;
    if (range) {
      const [a, b] = range.replace("bytes=", "").split("-");
      const st = parseInt(a, 10), en = b ? parseInt(b, 10) : size - 1;
      res.writeHead(206, { "content-range": `bytes ${st}-${en}/${size}`, "accept-ranges": "bytes", "content-length": en - st + 1, "content-type": "audio/mpeg" });
      return createReadStream(f, { start: st, end: en }).pipe(res);
    }
    res.writeHead(200, { "content-length": size, "content-type": "audio/mpeg" });
    return createReadStream(f).pipe(res);
  }
  if (u.pathname === "/api/music" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", async () => {
      const { slug, v, track, vol, duck } = JSON.parse(body || "{}");
      const proj = `${slug}-${v || "a"}`;
      const run = (args) => new Promise((rz) => {
        const c = spawn(process.execPath, [join(ROOT, "scripts", "proj-op.mjs"), proj, ...args], { cwd: ROOT });
        let o = ""; c.stdout.on("data", (d) => (o += d)); c.stderr.on("data", (d) => (o += d));
        c.on("close", (code) => rz({ code, o }));
      });
      let r;
      if (track === "" || track == null) r = await run(["clear_music"]);
      else r = await run(["set_music", "--track", track, "--vol", String(vol ?? 0.1), "--duck", duck === false ? "false" : "true"]);
      if (r.code === 0) rerenderPreview(slug, v || "a", "music ");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: r.code === 0, out: r.o.slice(-400) }));
    });
    return;
  }
  if (u.pathname === "/api/card-edit" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", async () => {
      const { slug, title } = JSON.parse(body || "{}");
      if (title && title.trim()) {
        // rename applies to both variations + the queue entry, then re-renders
        try {
          const qp = join(B, "queue.json");
          const q = JSON.parse(readFileSync(qp, "utf8"));
          const e = q.find((x) => x.slug === slug);
          if (e) { e.title = title.trim(); writeFileSync(qp, JSON.stringify(q, null, 2)); }
        } catch { /* noop */ }
        for (const v of ["a", "b"]) {
          if (!existsSync(projJson(`${slug}-${v}`))) continue;
          await runOp(`${slug}-${v}`, ["set_title_text", "--text", title.trim()]);
          rerenderPreview(slug, v, "renamed ");
        }
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }
  if (u.pathname === "/api/dub" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      const { slug, v, lang } = JSON.parse(body || "{}");
      const proj = `${slug}-${v || "a"}`;
      const logP = join(B, `dub-${proj}.log`);
      writeFileSync(logP, lang ? `dubbing ${proj} → ${lang}…\n` : `removing dub…\n`);
      const dubArgs = lang ? [proj, "--lang", lang] : [proj, "--remove"];
      const c = spawn(process.execPath, [join(ROOT, "scripts", "dub.mjs"), ...dubArgs], { cwd: ROOT });
      const app = (d) => { try { writeFileSync(logP, readFileSync(logP, "utf8") + d); } catch { /* noop */ } };
      c.stdout.on("data", app);
      c.stderr.on("data", app);
      c.on("close", (code) => {
        app(code ? `\n✗ dub failed (exit ${code})\n` : `\n✓ dub done\n`);
        if (code === 0) rerenderPreview(slug, v || "a", lang ? `dub ${lang} ` : "un-dub ");
      });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, started: true }));
    });
    return;
  }
  if (u.pathname === "/api/dub-status") {
    const proj = `${u.searchParams.get("slug")}-${u.searchParams.get("v") || "a"}`;
    const f = join(B, `dub-${proj}.log`);
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ log: existsSync(f) ? readFileSync(f, "utf8").slice(-800) : "" }));
  }
  if (u.pathname === "/api/apply" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", async () => {
      const { slug, v, title, ops, captions, dropCaptions, then } = JSON.parse(body || "{}");
      await applyProject(slug, v || "a", { title, ops: ops || [], captions: captions || {}, dropCaptions: dropCaptions || [], skipPreview: !!then });
      if (then === "postnow" || then === "cal") {
        const scope = (v || "a") === "b" ? "trial" : "main";
        rev = loadRev();
        rev[slug] = { ...(rev[slug] || {}), status: "" };
        saveRev(rev);
        scheduleVideo(slug, scope, then === "postnow" ? "now" : "calendar");
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }
  if (u.pathname === "/api/action" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      const { slug, action, changes } = JSON.parse(body || "{}");
      rev = loadRev();
      if (action === "changes") rev[slug] = { ...(rev[slug] || {}), status: "changes_requested", changes: changes || "" };
      else if (action === "reject") rev[slug] = { ...(rev[slug] || {}), status: "rejected" };
      else if (action === "archive") rev[slug] = { ...(rev[slug] || {}), archived: true };
      else if (action === "unarchive") rev[slug] = { ...(rev[slug] || {}), archived: false };
      else if (/^(postnow|cal)_(main|trial)$/.test(action || "")) {
        const [mode, scope] = action.split("_");
        const track = scope === "trial" ? "t" : "m";
        if (["scheduling", "scheduled", "published"].includes(rev[slug]?.[track])) {
          res.writeHead(200, { "content-type": "application/json" });
          return res.end(JSON.stringify({ ok: false, msg: track + " already " + rev[slug][track] }));
        }
        rev[slug] = { ...(rev[slug] || {}), status: "" };
        saveRev(rev);
        scheduleVideo(slug, scope, mode === "postnow" ? "now" : "calendar");
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify({ ok: true }));
      }
      saveRev(rev);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }
  if (u.pathname.startsWith("/media/")) {
    const f = join(PREV, decodeURIComponent(u.pathname.slice(7)));
    if (!f.startsWith(PREV) || !existsSync(f)) {
      res.writeHead(404);
      return res.end();
    }
    const size = statSync(f).size;
    const range = req.headers.range;
    if (range) {
      const [s, e] = range.replace("bytes=", "").split("-");
      const start = parseInt(s, 10);
      const end = e ? parseInt(e, 10) : size - 1;
      res.writeHead(206, { "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes", "content-length": end - start + 1, "content-type": "video/mp4" });
      return createReadStream(f, { start, end }).pipe(res);
    }
    res.writeHead(200, { "content-length": size, "content-type": "video/mp4" });
    return createReadStream(f).pipe(res);
  }
  res.writeHead(404);
  res.end();
});
mkdirSync(PREV, { recursive: true });
server.listen(PORT, () => {
  console.log(`\n  Reel review → http://localhost:${PORT}\n`);
  // build the instant-<Player> bundle for the editor (esbuild, ~1s)
  const bp = spawn(process.execPath, [join(ROOT, "scripts", "build-editor-preview.mjs")], { cwd: ROOT });
  bp.stdout.on("data", (d) => process.stdout.write(String(d)));
  bp.stderr.on("data", (d) => process.stderr.write(String(d)));
  // warm the MP4 render bundle in the background so Apply/Publish renders are faster
  warmup().catch((e) => console.warn("warm bundle failed:", e.message));
});

const bye = async () => {
  try {
    await shutdownLive();
  } catch {
    /* noop */
  }
  process.exit(0);
};
process.on("SIGINT", bye);
process.on("SIGTERM", bye);
