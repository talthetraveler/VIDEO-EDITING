#!/usr/bin/env node
/**
 * Typed timeline operations. The LLM never rewrites project.json directly — it
 * calls these, each validates → applies → snapshots a revision (undo/redo).
 *
 *   node scripts/proj-op.mjs <name> <op> [--flags]
 *
 * CLIP     trim_clip --clip v3 --in 2.6 --out 4.4
 *          delete_clip --clip v3
 *          move_clip --clip v3 --to 0            (0-based target index)
 *          split_clip --clip v3 --at 5.0         (source seconds)
 *          change_speed --clip v3 --speed 1.5
 *          set_crop --clip v3 --position 40%
 * TITLE    set_title_text --text "Making Strangers Smile"
 *          set_title_style --style tal_top_title|plain_white|none
 *          set_title_position --y 0.13
 *          set_title_hold --sec 4
 * CAPTION  set_caption_style --style tal_phrase|tal_short|word_by_word|none
 *          set_caption_grouping --words 3-5
 *          set_caption_position --y 0.66
 *          set_caption_text --id c7 --text "THIS PLACE IS AMAZING"
 *          translate_captions --lang es|ar|he|fr   (fills caption.tr[lang])
 *          set_caption_lang --lang es|src          (which language to display)
 *          remove_caption --id c7
 *          remove_caption --from 12 --to 20      (timeline seconds)
 * HISTORY  undo | redo | revisions
 *
 * Ops that change the video timeline re-derive the caption track from word
 * timings (so captions stay in sync) UNLESS a caption is marked manual.
 */
import { join } from "node:path";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { openDb } from "./lib/db.mjs";
import { groupCaptions } from "./lib/caption-group.mjs";
import { loadProject, saveProject, loadPreset, undo, redo, listRevisions } from "./lib/project.mjs";

const root = process.cwd();
const [name, op, ...rest] = process.argv.slice(2);
const flag = (n, d) => {
  const i = rest.indexOf(`--${n}`);
  return i >= 0 ? rest[i + 1] : d;
};
if (!name || !op) {
  console.error("Usage: node scripts/proj-op.mjs <name> <op> [--flags]  (see header)");
  process.exit(1);
}

if (op === "undo") {
  const r = undo(name);
  console.log(r.ok ? `↩ undo → rev_${String(r.rev).padStart(3, "0")}` : `✗ ${r.msg}`);
  process.exit(0);
}
if (op === "redo") {
  const r = redo(name);
  console.log(r.ok ? `↪ redo → rev_${String(r.rev).padStart(3, "0")}` : `✗ ${r.msg}`);
  process.exit(0);
}
if (op === "revisions") {
  for (const { rev, label } of listRevisions(name)) console.log(`rev_${String(rev).padStart(3, "0")}  ${label}`);
  process.exit(0);
}

const p = loadProject(name);
const db = openDb(join(root, "public", "footage", p.slug, "library.db"));
const wordsOfClip = db.prepare("SELECT word,start_s,end_s FROM words WHERE clip_id=? AND end_s>start_s ORDER BY idx");
const clipIdByPath = db.prepare("SELECT id FROM clips WHERE path=?");

const findClip = (id) => {
  for (const trk of ["video", "broll"]) {
    const idx = p.tracks[trk].findIndex((c) => c.id === id);
    if (idx >= 0) return { trk, idx, clip: p.tracks[trk][idx] };
  }
  throw new Error(`no clip "${id}"`);
};

const reflowVideo = () => {
  let tl = 0;
  for (const c of p.tracks.video) {
    c.timelineStart = +tl.toFixed(3);
    tl += (c.sourceOut - c.sourceIn) / (c.speed ?? 1);
  }
};

