/**
 * Positivity gate — Tal's #1 rule: only POSITIVE content about Israel goes out.
 *
 * When picking which parts of a clip to keep, anything negative is dropped:
 *   - "this is Palestine" / "free Palestine" / "from the river to the sea"
 *   - "occupation" / "apartheid" / "genocide" / "ethnic cleansing"
 *   - "I don't like Israel" / "I hate Israel" / "Israel is bad"
 *   - a flat "No." answer to "you have the same roots / you feel safe" etc.
 *   - "I don't feel safe" / "it's not safe"
 *
 * scanNegative(text) → null if clean, else a short reason string.
 * The caption grouper / recaption drops matching groups and records a flag so
 * the video shows a ⚠ for a human trim before it can be posted.
 */

const PATTERNS = [
  [/\bfree palestine\b/i, "free palestine"],
  [/\bfrom the river to the sea\b/i, "river to the sea"],
  [/\bthis (is|land is) palestine\b/i, "'this is palestine'"],
  [/\b(occupation|occupied territor|apartheid|ethnic cleansing|genocide)\b/i, "occupation/apartheid/genocide language"],
  [/\bcoloniz(e|er|ing|ation)\b/i, "colonizer language"],
  [/\bi (don'?t|do not) like israel\b/i, "'I don't like Israel'"],
  [/\bi hate israel\b/i, "'I hate Israel'"],
  [/\bisrael is (bad|evil|a terrorist|not a|fake|stolen)\b/i, "'Israel is bad/fake/stolen'"],
  [/\bthere('?s| is) no israel\b/i, "'there is no Israel'"],
  [/\bi (don'?t|do not) feel safe\b/i, "'I don't feel safe'"],
  [/\bit'?s not safe\b/i, "'it's not safe'"],
  [/\bnot safe (here|in israel)\b/i, "'not safe in Israel'"],
  [/\bkill(ing)? (the )?(jews|palestinians|arabs|civilians)\b/i, "killing language"],
  [/\bnakba\b/i, "nakba"],
];

export const scanNegative = (text) => {
  const t = (text || "").toString();
  for (const [re, reason] of PATTERNS) if (re.test(t)) return reason;
  return null;
};

// a lone "No." / "No, not really." right after a positive prompt reads badly on
// its own — flag standalone hard negatives so a human checks the surrounding cut
export const isBareNo = (text) => /^(no|nope|not really|no way|absolutely not)[.!,]?$/i.test((text || "").trim());
