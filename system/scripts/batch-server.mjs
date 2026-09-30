#!/usr/bin/env node
// BATCH-SERVER — watch a batch and post it, one tap per video.
//
//   node scripts/batch-server.mjs [slug] ["<VIDEOS OUT folder>"] [--port 4200]
//   (defaults: israel-batch, VIDEOS OUT/2026-09-29 israel batch)
//
// Tal, 2026-09-30: *"I just need them in my index so I can tap, view them, and
// tap a button - post to all platforms now, or post to the trial schedule."*
//
// The static index.html can't run anything, so this serves the same batch at
// http://localhost:4200 with two buttons per video:
//   POST NOW      -> publish.mjs post <file> --platforms <all connected> --confirm
//   TRIAL REEL    -> publish.mjs trial <file> --at <next free trial slot> --confirm
//                    slots: 3 a day, 07:00 / 16:00 / 22:00 Israel time (Instagram
//                    blocked trials at 6/day - memory trial-reels-rate-and-lost-state)
// Every send asks "are you sure" in the browser first; nothing posts on its own.
// Only 1080x1920 files can be sent - a preview is refused by the server.
//
// Posting goes through ShortSync. Its key lives in
// projects/_publish/shortsync.config.json (gitignored). If it is missing the
// page shows a box where TAL pastes it; Claude never types it.
//
// State (what was posted / scheduled, and the trial slots taken) is kept in
// projects/<slug>/posting.json so a reload shows it.
import http from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, createReadStream } from "node:fs";
import { join, basename } from "node:path";
import { spawn, execFileSync, exec } from "node:child_process";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const a = process.argv.slice(2).filter((x, i, arr) => !x.startsWith("--") && !(arr[i - 1] === "--port"));
const slug = a[0] ?? "israel-batch";
const outDir = a[1] ?? join(ROOT, "..", "VIDEOS OUT", "2026-09-29 israel batch");
const PORT = Number(process.argv.includes("--port") ? process.argv[process.argv.indexOf("--port") + 1] : 4200);
const PUB = join(ROOT, "projects", "_publish");
const CFG = join(PUB, "shortsync.config.json");
const STATE = join(ROOT, "projects", slug, "posting.json");
const SLOTS_H = [7, 16, 22];
const TZ = "+03:00"; // Israel (IDT until late October)

const readJSON = (p, d) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return d; } };
const state = () => readJSON(STATE, { videos: {}, trialSlots: [] });
const saveState = (s) => writeFileSync(STATE, JSON.stringify(s, null, 1));
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function videos() {
  const mf = join(ROOT, "projects", slug, "manifest.jsonl");
  const byFile = new Map();
  for (const l of readFileSync(mf, "utf8").split(/\r?\n/).filter(Boolean)) {
    try { const r = JSON.parse(l); const f = basename(String(r.file || "")); if (f && existsSync(join(outDir, f))) byFile.set(f, { ...r, file: f }); } catch {}
  }
  return [...byFile.values()];
}

