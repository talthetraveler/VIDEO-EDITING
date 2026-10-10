// WHERE A CAPTION APPEARS. One place, so it can be tested without rendering.
//
// Tal, 2026-09-22 and again 2026-09-24: *"make sure when I speak then the
// captions show up."*
//
// THE RULE: a caption starts when the voice starts, and is replaced when the
// next voice starts. Nothing else may move it.
//
// WHAT THIS REPLACED (bug found 2026-09-24, reproducible with
// `node system/scripts/test-caption-timing.mjs --old`)
//   The old code computed `a = Math.max(prevEnd, ...)` — a caption could not
//   begin before the previous one ENDED. Every caption is held a readable
//   minimum, so as soon as someone spoke faster than that minimum, each line
//   pushed the next one later and the error ACCUMULATED down the beat:
//     voice at 0.0 0.5 1.0 1.5 2.0  ->  caption at 0.0 0.8 1.6 2.4 3.0
//   The fifth caption arrived a full second after the words it captions.
//   At a normal pace (1.0s between lines) nothing was visibly wrong, which is
//   why it survived: it only bit in fast exchanges — which is most of the
//   good material.
//
// THE FIX, in two parts
//   1. A caption's start is its own speech onset. The PREVIOUS caption is cut
//      short by it, rather than the next one being delayed.
//   2. When two onsets are closer together than a line can be read, the lines
//      are MERGED into one caption. Delaying a line to make it readable is
//      what caused the drift; merging keeps every caption on the voice.
//      This is Tal's own rule — "treat captions as rhythm: rapid speech
//      produces rapid replacements" — rather than a queue that slips.

export const MIN_SHOW = 0.45;   // shortest a caption may be on screen
export const HOLD_MAX = 2.2;    // longest, so a pause leaves the screen clean
export const SNAP_WINDOW = 1.2; // how far an estimate may reach for a real onset
const MERGE_MAX_WORDS = 7;      // do not build an unreadable line while merging

/**
 * @param onsets        measured speech starts within the beat, seconds, sorted
 * @param texts         caption lines, in speaking order
 * @param wordsPerChunk word count of each line
 * @param a0,b0         the segment's span within the beat
 * @returns [{a, b, text}] in order
 */
export function placeCaptions(onsets, texts, wordsPerChunk, a0, b0) {
  const n = texts.length;
  if (!n) return [];

  // 1. ESTIMATE — position by word count through the segment's own span.
  //    Only accurate enough to choose WHICH onset a line belongs to.
  const total = wordsPerChunk.reduce((t, x) => t + x, 0) || 1;
  let cum = 0;
  let starts = wordsPerChunk.map((w) => {
    const v = a0 + (cum / total) * (b0 - a0);
    cum += w;
    return v;
  });

  // 2. SNAP — assign lines to measured onsets IN ORDER, choosing the
  //    assignment with the smallest total error.
  //
  //    NOT greedy-nearest-per-line. Greedy strands lines: with voice at
  //    0.0 0.5 1.0 1.5 2.0 and five lines, line 3's estimate (1.28) sits
  //    marginally nearer 1.5 than 1.0, takes it, and then line 5 finds every
  //    onset used and falls back to its estimate — 0.56s after the voice.
  //    Same failure around a pause: a line lands between two utterances and
  //    plays over silence while a perfectly good onset goes unused.
  //
  //    So it is solved as a whole: pick strictly increasing onset indices for
  //    the lines, minimising the total distance to their estimates. Small DP,
  //    a handful of lines per segment.
  if (onsets.length) {
    starts = assignInOrder(starts, onsets);
  }

  // 3. MERGE lines that arrive closer together than they can be read.
  //    Merging keeps both on the voice; delaying one would not.
  const merged = [];
  for (let i = 0; i < n; i++) {
    const prev = merged[merged.length - 1];
    const gap = prev ? starts[i] - prev.a : Infinity;
    const wouldBe = prev ? prev.words + wordsPerChunk[i] : 0;
    if (prev && gap < MIN_SHOW && wouldBe <= MERGE_MAX_WORDS) {
      prev.text = `${prev.text} ${texts[i]}`.replace(/\s+/g, " ").trim();
      prev.words = wouldBe;
    } else {
      merged.push({ a: starts[i], text: texts[i], words: wordsPerChunk[i] });
    }
  }

  // 4. END — a caption lives until the next one arrives, capped so a pause
  //    leaves the screen clean, and never past the segment.
  const out = [];
  for (let i = 0; i < merged.length; i++) {
    const cur = merged[i];
    const a = Math.min(Math.max(cur.a, a0), Math.max(a0, b0 - MIN_SHOW));
    const next = i + 1 < merged.length ? merged[i + 1].a : Infinity;
    const b = Math.min(next, b0, a + HOLD_MAX);
    if (b - a < 0.15) continue;                 // nothing readable left
    out.push({ a: round(a), b: round(Math.max(b, a + 0.15)), text: cur.text });
  }
  return out;
}

