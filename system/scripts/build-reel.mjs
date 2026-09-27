#!/usr/bin/env node
/**
 * Turn an edit-JSON into a Remotion composition (structured-data → renderer).
 *
 *   node scripts/build-reel.mjs --slug <shoot> --spec edit.json
 *
 * edit.json:
 * {
 *   "name": "flowers_salam_first_v4",
 *   "title": "GIVING FLOWERS TO STRANGERS 🌸🇮🇱",   // optional TitleCard
 *   "titleVariant": "pill",                          // pill | box | plain
 *   "uppercaseCaptions": true,                       // match older ALL-CAPS reels
 *   "target_duration": 18,
 *   "moments": [
 *     { "moment_id": "MOMENT_051", "in": 3.2, "out": 5.6, "caption": "Salam, these are for you" },
 *     { "moment_id": "MOMENT_102" }
 *   ]
 * }
 *
 * `in`/`out` override the moment's own span (absolute seconds in the source clip);
 * `caption` overrides the moment's transcribed speech. Writes
 * src/compositions/<shoot>/<Name>.tsx + records the spec in the `edits` table.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { openDb } from "./lib/db.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt("slug");
const specPath = opt("spec");
if (!slug || !specPath || !existsSync(specPath)) {
  console.error("Usage: node scripts/build-reel.mjs --slug <shoot> --spec <edit.json>");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const name = (spec.name || basename(specPath, ".json")).replace(/[^a-z0-9-_]/gi, "_");
// Catalog names like "01_SHABBAT_SHALOM__V1_MAIN" would Pascal-case to a
// leading digit, which is not a valid JS identifier — prefix it.
const rawPascal = name.replace(/(^|[-_])([a-z0-9])/gi, (_, __, c) => c.toUpperCase()).replace(/[-_]/g, "");
const Pascal = /^[0-9]/.test(rawPascal) ? `C${rawPascal}` : rawPascal;

const db = openDb(join(process.cwd(), "public", "footage", slug, "library.db"));
const wordsByClip = db.prepare("SELECT word,start_s,end_s FROM words WHERE clip_id=? ORDER BY idx");
const clipByPath = db.prepare("SELECT id FROM clips WHERE path=?");

// ---- resolve every spec moment to a concrete span --------------------------
const resolvedMoments = spec.moments.map((item) => {
  if (item.inline) {
    return {
      src: item.inline.src,
      inS: item.in ?? item.inline.startSec,
      outS: item.out ?? item.inline.endSec,
      clipId: clipByPath.get(item.inline.src)?.id,
      caption: item.caption ?? null,
      fallbackText: "",
      mid: `inline:${item.inline.src}`,
      split: item.in != null && item.out != null,
    };
  }
  const m = db.prepare("SELECT * FROM moments WHERE id=?").get(item.moment_id);
  if (!m) {
    console.error(`✗ unknown moment ${item.moment_id}`);
    process.exit(1);
  }
  const clip = db.prepare("SELECT * FROM clips WHERE id=?").get(m.clip_id);
  return {
    src: clip.path,
    inS: item.in ?? m.in_s,
    outS: item.out ?? m.out_s,
    clipId: m.clip_id,
    caption: item.caption ?? null,
    fallbackText: m.speech ?? "",
    mid: item.moment_id,
    // an explicit in+out on a moment_id means the spec DELIBERATELY split this
    // moment into sub-beats — don't let the merge glue it back together.
    split: item.in != null && item.out != null,
  };
});

// ---- merge consecutive spans from the SAME clip that touch or overlap -----
// Three moments carved from one clip with padded boundaries (4.6-12.3,
// 12.1-13.4, 13.3-26.9) produced two hard cuts that each jumped ~0.2s
// BACKWARD in the source — the "it glitches twice around 1:05" Tal saw. If the
// next span is from the same clip and starts at/inside the current one (small
// slack for padding), it's really one continuous shot: extend, don't cut.
const MERGE_SLACK_S = 0.5;
const merged = [];
for (const r of resolvedMoments) {
  const prev = merged[merged.length - 1];
  const deliberateSplit = prev && (prev.split || r.split) && prev.mid === r.mid;
  if (
    prev &&
    !deliberateSplit &&
    prev.src === r.src &&
    r.inS <= prev.outS + MERGE_SLACK_S &&
    r.inS >= prev.inS - 0.05
  ) {
    prev.outS = Math.max(prev.outS, r.outS);
    prev.caption = null; // captions come from word timings across the whole merged span
    // adopt the incoming piece's identity so a following deliberate split of
    // the SAME moment is recognised (prev.mid used to stay stuck on the first
    // moment forever, so split sub-beats all merged back into one shot).
    prev.mid = r.mid;
    prev.split = r.split;
    continue;
  }
  merged.push({ ...r });
}
if (merged.length !== resolvedMoments.length) {
  console.log(`· merged ${resolvedMoments.length - merged.length} same-clip adjacent cut(s) into continuous shots`);
}

const beats = [];
const captions = [];
let cursorMs = 0;
let blobFallbacks = 0;
const FPS = 30;
const CAPTION_LEAD_MS = spec.captionLeadMs ?? 110; // counter whisper token-start bias
for (const item of merged) {
  const src = item.src;
  const inS = item.inS;
  const outS = item.outS;
  const clipId = item.clipId;
  const fallbackText = item.fallbackText;
  const durS = Math.max(0.3, outS - inS);
  beats.push({
    src, // staticFile-relative
    startSec: +inS.toFixed(3),
    endSec: +outS.toFixed(3),
  });

  // WORD-LEVEL captions, sliced from the clip's own transcript and remapped
  // onto the assembled timeline — NEVER one caption blob spanning the whole
  // beat. A blob freezes a full sentence on screen for seconds, gives the
  // active-word highlight nothing to move between, and (as a single
  // unbreakable flex item) runs off both edges of the frame.
  //
  // `item.caption` is an anchor phrase written by make-catalog/make-compilations,
  // NOT a hand correction — so it selects WHICH words to show, and the real
  // word timings still drive when each one appears.
  // whisper HALLUCINATES a repeating loop at the tail of a clip — a run of
  // words it never heard, all stamped with zero duration at the final
  // timestamp. od_video-3392 ends "...Alaikum 3.39->5.65" then six phantom
  // words all at 5.65->5.65, so B11 captioned "Salam Alaikum Salam Salam
  // Alaikum" over someone saying "Shabbat Shalom wa Alaikum". 536 such words
  // across 129 of 328 clips (39%).
  //
  // A real word always has duration. Zero or negative = artifact → drop it,
  // BEFORE anchor matching too, or the phantom text can win the match.
  // Filtered here, not deleted from the DB: speech regions and beat detection
  // were built on these rows.
  const clipWords = clipId
    ? wordsByClip.all(clipId).filter((w) => w.word && w.word.trim() && w.end_s > w.start_s)
    : [];
  const inWindow = clipWords.filter((w) => (w.start_s + w.end_s) / 2 >= inS && (w.start_s + w.end_s) / 2 <= outS);

  // whisper sometimes hands a word an end-timestamp that swallows the silence
  // after it ("Excuse" held 7.0s in shalom_v4). Left alone that word sits
  // frozen on screen — the exact defect the caption rules forbid. Clamp the
  // on-screen life of a single word; the gap that opens up is silence, and
  // showing nothing during silence is correct.
  const MAX_WORD_MS = 1200;
  // whisper writes ANNOTATIONS into the transcript ("speaking in foreign
  // language", "[Music]", "BLANK_AUDIO"). They are not spoken words and must
  // never reach the screen — "SPEAKING IN" was burned into A1's opening.
  // Filtered at caption time only: the words stay in the DB, so phrase
  // matching and beat detection are unaffected.
  const NON_SPEECH_WORD = /^(speaking|foreign|language|music|blank|audio|blankaudio|blank_audio|applause|laughter|inaudible|noise|silence|singing|subtitles|amara|org)$/i;
  const GLUE_WORD = /^(in|a|an|the|of|to)$/i;
  // whisper glues an annotation onto a real word: "tooBLANKAUDIO", "day[Music]".
  // Strip a trailing/leading BLANK_AUDIO / [MUSIC] / (LAUGHTER) blob off any
  // token; if nothing real is left, the word itself is an artifact.
  const cleanToken = (raw) =>
    raw
      .replace(/[\[(]?\s*BLANK[_ ]?AUDIO\s*[\])]?/gi, "")
      .replace(/[\[(]\s*(music|laughter|applause|singing|inaudible|noise)\s*[\])]/gi, "")
      .replace(/\b(BLANKAUDIO|BLANK_AUDIO)\b/gi, "")
      .trim();
  const emitWords = (allWordsRaw) => {
    const allWords = allWordsRaw
      .map((w) => ({ ...w, word: cleanToken(w.word) }))
      .filter((w) => w.word && /[\p{L}\p{N}]/u.test(w.word));
    const bad = allWords.map((w) => NON_SPEECH_WORD.test(w.word.trim().replace(/[^a-z0-9]/gi, "")));
    // "speaking in foreign language" leaves an orphan "in" once the flagged
    // words go — drop a glue word that is sandwiched between two annotation
    // words (or trails one at the edge).
    const drop = allWords.map((w, i) => {
      if (bad[i]) return true;
      if (!GLUE_WORD.test(w.word.trim())) return false;
      const prevBad = i > 0 && bad[i - 1];
      const nextBad = i < allWords.length - 1 && bad[i + 1];
      return prevBad && nextBad;
    });
    const words = allWords.filter((_, i) => !drop[i]);
    for (const w of words) {
      // whisper.cpp token starts lead the actual audio by ~80-150ms, which
      // reads as "the caption is up before I say it". Nudge every word later
      // by a fixed lead; the end is nudged too so length is preserved.
      const startMs = Math.round(cursorMs + Math.max(0, w.start_s - inS) * 1000) + CAPTION_LEAD_MS;
      const rawEndMs = Math.round(cursorMs + Math.min(durS, w.end_s - inS) * 1000) + CAPTION_LEAD_MS;
      const endMs = Math.min(rawEndMs, startMs + MAX_WORD_MS);
      captions.push({
        text: " " + w.word.trim(),
        startMs,
        endMs: Math.max(endMs, startMs + 1),
        timestampMs: Math.round((startMs + endMs) / 2),
        confidence: 1,
      });
    }
  };

  /** Locate the anchor phrase inside the beat's real words (space-insensitive,
   *  so it survives whisper splitting "Shabbat" across tokens). */
  const matchRange = (phrase, words) => {
    const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = norm(phrase);
    if (!target) return null;
    let flat = "";
    const tokenAt = [];
    words.forEach((w, i) => {
      const n = norm(w.word);
      for (let k = 0; k < n.length; k++) tokenAt.push(i);
      flat += n;
    });
    const idx = flat.indexOf(target);
    if (idx === -1) return null;
    return words.slice(tokenAt[idx], (tokenAt[idx + target.length - 1] ?? words.length - 1) + 1);
  };

  if (inWindow.length) {
    const matched = item.caption ? matchRange(item.caption, inWindow) : null;
    // matched → caption exactly the anchored line; otherwise caption the whole
    // beat. Either way it is word-level with real timings.
    emitWords(matched && matched.length ? matched : inWindow);
  } else if (item.caption) {
    // No word timings for this clip at all — last resort, and it is a blob.
    blobFallbacks++;
    captions.push({
      text: " " + item.caption.trim(),
      startMs: Math.round(cursorMs + 120),
      endMs: Math.round(cursorMs + durS * 1000 - 80),
      timestampMs: Math.round(cursorMs + (durS * 1000) / 2),
      confidence: 1,
    });
  } else if (fallbackText) {
    // No word-level timing available for this clip (never transcribed, or an
    // inline src not in the library) — fall back to one blob and say so.
    blobFallbacks++;
    captions.push({
      text: " " + fallbackText.trim(),
      startMs: Math.round(cursorMs + 120),
      endMs: Math.round(cursorMs + durS * 1000 - 80),
      timestampMs: Math.round(cursorMs + (durS * 1000) / 2),
      confidence: 1,
    });
  }
  cursorMs += durS * 1000;
}
if (blobFallbacks) {
  console.warn(`⚠ ${blobFallbacks} beat(s) had no word-level timing and used a single caption blob — re-index that clip for real word-level captions.`);
}

