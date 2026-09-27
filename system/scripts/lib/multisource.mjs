/**
 * Group a folder of clips into SCENES. A scene is one real-world moment; it may
 * have been shot from more than one camera (e.g. Meta Ray-Bans POV + an iPhone
 * on a zoom lens). When two clips are the same moment from different angles the
 * editor can cut between them.
 *
 * Signals used (any two → same scene):
 *   1. capture-time proximity  — ffprobe creation_time within an overlap window
 *   2. transcript overlap      — the same words spoken (token Jaccard ≥ 0.28)
 * A differing aspect ratio / resolution between the pair strengthens it and
 * decides which is the WIDE angle and which is the TIGHT one.
 */
import { execFileSync } from "node:child_process";

const norm = (s) => (s || "").toLowerCase().match(/[a-z0-9']+/g) || [];
const STOP = new Set(
  "a an the and or but so of to in on at is are was were be i you he she it we they this that with for from your my our".split(" "),
);
const contentSet = (t) => new Set(norm(t).filter((w) => !STOP.has(w)));
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};

export function probe(path) {
  try {
    const j = JSON.parse(
      execFileSync(
        "ffprobe",
        ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration:format_tags=creation_time", "-of", "json", path],
        { encoding: "utf8" },
      ),
    );
    const s = j.streams?.[0] || {};
    const ct = j.format?.tags?.creation_time;
    return {
      w: Number(s.width || 0),
      h: Number(s.height || 0),
      dur: Number(j.format?.duration || 0),
      t: ct ? Date.parse(ct) / 1000 : null,
    };
  } catch {
    return { w: 0, h: 0, dur: 0, t: null };
  }
}

/**
 * clips: [{ name, path, transcript, dur }]  (from tighten's <slug>.index.json + a
 * path). Returns scenes: [{ id, clips:[{...clip, role, meta}] }] ordered by time.
 */
export function groupScenes(clips) {
  const enriched = clips.map((c) => ({ ...c, meta: probe(c.path), toks: contentSet(c.transcript) }));
  // order by capture time when we have it, else by name
  enriched.sort((a, b) => (a.meta.t ?? 1e15) - (b.meta.t ?? 1e15) || a.name.localeCompare(b.name));

  const scenes = [];
  for (const c of enriched) {
    let joined = null;
    for (const sc of scenes) {
      for (const other of sc.clips) {
        // time overlap: [t, t+dur] windows within 90 s, when both have a timestamp
        const timeClose =
          c.meta.t != null &&
          other.meta.t != null &&
          Math.abs(c.meta.t - other.meta.t) < Math.max(c.meta.dur, other.meta.dur) + 90;
        const jac = jaccard(c.toks, other.toks);
        const wordClose = jac >= 0.28;
        if ((timeClose && jac >= 0.15) || (wordClose && Math.min(c.toks.size, other.toks.size) >= 3)) {
          joined = sc;
          break;
        }
      }
      if (joined) break;
    }
    if (joined) joined.clips.push(c);
    else scenes.push({ id: `sc${scenes.length + 1}`, clips: [c] });
  }

  // within a multi-angle scene, label WIDE (bigger FOV / lower zoom ≈ larger frame
  // area or 3:4 POV) vs TIGHT (portrait / zoomed)
  for (const sc of scenes) {
    if (sc.clips.length < 2) {
      sc.clips[0].role = "solo";
      continue;
    }
    const byArea = [...sc.clips].sort((a, b) => b.meta.w * b.meta.h - a.meta.w * a.meta.h);
    sc.clips.forEach((c) => {
      const ar = c.meta.w && c.meta.h ? c.meta.w / c.meta.h : 1;
      c.role = ar >= 0.9 ? "wide" : "tight"; // 3:4 / 16:9 POV ≈ wide, 9:16 zoom ≈ tight
    });
    if (sc.clips.every((c) => c.role === sc.clips[0].role)) {
      // aspect didn't separate them — fall back to frame area
      byArea[0].role = "wide";
      byArea.slice(1).forEach((c) => (c.role = "tight"));
    }
    sc.multi = true;
  }
  return scenes;
}

/**
 * Cut plan alternating two angles of the same scene. Returns SHOT specs
 * ({src,in,out,words}) — ~pace seconds per angle, starting on `first`.
 * wordsOf: (clip) => SOURCE-time [{text,start,end}] for that clip.
 */
export function interleaveScene(scene, wordsOf, { pace = 4, first = "wide" } = {}) {
  const wide = scene.clips.find((c) => c.role === "wide") || scene.clips[0];
  const tight = scene.clips.find((c) => c.role === "tight") || scene.clips[1] || wide;
  const angles = first === "tight" ? [tight, wide] : [wide, tight];
  const len = Math.min(...scene.clips.map((c) => c.meta.dur || c.dur || 0)) || wide.meta.dur || 8;
  const shots = [];
  let t = 0;
  let k = 0;
  while (len - t > pace * 0.6) {
    const a = angles[k % 2];
    const end = Math.min(len, t + pace);
    shots.push({ src: a.src, in: +t.toFixed(2), out: +end.toFixed(2), words: wordsOf(a) });
    t = end;
    k++;
  }
  return shots;
}
