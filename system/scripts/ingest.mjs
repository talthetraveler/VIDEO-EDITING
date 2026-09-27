#!/usr/bin/env node
/**
 * INGEST — paste one raw talking-to-camera clip, get two edited timelines.
 *
 *   node scripts/ingest.mjs "<video>" [--slug <slug>] [--title "…"]
 *        [--model medium|small|small.en] [--max-pause 0.45]
 *        [--rotate auto|0|90|180|270]        Sony fix: vertical shot stored landscape
 *        [--music auto|<file.mp3>|none] [--mvol 0.08] [--no-duck]
 *        [--mood neutral|tense|warm]         auto-music bias
 *        [--no-trial]                        MAIN only
 *        [--render]                          also render both previews + queue on :4100
 *
 * Pipeline:
 *   1. ffprobe the file (dims, rotation side-data)
 *   2. tighten.mjs → whisper transcript, filler/pause cut, captions remapped to
 *      the tightened timeline  (public/footage/_ingest-<slug>/…)
 *   3. positivity gate — negative caption groups are dropped silently
 *   4. build projects/<slug>-a/project.json   (MAIN — chronological)
 *      build projects/<slug>-b/project.json   (TRIAL — hook-first, snappier, ≤45s)
 *   5. --render: proj-render both → scratch/batch/previews/<slug>-A.mp4 / -B.mp4
 *      and append { slug, title } to scratch/batch/queue.json
 *
 * The source file is never modified (tighten copies it into public/footage/).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { groupCaptions } from "./lib/caption-group.mjs";
import { mergeTokensToWords } from "./lib/autocut-core.mjs";
import { scanNegative, isBareNo } from "./lib/positivity.mjs";
import { pickEmphasis } from "./lib/emphasis.mjs";
import { emptyProject, saveProject } from "./lib/project.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const has = (n) => args.includes(`--${n}`);
const round = (n) => Math.round(n * 1000) / 1000;

const NOVAL = new Set(["--render", "--no-trial", "--no-duck", "--no-translate", "--re-transcribe"]);
const video = args.find((a, i) => !a.startsWith("--") && !(args[i - 1]?.startsWith("--") && !NOVAL.has(args[i - 1])));
if (!video || !existsSync(video)) {
  console.error('Usage: node scripts/ingest.mjs "<video>" [--slug s] [--title "…"] [--model medium] [--rotate auto]\n       [--translate|--no-translate] [--language he|ar] [--music auto|<file>|none] [--render]');
  process.exit(1);
}
const slug = (opt("slug", basename(video, extname(video))) || "clip")
  .replace(/[^a-z0-9-]/gi, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "")
  .toLowerCase();
const title = opt("title", "");
const model = opt("model", "medium");
const maxPause = opt("max-pause", "0.45");
const wantTrial = !has("no-trial");
const wantRender = has("render");
const mvol = Number(opt("mvol", "0.08"));
const duck = !has("no-duck");
const moodBias = opt("mood", "neutral");
// Tal's footage is often Hebrew/Arabic — translate to English by default so the
// captions are readable. --no-translate keeps the original spoken language.
const translate = !has("no-translate");
const language = opt("language", null);
// tighten.mjs sanitizes its --slug with /[^a-z0-9-]/gi -> "-"; keep ours in that
// alphabet. translated vs original transcripts must NOT share a cache dir.
const ingestSlug = `ingest-${slug}${translate ? "-en" : ""}`.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").toLowerCase();
const reIngest = has("re-transcribe");

const ff = (a) => {
  for (const bin of ["ffprobe", "ffmpeg"]) {
    try {
      return execFileSync(bin === "ffprobe" ? "ffprobe" : "ffmpeg", a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      return String(e.stdout || "") + String(e.stderr || "");
    }
  }
  return "";
};

// ---- 1. probe ----------------------------------------------------------
console.log(`· probing ${basename(video)}`);
const probeJson = (() => {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-select_streams", "v:0", "-show_entries",
        "stream=width,height,duration:stream_tags=rotate:side_data=rotation", "-of", "json", video],
      { encoding: "utf8" },
    );
    return JSON.parse(out);
  } catch {
    return null;
  }
})();
const vstream = probeJson?.streams?.[0] || {};
const vw = Number(vstream.width || 0);
const vh = Number(vstream.height || 0);
const metaRotate =
  Number(vstream.tags?.rotate ?? 0) ||
  Number((vstream.side_data_list || []).find((s) => s.rotation != null)?.rotation ?? 0);

let rotate = 0;
const rotArg = opt("rotate", "0");
if (rotArg === "auto") {
  if (metaRotate) {
    console.log(`· rotation ${metaRotate}° is in the container — Remotion honours it, no override`);
  } else if (vw > vh) {
    rotate = 90;
    console.log(`· ⚠ landscape source ${vw}×${vh} with NO rotation flag → assuming Sony vertical, rotate 90° (pass --rotate 0 to disable)`);
  }
} else if (["90", "180", "270"].includes(rotArg)) {
  rotate = Number(rotArg);
  console.log(`· forcing rotate ${rotate}°`);
}

// ---- 2. tighten (whisper + cut) --------------------------------------
const fdir = join(root, "public", "footage", ingestSlug);
const name = basename(video, extname(video)).replace(/[^a-z0-9-_]/gi, "_");
const cached = existsSync(join(fdir, `${name}.keep.json`)) && existsSync(join(fdir, `${name}.captions.json`));
if (cached && !reIngest) {
  console.log(`· reusing cached transcript/cut in public/footage/${ingestSlug}/ (pass --re-transcribe to redo)`);
} else {
  console.log(`· transcribing + tightening (model ${model})… first multilingual run may fetch the model`);
  const t = spawnSync(
    process.execPath,
    [
      join(root, "scripts", "tighten.mjs"), video, "--slug", ingestSlug, "--model", model, "--max-pause", maxPause,
      ...(translate ? ["--translate"] : []),
      ...(language ? ["--language", language] : []),
    ],
    { cwd: root, stdio: "inherit" },
  );
  if (t.status !== 0) {
    console.error("✗ tighten failed");
    process.exit(1);
  }
}
// tighten also emits src/compositions/<ingestSlug>/<Pascal>Cut.tsx — ingest goes
// through project.json + proj-render, not that stub, and it trips tsc. Drop it.
rmSync(join(root, "src", "compositions", ingestSlug), { recursive: true, force: true });

const keep = JSON.parse(readFileSync(join(fdir, `${name}.keep.json`), "utf8"));
const capsRaw = JSON.parse(readFileSync(join(fdir, `${name}.captions.json`), "utf8")); // TIMELINE-time, remapped
// [s, e, oldTl] — source-time keep span + where it sits on the ORIGINAL
// tightened timeline (so caption remap survives cutting repeated takes below)
let segs = (() => {
  let acc = 0;
  return keep.segments.map(([s, e]) => {
    const t = [s, e, acc];
    acc += e - s;
    return t;
  });
})();
// don't trust keep.src (sanitizer can rename the slug) — point at the copy tighten
// actually made in this ingest dir
const src = `footage/${ingestSlug}/${basename(keep.src)}`;
const fps = keep.fps || 30;

if (!segs.length) {
  console.error("✗ no speech kept — nothing to build");
  process.exit(1);
}

// ---- 3. positivity gate + phrase grouping ---------------------------
// capsRaw entries: { text, startMs, endMs }  (TIMELINE seconds*1000, already
// remapped onto the tightened cut). May contain BPE sub-word tokens
// (" Ah" / "m" / "adi") -> merge to real words before grouping.
const NON_SPEECH = /(blank_audio|\bmusic\b|silence|applause|laughter|inaudible)/i;
const tokens = capsRaw
  .filter((c) => c.endMs > c.startMs && !NON_SPEECH.test(c.text || "") && /[a-z0-9֐-ۿ]/i.test(c.text || ""))
  .map((c) => ({ word: c.text || "", start: c.startMs / 1000, end: c.endMs / 1000 }));
const words = mergeTokensToWords(tokens);

// [3,5] words like the nas_caption preset — [2,3] chopped natural phrases
// ("LOVE / FOR ALL HATRED / FOR NONE"); [3,5] breaks on the real punctuation
let groups = groupCaptions(words, { mode: "phrase", wordsPerGroup: [3, 5], uppercase: false });
const before = groups.length;
groups = groups.filter((g) => !scanNegative(g.text) && !isBareNo(g.text));
if (groups.length < before) console.log(`· positivity gate: dropped ${before - groups.length} negative / bare-no caption group(s)`);

// ---- 3b. cut FALSE STARTS / repeated takes ------------------------
// A speaker who restarts a sentence ("…love for all hatred for none, and this is —
// so we as Ahmadi Muslims, we have a slogan WHICH IS love for all hatred for none…")
// leaves the first attempt in the tightened cut. Find a later caption group that
// is a near-duplicate of an earlier one within ~30s and mark the span between
// them (the abandoned take) dead.
{
  const STOP = new Set(
    "a an the and or but so of to in on at is are was were be been am it its it's this that these those we you i he she they them our your my his her as with for from than then there here just really very oh no yeah ok okay well".split(" "),
  );
  // content words with their timeline start, straight off the word stream
  const cw = words
    .map((w) => ({ n: (w.word || "").toLowerCase().replace(/[^a-z0-9']/g, "").replace(/'s?$/, ""), start: w.start }))
    .filter((w) => w.n && !STOP.has(w.n));
  // a restart says a chunk of the abandoned line again verbatim → the SAME run
  // of ≥5 content words reappears a few seconds later. Everything from the first
  // occurrence to the second is the false start.
  const K = 5, MIN_GAP = 3, MAX_GAP = 46;
  const seen = new Map(); // 5-gram -> first index
  const dead = [];
  for (let i = 0; i + K <= cw.length; i++) {
    const key = cw.slice(i, i + K).map((w) => w.n).join(" ");
    if (seen.has(key)) {
      const p = seen.get(key);
      const gap = cw[i].start - cw[p].start;
      if (gap < MIN_GAP || gap > MAX_GAP) continue;
      if (dead.some(([s, e]) => cw[p].start >= s - 0.5 && cw[p].start <= e + 0.5)) continue;
      // extend the common run forward to its full length L
      let L = K;
      while (p + L < i && i + L < cw.length && cw[p + L].n === cw[i + L].n) L++;
      // then eat a couple of trailing filler words the abandoned take trails off
      // on ("…all mankind's and this is —") so the cut lands on the clean restart
      let endIdx = Math.min(p + L, cw.length - 1);
      const FILL = new Set(["and", "this", "is", "so", "the", "that", "s", "was", "its", "then", "well", "like", "just"]);
      while (endIdx + 1 < i && FILL.has(cw[endIdx].n) && cw[endIdx + 1].start - cw[endIdx].start < 0.9) endIdx++;
      // the abandoned take ends where its copy of the phrase ends; the retake
      // keeps its full lead-in + phrase. cut [first phrase start → first phrase end].
      dead.push([cw[p].start - 0.12, cw[endIdx].start + 0.28]);
    } else {
      seen.set(key, i);
    }
  }
  // throat-clearing before the first restart ("No, I just wanted… wait, second…") is junk
  if (dead.length && dead[0][0] < 12) {
    dead[0][0] = 0;
    // nudge the cut end forward to the next capitalised word within ~2.5s so we
    // open on a clean sentence, not a dangling "…all mankind's and this is"
    const g = groups.find((x) => x.start >= dead[0][1] - 0.2 && x.start <= dead[0][1] + 2.5 && /^[A-Z]/.test(x.text.trim()));
    if (g) dead[0][1] = g.start - 0.1;
  }

  // TAIL: don't end on a cut-off interviewer question ("…do you have a lot of
  // Jews that come pray here Are you—"). End on the speaker's closing beat.
  {
    const CLOSE = /\b(thank|thanks|inshallah|god bless|amen|peace be upon (him|you)|salam and shalom|shalom and salam|bless you)\b/i;
    let lastClose = -1;
    for (let k = 0; k < groups.length; k++) if (CLOSE.test(groups[k].text)) lastClose = k;
    if (lastClose >= 0 && lastClose < groups.length - 1) {
      // carry the end past a trailing "…you" / "…so much" tail on the closing line
      let endK = lastClose;
      while (
        endK + 1 < groups.length &&
        /^(you|so much|very much|to you|man|brother|sir)\b/i.test(groups[endK + 1].text.trim()) &&
        groups[endK + 1].text.trim().split(/\s+/).length <= 2 &&
        groups[endK + 1].start - groups[endK].end < 1.2
      )
        endK++;
      // if an interviewer turn follows ("…do you have a lot of Jews…"), cut tight
      const nextIsQ = groups[endK + 1] && /\b(do you|are you|have you|did you|can you)\b/i.test(groups[endK + 1].text);
      const cutAt = groups[endK].end + (nextIsQ ? 0.25 : 0.7);
      const tlEnd = segs.reduce((n, [s, e]) => n + (e - s), 0);
      if (cutAt < tlEnd - 1) dead.push([cutAt, tlEnd + 1]);
    }
  }

  if (dead.length) {
    dead.sort((x, y) => x[0] - y[0]);
    const merged = [dead[0].slice()];
    for (const [s, e] of dead.slice(1)) {
      const last = merged[merged.length - 1];
      if (s <= last[1] + 0.05) last[1] = Math.max(last[1], e);
      else merged.push([s, e]);
    }
    const removed = merged.reduce((n, [s, e]) => n + (e - s), 0);
    // subtract the dead timeline windows from the source keep-spans
    const out = [];
    for (const [s, e, tl0] of segs) {
      let pieces = [[s, e, tl0]];
      for (const [ds, de] of merged) {
        pieces = pieces.flatMap(([ps, pe, ptl]) => {
          const pEnd = ptl + (pe - ps);
          const os = Math.max(ptl, ds), oe = Math.min(pEnd, de);
          if (os >= oe) return [[ps, pe, ptl]];
          const r = [];
          if (os > ptl) r.push([ps, ps + (os - ptl), ptl]);
          if (oe < pEnd) r.push([ps + (oe - ptl), pe, ptl + (oe - ptl)]);
          return r;
        });
      }
      for (const [ps, pe, ptl] of pieces) if (pe - ps > 0.25) out.push([round(ps), round(pe), round(ptl)]);
    }
    segs = out;
    // drop caption groups whose midpoint fell inside a dead window
    groups = groups.filter((g) => {
      const mid = (g.start + g.end) / 2;
      return !merged.some(([s, e]) => mid >= s && mid <= e);
    });
    console.log(`· repeated-take cut: removed ${removed.toFixed(1)}s of false starts (${merged.length} span${merged.length > 1 ? "s" : ""}) → ${segs.length} clips`);
  }
}

// tightened total (end of last kept segment on the timeline)
const tlTotal = segs.reduce((n, [s, e]) => n + (e - s), 0);

// SOURCE-time word list so proj-op / proj-recaption can rebuild captions after a
// clip edit (ingest clips aren't in a library.db, so regenCaptions' DB lookup
// misses and would otherwise wipe the caption track).
const ingestWords = [];
for (const w of words) {
  const mid = (w.start + w.end) / 2;
  const sg = segs.find(([s, e, tl0]) => mid >= tl0 - 0.02 && mid <= tl0 + (e - s) + 0.02);
  if (!sg) continue;
  const [s0, , tl0] = sg;
  ingestWords.push({ text: (w.word || "").trim(), start: round(s0 + (w.start - tl0)), end: round(s0 + (w.end - tl0)) });
}
ingestWords.sort((a, b) => a.start - b.start);

// ---- helpers -------------------------------------------------------
// build the video track for an ORDER of segment indices; captions get shifted
// so each reused segment's captions land at its new timeline position.
const buildTracks = (order, { capMax = Infinity, headExtendS = 0 } = {}) => {
  const vid = [];
  const caps = [];
  let tl = 0;
  let ci = 0;
  for (const idx of order) {
    let [s, e, oldTl] = segs[idx];
    // TRIAL cold-open: if the hook segment starts mid-sentence, pull its start
    // back to catch the lead-in ("…Judaism and Islam have a lot in common"),
    // bounded so we never re-enter an earlier keep-span's source range.
    if (headExtendS > 0 && vid.length === 0) {
      const prevOut = Math.max(0, ...segs.filter((g) => g[1] <= s + 0.01).map((g) => g[1]));
      const back = Math.min(headExtendS, Math.max(0, s - prevOut - 0.05));
      s = round(s - back);
      oldTl = round(oldTl - back);
    }
    const dur = e - s;
    if (vid.length && tl + dur > capMax) break;
    vid.push({ id: `v${vid.length + 1}`, src, sourceIn: round(s), sourceOut: round(e), timelineStart: round(tl), speed: 1, ...(rotate ? { rotate } : {}) });
    const from = oldTl; // this segment's position on the ORIGINAL timeline (where group times live)
    const shift = from - tl; // subtract to move a caption from old tl-pos to new
    for (const g of groups) {
      const mid = (g.start + g.end) / 2;
      if (mid >= from - 0.01 && mid <= from + dur + 0.01) {
        const ns = Math.max(0, g.start - shift);
        const ne = g.end - shift;
        caps.push({
          id: `c${++ci}`,
          type: "speech_caption",
          start: round(ns),
          end: round(Math.max(ne, ns + 0.2)),
          text: g.text, // nas_caption renders sentence-case (uppercase:false) w/ a yellow keyword
          words: (g.words || []).map((w) => ({ text: w.text, start: round(w.start - shift), end: round(w.end - shift) })),
          style: "tal_caption",
          position: { x: 0.5, y: 0.76 },
        });
      }
    }
    tl += dur;
  }
  caps.sort((a, b) => a.start - b.start);
  return { vid, caps, dur: round(tl) };
};

// ---- 4a. MAIN — chronological -------------------------------------
const mainOrder = segs.map((_, i) => i);
const M = buildTracks(mainOrder);
const mkProject = (pslug, { vid, caps, dur }, titleText, isTrial) => {
  const p = emptyProject({ id: pslug, slug, brief: `ingest: ${basename(video)}${isTrial ? " (trial reel)" : ""}` });
  p.caption_style = "nas_caption";
  p.title_style = "tal_top_title";
  p.handle = "@talthetraveler";
  p.tracks.video = vid;
  p.tracks.captions = caps;
  // MAIN and TRIAL always carry a top title card (Tal's reel style). If no
  // --title was given it's a visible placeholder to fill in on the dashboard.
  p.tracks.title = [
    { id: "t1", type: "title", text: titleText || "ADD TITLE ✏️", start: 0, end: Math.min(3.6, Math.max(2, dur)), style: "tal_top_title", position: { x: 0.5, y: 0.11 } },
  ];
  if (music) p.tracks.music = [{ src: `footage/music/${music}`, volume: mvol, duck }];
  // keeps captions rebuildable after clip edits (see ingestWords above)
  p._ingest_words = { src, words: ingestWords };
  p.duration = dur;
  return p;
};

// ---- music auto-pick --------------------------------------------
let music = null;
const musicArg = opt("music", "auto");
if (musicArg && musicArg !== "none") {
  if (musicArg === "auto") {
    try {
      const cat = JSON.parse(readFileSync(join(root, "projects/_assets/music/catalog.json"), "utf8"));
      const want = moodBias === "tense" ? ["brooding", "cinematic-tense"] : moodBias === "warm" ? ["warm-hopeful", "ambient", "neutral"] : ["neutral", "ambient", "warm-hopeful"];
      // a talking-head bed must never pull focus or set a scary/sad/hype tone.
      // the catalog's mood tags are auto-generated and unreliable, so gate hard
      // on filename + energy and fall back to NO bed rather than a wrong one.
      const BAD = /(horror|suspense|creepy|scary|dark|sad|cry|tragic|funeral|death|villain|evil|tension|thriller|nightmare|eerie|haunt|\bprod\b|prod\.|remix|trap|drill|phonk|slowed|reverb|hardstyle|\brage\b|hype|\bbeat\b|freestyle|instrumental\)?\s*prod)/i;
      const need = M.dur;
      const pool = cat
        .filter((c) => c.sec >= need * 0.9 && !BAD.test(c.file) && c.energy === "low" && want.includes(c.mood))
        .sort((a, b) => a.crest - b.crest); // steadiest bed first
      music = pool[0]?.file || null;
      if (!music) console.log(`· music auto-pick: no calm track clears the bar — leaving music OFF (pick one in the editor dropdown)`);
      if (music) {
        mkdirSync(join(root, "public", "footage", "music"), { recursive: true });
        const s0 = join(root, "projects/_assets/music", music);
        if (existsSync(s0)) execFileSync(process.execPath, ["-e", `require('fs').copyFileSync(${JSON.stringify(s0)}, ${JSON.stringify(join(root, "public", "footage", "music", music))})`]);
        console.log(`· music (auto): ${music}  @ vol ${mvol}${duck ? ", duck" : ""}`);
      }
    } catch (e) {
      console.log(`· music auto-pick skipped: ${e.message}`);
    }
  } else {
    music = basename(musicArg);
    const s0 = existsSync(musicArg) ? musicArg : join(root, "projects/_assets/music", music);
    if (existsSync(s0)) {
      mkdirSync(join(root, "public", "footage", "music"), { recursive: true });
      execFileSync(process.execPath, ["-e", `require('fs').copyFileSync(${JSON.stringify(s0)}, ${JSON.stringify(join(root, "public", "footage", "music", music))})`]);
      console.log(`· music: ${music}`);
    } else {
      console.log(`· ⚠ music file not found: ${musicArg} — skipping`);
      music = null;
    }
  }
}

const mainTitle = title || "";
saveProject(`${slug}-a`, mkProject(`${slug}-a`, M, mainTitle, false), { label: "ingest MAIN", isDraft: true });
console.log(`✓ projects/${slug}-a  —  ${M.vid.length} clips · ${M.dur}s · ${M.caps.length} caption groups`);

// ---- 4b. TRIAL — hook-first, snappier, ≤45s ---------------------
if (wantTrial) {
  // score each segment as a cold-open hook: a caption inside it that ends on
  // . / ? , is 3–10 words, and carries an emphasis keyword (name / number / noun)
  let best = 0, bestScore = -1;
  segs.forEach(([s, e, oldTl], i) => {
    const from = oldTl, to = oldTl + (e - s);
    const inSeg = groups.filter((g) => (g.start + g.end) / 2 >= from && (g.start + g.end) / 2 <= to);
    let sc = 0;
    for (const g of inSeg) {
      const wc = g.text.split(/\s+/).length;
      if (wc >= 3 && wc <= 10) sc += 2;
      if (/[.?!]$/.test(g.text.trim())) sc += 1;
      if (pickEmphasis(g.words?.length ? g.words.map((w) => w.text).join(" ") : g.text).length) sc += 2;
      if (i > segs.length * 0.4) sc += 1.5; // a later line as a cold open = "how it started" tension
    }
    if (inSeg.length && sc > bestScore) { bestScore = sc; best = i; }
  });
  const rest = segs.map((_, i) => i).filter((i) => i !== best);
  const trialOrder = [best, ...rest];
  const T = buildTracks(trialOrder, { capMax: 45, headExtendS: 2.6 });
  const trialTitle = title || "HOW IT STARTED";
  saveProject(`${slug}-b`, mkProject(`${slug}-b`, T, trialTitle, true), { label: "ingest TRIAL", isDraft: true });
  console.log(`✓ projects/${slug}-b  —  hook = segment #${best + 1} · ${T.vid.length} clips · ${T.dur}s · ${T.caps.length} caption groups`);
}

// ---- 5. render + queue ------------------------------------------
if (wantRender) {
  const B = join(root, "scratch", "batch");
  const PREV = join(B, "previews");
  mkdirSync(PREV, { recursive: true });
  for (const [v, V] of [["a", "A"], ...(wantTrial ? [["b", "B"]] : [])]) {
    console.log(`· rendering ${slug}-${v}…`);
    const r = spawnSync(process.execPath, [join(root, "scripts", "proj-render.mjs"), `${slug}-${v}`, "--scale", "0.4"], { cwd: root, stdio: "inherit" });
    if (r.status === 0) {
      const outP = join(root, "projects", `${slug}-${v}`, "preview", `${slug}-${v}.mp4`);
      if (existsSync(outP)) execFileSync(process.execPath, ["-e", `require('fs').copyFileSync(${JSON.stringify(outP)}, ${JSON.stringify(join(PREV, `${slug}-${V}.mp4`))})`]);
    }
  }
  const qPath = join(B, "queue.json");
  const q = existsSync(qPath) ? JSON.parse(readFileSync(qPath, "utf8")) : [];
  if (!q.find((x) => x.slug === slug)) {
    q.push({ slug, title: title || `⚠ set title — ${slug}` });
    writeFileSync(qPath, JSON.stringify(q, null, 2));
    console.log(`✓ queued on the dashboard — open http://localhost:4100`);
  } else {
    console.log(`· ${slug} already in the dashboard queue`);
  }
}

console.log(`\nnext: open http://localhost:4100 to review + adjust on the timeline, or`);
console.log(`      node scripts/proj-render.mjs ${slug}-a   to render MAIN now`);
