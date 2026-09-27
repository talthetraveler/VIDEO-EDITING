# Toolbox — which tool for which job

Audited 2026-09, updated 2026-09-11. This machine is **Windows, Node 24, system
ffmpeg (Gyan.FFmpeg via winget)**. Python **is now available** (`.venv-dub` for
open-dubbing; a separate `pip install --user` for WhisperX/PySceneDetect below)
— the Python-gated tools are no longer "his Mac only," several are verified
running here. Node-native tools remain the default; reach for the Python ones
below when the job specifically calls for them.

## Installed & working here (Node-native)

| Job | Tool | Notes |
|---|---|---|
| Media probe / cut / frames / encode | **ffmpeg** via `npx remotion ffmpeg` | Remotion's bundled build (n7.1, restricted filter set: `scale`, `atrim`, `concat`, `silencedetect` — NOT `select`/`scdet`). No system ffmpeg needed. |
| Bulk transcription (multilingual) | **whisper.cpp** via `@remotion/install-whisper-cpp` | `model: "medium"` (multilingual he/ar/en) — **never `*.en` for Hebrew/Arabic footage**. `language: null` = auto-detect. Hotwords via `additionalArgs:[["--prompt", "Shalom, Salam, …"]]`. Cache in `~/.cache/video-studio/` (space-free — installer bug). |
| Captions | **@remotion/captions** + `<Captions>` | TikTok pages, remapped to the cut timeline. |
| Standalone `.srt` export (YouTube's native caption slot) | **`scripts/export-srt.mjs <project>`** | Evaluated kkoppenhaver/cc-skills' `video-subtitler` (2026-09-12, no LICENSE file but clearly meant to be copied) — most of it duplicates what we already do, often less thoroughly: its cue-grouping is basic max-chars/max-dur/max-gap vs our `caption-group.mjs`'s glue-word + terminal-punctuation + width-fit rules (with 2 real bugs already found and fixed — see `ffmpeg-audio-caption-pipeline.md` §3), and its `--prompt` brand-seeding trick is one we already do (`additionalArgs:[["--prompt",...]]`). **The one genuinely missing piece**: we never exported a standalone `.srt`. Built `export-srt.mjs` instead of installing their skill — it reads the ALREADY-EDITED `captions` track straight out of `project.json` (word-exact, positivity-gated, retake-cleaned, possibly hand-edited on `:4100`), so it can't introduce a second, independent set of transcription errors the way re-transcribing the final render would. Tested against a real project, correct SRT timecodes out. Use for YouTube uploads (Studio → video → Subtitles → Add language → Upload file → With timing) as a complement to the burned-in captions, not a replacement. |
| Visual embeddings (CLIP) | **Transformers.js** `@huggingface/transformers` (`Xenova/clip-vit-base-patch32`) | Pure Node + onnxruntime, no Python. This is the **OpenCLIP equivalent** — images + text in one 512-d space so footage is searchable by visual meaning. `scripts/lib/clip.mjs`. |
| Moment library DB | **`node:sqlite`** (built into Node 24) | Zero deps, no native build (better-sqlite3 needs Python/gyp — avoided). `scripts/lib/db.mjs`. |
| Reference-video ingestion | **yt-dlp** binary at `bin/yt-dlp.exe` | Single exe, no Python. For pulling reference reels/Shorts to study. |
| Reference-style analysis + variations | **mimic-mcp** (`.mcp.json` → `npx -y mimic-reels-mcp`) | Node/TS MCP server. Tools: `analyze_reference`/`analyze_creator` (cut timings, transitions, typography via OCR, BPM, composition), `index_footage`, `trim_silence`, `edit_by_transcript`, `suggest_framing`, `track_subject`, `draft_recipe`/`scaffold_reel`/`render_reel`, `review_render`/`critique_reel`/`hook_variants`, `export_variants`. **Use for "edit mine like this <reference>"** and as a second opinion on cuts/QA. Restart the session to load it. |
| Assembly / finishing / render | **Remotion** + official skills (`.agents/skills/`) | The renderer, not the editorial brain. |
| Delivery-spec compliance, quick ffmpeg-only jobs, multicam sync | **ffmpeg-skill** (kajisho5, MIT, `npx ffmpeg-skill`) | Installed 2026-09-12 at Tal's request, evaluated first (MIT license, npm package hash-matches the GitHub repo, CI-tested). 42 typed Python-stdlib scripts (`probe`/`cut`/`fit`/`caption`/`check`/`sync`/`loudness`/`export`/…), a `doctor` capability check, `--dry-run --json`. **Windows gotcha**: its own npm scripts (`npm run doctor`, `npm test`) hardcode `python3`, which on a python.org install (this machine) resolves to the dead Microsoft Store alias stub, not real Python — call the scripts directly with `python` instead: `python "C:/Users/taldo/.claude/skills/ffmpeg-skill/scripts/<name>.py"`. `doctor` confirmed everything required/optional present here (drawtext, zscale, lut3d, ass/subtitles, scdet, vidstabdetect, ...). **Use for**: `check.py --platform reels/tiktok/youtube/x` (platform delivery-spec validation — codec, pixel format, true peak, colour tags, VFR — genuinely different from and more thorough than `tools/qa-check.py`, which only checks technical defects) and `sync.py` (multicam/external-mic drift correction, relevant to `multisource.mjs`). **Don't use for**: anything needing Remotion's motion graphics/caption components — this tool has no concept of our `project.json` timeline; it's a fast ffmpeg-only complement, not a replacement for the Remotion pipeline. |

## Our indexing pipeline (built on the above)

```
npm run index   -- <folder> --slug <shoot> [--model medium] [--frames 5]   # ffprobe + whisper + keyframes + CLIP -> library.db
npm run group   -- --slug <shoot> [--gap 120]                              # consecutive clips -> INTERACTION ids + classify
npm run moments -- --slug <shoot>                                          # speech regions + CLIP tags -> MOMENT rows (incl. silent visual moments)
npm run summary -- --slug <shoot>                                          # FIRST BATCH OUTPUT report (SUMMARY.md)
npm run search  -- --slug <shoot> "person receiving flowers" [--kind greeting]
npm run reel    -- --slug <shoot> --spec edit.json                         # edit-JSON -> Remotion composition
```

Detail: `batch-indexing.md`. Index a shoot **once**; every variation is a cheap
edit-JSON over the moment library — never reprocess the folder.

## Python-gated, verified WORKING on this machine (2026-09-11, "Call Someone You Love" recreate)

| Repo | Job | How it actually went here |
|---|---|---|
| **DeepFilterNet** (Rikorose) | dialogue denoise (better than ffmpeg `afftdn` alone — street/wind/restaurant noise) | `pip install deepfilternet` needs a Rust toolchain this machine doesn't have — **use the prebuilt Windows binary from the GitHub release instead** (`deep-filter.exe`, ~25MB, zero deps). **`-a 25` still over-suppressed real speech** (confirmed via waveform image: continuous signal in the original, near-flat-silent in the denoised output for the same stretch) — **`-a 10` is the setting that actually keeps the voice**, always with `-D` (delay-compensated). **Denoise the exact already-cut segment, not the whole source clip pre-trim** — whole-clip-then-slice needs `apad`/`atrim` guesswork against the ~30ms the STFT framing shaves off, and any error there is an A/V drift that surfaces as "captions don't line up with the words" (the timestamps are fine; the audio just doesn't start where you think). Follow with a light `loudnorm` for consistent dialogue level across clips. Full writeup: `ffmpeg-audio-caption-pipeline.md`. |
| **WhisperX** (m-bain) | precise word-level alignment (cross-check / alternative to whisper.cpp); **now the mandatory caption-timing authority on the FINAL edited audio**, 2026-09-11 | `pip install --user whisperx` (3.8.6) — first attempt hit a Windows file-lock on a numpy `.pyd`, retry after closing other Python processes fixed it. `tools/whisperx-align.py` wraps it: forced alignment against the locked final edit, never estimated. Language coverage confirmed directly against the installed package: `en` (torch), `he`+`ar` (HF, `DEFAULT_ALIGN_MODELS_HF`) — all three of Tal's languages covered. Tested end-to-end against a real final render, produced correct word timings. Full workflow: `references/video-qa-pipeline.md`. |
| **PySceneDetect** (Breakthrough) | confirm a clip is one continuous shot (no hidden internal cuts) before treating it as single-take | `pip install scenedetect`. Genuinely useful as a **verification step** on unfamiliar footage (tripod table-shoot, multi-source folders) — confirmed all 18 clips in one shoot were single takes, matching what reading extracted stills already showed. Skip it on Meta-glasses POV (already known short/single-shot). |

## Verified technique (no new dependency)

- **Signal-measured exposure match** — `ffmpeg -vf signalstats` sampled YAVG per
  clip vs. the shoot's own average (NOT a fixed target, NOT eyeballed). Only
  nudge clips that are measurably off (~4+ levels) with `eq=brightness=`; leave
  the rest alone. Confirm Rec.709 SDR full-range first (`signalstats` min/max
  near 0–255) — a LOG source needs a real LUT, this shortcut doesn't apply.

## Candidate repos evaluated and NOT merged (the OpenChatCut license pattern applies)

| Repo | Verdict |
|---|---|
| **OpenNolan** (het8802/OpenNolan) | A **separate full editor app**, same shape of decision as OpenChatCut (AGPL-style — check its actual license before any merge) — **do not fold into this repo without an explicit go from Tal**, even when he flags it "must have." Evaluate it the way `EDITOR.md` evaluated OpenChatCut: what's genuinely new, is it worth the license obligation, stage the adoption. |
| **Agentic Color Grader** | Needs a different agent framework ("Pi") to run at all — not portable here. **Replicated its actual technique instead** (waveform/signal stats → measured correction, see above) rather than standing up an incompatible framework for one feature. |
| **VideoColorGrading** | A GPU diffusion model with multi-GB pretrained weights — not practical on this machine, and overkill for same-day/same-location daylight footage where a signal-measured nudge already solves it. |

## Python-gated — not yet tried here, use when the job calls for it

| Repo | Job | Verdict |
|---|---|---|
| **faster-whisper** (SYSTRAN) | fast bulk transcription | Better than whisper.cpp for 400 clips: batching, `--vad_filter`, `initial_prompt` hotwords, `language` per-clip. Swap it in for the transcription step; our schema is identical. Until then whisper.cpp `medium` covers it. |
| **silero-vad** (snakers4) | speech start/end, pauses, regions | torch. We derive speech regions from word gaps now (good enough). Add silero for tighter boundaries on final clips. **Silence ≠ delete** — the payoff (smile/hug/flower handoff) is often after the last word. |
| **auto-editor** (WyattBlue) | silence / dead-space / motion rough cut | A helper for *candidates*, never final decisions. `pip install auto-editor`. Cross-check every cut; never drop a silent reaction. |
| **VEA** (Memories-ai) | footage understanding, semantic search, FCPXML timeline | **Concepts adopted, app not used** — it delegates video understanding to the paid Memories.ai datalake. Our `search` + moment library + `build-reel` is the local equivalent of `search_footage` + `generate_fcpxml`. |
| **b-roll-finder** (louisedesadeleer) | semantic b-roll routing | Concept adopted: **understand the sentence's meaning before choosing b-roll**, don't keyword-match nouns. Priority: his real footage → his archive → direct visual proof → screenshots → external → AI. `search --kind broll` + CLIP does the semantic match. |

## video-use (browser-use) — installed and working, 2026-09-18

`vendor/video-use/`, symlinked to `~/.claude/skills/video-use/` (shows up in
the skills list as `video-use`). MIT license. Deps via `uv sync` — `uv`
itself needed `pip install --user uv`, then the exe is at
`~/AppData/Roaming/Python/Python312/Scripts/uv.exe`, not on PATH by default.

**Works WITHOUT the ElevenLabs key it normally requires.** Only
`helpers/transcribe.py` (Scribe ASR + diarization) needs the key —
everything downstream (`pack_transcripts.py`, `render.py`, `grade.py`,
`timeline_view.py`, the self-eval loop) just reads/writes Scribe's JSON
schema and doesn't care who produced it. `helpers/transcribe_local.py`
(added here, not upstream) is a drop-in substitute: same CLI shape, same
cache path, whisper.cpp instead of Scribe. **The one real gap: no speaker
diarization** — every word lands on `speaker_0`, so multi-speaker phrase
breaks fall back to silence-only. Give it the real key for true diarization
on interviews; verified end-to-end otherwise (transcribe → pack → EDL →
render --preview → pulled a still, real correct picture).

Genuinely good engineering worth reusing even outside this skill: 30ms audio
cross-fades at every segment boundary, subtitles composited strictly LAST
after overlays, cuts snapped to real word boundaries with 30-200ms padding,
two-pass loudness normalization to -14 LUFS (this repo's own pipelines only
do single-pass) — and especially **self-eval the RENDERED output at every
cut boundary before showing the user**, not just the source footage.

Patched a real upstream bug: all 6 helper scripts crash on Windows' default
cp1252 console the instant they print a non-ASCII character (e.g.
`pack_transcripts.py`'s own success message uses →) — the work still
completes and the file still writes, only the print crashes, but it looks
like a failure. Added `sys.stdout.reconfigure(encoding="utf-8",
errors="replace")` to all 6.

**Also relevant to the open yuvj420p item** (CLAUDE.md §7): `render.py`'s
default libx264 call, with no explicit `-pix_fmt`, also outputs
`yuvj420p` (full-range). Same defect surfacing in a completely different
codebase is strong evidence this is generic libx264-default behavior, not
something specific to Remotion's render step.
| **SAM 2** (facebookresearch) | subject tracking, smart vertical reframing | **Only when a shot actually needs it.** Heavy. mimic-mcp's `track_subject`/`suggest_framing` is the lighter first try. |

## Rules

- Two repos for one job → pick the **stronger/simpler**, don't run both.
- `medium` (multilingual) is the default whisper model — his footage has English,
  Hebrew, Arabic.
- Never modify source footage. `index` hardlinks clips into `public/` (instant,
  no extra space); it does not touch originals.
- The funnel: **all footage → cheap CLIP + transcript → candidate retrieval →
  deep analysis (whisperX / vision) only where it matters.**
