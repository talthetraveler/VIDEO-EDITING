// FIND A SPOKEN LINE AND RETURN ITS EXACT WINDOW.
//
// Tal, 2026-09-21: *"you don't need the whole clips, you just use lines from
// them."*
//
// Every edit so far was written as SEGMENT RANGES — "clip X from 0 to 13.4" —
// which drags in every um, repeat and pause around the line that matters. The
// measured cut rate for his formats is 1.9-2.5s a shot (ROUTING.md); a 13s
// block is five shots' worth of one angle.
//
// This locates a phrase in a clip's word timings and returns just that phrase,
// with the house padding: 0.12s before the first word, up to 0.45s after the
// last (clamped to the next word's onset so it never eats the next line).
//
// Matching is tolerant because ASR text is not clean: it compares on
// lowercase letters+digits only, so punctuation, casing and stray spacing do
// not matter, and a phrase is found if it appears anywhere in the clip.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const TRANS = join(ROOT, "projects/_frameio/cache/transcripts");

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");

export function loadWords(id) {
  const p = join(TRANS, `${id}.json`);
  if (!existsSync(p)) return [];
  try {
    return (JSON.parse(readFileSync(p, "utf8")).words ?? [])
      .slice().sort((a, b) => a.start - b.start);
  } catch { return []; }
}

/**
 * Find `phrase` in the clip and return { from, to, text, words }.
 * `after` skips matches that start before that time — use it when the same
 * words are said more than once and you want a later take.
 * Returns null if the phrase is not in the transcript at all.
 */
export function line(id, phrase, { after = 0, head = 0.12, tail = 0.45 } = {}) {
  const words = loadWords(id);
  if (!words.length) return null;
  const target = norm(phrase);
  if (!target) return null;

  // TOLERANT MATCH. Groq's word array is not reliably in speaking order — the
  // tokens for "we are all human" come back as `we are all And human.`, with a
  // word from elsewhere wedged in. An exact concatenation match therefore
  // fails on perfectly good lines. So: walk the target's words in order and
  // allow a small number of intruders between them.
  const tWords = String(phrase).split(/\s+/).map(norm).filter(Boolean);
  const SKIP = 3;                       // intruding tokens tolerated in total
  let best = null;
  for (let i = 0; i < words.length; i++) {
    // Groq's word END times overrun the real speech (a word can be tagged as
    // ending 2s after it was said), so an exact cursor pushes past the next
    // line's first word. Allow a little slack.
    if (words[i].start < after - 0.75) continue;
    if (norm(words[i].word) !== tWords[0] && !norm(words[i].word).startsWith(tWords[0])) continue;
    let ti = 1, skips = 0, j = i;
    for (let k = i + 1; k < words.length && ti < tWords.length; k++) {
      const wn = norm(words[k].word);
      if (!wn) continue;
      if (wn === tWords[ti] || wn.startsWith(tWords[ti]) || tWords[ti].startsWith(wn)) { ti++; j = k; }
      else if (++skips > SKIP) break;
    }
    if (ti >= tWords.length) {
      // Keep the TIGHTEST match, not the first. With intruders tolerated, a
      // greedy walk can reach a repeated word much later and swallow the next
      // sentence: "the world want peace" ran from 18.9 to 22.2 and ate the
      // "World should be peace." that followed, so that line could never be
      // found afterwards.
      const span = j - i;
      if (best === null || span < best.span) best = { i, j, span };
      continue;
    }
    if (false) {
      {
        const first = words[i], last = words[j];
        const next = words[j + 1];
        const gap = next ? Math.max(0, next.start - last.end) : tail;
        return {
          from: +Math.max(0, first.start - head).toFixed(2),
          to: +(last.end + Math.min(tail, Math.max(0.10, gap - 0.05))).toFixed(2),
          text: words.slice(i, j + 1).map((w) => String(w.word)).join(" ").trim(),
          words: j - i + 1,
          // RAW end of the last word, with no tail padding. The search cursor
          // must advance by this, not by `to`: padding `to` pushed the cursor
          // past the NEXT line's first word and silently dropped it —
          // "Life is short." disappeared exactly this way.
          end: +last.end.toFixed(3),
          start: +first.start.toFixed(3),
        };
      }
    }
  }
  if (best) {
    const first = words[best.i], last = words[best.j];
    const next = words[best.j + 1];
    const gap = next ? Math.max(0, next.start - last.end) : tail;
    return {
      from: +Math.max(0, first.start - head).toFixed(2),
      to: +(last.end + Math.min(tail, Math.max(0.10, gap - 0.05))).toFixed(2),
      text: words.slice(best.i, best.j + 1).map((w) => String(w.word)).join(" ").trim(),
      words: best.span + 1,
      end: +last.end.toFixed(3),
      start: +first.start.toFixed(3),
    };
  }
  return null;
}

/**
 * Turn a list of ["clip-id", "the words to find", "why it's in the film"]
 * into edit.json beats, each one tight to its own line.
 * A phrase that cannot be found is reported and skipped rather than guessed.
 * `opts.zoom` gives every beat a gentle push; `opts.step` deepens it beat by
 * beat so the film tightens as it goes.
 */
export function beatsFromLines(spec, { zoom = [1.0, 1.14], step = 0.015, xy = null } = {}) {
  const beats = [], missing = [];
  // A clip with NO transcript reports every one of its phrases as "not found",
  // which reads like thirteen bad phrases instead of one bad id. Say it plainly.
  // (This happened because a uuid was hand-typed instead of resolved from the
  // index — never type a uuid, always look it up.)
  for (const id of new Set(spec.map((s) => s[0]))) {
    if (!loadWords(id).length) {
      throw new Error(
        `No word timings for clip ${id}\n` +
        `  Either the id is wrong (resolve it from discover-index.json, never type it),\n` +
        `  or the clip needs: node scripts/frameio-transcribe.mjs --words --force --only ${id}`);
    }
  }
  let k = 0;
  const seenPerClip = new Map();
  for (const [id, phrase, why, over] of spec) {
    const after = seenPerClip.get(id) ?? 0;
    const hit = line(id, phrase, { after });
    if (!hit) { missing.push([id.slice(0, 8), phrase]); continue; }
    seenPerClip.set(id, hit.end);            // advance by real speech, not by padding
    const push = over?.z
      ? over
      : { z: [+(zoom[0] + step * k).toFixed(3), +(zoom[1] + step * k).toFixed(3)], ...(xy ?? {}), ...(over ?? {}) };
    beats.push([id, hit.from, hit.to, 0.5, why ?? hit.text, null, push]);
    k++;
  }
  return { beats, missing };
}

export function reportMissing(missing) {
  if (!missing.length) return;
  console.log(`  !! ${missing.length} line(s) NOT FOUND in the transcript — skipped, not guessed:`);
  for (const [id, phrase] of missing) console.log(`       ${id}  "${phrase}"`);
}