const totalFrames = Math.max(1, Math.round((cursorMs / 1000) * FPS));
const compDir = join(process.cwd(), "src", "compositions", slug);
mkdirSync(compDir, { recursive: true });
const dataFile = join(compDir, `${Pascal}.data.json`);
writeFileSync(
  dataFile,
  JSON.stringify({ fps: FPS, width: 1080, height: 1920, beats, captions }, null, 2),
);

// `"captions": false` / `"title"` absent → a CUT-ONLY composition: just the
// sequenced beats, no on-screen text. Tal's call — captions/titles get added
// back per video once the cut is locked.
const wantCaptions = spec.captions !== false;
const titleHoldFrames = Math.round((spec.titleHoldSec ?? 2.6) * FPS);
const titleBlock = spec.title
  ? `      <TitleCard theme={theme} variant=${JSON.stringify(spec.titleVariant ?? "pill")} text=${JSON.stringify(spec.title)}${spec.titleEmoji ? ` emoji=${JSON.stringify(spec.titleEmoji)}` : ""} total={${titleHoldFrames}} />\n`
  : "";
const capUpper = spec.uppercaseCaptions ? " uppercase" : "";
const capEmph = spec.emphasize ? ` emphasize={/${spec.emphasize}/i}` : "";
// "oneWord" | "keyphrase" | "transcript" — default keyphrase
const capVariant = spec.captionStyle ? ` variant="${spec.captionStyle}"` : "";

