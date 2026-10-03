#!/usr/bin/env node
// APPROVE-SERVER — every finished cut on one page; Tal ticks what goes to Frame.io.
//
//   node scripts/approve-server.mjs [--port 4300]
//
// Tal, 2026-10-03: *"show me everything so I can just decide what to move to
// the frame io."* The rule is preview -> he approves -> Frame.io (CLAUDE.md
// 0b), and by then ~50 cuts from several sessions were waiting, each in its
// own project folder. This page shows the NEWEST render of every project in
// system/projects/, says whether it is already on Frame.io, and keeps his
// ticks in projects/_frameio/approve-picks.json for Claude to read.
//
// It uploads nothing. A tick is an approval; the upload is still
// build --final --hq -> frameio-deliver.mjs, run by Claude afterwards.
//
// It scans on every page load, so a cut another session finishes shows up on
// refresh.
//
// A project with a blur-rules.json only ever shows its *_BLUR.mp4. The
// unblurred build sits beside it in the same folder and must never be the one
// on screen (eden-story: her face is hidden at Tal's instruction).
import http from "node:http";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, createReadStream } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const PROJ = join(ROOT, "projects");
const PORT = Number(process.argv.includes("--port") ? process.argv[process.argv.indexOf("--port") + 1] : 4300);
const PICKS = join(PROJ, "_frameio", "approve-picks.json");
const NEW_SINCE = Date.parse("2026-10-01T00:00:00+03:00"); // the last Frame.io delivery was 2026-09-30

const readJSON = (p, d) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return d; } };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// beats (01.mp4, 05d.mp4), builder scratch and debug renders are not cuts
const NOT_A_CUT = /^(\d+[a-z]?|picture|dbg|tmp.*|.*\.verify|.*\.base|.*_(noblur|preblur))\.mp4$/i;

function manualNames() {
  // the israel batch was uploaded under its display names; manifest.jsonl maps slug -> that name
  const m = new Map();
  for (const b of ["israel-batch", "social-accords"]) {
    const f = join(PROJ, b, "manifest.jsonl");
    if (!existsSync(f)) continue;
    for (const l of readFileSync(f, "utf8").split(/\r?\n/).filter(Boolean)) {
      try { const r = JSON.parse(l); if (r.slug && r.file) m.set(r.slug, r.file); } catch {}
    }
  }
  return m;
}

