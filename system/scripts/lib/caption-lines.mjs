// BREAK A LINE OF SPEECH INTO CAPTIONS THAT READ AS ENGLISH.
//
// Tal, 2026-09-24, looking at the uploaded mixes: *"the captions are wrong ...
// you're doing such a bad job on the captions."* He was right, and the cause
// was here: the old splitter took every 2-3 words regardless of meaning, so a
// sentence came apart at nonsense places —
//
//     "I liked the look. Have a good day."
//        -> "LIKED THE LOOK. HAVE A"  /  "DAY. I LIKED THE LOOK"
//     "Guys, happy new year"
//        -> "GUYS. HAPPY"  /  "NEW YEAR"
//
// A caption is a unit of speech, not a slice of a word array.
//
// RULES
//   1. Split on real punctuation first — a clause never spans a full stop.
//   2. Keep a short clause whole (up to 4 words). "HAVE A GOOD DAY" is one
//      caption, not "HAVE A" then "GOOD DAY".
//   3. When a clause must be split, split BEFORE a function word, never after
//      one. Ending a caption on "a", "the", "and", "to" is what made the old
//      output read as gibberish.
//   4. Never leave a one-word orphan at the end if it can be absorbed.

// Words a caption must not END on — they point forward to the next word.
const DANGLING = new Set(
  ("A AN THE AND OR BUT TO OF IN ON AT FOR FROM WITH IS ARE WAS WERE BE BEEN " +
   "MY YOUR HIS HER ITS OUR THEIR THIS THAT THESE THOSE SO IF AS BY UP OUT " +
   "DO DOES DID HAVE HAS HAD WILL WOULD CAN COULD NOT VERY MORE MOST").split(" "));

const MAX_WORDS = 4;     // Tal: "one to three words", four only to save a clause
const SOFT = 3;

/**
 * @param text  one segment of speech, already translated
 * @returns array of caption lines, in order
 */
export function captionLines(text) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  // 1. clauses — keep the punctuation OUT of the caption, it is noise on screen
  const clauses = clean
    .split(/(?<=[.!?,;:])\s+/)
    .map((c) => c.replace(/[,.;:]+$/g, "").trim())
    .filter(Boolean);

  const out = [];
  for (const clause of clauses) {
    const w = clause.split(/\s+/).filter(Boolean);

    // 2. a short clause is one caption
    if (w.length <= MAX_WORDS) {
      out.push(w.join(" "));
      continue;
    }

    // 3. CHOOSE ALL THE BREAKS AT ONCE, not greedily left to right.
    //
    //    A greedy walk cannot see what it is about to strand. Taking three
    //    words at a time turned "...for everyone and for myself and for my
    //    family" into lines ending on "for", then "my", then a lone "family".
    //    Scoring whole splits fixes each of those at the same time.
    out.push(...bestSplit(w));
  }
  return out.filter(Boolean);
}

/**
 * Minimum-cost split of one clause into caption lines.
 *
 * dp[i] = cheapest way to caption words[i..end]. Small clauses, so the O(n*k)
 * scan is free. The costs encode what looks wrong on screen, in order of how
 * badly it reads:
 *   - a line ending on a function word ("and", "for", "my") is the worst,
 *     because the eye stops on a word that points forward
 *   - a lone word on its own line is next, unless the clause really is one word
 *   - four words is tolerated to save a clause, three is the target
 */
function bestSplit(w) {
  const n = w.length;
  const bare = (s) => s.toUpperCase().replace(/[^A-Z']/g, "");
  const dp = new Array(n + 1).fill(Infinity);
  const take = new Array(n + 1).fill(1);
  dp[n] = 0;
  for (let i = n - 1; i >= 0; i--) {
    for (let k = 1; k <= MAX_WORDS && i + k <= n; k++) {
      const end = i + k;
      // a lone word is worse than an awkward break ANYWHERE, not just at the end:
      // "[It] [is a hot day]" and "[Come and visit] [I] [would be very happy]"
      let cost = k === SOFT ? 0 : k === 2 ? 1 : k === MAX_WORDS ? 3 : 14; // k===1
      if (end < n && DANGLING.has(bare(w[end - 1]))) cost += 12;
      if (end === n && k === 1) cost += 8;          // lone word at the end
      const total = cost + dp[end];
      if (total < dp[i]) { dp[i] = total; take[i] = k; }
    }
  }
  const lines = [];
  for (let i = 0; i < n;) { lines.push(w.slice(i, i + take[i]).join(" ")); i += take[i]; }
  return lines;
}
