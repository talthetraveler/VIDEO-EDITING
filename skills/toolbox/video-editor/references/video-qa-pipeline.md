# Video QA pipeline — mandatory before calling any render final

Built 2026-09-11 after Tal gave a detailed mandatory-QA spec, then cancelled
its Gemini-API piece minutes later ("no need for gemini, forget tht") and
redirected to three local checks instead. This is the workflow that actually
shipped. `tools/review-video.py` (Gemini) exists and works but is **parked,
not required** — see its own docstring.

## Why this exists

"It rendered" and "the transcript is correct" are not proof a video is
right — CLAUDE.md already says this (§1 Honesty, §3 Review). This pipeline
makes that concrete and checkable instead of a vibe:

1. **Caption timing must come from the FINAL EDITED AUDIO, not estimated.**
   `tools/whisperx-align.py` — WhisperX forced alignment against the actual
   final dialogue track (post-trim/reorder/denoise), word-level
   `{text, fromMs, toMs}`. Never derive caption timing from clip boundaries,
   sentence boundaries, script lines, or source-file timestamps — anything
   trimmed/reordered/sped/slowed/denoised/split/moved invalidates old
   timestamps. Re-run alignment on the locked final edit.
2. **A/V sync must be verified independently, not just trusted.** This is
   the check that would have caught the DeepFilterNet `-a 25` gating +
   drift bug (see [ffmpeg-audio-caption-pipeline.md](ffmpeg-audio-caption-pipeline.md)
   §2) before Tal had to report it, not after. `tools/qa-check.py` measures
   actual speech onsets from the rendered audio's energy (`ffmpeg
   silencedetect`, NOT transcript math) and diffs every caption word's
   start against the nearest measured onset.
3. **Loudness is a hard stop, not a number that gets measured and
   ignored.** `tools/qa-check.py` runs `loudnorm` single-pass measurement
   and fails on out-of-target integrated loudness or actual true-peak
   clipping.
4. **The picture still has to be looked at.** No local tool catches "this
   cut is awkward" or "the reaction doesn't land." Use the Browser pane —
   see below — not just extracted stills.

## The loop

```bash
# 1. Render final MP4 as usual (proj-render / npx remotion render)

# 2. Get word-exact timestamps from the FINAL edited dialogue audio
ffmpeg -y -i output/final.mp4 -ar 16000 -ac 1 scratch/final-audio.wav
python tools/whisperx-align.py scratch/final-audio.wav --language en \
    --out scratch/final-words.json
# multilingual clip (en/he/ar mixed)? Use --language auto, or if the auto
# language-detect flips mid-clip, split into per-language spans with
# --segments-json (see the script's own docstring).

# 3. Run the local technical QA pass
python tools/qa-check.py output/final.mp4 --words scratch/final-words.json
# exit 0 = pass, exit 1 = fail — same convention on both tools, so this
# composes into a shell `&&`/`||` loop.

# 4. For anything qa-check.py flags (or just before calling it done):
#    actually look at the picture at that timestamp — see "Browser pane
#    playback review" below.

