/**
 * Phrase-anchored beat extraction.
 *
 * Many indexed moments are 20-50s because one speech region holds an entire
 * exchange ("what's your name Yusuf are you Muslim Yes nice to meet you I'm
 * Jewish and..."). For a multi-person compilation we need the 4-8s around a
 * specific line. Word-level timings make that exact.
 */

/** Normalised word list -> a single lowercase string + index map for matching. */
const buildIndex = (words) => {
  let text = "";
  const at = []; // char offset -> word index
  words.forEach((w, i) => {
    const piece = (w.word || "").trim().toLowerCase();
    if (!piece) return;
    if (text) {
      text += " ";
      at.push(i);
    }
    for (let c = 0; c < piece.length; c++) at.push(i);
    text += piece;
  });
  return { text, at };
};

/**
 * Find every match of `re` in the clip's words.
 * Returns [{ startIdx, endIdx, startSec, endSec, text }].
 */
export const findPhrases = (words, re) => {
  const { text, at } = buildIndex(words);
  const out = [];
  const rx = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m;
  while ((m = rx.exec(text)) !== null) {
    if (m[0].length === 0) {
      rx.lastIndex++;
      continue;
    }
    const s = at[m.index];
    const e = at[Math.min(text.length - 1, m.index + m[0].length - 1)];
    if (s == null || e == null) continue;
    out.push({
      startIdx: s,
      endIdx: e,
      startSec: words[s].start,
      endSec: words[e].end,
      text: m[0],
    });
  }
  return out;
};

/**
 * A tight beat around a phrase match: `before` words of run-up, `after` words of
 * pay-off, clamped to the clip. Returns null if it can't make a usable span.
 */
export const beatAround = (words, match, { before = 3, after = 12, minSec = 2.2, maxSec = 11, clipDur = Infinity } = {}) => {
  const a = Math.max(0, match.startIdx - before);
  const b = Math.min(words.length - 1, match.endIdx + after);
  if (b <= a) return null;
  let inS = Math.max(0, words[a].start - 0.18);
  let outS = Math.min(clipDur, words[b].end + 0.55); // hold for the reaction
  // grow forward if too short, then hard-clamp
  let k = b;
  while (outS - inS < minSec && k + 1 < words.length) {
    k++;
    outS = Math.min(clipDur, words[k].end + 0.55);
  }
  if (outS - inS > maxSec) outS = inS + maxSec;
  if (outS - inS < minSec) return null;
  return {
    inS: +inS.toFixed(2),
    outS: +outS.toFixed(2),
    text: words.slice(a, b + 1).map((w) => w.word).join(" ").replace(/\s+/g, " ").trim(),
  };
};

/** Deterministic PRNG so a given variation index always rebuilds identically. */
export const rng = (seed) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
};

export const shuffled = (arr, seed) => {
  const r = rng(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
