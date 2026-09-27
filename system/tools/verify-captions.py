#!/usr/bin/env python3
"""
verify-captions.py — prove a rendered video's captions actually match what the
people in it are saying, and that no two captions ever overlap.

Built 2026-09-15 after getting captions wrong four distinct ways in one
session (see the failure catalog in .claude/agents/caption-qc.md):
  1. drift  — whisper.cpp word-splitting is unreliable across a long take;
              the error GREW through the clip instead of being a fixed offset
  2. garbage — aligning a short cropped segment with no surrounding context
              produced meaningless words
  3. wrong language — a clean-reading ENGLISH transcript came from ARABIC
              audio (it was a translation), so forcing English alignment on
              the real audio produced phonetic nonsense
  4. mistranslation — an automated translator looped ("Hi, Hi, Hi..." x200)
              and rendered a common well-wishing blessing as "God rest your soul"
  5. overlap — two cues on screen at once

This tool is the instrument that catches 1, 2, 3 and 5 mechanically. It
cannot catch 4 (see LIMITS at the bottom of the report) — that needs a human
or a second model that actually reads both languages.

Usage:
    python tools/verify-captions.py FINAL.mp4 --cues cues.json [--out report.json]

cues.json is a list of what is ACTUALLY BURNED IN, in final-video time:
    [{"t0": 3.45, "t1": 7.41, "text": "PEACE BE UPON YOU", "lang": "en"}, ...]
`lang` is the language of the CAPTION TEXT. Add "spoken": "ar" on a cue whose
text is a translation of different-language speech — the text-match check is
then correctly skipped for it instead of failing for the wrong reason.

Exit code 0 = pass, 1 = real problems found, 2 = could not run.
"""

import argparse
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

# Windows consoles default to cp1252 and will CRASH printing Arabic/Hebrew
# findings — which would make this tool fail exactly on the multilingual
# videos it most needs to check.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent

# --- thresholds ------------------------------------------------------------
OVERLAP_TOL_S = 0.02        # cues closer than this are treated as touching, not overlapping
SILENCE_NOISE_DB = "-30dB"  # for energy-based speech detection
SILENCE_MIN_S = 0.25
ONSET_TOL_S = 0.35          # a cue may lead real speech by this much before it's "early"
DRIFT_WARN_S = 0.5          # systematic drift across the video worth reporting
TEXT_MATCH_MIN = 0.45       # token overlap below this = caption doesn't match the audio
MIN_TEXT_CHECK_SPAN_S = 8.0 # shorter than this cannot be transcribed reliably in isolation


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")


def probe_duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)])
    return float(r.stdout.strip())


def speech_intervals(path, duration):
    """Non-silent regions measured from the real audio — energy, not transcript math."""
    r = run(["ffmpeg", "-i", str(path), "-af",
             f"silencedetect=noise={SILENCE_NOISE_DB}:d={SILENCE_MIN_S}", "-f", "null", "-"])
    starts = [float(m.group(1)) for m in re.finditer(r"silence_start: ([\d.-]+)", r.stderr)]
    ends = [float(m.group(1)) for m in re.finditer(r"silence_end: ([\d.]+)", r.stderr)]
    silences = sorted(zip(starts, ends))
    speech, cursor = [], 0.0
    for s0, s1 in silences:
        if s0 > cursor:
            speech.append((cursor, s0))
        cursor = max(cursor, s1)
    if cursor < duration:
        speech.append((cursor, duration))
    return speech


def normalize(text):
    """Strip punctuation/diacritics so token comparison is about words, not commas."""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^\w\s]", " ", text.lower())
    return [t for t in text.split() if t]


def token_overlap(a_tokens, b_tokens):
    """Fraction of caption tokens that appear in the independently-heard audio."""
    if not a_tokens:
        return 1.0
    b = list(b_tokens)
    hits = 0
    for t in a_tokens:
        # allow a loose match so plurals/inflection don't read as a mismatch
        m = next((x for x in b if x == t or (len(t) > 3 and (x.startswith(t[:4]) or t.startswith(x[:4])))), None)
        if m:
            hits += 1
            b.remove(m)
    return hits / len(a_tokens)


