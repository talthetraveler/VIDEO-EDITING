#!/usr/bin/env python3
"""
review-video.py — send a FINAL rendered MP4 (video + audio, not stills) to
Gemini's video-understanding API and get back a structured, timestamped,
critical QC report.

PARKED (Tal, 2026-09-11, same session, minutes after requesting this: "no
need for gemini, forget tht"). NOT part of the required QA loop — that's now
tools/qa-check.py (local, no API) + tools/whisperx-align.py + a Browser-pane
playback pass. Left in place, working, in case Gemini review is wanted again
later — don't delete working code per CLAUDE.md's source-integrity rule, but
don't treat this as required either. See
.claude/skills/video-editor/references/video-qa-pipeline.md for what's
actually mandatory now.

This was PART 1 of the originally-specified workflow:
  1. render final MP4
  2. automated technical checks
  3. WhisperX timing validation (tools/whisperx-align.py)
  4. THIS SCRIPT — send the actual MP4 to Gemini
  5. fix real issues it finds
  6. render again
  7. run this again until it passes

Usage:
    python tools/review-video.py <final.mp4> [--out report.json] [--model MODEL]

Config / auth (checked in this order):
    --api-key flag
    GEMINI_API_KEY env var
    projects/_review/gemini.config.json  { "api_key": "...", "model": "..." }

Exit code: 0 if the report says pass=true, 1 if pass=false or on error —
so this composes into a shell loop (`&& echo done || echo fix-and-retry`).

Model: pass --model to override. Gemini's model lineup moves fast; if the
default below 404s, run `client.models.list()` (see --list-models) and pick
a current model that supports video input. Don't assume the default here is
still current — this file was written 2026-09.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "projects" / "_review" / "gemini.config.json"
DEFAULT_MODEL = "gemini-2.5-pro"

SYSTEM_PROMPT = """You are a professional short-form social-video QC reviewer.
Review the actual audiovisual video, not just its transcript. Pay particular
attention to relationships between what is heard and what is visible.
Return timestamped problems. Do not praise the edit unless relevant.
Be extremely critical.

For this video, check specifically for:
- caption/speech synchronization
- captions appearing early
- captions appearing late
- captions remaining after speech stops
- captions changing on the wrong spoken word
- missing words
- incorrect transcription
- visible caption overlaps
- framing/crop mistakes
- sideways frames
- black frames
- frozen frames
- bad cuts
- accidental repeated shots
- awkward pauses
- reaction timing
- whether visual changes match what is being said
- dialogue intelligibility
- excessive denoising
- robotic / underwater / metallic voices
- clipped audio
- pumping artifacts
- sudden volume changes
- music overpowering dialogue
- abrupt audio edits
- unnatural silence
- overall pacing

Return ONLY JSON matching this exact shape, nothing else:
{
  "pass": false,
  "issues": [
    {
      "start": 12.4,
      "end": 13.8,
      "severity": "high",
      "category": "caption_sync",
      "problem": "Caption changes before the corresponding word is spoken",
      "suggested_fix": "Move the caption event approximately 300ms later"
    }
  ]
}

