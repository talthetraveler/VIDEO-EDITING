#!/usr/bin/env node
// BATCH-REVIEW-PAGE — one HTML page to watch every video of a batch.
//
//   node scripts/batch-review-page.mjs <slug> "<VIDEOS OUT folder>"
//
// Reads projects/<slug>/manifest.jsonl (one JSON object per finished video,
// appended by whoever delivered it - see projects/israel-batch/BUILD-BRIEF.md)
// and writes <folder>/index.html next to the MP4s, with relative links, so it
// opens straight from File Explorer. Grouped by story, V1/V2 side by side.
//
// Posting: the page lets Tal tick videos for trial reels and copies the list
// for Claude. The actual post/schedule buttons stay disabled until the
// ShortSync key is back (content-engine) - they say so instead of pretending.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const [slug, outDir] = argv.filter((a, i) => !a.startsWith("--") && !["--title", "--source"].includes(argv[i - 1]));
if (!slug || !outDir) { console.error('usage: node scripts/batch-review-page.mjs <slug> "<VIDEOS OUT folder>" [--title "Israel batch"] [--source "cut from 425 clips in FOOTAGE IN"]'); process.exit(2); }
// defaults reproduce the original israel-batch page exactly
const PAGE_TITLE = opt("--title", "Israel batch");
const SOURCE = opt("--source", "cut from 425 clips in FOOTAGE IN");
const mf = join(ROOT, "projects", slug, "manifest.jsonl");
const rows = existsSync(mf) ? readFileSync(mf, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];

// keep the LAST entry per file (a rebuilt video re-appends), and only files that exist
const byFile = new Map();
for (const r of rows) {
  const f = basename(String(r.file || ""));
  if (f && existsSync(join(outDir, f))) byFile.set(f, { ...r, file: f });
}
const vids = [...byFile.values()];
// full-size pass results (scripts/batch-finalize.mjs): last record per file
const fin = new Map();
const ff = join(ROOT, "projects", slug, "finalize.jsonl");
if (existsSync(ff)) for (const l of readFileSync(ff, "utf8").split(/\r?\n/).filter(Boolean)) { try { const r = JSON.parse(l); fin.set(r.file, r); } catch {} }
const groups = new Map();
for (const v of vids) {
  const g = (v.title || v.file).replace(/\s*-\s*V\d+.*$/i, "").replace(/\n/g, " ");
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g).push(v);
}
for (const list of groups.values()) list.sort((a, b) => String(a.variant).localeCompare(String(b.variant)));
const ordered = [...groups.entries()].sort((a, b) => {
  const ta = a[1][0].type === "compilation" ? 1 : 0, tb = b[1][0].type === "compilation" ? 1 : 0;
  return ta - tb || a[0].localeCompare(b[0]);
});
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (d) => (d ? `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, "0")}` : "");
const nPerson = vids.filter((v) => v.type !== "compilation").length, nComp = vids.length - nPerson;
const nTal = vids.filter((v) => v.status === "needs-tal").length;

const cards = ordered.map(([g, list]) => `
  <section class="story" data-type="${esc(list[0].type)}" data-tal="${list.some((v) => v.status === "needs-tal") ? 1 : 0}">
    <header><h2>${esc(g)}</h2><span class="kind">${list[0].type === "compilation" ? "Compilation" : "One person"}</span>
      ${list[0].people ? `<p class="who">${esc(list[0].people)}</p>` : ""}</header>
    <div class="vars">${list.map((v) => `
      <article class="vid${v.status === "needs-tal" ? " tal" : ""}">
        <video controls preload="metadata" playsinline src="${encodeURI(v.file)}"></video>
        <div class="meta">
          <div class="row"><b>${esc(v.variant || "")}</b><span>${fmt(v.duration)}</span>
            ${v.status === "needs-tal" ? `<span class="badge">Your call</span>` : ""}
            ${fin.get(v.file)?.ok ? `<span class="hq">Full quality</span>` : `<span class="pv">Preview</span>`}</div>
          ${v.hook ? `<p class="hook">“${esc(v.hook)}”</p>` : ""}
          ${v.note || v.status_note ? `<p class="note">${esc(v.note || v.status_note)}</p>` : ""}
          ${v.caption_note ? `<p class="cap">${esc(v.caption_note)}</p>` : ""}
          <label class="pick"><input type="checkbox" data-file="${esc(v.file)}"> Post as trial reel</label>
          <a class="dl" href="${encodeURI(v.file)}" download>Download</a>
        </div>
      </article>`).join("")}
    </div>
  </section>`).join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(PAGE_TITLE)} Review</title>
