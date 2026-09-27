/**
 * Assemble a project.json from an ordered list of SHOTS drawn from ANY number of
 * source files. Shared by scripts/recreate.mjs (folder + reference → edit) and
 * available to scripts/ingest.mjs.
 *
 * A shot: { src, in, out, speed?, rotate?, words?: [{text,start,end}] }
 *   - src   : "footage/<...>.MP4"  (as staticFile() would resolve it)
 *   - in/out: SOURCE seconds
 *   - words : WORD-LEVEL (already merged) spoken words, SOURCE-time. Whichever fall
 *             inside [in,out] are used; caller may pass the whole clip's list.
 *
 * Produces: video track, phrase-grouped captions (positivity-gated), a title
 * card, an optional music bed, and a `_ingest_words` sidecar (per-src, SOURCE
 * time) so proj-op / proj-recaption can rebuild captions after a clip edit.
 */
import { groupCaptions } from "./caption-group.mjs";
import { scanNegative, isBareNo } from "./positivity.mjs";
import { emptyProject } from "./project.mjs";

const round = (n) => Math.round(n * 1000) / 1000;

export function buildProject(shots, opts = {}) {
  const p = emptyProject({ id: opts.slug || "recreate", slug: opts.slug || "recreate", brief: opts.brief || "" });
  p.caption_style = opts.captionStyle || "nas_caption";
  p.title_style = opts.titleStyle || "tal_top_title";
  p.handle = opts.handle || "@talthetraveler";

  const vid = [];
  const tlWords = []; // timeline seconds
  const ingestWords = []; // SOURCE seconds, per src
  let tl = 0;
  shots.forEach((sh, i) => {
    const spd = sh.speed || 1;
    const dur = Math.max(0.1, (sh.out - sh.in) / spd);
    vid.push({
      id: `v${i + 1}`,
      src: sh.src,
      sourceIn: round(sh.in),
      sourceOut: round(sh.out),
      timelineStart: round(tl),
      speed: spd,
      ...(sh.rotate ? { rotate: sh.rotate } : {}),
    });
    for (const w of sh.words || []) {
      const mid = (w.start + w.end) / 2;
      if (mid < sh.in - 0.05 || mid > sh.out + 0.05) continue;
      const ws = round(tl + (Math.max(w.start, sh.in) - sh.in) / spd);
      const we = round(tl + (Math.min(w.end, sh.out) - sh.in) / spd);
      tlWords.push({ word: (w.text || "").trim(), start: ws, end: Math.max(we, ws + 0.05) });
      ingestWords.push({ text: (w.text || "").trim(), start: round(w.start), end: round(w.end), src: sh.src });
    }
    tl += dur;
  });

  const groups = groupCaptions(tlWords, { mode: "phrase", wordsPerGroup: [3, 5], uppercase: false }).filter(
    (g) => !scanNegative(g.text) && !isBareNo(g.text),
  );

  p.tracks.video = vid;
  p.tracks.captions = groups.map((g, i) => ({
    id: `c${i + 1}`,
    type: "speech_caption",
    start: round(g.start),
    end: round(Math.max(g.end, g.start + 0.2)),
    text: g.text,
    words: (g.words || []).map((w) => ({ text: w.text, start: round(w.start), end: round(w.end) })),
    style: "tal_caption",
    position: { x: 0.5, y: 0.76 },
  }));
  p.tracks.title = [
    {
      id: "t1",
      type: "title",
      text: opts.title || "ADD TITLE ✏️",
      start: 0,
      end: Math.min(3.6, Math.max(2, tl)),
      style: p.title_style,
      position: { x: 0.5, y: 0.11 },
    },
  ];
  if (opts.music && opts.music.src) {
    p.tracks.music = [{ src: opts.music.src, volume: opts.music.volume ?? 0.08, duck: opts.music.duck ?? true }];
  }
  p._ingest_words = { multi: true, words: ingestWords };
  p.duration = round(tl);
  return p;
}

/**
 * Cut a continuous [in,out] source span into shots of ~targetShotS (jittered),
 * snapping each cut to the nearest word boundary so we never cut mid-word.
 * words: SOURCE-time [{text,start,end}] covering the span.
 */
export function paceSpan(src, inS, outS, words, targetShotS, { jitter = 0.25 } = {}) {
  const shots = [];
  const inRange = (words || []).filter((w) => w.end > inS && w.start < outS).sort((a, b) => a.start - b.start);
  let cur = inS;
  while (outS - cur > targetShotS * (1 + jitter)) {
    const want = cur + targetShotS * (1 + (Math.random() * 2 - 1) * jitter);
    // snap to the gap after the nearest word that ends before `want`
    let cut = want;
    let best = Infinity;
    for (const w of inRange) {
      if (w.end <= cur + 0.2 || w.end >= outS - 0.2) continue;
      const d = Math.abs(w.end - want);
      if (d < best) {
        best = d;
        cut = w.end + 0.03;
      }
    }
    if (cut - cur < targetShotS * 0.4) cut = Math.min(outS - 0.2, cur + targetShotS);
    shots.push({ src, in: round(cur), out: round(cut), words: inRange });
    cur = cut;
  }
  shots.push({ src, in: round(cur), out: round(outS), words: inRange });
  return shots;
}
