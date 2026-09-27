---
name: 01-longform-to-short
description: Find the short inside a long-form source — hook selection, viral-moment scoring, hook reconstruction, tightening, reframing, captions, actual rendering. Load references/pipeline.md for the full spec.
---

# 01 · Longform → Short

**The question is never "what happened." It's "what is the one thing worth 20
seconds of a stranger's attention."** Do not simply divide the source
chronologically — find the strongest actual stories hidden inside it.

**Full spec: [`references/pipeline.md`](references/pipeline.md)** (Tal's
verbatim brief, organized). **Scoring rubric:
[`references/scoring.md`](references/scoring.md)**. Load both before running
this pipeline for real. This file is the quick map.

## Pipeline

```
SOURCE VIDEO → TRANSCRIPT → STORY/MOMENT MAP → VIRAL MOMENT CANDIDATES → RANK
  → ROUGH CLIPS → TIGHTEN → REFRAME → AUDIO CLEANUP → CAPTIONS/TITLE
  → PREVIEW → HUMAN REVIEW → FINAL
```

| Stage | Command / action |
|---|---|
| 1. Ingest + transcribe | `node scripts/longform-index.mjs <video> --slug <slug> --model medium` |
| 2. Analyse + find + score moments | **Claude reads** `public/footage/<slug>/TRANSCRIPT.md` + `frames/`, writes `moments.json` (schema `templates/moments.json`) |
| 3. Report candidates | write `shorts_candidates.json` (schema `templates/shorts_candidates.json`), show Tal, let him pick |
| 4. Build an approved candidate | write `clip-spec.json` (schema `templates/clip-spec.json`) → `node scripts/longform-build.mjs --slug <slug> --spec <file>.json` |
| 5. Render preview | `npx remotion bundle` then `npx remotion render <bundle> <CompId> output/<slug>/<name>.mp4 --crf 24` |
| 6. Quality check | render stills, **look at them** — `.claude/agents/quality-control.md` |

Step 2 is the one stage that isn't mechanical: viral-moment finding and scoring
is Claude's judgment call from an actual read of the transcript and keyframes,
not a heuristic script. Everything else is deterministic given an approved
candidate.

## Non-negotiables specific to this skill

- **Use only content that actually exists in the source.** No fabricated
  dialogue, no fake quotes, no chronology that makes the story false — even
  when doing hook reconstruction (pulling a later line to the front).
- **Do not artificially cap candidate count.** 3 excellent moments → report 3.
  18 → report 18.
- **This is a ranking heuristic, not a virality prediction.** Never promise
  views.
- **No smart reframing available here** — no Python, no MediaPipe on this
  machine. Reframe is a static/manual crop (`objectPosition` per beat). Say so.
- **Do not over-denoise; never introduce third-party music without
  authorization** — same rules as everywhere else in this project
  (CLAUDE.md §1, `03-audio-post`).
- Don't stop at instructions — actually render preview MP4s.

## Related

`02-multicam-and-coverage` (reframing detail), `03-audio-post`,
`04-captions-and-typography`, `06-story-structure` (what a real variation is,
opening/ending discipline), `.claude/agents/rough-cut-editor.md`,
`.claude/agents/quality-control.md`.