"pass" is true only if there are zero "high" severity issues. severity is
one of "high", "medium", "low". category is one of: caption_sync,
transcription, framing, cuts, pacing, audio_quality, audio_levels, other.
If the video is genuinely clean, return "issues": [] and "pass": true — but
be extremely critical first; do not default to a pass."""


def load_api_key(cli_key, cfg):
    if cli_key:
        return cli_key
    env_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if env_key:
        return env_key
    if cfg.get("api_key"):
        return cfg["api_key"]
    return None


def load_config():
    if CONFIG_PATH.exists():
        try:
            return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"WARNING: could not parse {CONFIG_PATH}: {e}", file=sys.stderr)
    return {}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", nargs="?", help="path to the FINAL rendered MP4 (with audio)")
    ap.add_argument("--out", default=None, help="where to write the JSON report (default: alongside the video)")
    ap.add_argument("--model", default=None, help=f"Gemini model id (default: {DEFAULT_MODEL})")
    ap.add_argument("--api-key", default=None, help="override the Gemini API key")
    ap.add_argument("--list-models", action="store_true", help="list available Gemini models and exit")
    ap.add_argument("--extra-context", default=None, help="optional extra notes to give the reviewer (e.g. intended language, subject names)")
    args = ap.parse_args()

    cfg = load_config()
    api_key = load_api_key(args.api_key, cfg)
    if not api_key:
        print(
            "ERROR: no Gemini API key found.\n"
            f"  Set GEMINI_API_KEY, or pass --api-key, or write it to {CONFIG_PATH}\n"
            '  e.g. {"api_key": "AIza...", "model": "gemini-2.5-pro"}',
            file=sys.stderr,
        )
        sys.exit(2)

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print("ERROR: google-genai not installed. Run: pip install --user google-genai", file=sys.stderr)
        sys.exit(2)

    client = genai.Client(api_key=api_key)

    if args.list_models:
        for m in client.models.list():
            print(m.name)
        return

    if not args.video:
        ap.error("video is required unless --list-models is given")

    video_path = Path(args.video)
    if not video_path.exists():
        print(f"ERROR: video not found: {video_path}", file=sys.stderr)
        sys.exit(2)

    model = args.model or cfg.get("model") or DEFAULT_MODEL

    print(f"Uploading {video_path.name} to Gemini Files API...")
    myfile = client.files.upload(file=str(video_path))

    # Wait for the file to finish processing before referencing it in a request.
    while myfile.state.name == "PROCESSING":
        print("  ...processing")
        time.sleep(3)
        myfile = client.files.get(name=myfile.name)

    if myfile.state.name != "ACTIVE":
        print(f"ERROR: Gemini file upload ended in state {myfile.state.name}", file=sys.stderr)
        sys.exit(1)

    prompt = SYSTEM_PROMPT
    if args.extra_context:
        prompt += f"\n\nAdditional context from the editor: {args.extra_context}"

    print(f"Requesting review from {model}...")
    response = client.models.generate_content(
        model=model,
        contents=[myfile, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.0,
        ),
    )

    raw = response.text
    try:
        report = json.loads(raw)
    except json.JSONDecodeError:
        print("ERROR: Gemini did not return valid JSON. Raw response:", file=sys.stderr)
        print(raw, file=sys.stderr)
        sys.exit(1)

    # Basic shape validation — fail loudly rather than silently trusting it.
    if "pass" not in report or "issues" not in report:
        print("ERROR: Gemini response is missing required keys (pass/issues). Raw:", file=sys.stderr)
        print(json.dumps(report, indent=2), file=sys.stderr)
        sys.exit(1)

    report["_meta"] = {
        "video": str(video_path),
        "model": model,
        "reviewed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    out_path = Path(args.out) if args.out else video_path.with_suffix(".gemini-review.json")
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    n_high = sum(1 for i in report["issues"] if i.get("severity") == "high")
    n_med = sum(1 for i in report["issues"] if i.get("severity") == "medium")
    n_low = sum(1 for i in report["issues"] if i.get("severity") == "low")
    print(f"\n{'PASS' if report['pass'] else 'FAIL'} — {len(report['issues'])} issues "
          f"({n_high} high, {n_med} medium, {n_low} low)")
    for issue in report["issues"]:
        print(f"  [{issue.get('severity','?'):6}] {issue.get('start','?')}-{issue.get('end','?')}s "
              f"{issue.get('category','?')}: {issue.get('problem','')}")
        if issue.get("suggested_fix"):
            print(f"           fix: {issue['suggested_fix']}")
    print(f"\nFull report: {out_path}")

    sys.exit(0 if report["pass"] else 1)


if __name__ == "__main__":
    main()
