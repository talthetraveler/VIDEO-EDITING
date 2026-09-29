#!/usr/bin/env node
// GENERIC EDIT BUILDER — one builder for every video in the queue.
//
// Reads projects/<slug>/edit.json and renders a preview. Everything Tal has
// taught is baked in: gold ALL-CAPS captions that FIT, one caption on screen at
// a time, word-timed from Groq, rounded title pill, DeepFilterNet -a 10,
// colour grade, and 9:16 or square-band layout.
//
//   node scripts/build-edit.mjs <slug> [--final]
//
// edit.json:
// {
//   "title": "ASKING PEOPLE IN ISRAEL 🇮🇱\nWHAT MAKES THEM HAPPY",
//   "layout": "vertical" | "square",      // square = horizontal source
//   "out": "NAME_V1.mp4",
//   "beats": [ ["<frameio-id>", in, out, xCentre, "why"], ... ]
// }
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join } from "node:path";
import { locate, frameFor } from "./lib/framing.mjs";

const FFDIR = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin";
const FF = join(FFDIR, "ffmpeg.exe"), FP = join(FFDIR, "ffprobe.exe");
import { placeInSpeech, placeByWords, holdCaptions } from "./lib/caption-timing.mjs";
import { captionLines } from "./lib/caption-lines.mjs";
// A REGEX LITERAL, not new RegExp("..."): inside a string the backslashes were
// eaten, the class closed early, and it only matched "<symbol>]" - so a
// captionFix "match" containing ? or . ran as a pattern and misfired
// (a blank caption in the Carlos cut, israel-batch 2026-09-29).
const RX_ESCAPE = /[.*+?^${}()|[\]\\]/g;
const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const DF = join(ROOT, "bin/deep-filter.exe");
const PROXY = join(ROOT, "projects/_frameio/cache/proxies");
const HQDIR = join(ROOT, "projects/_frameio/cache/hq");
// Footage already on this disk (scripts/transcribe-local.mjs). Cutting the
// real 4K file is both better and cheaper than proxy-then-recut.
const LOCAL = existsSync(join(ROOT, "projects/_frameio/cache/local-sources.json"))
  ? JSON.parse(readFileSync(join(ROOT, "projects/_frameio/cache/local-sources.json"), "utf8"))
  : {};
// id -> offset(seconds) for every fetched HQ span, merged across projects.
const HQ_OFFSET = (() => {
  const m = {};
  if (!existsSync(HQDIR)) return m;
  for (const f of readdirSync(HQDIR)) {
    if (!f.endsWith(".json")) continue;
    try {
      const j = JSON.parse(readFileSync(join(HQDIR, f), "utf8"));
      for (const [id, v] of Object.entries(j)) if (Number.isFinite(v?.offset)) m[id] = { offset: v.offset, length: v.length ?? Infinity };
    } catch {}
  }
  return m;
})();
const TRANS = join(ROOT, "projects/_frameio/cache/transcripts");

const slug = process.argv[2];
if (!slug) { console.error("usage: node scripts/build-edit.mjs <slug>"); process.exit(1); }
// DELIVERY RESOLUTION IS THE DEFAULT. Every beat is already rendered at
// 1080x1920; only the final stitch was being downscaled, and because --final
// was never passed, every cut Tal received was a 540x960 preview. Full size
// is now the default and --preview is the opt-out for a quick local look.
const FINAL = !process.argv.includes("--preview");
const OUT = join(ROOT, "projects", slug);
const cfg = JSON.parse(readFileSync(join(OUT, "edit.json"), "utf8"));
const RUN = String(Date.now()).slice(-7);
const BEATS = join(OUT, `beats_${RUN}`), TMP = join(OUT, `tmp_${RUN}`);

mkdirSync(BEATS, { recursive: true }); mkdirSync(TMP, { recursive: true });
// NEVER DELETE A WORKING DIRECTORY THAT IS STILL IN USE.
// This used to remove every other beats_*/tmp_* in the folder on startup. Two
// builds of the same slug at once — which happens the moment a batch script is
// running and a single project is rebuilt by hand — then destroyed each
// other's scratch mid-render, and the failure surfaces as the useless
// "Error opening output files: Invalid argument" from ffmpeg, pointing at a
// wav whose parent directory another process had just deleted.
// Only sweep directories that nothing has touched for an hour.
const STALE_MS = 60 * 60 * 1000;
for (const d of readdirSync(OUT)) {
  if (!/^(beats|tmp)_\d+$/.test(d) || d.endsWith(RUN)) continue;
  try {
    if (Date.now() - statSync(join(OUT, d)).mtimeMs < STALE_MS) continue;   // still live
    rmSync(join(OUT, d), { recursive: true, force: true });
  } catch {}
}

const FONT = "C\\:/Windows/Fonts/arialbd.ttf";
const GOLD = "0xF5C542";
// Tal, 2026-09-23: *"the captions should be bigger and different."*
// 78px gold on a white shirt in Jerusalem sun is close to invisible - the two
// biggest areas of call-my-mother are a white polo and a sunlit wall, and gold
// has almost no contrast against either. Bigger alone would not fix that, so
// the line now sits on a soft dark plate: the gold stays (it is the brand, and
// APPROVED-JAMAICA-V14 is built on it) but it finally has something to sit on.
const CAP_SIZE = 94, CAP_MAXW = 980;
const CAP_BOX = "box=1:boxcolor=black@0.42:boxborderw=22";
const PREVIEW_W = FINAL ? 1080 : 540, PREVIEW_H = FINAL ? 1920 : 960;
const BEAT_W = 1080, BEAT_H = 1920;   // beats ALWAYS full size; scale once at the end
// Caption height. 0.66 — "lower-middle of frame, clear of faces, hands, and
// platform controls" (Tal's written standard, 2026-09-24). It replaced 0.72,
// which came off his older reels and Jamaica V14; his own cut of the
// coffee-shop footage sits captions nearer mid-frame than that, and 0.66 also
// keeps them off the Reels bottom chrome.
//
// NOT AUTOMATED: "clear of faces and hands" is per shot, and nothing here
// checks it. If a subject's face sits low in frame, set "capY" per project
// (0.58 is already used on the phone-booth films, where the caller's face is
// high and the rig's sign occupies the lower third) and CONFIRM ON A STILL.
// CAPTION STYLE. Default = the street look (bold white CAPS, heavy stroke).
// "captionStyle": "nas" = the Social Accords NAS look, measured 2026-09-27 off
// his own videos (formats/nas-explainer.md): sentence case, narrow sans, soft
// shadow, a named key phrase in gold #FACC27 at 1.4x on the line below.
// It sits lower - white line measured at y~0.70, gold beneath at ~0.77 - so
// its block centre defaults to 0.72 instead of 0.66.
const NAS = cfg.captionStyle === "nas";
const CAP_Y = Math.round(1920 * (cfg.capY ?? (NAS ? 0.72 : 0.66)));

// caption-only corrections; audio is never altered
const CORR = (() => {
  const f = join(OUT, "CORRECTIONS.json");
  if (!existsSync(f)) return [];
  const j = JSON.parse(readFileSync(f, "utf8")).corrections ?? {};
  return Object.entries(j).sort((a, b) => b[0].length - a[0].length).map(([from, to]) => {
    const esc = [...from].map((c) => (".*+?^${}()|[]\\".includes(c) ? "\\" + c : c)).join("");
    return [new RegExp(esc, "gi"), to];
  });
})();
// ffmpeg filter paths need Windows separators flipped and colons escaped.
// Inlining this regex kept getting mangled by patch tooling - keep it in ONE place.
const BS = String.fromCharCode(92);
const ffPath = (x) => x.split(BS).join("/").split(":").join(BS + ":");
const fixWords = (s) => CORR.reduce((acc, [re, to]) => acc.replace(re, to), s);

/**
 * SNAP A BEAT TO REAL SPEECH.
 *
 * Tal: "you're cutting out someone speaking, and then before they're even
 * speaking you're cutting out." Hand-picked in/out points come from SEGMENT
 * times, which are coarse — they land inside a word constantly.
 *
 * This moves each boundary to a place where nobody is mid-word:
 *   - an in-point inside a word moves back to that word's start, minus 0.12s
 *     of air, so the first consonant survives,
 *   - an out-point inside a word extends to that word's end, plus up to 0.45s
 *     of tail — clamped to the next word's onset so it never swallows the
 *     start of the next line.
 * A boundary already sitting in silence is left exactly where it is.
 */
function snapBoundaries(id, ss, to) {
  const p = join(TRANS, `${id}.json`);
  if (!existsSync(p)) return [ss, to, ""];
  let words;
  try { words = (JSON.parse(readFileSync(p, "utf8")).words ?? []).slice().sort((a, b) => a.start - b.start); }
  catch { return [ss, to, ""]; }
  if (!words.length) return [ss, to, ""];

  const HEAD = 0.12, TAIL = 0.45;
  let a = ss, b = to, why = [];

  const inAtIn = words.find((w) => w.start < ss - 0.02 && w.end > ss + 0.02);
  if (inAtIn) { a = Math.max(0, inAtIn.start - HEAD); why.push(`head ${ss.toFixed(2)}->${a.toFixed(2)} ("${String(inAtIn.word).trim()}")`); }

  const inAtOut = words.find((w) => w.start < to - 0.02 && w.end > to + 0.02);
  if (inAtOut) {
    const next = words.find((w) => w.start >= inAtOut.end - 0.01);
    const gap = next ? Math.max(0, next.start - inAtOut.end) : TAIL;
    b = inAtOut.end + Math.min(TAIL, Math.max(0.10, gap - 0.05));
    why.push(`tail ${to.toFixed(2)}->${b.toFixed(2)} ("${String(inAtOut.word).trim()}")`);
  }
  if (b - a < 0.4) return [ss, to, ""];      // refuse to collapse a beat
  return [+a.toFixed(3), +b.toFixed(3), why.join(", ")];
}

/**
 * Group a segment's words into caption lines that read as English.
 *
 * Fixed 3-word chunks broke lines mid-thought ("NAME? HOW LONG"). A line never
 * ends on a word that requires the next one — see LESSONS.md 27(c) — so a line
 * that would end on a preposition, conjunction, article, auxiliary or subject
 * pronoun reaches forward to the word it belongs to, up to a hard ceiling.
 */
const CAP_DANGLER = new Set(("a an the and or but so if of to in on at for from with " +
  "my your his her its our their this that these those i you he she it we they " +
  "is are was were be been am do does did have has had will would can could " +
  "should may might must not no as by about into over under than then because " +
  "when what which who how where why very just really more most").split(" "));

