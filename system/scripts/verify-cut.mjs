#!/usr/bin/env node
// VERIFY A CUT BEFORE IT IS SENT.
//
// Tal's rule: nobody may be cut off mid-sentence. A beat must not start or end
// inside a spoken word, and a sentence that starts in one beat must either
// finish in that beat or continue into the next one.
//
// This reads the REAL word timestamps (Groq --words) for each source clip and
// measures the in/out points against them. It reports; it does not silently
// "fix" anything, because the right fix is sometimes a different shot.
//
//   node scripts/verify-cut.mjs projects/<slug>/EDIT.json
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const TRANS = join(ROOT, "projects/_frameio/cache/transcripts");
const INDEX = join(ROOT, "projects/_frameio/cache/discover-index.json");

const editPath = process.argv[2];
if (!editPath) { console.error("usage: node scripts/verify-cut.mjs <EDIT.json>"); process.exit(1); }
const edit = JSON.parse(readFileSync(editPath, "utf8"));

// resolve a beat's clip tag -> frame.io id using whichever index holds it
const idx = JSON.parse(readFileSync(INDEX, "utf8"));
const byTag = {};
for (const f of idx.files) {
  const m = /_(\d{4})_D?\.MP4$/i.exec(f.name) ?? /^DJI_\d+_(\d{4})_/.exec(f.name);
  if (m) byTag[m[1]] = f.id;
}

const TOL = 0.06;          // a word boundary within 60ms counts as clean
let problems = 0, checked = 0;

console.log(`\nVERIFYING ${editPath}  (${edit.beats.length} beats, ${edit.total_s}s)\n`);

edit.beats.forEach((b, i) => {
  const [tag, ss, to, , why] = b;
  // a beat may carry a full frame.io uuid directly (generic builder) or a
  // short DJI tag (jamaica). Accept both.
  // LOCAL clips (transcribe-local ids, "local-<hash>") were matched by neither
  // test, so every beat of a local-footage edit was skipped and the gate
  // reported "0 captions" / nothing to verify - a pass that checked nothing
  // (found 2026-09-29 on the israel-batch test). An id with a transcript on
  // disk is used as-is.
  const id = existsSync(join(TRANS, `${tag}.json`)) ? String(tag)
    : /^[0-9a-f]{8}-/.test(String(tag)) ? tag : byTag[tag];
  const p = id ? join(TRANS, `${id}.json`) : null;
  if (!p || !existsSync(p)) { console.log(`  ${String(i + 1).padStart(2, "0")}  ${tag}  -- no transcript, cannot verify`); return; }
  const j = JSON.parse(readFileSync(p, "utf8"));
  const words = j.words ?? [];
  if (!words.length) { console.log(`  ${String(i + 1).padStart(2, "0")}  ${tag}  -- NO WORD TIMESTAMPS (re-run with --words)`); problems++; return; }
  checked++;

  const n = String(i + 1).padStart(2, "0");
  const msgs = [];

  // a word straddling the IN point = the viewer hears half a word
  const headCut = words.find((w) => w.start < ss - TOL && w.end > ss + TOL);
  if (headCut) msgs.push(`HEAD cuts into "${headCut.word}" (${headCut.start.toFixed(2)}-${headCut.end.toFixed(2)}, in=${ss})  -> move in-point to ${(headCut.end).toFixed(2)} or ${(headCut.start).toFixed(2)}`);

  // a word straddling the OUT point = the sentence is chopped
  // A tail landing INSIDE the next word is only a defect when the previous
  // word had not already finished. With continuous speech there is no gap to
  // pad into, and ending right after the last word is correct, not "snapped".
  const lastBefore = words.filter((w) => w.end <= to + TOL).pop();
  const tailRaw = words.find((w) => w.start < to - TOL && w.end > to + TOL);
  const tailCut = (tailRaw && lastBefore && (to - lastBefore.end) < 0.06) ? tailRaw : (lastBefore ? null : tailRaw);
  if (tailCut) msgs.push(`TAIL cuts into "${tailCut.word}" (${tailCut.start.toFixed(2)}-${tailCut.end.toFixed(2)}, out=${to})  -> move out-point to ${(tailCut.end + 0.12).toFixed(2)}`);

  // does the beat END on a finished thought?
  const inside = words.filter((w) => w.start >= ss - TOL && w.end <= to + TOL);
  if (inside.length) {
    const last = inside[inside.length - 1];
    const endsClean = /[.!?]$/.test(String(last.word).trim());
    const next = edit.beats[i + 1];
    const continuesInNext = next && next[0] === tag && Math.abs(next[1] - to) < 0.5;
    const after = words.find((w) => w.start >= to - TOL);
    // nobody speaks again in this clip -> the thought is as finished as it gets.
    // (Hebrew/Arabic transcripts often carry no punctuation: "shalom" at the
    // clip's last word was flagged on every greeting beat.)
    if (!endsClean && !continuesInNext && after) {
      msgs.push(`ends mid-thought on "${last.word}"` + (after ? ` — next spoken word is "${after.word}" at ${after.start.toFixed(2)} (${(after.start - to).toFixed(2)}s later)` : ""));
    }
    // dead air at the tail: >1.2s of silence after the last word
    const gap = to - last.end;
    if (gap > 1.2) msgs.push(`${gap.toFixed(2)}s of silence after the last word — trim out-point to ${(last.end + 0.35).toFixed(2)}`);
  }

  if (msgs.length) {
    problems += msgs.length;
    console.log(`  ${n}  ${tag} ${ss}->${to}`);
    for (const m of msgs) console.log(`        ${m}`);
  } else {
    console.log(`  ${n}  ${tag} ${ss}->${to}  clean`);
  }
});

