/**
 * Caption grouping engine — turn word-level timings into caption GROUPS a human
 * reads as phrases, not fixed N-word bricks.
 *
 * Two things a card must NEVER do:
 *   1. sit on screen when nobody is speaking those words (SPEECH-ONLY)
 *   2. break a phrase across cards — end on "the" / "to" / "in", split
 *      "the / best", strand "Israel" alone, glue a question onto its answer.
 *
 * SPEECH-ONLY rules:
 *   - a group's window is [first word start, last word end] (+ tiny pad), never
 *     stretched to fill a gap
 *   - a pause > gapSplitSec inside a group SPLITS it
 *   - one word can't hold longer than maxWordSec (whisper stamps some word ends
 *     deep into the following silence)
 *
 * PHRASE rules:
 *   - hard break after . ! ?   ·   soft break after , ; : — when the card is full enough
 *   - a card may not END on a glue word (the/a/to/of/in/and/is/…) — carry it on
 *   - prefer to START a card at a sentence-starter (so/and/but/what/are/…) when
 *     a clause just finished or there was a real pause  → keeps Q and A apart
 *   - a lone dangling word gets merged back into its neighbour
 *
 * Modes: "phrase" (2–3), "short" (2), "word" (opt-in only), "none".
 * Output group: { start, end, text, word_ids:[i,…] }.
 */

