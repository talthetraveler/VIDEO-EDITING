---
name: content-engine
description: The autonomous content engine — ingest raw footage or a folder+reference, cut it into MAIN + TRIAL (+ hook/dub variations), post everything to Instagram Trial Reels + other platforms (never main IG unless told), then read analytics and make more of what's working. Use whenever Tal says "post this", "recut", "dub it", "schedule the trials", "make more variations", "what's working", or hands over a folder of clips / a reference video to recreate. Covers scripts/ingest.mjs, recreate.mjs, the recut batch, dub.mjs, make-hooks.mjs, schedule-trials.mjs, learn-from-analytics.mjs, and the localhost:4100 dashboard.
---

# Content engine — edit, dub, post, learn, repeat

Tal's standing instruction (2026-09-10/11): *"you're gonna be making content,
editing, etc., and just posting to trial reels."* This is the whole loop, one
command per stage, chainable into an unattended overnight run. Full editor
detail: `localhost-4100-editor` project memory. Craft judgment (retakes,
fillers, pacing, caption style, candidate scoring): `.claude/skills/video-editor/`
+ `skills/01-08`.

## Non-negotiables (CLAUDE.md governs; these are the content-engine-specific ones)

- **Trial reels + other platforms by default. Main Instagram grid ONLY on
  explicit instruction.** `schedule-trials.mjs` hard-codes `as: "trial"`.
- **Positivity gate is silent** — negative lines about Israel are dropped
  during captioning, never flagged, never surfaced for review.
- **Publishing is outward-facing** — `publish.mjs schedule --confirm` actually
  posts. Only run `--confirm` after Tal has told you to go (a standing "post
  everything" instruction covers a run; each big batch is still worth a quick
  "here's the plan" before `--confirm` on a `--dry` result).
- **A `_FINAL.mp4` master doesn't get scheduled until it passes the video-QA
  loop** (2026-09-11 mandatory workflow): `tools/whisperx-align.py` against
  the final edited audio → `tools/qa-check.py` (black/frozen frames, loudness
  hard-stop, caption/speech sync from real audio energy) → a Browser-pane
  look at anything flagged. Full loop: `.claude/skills/video-editor/references/video-qa-pipeline.md`.
  This replaced an earlier planned Gemini-API review step Tal cancelled the
  same session ("no need for gemini, forget tht") — the local checks are what
  actually run.
- **Source footage is read-only.** Every pipeline stage copies/links into
  `public/footage/`; `raw/` and the shoot library are never modified.
- **Reference videos are analysed, never lifted** — `recreate.mjs` copies
  structure (pacing, arc, caption feel) and, only with `--reference`'s own
  audio via demucs, the *music bed* — never footage or dialogue.

## The tools

| Stage | Command | What it does |
|---|---|---|
| **Ingest one clip** | `node scripts/ingest.mjs "<video>" --slug <name> --title "…" --render` | transcribe (whisper, `--translate` for he/ar) → cut fillers/pauses → **repeated-take removal** → positivity gate → nas_caption (sentence-case, yellow keyword) → auto music → MAIN (`-a`) + TRIAL (`-b`, hook-first ≤45s) → renders previews to `:4100` |
| **Ingest folder + reference** | `node scripts/recreate.mjs --folder "<dir>" --reference "<file\|URL>" --slug <name> --render` | analyses the reference into a recipe (cuts/min, arc, extracted music) → indexes the folder → **multi-source cutting** (same moment, two cameras) → matches clips to the arc at the reference's pacing → MAIN + TRIAL |
| **Re-cut an existing library video to the new style** | `node scripts/proj-recaption.mjs <proj> --style nas_caption [--translate]` | rebuilds captions in the current house style; add `set_music`/`proj-render` after |
| **Batch re-cut many** | `node scratch/batch/recut.mjs [--only slugA,slugB]` | the above for every archived dashboard card — style + music + repeated-take + render, un-archives each as it lands |
| **More hook variations** | `node scripts/make-hooks.mjs <slug> --count N --render` | extra cold-opens (`-c`, `-d`…) of a finished video, different line each, ≤45s |
| **Dub into another language** | `node scripts/dub.mjs <proj> --lang ar\|he\|es\|… ` · or clone-and-dub: `node scripts/dub-variants.mjs --pairs "slug:lang,…"` | open-dubbing (demucs → whisper → NLLB → edge-tts) replaces the spoken audio; `dub-variants.mjs` clones the `-b` cut to `<slug>-<lang>` first so the original is untouched |
| **Schedule to trial reels** | `node scripts/schedule-trials.mjs [--only slugs] [--variants-only] [--per-day 3] --dry` then `--confirm` | every finished cut (`-a`/`-b`/hook/dub variants) → Instagram Trial Reel + 9 platforms, **3/day** (lowered from 6 on 2026-09-20 — at 6/day Instagram started blocking the trial reels), spread across 7:00/16:00/22:00 Israel, rolling forward. Renders `_FINAL.mp4` masters first. **Always `--dry` first, read the plan, then `--confirm`.** |
| **See what's working** | `node scripts/publish.mjs analytics --days 14` then `node scripts/learn-from-analytics.mjs` | pulls views/watch-rate/saves/shares per post, ranks them, writes `scratch/batch/_learnings.json` + names which slugs deserve more variations |
| **The loop** | `learn-from-analytics` → `make-hooks.mjs <winner> --count 3 --render` → `schedule-trials.mjs --only <winner> --variants-only --confirm` | repeat weekly once posts have a few days of data |

