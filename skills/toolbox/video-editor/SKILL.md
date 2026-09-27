---
name: video-editor
description: The full short-form video-editing system — clean cuts, 2D motion graphics, and format builds. Use whenever he sends raw talking-to-camera footage, a script, a voiceover, or an asset folder to edit; asks for a reel/short/TikTok/Reels/Shorts; names a format ("head image", "cutout", "b-roll montage", "promo film", "explainer"); wants filler words / dead air / retakes cut; wants motion graphics, animated numbers, maps, UI animation, kinetic type, or a premium dark promo look; or wants a shot generated because there's no footage. Implementation lives in the video-studio Remotion repo. NOT for long-form / YouTube edits.
---

# Video editor

One system, several formats. Everything is Remotion-first; the render is the
deliverable. Default output is **vertical 9:16, 30 fps CFR**.

Repo docs (fuller than this skill): `PIPELINE.md`, `EDITING-SYSTEM.md`,
`MOTION-PROMPT.md`, `CLAUDE.md`.

## Non-negotiable rules (do not relitigate — each cost a rejected build)

1. **His talking footage is never moved, scaled, cropped or padded.** If
   something needs room, the overlay shrinks — not him.
2. **Never cut him off before he finishes a clause.** When in doubt, cut LATER.
   Full boundary procedure in `references/clean-cuts.md`.
3. **Captions: soft drop shadow, never a stroke/border.** Break on speech, 2 lines
   max, key words/stats emphasised, inside the mobile safe area.
4. **Every animation needs a storytelling reason.** No transition packs, no
   generic AI gradients, no floating 3D icons, no motion for its own sake.