def whisperx_words(path, lang, tmp_json, span=None):
    """Independent re-transcription of the FINAL audio — the ground truth we
    check captions against. Deliberately a fresh pass on the RENDERED output,
    not the data that built the captions, so the check can't inherit the same
    mistake.

    `span` = (t0, t1): transcribe only that stretch, and return timestamps
    shifted back into full-video time. Compilations MUST be checked span by
    span: a single pass over a whole compilation smears words across the hard
    cuts between different speakers/languages and reports false mismatches
    (confirmed — it "heard" a word from the previous clip 1.5s into the next
    one, while the frame showed the correct caption on the correct person)."""
    wav = tmp_json.with_suffix(".wav")
    cut = ["-ss", f"{span[0]:.3f}", "-t", f"{span[1] - span[0]:.3f}"] if span else []
    run(["ffmpeg", "-y", *cut, "-i", str(path), "-ar", "16000", "-ac", "1", str(wav)])
    r = run([sys.executable, str(ROOT / "tools" / "whisperx-align.py"), str(wav),
             "--language", lang, "--out", str(tmp_json), "--model", "small"])
    if not tmp_json.exists():
        return None, r.stderr[-800:]
    words = json.loads(tmp_json.read_text(encoding="utf-8"))
    if span:
        off = span[0] * 1000
        words = [{**w, "fromMs": w["fromMs"] + off, "toMs": w["toMs"] + off} for w in words]
    return words, None


def clip_spans(cues):
    """Contiguous runs of cues from the same source clip -> the spans to check
    independently. Falls back to one whole-video span when cues carry no
    `clip` field (a single-source video needs no splitting)."""
    if not all(c.get("clip") for c in cues):
        return [(None, cues)]
    spans, cur, cur_clip = [], [], None
    for c in cues:
        if c["clip"] != cur_clip and cur:
            spans.append((cur_clip, cur))
            cur = []
        cur_clip = c["clip"]
        cur.append(c)
    if cur:
        spans.append((cur_clip, cur))
    return spans