## Orchestration for an unattended run

`scratch/batch/finish-and-schedule.sh` chains: wait for a re-cut batch →
cleanup pass on failures → `dub-variants.mjs` → `schedule-trials.mjs --confirm`.
`scratch/batch/phase2-dubs.sh` is the same pattern for a dub-then-schedule
follow-up. Both use a `scratch/batch/BATCH_LOCK` file so the `:4100` dashboard's
own live-render (editor Apply, music/dub changes) doesn't fight the batch for
the GPU/CPU — check for that file before telling Tal an edit will re-render
instantly, and always `rm` it if a chained script dies before its own cleanup.

Launch a long chain with `run_in_background` (Bash tool) or `nohup ... &` +
verify it survived (`nohup` is safer — a bare `&` can die when the tool call
returns). Poll sparingly; prefer waiting for the task-completion notification.

## Gotchas already paid for (don't re-discover these)

- **Arabic language code mismatch** — open-dubbing's NLLB translator wants
  `arb` (`arb_Arab`), its TTS/whisper side wants `ara`. Patched in
  `.venv-dub/Lib/site-packages/open_dubbing/translation_nllb.py` (alias `ara↔arb`).
  `dub.mjs` passes `ara`.
- **edge-tts 403** — the pinned `edge-tts==6.1.12` gets rejected by Microsoft's
  endpoint. Upgraded to `7.2.8` in `.venv-dub`. If it 403s again, re-upgrade or
  switch `dub.mjs`'s `--tts` to `mms` (fully local, no network).
- **open-dubbing file-not-found race** — its own filename-sanitizing step can
  race a freshly-written render on Windows. `dub.mjs` now pre-copies the source
  to an already-clean-named temp file before invoking it.
- **Long videos silently die in open-dubbing** — no traceback, just a nonzero
  exit, seemingly RAM/resource related. Prefer dubbing the **`-b` (trial, short)
  cut** over a long `-a` main cut; `dub-variants.mjs` already prefers `-b`.
- **ShortSync drops the UTC offset** — sending `...T16:00:00+03:00` gets stored
  as `16:00 UTC`, not converted. `schedule-trials.mjs` now computes the UTC
  instant itself (`isoFor` subtracts the Israel offset before emitting `...Z`).
  Wave-1's first 47 posts predate this fix and fire ~3h later than labeled —
  harmless (still 6/day, still spread), just don't be surprised.
- **`proj-render.mjs`'s temp-bundle sweep can delete an in-use bundle** —
  deleting `%TEMP%/remotion-*` while the dashboard's warm bundle or a sibling
  batch render is using it crashes both. Fixed with a 15-minute mtime guard
  before a sweep deletes anything. If renders start failing with a Remotion
  `readFile`/bundle-not-found error, check for a second render process
  fighting the first before anything else.
- **Killing zombie processes** — `Stop-Process` by command-line match
  (PowerShell `Get-CimInstance Win32_Process`) is the reliable way to find and
  kill stray `proj-render`/`chrome-headless-shell`/whisper processes on
  Windows; `ps -W` in git-bash often can't see detached Windows processes at
  all — don't trust a `0` result from it as proof nothing is running.

## File map

```
scripts/ingest.mjs            one clip → MAIN+TRIAL
scripts/recreate.mjs          folder + reference → MAIN+TRIAL (styled, multi-source)
scripts/lib/refscan.mjs       reference analysis (cuts, arc, music extraction)
scripts/lib/multisource.mjs   same-moment/two-camera grouping + interleave
scripts/lib/build-project.mjs shared multi-source project.json assembler
scripts/dub.mjs               dub one project in place
scripts/dub-variants.mjs      clone + dub → new project per language
scripts/make-hooks.mjs        extra cold-open variations
scripts/schedule-trials.mjs   render finals + submit the trial-reel schedule
scripts/learn-from-analytics.mjs   rank live post performance
scripts/publish.mjs           ShortSync API (status/post/trial/schedule/list/analytics/cancel)
scratch/batch/recut.mjs       batch re-cut every archived dashboard card
scratch/batch/finish-and-schedule.sh / phase2-dubs.sh   chained overnight runs
scratch/batch/_learnings.json      latest analytics ranking (read before deciding what to make more of)
scratch/batch/BATCH_LOCK      presence = a batch job owns rendering right now
scratch/batch/trial-plan.json      the last plan schedule-trials.mjs built
```
