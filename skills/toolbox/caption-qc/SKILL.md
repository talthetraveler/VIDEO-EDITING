---
name: caption-qc
description: Verify that a video's captions actually match what the people in it are saying, and that captions never overlap. Use before delivering or posting ANY video with captions, when captions look or feel off-sync, when captions show the wrong line, when two captions appear at once, when building or changing a caption pipeline, or when choosing which alignment engine to trust. Covers the verifier tool, the full catalogue of caption failures this project has actually shipped, and which checks are evidence vs. which are only leads.
---

# Caption QC

Captions have gone wrong here in six distinct ways, each of which shipped or
nearly shipped. This skill is how you stop repeating them.

**Default position: captions are NOT verified until a check produces a
number.** "It looks right" is not evidence. Neither is "the pipeline ran."

## The instrument

```bash
python tools/verify-captions.py FINAL.mp4 --cues <ID>.cues.json --out report.json
```

The cue list must be **emitted by the build** (`build.mjs` writes
`<ID>.cues.json` in final-video time). Never hand-type one — a verifier fed
hand-math only verifies the hand-math. If a build has no sidecar, add one
before verifying. `projects/call-someone-you-love/export-cues.mjs` shows the
pattern for regenerating sidecars for already-rendered videos (validate any
such exporter byte-for-byte against a build-emitted control before trusting it).

The `caption-qc` **agent** (`.claude/agents/caption-qc.md`) is the operator
for this tool and carries the same failure catalogue in checklist form.

## Which results are verdicts, and which are only leads

This distinction is the most important thing in this skill.

**Deterministic — treat as verdicts:**

| Check | Why it's trustworthy |
|---|---|
| **Overlap** (two cues on screen at once) | pure arithmetic on the cue list |
| **Zero-length / past-the-end cues** | pure arithmetic; signature of a wrong time base |
| **Caption over silence** | energy-based VAD on the real audio, not transcript math |

**Non-deterministic — treat as leads only:**
`text_mismatch` and `drift` re-transcribe the audio, and that transcription
varies run to run on accented or noisy speech. Measured on the same video,
same cues: **97% on one run, 86% on the next**, flagging different cues.
A text mismatch means *go look at that timestamp* — never *the caption is
wrong.*

**Resolving a text_mismatch honestly:**
1. Pull the frame; read the caption actually on screen.
2. Compare against the clip's own alignment (`fullclip_<CLIP>.words.json`).
3. If the "heard" text contains words that appear in **neither** the captions
   nor the clip's alignment, the re-transcription is the unreliable party.
   (Real case: a 10s accented span came back with "was born" — nobody in the
   video ever says that.)
4. Call it a caption bug only when the frame and the clip's own alignment
   disagree with each other.

## The catalogue — six real failures, with signatures

| Signature | Cause | Fix |
|---|---|---|
| Offset **grows** through a long take | whisper.cpp `-ml 1 -sow` word-splitting is unreliable across pauses | Re-align the full clip with `tools/whisperx-align.py` |
| Captions are **meaningless words** | a short cropped segment was aligned with no surrounding context | Align the **whole source clip** once, cache it, window per beat |
| Captions are **phonetic gibberish** | `--language en` forced onto audio that isn't English | Read the model's own detected language; never infer it from how a transcript *reads* |
| Caption is fluent but **means the wrong thing** | machine translation looped or mistranslated an idiom | No tool catches this. A human who reads both languages must check |
| **Two captions on screen at once** | the minimum-display floor was applied *after* the clamps, pushing a cue past its beat's end onto the next beat's first cue | Floor first, **then** clamp: `t1 = min(max(t1, t0+0.15), outT, next.t0-0.02)` |
| Caption shows the **wrong line entirely** | beat windows chosen with one aligner, captions generated with another (they disagreed by ~5s) | **Beat boundaries and caption timings must come from the SAME alignment** |

## Hard rules

1. **"Reads like clean English" is not evidence the audio is English.** A
   fluent English transcript is often a *translation*. Two clips were mis-typed
   this way and produced garbage captions.
2. **Beat windows and caption timings come from the same alignment.** Mixing
   engines captions the wrong line on every sub-window beat. (A beat using a
   *whole* clip is immune — which is why one video looked fine while its
   siblings were broken.)
3. **Never verify with the engine that generated the captions.** That is
   self-agreement, not verification. Use a fresh pass on the rendered output,
   and prefer an isolated span over a whole compilation.
4. **A verifier must never report a failure it cannot substantiate.** Spans
   too short (<8s) to re-transcribe reliably are reported *unverified*, not
   *failed*.
5. **Translated captions are never "verified".** The honest status is
   **"timing verified, wording unverified."** Say it that way.

## Two false-positive modes (in the checker itself)

Both are tempting designs; both were wrong:

- **One pass over a whole compilation** smears words across hard cuts and
  invents mismatches — it "heard" a word from the previous clip 1.5s into the
  next one while the frame showed the correct caption. Check each contiguous
  source-clip span separately.
- **But a span under ~8s can't be transcribed reliably in isolation** — the
  same context-free-fragment failure that once corrupted the captions
  themselves. Report those as not-verified.

## What this does not cover

- **Translation accuracy** — a fluent, confident, wrong translation passes.
- **Visual collision** — the tool checks overlap in *time*, not whether
  stacked language rows collide on screen. For multi-language stacked
  layouts, pull frames at the **longest** cue; line count is what collides.
- Nothing here replaces looking at real frames.

## Reporting

State separately: what was **measured** (with numbers), what was **looked at**
(which timestamps), and what was **not verified**. Never collapse these into
"captions are correct."