const norm = (w) => w.replace(/[^A-Za-z0-9']/g, "");
const bareKey = (w) => norm(w).toLowerCase();
// tolerant glue test: "it's" → "its", "we're" → "were", etc.
const isGlue = (b) => GLUE_TRAIL.has(b) || GLUE_TRAIL.has(b.replace(/'/g, ""));
const HARD_END = /[.!?…]$/;
const SOFT_END = /[,;:—–-]$/;

// a card must not END on one of these (glue → the noun/verb it leads is next card)
const GLUE_TRAIL = new Set(
  ("the a an my your his her its our their to of in on at by for with from into onto over " +
    "and but or nor as that this these those is are am was were be been being do does did " +
    "have has had will would can could should may might must not no so if because when while " +
    "about only just very really quite even still about's more most")
    .split(" "),
);
// a NEW card would rather start here (sentence / turn boundary)
const STARTER = new Set(
  ("so and but then well now okay ok yeah yes no what who whom whose where when why how " +
    "are is am was were do does did can could would should will shall have has had if " +
    "because i you he she we they it my your listen wait look thank")
    .split(" "),
);

// Keep a card to ONE line. Tuned so a 3-word card with long words (e.g.
// "HELLO, SALAM ALAIKUM.") splits rather than wrapping — matches Tal's reels
// where a caption is almost always a single line.
const fitsWidth = (text, sizePx, maxWidthFrac) => {
  const maxPx = 1080 * (maxWidthFrac ?? 0.86);
  const perChar = sizePx * 0.6; // heavy 900-weight caps run wide
  return text.length * perChar <= maxPx * 0.92;
};

export const groupCaptions = (words, opts = {}) => {
  const {
    mode = "phrase",
    wordsPerGroup = mode === "short" ? [2, 2] : [2, 3],
    pauseBreakSec = 0.28,
    gapSplitSec = 0.45,
    turnGapSec = 0.3, // gap this long + a sentence-starter next = new card (speaker turn)
    maxWordSec = 0.9,
    leadInSec = 0.04,
    tailPadSec = 0.12,
    maxWidthFrac = 0.86,
    sizePx = 74,
    leadMs = 0,
  } = opts;

  const clean = words
    .map((w) => ({ ...w, word: (w.word ?? w.text ?? "").toString().trim() }))
    .filter((w) => w.word && w.end > w.start)
    .map((w, i) => ({
      i,
      word: w.word,
      start: w.start,
      end: w.end,
      dispEnd: Math.min(w.end, w.start + maxWordSec),
      bare: norm(w.word).toLowerCase(),
      hard: HARD_END.test(w.word),
      soft: SOFT_END.test(w.word),
    }))
    .filter((w) => w.bare.length || /[0-9]/.test(w.word));

  if (!clean.length || mode === "none") return [];

  const SUBJECT_PRON = new Set(["i", "you", "he", "she", "we", "they"]);
  const [minW, maxW] = wordsPerGroup;
  const hardCap = maxW + 2; // allowed only to avoid ending on a glue word
  const groups = [];
  let cur = [];

  const textOf = (arr) =>
    arr
      .map((w) => w.word)
      .join(" ")
      .replace(/\s+([,.!?;:])/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

  // a card must not END on a run of glue words — migrate them to the next card
  const flush = () => {
    if (!cur.length) return;
    const carry = [];
    while (cur.length > 1 && isGlue(cur[cur.length - 1].bare) && !cur[cur.length - 1].hard) {
      carry.unshift(cur.pop());
    }
    const t = textOf(cur);
    const startS = cur[0].start - leadInSec + leadMs / 1000;
    const endS = Math.max(...cur.map((w) => w.dispEnd)) + tailPadSec + leadMs / 1000;
    groups.push({
      start: +Math.max(0, startS).toFixed(3),
      end: +endS.toFixed(3),
      text: opts.uppercase === false ? t : t.toUpperCase(),
      word_ids: cur.map((w) => w.i),
      _last: cur[cur.length - 1],
    });
    cur = carry;
  };

  for (let k = 0; k < clean.length; k++) {
    const w = clean[k];
    const prev = clean[k - 1];
    const next = clean[k + 1];
    // measure gaps from the CLAMPED end — whisper often stamps a word's end
    // right up against the next word across an audible silence, which hid real
    // pauses (a caption then sat over dead air for seconds).
    const gapBefore = prev ? w.start - prev.dispEnd : 0;
    const gapAfter = next ? next.start - w.dispEnd : 999;

    if (mode === "word") {
      cur = [w];
      flush();
      continue;
    }

    // a real pause before THIS word ends the current card (caption never spans a pause)
    if (cur.length && (gapBefore >= gapSplitSec || (cur.length >= minW && gapBefore >= pauseBreakSec))) flush();

    // speaker-turn / new-sentence: break BEFORE a starter word when a clause just
    // closed, there was a beat, or a subject pronoun starts a fresh thought —
    // this is what keeps a question off its answer ("MAHMOUD," | "ARE YOU MUSLIM?")
    if (cur.length && STARTER.has(w.bare) && !isGlue(cur[cur.length - 1].bare)) {
      const last = cur[cur.length - 1];
      const clauseClosed = last.hard || last.soft;
      const beat = gapBefore >= turnGapSec && cur.length >= minW;
      const freshSubject = cur.length >= minW && SUBJECT_PRON.has(w.bare) && !SUBJECT_PRON.has(last.bare);
      if (clauseClosed || beat || freshSubject) flush();
    }

    // width guard
    if (cur.length >= minW && !fitsWidth(textOf([...cur, w]), sizePx, maxWidthFrac)) flush();

    cur.push(w);

    // ---- decide whether to close AFTER this word ----
    const lastBare = w.bare;
    const endsOnGlue = isGlue(lastBare) && !w.hard;
    const nextIsStarter = next && STARTER.has(next.bare);

    if (w.hard) {
      flush();
    } else if (endsOnGlue && cur.length < hardCap) {
      // keep going — don't end a card on "the" / "to" / "is"
    } else if (cur.length >= maxW) {
      flush();
    } else if (cur.length >= minW && w.soft) {
      flush();
    } else if (cur.length >= minW && nextIsStarter && gapAfter >= pauseBreakSec) {
      flush();
    } else if (cur.length >= minW && gapAfter >= gapSplitSec) {
      flush();
    }
  }
  flush();

  // ---- merge a lone / glue-only dangling card into its neighbour ----------
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const wc = g.word_ids.length;
    const dangling = wc === 1 || (wc <= 2 && isGlue(bareKey(g._last.word)) && !HARD_END.test(g._last.word));
    if (!dangling) continue;
    const prev = groups[i - 1];
    const nextG = groups[i + 1];
    const selfEndsHard = HARD_END.test(g._last.word);
    const selfEndsSoft = SOFT_END.test(g._last.word);
    const canFwd =
      nextG &&
      !selfEndsHard &&
      !selfEndsSoft && // a comma-ending fragment closes a clause → it belongs with what came BEFORE
      nextG.start - g.end < gapSplitSec &&
      fitsWidth(`${g.text} ${nextG.text}`, sizePx, maxWidthFrac);
    const canBack =
      prev &&
      !HARD_END.test(prev._last.word) &&
      g.start - prev.end < gapSplitSec &&
      fitsWidth(`${prev.text} ${g.text}`, sizePx, maxWidthFrac);
    // a trailing clause-ender merges back; a bare lead-in word merges forward
    if ((selfEndsSoft || selfEndsHard) && canBack) {
      prev.word_ids = [...prev.word_ids, ...g.word_ids];
      prev.text = `${prev.text} ${g.text}`.replace(/\s+/g, " ");
      prev.end = Math.max(prev.end, g.end);
      prev._last = g._last;
      groups.splice(i, 1);
      i--;
    } else if (canFwd) {
      nextG.word_ids = [...g.word_ids, ...nextG.word_ids];
      nextG.text = (opts.uppercase === false ? `${g.text} ${nextG.text}` : `${g.text} ${nextG.text}`.toUpperCase()).replace(/\s+/g, " ");
      nextG.start = Math.min(g.start, nextG.start);
      groups.splice(i, 1);
      i--;
    } else if (canBack) {
      prev.word_ids = [...prev.word_ids, ...g.word_ids];
      prev.text = `${prev.text} ${g.text}`.replace(/\s+/g, " ");
      prev.end = Math.max(prev.end, g.end);
      prev._last = g._last;
      groups.splice(i, 1);
      i--;
    }
  }

  // drop a lone glue/filler word left by a stutter ("It's it's the only…") that
  // wouldn't merge because of the pause between the repeats
  const kept = groups.filter((g) => {
    if (g.word_ids.length !== 1) return true;
    const solo = norm(g._last.word).toLowerCase();
    return !(isGlue(solo) && !HARD_END.test(g._last.word) && g.end - g.start < 0.6);
  });

  // clamp accidental overlap; never extend a group toward the next
  for (let i = 0; i < kept.length - 1; i++) {
    if (kept[i].end > kept[i + 1].start) kept[i].end = kept[i + 1].start;
  }
  return kept.filter((g) => g.end - g.start > 0.1 && g.text.length).map(({ _last, ...g }) => g);
};

export const regroupFromWords = (words, opts) => groupCaptions(words, opts);