5. **Literal illustration** for image/cutout/head-image formats: the picture is
   the noun that was just said. (The Jack b-roll montage is the one exception —
   see that format's note.)
6. **Use his own photos/footage** when the line is about his body or his story,
   never a stock stand-in.

## The pipeline

```
raw talking clips ──▶ 1. CUT ──▶ 2. EDIT ──▶ 3. GENERATE gaps ──▶ render
script / assets  ──▶         (Remotion)                          out/<slug>.mp4
```

1. **Cut** — `npm run tighten -- <video> --slug <slug>` (add `--translate` for
   he/ar footage). Local whisper.cpp, removes fillers + long pauses, writes
   `keep.json` + `captions.json`. For footage with **retakes**, that's not enough
   — follow the retake-selection + boundary mechanics AND the **A-roll semantic
   judgment (§7)** in `references/clean-cuts.md`. To go straight from one raw clip
   to a MAIN + TRIAL timeline pair on the `:4100` dashboard:
   `node scripts/ingest.mjs "<video>" --slug <name> [--title "…"] --render`.
   Scoring a batch or a MAIN-vs-TRIAL pick → `skills/01-longform-to-short/references/candidate-scoring.md`.
2. **Edit** — build in Remotion from `src/components/`. MODE A (real footage) vs
   MODE B (motion graphics): `references/motion-graphics.md`.
3. **Generate** — `npm run generate -- --spec <shot>.json --slug <slug> --kind <kind>`
   for shots with no footage: `references/generation.md`.

Write the plan first (`SCENE-PLAN.md` or `BEAT-SHEET.md`), get it approved, then
build. `npm run new -- <slug> "<Title>" vertical [editorial|motion]` scaffolds it.

## Formats — pick one, read its reference

| Format | When | Reference |
|---|---|---|
| **head-image reel** | talking to camera, web image floating in the gap above his head, caption under it, hard cuts on clauses, no motion | `references/formats/head-image-reel.md` |
| **cutout reel** | he is masked/keyed over full-screen images that illustrate the nouns | `references/formats/cutout-reel.md` |
| **b-roll montage** ("Jack") | script/VO-driven, fast b-roll montage, associative not literal | `references/formats/broll-montage.md` |
| **talking-head** | one shot, no overlay, just clean cuts + captions | `references/formats/talking-head.md` |
| **kindness-greetings** | walking up to strangers, "Shabbat Shalom / Salam alaikum", warm exchanges, spreading kindness — cut MANY variations from one folder | `references/formats/kindness-greetings.md` |
| **restaurant-owner** | "MEETING A … IN ISRAEL" / "I WENT TO A … OWNED BY …" — one shop, talk to the owner, order, taste, goodbye; often 7+ consecutive clips = one interaction | `references/formats/restaurant-owner.md` |
| **call-someone-you-love** | a phone-booth rig, a stranger picks up and leaves a message for someone they love/miss — always a FULL STORY, one subject, never a compilation; captions go silent during real pauses | `references/formats/call-someone-you-love.md` |
| **motion promo** | premium dark neon glass-and-light product/launch film, 4–7 beats | `references/formats/motion-promo.md` |
| **editorial explainer** | Nas-Daily / SaaS-explainer energy, footage + motion graphics mixed, big animated stats | `references/formats/editorial-explainer.md` |

Many videos mix formats in one timeline. Use whichever explains each moment best.

## Batch: a folder of 300–400 raw clips → a searchable library → many videos

`references/batch-indexing.md`. Index once
(`npm run index/group/moments/summary`), then every reel is a cheap edit-JSON
over the moment library (`npm run search` → `npm run reel`). Never reprocess the
folder. Handles interaction grouping (7 clips = 1 restaurant owner), silent
visual moments (smile/hug/flower-handoff after the last word), and 10 greeting
variations from the same moments.

## Tools available while editing

`references/toolbox.md` — which tool for which job, what's installed here
(whisper.cpp multilingual, Transformers.js CLIP, node:sqlite, yt-dlp, mimic-mcp,
Remotion) vs Python-gated (faster-whisper, whisperX, silero-vad, auto-editor,
DeepFilterNet, SAM2 — for when running on his Mac). Use `mimic-mcp` for "edit
mine like this <reference>".

## House style, caption voice, asset layout, run order

`references/house-style.md`.

## FFmpeg pipeline lessons — denoise, word-exact captions, color, hook-first cuts

`references/ffmpeg-audio-caption-pipeline.md` — portable, tool-specific
knowledge: fixing sideways source footage, the Windows drawtext colon trap,
DeepFilterNet as a standalone binary (and the `-a` setting that was quietly
eating real speech), getting frame-exact English word timestamps from
non-English audio in one whisper.cpp pass, the caption-grouping rules and
bugs already found, why you verify a beat's out-point against the actual
picture and not just its transcript timestamp, signal-measured color
matching, a music volume envelope that builds with the edit, and the
hook-first single-story cut structure. Read this before rebuilding any of
these pipeline pieces from scratch.

## Review before calling it done

Render stills or open Studio and actually look: overlapping text, empty frames,
weak hierarchy, bad crops, unreadable captions, limp transitions, pacing dead
spots, anything that reads as AI slop. Fix, then re-check. Never trust a render
because it compiled.

**Captions specifically**: the `caption-qc` agent + `tools/verify-captions.py`
prove captions match the speech and never overlap — run it on every render
that has captions, with the **build-emitted** cue sidecar (never a hand-typed
one). It has already caught a real on-screen overlap and a systemic
wrong-line defect in videos that had been called clean. Translated captions
are only ever "timing verified, wording unverified".

**Mandatory before any final render ships**: `references/video-qa-pipeline.md`
— WhisperX forced alignment against the *final edited* dialogue audio is the
caption-timing authority (never estimate it), `tools/qa-check.py` runs an
automated local pass (black/frozen frames, loudness hard-stop, caption/speech
sync measured from real audio energy, not transcript math), and the Browser
pane can open a local final MP4 directly and seek to any flagged timestamp
for a real look — not just a few extracted stills. Loop: render → align →
qa-check → look at what it flags → fix → re-render → re-check, until
`qa-check.py` passes clean.