const needsText = wantCaptions || !!spec.title;
const comp = `import React from "react";
import { AbsoluteFill } from "remotion";
${wantCaptions ? `import type { Caption } from "@remotion/captions";\n` : ""}import data from "./${Pascal}.data.json";
import {
  ClipReel,
  clipReelMetadata,${wantCaptions ? `\n  Captions,` : ""}${spec.title ? `\n  TitleCard,` : ""}${needsText ? `\n  editorialTheme,` : ""}
  type ReelSpec,
} from "../../components";
${needsText ? `import { loadFonts } from "../../lib/fonts";\n\nloadFonts();\nconst theme = editorialTheme;\n` : ""}
const SPEC = data as ReelSpec;

/**
 * ${name}
 * strategy: ${spec.strategy ?? "-"}
 * ${spec.moments.length} moments · target ${spec.target_duration ?? "?"}s
 * Regenerate: node scripts/build-reel.mjs --slug ${slug} --spec <edit.json>
 */
export const ${Pascal}: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
${titleBlock}${wantCaptions ? `    <Captions theme={theme} captions={(SPEC.captions ?? []) as Caption[]}${capVariant}${capUpper}${capEmph} />\n` : ""}  </AbsoluteFill>
);

export const ${Pascal.toUpperCase()}_METADATA = clipReelMetadata(SPEC);
`;
writeFileSync(join(compDir, `${Pascal}.tsx`), comp);