<style>
:root{--bg:#f6f5f2;--card:#fff;--ink:#16161a;--mute:#6b6b73;--line:#e4e2dc;--acc:#1f6feb;--warn:#b45309;--warnbg:#fff4e5}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#111214;--card:#1b1c20;--ink:#ececf1;--mute:#9a9aa3;--line:#2b2c31;--acc:#6ea8ff;--warn:#f0a44b;--warnbg:#2a2116}}
:root[data-theme="dark"]{--bg:#111214;--card:#1b1c20;--ink:#ececf1;--mute:#9a9aa3;--line:#2b2c31;--acc:#6ea8ff;--warn:#f0a44b;--warnbg:#2a2116}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,-apple-system,Segoe UI,sans-serif}
.wrap{max-width:1200px;margin:0 auto;padding:24px 16px 120px}
h1{font-size:26px;margin:0 0 4px}.sub{color:var(--mute);margin:0 0 18px}
.bar{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}
.bar button{border:1px solid var(--line);background:var(--card);color:var(--ink);padding:7px 12px;border-radius:999px;cursor:pointer}
.bar button.on{background:var(--ink);color:var(--bg)}
.story{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:0 0 16px}
.story header{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px}
.story h2{font-size:17px;margin:0}.kind{font-size:12px;color:var(--mute);border:1px solid var(--line);border-radius:999px;padding:1px 8px}
.who{flex-basis:100%;margin:2px 0 0;color:var(--mute);font-size:13px}
.vars{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin-top:12px}
.vid video{width:100%;aspect-ratio:9/16;background:#000;border-radius:10px;display:block}
.vid.tal video{outline:3px solid var(--warn);outline-offset:2px}
.meta{padding:8px 2px 0}.row{display:flex;gap:10px;align-items:center}.row span{color:var(--mute)}
.badge{color:var(--warn)!important;background:var(--warnbg);border-radius:6px;padding:1px 7px;font-size:12px;font-weight:600}
.hq{color:#15803d!important;font-size:12px;font-weight:600}.pv{font-size:12px}.hook{margin:6px 0 0;font-style:italic}.note{margin:6px 0 0;color:var(--warn);font-size:13px}.cap{margin:4px 0 0;color:var(--mute);font-size:12px}
.pick{display:flex;gap:6px;align-items:center;margin-top:8px;font-size:14px;cursor:pointer}.dl{font-size:13px;color:var(--acc)}
.dock{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:10px 16px}
.dock .in{max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.dock button{padding:9px 14px;border-radius:10px;border:1px solid var(--line);background:var(--acc);color:#fff;cursor:pointer;font-weight:600}
.dock button[disabled]{background:var(--line);color:var(--mute);cursor:not-allowed}
.dock small{color:var(--mute);flex-basis:100%}
</style></head><body><div class="wrap">
<h1>${esc(PAGE_TITLE)} · ${vids.length} videos</h1>
<p class="sub">${nPerson} one-person · ${nComp} compilations · ${nTal} need your call · ${esc(SOURCE)} · every caption timing-checked; Hebrew/Arabic wording marked where machine-translated</p>
<div class="bar"><button class="on" data-f="all">All</button><button data-f="person">One person</button><button data-f="compilation">Compilations</button><button data-f="tal">Your call</button></div>
${cards || "<p>No videos delivered yet.</p>"}
</div>
<div class="dock"><div class="in">
  <b id="count">0 picked</b>
  <button id="copy">Copy picked list</button>
  <button disabled title="Needs the ShortSync key - ask Claude">Post picked as trials</button>
  <button disabled title="Needs the ShortSync key - ask Claude">Schedule all as trials · 3/day (7:00, 16:00, 22:00)</button>
  <small><b>To post:</b> double-click <b>OPEN POSTING PAGE</b> in this folder. It opens the same videos with a "Post to all now" and a "Schedule trial" button on each one (scripts/batch-server.mjs).</small>
</div></div>
<script>
const KEY="israel-batch-picks";let picks=[];try{picks=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){}
const boxes=[...document.querySelectorAll('.pick input')];
function sync(){document.getElementById('count').textContent=picks.length+" picked";try{localStorage.setItem(KEY,JSON.stringify(picks))}catch(e){}}
boxes.forEach(b=>{b.checked=picks.includes(b.dataset.file);b.onchange=()=>{picks=b.checked?[...new Set([...picks,b.dataset.file])]:picks.filter(x=>x!==b.dataset.file);sync()}});
document.getElementById('copy').onclick=()=>{const t="Post these as trial reels:\\n"+picks.map(p=>"- "+p).join("\\n");navigator.clipboard?.writeText(t).then(()=>{document.getElementById('copy').textContent="Copied"},()=>prompt("Copy this:",t))};
document.querySelectorAll('.bar button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.bar button').forEach(x=>x.classList.remove('on'));b.classList.add('on');const f=b.dataset.f;
document.querySelectorAll('.story').forEach(s=>{s.style.display=(f==="all"||(f==="tal"?s.dataset.tal==="1":f==="compilation"?s.dataset.type==="compilation":s.dataset.type!=="compilation"))?"":"none"})});
sync();
</script></body></html>`;
writeFileSync(join(outDir, "index.html"), html, "utf8");
console.log(`${vids.length} videos (${groups.size} stories) -> ${join(outDir, "index.html")}`);
const stray = readdirSync(outDir).filter((f) => /\.mp4$/i.test(f) && !byFile.has(f));
if (stray.length) console.log(`  not in manifest (not shown): ${stray.join(", ")}`);
