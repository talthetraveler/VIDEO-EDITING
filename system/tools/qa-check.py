#!/usr/bin/env python3
"""
qa-check.py — automated, local, no-API technical QA pass on a FINAL rendered
MP4. Built 2026-09-11 to replace the Gemini-review step of the mandatory
video-QA workflow after Tal said to drop the Gemini dependency ("no need
for gemini, forget that") and instead build the checks he named directly:

  - A/V sync verification measured from the actual final audio (VAD/energy,
    NOT trusting caption-timestamp math) diffed against where each caption
    fires — this is the check that would have caught the DeepFilterNet
    gating + drift bug before delivery instead of after.
  - Loudness/level objectivity treated as a hard stop, not just a number
    that gets measured and ignored.
  - Basic technical defects: black frames, frozen frames, clipping.

This does NOT replace watching the actual picture — it can't tell you if a
cut is awkward, if framing is wrong, or if a reaction lands. For that: step
through the render in the Browser pane (see "Denser visual review" in
.claude/skills/video-editor/references/video-qa-pipeline.md) and actually
look, per CLAUDE.md's existing honesty rule.

Usage:
    python tools/qa-check.py final.mp4 [--words words.json] [--out report.json]

--words is the word-timestamp JSON from tools/whisperx-align.py (the final-
edit timing authority). Without it, the caption-sync check is skipped and
the report says so explicitly rather than silently passing.

Exit code: 0 if pass, 1 if fail — same convention as review-video.py, so
both compose into the same "fix, re-render, re-check" shell loop.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

# Thresholds — tuned for vertical social dialogue delivery, not broadcast.
BLACK_MIN_S = 0.15          # a black stretch shorter than this is probably just a hard cut, ignore
FREEZE_MIN_S = 0.5          # frozen-frame stretch to flag
SILENCE_NOISE_DB = "-30dB"  # anything quieter than this counts as "silence" for onset detection
SILENCE_MIN_S = 0.25
CAPTION_EARLY_MS = 250      # caption fires this much before the nearest measured speech onset -> flag
CAPTION_IN_SILENCE_MS = 400 # caption word start sits this deep inside a silence gap -> flag (drift)
LOUDNESS_TARGET_LUFS = -14.0   # common short-form platform target (Instagram/TikTok/YouTube Shorts ballpark)
LOUDNESS_TOLERANCE_LU = 4.0    # flag if integrated loudness is off-target by more than this
TRUE_PEAK_WARN_DBTP = -1.0     # above this: tight but not clipping -> medium flag
TRUE_PEAK_HARD_FAIL_DBTP = 0.0 # above this: real digital clipping -> high, hard stop


def run_ffmpeg_filter(video_path, filter_str):
    """Run ffmpeg with a single filter, return stderr (where ffmpeg prints
    filter analysis lines) as text."""
    cmd = ["ffmpeg", "-i", str(video_path), "-vf" if "black" in filter_str or "freeze" in filter_str else "-af",
           filter_str, "-f", "null", "-"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.stderr


def parse_blackdetect(stderr):
    issues = []
    for m in re.finditer(r"black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)", stderr):
        start, end, dur = float(m.group(1)), float(m.group(2)), float(m.group(3))
        if dur >= BLACK_MIN_S:
            issues.append({
                "start": start, "end": end, "severity": "high", "category": "framing",
                "problem": f"Black frame(s) for {dur:.2f}s",
                "suggested_fix": "Check the source/render at this timestamp - likely a bad cut point or a failed clip render",
            })
    return issues


def parse_freezedetect(stderr):
    issues = []
    starts = [float(m.group(1)) for m in re.finditer(r"freeze_start: ([\d.]+)", stderr)]
    ends = [float(m.group(1)) for m in re.finditer(r"freeze_end: ([\d.]+)", stderr)]
    durs = [float(m.group(1)) for m in re.finditer(r"freeze_duration: ([\d.]+)", stderr)]
    for i, start in enumerate(starts):
        end = ends[i] if i < len(ends) else start + (durs[i] if i < len(durs) else FREEZE_MIN_S)
        dur = durs[i] if i < len(durs) else (end - start)
        if dur >= FREEZE_MIN_S:
            issues.append({
                "start": start, "end": end, "severity": "medium", "category": "cuts",
                "problem": f"Frozen frame for {dur:.2f}s",
                "suggested_fix": "Confirm this isn't an intentional hold; if not, re-check the render at this cut",
            })
    return issues


def parse_silencedetect(stderr):
    """Returns list of (silence_start, silence_end)."""
    starts = [float(m.group(1)) for m in re.finditer(r"silence_start: ([\d.-]+)", stderr)]
    ends = [float(m.group(1)) for m in re.finditer(r"silence_end: ([\d.]+)", stderr)]
    return list(zip(starts, ends))


def speech_intervals_from_silences(silences, total_duration):
    """Invert silence intervals into speech (non-silent) intervals."""
    speech = []
    cursor = 0.0
    for s_start, s_end in sorted(silences):
        if s_start > cursor:
            speech.append((cursor, s_start))
        cursor = max(cursor, s_end)
    if cursor < total_duration:
        speech.append((cursor, total_duration))
    return speech


def get_duration(video_path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video_path)],
        capture_output=True, text=True,
    )
    return float(out.stdout.strip())


def check_caption_sync(words, speech_intervals):
    issues = []
    if not words:
        return issues
    for w in words:
        t = w["fromMs"] / 1000.0
        # is t inside (or within tolerance before) a speech interval?
        nearest_gap = None
        inside = False
        for s, e in speech_intervals:
            if s <= t <= e:
                inside = True
                break
            if t < s:
                gap = s - t
                if nearest_gap is None or gap < nearest_gap:
                    nearest_gap = gap
        if inside:
            continue
        if nearest_gap is not None and nearest_gap * 1000 > CAPTION_EARLY_MS:
            issues.append({
                "start": round(t, 2), "end": round(t + (w["toMs"] - w["fromMs"]) / 1000.0, 2),
                "severity": "high", "category": "caption_sync",
                "problem": f"Caption word {w['text']!r} fires {nearest_gap*1000:.0f}ms before the nearest "
                           f"measured speech onset (energy-based, not transcript math)",
                "suggested_fix": "Shift this caption event later to match the measured onset, or re-run "
                                  "whisperx-align.py against the actual final audio if this is systematic",
            })
        elif nearest_gap is None:
            # word is after the last detected speech interval entirely
            issues.append({
                "start": round(t, 2), "end": round(t, 2),
                "severity": "medium", "category": "caption_sync",
                "problem": f"Caption word {w['text']!r} has no matching speech interval anywhere after it "
                           f"in the measured audio",
                "suggested_fix": "Check whether this word's timestamp is stale (from before a later edit)",
            })
    return issues


def check_loudness(video_path):
    issues = []
    cmd = ["ffmpeg", "-i", str(video_path), "-af",
           "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", proc.stderr, re.DOTALL)
    if not m:
        issues.append({
            "start": 0, "end": 0, "severity": "medium", "category": "audio_levels",
            "problem": "Could not measure loudness (loudnorm produced no parseable output)",
            "suggested_fix": "Check the file has an audio track and ffmpeg can decode it",
        })
        return issues
    try:
        stats = json.loads(m.group(0))
    except json.JSONDecodeError:
        return issues
    integrated = float(stats.get("input_i", "0"))
    true_peak = float(stats.get("input_tp", "0"))
    if abs(integrated - LOUDNESS_TARGET_LUFS) > LOUDNESS_TOLERANCE_LU:
        issues.append({
            "start": 0, "end": 0, "severity": "high", "category": "audio_levels",
            "problem": f"Integrated loudness {integrated:.1f} LUFS is more than {LOUDNESS_TOLERANCE_LU} LU "
                       f"off the {LOUDNESS_TARGET_LUFS} LUFS target",
            "suggested_fix": "Apply loudnorm or adjust dialogue/music gain before final delivery",
        })
    if true_peak > TRUE_PEAK_HARD_FAIL_DBTP:
        issues.append({
            "start": 0, "end": 0, "severity": "high", "category": "audio_levels",
            "problem": f"True peak {true_peak:.1f} dBTP - actual digital clipping",
            "suggested_fix": "Pull down the gain; re-render",
        })
    elif true_peak > TRUE_PEAK_WARN_DBTP:
        issues.append({
            "start": 0, "end": 0, "severity": "medium", "category": "audio_levels",
            "problem": f"True peak {true_peak:.1f} dBTP - tighter than the usual -1 dBTP safety margin",
            "suggested_fix": "Not clipping, but leave more headroom if this master gets re-encoded downstream",
        })
    return issues


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--words", default=None, help="word-timestamp JSON from whisperx-align.py")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    video_path = Path(args.video)
    if not video_path.exists():
        print(f"ERROR: not found: {video_path}", file=sys.stderr)
        sys.exit(2)

    print("Probing duration...")
    duration = get_duration(video_path)

    print("Checking for black frames...")
    black_issues = parse_blackdetect(run_ffmpeg_filter(video_path, f"blackdetect=d={BLACK_MIN_S}:pic_th=0.98"))

    print("Checking for frozen frames...")
    freeze_issues = parse_freezedetect(run_ffmpeg_filter(video_path, f"freezedetect=n=-60dB:d={FREEZE_MIN_S}"))

    print("Measuring loudness...")
    loud_issues = check_loudness(video_path)

    print("Detecting speech onsets from actual audio energy (not transcript math)...")
    sil_stderr = run_ffmpeg_filter(video_path, f"silencedetect=noise={SILENCE_NOISE_DB}:d={SILENCE_MIN_S}")
    silences = parse_silencedetect(sil_stderr)
    speech_intervals = speech_intervals_from_silences(silences, duration)

    caption_issues = []
    if args.words:
        words_path = Path(args.words)
        if words_path.exists():
            words = json.loads(words_path.read_text(encoding="utf-8"))
            print(f"Cross-checking {len(words)} caption words against {len(speech_intervals)} measured speech intervals...")
            caption_issues = check_caption_sync(words, speech_intervals)
        else:
            print(f"WARNING: --words path not found: {words_path}", file=sys.stderr)
    else:
        print("No --words given - SKIPPING caption/speech sync check (not run, not passed).")

    all_issues = black_issues + freeze_issues + loud_issues + caption_issues
    n_high = sum(1 for i in all_issues if i["severity"] == "high")
    report = {
        "pass": n_high == 0,
        "issues": all_issues,
        "_meta": {
            "video": str(video_path),
            "duration_s": duration,
            "caption_sync_checked": bool(args.words),
            "checks_run": ["black_frames", "frozen_frames", "loudness", "caption_sync" if args.words else None],
        },
    }

    out_path = Path(args.out) if args.out else video_path.with_suffix(".qa-report.json")
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"\n{'PASS' if report['pass'] else 'FAIL'} - {len(all_issues)} issues ({n_high} high)")
    for issue in all_issues:
        print(f"  [{issue['severity']:6}] {issue['start']}-{issue['end']}s {issue['category']}: {issue['problem']}")
    print(f"\nFull report: {out_path}")
    sys.exit(0 if report["pass"] else 1)


if __name__ == "__main__":
    main()