function scan() {
  const delivered = readJSON(join(PROJ, "_frameio", "delivered.json"), []);
  const bySlug = new Map(), names = new Set();
  for (const d of delivered) { names.add(d.name); if (d.slug && d.slug !== "(manual)") bySlug.set(d.slug, d); }
  const manual = manualNames();
  const out = [];
  for (const slug of readdirSync(PROJ)) {
    if (slug.startsWith("_")) continue;
    const dir = join(PROJ, slug);
    let files;
    try { if (!statSync(dir).isDirectory()) continue; files = readdirSync(dir); } catch { continue; }
    if (files.includes("renders")) { try { files.push(...readdirSync(join(dir, "renders")).map((f) => "renders/" + f)); } catch {} }
    const cuts = files.filter((f) => /\.mp4$/i.test(f) && !NOT_A_CUT.test(f.split("/").pop()));
    if (!cuts.length) continue;
    let st = cuts.map((f) => ({ f, s: statSync(join(dir, f)) })).sort((a, b) => b.s.mtimeMs - a.s.mtimeMs);
    // TWO BLUR CONVENTIONS LIVE HERE. eden-story: X.mp4 is the unblurred build
    // and X_BLUR.mp4 the one to show. The ek- batch: X.mp4 IS the blurred file
    // (X_PREBLUR / X_noblur beside it). Either way, a render older than the
    // project's blur-rules.json was made before the blur existed and is hidden
    // rather than shown with a face in it.
    const rules = join(dir, "blur-rules.json"), mustBlur = existsSync(rules);
    if (mustBlur) {
      const named = st.filter((x) => /_BLUR\.mp4$/i.test(x.f)), since = statSync(rules).mtimeMs;
      st = named.length ? named : st.filter((x) => x.s.mtimeMs >= since);
      if (!st.length) continue;
    }
    const { f: file, s } = st[0];
    const d = bySlug.get(slug);
    let frameio = "no";
    if (d) frameio = s.mtimeMs <= Date.parse(d.delivered_at) + 60e3 ? "yes" : "older";
    else if (manual.has(slug) && names.has(manual.get(slug))) frameio = "yes";
    const edit = readJSON(join(dir, "edit.json"), {});
    out.push({
      slug, file, mtime: s.mtimeMs, mb: +(s.size / 1048576).toFixed(1), versions: st.length, frameio, blurred: mustBlur,
      isNew: s.mtimeMs >= NEW_SINCE, note: String(edit._brief || edit.note || "").slice(0, 600),
    });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

// duration + frame size, probed once per file version
const probeCache = new Map();
function probe(v) {
  const p = join(PROJ, v.slug, v.file), k = p + v.mtime;
  if (probeCache.has(k)) return Promise.resolve(probeCache.get(k));
  return new Promise((res) => {
    execFile("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", p], { encoding: "utf8" }, (e, so) => {
      let r = { dur: 0, w: 0, h: 0 };
      try { const j = JSON.parse(so); r = { dur: +j.format.duration || 0, w: j.streams[0].width | 0, h: j.streams[0].height | 0 }; } catch {}
      probeCache.set(k, r); res(r);
    });
  });
}
async function list() {
  const vids = scan();
  for (let i = 0; i < vids.length; i += 8) await Promise.all(vids.slice(i, i + 8).map(async (v) => Object.assign(v, await probe(v))));
  return vids;
}

const title = (v) => v.file.replace(/^renders\//, "").replace(/\.mp4$/i, "").replace(/_BLUR$/i, "").replace(/^EK_/, "").replace(/_/g, " ");
const fmt = (d) => (d ? `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, "0")}` : "");
const when = (ms) => new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function page(vids, picks) {
  const picked = new Set(picks.map((p) => p.slug));
  const nWait = vids.filter((v) => v.isNew && v.frameio !== "yes").length;
  const cards = vids.map((v) => `
    <article class="vid" data-new="${v.isNew ? 1 : 0}" data-fio="${v.frameio}">
      <video controls preload="none" playsinline data-src="/v/${encodeURIComponent(v.slug)}/${encodeURIComponent(v.file)}"></video>
      <h2>${esc(title(v))}</h2>
      <div class="row"><span>${fmt(v.dur)}</span><span>${when(v.mtime)}</span>
        ${v.w === 1080 && v.h === 1920 ? `<span class="hq">Full quality</span>` : `<span>Preview ${v.w}x${v.h}</span>`}
        ${v.blurred ? `<span class="hq">Face blurred</span>` : ""}
        ${v.frameio === "yes" ? `<span class="on">On Frame.io</span>` : v.frameio === "older" ? `<span class="warn">Frame.io has an older version</span>` : ""}</div>
      ${v.note ? `<details><summary>Editor's note</summary><p>${esc(v.note)}${v.note.length >= 600 ? "…" : ""}</p></details>` : ""}
      ${v.frameio === "yes" ? "" : `<label class="pick"><input type="checkbox" data-slug="${esc(v.slug)}" data-file="${esc(v.file)}"${picked.has(v.slug) ? " checked" : ""}> Send to Frame.io</label>`}
    </article>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Approve for Frame.io</title>
<style>
:root{--bg:#f6f5f2;--card:#fff;--ink:#16161a;--mute:#6b6b73;--line:#e4e2dc;--acc:#1f6feb;--warn:#b45309;--ok:#15803d}
@media (prefers-color-scheme:dark){:root{--bg:#111214;--card:#1b1c20;--ink:#ececf1;--mute:#9a9aa3;--line:#2b2c31;--acc:#6ea8ff;--warn:#f0a44b;--ok:#4ade80}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,-apple-system,Segoe UI,sans-serif}
.wrap{max-width:1280px;margin:0 auto;padding:24px 16px 110px}
h1{font-size:26px;margin:0 0 4px}.sub{color:var(--mute);margin:0 0 18px}
.bar{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}
.bar button{border:1px solid var(--line);background:var(--card);color:var(--ink);padding:7px 12px;border-radius:999px;cursor:pointer;font:inherit}
.bar button.on{background:var(--ink);color:var(--bg)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
.vid{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px}
.vid video{width:100%;aspect-ratio:9/16;background:#000;border-radius:10px;display:block}
.vid h2{font-size:15px;margin:10px 0 2px;overflow-wrap:anywhere}
.row{display:flex;flex-wrap:wrap;gap:4px 10px;color:var(--mute);font-size:13px}
.hq,.on{color:var(--ok);font-weight:600}.warn{color:var(--warn);font-weight:600}
details{margin-top:6px;font-size:13px;color:var(--mute)}details p{margin:4px 0 0}summary{cursor:pointer}
.pick{display:flex;gap:8px;align-items:center;margin-top:10px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;cursor:pointer;font-weight:600}
.pick input{width:18px;height:18px}.pick:has(input:checked){border-color:var(--acc);color:var(--acc)}
.dock{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:10px 16px}
.dock .in{max-width:1280px;margin:0 auto;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.dock button{padding:9px 14px;border-radius:10px;border:0;background:var(--acc);color:#fff;cursor:pointer;font:inherit;font-weight:600}
.dock small{color:var(--mute)}
</style></head><body><div class="wrap">
<h1>Approve for Frame.io</h1>
<p class="sub">${vids.length} videos, the newest version of each · ${nWait} new and not on Frame.io · refresh to pick up cuts still rendering</p>
<div class="bar"><button class="on" data-f="wait">Waiting for you (${nWait})</button><button data-f="old">Older, not on Frame.io</button><button data-f="fio">Already on Frame.io</button><button data-f="all">All</button></div>
<div class="grid">${cards}</div>
</div>
<div class="dock"><div class="in">
  <b id="count"></b>
  <button id="copy">Copy my picks</button>
  <small>Tick the ones you want, then tell Claude <b>"send my picks"</b>. Your ticks are saved as you go. Nothing uploads from this page.</small>
</div></div>
<script>
const boxes=[...document.querySelectorAll('.pick input')];
const count=()=>{document.getElementById('count').textContent=boxes.filter(b=>b.checked).length+" picked"};
boxes.forEach(b=>b.onchange=()=>{count();fetch('/api/pick',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug:b.dataset.slug,file:b.dataset.file,on:b.checked})})});
document.getElementById('copy').onclick=()=>{const t="Send these to Frame.io:\\n"+boxes.filter(b=>b.checked).map(b=>"- "+b.dataset.slug).join("\\n");navigator.clipboard?.writeText(t).then(()=>{document.getElementById('copy').textContent="Copied"},()=>prompt("Copy this:",t))};
const show=(f)=>document.querySelectorAll('.vid').forEach(v=>{const n=v.dataset.new==="1",o=v.dataset.fio==="yes";v.style.display=(f==="all"||(f==="wait"&&n&&!o)||(f==="old"&&!n&&!o)||(f==="fio"&&o))?"":"none"});
document.querySelectorAll('.bar button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.bar button').forEach(x=>x.classList.remove('on'));b.classList.add('on');show(b.dataset.f)});
// load a video's first frame only when it scrolls into view
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const v=e.target;v.src=v.dataset.src+"#t=0.5";v.preload="metadata";io.unobserve(v)}}),{rootMargin:"400px"});
document.querySelectorAll('video').forEach(v=>io.observe(v));
show("wait");count();
</script></body></html>`;
}

function sendVideo(req, res, p) {
  const size = statSync(p).size, m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (!m) { res.writeHead(200, { "content-type": "video/mp4", "content-length": size, "accept-ranges": "bytes" }); return createReadStream(p).pipe(res); }
  const start = m[1] ? +m[1] : Math.max(0, size - +m[2]), end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
  if (start >= size) { res.writeHead(416, { "content-range": `bytes */${size}` }); return res.end(); }
  res.writeHead(206, { "content-type": "video/mp4", "content-length": end - start + 1, "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes" });
  createReadStream(p, { start, end }).pipe(res);
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  try {
    if (u.pathname === "/") {
      const html = page(await list(), readJSON(PICKS, { picks: [] }).picks);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }); return res.end(html);
    }
    if (u.pathname === "/api/pick" && req.method === "POST") {
      let body = ""; for await (const c of req) body += c;
      const { slug, file, on } = JSON.parse(body);
      const v = scan().find((x) => x.slug === slug && x.file === file);
      if (!v) { res.writeHead(404); return res.end("unknown video"); }
      const s = readJSON(PICKS, { picks: [] });
      s.picks = s.picks.filter((p) => p.slug !== slug);
      if (on) s.picks.push({ slug, file, picked_at: new Date().toISOString() });
      writeFileSync(PICKS, JSON.stringify(s, null, 1));
      res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ picked: s.picks.length }));
    }
    const m = /^\/v\/([^/]+)\/([^/]+)$/.exec(u.pathname);
    if (m) {
      // only a file the scan itself chose is served - no path is taken from the URL
      const slug = decodeURIComponent(m[1]), file = decodeURIComponent(m[2]);
      const v = scan().find((x) => x.slug === slug && x.file === file);
      if (!v) { res.writeHead(404); return res.end("not found"); }
      return sendVideo(req, res, join(PROJ, slug, file));
    }
    res.writeHead(404); res.end("not found");
  } catch (e) { res.writeHead(500); res.end(String(e?.message || e)); }
}).listen(PORT, "127.0.0.1", () => console.log(`approve page: http://localhost:${PORT}`));