const round = (t) => Math.round(t * 1000) / 1000;

// ---------------------------------------------------------------------------
// HOLD — Tal, 2026-09-29: *"the caption pops up for like 0.2 seconds and then
// it goes away … it doesn't hold till I finish my sentence … it doesn't hold
// till the next person says something."* Measured on 35 finished videos:
// median 0.56s on screen, 40% under 0.5s, 84% under 0.8s, and 479 blank
// flashes between words. The old rule here was "a caption must not span a
// gap"; his direction replaces it: a caption holds until the next one
// replaces it, and only a REAL pause clears the screen.
export const READ_MIN = 0.8;     // nothing shorter than this is readable
export const BRIDGE = 1.0;       // a gap shorter than this is inside a sentence - hold across it
export const TAIL = 0.4;         // after the last word before a real pause
export const HOLD_LONG = 3.2;    // a single line never stays longer than this
const HOLD_MERGE_WORDS = 7;      // two short lines - still readable at the auto-shrunk size

/**
 * @param caps [{a, b, text}] sorted or not; a/b = when the words are SPOKEN
 * @param end  hard stop (beat / segment end), seconds
 * @returns    [{a, b, text}] - starts unchanged (still on the voice), ends held
 */
const endsSentence = (c) => c.end ?? /[.!?]["']?$/.test(String(c.text).trim());

export function holdCaptions(caps, end = Infinity, maxWords = HOLD_MERGE_WORDS) {
  const cs = caps.map((c) => ({ ...c })).sort((x, y) => x.a - y.a);
  // 1. a line that would be on screen shorter than READ_MIN before the next
  //    one arrives is MERGED into it (never delayed - delaying drifts).
  const merged = [];
  for (const c of cs) {
    const prev = merged[merged.length - 1];
    const words = (t) => String(t).split(/\s+/).filter(Boolean).length;
    if (prev && c.a - prev.a < READ_MIN && words(prev.text) + words(c.text) <= maxWords) {
      // Where a SENTENCE ended, the parts meet on a LINE BREAK - a space turned
      // two sentences into a run-on ("NICE TO MEET YOU WHAT'S YOUR NAME",
      // Yusuf). Mid-phrase they meet on a space - breaking there put
      // "I JUST / LANDED IN ISRAEL" on screen. Sentence end = the part's own
      // . ! ? (captionLines keeps a closing full stop for this) or the
      // builder's `end` flag. Full stops are dropped at the join; two lines max.
      const clean = (t) => String(t).replace(/[ \t]+/g, " ").trim();
      const noStop = (t) => clean(t).replace(/[.,;:]+$/, "");
      if (!prev.text.includes("\n") && endsSentence(prev)) prev.text = `${noStop(prev.text)}\n${clean(c.text)}`;
      else prev.text = `${noStop(prev.text)} ${clean(c.text)}`;
      prev.end = c.end;
      prev.b = Math.max(prev.b, c.b);
    } else merged.push(c);
  }
  // 2. hold: until the next caption if it comes within BRIDGE, else a short
  //    tail into the pause; never under READ_MIN; never past the next start.
  for (let i = 0; i < merged.length; i++) {
    const c = merged[i];
    const next = i + 1 < merged.length ? merged[i + 1].a : Infinity;
    let b = next - c.b < BRIDGE ? next : c.b + TAIL;
    b = Math.max(b, c.a + READ_MIN);
    b = Math.min(b, next, end, c.a + Math.max(HOLD_LONG, c.b - c.a + TAIL));
    c.b = round(b);
    c.a = round(c.a);
  }
  return merged.filter((c) => c.b - c.a > 0.05);
}

/**
 * PLACE BY THE WORDS THEMSELVES. When a clip is WhisperX-aligned, every word
 * has an exact start and end, so a line starts on its first word and ends on
 * its last - no share-of-speaking-time estimate. That estimate put lines up to
 * ~2s EARLY (a line placed in the previous sentence's speech run, Cesar cut
 * 2026-09-29).
 * @param lines [{text, words:[{start,end}]}] in speaking order, times in beat seconds
 */
export function placeByWords(lines) {
  return lines
    .filter((l) => l.words && l.words.length)
    .map((l) => ({ a: round(l.words[0].start), b: round(l.words[l.words.length - 1].end), text: l.text }));
}

/**
 * LAY LINES INSIDE MEASURED SPEECH.
 *
 * Preferred over `placeCaptions` on real street audio. Onsets alone are not
 * enough there: the mic fires on a bottle crinkle, a footstep, a scooter, and
 * a caption snapped to one of those sits over silence even though the snapping
 * was "correct". Measured 2026-09-24 on clip 01 — 6 of 19 captions landed on
 * transients that way.
 *
 * A RUN has duration, so it cannot be a click. Lines are distributed across
 * the runs inside their segment in proportion to word count, and a line is
 * never placed outside one. That makes "is there speech under this caption"
 * true by construction rather than by luck.
 *
 * @param runs  [[start,end], ...] measured speech inside the segment
 * @param texts lines in speaking order
 * @param words word count per line
 */
export function placeInSpeech(runs, texts, words) {
  const spans = (runs ?? []).filter(([s, e]) => e > s);
  if (!spans.length || !texts.length) return [];

  const talk = spans.reduce((t, [s, e]) => t + (e - s), 0);
  const totalW = words.reduce((t, x) => t + x, 0) || 1;

  // walk the runs, giving each line a slice of SPEAKING time
  const out = [];
  let si = 0;
  let cursor = spans[0][0];
  for (let i = 0; i < texts.length; i++) {
    const want = (words[i] / totalW) * talk;
    // DON'T START A LINE IN THE DREGS OF A RUN. With too little of the current
    // run left for this line, its speech is really in the NEXT run - starting it
    // here showed "YES I AM" during the previous sentence, ~2s before it was said.
    if (si + 1 < spans.length && spans[si][1] - cursor < 0.4 * want) { si++; cursor = spans[si][0]; }
    const a = cursor;
    // A CAPTION MUST NOT SPAN A GAP. Give it its share of speaking time, but
    // never let the window run past the end of the run it starts in — a line
    // whose slice reached into the next run took the silence between them with
    // it ("KING, THIS IS" held 1.53s with speech under only 26% of it).
    const end = Math.min(spans[si][1], a + want);
    if (end <= a) break;
    out.push({ a: round(a), b: round(end), text: texts[i] });
    cursor = end;
    // if the cursor has run off the end of this span, step to the next one so
    // the following line starts on speech rather than in the gap after it
    while (si < spans.length && cursor >= spans[si][1] - 1e-6) {
      si++;
      if (si < spans.length) cursor = spans[si][0];
    }
    if (si >= spans.length) break;
  }

  // merge anything too brief to read, rather than delaying it
  const merged = [];
  for (const c of out) {
    const prev = merged[merged.length - 1];
    if (prev && c.b - prev.a <= MIN_SHOW * 1.6 &&
        (prev.text.split(/\s+/).length + c.text.split(/\s+/).length) <= 7) {
      prev.text = `${prev.text} ${c.text}`;
      prev.b = c.b;
    } else {
      merged.push({ ...c });
    }
  }
  // A LINE MUST STILL BE READABLE. A slice can come out shorter than the eye
  // can take in ("FOR YOU" for 0.26s). Extend into the gap that follows —
  // sitting briefly over silence at the TAIL of a line is far less wrong than
  // a caption that flashes and is gone before it is read.
  for (let i = 0; i < merged.length; i++) {
    const c = merged[i];
    const ceiling = i + 1 < merged.length ? merged[i + 1].a : Infinity;
    if (c.b - c.a < MIN_SHOW) c.b = Math.min(ceiling, c.a + MIN_SHOW);
    c.b = round(Math.min(c.b, c.a + HOLD_MAX));   // a pause leaves the screen clean
  }

  // DO NOT FINISH BEFORE THE VOICE DOES. Shares are computed from word count,
  // so the last line of a segment can run out while the person is still
  // talking — clip 02's "HOT DAY" cleared at 2.53s against speech to 3.06s,
  // and Tal saw a bare 3-4s. The final caption holds to the end of the run it
  // is in, still capped so a pause stays clean.
  const last = merged[merged.length - 1];
  if (last) {
    const run = spans.find(([s, e]) => last.a >= s - 1e-6 && last.a < e);
    if (run) last.b = round(Math.min(Math.max(last.b, run[1]), last.a + HOLD_MAX));
  }
  // HOLD (Tal, 2026-09-29) - bridge the gaps between words, readable minimum.
  return holdCaptions(merged, spans[spans.length - 1][1] + READ_MIN);
}

/**
 * Assign every line to a speech onset, in order, minimising total error.
 *
 * dp[k][j] = cheapest way to place lines 0..k with line k on onset j, given
 * lines before it used strictly earlier onsets. Prefix minima keep it O(n*m).
 *
 * When there are FEWER onsets than lines, lines are allowed to share an onset
 * — they merge in the next step, which is the correct answer for speech too
 * fast to caption separately.
 */
function assignInOrder(est, onsets) {
  const n = est.length, m = onsets.length;
  if (!n || !m) return est;

  if (m < n) {
    // not enough measured onsets: place each line on the nearest onset at or
    // after the previous line's, allowing repeats (merging handles them).
    let j = 0;
    return est.map((t) => {
      while (j + 1 < m && Math.abs(onsets[j + 1] - t) <= Math.abs(onsets[j] - t)) j++;
      return onsets[j];
    });
  }

  const INF = Infinity;
  const cost = (k, j) => Math.abs(onsets[j] - est[k]);
  const dp = Array.from({ length: n }, () => new Float64Array(m).fill(INF));
  const from = Array.from({ length: n }, () => new Int32Array(m).fill(-1));

  for (let j = 0; j < m; j++) dp[0][j] = cost(0, j);
  for (let k = 1; k < n; k++) {
    let bestPrev = INF, bestIdx = -1;
    for (let j = 0; j < m; j++) {
      if (j > 0 && dp[k - 1][j - 1] < bestPrev) { bestPrev = dp[k - 1][j - 1]; bestIdx = j - 1; }
      if (bestIdx >= 0) { dp[k][j] = bestPrev + cost(k, j); from[k][j] = bestIdx; }
    }
  }

  let end = -1, best = INF;
  for (let j = 0; j < m; j++) if (dp[n - 1][j] < best) { best = dp[n - 1][j]; end = j; }
  if (end < 0) return est;                       // nothing valid; keep estimates

  const out = new Array(n);
  for (let k = n - 1, j = end; k >= 0; k--) { out[k] = onsets[j]; j = from[k][j]; }

  // A line whose chosen onset is absurdly far from its estimate is not really
  // that line's onset — keep the estimate rather than teleport the caption.
  return out.map((v, k) => (Math.abs(v - est[k]) > SNAP_WINDOW * 2 ? est[k] : v));
}

/**
 * ONE WORD AT A TIME. Tal, 2026-10-04 (stranger heli balloon): "Use one word
 * captions." Project opt-in: `"captionWords": 1`. Only for WhisperX-aligned
 * clips - Groq's own word times overlap and are not in speaking order.
 *
 * A word belongs to the beat holding its MIDPOINT (never two beats). It shows
 * from its own start until the next word starts; before a pause it lingers at
 * most ONE_LINGER past its end, so silence leaves the screen clean. A word
 * that would be up for less than ONE_MIN rides with the next one.
 * This is deliberately NOT passed through holdCaptions: merging quick lines
 * into phrases is exactly what one-word mode opts out of.
 *
 * @param words [{word,start,end}] on the CLIP's timeline (any order)
 * @param ss,to the beat's window on that timeline
 * @param opts.fix [{match, to|null}] whole-word corrections (null drops it)
 * @returns [{text,a,b}] in beat seconds
 */
export const ONE_LINGER = 0.35;
export const ONE_MIN = 0.1;
export function oneWordCaptions(words, ss, to, opts = {}) {
  const fix = (opts.fix ?? []).map((r) => [String(r.match ?? "").toUpperCase().trim(), r.to]);
  const clean = (w) => String(w ?? "").toUpperCase().replace(/[^\p{L}\p{N}'’%$-]+/gu, "").replace(/^[-']+|[-']+$/g, "");
  const mine = (words ?? [])
    .filter((w) => Number.isFinite(w?.start) && Number.isFinite(w?.end) && w.end >= w.start)
    .slice().sort((x, y) => x.start - y.start)
    .filter((w) => { const mid = (w.start + w.end) / 2; return mid >= ss && mid < to; })
    .map((w) => {
      let text = clean(w.word);
      for (const [m, t] of fix) if (m && text === m) text = t == null ? "" : clean(t);
      return { text, s: Math.max(0, w.start - ss), e: Math.min(to - ss, w.end - ss) };
    })
    .filter((w) => w.text);
  const out = [];
  for (let i = 0; i < mine.length; i++) {
    let { text, s, e } = mine[i];
    // a flash word rides with the next one
    while (i + 1 < mine.length && mine[i + 1].s - s < ONE_MIN) { i++; text += " " + mine[i].text; e = mine[i].e; }
    const next = mine[i + 1];
    let b = Math.min(to - ss, e + ONE_LINGER);
    if (next) b = Math.min(b, next.s);
    if (b - s < ONE_MIN) b = Math.min(to - ss, next ? Math.max(b, Math.min(next.s, s + ONE_MIN)) : s + ONE_MIN);
    if (b - s < ONE_MIN) continue;
    out.push({ text, a: round(s), b: round(b) });
  }
  return out;
}