const sizeCache = new Map();
function isFull(file) {
  const p = join(outDir, file);
  const k = p + statSync(p).mtimeMs;
  if (!sizeCache.has(k)) {
    let wh = "";
    try { wh = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", p], { encoding: "utf8" }).trim(); } catch {}
    sizeCache.set(k, wh === "1080,1920");
  }
  return sizeCache.get(k);
}

// next free trial slot: 07/16/22 Israel time, at least 45 minutes from now
function nextTrialSlot(taken) {
  const now = Date.now() + 45 * 60e3;
  const t = new Set(taken);
  for (let d = 0; d < 60; d++) {
    const day = new Date(Date.now() + d * 864e5);
    const ymd = day.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
    for (const h of SLOTS_H) {
      const iso = `${ymd}T${String(h).padStart(2, "0")}:00:00${TZ}`;
      if (Date.parse(iso) > now && !t.has(iso)) return iso;
    }
  }
  throw new Error("no free trial slot in the next 60 days");
}

function runPublish(args) {
  return new Promise((resolve) => {
    const p = spawn("node", ["scripts/publish.mjs", ...args], { cwd: ROOT });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("close", (code) => resolve({ code, out }));
  });
}

function page() {
  const vids = videos();
  const st = state();
  const connected = existsSync(CFG);
  const groups = new Map();
  for (const v of vids) {
    const g = (v.title || v.file).replace(/\s*-\s*V\d+.*$/i, "").replace(/\n/g, " ");
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(v);
  }
  for (const l of groups.values()) l.sort((x, y) => String(x.variant).localeCompare(String(y.variant)));
  const ordered = [...groups.entries()].sort((x, y) => (x[1][0].type === "compilation") - (y[1][0].type === "compilation") || x[0].localeCompare(y[0]));
  const fmt = (d) => (d ? `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, "0")}` : "");
  const caption = (v) => String(v.title || "").replace(/^POV:\s*/i, "POV: ").replace(/\s*\n\s*/g, " ").trim();
  const card = (v) => {
    const s = st.videos[v.file];
    const full = isFull(v.file);
    const done = s ? `<div class="done ${s.kind}">${s.kind === "post" ? "Posted" : "Trial scheduled"} ${esc(s.when ? new Date(s.when).toLocaleString("en-GB", { timeZone: "Asia/Jerusalem", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "")}</div>` : "";
    return `<article class="vid${v.status === "needs-tal" ? " tal" : ""}" data-file="${esc(v.file)}">
      <video controls preload="metadata" playsinline src="/v/${encodeURIComponent(v.file)}#t=0.5"></video>
      <div class="meta">
        <div class="row"><b>${esc(v.variant || "")}</b><span class="dur">${fmt(v.duration)}</span>
          ${v.status === "needs-tal" ? `<span class="badge">Your call</span>` : ""}
          ${full ? "" : `<span class="pv">Preview only</span>`}</div>
        ${v.hook ? `<p class="hook">“${esc(String(v.hook).slice(0, 110))}”</p>` : ""}
        ${v.status === "needs-tal" && v.note ? `<details><summary>Why it's your call</summary><p>${esc(String(v.note).slice(0, 600))}</p></details>` : ""}
        <textarea rows="2" aria-label="Caption">${esc(caption(v))}</textarea>
        ${done}
        <div class="btns">
          <button class="post" ${full && connected ? "" : "disabled"}>Post to all now</button>
          <button class="trial" ${full && connected ? "" : "disabled"}>Schedule trial</button>
        </div>
        <pre class="log" hidden></pre>
      </div></article>`;
  };
  const sections = ordered.map(([g, list]) => `<section class="story"><h2>${esc(g)} <span>${list[0].type === "compilation" ? "Compilation" : "One person"}</span></h2><div class="grid">${list.map(card).join("")}</div></section>`).join("");
  const nPosted = Object.values(st.videos).filter((x) => x.kind === "post").length;
  const nTrial = Object.values(st.videos).filter((x) => x.kind === "trial").length;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>All Videos</title><style>
:root{--bg:#f6f5f2;--card:#fff;--ink:#1c1b19;--mute:#6b675f;--line:#e4e1da;--accent:#0b6e4f;--warn:#b25b00;--trial:#5b3fb5}
@media (prefers-color-scheme:dark){:root{--bg:#141413;--card:#1e1e1c;--ink:#f1efe9;--mute:#a19d94;--line:#2f2e2b;--accent:#3fbf8f;--warn:#f0a44b;--trial:#a58cf0}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,-apple-system,Segoe UI,sans-serif}
header.top{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:14px 16px}
header.top h1{margin:0;font-size:20px}header.top p{margin:4px 0 0;color:var(--mute);font-size:13px}
.setup{margin:16px;padding:16px;border:1px solid var(--warn);border-radius:10px;background:var(--card)}
.setup input{width:100%;padding:10px;margin:8px 0;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit}
main{padding:8px 16px 60px;max-width:1400px;margin:0 auto}.story{margin:22px 0}
.story h2{font-size:16px;margin:0 0 10px}.story h2 span{font-weight:400;color:var(--mute);font-size:13px;margin-left:6px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.vid{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.vid.tal{border-color:var(--warn)}video{width:100%;aspect-ratio:9/16;background:#000;display:block}
.meta{padding:10px;display:flex;flex-direction:column;gap:8px}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.dur{color:var(--mute)}.badge{background:var(--warn);color:#fff;border-radius:99px;padding:1px 8px;font-size:12px}
.pv{border:1px solid var(--mute);color:var(--mute);border-radius:99px;padding:0 8px;font-size:12px}
.hook{margin:0;color:var(--mute);font-size:13px}details{font-size:13px;color:var(--mute)}
textarea{width:100%;border:1px solid var(--line);border-radius:8px;padding:8px;font:inherit;font-size:13px;background:var(--bg);color:var(--ink);resize:vertical}
.btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}button{font:inherit;font-weight:600;border:0;border-radius:8px;padding:11px 6px;cursor:pointer;color:#fff}
button.post{background:var(--accent)}button.trial{background:var(--trial)}button:disabled{opacity:.35;cursor:not-allowed}
.done{font-size:13px;font-weight:600}.done.post{color:var(--accent)}.done.trial{color:var(--trial)}
.log{white-space:pre-wrap;font-size:11px;background:var(--bg);border-radius:6px;padding:6px;margin:0;max-height:160px;overflow:auto}
</style></head><body>
<header class="top"><h1>All videos · ${vids.length}</h1>
<p>Tap a video to watch. <b>Post to all now</b> goes to every connected platform immediately. <b>Schedule trial</b> books the next Instagram trial slot (07:00 / 16:00 / 22:00). ${nPosted} posted · ${nTrial} trials scheduled.</p></header>
${connected ? "" : `<div class="setup"><b>Posting isn't connected yet.</b> The ShortSync key was lost when the old projects folder was deleted. Paste your ShortSync API key (it starts with <code>ss_live_</code>) and the buttons switch on. It's saved only on this laptop.
<input id="key" type="password" autocomplete="off" placeholder="ss_live_..."><button class="post" id="savekey">Save key</button> <span id="keymsg"></span></div>`}
<main>${sections}</main>
<script>
const $=(s,e=document)=>e.querySelector(s);
document.querySelectorAll('video').forEach(v=>v.addEventListener('play',()=>document.querySelectorAll('video').forEach(o=>{if(o!==v)o.pause()})));
async function send(card,kind){
  const file=card.dataset.file, caption=$('textarea',card).value.trim();
  const what = kind==='post' ? 'POST NOW to all connected platforms' : 'SCHEDULE as an Instagram trial reel (next free slot)';
  if(!confirm(what+':\\n\\n'+file+'\\n\\nCaption: '+(caption||'(none)')+'\\n\\nSend it?')) return;
  const log=$('.log',card); log.hidden=false; log.textContent='Sending… (uploading can take a minute)';
  card.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{
    const r=await fetch('/api/'+kind,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({file,caption})});
    const j=await r.json(); log.textContent=(j.ok?'✓ ':'✗ ')+(j.message||'')+'\\n\\n'+(j.out||'');
    if(j.ok) setTimeout(()=>location.reload(),1500); else card.querySelectorAll('button').forEach(b=>b.disabled=false);
  }catch(e){log.textContent='✗ '+e; card.querySelectorAll('button').forEach(b=>b.disabled=false)}
}
document.querySelectorAll('.vid').forEach(c=>{$('.post',c).onclick=()=>send(c,'post');$('.trial',c).onclick=()=>send(c,'trial')});
const sk=$('#savekey'); if(sk) sk.onclick=async()=>{const key=$('#key').value.trim();const r=await(await fetch('/api/key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key})})).json();$('#keymsg').textContent=r.message;if(r.ok)setTimeout(()=>location.reload(),1200)};
</script></body></html>`;
}

const body = (req) => new Promise((res) => { let s = ""; req.on("data", (d) => (s += d)); req.on("end", () => { try { res(JSON.parse(s || "{}")); } catch { res({}); } }); });
const json = (res, o, code = 200) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  try {
    if (u.pathname === "/") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(page()); }

    if (u.pathname.startsWith("/v/")) {
      const f = basename(decodeURIComponent(u.pathname.slice(3)));
      const p = join(outDir, f);
      if (!f.endsWith(".mp4") || !existsSync(p)) { res.writeHead(404); return res.end(); }
      const size = statSync(p).size;
      const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
      if (m) {
        const start = m[1] ? +m[1] : 0, end = m[2] ? +m[2] : size - 1;
        res.writeHead(206, { "content-type": "video/mp4", "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
        return createReadStream(p, { start, end }).pipe(res);
      }
      res.writeHead(200, { "content-type": "video/mp4", "accept-ranges": "bytes", "content-length": size });
      return createReadStream(p).pipe(res);
    }

    if (u.pathname === "/api/key" && req.method === "POST") {
      const { key } = await body(req);
      if (!/^ss_(live|test)_[A-Za-z0-9_-]{8,}$/.test(String(key || ""))) return json(res, { ok: false, message: "That doesn't look like a ShortSync key (ss_live_…)." });
      mkdirSync(PUB, { recursive: true });
      const cfg = existsSync(CFG) ? readJSON(CFG, {}) : {};
      Object.assign(cfg, { api_key: key, default_platforms: cfg.default_platforms ?? ["instagram", "tiktok", "youtube", "facebook"], trial_platform: "instagram", rules: cfg.rules ?? { never_auto_post: true, min_gap_hours_between_posts: 3 } });
      writeFileSync(CFG, JSON.stringify(cfg, null, 2));
      const r = await runPublish(["status"]);
      return json(res, { ok: r.code === 0, message: r.code === 0 ? "Saved - connected accounts checked." : "Saved, but ShortSync refused it - check the key.", out: r.out.slice(-1500) });
    }

    if ((u.pathname === "/api/post" || u.pathname === "/api/trial") && req.method === "POST") {
      const { file, caption = "" } = await body(req);
      const f = basename(String(file || ""));
      const p = join(outDir, f);
      if (!f || !existsSync(p)) return json(res, { ok: false, message: "file not found" });
      if (!isFull(f)) return json(res, { ok: false, message: "Not a full-quality 1080x1920 file - refusing to post a preview." });
      if (!existsSync(CFG)) return json(res, { ok: false, message: "ShortSync key missing - paste it at the top of the page." });
      const st = state();
      let args, when;
      if (u.pathname === "/api/post") {
        args = ["post", p, "--caption", caption, "--confirm"];
        when = new Date().toISOString();
      } else {
        when = nextTrialSlot(st.trialSlots);
        args = ["trial", p, "--at", when, "--caption", caption, "--confirm"];
      }
      const r = await runPublish(args);
      const ok = r.code === 0 && !/✗|Error/.test(r.out.split("\n").slice(-3).join("\n"));
      if (ok) {
        st.videos[f] = { kind: u.pathname === "/api/post" ? "post" : "trial", when, caption, at: new Date().toISOString() };
        if (u.pathname === "/api/trial") st.trialSlots.push(when);
        saveState(st);
      }
      return json(res, { ok, message: ok ? (u.pathname === "/api/post" ? "Posted." : `Trial scheduled for ${when}.`) : "ShortSync didn't accept it - see below.", out: r.out.slice(-2000) });
    }
    res.writeHead(404); res.end();
  } catch (e) { json(res, { ok: false, message: String(e.message || e) }, 500); }
}).on("error", (e) => {
  // already running (double-clicked twice): just open the page
  if (e.code === "EADDRINUSE") { console.log(`Already running - opening http://localhost:${PORT}/`); exec(`start "" "http://localhost:${PORT}/"`); setTimeout(() => process.exit(0), 500); }
  else throw e;
}).listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}/`;
  for (const v of videos()) try { isFull(v.file); } catch {} // warm the size cache: first load fast
  console.log(`Posting page: ${url}  (${videos().length} videos, ShortSync ${existsSync(CFG) ? "connected" : "NOT connected - paste key on the page"})`);
  if (process.argv.includes("--open")) exec(`start "" "${url}"`);
});