db.prepare("INSERT OR REPLACE INTO edits (name,spec_json,created_at) VALUES (?,?,?)").run(
  name,
  JSON.stringify(spec),
  Date.now(),
);
const em = db.prepare("INSERT INTO edit_moments (edit_name,moment_id,ord) VALUES (?,?,?)");
db.prepare("DELETE FROM edit_moments WHERE edit_name=?").run(name);
spec.moments.forEach((it, i) => em.run(name, it.moment_id ?? `inline:${it.inline?.src ?? ""}@${it.inline?.startSec ?? 0}`, i));

console.log(`✓ src/compositions/${slug}/${Pascal}.tsx   (${beats.length} beats, ${(cursorMs / 1000).toFixed(1)}s)`);
console.log(`\nRegister in src/Root.tsx:\n`);
console.log(`  import { ${Pascal}, ${Pascal.toUpperCase()}_METADATA } from "./compositions/${slug}/${Pascal}";`);
console.log(`  <Composition id="${Pascal}" component={${Pascal}}`);
console.log(`    width={1080} height={1920} fps={30} durationInFrames={${totalFrames}}`);
console.log(`    calculateMetadata={${Pascal.toUpperCase()}_METADATA} />\n`);
console.log(`Then: npm run studio   ·   npm run render ${Pascal} output/${name}.mp4`);