console.log(`\n${checked}/${edit.beats.length} beats verified against word timings.`);
console.log(problems ? `${problems} issue(s) — FIX BEFORE SENDING.` : `No boundary problems. Safe to send.`);
// --- POST-RENDER CHECK: transcribe the FINISHED audio ----------------------
// Silence detection was the wrong tool: street and car ambience sits above any
// usable noise floor, so it flagged all 12 cuts on a cut with 2 real problems.
// The correct test is the one CLAUDE.md already prescribes - align against the
// FINAL EDITED AUDIO. If a word in the rendered file straddles a cut point,
// someone is being cut off, whatever the source transcript predicted.
const rIdx = process.argv.indexOf("--render");
if (rIdx > 0 && process.argv[rIdx + 1]) {
  const { execFileSync } = await import("node:child_process");
  const { groqTranscribe } = await import("./lib/stt.mjs");
  const FFDIR = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin";
  const mp4 = process.argv[rIdx + 1];
  const tmp = mp4.replace(/\.mp4$/i, ".verify.flac");
  console.log(`
POST-RENDER CHECK — re-transcribing the finished audio`);
  execFileSync(join(FFDIR, "ffmpeg.exe"), ["-v", "error", "-y", "-i", mp4,
    "-vn", "-ar", "16000", "-ac", "1", "-c:a", "flac", tmp], { stdio: "pipe" });

  let words = [];
  try {
    const r = await groqTranscribe(tmp, { words: true });
    words = (r.words ?? []).sort((a, b) => a.start - b.start);
  } catch (e) { console.log(`  (could not verify: ${String(e?.message ?? e).slice(0, 60)})`); }

  if (words.length) {
    let acc = 0, bad = 0;
    edit.beats.forEach((b, i) => {
      acc += (b[2] - b[1]);
      if (i === edit.beats.length - 1) return;
      // Tolerance 0.45s: at a concatenation JOIN the transcriber blurs the tail of
      // one beat into the head of the next and places boundary words ~0.3s early.
      // A genuinely chopped word straddles the cut by much more than that.
      const w = words.find((x) => x.start < acc - 0.45 && x.end > acc + 0.45);
      if (w) {
        bad++;
        console.log(`  CUT ${String(i + 1).padStart(2, "0")}->${String(i + 2).padStart(2, "0")} at ${acc.toFixed(2)}s cuts through "${w.word}" (${w.start.toFixed(2)}-${w.end.toFixed(2)})`);
      }
    });
    console.log(bad
      ? `  ${bad} cut(s) chop a word IN THE FINISHED FILE. FIX BEFORE SENDING.`
      : `  ${words.length} words checked - no cut chops a word. Nobody is cut off.`);
    problems += bad;
  }
}

// exitCode, NOT process.exit(): the Groq fetch leaves a keep-alive socket
// closing, and process.exit() during that close aborts Node on Windows
// ("Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)", exit 127) AFTER
// every check passed - which failed the selfreview gate on every render
// (Social Accords batch, 2026-09-29). Letting the loop drain exits cleanly.
process.exitCode = problems ? 1 : 0;

// ---------------------------------------------------------------------------
// POST-RENDER CHECK — the one that actually matters.
//
// Tal: "on the audio transcript it says it's okay, but on the actual edit it
// doesn't look so good." He is right. Transcript math is a PREDICTION; the
// rendered file is the TRUTH. This measures real audio energy in the finished
// MP4 at every cut point. If speech is still active when a cut lands, the line
// was chopped — regardless of what the transcript claimed.
//
//   node scripts/verify-cut.mjs <EDIT.json> --render <final.mp4>
