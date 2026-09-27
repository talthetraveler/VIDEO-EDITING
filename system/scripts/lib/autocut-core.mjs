/**
 * Pure filler/pause-cutting logic — ported from auto_video_editor.py.
 * No I/O, so it's unit-testable. `tighten.mjs` feeds it whisper output.
 */

export const DEFAULTS = {
  MAX_PAUSE: 0.4, // gap between kept words longer than this (s) is cut
  MARGIN: 0.06, // breathing room kept around each speech chunk
  MIN_SEGMENT: 0.08, // drop chunks shorter than this
  FILLERS: [
    "um", "uh", "uhh", "umm", "erm", "hmm", "mm", "mhm", "uh-huh",
    "like", "you know", "i mean", "kind of", "sort of", "so",
    "basically", "literally", "actually", "right",
  ],
};

export const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * whisper.cpp token-level output is BPE SUB-WORDS, not words:
 *   " Sh" "abb" "at" " Sha" "lo" "m"  ->  "Shabbat Shalom"
 * The convention is that a LEADING SPACE starts a new word; everything else
 * continues the current one. Without this, transcripts and captions come out as
 * "Sh abb at Sha lo m" — unusable on screen and it breaks phrase matching.
 *
 * Input/output: [{word, start, end}] (norm is recomputed by the caller).
 */
export const mergeTokensToWords = (tokens) => {
  const out = [];
  for (const t of tokens) {
    const raw = t.word ?? "";
    const startsWord = /^\s/.test(raw) || out.length === 0;
    const piece = raw.trim();
    if (!piece) continue;
    if (startsWord) {
      out.push({ word: piece, start: t.start, end: t.end });
    } else {
      const cur = out[out.length - 1];
      cur.word += piece;
      cur.end = Math.max(cur.end, t.end);
    }
  }
  return out.map((w) => ({ ...w, norm: norm(w.word) }));
};

/** words: [{word,start,end,norm}] -> { kept, removed } */
export const removeFillers = (words, fillers = DEFAULTS.FILLERS) => {
  const seqs = fillers.map((f) => f.split(" ").map(norm)).sort((a, b) => b.length - a.length);
  const kept = [];
  const removed = [];
  for (let i = 0; i < words.length; ) {
    let matched = false;
    for (const seq of seqs) {
      const chunk = words.slice(i, i + seq.length).map((w) => w.norm);
      if (chunk.length === seq.length && chunk.every((v, k) => v === seq[k])) {
        removed.push(...words.slice(i, i + seq.length));
        i += seq.length;
        matched = true;
        break;
      }
    }
    if (!matched) kept.push(words[i++]);
  }
  return { kept, removed };
};

/** kept words -> [[startSec,endSec]] with gaps > maxPause cut, margins added. */
export const wordsToSegments = (kept, totalDuration, o = {}) => {
  const maxPause = o.maxPause ?? DEFAULTS.MAX_PAUSE;
  const margin = o.margin ?? DEFAULTS.MARGIN;
  const minSeg = o.minSegment ?? DEFAULTS.MIN_SEGMENT;
  if (!kept.length) return [];
  const sorted = [...kept].sort((a, b) => a.start - b.start);
  const segs = [];
  let s = sorted[0].start;
  let e = sorted[0].end;
  for (const w of sorted.slice(1)) {
    if (w.start - e <= maxPause) e = Math.max(e, w.end);
    else { segs.push([s, e]); s = w.start; e = w.end; }
  }
  segs.push([s, e]);

  const out = [];
  for (let [a, b] of segs) {
    a = Math.max(0, a - margin);
    b = Math.min(totalDuration, b + margin);
    if (b - a < minSeg) continue;
    if (out.length && a <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b);
    else out.push([a, b]);
  }
  return out;
};

/**
 * Flag spans that contain a greeting / kindness cue — for the
 * kindness-greetings reel format. `words` = [{word,start,end,norm}].
 * Returns [{ phrase, start, end, context }] where context is ±`pad` words.
 *
 * Matches against the SPACE-STRIPPED transcript so it survives whisper.cpp
 * splitting a word into sub-tokens ("sh abb at shal om" -> "shabbatshalom").
 * Each entry is `[label, ...spellings]`; spellings are matched space-free.
 */
export const GREETING_TERMS = [
  ["shabbat shalom", "shabbatshalom", "shabatshalom", "shabbosshalom"],
  ["salam alaikum", "salamalaikum", "salamalaykum", "assalamualaikum", "assalamualaykum", "asalamalaikum", "salaamalaikum"],
  ["shalom", "shalom"],
  ["salam", "salam", "salaam"],
  ["marhaba", "marhaba", "marhabaan"],
  ["ahlan", "ahlan"],
  ["habibi", "habibi"],
  ["peace be with you", "peacebewithyou"],
  ["god bless you", "godblessyou", "godblessyou"],
  ["bless you", "blessyou"],
  ["welcome", "welcome"],
  ["kindness", "kindness"],
  ["spread love", "spreadlove"],
];

export const findGreetings = (words, pad = 6) => {
  // flat[k] is the concatenated norm string; tokenAt maps a flat char index to
  // the token index it belongs to.
  let flat = "";
  const tokenAt = [];
  words.forEach((w, i) => {
    for (let c = 0; c < w.norm.length; c++) tokenAt.push(i);
    flat += w.norm;
  });

  const hits = [];
  const used = []; // [flatStart, flatEnd) ranges already claimed
  const overlaps = (a, b) => used.some(([x, y]) => a < y && b > x);

  for (const [label, ...spellings] of GREETING_TERMS) {
    for (const sp of spellings) {
      let from = 0;
      let idx;
      while ((idx = flat.indexOf(sp, from)) !== -1) {
        const end = idx + sp.length;
        from = end;
        if (overlaps(idx, end)) continue;
        used.push([idx, end]);
        const tStart = tokenAt[idx];
        const tEnd = tokenAt[end - 1];
        const a = Math.max(0, tStart - pad);
        const b = Math.min(words.length, tEnd + 1 + pad);
        hits.push({
          phrase: label,
          start: words[tStart].start,
          end: words[tEnd].end,
          context: words.slice(a, b).map((w) => w.word).join(" ").replace(/\s+/g, " ").trim(),
        });
      }
    }
  }
  return hits.sort((x, y) => x.start - y.start);
};