/** rebuild the caption track from the current video timeline + word timings */
const regenCaptions = () => {
  if (p.tracks.captions.some((c) => c.manual)) {
    console.warn("⚠ some captions are hand-edited (manual) — NOT regenerating. Trim before editing text, or run set_caption_style to force a rebuild.");
    return;
  }
  const capId = p.caption_style ?? "tal_phrase";
  const preset = loadPreset("caption", capId);
  if ((preset.mode ?? "phrase") === "none") {
    p.tracks.captions = [];
    return;
  }
  const tw = [];
  let tl = 0;
  // ingest projects aren't in a library.db — a SOURCE-time word list rides along
  // on the project so caption rebuilds survive clip edits.
  const iw = p._ingest_words && Array.isArray(p._ingest_words.words) ? p._ingest_words.words : null;
  for (const c of p.tracks.video) {
    const cid = clipIdByPath.get(c.src)?.id;
    if (cid) {
      const ws = wordsOfClip
        .all(cid)
        .filter((w) => (w.start_s + w.end_s) / 2 >= c.sourceIn && (w.start_s + w.end_s) / 2 <= c.sourceOut);
      for (const w of ws)
        tw.push({
          text: w.word.trim(),
          start: +(tl + Math.max(0, w.start_s - c.sourceIn) / (c.speed ?? 1)).toFixed(3),
          end: +(tl + (w.end_s - c.sourceIn) / (c.speed ?? 1)).toFixed(3),
        });
    } else if (iw) {
      for (const w of iw) {
        if (w.src && w.src !== c.src) continue; // multi-source sidecar: match the clip's file
        const mid = (w.start + w.end) / 2;
        if (mid < c.sourceIn - 0.02 || mid > c.sourceOut + 0.02) continue;
        tw.push({
          text: (w.text || "").trim(),
          start: +(tl + Math.max(0, w.start - c.sourceIn) / (c.speed ?? 1)).toFixed(3),
          end: +(tl + (w.end - c.sourceIn) / (c.speed ?? 1)).toFixed(3),
        });
      }
    }
    tl += (c.sourceOut - c.sourceIn) / (c.speed ?? 1);
  }
  const wpg = (() => {
    const pv = p._caption_words_per_group;
    return Array.isArray(pv) ? pv : preset.wordsPerGroup ?? [2, 4];
  })();
  const groups = groupCaptions(tw, {
    mode: preset.mode ?? "phrase",
    wordsPerGroup: wpg,
    uppercase: preset.uppercase !== false, // nas_caption = sentence-case
    maxWidthFrac: preset.maxWidthFrac ?? 0.86,
    sizePx: preset.sizePx ?? 76,
    leadMs: 110,
  });
  const pos = p._caption_position ?? preset.position ?? { x: 0.5, y: 0.62 };
  p.tracks.captions = groups.map((g, i) => ({
    id: `c${i + 1}`,
    type: "speech_caption",
    start: g.start,
    end: g.end,
    text: g.text,
    word_ids: g.word_ids,
    words: tw.filter((w) => w.start >= g.start - 0.25 && w.end <= g.end + 0.25),
    style: capId,
    position: pos,
  }));
};

