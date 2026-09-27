/**
 * Key-word emphasis picker — the NAS Daily caption signature.
 *
 * Measured from 3 of his 2026 verticals (Israeli hospital, Dead Sea Scrolls,
 * safest room): captions are white sentence-case, and ONE span per card is lit
 * in yellow. It is NOT a karaoke sweep — it's static semantic emphasis on the
 * card's payload: a number, a proper noun, or the "thing" the sentence is about.
 *
 * Observed lit spans: "38", "2,000", "3,600", "Ottoman Empire", "Jerusalem",
 * "two nurses", "eye drops", "gold coin", "IVF baby", "Proton Therapy",
 * "dual robotic", "history", "future".  Roughly half the cards have no
 * emphasis at all — connective cards stay plain white.
 *
 *   pickEmphasis("A gold coin from the Muslim world") -> [1, 2]
 */

const STOP = new Set(
  ("a an the and or but so of to in on at for from with by is are was were be been am " +
    "it its this that these those i you he she we they him her them my your his our their " +
    "as if then than there here what when where who how why not no yes do does did done " +
    "can could will would should may might must have has had just really very quite even " +
    "more most about into over under out up down off again also only still").split(" "),
);

// words that mark the payload of a fact even though they're common
const BOOST = new Set(
  ("first only every never always best worst biggest largest smallest oldest newest fastest " +
    "million billion thousand hundred percent history future world country city war peace " +
    "life death free safe home family god religion").split(" "),
);

// Case-blind gazetteer — Tal's caption track is ALL-CAPS, so capitalisation
// can't mark a proper noun. These are the names that actually recur in his
// street interviews and should read as the payload regardless of casing.
const NAMES = new Set(
  ("israel israeli jerusalem telaviv haifa eilat jaffa nazareth bethlehem hebron akko " +
    "morocco moroccan japan japanese poland polish nigeria nigerian angola indonesia " +
    "india indian belarus ireland irish germany german berlin iraq iraqi srilanka " +
    "america american russia russian france french spain italy italian china chinese " +
    "jew jewish muslim islam christian christianity druze bedouin arab arabic hebrew " +
    "torah quran bible shabbat salam shalom ramadan passover synagogue mosque church " +
    "kosher halal ahmadi").split(" "),
);

const WORD_NUM = new Set(
  ("one two three four five six seven eight nine ten eleven twelve twenty thirty forty " +
    "fifty sixty seventy eighty ninety half third quarter dozen").split(" "),
);

const bare = (w) => String(w || "").toLowerCase().replace(/[^a-z0-9'’%$-]/g, "");
const isNumber = (w) =>
  /^[\d][\d,.]*(%|k|m|bn?)?$/i.test(String(w).replace(/[^\w,.%$-]/g, "")) || WORD_NUM.has(bare(w));
const isProper = (w, i) => i > 0 && /^[A-Z][a-z’']{2,}/.test(String(w).replace(/[^\w’']/g, ""));
const isAcronym = (w) => /^[A-Z]{2,5}$/.test(String(w).replace(/[^\w]/g, ""));

// Tal's caption track is stored ALL-CAPS, so capitalisation carries no signal —
// every word would read as a proper noun / acronym and the whole card lights up.
// Detect that and fall back to stopword + length scoring only.
const isShouty = (text) => {
  const letters = String(text || "").replace(/[^A-Za-z]/g, "");
  return letters.length > 3 && letters === letters.toUpperCase();
};

const score = (w, i, shouty) => {
  const b = bare(w);
  if (!b) return 0;
  if (isNumber(w)) return 10;
  if (NAMES.has(b.replace(/['’]s$/, ""))) return 9; // case-blind proper noun
  if (!shouty && isAcronym(w)) return 8;
  if (!shouty && isProper(w, i)) return 7;
  if (BOOST.has(b)) return 5;
  if (STOP.has(b)) return 0;
  if (b.length >= 6) return 3; // long content word
  if (b.length >= 4) return 2;
  return 1;
};

/**
 * @param {string} text        the caption line
 * @param {object} [opt]
 * @param {number} [opt.min]   minimum score to light anything (default 5)
 * @param {number} [opt.maxSpan] max tokens in the lit span (default 2)
 * @returns {number[]} token indices to light, [] for a plain card
 */
export const pickEmphasis = (text, opt = {}) => {
  const maxSpan = opt.maxSpan ?? 2;
  const tokens = String(text || "").split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return [];
  const shouty = isShouty(text);
  // ALL-CAPS input loses the proper-noun/acronym signal, so the ceiling drops —
  // lower the bar or nothing would ever light.
  const min = opt.min ?? (shouty ? 3 : 5);
  const scores = tokens.map((w, i) => score(w, i, shouty));
  const best = Math.max(...scores);
  if (best < min) return []; // nothing worth lighting — plain white card
  let i = scores.indexOf(best);
  const span = [i];
  // A digit is the payload on its own — "38", "2,000" — don't drag the next
  // common word in. Only a proper noun / acronym earns a two-word number span.
  const numeric = isNumber(tokens[i]) && !WORD_NUM.has(bare(tokens[i]));
  if (maxSpan > 1) {
    const rOK = i + 1 < tokens.length && (numeric ? scores[i + 1] >= 7 : scores[i + 1] >= 3);
    const lOK = i > 0 && !STOP.has(bare(tokens[i - 1])) && (numeric ? scores[i - 1] >= 7 : scores[i - 1] >= 3);
    if (rOK && (!lOK || scores[i + 1] >= scores[i - 1])) span.push(i + 1);
    else if (lOK) span.unshift(i - 1);
  }
  return span.sort((a, b) => a - b);
};

/** Apply pickEmphasis across a caption track (mutates + returns it). */
export const applyEmphasis = (captions, opt) => {
  for (const c of captions) {
    const e = pickEmphasis(c.text, opt);
    if (e.length) c.emphasis = e;
    else delete c.emphasis;
  }
  return captions;
};
