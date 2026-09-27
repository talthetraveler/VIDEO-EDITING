#!/usr/bin/env python3
"""
whisperx-align.py — forced word-level alignment against the FINAL EDITED
dialogue audio. This is the timing authority for captions (Tal, 2026-09-11:
"DO NOT MANUALLY ESTIMATE CAPTION TIMING... The FINAL EDITED AUDIO is the
timing authority").

Run this AFTER the dialogue edit is locked (trims/reorder/speed changes/
denoise all applied) — never on source clips, never on pre-edit timestamps.
Old source timestamps are invalid the moment anything is trimmed, reordered,
sped up, slowed down, silenced, split, denoised, or moved.

Usage:
    python tools/whisperx-align.py <final_dialogue.wav> --language en --out words.json
    python tools/whisperx-align.py <final_dialogue.wav> --language auto --out words.json

Output JSON (one entry per WORD, matching the required shape exactly):
    [
      {"text": "Call", "fromMs": 1240, "toMs": 1510},
      {"text": "someone", "fromMs": 1520, "toMs": 1910},
      ...
    ]

Languages: WhisperX word-alignment models cover en/he/ar (this project's
three) plus ~30 others (checked directly against the installed package,
2026-09-11: DEFAULT_ALIGN_MODELS_HF includes 'ar' and 'he';
DEFAULT_ALIGN_MODELS_TORCH covers 'en' natively). If a language switch
happens mid-clip, align each language's span SEPARATELY (--segments-json)
rather than forcing the whole file through one alignment model.

Device: defaults to CPU (compute_type=int8) — this machine has no CUDA GPU
verified. Pass --device cuda if one is actually available; check first
(`python -c "import torch;print(torch.cuda.is_available())"`), don't guess.
"""

import argparse
import json
import sys
from pathlib import Path


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio", help="final edited dialogue audio (wav preferred; anything ffmpeg reads works)")
    ap.add_argument("--language", default="auto", help="en / he / ar / auto (whisper language-detect)")
    ap.add_argument("--out", required=True, help="output word-timestamp JSON path")
    ap.add_argument("--model", default="medium", help="whisper model size for the initial transcribe pass")
    ap.add_argument("--device", default="cpu", choices=["cpu", "cuda"])
    ap.add_argument("--batch-size", type=int, default=8)
    ap.add_argument(
        "--segments-json",
        default=None,
        help="optional: JSON list of {start,end,language} to align each language span "
             "separately instead of one pass over the whole file (use when the clip "
             "switches languages mid-way and auto-detect keeps flipping)",
    )
    args = ap.parse_args()

    audio_path = Path(args.audio)
    if not audio_path.exists():
        print(f"ERROR: audio not found: {audio_path}", file=sys.stderr)
        sys.exit(2)

    try:
        import whisperx
    except ImportError:
        print("ERROR: whisperx not installed. pip install --user whisperx", file=sys.stderr)
        sys.exit(2)

    compute_type = "int8" if args.device == "cpu" else "float16"
    audio = whisperx.load_audio(str(audio_path))

    def align_one(audio_arr, language_hint, offset_ms=0):
        """Transcribe + align one contiguous stretch of audio in one language.
        Returns a list of {text, fromMs, toMs} with offset_ms added to every
        timestamp (used when this is a sub-segment of a longer file)."""
        asr_lang = None if language_hint == "auto" else language_hint
        asr_model = whisperx.load_model(args.model, args.device, compute_type=compute_type, language=asr_lang)
        result = asr_model.transcribe(audio_arr, batch_size=args.batch_size)
        detected_lang = result.get("language", asr_lang or "en")
        print(f"  transcribed as language={detected_lang}, {len(result['segments'])} segments")

        try:
            align_model, meta = whisperx.load_align_model(language_code=detected_lang, device=args.device)
        except Exception as e:
            print(
                f"WARNING: no WhisperX alignment model for language '{detected_lang}' ({e}). "
                f"Falling back is NOT automatic here — re-run with an explicit --language for a "
                f"supported code, or use the whisper.cpp word-timestamp path documented in "
                f".claude/skills/video-editor/references/ffmpeg-audio-caption-pipeline.md instead.",
                file=sys.stderr,
            )
            raise

        aligned = whisperx.align(result["segments"], align_model, meta, audio_arr, args.device, return_char_alignments=False)

        words = []
        for seg in aligned["segments"]:
            for w in seg.get("words", []):
                if "start" not in w or "end" not in w:
                    # whisperx sometimes can't align a word (e.g. background noise
                    # collapsed it) — skip rather than invent a timestamp.
                    print(f"    (skipping unaligned word: {w.get('word','?')!r})", file=sys.stderr)
                    continue
                words.append({
                    "text": w["word"].strip(),
                    "fromMs": round((w["start"]) * 1000) + offset_ms,
                    "toMs": round((w["end"]) * 1000) + offset_ms,
                })
        return words

    if args.segments_json:
        segs = json.loads(Path(args.segments_json).read_text(encoding="utf-8"))
        import numpy as np
        from whisperx.audio import SAMPLE_RATE
        all_words = []
        for seg in segs:
            s_samp = int(seg["start"] * SAMPLE_RATE)
            e_samp = int(seg["end"] * SAMPLE_RATE)
            chunk = audio[s_samp:e_samp]
            print(f"Aligning {seg['start']}s-{seg['end']}s as {seg.get('language','auto')}...")
            all_words.extend(align_one(chunk, seg.get("language", "auto"), offset_ms=round(seg["start"] * 1000)))
        words = all_words
    else:
        words = align_one(audio, args.language)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(words, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n{len(words)} words -> {out_path}")


if __name__ == "__main__":
    main()