function chunkLine(words, { soft = 4, hard = 7, softC = 24, hardC = 34 } = {}) {
  const bare = (w) => String(w).toLowerCase().replace(/[^a-z']/g, "");
  const ends = (w) => /[.!?]["')\]]?$/.test(String(w));
  const out = [];
  for (let i = 0; i < words.length; ) {
    let end = i, chars = 0;
    while (end < words.length) {
      chars += String(words[end]).length + 1;
      if (end > i && (end - i + 1 > soft || chars > softC)) { end--; break; }
      if (ends(words[end])) break;
      end++;
    }
    if (end >= words.length) end = words.length - 1;
    let guard = 0;
    while (end + 1 < words.length && CAP_DANGLER.has(bare(words[end])) && !ends(words[end]) && guard++ < hard) {
      const n = end - i + 2;
      const c = words.slice(i, end + 2).reduce((a, w) => a + String(w).length + 1, 0);
      if (n > hard || c > hardC) break;
      end++;
    }
    out.push(words.slice(i, end + 1).join(" ").toUpperCase());
    i = end + 1;
  }
  // a one-word tail reads as a dropped caption; fold it back when there is room
  for (let k = out.length - 1; k > 0; k--) {
    if (out[k].split(" ").length > 1) continue;
    const merged = out[k - 1] + " " + out[k];
    if (merged.split(" ").length <= hard && merged.length <= hardC) { out[k - 1] = merged; out.splice(k, 1); }
  }
  return out;
}

// SPEECH ONSETS FROM THE AUDIO, NOT FROM THE TRANSCRIPT.
//
// Tal, 2026-09-23: *"check every video ... that the captions are actually
// appearing when I speak."* Measured with scripts/caption-sync.py, only
// 30-50% of captions were landing within 0.35s of a real speech onset and some
// sat over total silence ("I'M FROM PALESTINE" over -60dB).
//
// The cause is that placement trusted Groq's word timestamps, which this repo
// already knows are unreliable (LESSONS: the word array is not in speaking
// order, end times overrun by up to 2s). The beat's own audio has no such
// problem, so onsets are measured from it and captions are snapped to them.
// RUNS, NOT ONSETS. An onset is a moment and a street mic produces plenty of
// moments that are not speech - a bottle crinkle, a footstep, a scooter going
// past. Measured 2026-09-24 while captioning the water clips: placing on
// onsets put 6 of 19 captions over silence, and switching to runs took the
// same film from 37% to 94% of captions sitting on actual speech.
function speechRuns(src, ss, to, n) {
  try {
    const wav = join(TMP, `on_${n}.wav`);
    execFileSync(FF, ["-v", "error", "-y", "-ss", String(ss), "-to", String(to),
      "-i", src, "-vn", "-ac", "1", "-ar", "8000", wav], { stdio: "pipe" });
    const out = execFileSync("python", [join(ROOT, "scripts/speech-runs.py"), wav],
      { encoding: "utf8" }).trim();
    if (!out) return [];
    return out.split(",").map((r) => r.split("-").map(Number))
      .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a);
  } catch { return []; }
}

function captionFilters(id, ss, to, n, opts = {}) {
  // Real speech onsets in THIS beat's audio — see scripts/speech-onsets.py.
  // Computed once per beat and shared by every chunk below.
  const audioRuns = opts.src ? speechRuns(opts.src, ss - (opts.srcBase ?? 0), to - (opts.srcBase ?? 0), n) : [];
  // TRANSLATED CAPTIONS: Hebrew/Arabic speech is captioned in ENGLISH (Tal:
  // "only English captions"). Groq's translation endpoint returns SEGMENTS
  // only - no word timestamps - so those captions are timed by splitting each
  // segment across its words. Timing is approximate; wording is UNVERIFIED
  // until hand-checked (it rendered "leukemia" as "milk and milk" once).
  // SEGMENTS DECIDE THE WORDING. WORDS ONLY DECIDE THE TIMING.
  //
  // This path used to run only for translated (Hebrew/Arabic) clips, and the
  // English path assembled its captions straight from the word array. That
  // array is not in speaking order — Groq interleaves the two speakers and
  // hands back overlapping timestamps — so sorting it by start time produced
  // confident nonsense on screen: "THE ONE WHO FOR ASKS HELP",
  // "TELL WHATEVER ME YOU", "THANK YOU'RE YOU SO MUCH".
  //
  // The SEGMENT text is always in the right order. The word entries are still
  // the best timing available. So every clip, English or not, now takes its
  // wording from segments and snaps the onsets to real word starts.
  const tp = join(ROOT, "projects/_frameio/cache/translate", `${id}.json`);
  const op = join(TRANS, `${id}.json`);
  const own = existsSync(op) ? JSON.parse(readFileSync(op, "utf8")) : {};
  const segs = existsSync(tp)
    ? (JSON.parse(readFileSync(tp, "utf8")).segments ?? [])      // translated to English
    : (own.segments ?? []);                                      // already English
  {
    // the ORIGINAL-language word timings, used only to snap caption onsets
    const srcWords = (own.words ?? []).slice().sort((a, b) => a.start - b.start);
    // TIDY THE SEGMENTS BEFORE USING THEM.
    //
    // Groq emits OVERLAPPING segments when two people talk — the same words
    // come back twice, in two segments with different spans. Captioned
    // straight, that reads as a stutter: "REALLY THIRSTY" followed by
    // "REALLY THIRSTY ON ME I WAS". And a segment that ends mid-clause forces
    // a line to end on a dangling word however good the grouping is
    // ("THANK YOU SO", "WHY NOT? DO", "MY FRIEND. SO").
    //
    // Two passes fix both: drop words a previous segment already said, then
    // glue a segment to the next one when it is too short to stand alone.
    const tidy = [];
    for (const sg of segs.slice().sort((a, b) => a.start - b.start)) {
      let words = fixWords(String(sg.text ?? "")).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
      if (!words.length) continue;
      // CLIP THE SEGMENT TO THE BEAT. A segment that merely OVERLAPS the beat
      // was being emitted in full, so a beat starting mid-sentence replayed the
      // whole sentence from its beginning. With the POV and the Sony cut
      // against each other that showed up as the opening line captioned twice:
      // "I RAN OUT OF MONEY..." and then "UM I RAN OUT OF MONEY..." again.
      // Segments have no word timings of their own, so trim proportionally.
      //
      // A STRADDLING SEGMENT GOES WHOLLY TO ONE BEAT — it is never split into a
      // dangling word. Tal, 2026-09-22, saw the result of splitting it: beat 1
      // ended on the single word "TAKE" and beat 2 then played
      // "TAKE CARE OF YOURSELF" in full; beat 3 ended on "WHO" and beat 4
      // opened with the orphan "HER". Consecutive beats here deliberately
      // overlap by a fraction of a second (21-28.2 then 28-33.2) so the audio
      // does not click, and proportional trimming turns every sentence that
      // crosses a join into an orphan plus a repeat.
      //
      // So: trim proportionally as before, but if the surviving fragment is
      // too short to be a caption (< 3 words) AND the segment continues past
      // this beat, drop it here and let the beat that holds most of it say the
      // whole line. The same applies to a tail fragment left behind by the
      // previous beat.
      const span = Math.max(0.01, sg.end - sg.start);
      const straddles = sg.start < ss - 0.05 || sg.end > to + 0.05;
      if (straddles) {
        const from = Math.max(0, (ss - sg.start) / span);
        const upto = Math.min(1, (to - sg.start) / span);
        const a = Math.floor(from * words.length), b = Math.ceil(upto * words.length);
        const kept = words.slice(a, Math.max(a + 1, b));
        // how much of the segment's CLOCK does this beat actually hold?
        const share = (Math.min(to, sg.end) - Math.max(ss, sg.start)) / span;
        if (kept.length < 3 && share < 0.6) continue;     // orphan — the other beat owns this line
        words = kept;
      }
      if (!words.length) continue;
      const prev = tidy[tidy.length - 1];
      if (prev) {
        // strip a leading run that simply repeats the end of the last segment
        const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']/g, "");
        const tail = prev.words.map(norm);
        let drop = 0;
        for (let n = Math.min(words.length, tail.length); n > 0; n--) {
          if (tail.slice(-n).join(" ") === words.slice(0, n).map(norm).join(" ")) { drop = n; break; }
        }
        if (drop) words.splice(0, drop);
        if (!words.length) continue;
      }
      tidy.push({ start: sg.start, end: sg.end, words });
    }
    // glue a fragment onto the next segment when it cannot stand on its own
    const merged = [];
    for (const sg of tidy) {
      const prev = merged[merged.length - 1];
      const tooShort = sg.words.length <= 2 && (sg.end - sg.start) < 1.4;
      if (prev && tooShort && sg.start - prev.end < 0.5) {
        prev.words.push(...sg.words); prev.end = sg.end; continue;
      }
      merged.push({ ...sg });
    }

    const out = [];
    // A DELIBERATELY WORDLESS BEAT.  push.nocap = true
    //
    // CLAUDE.md 2.2: "the best parts of these videos are the moments in between
    // the words ... Silence is not delete." There was no way to SAY that in an
    // edit: every beat captioned whatever segment overlapped it, so a closing
    // hold on someone's face picked up the interviewer's next question and the
    // film ended on a caption asking something nobody answers on screen.
    // call-my-mother ends on the subject hanging up and smiling; that beat
    // wants no words on it at all.
    let k = 0, lastShown = "";
    // A LINE MUST NOT START ON THE WORD THE LAST BEAT ENDED ON.
    // hospital-volunteers ended beat 12 on "WEEK TO PLAY FOR HER" and opened
    // beat 13 with "HER AND SHE'S VERY HAPPY". The within-segment de-duplicator
    // cannot see across a beat boundary, so the shared word survives and reads
    // as a stutter. LAST_WORDS carries the previous beat's final caption.
    const stripLead = (arr) => {
      if (!LAST_WORDS.length || !arr.length) return arr;
      const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']/g, "");
      for (let nn = Math.min(4, arr.length - 1, LAST_WORDS.length); nn > 0; nn--) {
        if (LAST_WORDS.slice(-nn).map(norm).join(" ") === arr.slice(0, nn).map(norm).join(" "))
          return arr.slice(nn);
      }
      return arr;
    };
    for (const sg of (opts.nocap ? [] : merged)) {
      if (sg.end <= ss || sg.start >= to) continue;
      // A SENTENCE THAT MOSTLY HAPPENED BEFORE THIS BEAT IS NOT THIS BEAT'S.
      // The cut lands mid-sentence, so the transcript segment begins earlier
      // than the beat does; captioning it from its own first word printed the
      // tail end of a line nobody in this shot has said - "course" (from "Of
      // course") and "did she have" both opened a beat that way.
      const inside = Math.min(sg.end, to) - Math.max(sg.start, ss);
      if (inside < 0.55 * (sg.end - sg.start) && sg.start < ss - 0.2) continue;
      const words = sg.words;
      if (!words.length) continue;
      const a0 = Math.max(0, sg.start - ss), b0 = Math.min(to - ss, sg.end - ss);
      // MEANING, not every 2-3 words — scripts/lib/caption-lines.mjs.
      // CORRECT THE SENTENCE BEFORE SPLITTING IT.
      //
      // captionFix used to run on each finished caption line, which stopped
      // working the moment lines were split on meaning: the rule
      // "MILK AND HONEY" -> "LEUKEMIA" could not fire because the transcript
      // error now landed as "with milk" / "and honey" on two separate
      // captions. Fixing the segment text first also means one rule repairs
      // every line it touches.
      let segText = stripLead(words).join(" ");
      for (const rule of (cfg.captionFix ?? [])) {
        const m = String(rule.match ?? "").trim();
        if (!m || rule.exact) continue;              // exact rules stay per-line
        const re = new RegExp(m.replace(RX_ESCAPE, String.fromCharCode(92) + "$&"), "ig");
        if (rule.to == null) segText = segText.replace(re, " ");
        else segText = segText.replace(re, rule.to);
      }
      segText = segText.replace(/\s+/g, " ").trim();
      if (!segText) continue;
      let chunks = captionLines(segText);
      if (!chunks.length) continue;
      // NO DANGLING TAIL WORD. A segment whose last chunk is one short word
      // ("FOR", "KNOW", "YOM") is a line that got cut in half, not an
      // utterance — real one-word lines ("WOW", "YES", "NO") arrive as a
      // segment of their own and still work. Glue the orphan back on.
      if (chunks.length > 1) {
        const last = chunks[chunks.length - 1].trim();
        if (last.split(/\s+/).length === 1 && last.replace(/[^A-Za-z']/g, "").length <= 4) {
          chunks = chunks.slice(0, -2).concat([chunks[chunks.length - 2] + " " + last]);
        }
      }
      let fit = chunks.map((t) => ({ size: CAP_SIZE, text: t }));
      try {
        fit = JSON.parse(execFileSync("python", [join(ROOT, "scripts/fit-caption.py"), String(CAP_MAXW), String(CAP_SIZE)],
          { input: JSON.stringify(chunks), encoding: "utf8" }));
      } catch {}
      // SNAP TO REAL SPEECH. Tal: "the captions didn't go up as soon as you're
      // speaking." The translation endpoint returns coarse segments (often
      // rounded to whole seconds) with NO word timestamps, so splitting them
      // evenly drifts behind the voice. The ORIGINAL-language transcript does
      // have word timings, so pull this segment's real word onsets and start
      // each chunk on one of them.
      // TIME EACH CHUNK BY WORD POSITION, NOT BY DIVIDING THE CLOCK.
      //
      // Tal, 2026-09-22: *"the captions are not set when I'm speaking. You did
      // the wrong time."* The previous version spread the chunks EVENLY across
      // the segment (`a0 + ci * per`) and then allowed a snap of at most 0.6s
      // to a real word onset. Both halves are wrong together: Groq's segments
      // are often rounded to whole seconds, so the even estimate can start 1-2s
      // away from the voice, and once it is more than 0.6s out the snap is
      // forbidden from reaching the word that is actually being said. The
      // caption then sits there while nobody speaks, and lands late on the next.
      //
      // Speech is not evenly spaced. "I just wanted to wish you a good year"
      // and a two-second pause occupy the same clock but not the same words.
      // So a chunk's start now comes from WHICH WORD it begins on: chunk i
      // starts at the word onset whose INDEX matches the chunk's first word,
      // proportionally, because a translated segment has a different word
      // count from the original-language audio it was timed against.
      //
      // Each caption then runs until the NEXT chunk starts, not for a fixed
      // slice — so a long word holds and a quick one passes, and there are no
      // gaps where a line has ended but the speaker is still talking.
      const wordsPerChunk = chunks.map((c) => c.split(/\s+/).filter(Boolean).length);
      // ANCHOR TO THE SEGMENT, NOT TO THE WORD ARRAY.
      //
      // This used to index into Groq's word onsets. Measured, that put
      // "I'M FROM PALESTINE" at 38.5s when the segment itself says 37.3s —
      // 1.2s late, and late enough that snapping to audio then chose the wrong
      // onset. The word array is unreliable here (LESSONS: not in speaking
      // order, end times overrun by up to 2s); the SEGMENT's own start is not.
      //
      // So a chunk's estimate is simply its position by word count through the
      // segment's own span. The estimate only has to be close enough to pick
      // the right speech onset — the onset decides the actual time.
      // WHERE EACH LINE APPEARS — scripts/lib/caption-timing.mjs.
      //
      // Extracted 2026-09-24 so it can be tested without rendering a film:
      //   node system/scripts/test-caption-timing.mjs
      //
      // It fixes a drift that had been shipping for weeks. The old code here
      // made a caption start no earlier than the PREVIOUS caption ENDED, and
      // every caption is held a readable minimum, so whenever anyone spoke
      // faster than that minimum each line shoved the next one later and the
      // error accumulated: voice at 0.0/0.5/1.0/1.5/2.0 produced captions at
      // 0.0/0.8/1.6/2.4/3.0 — the last one a full second after its words.
      // Invisible at a slow pace, severe in exactly the fast exchanges worth
      // keeping. Reproduce it with `--old` on that test.
      //
      // Now: a line starts on its own speech onset; the previous line is cut
      // short by it; and lines arriving closer together than they can be read
      // are MERGED rather than delayed. Onsets are assigned to lines in order
      // by a small DP, not greedily, because greedy assignment strands a line
      // in a pause while a good onset goes unused.
      const fitTexts = chunks.map((c, ci) => fit[ci]?.text ?? c);
      // the speech actually inside this segment, clipped to it
      let segRuns = audioRuns
        .map(([a, b]) => [Math.max(a, a0 - 0.25), Math.min(b, b0 + 0.25)])
        .filter(([a, b]) => b - a > 0.12);
      // A QUIET SPEAKER IS STILL SPEAKING. When the energy detector hears no
      // run inside a segment, `placed` came back empty and the whole line was
      // dropped - "Thanks.", "Do you hate Muslims? — No, I don't." and "You
      // know my age" all rendered with no caption on israel-batch. Once the
      // clip is WhisperX-aligned (tools/align-cache.py) its word times are
      // exact, so they are the speech runs to place against.
      if (!segRuns.length && own.aligned) {
        segRuns = srcWords
          .filter((w) => w.end > sg.start - 0.05 && w.start < sg.end + 0.05)
          .map((w) => [Math.max(0, w.start - ss), Math.min(to - ss, w.end - ss)])
          .filter(([a, b]) => b - a > 0.05);
      }
      // ALIGNED + ENGLISH: place each line on its OWN words (exact WhisperX
      // times). The share-of-speaking-time estimate below put lines up to ~2s
      // early (Cesar, 2026-09-29). Used only when the segment's words map 1:1
      // onto the aligned words; anything else (translation, a captionFix that
      // changed the word count, de-duplicated overlap) falls back.
      let placed = null;
      if (own.aligned && !existsSync(tp)) {
        const W = srcWords.filter((w) => w.start >= sg.start - 0.06 && w.end <= sg.end + 0.06);
        const lead = words.length - segText.split(/\s+/).filter(Boolean).length;
        const need = wordsPerChunk.reduce((t, x) => t + x, 0);
        if (W.length === words.length && lead >= 0 && need === words.length - lead) {
          let k = lead;
          placed = placeByWords(fitTexts.map((t, ci) => {
            const ws = W.slice(k, k + wordsPerChunk[ci]).map((w) => ({ start: w.start - ss, end: w.end - ss }));
            k += wordsPerChunk[ci];
            return { text: t, words: ws };
          })).filter((P) => P.b > 0 && P.a < to - ss).map((P) => ({ ...P, a: Math.max(0, P.a) }));
        }
      }
      if (!placed) placed = segRuns.length
        ? placeInSpeech(segRuns, fitTexts, wordsPerChunk)
        : [];
      placed.forEach((P) => {
        const a = P.a;
        const b = Math.min(P.b, to - ss);
        // A quick line is still speech: "not good" is said in 0.18s. The old
        // 0.2s floor dropped it BEFORE holdCaptions could extend it to a
        // readable 0.8s - only a genuinely empty window is dropped now.
        if (b - a < 0.03) return;
        let shownC = P.text.replace(/[,.;:!?"]+$/g, "").replace(/\s+/g, " ");
        // NEVER SHOW THE SAME LINE TWICE RUNNING. Groq emits overlapping
        // segments when two people talk, so the identical sentence can survive
        // de-duplication inside a segment and still land again in the next one
        // — "SHABBAT SHALOM" then "SHABBAT SHALOM", "I LOVE ARGENTINA" twice.
        // On screen that reads as a stutter even when the audio is clean.
        // HAND CORRECTIONS. A machine transcript is not sacred: Groq looped for
        // 25s on hospital-volunteers ("cancer patient cancer cancer cancer")
        // and rendered "Sartan" as "Seltan". CLAUDE.md rule 5 says read every
        // caption as English — this is how a line that fails that gets fixed
        // without hand-editing the cached transcript, which other edits share.
        //   "captionFix": [{ "match": "...", "to": "..." | null }]
        // A null `to` drops the line entirely.
        let fixed = shownC, dropped = false;
        for (const rule of (cfg.captionFix ?? [])) {
          const m = String(rule.match ?? "").toUpperCase().replace(/\s+/g, " ").trim();
          if (!m) continue;
          const cur = fixed.toUpperCase().replace(/\s+/g, " ").trim();
          // `exact: true` matches the WHOLE line — needed to drop a stray
          // one-word caption ("CANCER") without touching every line that
          // contains the word.
          if (rule.exact ? cur === m : cur.includes(m)) {
            if (rule.to == null) { dropped = true; break; }
            fixed = NAS ? String(rule.to) : String(rule.to).toUpperCase();
          }
        }
        if (dropped) return;
        shownC = fixed;
        // The same line must not appear twice — WITHIN a beat or ACROSS a beat
        // join. call-no-one ended beat 1 on "IF THERE'S SOMEONE" and opened
        // beat 2 with it again; a per-beat check cannot see that.
        const key = shownC.trim().toUpperCase();
        if (key === lastShown || key === LAST_SHOWN) return;
        lastShown = key; LAST_SHOWN = key;
        // log the END too - caption-sync measured a GUESSED window for months
        // because only the start was recorded here.
        // (logged to CAPTIONS only after the one-at-a-time trim below, so the
        // BUILD-LOG says what is really on screen - it used to record the
        // untrimmed windows, and selfreview then showed overlaps that the
        // render never drew, israel-batch 2026-09-29)
        LAST_WORDS = shownC.split(/\s+/).filter(Boolean);
        out.push({ text: shownC, a: +a.toFixed(2), b: +b.toFixed(2) });
        k++;
      });
    }
    // ONE CAPTION AT A TIME. Groq's segments overlap each other when two
    // people talk across one another — "How long did she have..." ends at
    // 33.30 and "How did she pass away?" starts at 33.30, and after each was
    // given a readable minimum the two windows crossed. On screen that drew
    // both PNGs at once and read as "HOW DID SHE DID SHE HAVE PASS AWAY"
    // (Eden, 2026-09-24). Each caption now ends when the next one begins.
    out.sort((x, y) => x.a - y.a || x.b - y.b);
    // Overlapping Groq segments can hand two different lines the SAME start -
    // beat 07 drew "It's hard It's hard" and "Every day is hard" both at
    // 2.02s, one on top of the other. Keep the first, drop the collision.
    const kept = [];
    for (const c of out) {
      const prev = kept[kept.length - 1];
      if (prev && c.a - prev.a < 0.12) continue;
      kept.push(c);
    }
    for (let i = 0; i < kept.length - 1; i++) {
      if (kept[i].b > kept[i + 1].a) kept[i].b = +(kept[i + 1].a).toFixed(2);
    }
    // HOLD ACROSS THE WHOLE BEAT (Tal, 2026-09-29): until the next line -
    // the next person included - replaces it; readable minimum; only a real
    // pause clears the screen. lib/caption-timing.mjs holdCaptions, tested by
    // scripts/test-caption-hold.mjs.
    const shown = holdCaptions(kept, to - ss).filter((c) => c.b - c.a >= 0.2);
    for (const c of shown) CAPTIONS.push({ beat: n, at: c.a, to: c.b, text: c.text });
    return shown;
  }

}

// TURN CAPTION LINES INTO OVERLAY PNGs — the reference style Tal asked for.
//
// Tal, 2026-09-23, with three reference reels: *"use the format of captions
// from the middle picture ... you see how it's big and nice."* Those are heavy
// uppercase, WHITE with ONE word per line in gold, and a stroke thick enough
// to read on any background.
//
// drawtext cannot do that: it takes ONE fontcolor for the whole string, so a
// gold word inside a white line would mean computing each word's x by hand and
// stacking a filter per word. scripts/render-caption.py measures and draws the
// line with PIL instead, and the result is composited with `movie=`+`overlay`.
// GOLD IS A CHOICE, NOT A HEURISTIC. About half the captions in his own NAS-
// style videos have no gold word at all. The edit names the phrases:
//   "captionKeys": ["paycheck", "Coffee shop", "the Holocaust", "per year"]
// A caption containing one gets it lifted; anything else stays white.
function nasKey(text) {
  const t = String(text).toLowerCase();
  const hit = (cfg.captionKeys ?? [])
    .filter((k) => t.includes(String(k).toLowerCase()))
    .sort((a, b) => b.length - a.length)[0];          // longest match wins
  return hit ?? null;
}

function captionOverlays(caps, tmpDir) {
  if (!caps.length) return { suffix: "", label: "[v]" };
  let meta = [];
  try {
    meta = JSON.parse(execFileSync("python", [join(ROOT, "scripts/render-caption.py"),
      tmpDir, String(CAP_MAXW), String(NAS ? 100 : CAP_SIZE)],
      { input: JSON.stringify(caps.map((c) => (NAS ? { text: c.text, style: "nas", key: nasKey(c.text) }
                                                   : { text: c.text }))), encoding: "utf8" }).trim());
  } catch (e) {
    console.log(`  !! caption render failed: ${String(e.message).slice(0, 90)}`);
    return { suffix: "", label: "[v]" };
  }
  const parts = [];
  let prev = "[vbase]";
  let used = 0;
  caps.forEach((c, i) => {
    const m = meta[i];
    if (!m) return;
    const fp = m.file.split(String.fromCharCode(92)).join("/")
      .replace(/^([A-Za-z]):/, "$1" + String.fromCharCode(92) + ":");
    parts.push(`movie='${fp}'[cm${i}]`);
    const next = `[vc${i}]`;
    parts.push(`${prev}[cm${i}]overlay=x=(W-w)/2:y=${CAP_Y}-h/2:eval=init:` +
      // half-open [a, b): between() includes BOTH ends, so where one caption
      // ends on the exact frame the next begins, both drew for ~33ms.
      `enable='gte(t\\,${c.a})*lt(t\\,${c.b})'${next}`);
    prev = next; used++;
  });
  if (!used) return { suffix: "", label: "[v]" };
  parts.push(`${prev}null[v]`);
  return { suffix: ";" + parts.join(";"), label: "[vbase]" };
}

// DeepFilterNet -a 10. NEVER -a 25 — it gated real speech to silence.
// Street ambience stays; that texture is the proof it's real.
function cleanAudio(src, ss, to, n, attOverride) {
  const raw = join(TMP, `${n}.wav`);
  execFileSync(FF, ["-v", "error", "-y", "-ss", String(ss), "-to", String(to), "-i", src,
    "-vn", "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", raw], { stdio: "pipe" });
  // DeepFilterNet attenuation. 10 is the house default and keeps the street
  // in (CLAUDE.md: do NOT over-denoise). A project may raise it a little when
  // the location is genuinely too loud - Tal on the feed-homeless shoot:
  // "really reduce the background noise". NEVER 25: it gated real speech to
  // silence and caused A/V drift.
  // ADAPTIVE. A fixed -a 10 is right for a quiet street and not enough for the
  // Carmel market, where the measured floor stays at -25 dBFS and the ambience
  // sits under every word. CLAUDE.md says leave the street in, and that still
  // holds — this only reaches for more attenuation when the floor is genuinely
  // high, and never past 18 (at 25 it gated real speech to silence).
  // ONE SETTING FOR ONE SHOT. Tal, 2026-09-23, on a join where the picture is
  // measurably seamless (YAVG 105.3 -> 105.2, no geometric shift):
  // *"there's like a cut and it changes position, it's weird ... did you
  // reduce noise also"* — he was hearing the AMBIENCE change, not seeing the
  // picture. Denoise was measured per beat, so one continuous take came out at
  // -a 16, -a 16, then -a 12, and the street tone shifted character mid-shot.
  // Adaptive denoise is still right ACROSS different locations; it is wrong
  // WITHIN one unbroken shot.
  let att = Math.min(18, Math.max(6, cfg.denoise ?? 10));
  if (attOverride != null) {
    att = attOverride;
  } else if (cfg.denoise == null) {
    const floor = noiseFloor(raw);
    if (floor != null && floor > -30) {
      att = Math.min(16, Math.round(att + (floor + 30) * 0.8));
      console.log(`      noisy location (floor ${floor.toFixed(0)}dB) -> denoise -a ${att}`);
    }
  }
  try { execFileSync(DF, ["-a", String(att), "-o", TMP, raw], { stdio: "pipe" }); } catch {}
  return raw;
}

/**
 * MATCH EVERY BEAT'S LEVEL BEFORE IT IS CUT IN, not after.
 *
 * Tal: *"the audio was so bad."* Measured on the delivered files:
 *   GIVING WATER V4 swings 28 dB and SHALOM SALAM V3 25 dB, with jumps of
 *   25-30 dB between ADJACENT half-seconds — i.e. at the cuts. One quiet
 *   street beat next to one loud market beat, spliced.
 * The timeline-level fix for that was `dynaudnorm ... m=4`, which is worse: it
 * applies up to 12 dB of gain to whatever is quiet, so between sentences it
 * pulls the room tone up to just under the voice. COFFEE KINDNESS V4 measures
 * 9.8 dB of range across the whole file and a -25.8 dB noise floor — there is
 * no silence left in it anywhere. That is the constant roar under the speech.
 *
 * The right fix is a STATIC gain per beat: measure this beat, work out how far
 * it is from the house level, and apply one unchanging number. Beats then
 * match at the joins without anything moving inside a beat, so the street
 * ambience keeps its real shape and stays where it belongs — underneath.
 */
/** The quietest 10% of a beat, in dBFS — i.e. what the room sounds like. */
function noiseFloor(wav) {
  try {
    const r = spawnSync("python", [join(ROOT, "scripts/rms-curve.py"), wav], { encoding: "utf8" });
    const v = (r.stdout || "").trim().split(",").map(Number).filter(Number.isFinite);
    if (v.length < 4) return null;
    return v.sort((a, b) => a - b)[Math.floor(v.length * 0.1)];
  } catch { return null; }
}

const BEAT_TARGET_LUFS = -18;      // beats land here; the timeline pass takes it to -16
function beatGain(wav) {
  try {
    const r = spawnSync(FF, ["-v", "info", "-i", wav, "-af",
      "loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
    const txt = (r.stdout || "") + (r.stderr || "");
    const m = /"input_i"\s*:\s*"(-?[\d.]+)"/.exec(txt);
    if (!m) return 0;
    const i = parseFloat(m[1]);
    // A beat with no speech in it (a reaction, a music-only shot) measures very
    // low. Boosting it +12 dB would just raise its noise floor into the film.
    if (!Number.isFinite(i) || i < -45) return 0;
    return Math.max(-9, Math.min(9, +(BEAT_TARGET_LUFS - i).toFixed(2)));
  } catch { return 0; }
}


// A "CARD" beat is a full-screen text card, e.g. ["CARD", 0, 2.2, 0, "5 MINUTES LATER"].
// Tal asked for one between Eden's interview and the singing.
function buildCard(text, dur, dest) {
  const tf = join(TMP, `card_${Math.random().toString(36).slice(2)}.txt`);
  writeFileSync(tf, text, "utf8");
  execFileSync(FF, ["-v", "error", "-y", "-f", "lavfi", "-i", `color=c=black:s=1080x1920:d=${dur}:r=30`,
    "-f", "lavfi", "-i", `anullsrc=channel_layout=stereo:sample_rate=48000`,
    "-vf", `drawtext=fontfile='${FONT}':textfile='${ffPath(tf)}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2,setsar=1`,
    "-t", String(dur), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-shortest", dest], { stdio: "pipe" });
}

// Grade. Small moves — it must not look graded. Slightly firmer than the
// original after Tal asked for "good colour grading": a touch more contrast
// and saturation, a gentle warm balance, and a mild shadow lift so faces in
// doorways and market shade keep detail.
// THE GRADE. Tal, 2026-09-23: *"the color grading is pretty shit."*
//
// The old chain was a flat `eq=contrast=1.09` plus a warm colorbalance. Two
// things were wrong with it on this footage:
//
//  1. `eq=contrast` pivots around mid-grey and LIFTS the black point, which is
//     the opposite of what hazy footage needs. Damascus Gate at midday is shot
//     through dust and bounce; the blacks come in around 18-25, never 0, and
//     raising them further is what makes the picture look milky and washed.
//  2. Saturation 1.16 on top of a warm push turned sunlit skin orange.
//
// Replaced with a proper filmic S-curve: the black point is PLANTED (0.06 in
// maps to 0.0 out, so haze is crushed back to real black), the shadows are
// pulled slightly under the line, the highlights are rolled off just below
// clipping so a white shirt in direct sun keeps its texture instead of
// blowing to paper, and saturation is raised gently AFTER the curve where it
// costs less. `curves` holds the endpoints; `eq` never did.
// GRADED TO A MEASURED TARGET, not to taste.
//
// Tal handed over "Spread love .mp4" as the reference for colour and music.
// Measured with signalstats, it sits at:
//     YAVG median 102   ·   SATAVG median 8.6   ·   YMIN median 0
// The first attempt at this curve crushed the picture to YAVG 90.5 / SAT 4.2 —
// darker AND half as saturated as the thing it was supposed to match. Planting
// the black point is right; dragging the midtones down with it is not.
//
// So the black point is still planted (0.04 -> 0.01, which kills the Damascus
// Gate haze) but the mids are now lifted above the line instead of below it,
// and saturation is raised enough to actually reach the reference. Re-measure
// after any change here: `signalstats` YAVG/SATAVG against the reference is
// the check, not an opinion about whether it "looks graded".
const GRADE = "curves=all='0/0 0.04/0.01 0.25/0.265 0.55/0.61 0.85/0.92 1/1'," +
  "eq=saturation=1.42:gamma=1.01,colorbalance=rm=0.015:bm=-0.015";
// NO BEAT MAY REPLAY WHAT THE ONE BEFORE IT ALREADY SAID.
//
// Tal, 2026-09-23: *"The cuts are bad and it repeats itself, man."* He was
// hearing exactly that. call-my-mother's beats ran 14.6-21.4, then 21.0-28.2,
// then 28.0-33.2 — each one starting BEFORE the previous ended, so 0.4s and
// then 0.2s of the same audio played twice across the cut. On a sentence
// boundary that is a stutter: the last word of a line is heard, the picture
// cuts, and the word is heard again.
//
// The overlaps were not malicious, they came from autotrim padding each beat
// outwards to protect word tails (CLAUDE.md: "cut later, not earlier"). That
// is right for the OUT point and wrong for the IN point of the next beat.
// So when two consecutive beats come from the same clip and overlap, the
// later beat's IN is moved forward to the earlier beat's OUT. Nothing is lost
// — the audio is already in the previous beat — and the repeat disappears.
//
// It is reported, not silent: an overlap can also mean the beat list is wrong
// in a way only a human should resolve.
//
// SNAP FIRST, THEN DE-OVERLAP. This guard originally ran on the raw edit.json
// numbers — and then `snapBoundaries` ran per beat INSIDE the render loop and
// pushed the boundaries back out again to protect word tails. The de-overlapped
// edit was therefore not what got rendered: call-my-mother's beat 2 is 5.0s in
// the JSON and rendered 5.91s, beat 3 is 2.4s and rendered 2.66s, so they
// overlapped by ~0.9s in the finished file. Tal saw the join it produced at
// 19.5s: *"there's like a cut and it changes position, it's weird."*
//
// So every boundary is snapped up front, the overlaps are removed from the
// SNAPPED values, and the loop below uses those numbers verbatim.
// A BEAT CANNOT ASK FOR MORE FOOTAGE THAN THE CLIP HAS.
//
// giving-water-v2's last beat asked for 7.0-20.5s of a clip that ends sooner.
// ffmpeg rendered what existed (8.5s), `-shortest` then cut the audio to
// match, and the captions for the missing seconds were emitted at 46-51s in a
// film that is 46.9s long — so six captions never appeared on screen at all.
// Nothing failed; the numbers only showed up when caption sync was measured.
//
// Probe each source once and clamp, loudly.
const SRC_DUR = new Map();
function sourceDuration(id) {
  if (SRC_DUR.has(id)) return SRC_DUR.get(id);
  let path = null, base = 0;
  if (LOCAL[id]?.path && existsSync(LOCAL[id].path)) path = LOCAL[id].path;
  else {
    const rec = HQ_OFFSET[id];
    const hq = join(HQDIR, `${id}.mp4`);
    if (rec && existsSync(hq)) { path = hq; base = rec.offset; }
    else { const px = join(PROXY, `${id}.mp4`); if (existsSync(px)) path = px; }
  }
  let d = Infinity;
  if (path) {
    try {
      d = base + parseFloat(execFileSync(FP, ["-v", "error", "-show_entries",
        "format=duration", "-of", "csv=p=0", path], { encoding: "utf8" }).trim());
    } catch {}
  }
  SRC_DUR.set(id, d);
  return d;
}

const SNAP = new Map();
const SKIP = new Set();   // beats fully contained in the one before them
for (let i = 0; i < cfg.beats.length; i++) {
  const b = cfg.beats[i];
  if (!b || b[0] === "CARD") continue;
  // A MONTAGE CUTS ON ACTION, NOT ON WORDS. Snapping stretches every beat to
  // finish its word - right for dialogue, wrong for a 1.5s shot of a shirt
  // coming off. "snap": false (project) or push.exact (one beat) keeps the
  // cut exactly where the edit put it. Default unchanged: snap.
  let [a, z, why] = (cfg.snap === false || b[6]?.exact)
    ? [b[1], b[2], ""] : snapBoundaries(b[0], b[1], b[2]);
  const dur = sourceDuration(b[0]);
  if (Number.isFinite(dur) && z > dur - 0.05) {
    console.log(`  !! beat ${i} asks for ${b[1]}-${b[2]} but ${String(b[0]).slice(0, 8)} ends at ` +
      `${dur.toFixed(2)}s — clamping, its captions would have fallen off the end`);
    z = Math.max(a + 0.4, dur - 0.05);
  }
  SNAP.set(i, { ss: a, to: z, why });
}
for (let i = 1; i < cfg.beats.length; i++) {
  const prev = cfg.beats[i - 1], cur = cfg.beats[i];
  if (!prev || !cur || prev[0] === "CARD" || cur[0] === "CARD") continue;
  if (prev[0] !== cur[0]) continue;                 // different clips cannot repeat
  const P = SNAP.get(i - 1), C = SNAP.get(i);
  if (!P || !C) continue;
  // A JUMP BACK IN TIME IS NOT AN OVERLAP. A hook-first cut plays a line from
  // late in the clip (114-124s) and then the story from its start (3.6s).
  // "P.to - C.ss" read that as a 120s overlap, decided beat 2 was "entirely
  // inside" beat 1 and dropped the whole opening - every hook-first V2 of a
  // single-clip story lost its start (israel-batch, 2026-09-29; the Hindu test
  // V2 rendered 50.5s of ~56s). Only a beat that STARTS inside the previous
  // one can repeat its audio; one that starts before it is a deliberate jump.
  if (C.ss < P.ss - 0.02) {
    if (C.to > P.ss + 0.02) {
      console.log(`  !! beat ${i} jumps back but runs into beat ${i - 1}'s audio — ending it at ${P.ss}`);
      C.to = Math.max(C.ss + 0.4, P.ss);
    }
    continue;
  }
  const ov = +(P.to - C.ss).toFixed(3);
  if (ov > 0.02) {
    // A BEAT CAN BE SWALLOWED WHOLE. Moving the in-point to the previous
    // out-point is right when the overlap is partial — but when the previous
    // beat already extends past THIS beat's out-point, the move produces
    // ss > to and ffmpeg aborts with "-to value smaller than -ss". That killed
    // call-jerusalem-peace outright. Such a beat adds nothing: every frame and
    // every word of it is already in the beat before it.
    if (C.to - P.to < 0.4) {
      console.log(`  !! beat ${i} (${C.ss}-${C.to}) is entirely inside beat ${i - 1} ` +
        `(ends ${P.to}) — dropping it, it would only repeat what just played`);
      SKIP.add(i);
      continue;
    }
    console.log(`  !! beats ${i - 1}/${i} overlap by ${ov}s after snapping — the same audio ` +
      `would play twice. moving beat ${i} in-point ${C.ss} -> ${P.to}`);
    C.ss = P.to;
  }
}

// CONTIGUOUS BEATS FROM ONE CLIP MUST SHARE ONE FRAMING.
//
// Tal, 2026-09-23: *"on the 18 second marker it cuts and then it doesn't look
// clean, it doesn't flow."* At 18.6s call-my-mother cuts from beat 2 to beat 3.
// Both come from the SAME clip and are contiguous — beat 2 ends at 33.2 and
// beat 3 begins at 33.2, so the action is unbroken. But framing is computed
// PER BEAT, and the two crops landed at @366,737 and @331,829: the picture
// jumped 35px across and 92px down in the middle of a continuous movement.
// That is a jump cut manufactured by the renderer, not by the edit.
//
// So consecutive beats that come from the same clip and join without a time
// gap are one SHOT for framing purposes: the face is located once across the
// whole run and every beat in it gets the identical crop. The concat join
// still exists (it has to — beats carry their own captions, and the last one
// here is deliberately wordless) but there is nothing visible to see at it.
const FRAME_SPAN = new Map();
const CONT = new Map();   // beat -> {prev,next} continues its neighbour
const GROUP_ATT = new Map();   // beat -> denoise attenuation shared by its shot
{
  let i = 0;
  while (i < cfg.beats.length) {
    const b = cfg.beats[i];
    if (!b || b[0] === "CARD") { i++; continue; }
    let j = i;
    while (j + 1 < cfg.beats.length) {
      const cur = cfg.beats[j], nxt = cfg.beats[j + 1];
      if (!nxt || nxt[0] !== cur[0]) break;
      const C = SNAP.get(j), N = SNAP.get(j + 1);
      if (!C || !N || Math.abs(N.ss - C.to) > 0.05) break;   // a real gap = a real cut
      j++;
    }
    if (j > i) {
      const span = { ss: SNAP.get(i).ss, to: SNAP.get(j).to };
      const groupAtt = { span, att: null };   // shared by reference across the run
      for (let k = i; k <= j; k++) {
        FRAME_SPAN.set(k, span);
        CONT.set(k, { prev: k > i, next: k < j });
        GROUP_ATT.set(k, groupAtt);   // the SAME object for every beat in the run
      }
      console.log(`  beats ${i}-${j} are one continuous shot (${span.ss}-${span.to}) — sharing one crop`);
    }
    i = j + 1;
  }
}

const list = [];
let total = 0;
// EVERY CAPTION THE BUILD EMITS, so it can be READ as English instead of
// squinted at in a frame. CLAUDE.md: "Read every caption as English" - that
// check was being done by eye on a contact sheet, which is how
// "SHALOM, HOW MY CHIH" and "WHATEVER OR YOU CAN" reached Tal. The list goes
// into BUILD-LOG.json and scripts/qa-look.mjs reads it back.
const CAPTIONS = [];
let LAST_WORDS = [];   // the previous beat's final caption, for cross-beat de-duplication
let LAST_SHOWN = "";   // ...and its exact text, so an identical line cannot cross a beat join

cfg.beats.forEach(([id, ss, to, xc, why, beatRot, push], i) => {
  if (SKIP.has(i)) return;
  const n0 = String(i + 1).padStart(2, "0");
  if (id === "CARD") {
    const d = +(to - ss).toFixed(2);
    const dest = join(BEATS, `${n0}.mp4`);
    buildCard(String(why), d, dest);
    console.log(`  ${n0}  CARD  (${d}s)  "${why}"`);
    list.push(dest); total += d;
    return;
  }
  // SOURCE PRIORITY: a real local original > an HQ span > the 360p proxy.
  // Tal: "it really just makes sense just to download them high res at one
  // time ... why do I do the low res and then switch to the high res." When
  // the full-quality file is already on disk there is no reason to cut a
  // preview from a proxy and then re-cut everything a second time.
  //
  // AN HQ SPAN HAS ITS OWN CLOCK. It starts `offset` seconds into the
  // original, so ffmpeg's seek must be rebased — but captions are looked up
  // on the ORIGINAL timeline, so capSs/capTo keep the untouched values.
  // Using an HQ span without this cuts a completely different moment.
  // snap to word boundaries BEFORE anything else, so captions, audio and
  // picture all use the corrected window
  const sn = SNAP.get(i);
  if (sn) {
    if (sn.why) console.log(`      snap: ${sn.why}`);
    ss = sn.ss; to = sn.to;
  }

  // An HQ span only covers the seconds the edit that fetched it asked for.
  // A DIFFERENT edit reusing the same clip can fall outside it — eden-music
  // wanted 36-45s of a clip whose span ended at 33.8s, and the builder seeked
  // past the end of the file and died with "probe_06.png: No such file".
  // Use the span only when it genuinely contains this beat.
  const hqRec = HQ_OFFSET[id];
  const hqFits = hqRec && ss >= hqRec.offset - 0.01 && to <= hqRec.offset + hqRec.length + 0.01;
  const hq = hqFits ? hqRec.offset : null;
  if (hqRec && !hqFits) console.log(`      hq span covers ${hqRec.offset.toFixed(1)}-${(hqRec.offset + hqRec.length).toFixed(1)}s but beat is ${ss}-${to} — using the proxy`);
  const capSs = ss, capTo = to;
  let src;
  if (LOCAL[id]?.path) {
    src = LOCAL[id].path;
  } else if (hq != null && existsSync(join(HQDIR, `${id}.mp4`))) {
    src = join(HQDIR, `${id}.mp4`);
    ss = +(ss - hq).toFixed(3); to = +(to - hq).toFixed(3);
  } else {
    src = join(PROXY, `${id}.mp4`);
  }
  if (!existsSync(src)) { console.log(`  !! no source for ${id} (checked local, hq, proxy)`); return; }
  const dur = +(to - ss).toFixed(2);
  const n = String(i + 1).padStart(2, "0");
  const dest = join(BEATS, `${n}.mp4`);
  // MEASURE A DECODED FRAME, NOT THE CONTAINER.
  // ffprobe's stream width/height are the CODED dimensions. A phone/chest-cam
  // clip can be coded 1920x1080 with a 90-degree display matrix — ffmpeg
  // auto-rotates it on decode, so it is really 1080x1920 by the time any
  // filter sees it. Trusting ffprobe made the builder think an already-upright
  // clip was landscape and rotate it a second time, putting Roman on his side.
  // The Sony files in the same folder have NO rotation metadata and genuinely
  // do need transposing, so one rule cannot be hardcoded per shoot — measure.
  const probePng = join(TMP, `probe_${n}.png`);
  execFileSync(FF, ["-v", "error", "-y", "-ss", String(ss), "-i", src, "-frames:v", "1", probePng], { stdio: "pipe" });
  const [W, H] = execFileSync(FP, ["-v", "error", "-select_streams", "v:0", "-show_entries",
    "stream=width,height", "-of", "csv=p=0:nk=1", probePng], { encoding: "utf8" }).trim().split(/[,\r\n]+/).map(Number);

  // EXPOSURE. Tal on the coffee-shop cut: "it was way too dark, no light added."
  // A market stall at dusk or a shaded shop interior comes in far under a
  // street scene, and a single fixed grade cannot serve both. Measure this
  // beat's mean luma and lift only what needs lifting, so bright beats are
  // left alone and the cut does not flicker between light and dark.
  let lift = "";
  try {
    const st = spawnSync(FF, ["-v", "info", "-i", probePng,
      "-vf", "format=gray,signalstats,metadata=print", "-f", "null", "-"],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
    const txt = (st.stdout || "") + (st.stderr || "");
    const m = /lavfi\.signalstats\.YAVG=([\d.]+)/.exec(txt);
    const y = m ? parseFloat(m[1]) : null;
    if (y != null) {
      // MILKY. Gamma up to 1.70 plus +0.10 brightness is not an exposure lift,
      // it is a fog machine: it raises the BLACK POINT, so a dim interior came
      // out grey and hazy with no contrast left. Measured on COFFEE KINDNESS
      // V4 — the delivered file has a washed-out beat next to an untouched
      // dark one, so the picture flickers in brightness at every cut, which is
      // half of what Tal saw as "the colors are bad".
      //
      // Two changes: the lift is capped far lower, and every gamma move is
      // paired with a contrast move that puts the black point back where it
      // was. Lifting shadows should open the face, not grey out the frame.
      // USE A CURVE, NOT A GAMMA. `eq=gamma` moves the whole transfer curve,
      // including the black point, which is what made the first version of
      // this milky. Capping the gamma instead (1.30) and adding contrast to
      // compensate just made it dark — the two fight each other, and the
      // market interior came out nearly black.
      //
      // A curve states the intent exactly: pin black at black, pin white at
      // white, and move the MIDTONE to where it should be. Shadows keep their
      // depth, highlights do not blow, and the face opens up. ffmpeg splines
      // through the control points.
      if (y < 92) {
        const inMid = Math.max(0.06, Math.min(0.48, y / 255));
        const outMid = 0.40;                       // ~102/255, a lit face
        // a gentle second point keeps the upper mids from flattening out
        const inHi = Math.min(0.92, inMid + 0.30), outHi = Math.min(0.95, outMid + 0.28);
        lift = `curves=all='0/0 ${inMid.toFixed(3)}/${outMid.toFixed(3)} ${inHi.toFixed(3)}/${outHi.toFixed(3)} 1/1',`;
        console.log(`      exposure: luma ${y.toFixed(0)} -> curve mid ${inMid.toFixed(2)}->${outMid.toFixed(2)} (black point held)`);
      } else if (y > 125) {
        // TAME - the half this block was missing. Tal on ROMAN, 2026-09-28:
        // *"some of the shots are overexposed. You gotta fix that."* This block
        // only ever LIFTED dark beats (after "way too dark" on the coffee shop),
        // so a midday street came through untouched - and then GRADE below
        // RAISES the highlights (0.85 -> 0.92) and saturation +42% on top.
        // Measured on the feed-homeless source: the new-clothes shot sat at
        // luma 206 with 37% of the frame clipped to white; the POV walk-up 185.
        //
        // Pull the midtone DOWN, holding black. The source is 8-bit: sky that
        // is already 255 is gone and no curve brings it back - but faces and
        // skin come back to a normal level, and on the worst frames the white
        // point drops a touch so blown areas read as bright, not burned.
        // GRADE still runs after this and adds ~+0.05 to the mids, so the
        // targets here sit just under where the finished shot should land.
        // TESTED ON STILLS before rendering, old grade vs new, measured:
        //   new clothes 206 -> 164, "you look good" 177 -> 149, POV shirt 185 -> 158,
        //   POV walk-up 172 -> 148, Sony shirt 141 -> 129   (old grade: 214/187/200/185/149)
        // A first version pulled the brightest shot to mid 0.48 at full saturation
        // and the cream shirt went ORANGE AND BLOTCHY: darkening a near-white
        // area reveals colour, and GRADE's +42% saturation then boosts it.
        // So the brightest pull is gentler, and a tamed beat gives most of that
        // saturation back (x0.72-0.82 here, against GRADE's x1.42).
        const inMid = Math.min(0.85, y / 255);
        const outMid = y > 185 ? 0.52 : (y > 170 ? 0.48 : 0.44);
        const white = y > 185 ? 0.96 : 1;
        const sat = y > 170 ? 0.72 : 0.82;
        lift = `curves=all='0/0 ${inMid.toFixed(3)}/${outMid.toFixed(3)} 1/${white}',eq=saturation=${sat},`;
        console.log(`      exposure: luma ${y.toFixed(0)} TOO BRIGHT -> mid ${inMid.toFixed(2)}->${outMid.toFixed(2)}` +
          (white < 1 ? `, white ${white}` : "") + " (black point held)");
      }
    }
  } catch {}
  const frames = Math.max(1, Math.round(dur * 30));
  // A landscape proxy inside an otherwise-vertical shoot is portrait content
  // stored sideways. Heads point LEFT, so transpose=1 (90 clockwise) is right.
  // ROTATION. Portrait content stored sideways needs transpose=1. But genuinely
// LANDSCAPE content (the call-someone-you-love table rig is a 4K 16:9 locked
// shot of a seated person) must NOT be rotated - that lays the subject down.
// Pass 0 in the beat's rotation slot for real landscape; the 9:16 crop then
// picks the part of the frame to keep via xc.
const rot = beatRot ?? (cfg.layout !== "square" && W > H ? 1 : 0);
  // LEVEL. Tal, 2026-09-29: some POV shots are "not rotated, not straight" -
  // a few degrees off because his head was tilted. A beat's {tilt} (degrees,
  // + = rotate clockwise) or the project's measured `tilts[id]`
  // (tools/level-detect.py, only written when its confidence is high) turns
  // the picture level, then zooms just enough to hide the corners:
  // s = cos(t) + (long/short) * sin(t) for the output's own aspect.
  const tiltDeg = push?.tilt ?? cfg.tilts?.[id] ?? 0;
  let lvl = "";
  if (Math.abs(tiltDeg) >= 0.5 && Math.abs(tiltDeg) <= 12) {
    const t = Math.abs(tiltDeg) * Math.PI / 180;
    const s = Math.cos(t) + (1920 / 1080) * Math.sin(t);
    // Crop back to the EXACT pre-rotation size: the face-aim crop that follows
    // is computed on those dimensions, and a frame 2px short (rounding in an
    // iw/s expression) makes that crop fail outright.
    const w0 = rot ? H : W, h0 = rot ? W : H;
    const sw = Math.ceil(w0 * s / 2) * 2, sh = Math.ceil(h0 * s / 2) * 2;
    lvl = `rotate=${(tiltDeg * Math.PI / 180).toFixed(5)}:ow=iw:oh=ih:c=black,` +
      `scale=${sw}:${sh},crop=${w0}:${h0},`;
  }
  const pre = (rot ? `transpose=${rot},` : "") + lvl;
  // MUSIC CUT: no captions at all. Tal wants two shapes per story - one with
  // the conversation, one carried by picture and music only.
  // CAPTIONS FOLLOW THE AUDIO, NOT THE PICTURE.
  //
  // A beat with `push.audio` plays one clip's picture over another window's
  // sound — giving-water-v2's ending is labelled "[picture -2s, audio
  // unchanged]". Captions were still being looked up against the PICTURE
  // window, so on every grafted beat they were offset from the voice by
  // exactly the graft. Seven projects carry audio grafts.
  const capId = push?.audio?.id ?? id;
  const capA  = push?.audio ? push.audio.at : capSs;
  const capB  = push?.audio ? push.audio.at + (to - ss) : capTo;
  // Onsets must be measured in the audio that will actually PLAY, so a grafted
  // beat resolves its audio file here and hands that over — passing nothing
  // silently turned the snapping off and made those beats worse.
  let capSrc = src, capBase = 0;
  if (push?.audio) {
    const aL = LOCAL[push.audio.id]?.path;
    const aH = join(HQDIR, `${push.audio.id}.mp4`);
    const aR = HQ_OFFSET[push.audio.id];
    if (aL && existsSync(aL)) capSrc = aL;
    else if (aR && existsSync(aH)) { capSrc = aH; capBase = aR.offset; }
    else capSrc = join(PROXY, `${push.audio.id}.mp4`);
  }
  const caps = cfg.silent ? [] : captionFilters(capId, capA, capB, n,
    { nocap: !!push?.nocap, src: capSrc, srcBase: capBase });
  const capOv = captionOverlays(caps, TMP);

  let vf;
  if (cfg.layout === "square") {
    // horizontal source: square band on a blurred fill. A 9:16 centre-crop
    // keeps only 31% of the width and decapitates people.
    const sq = Math.min(W, H), sqX = Math.max(0, Math.min(W - sq, Math.round(W * xc - sq / 2)));
    const bgW = Math.round(H * 9 / 16 / 2) * 2, bgX = Math.round((W - bgW) / 2);
    vf = [`[0:v]fps=30,${lift}split=2[bg][fg]`,
      `[bg]crop=${bgW}:${H}:${bgX}:0,scale=1080:1920,gblur=sigma=30,eq=brightness=-0.14:saturation=0.8[bgb]`,
      `[fg]crop=${sq}:${H}:${sqX}:0,scale=1080:1080:flags=lanczos,${GRADE},zoompan=z='min(1.0+0.06*on/${frames}\\,1.06)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1080:fps=30[fgs]`,
      `[bgb][fgs]overlay=(W-w)/2:330,setsar=1${capOv.label}`].join(";") + capOv.suffix;
  } else {
    // already vertical: fill 1080x1920, punch-in, captions on top.
    //
    // PUSH-IN. A beat may carry {z:[from,to], x, y} as its 7th element to
    // drive a real move instead of the default 5% drift — Eden's story is 60s
    // on ONE locked wide shot where her face is a tenth of the frame.
    // Tal: "zoom in slowly on her face." x/y are the focus point in 0..1 of
    // the frame; the window is clamped so the crop can never leave the image.
    const z0 = push?.z?.[0] ?? 1.00, z1 = push?.z?.[1] ?? 1.05;
    const fx = push?.x ?? 0.5, fy = push?.y ?? 0.5;
    const zx = `max(0\\,min(iw-iw/zoom\\,iw*${fx}-(iw/zoom/2)))`;
    const zy = `max(0\\,min(ih-ih/zoom\\,ih*${fy}-(ih/zoom/2)))`;

    // AIM THE CROP AT THE PERSON — unless the beat states its own framing.
    //
    // `crop=1080:1920:x=(iw-out_w)*xc:y=0` keeps the TOP of the frame. On POV
    // street footage the top of the frame is sky, an awning or a wall, and the
    // person is in the bottom third, so the subject came out tiny behind a lot
    // of nothing. A hand-authored {z,x,y} push always wins; otherwise find the
    // face and crop to it. See scripts/lib/framing.mjs for the measurements.
    // A HAND-AUTHORED PUSH IS ALSO A GUESS. coffee-kindness carries
    // {z:[1.22,1.38], x:0.5, y:0.38} on every beat — an invented zoom aimed at
    // an invented point. The man's head is 7% of the frame there; it needs
    // ~2.5x, not 1.3x, and he is not at x=0.5. So measurement wins over the
    // guess whenever there is something to measure: if a face is actually
    // found the crop is aimed at it, and the hand-authored push is only used
    // when nothing is found. `"autoFrame": false` opts a project out entirely.
    let aim = null;
    if (cfg.autoFrame !== false && !push?.manual) {
      const rw = rot ? H : W, rh = rot ? W : H;      // dimensions AFTER rotation
      // SAMPLE THE WHOLE BEAT, not its first six seconds. A 17s beat was
      // being framed on what happened in the first third of it.
      // Frame across the whole continuous shot when this beat is part of one,
      // so the crop cannot shift at an invisible join.
      const fs = FRAME_SPAN.get(i);
      const fss = fs ? Math.max(0, fs.ss - (hq ?? 0)) : ss;
      const fto = fs ? Math.max(fss + 0.5, fs.to - (hq ?? 0)) : to;
      // `faceMinY` discards detections in the top band of frame — see
      // face-box.py. coffee-kindness needs it: a printed stencil portrait on
      // the stall awning out-detects the living shop owner.
      const box = locate(src, fss, fto, rot, Math.max(6, Math.min(14, Math.round((fto - fss) / 1.5))),
        cfg.faceMinY ? { minY: cfg.faceMinY } : {});
      // THE ZOOM CEILING IS PER PROJECT. 1.55 is right for a 4K close shot of
      // one person (call-my-mother), and far too wide for coffee-kindness,
      // which is a long-lens frame of a whole market stall where the shop
      // owner's head is a small part of the picture. `"maxZoom": 2.0` in
      // edit.json raises it for that film only. The AIM is still measured —
      // what is being replaced is the invented x/y of a hand-written push,
      // not the decision to push at all.
      aim = frameFor(box, rw, rh, cfg.maxZoom ? { maxZoom: cfg.maxZoom } : undefined);
      // A CROP AIMED ON ONE SAMPLE IN TEN IS NOT AN AIM.
      // eden-simple framed a beat on 10% confidence and put the crop at y=0 —
      // the top of frame — so a hospital scene came out as a balloon and wall
      // sockets with Eden and Tal squeezed along the bottom edge. Below ~25%
      // the detector has not really found anyone, and a wrong tight crop is
      // far worse than no crop: the full frame always contains whatever is
      // there. Fall back to the plain centre crop instead.
      if (aim && aim.confidence < 0.25) {
        console.log(`      framing: only ${(aim.confidence * 100).toFixed(0)}% of samples held a face ` +
          `— too weak to aim at, using the full frame`);
        aim = null;
      }
      if (aim) {
        console.log(`      framing: ${aim.by} (${(aim.confidence * 100).toFixed(0)}% of samples)` +
          ` -> crop ${aim.w}x${aim.h} @${aim.x},${aim.y}  zoom ${aim.zoom}x`);
      } else {
        // NOT a detail. A beat with no visible person is the defect Tal found
        // in SHALOM SALAM V3 (an empty pavement captioned "HOW ARE YOU") and
        // GIVING WATER V4 (a passing car, a wheelbarrow). Say so every time.
        console.log(`      !! NO PERSON FOUND in ${id.slice(0, 8)} ${ss}-${to} — ` +
          `blind centre crop. Check this beat belongs in the film.`);
      }
    }

    if (aim) {
      // A slow push on top of the aimed crop, so the shot still breathes. When
      // the beat author asked for a move, keep its SHAPE (how far it travels)
      // even though the aimed crop has replaced its starting size.
      // NO AUTOMATIC PUSH-IN. Tal, 2026-09-23: *"You don't need to zoom in just
      // because I gave you that skill. I did say you need to zoom in - it's
      // just an idea so you can get better."* A move on every single beat is a
      // tic, not a choice: it makes a locked-off 4K shot of a calm conversation
      // drift for no reason, and it fights the wider framing he asked for.
      // A push now happens ONLY where the edit explicitly asks for one.
      const zEnd = push?.z ? Math.min(1.15, Math.max(1.02, push.z[1] / push.z[0])) : 1.0;
      vf = [`[0:v]fps=30,${lift}${pre}crop=${aim.w}:${aim.h}:${aim.x}:${aim.y},` +
        `scale=1080:1920:flags=lanczos,unsharp=5:5:0.45:5:5:0.0,${GRADE},` +
        `zoompan=z='min(1.0+${(zEnd - 1).toFixed(4)}*on/${frames}\\,${zEnd})':d=1` +
        `:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30` +
        `,setsar=1${capOv.label}`].join(";") + capOv.suffix;
    } else {
      vf = [`[0:v]fps=30,${lift}${pre}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:x=(iw-out_w)*${xc}:y=0,${GRADE},` +
        `zoompan=z='min(${z0}+${(z1 - z0).toFixed(4)}*on/${frames}\\,${z1})':d=1:x='${zx}':y='${zy}':s=1080x1920:fps=30` +
        `,setsar=1${capOv.label}`].join(";") + capOv.suffix;
    }
  }

  // AUDIO FROM A SECOND CAMERA. Tal: "the VID ones — you can just use the
  // audio from those, the camera videos." On the feed-homeless shoot the Sony
  // has the picture and the chest camera has the close mic; the chest cam is
  // metres nearer the speaker, so it is the only usable dialogue track.
  // push.audio = { id, at } — `at` is the same instant in the OTHER clip's
  // timeline, so the offset between the two cameras is stated once per beat.
  // The attenuation this beat must use: measured ONCE for the whole
  // continuous shot, on its first beat, then reused by the rest of the run.
  const sharedAtt = () => {
    const g = GROUP_ATT.get(i);
    if (!g) return undefined;                 // a real cut — measure per beat
    if (g.att == null) {
      // MEASURE THE RAW AUDIO. The first version of this probed via
      // cleanAudio(), which denoises before measuring — so it read the floor of
      // an already-cleaned file, came back quiet, and chose -a 10 for a street
      // that actually needed 16. Extract untouched audio and measure that.
      const probe = join(TMP, `att_${n}.wav`);
      try {
        execFileSync(FF, ["-v", "error", "-y", "-ss", String(ss), "-t",
          String(Math.min(6, Math.max(1, to - ss))), "-i", src,
          "-vn", "-ac", "1", "-ar", "48000", probe], { stdio: "pipe" });
      } catch {}
      const fl = existsSync(probe) ? noiseFloor(probe) : null;
      let a = Math.min(18, Math.max(6, cfg.denoise ?? 10));
      if (cfg.denoise == null && fl != null && fl > -30) a = Math.min(16, Math.round(a + (fl + 30) * 0.8));
      g.att = a;
      console.log(`      one shot -> denoise -a ${a} for every beat in it`);
    }
    return g.att;
  };

  let wav;
  if (push?.audio?.id) {
    // THE AUDIO SOURCE HAS ITS OWN CLOCK TOO.
    //
    // `push.audio.at` is stated on the ORIGINAL timeline, but an HQ span
    // starts `offset` seconds into that original — and this path used `at`
    // directly against the span file. Every cross-camera audio graft that read
    // from an HQ span was therefore playing a moment `offset` seconds late.
    // giving-water-v2 asked for 9.0s of a span beginning at 5.0s, read 14.0s,
    // ran off the end of a 17.5s file, and `-shortest` silently truncated the
    // whole beat from 13.5s to 8.5s — taking six captions off the end of the
    // film with it. Nothing errored.
    const aLocal = LOCAL[push.audio.id]?.path;
    const aHq = join(HQDIR, `${push.audio.id}.mp4`);
    const aRec = HQ_OFFSET[push.audio.id];
    let aSrc, aBase = 0;
    if (aLocal && existsSync(aLocal)) aSrc = aLocal;
    else if (aRec && existsSync(aHq)) { aSrc = aHq; aBase = aRec.offset; }
    else aSrc = join(PROXY, `${push.audio.id}.mp4`);
    if (existsSync(aSrc)) {
      const aSs = +(push.audio.at - aBase).toFixed(3);
      const aTo = +(aSs + (to - ss)).toFixed(3);
      if (aSs < -0.01) console.log(`  !! audio graft at ${push.audio.at}s is before its HQ span (starts ${aBase}s)`);
      wav = cleanAudio(aSrc, aSs, aTo, n);
    } else {
      console.log(`  !! audio source ${push.audio.id} not found — using this clip's own audio`);
      wav = cleanAudio(src, ss, to, n, sharedAtt());
    }
  } else {
    wav = cleanAudio(src, ss, to, n, sharedAtt());
  }
  execFileSync(FF, ["-v", "error", "-y", "-ss", String(ss), "-to", String(to), "-i", src, "-i", wav,
    // ONE COLOUR RANGE FOR EVERY BEAT. The chest cam records FULL range
    // (yuvj420p), the Sony LIMITED - and each beat used to be encoded in its
    // source's range, then joined. The join reads ONE range for the whole
    // file, so on ROMAN (2026-09-28) the Sony shots in the montage came out
    // with blacks lifted from 0 to 16 and whites cut from 254 to 236 -
    // washed out - while in the story one full-range shot went the other way.
    // Measured by decoding the same frame from the beat file and the final.
    // This is the root cause of the yuvj420p issue CLAUDE.md 7 had flagged
    // since 09-12 as "not yet root-caused". Convert every beat to limited
    // range here (a no-op for a beat already limited) and tag it as such.
    "-filter_complex", vf + ";[v]scale=out_range=tv,format=yuv420p[vtv]", "-map", "[vtv]", "-map", "1:a",
    "-color_range", "tv",
    // AUDIO AT THE JOINS. Tal: "when the clips would change, the audio would
    // mess up." Two causes, both here:
    //   1. loudnorm ran PER BEAT, so every beat was normalised to its own
    //      loudness and the level jumped at every single cut. Loudness is now
    //      set ONCE on the finished timeline, at the bottom of this file.
    //   2. no fade, so each splice started and ended on a non-zero sample —
    //      an audible click. 25ms in/out is inaudible as a fade and removes it.
    // FADE ONLY AT A REAL CUT. The 25ms in/out removes the click of splicing on
    // a non-zero sample — but on a run of contiguous beats from ONE clip there
    // is no splice to hide, and fading every join put a small dip in the middle
    // of continuous speech every few seconds. Tal: *"it doesn't flow."*
    "-af", `highpass=f=70,volume=${beatGain(wav)}dB` +
      (CONT.get(i)?.prev ? "" : ",afade=t=in:st=0:d=0.025") +
      (CONT.get(i)?.next ? "" : `,afade=t=out:st=${Math.max(0, dur - 0.025).toFixed(3)}:d=0.025`),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", FINAL ? "19" : "21", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-shortest", dest], { stdio: "pipe" });

  console.log(`  ${n}  ${id.slice(0, 8)}  ${ss}->${to} (${dur}s, ${caps.length} caps)  ${why ?? ""}`);
  list.push(dest); total += dur;
});

writeFileSync(join(OUT, "concat.txt"), list.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"), "utf8");
const outName = cfg.out ?? `${slug.toUpperCase()}_V1.mp4`;

const args = ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", join(OUT, "concat.txt")];
let fc = `[0:v]scale=${PREVIEW_W}:${PREVIEW_H}[v]`;
if (cfg.title) {
  const png = join(OUT, "title.png");
  execFileSync("python", [join(ROOT, "scripts/make-title.py"), cfg.title, png, "52"], { stdio: "pipe" });
  args.push("-i", png);
  // `titleY` = the pill's TOP edge in px on the 1920 frame. 150 (0.078) was
  // the old guess; his posted "POV: MEETING A …" reels measure the pill at
  // y ~0.15-0.19 (pov-meta-glasses.md section 5) -> "titleY": 260.
  fc = `[0:v][1:v]overlay=(W-w)/2:${cfg.titleY ?? 150}:enable='lt(t\\,${cfg.titleHold ?? 4.5})'[tv];[tv]scale=${PREVIEW_W}:${PREVIEW_H}[v]`;
}
// THE TIMELINE AUDIO CHAIN.
//
// What was here — `dynaudnorm=f=250:g=15:p=0.9:m=4` — is a level RIDER: it
// finds every quiet passage and lifts it, by up to 12 dB. Between sentences
// the quiet passage IS the street, so the street came up to meet the voice.
// COFFEE KINDNESS V4 ends up with 9.8 dB of range across 76 seconds and a
// -25.8 dB floor: a flat wall of boosted market noise under every word.
//
// Beats are now level-matched individually before they are cut in (beatGain),
// so nothing has to ride the timeline. What is left to do here is the
// opposite of what was being done: hold the floor DOWN so the quiet stays
// quiet, and catch peaks so the loudest reaction does not clip.
//   compand  - gentle downward expansion below -40dB, 2:1 above -12dB
//   asubcut  - remove sub-70Hz wind/handling rumble the beats' highpass missed
const TIMELINE_AF = "asubcut=cutoff=65," +
  "compand=attacks=0.02:decays=0.35:points=-70/-80|-40/-34|-20/-16|-6/-5.5|0/-3:soft-knee=6";

// ONE loudness pass over the WHOLE timeline, not per beat. Per-beat loudnorm
// made every cut jump in level, which is what Tal heard as the audio "messing
// up" at clip changes. dynaudnorm smooths what is left without pumping.
// MUSIC BED. cfg.music is a path under projects/_music/. When a project is
// `silent`, the location sound is kept low under the track so the place still
// feels real; otherwise the music ducks well under the dialogue.
const musicPath = cfg.music ? join(ROOT, "projects/_music", cfg.music) : null;
if (musicPath && !existsSync(musicPath)) {
  console.log(`  !! music not found: ${musicPath} — rendering without it`);
}
const hasMusic = musicPath && existsSync(musicPath);
if (hasMusic) args.push("-stream_loop", "-1", "-i", musicPath);
const musicIdx = cfg.title ? 2 : 1;
const amix = hasMusic
  ? `[0:a]${TIMELINE_AF}[spk];` +
    `[${musicIdx}:a]volume=${cfg.silent ? 0.85 : 0.14},afade=t=in:st=0:d=1.5[bed];` +
    `[spk][bed]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,` +
    `loudnorm=I=-16:TP=-1.5:LRA=11[a]`
  : null;

execFileSync(FF, [...args, "-filter_complex", hasMusic ? `${fc};${amix}` : fc,
  "-map", "[v]", "-map", hasMusic ? "[a]" : "0:a",
  ...(hasMusic ? [] : ["-af", `${TIMELINE_AF},loudnorm=I=-16:TP=-1.5:LRA=11`]),
  "-c:v", "libx264", "-preset", "medium", "-crf", FINAL ? "19" : "23", "-pix_fmt", "yuv420p",
  "-color_range", "tv",
  "-c:a", "aac", "-b:a", "160k", "-ar", "48000", join(OUT, outName)], { stdio: "pipe" });

// NEVER write "EDIT.json" here. Windows paths are case-insensitive, so that
// is the SAME FILE as the edit.json this script just read — every build was
// overwriting its own recipe with a build record, silently destroying
// `layout` and `out`. The next build then fell back to a vertical default and
// a default filename, which is how HOSPITAL_RAMALLAH_V2 came back as
// HOSPITAL-RAMALLAH_V1. The record goes in its own file.
writeFileSync(join(OUT, "BUILD-LOG.json"), JSON.stringify({
  built: new Date().toISOString(), total_s: +total.toFixed(2),
  out: outName, layout: cfg.layout ?? "vertical", title: cfg.title, beats: cfg.beats,
  captions: CAPTIONS,
}, null, 2), "utf8");
// NEVER destroy an earlier version. This used to delete every other _V*.mp4
// in the folder, which silently removed cuts that had already been delivered
// and that Tal might still want to compare against (CLAUDE.md §1).
 rmSync(TMP, { recursive: true, force: true });
console.log(`\nTOTAL ${total.toFixed(1)}s  ->  projects/${slug}/${outName}`);