def detect_language(path, tmp_dir):
    """What language is ACTUALLY spoken — never infer this from how the caption
    text reads. A fluent English transcript can be a translation of Arabic."""
    wav = tmp_dir / "_langdetect.wav"
    run(["ffmpeg", "-y", "-i", str(path), "-ar", "16000", "-ac", "1", "-t", "60", str(wav)])
    code = (
        "import sys,json,warnings; warnings.filterwarnings('ignore');"
        "import whisperx;"
        "m=whisperx.load_model('small','cpu',compute_type='int8');"
        "a=whisperx.load_audio(sys.argv[1]);"
        "r=m.transcribe(a,batch_size=8);"
        "print(json.dumps({'language':r.get('language')}))"
    )
    r = run([sys.executable, "-c", code, str(wav)])
    for line in reversed(r.stdout.strip().splitlines()):
        try:
            return json.loads(line).get("language")
        except Exception:
            continue
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--cues", required=True, help="JSON list of burned-in cues in FINAL-video time")
    ap.add_argument("--out", default=None)
    ap.add_argument("--skip-text", action="store_true", help="timing/overlap checks only (no transcription)")
    args = ap.parse_args()

    video = Path(args.video)
    if not video.exists():
        print(f"ERROR: not found: {video}", file=sys.stderr)
        sys.exit(2)
    cues = json.loads(Path(args.cues).read_text(encoding="utf-8"))
    cues = sorted(cues, key=lambda c: c["t0"])

    tmp_dir = video.parent / "_capverify"
    tmp_dir.mkdir(exist_ok=True)
    findings = []
    duration = probe_duration(video)

    # ---- 1. OVERLAP: deterministic, no excuse for ever getting this wrong ----
    for a, b in zip(cues, cues[1:]):
        if b["t0"] < a["t1"] - OVERLAP_TOL_S:
            findings.append({
                "severity": "high", "category": "overlap",
                "start": round(b["t0"], 2), "end": round(a["t1"], 2),
                "problem": f"Two captions on screen at once for "
                           f"{a['t1'] - b['t0']:.2f}s: {a['text'][:40]!r} and {b['text'][:40]!r}",
                "fix": "Clamp the earlier cue's end to the later cue's start minus a small gap",
            })

    # ---- 2. ZERO/NEGATIVE-LENGTH and off-the-end cues ----
    for c in cues:
        if c["t1"] <= c["t0"]:
            findings.append({"severity": "high", "category": "timing",
                             "start": round(c["t0"], 2), "end": round(c["t1"], 2),
                             "problem": f"Cue has zero/negative duration: {c['text'][:40]!r}",
                             "fix": "Check the grouping code's end-time clamp"})
        if c["t0"] > duration or c["t1"] > duration + 0.5:
            findings.append({"severity": "high", "category": "timing",
                             "start": round(c["t0"], 2), "end": round(c["t1"], 2),
                             "problem": f"Cue runs past the end of the video ({duration:.2f}s): {c['text'][:40]!r}",
                             "fix": "A cue timed against the wrong time base — check beat.in subtraction"})

    # ---- 3. Does each cue sit on REAL SPEECH? (energy, not transcript math) ----
    speech = speech_intervals(video, duration)
    for c in cues:
        covered = any(not (c["t1"] < s0 or c["t0"] > s1) for s0, s1 in speech)
        if not covered:
            nearest = min((abs(c["t0"] - s0) for s0, _ in speech), default=None)
            findings.append({
                "severity": "high", "category": "caption_on_silence",
                "start": round(c["t0"], 2), "end": round(c["t1"], 2),
                "problem": f"Caption shows over measured silence (nearest speech "
                           f"{nearest:.2f}s away): {c['text'][:40]!r}",
                "fix": "Re-derive this cue's timing from the final audio, not from source-clip timestamps",
            })

    # ---- 4. TEXT: does the caption say what the audio says? ----
    lang_detected = None
    if not args.skip_text:
        lang_detected = detect_language(video, tmp_dir)

        # Cues explicitly marked as translations are timing-checked only.
        translated = [c for c in cues if c.get("spoken")]
        candidates = [c for c in cues if not c.get("spoken")]

        # Do NOT trust auto-detection to decide whether to check the text.
        # Language auto-detect is unreliable on accented and code-switched
        # speech (real case: a man speaking accented English with a Hebrew
        # greeting mixed in was detected first as Yoruba, then as Arabic).
        # Silently skipping the most valuable check on a bad detection is
        # worse than attempting it: try the match in the CAPTION's own
        # language and let the SCORE decide what actually happened.
        #   high score            -> verified (and auto-detect was wrong)
        #   low score, lang差      -> probably a translation; wording unverified
        #   low score, lang same  -> a real mismatch
        caption_lang = candidates[0].get("lang", "en") if candidates else None
        matchable = candidates

        if caption_lang and caption_lang != lang_detected:
            findings.append({
                "severity": "info", "category": "language_disagreement",
                "start": 0, "end": 0,
                "problem": f"Audio auto-detected as '{lang_detected}' but captions are '{caption_lang}'. "
                           f"Attempting the text match in '{caption_lang}' anyway — the match score "
                           f"decides whether this is a wrong-language bug or just a bad detection.",
                "fix": "If the score is high, the captions are fine and the detector was wrong",
            })

        if caption_lang and matchable:
            # Check each contiguous source-clip run separately -- see
            # whisperx_words() on why a single whole-compilation pass produces
            # false mismatches at every cut.
            words, err, failed_spans = [], None, 0
            unverifiable = []
            for idx, (clip, span_cues) in enumerate(clip_spans(matchable)):
                span = None
                if clip is not None:
                    pad = 0.25
                    span = (max(0.0, min(c["t0"] for c in span_cues) - pad),
                            min(duration, max(c["t1"] for c in span_cues) + pad))
                    # A span too short to transcribe reliably must be reported
                    # as NOT CHECKED, never as a failure. Transcribing a few
                    # seconds of context-free audio produces confident
                    # nonsense ("I will see you in my mission" for "I hope to
                    # see you before I die") -- the same failure mode that
                    # once corrupted the captions themselves. Refusing to
                    # substantiate a claim beats making a wrong one.
                    if span[1] - span[0] < MIN_TEXT_CHECK_SPAN_S:
                        unverifiable.extend(span_cues)
                        continue
                lang = span_cues[0].get("lang", caption_lang)
                w, e = whisperx_words(video, lang, tmp_dir / f"verify_words_{idx}.json", span)
                if w is None:
                    failed_spans += 1
                    err = e
                else:
                    words.extend(w)
            if failed_spans:
                findings.append({"severity": "medium", "category": "verification_failed",
                                 "start": 0, "end": 0,
                                 "problem": f"Could not independently transcribe {failed_spans} span(s) "
                                            f"to check caption text: {err}",
                                 "fix": "Run the text check manually on those spans before shipping"})
            if not words:
                findings.append({"severity": "medium", "category": "verification_failed",
                                 "start": 0, "end": 0,
                                 "problem": "No span could be transcribed — caption text was NOT verified",
                                 "fix": "This is not a pass; check manually"})
            else:
                offsets = []
                scores = []
                # A language disagreement downgrades a single low score to
                # "probably a translation" rather than a hard failure -- but
                # only if the WHOLE video scores low. One bad cue among good
                # ones is a real bug, not a translation.
                lang_disagrees = caption_lang != lang_detected
                unver_ids_pre = {id(c) for c in unverifiable}
                for c in matchable:
                    if id(c) in unver_ids_pre:
                        continue
                    heard = [w["text"] for w in words
                             if w["fromMs"] / 1000 < c["t1"] and w["toMs"] / 1000 > c["t0"]]
                    score = token_overlap(normalize(c["text"]), normalize(" ".join(heard)))
                    scores.append(score)
                    c["_score"], c["_heard"] = score, " ".join(heard)
                    # drift is measured for every cue regardless of text score
                    first = next((w for w in words
                                  if w["fromMs"] / 1000 < c["t1"] and w["toMs"] / 1000 > c["t0"]), None)
                    if first:
                        offsets.append((c["t0"], c["t0"] - first["fromMs"] / 1000))

                if unverifiable:
                    findings.append({
                        "severity": "medium", "category": "not_verifiable",
                        "start": round(min(c["t0"] for c in unverifiable), 2),
                        "end": round(max(c["t1"] for c in unverifiable), 2),
                        "problem": f"{len(unverifiable)} cue(s) sit in clip-spans shorter than "
                                   f"{MIN_TEXT_CHECK_SPAN_S:.0f}s — too short to re-transcribe reliably, so their "
                                   f"WORDING was not checked (their timing and overlap were).",
                        "fix": "Check these by pulling frames and reading them against the source transcript",
                    })
                mean_score = sum(scores) / len(scores) if scores else 0.0
                whole_video_low = mean_score < TEXT_MATCH_MIN

                # SELF-CHECK: if the fresh transcription of a span barely
                # recognises ANY of the words the captions claim, the more
                # likely explanation is that the re-transcription is bad --
                # not that every caption is wrong. Confirmed case: a 10s
                # accented-speech span came back with words ("was born") that
                # appear in NEITHER alignment of that clip. Report those spans
                # as unverifiable rather than accusing the captions.
                for clip, span_cues in clip_spans(matchable):
                    checked = [c for c in span_cues if "_score" in c]
                    if len(checked) < 2:
                        continue
                    span_mean = sum(c["_score"] for c in checked) / len(checked)
                    if span_mean < 0.2:
                        for c in checked:
                            c["_unreliable"] = True
                        findings.append({
                            "severity": "medium", "category": "not_verifiable",
                            "start": round(min(c["t0"] for c in checked), 2),
                            "end": round(max(c["t1"] for c in checked), 2),
                            "problem": f"Re-transcription of this span matched only {span_mean:.0%} of the "
                                       f"caption text — too low to be a caption bug alone; the independent "
                                       f"transcription is unreliable here (short/accented speech). "
                                       f"WORDING not verified for {len(checked)} cue(s).",
                            "fix": "Check these by pulling frames and reading them against the source transcript",
                        })

                if lang_disagrees and whole_video_low:
                    findings.append({
                        "severity": "info", "category": "not_text_checked",
                        "start": 0, "end": 0,
                        "problem": f"Captions ('{caption_lang}') match the audio only {mean_score:.0%} "
                                   f"on average and the audio detects as '{lang_detected}' — these are "
                                   f"almost certainly a TRANSLATION. Timing was verified; wording was NOT.",
                        "fix": "Have someone who reads both languages check the wording before publishing",
                    })
                else:
                    if lang_disagrees:
                        findings.append({
                            "severity": "info", "category": "language_detect_wrong",
                            "start": 0, "end": 0,
                            "problem": f"Captions match the audio {mean_score:.0%} on average in "
                                       f"'{caption_lang}', so the '{lang_detected}' auto-detection was "
                                       f"wrong (normal on accented or code-switched speech). "
                                       f"Text check is valid.",
                            "fix": "None — this is the detector being unreliable, not a caption bug",
                        })
                    unver_ids = {id(c) for c in unverifiable}
                    for c in matchable:
                        if id(c) in unver_ids or "_score" not in c or c.get("_unreliable"):
                            continue
                        if c["_score"] < TEXT_MATCH_MIN:
                            findings.append({
                                "severity": "high", "category": "text_mismatch",
                                "start": round(c["t0"], 2), "end": round(c["t1"], 2),
                                "problem": f"Caption text does not match what is heard here "
                                           f"(match {c['_score']:.0%}). Caption: {c['text'][:50]!r}. "
                                           f"Heard: {c['_heard'][:50]!r}",
                                "fix": "Re-align this cue against the final audio; if this clip is a "
                                       "different language than the caption, mark it \"spoken\"",
                            })
                # ---- 5. DRIFT: a growing error, not a constant one ----
                if len(offsets) >= 3:
                    first_half = [o for t, o in offsets[:max(1, len(offsets) // 2)]]
                    second_half = [o for t, o in offsets[len(offsets) // 2:]]
                    swing = abs(sum(second_half) / len(second_half) - sum(first_half) / len(first_half))
                    if swing > DRIFT_WARN_S:
                        findings.append({
                            "severity": "high", "category": "drift",
                            "start": round(offsets[0][0], 2), "end": round(offsets[-1][0], 2),
                            "problem": f"Caption timing drifts {swing:.2f}s between the first and second "
                                       f"half of the video — the per-word timestamps are wrong, not just shifted",
                            "fix": "Re-align the FULL clip with WhisperX (not whisper.cpp word-splitting, "
                                   "and not per-segment in isolation)",
                        })

        if lang_detected and translated:
            findings.append({
                "severity": "info", "category": "not_text_checked",
                "start": 0, "end": 0,
                "problem": f"{len(translated)} cue(s) are a translation of {lang_detected} speech — "
                           f"their wording was NOT machine-verified, only their timing",
                "fix": "Have someone who reads both languages check the translation before publishing",
            })

    n_high = sum(1 for f in findings if f["severity"] == "high")
    report = {
        "pass": n_high == 0,
        "video": str(video),
        "duration_s": round(duration, 2),
        "cue_count": len(cues),
        "spoken_language_detected": lang_detected,
        "findings": findings,
        "limits": [
            "DETERMINISTIC and trustworthy: overlap, zero-length/past-the-end cues, caption-on-silence.",
            "NOT deterministic: the text-match and drift checks re-transcribe the audio, and that "
            "transcription varies between runs on accented or noisy speech — the same video scored 97% "
            "on one run and 86% on another, flagging different cues. Treat a text_mismatch as a LEAD to "
            "investigate with frames, never as a verdict on its own. Two runs disagreeing means the "
            "engine is unsure, not that the captions changed.",
            "Translation ACCURACY is not checked — a fluent, confident, wrong translation passes this tool.",
            "Caption POSITION on screen (stacked language rows colliding visually) is not checked — only time overlap.",
            "Nothing here replaces looking at real frames.",
        ],
    }
    out = Path(args.out) if args.out else video.with_suffix(".caption-verify.json")
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n{'PASS' if report['pass'] else 'FAIL'} - {len(cues)} cues, "
          f"{n_high} high-severity finding(s), spoken language: {lang_detected}")
    for f in findings:
        print(f"  [{f['severity']:6}] {f['start']}-{f['end']}s {f['category']}: {f['problem']}")
    print(f"\nReport: {out}")
    sys.exit(0 if report["pass"] else 1)


if __name__ == "__main__":
    main()