let label = op;
switch (op) {
  case "trim_clip": {
    const { clip } = findClip(flag("clip"));
    if (flag("in") != null) clip.sourceIn = +(+flag("in")).toFixed(3);
    if (flag("out") != null) clip.sourceOut = +(+flag("out")).toFixed(3);
    if (clip.sourceOut - clip.sourceIn < 0.2) throw new Error("clip too short after trim");
    label = `trim_clip ${clip.id} ${clip.sourceIn}-${clip.sourceOut}`;
    reflowVideo();
    regenCaptions();
    break;
  }
  case "delete_clip": {
    const { trk, idx, clip } = findClip(flag("clip"));
    p.tracks[trk].splice(idx, 1);
    label = `delete_clip ${clip.id}`;
    reflowVideo();
    regenCaptions();
    break;
  }
  case "move_clip": {
    const { idx, clip } = findClip(flag("clip"));
    const to = Math.max(0, Math.min(p.tracks.video.length - 1, +flag("to")));
    p.tracks.video.splice(idx, 1);
    p.tracks.video.splice(to, 0, clip);
    label = `move_clip ${clip.id} → ${to}`;
    reflowVideo();
    regenCaptions();
    break;
  }
  case "split_clip": {
    const { trk, idx, clip } = findClip(flag("clip"));
    const at = +flag("at");
    if (at <= clip.sourceIn + 0.1 || at >= clip.sourceOut - 0.1) throw new Error("split point outside clip");
    // unique id for the new tail piece: <id>b, then <id>b2, <id>b3… if taken
    const taken = new Set(p.tracks[trk].map((c) => c.id));
    let nid = `${clip.id}b`;
    for (let n = 2; taken.has(nid); n++) nid = `${clip.id}b${n}`;
    const b = { ...clip, id: nid, sourceIn: +at.toFixed(3) };
    delete b._leadTrimmed;
    clip.sourceOut = +at.toFixed(3);
    p.tracks[trk].splice(idx + 1, 0, b);
    label = `split_clip ${clip.id} @${at} → ${nid}`;
    reflowVideo();
    regenCaptions();
    break;
  }
  case "change_speed": {
    const { clip } = findClip(flag("clip"));
    clip.speed = Math.max(0.25, Math.min(4, +flag("speed")));
    label = `change_speed ${clip.id} ${clip.speed}x`;
    reflowVideo();
    regenCaptions();
    break;
  }
  case "set_crop": {
    const { clip } = findClip(flag("clip"));
    clip.objectPosition = flag("position");
    label = `set_crop ${clip.id} ${clip.objectPosition}`;
    break;
  }
  case "set_rotate": {
    // Sony fix: footage shot vertical but stored landscape with no rotation flag.
    // --clip <id> for one clip, or --all to rotate every video clip the same way.
    const deg = Number(flag("deg"));
    if (![0, 90, 180, 270].includes(deg)) throw new Error("set_rotate --deg 0|90|180|270 [--clip <id> | --all]");
    const targets = flag("all") != null ? p.tracks.video : [findClip(flag("clip")).clip];
    for (const c of targets) {
      if (deg === 0) delete c.rotate;
      else c.rotate = deg;
    }
    label = `set_rotate ${deg}° (${flag("all") != null ? "all clips" : findClip(flag("clip")).clip.id})`;
    break;
  }
  case "set_title_text": {
    if (!p.tracks.title.length) p.tracks.title.push({ id: "t1", type: "title", start: 0, end: 3.2, style: p.title_style });
    p.tracks.title[0].text = String(flag("text")).toUpperCase();
    label = `set_title_text "${p.tracks.title[0].text}"`;
    break;
  }
  case "set_title_style": {
    const id = flag("style");
    loadPreset("title", id);
    p.title_style = id;
    if (p.tracks.title[0]) p.tracks.title[0].style = id;
    label = `set_title_style ${id}`;
    break;
  }
  case "set_title_position": {
    if (!p.tracks.title[0]) throw new Error("no title");
    p.tracks.title[0].position = { x: 0.5, y: +flag("y") };
    p._title_position = p.tracks.title[0].position;
    label = `set_title_position y=${flag("y")}`;
    break;
  }
  case "set_title_hold": {
    if (!p.tracks.title[0]) throw new Error("no title");
    p.tracks.title[0].end = +(+flag("sec")).toFixed(2);
    label = `set_title_hold ${flag("sec")}s`;
    break;
  }
  case "set_caption_style": {
    const id = flag("style");
    loadPreset("caption", id);
    p.caption_style = id;
    delete p._caption_words_per_group;
    // force a rebuild even over manual edits — the user asked for a new style
    p.tracks.captions = p.tracks.captions.filter(() => false);
    regenCaptions();
    label = `set_caption_style ${id}`;
    break;
  }
  case "set_caption_grouping": {
    const m = String(flag("words")).match(/(\d+)\s*-\s*(\d+)/) || String(flag("words")).match(/(\d+)/);
    p._caption_words_per_group = m[2] ? [+m[1], +m[2]] : [+m[1], +m[1]];
    p.tracks.captions = p.tracks.captions.filter(() => false);
    regenCaptions();
    label = `set_caption_grouping ${p._caption_words_per_group.join("-")}`;
    break;
  }
  case "set_caption_position": {
    p._caption_position = { x: 0.5, y: +flag("y") };
    for (const c of p.tracks.captions) c.position = p._caption_position;
    label = `set_caption_position y=${flag("y")}`;
    break;
  }
  case "set_caption_text": {
    const c = p.tracks.captions.find((x) => x.id === flag("id"));
    if (!c) throw new Error(`no caption ${flag("id")}`);
    c.text = String(flag("text")).toUpperCase();
    c.manual = true;
    label = `set_caption_text ${c.id} "${c.text}"`;
    break;
  }
  case "remove_caption": {
    if (flag("id")) {
      p.tracks.captions = p.tracks.captions.filter((c) => c.id !== flag("id"));
      label = `remove_caption ${flag("id")}`;
    } else {
      const a = +flag("from");
      const b = +flag("to");
      const before = p.tracks.captions.length;
      p.tracks.captions = p.tracks.captions.filter((c) => c.end <= a || c.start >= b);
      label = `remove_caption ${a}-${b}s (${before - p.tracks.captions.length} groups)`;
    }
    break;
  }
  case "translate_captions": {
    // fill caption.tr[<lang>] for every group via scripts/dub/translate.py.
    // Style is untouched — only the displayed text swaps when caption_lang is set.
    const lang = String(flag("lang") || "").trim().toLowerCase();
    if (!lang || lang === "src") throw new Error("translate_captions needs --lang <code> (es, ar, he, fr…)");
    const force = rest.includes("--force");
    const caps = p.tracks.captions;
    const todo = caps.filter((c) => force || !(c.tr && c.tr[lang]));
    if (!todo.length) {
      label = `translate_captions ${lang} (already done)`;
      break;
    }
    const py =
      [
        join(root, ".venv-dub", "Scripts", "python.exe"),
        join(root, ".venv-dub", "bin", "python"),
      ].find(existsSync) || "python";
    const payload = JSON.stringify({ texts: todo.map((c) => c.text), src: "en", tgt: lang });
    let out;
    try {
      out = execFileSync(py, [join(root, "scripts", "dub", "translate.py")], {
        input: payload,
        encoding: "utf8",
        maxBuffer: 1 << 24,
      });
    } catch (e) {
      throw new Error(`translate.py failed: ${String(e.stderr || e.message).split("\n")[0]}`);
    }
    const { translations, error } = JSON.parse(out.trim().split("\n").pop());
    if (error) throw new Error(`translate.py: ${error}`);
    todo.forEach((c, i) => {
      c.tr = c.tr || {};
      c.tr[lang] = translations[i];
    });
    label = `translate_captions ${lang} (${todo.length} lines)`;
    break;
  }
  case "set_caption_lang": {
    const lang = String(flag("lang") || "src").trim().toLowerCase();
    if (lang === "src" || lang === "" || lang === "original") {
      delete p.caption_lang;
      label = "set_caption_lang src (original transcript)";
      break;
    }
    const missing = p.tracks.captions.filter((c) => !(c.tr && c.tr[lang])).length;
    if (missing) throw new Error(`${missing} caption(s) not translated to "${lang}" yet — run translate_captions --lang ${lang} first`);
    p.caption_lang = lang;
    label = `set_caption_lang ${lang}`;
    break;
  }
  case "set_music": {
    const track = String(flag("track") || "").trim();
    if (!track) throw new Error("set_music --track <filename in projects/_assets/music/ or a path>");
    const { existsSync, copyFileSync, mkdirSync } = await import("node:fs");
    const { basename, join, isAbsolute } = await import("node:path");
    const src0 = isAbsolute(track) ? track : join(process.cwd(), "projects", "_assets", "music", track);
    if (!existsSync(src0)) throw new Error(`music file not found: ${src0}`);
    const fn = basename(src0);
    mkdirSync(join(process.cwd(), "public", "footage", "music"), { recursive: true });
    copyFileSync(src0, join(process.cwd(), "public", "footage", "music", fn));
    const vol = flag("vol") != null ? Math.max(0, Math.min(1, Number(flag("vol")))) : p.tracks.music?.[0]?.volume ?? 0.1;
    const duck = flag("duck") != null ? flag("duck") !== "false" : p.tracks.music?.[0]?.duck ?? true;
    p.tracks.music = [{ src: `footage/music/${fn}`, volume: vol, duck }];
    label = `set_music ${fn} (vol ${vol}${duck ? ", duck" : ""})`;
    break;
  }
  case "set_music_volume": {
    if (!p.tracks.music?.[0]) throw new Error("no music track — set_music first");
    const vol = Math.max(0, Math.min(1, Number(flag("vol"))));
    if (!Number.isFinite(vol)) throw new Error("set_music_volume --vol <0..1>");
    p.tracks.music[0].volume = vol;
    if (flag("duck") != null) p.tracks.music[0].duck = flag("duck") !== "false";
    label = `set_music_volume ${vol}${p.tracks.music[0].duck ? " (duck)" : ""}`;
    break;
  }
  case "clear_music": {
    p.tracks.music = [];
    label = "clear_music";
    break;
  }
  default:
    console.error(`✗ unknown op "${op}" — see header`);
    process.exit(1);
}

const rev = saveProject(name, p, { label });
console.log(`✓ ${label}   → rev_${String(rev).padStart(3, "0")}`);
console.log(`  ${p.tracks.video.length} clips · ${p.duration.toFixed(1)}s · ${p.tracks.captions.length} caption groups`);
console.log(`  re-render: node scripts/proj-render.mjs ${name}`);