# 5. Fix real problems, re-render, go back to step 2.
```

A video is not done because `qa-check.py` passed. It's done when
`qa-check.py` passes **and** you've actually looked at the flagged
timestamps (and a general pass over the cut) in the Browser pane.

## `tools/whisperx-align.py` — the caption-timing authority

- Run it on the **exact final edited dialogue audio**, extracted from the
  locked render, not on any pre-edit source.
- WhisperX word-alignment model coverage confirmed directly against the
  installed package (2026-09-11, whisperx 3.8.6): `en` (torch,
  `DEFAULT_ALIGN_MODELS_TORCH`), `he` and `ar` both present in
  `DEFAULT_ALIGN_MODELS_HF` — all three of Tal's languages are covered, no
  fallback needed for the common case.
- Tested end-to-end against a real final render
  (`projects/c01-salam-a/preview/c01-salam-a_FINAL.mp4`, 42.6s) — produced
  37 real word timestamps matching the actual audio, including one
  legitimately long gap (a real pause in the edit, not a bug) — this is
  exactly the kind of thing to sanity-check per the existing "clamp a
  word's on-screen life" rule in `ffmpeg-audio-caption-pipeline.md`.
- Output feeds `qa-check.py --words` directly and is the format Remotion
  caption tokens should ultimately trace back to (grouping/styling may
  combine words into pages, but must not re-time them — see
  `04-captions-and-typography`).
- If a clip switches languages mid-way, align each language's span
  **separately** via `--segments-json` rather than forcing the whole file
  through one alignment model — language auto-detect flipping mid-clip is
  unreliable (same lesson as whisper.cpp's `-l auto` behavior documented in
  `ffmpeg-audio-caption-pipeline.md` §3).

## `tools/verify-captions.py` — captions match the speech, and never overlap

Added 2026-09-15 after captions went wrong four distinct ways in one session.
This is the instrument; the `caption-qc` agent (`.claude/agents/caption-qc.md`)
is the operator, and carries the full failure catalogue with signatures.

```bash
python tools/verify-captions.py FINAL.mp4 --cues <ID>.cues.json
```

Feed it the **build-emitted** cue sidecar (`build.mjs` writes
`<ID>.cues.json` in final-video time), never a hand-typed reconstruction — a
verifier fed hand-math is only as good as the hand-math. Checks:

- **Overlap** — two cues on screen at once (pure arithmetic, must never fail).
- **Zero-length / past-the-end cues** — signature of a wrong time base.
- **Caption-on-silence** — cue window doesn't overlap measured speech.
- **Text mismatch** — caption words vs. an *independent* re-transcription of
  that exact span (deliberately a different pass than the one that built the
  captions, so the check can't inherit the same mistake).
- **Drift** — offset *growing* across the video. A constant offset is a sync
  bug; a growing one means the per-word timestamps are themselves wrong.
- **Spoken-language detection** — catches the "clean-reading English transcript
  was actually a translation of Arabic" trap that produced garbage captions.

**What it cannot do**: judge translation *accuracy*. A fluent, confident,
wrong translation passes. Cues whose caption language differs from the spoken
language are marked `"spoken": "<lang>"`, timing-checked only, and reported as
wording-unverified. Say that plainly rather than "captions verified".

It also doesn't check whether stacked caption rows collide *visually* — for
any multi-language stacked layout, pull frames at the longest cue and look.

## `tools/qa-check.py` — local technical QA, no API key needed

Runs against the actual system ffmpeg (`blackdetect`, `freezedetect`,
`silencedetect`, `loudnorm` — all confirmed present, 2026-09-11). Checks:

- **Black frames** (>0.15s) — high severity.
- **Frozen frames** (>0.5s) — medium (could be an intentional hold; check).
- **Loudness** — integrated LUFS target -14 ±4 LU; true peak >0 dBTP is a
  hard fail (actual clipping), >-1 dBTP is a medium flag (tight headroom).
- **Caption/speech sync** (only if `--words` given) — every caption word's
  `fromMs` must land inside a measured speech interval, or within 250ms
  before one. A word with no nearby speech interval at all is flagged
  medium (likely a stale timestamp from before a later edit).

Validated against real data, not just written:
- A genuine final render passed clean except one legitimate medium-severity
  true-peak note (-0.4 dBTP).
- A synthetic black+frozen clip correctly failed with the black-frame and
  frozen-frame issues it should produce, proving the detectors actually
  fire and this isn't a tool that just always reports "pass."

Thresholds live at the top of the file as named constants — tune them
there, they're deliberately not hardcoded inline.

## Browser-pane playback review — replaces "extract a few stills and hope"

The Browser pane (`mcp__Claude_Browser__*`) can open a **local** final MP4
directly (`file:///` URL) and it's a real `<video>` element — confirmed:
`duration` matched `ffprobe` exactly, seeking via
`document.querySelector('video').currentTime = X` works, and a screenshot
after seeking shows the actual rendered frame (tested at t=0 and t=20s on a
real final render — both showed real picture content: the title card +
subject on entry, a different subject and caption 20s in).

Use this instead of (or in addition to) `npx remotion still` /
ffmpeg-extracted stills when:
- Spot-checking a timestamp `qa-check.py` flagged.
- Doing a general "does this cut/reaction/framing actually work" pass —
  seek every 3-5s through the render and look, the same discipline as
  reading extracted stills, just faster to navigate and interactive.

```js
// in the Browser pane, after navigating to file:///<absolute path to the mp4>
const v = document.querySelector('video');
v.pause();
v.currentTime = 20.0;
await new Promise(r => v.onseeked = r);
// then take a screenshot
```

This is still "inspected actual frames," reportable honestly per CLAUDE.md
§1 — it is not the same as claiming to have watched continuous playback
with sound. Say which you did.

## What this still doesn't catch

No tool here judges whether a cut is *awkward*, whether a reaction *lands*,
or whether the footage genuinely illustrates the line being spoken — that's
still a human-judgment pass over the Browser-pane frames plus the transcript,
same as the existing review-gated workflow. `qa-check.py` catches technical
defects; it is not a substitute for actually looking.

## Related

- `ffmpeg-audio-caption-pipeline.md` — the denoise/caption/color techniques
  this QA loop is designed to catch regressions in.
- `04-captions-and-typography` — grouping rules for turning word-level
  timestamps into caption pages without re-timing them.
- `.claude/skills/content-engine/SKILL.md` — this loop is now a required
  gate before any video is scheduled/posted from that pipeline.
