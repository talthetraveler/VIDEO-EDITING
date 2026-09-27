# Viral moment scoring rubric

Applied per candidate in `moments.json` (schema: `../templates/moments.json`).
**This is a ranking heuristic, not a prediction.** Never promise views, never
imply the score is a probability.

Score every axis 0–100:

| Axis | Question |
|---|---|
| `hook_score` | Does the first line/frame of this moment work with zero setup? |
| `clarity_score` | Is it immediately understandable out of context? |
| `emotion_score` | Does it make someone feel something specific? |
| `shareability_score` | Would someone send this to a friend? |
| `retention_score` | Is there a reason to keep watching past the first 3 seconds? |
| `relevance_score` | Does it fit @talthetraveler's positioning (identity, kindness, Israel beyond headlines)? |
| `visual_score` | Is there something worth looking at, not just listening to? |
| `standalone_score` | Does it hold up with none of the surrounding video? |

`overall_score` — a holistic read across the above, not a formula. Weight hook
and standalone highest; a moment that scores well everywhere but needs two
minutes of setup is not a Short.

## Classification from the score

- **A** (strongest) — typically standalone ≥ 85 and hook ≥ 80
- **B** (strong) — solid but missing one axis (e.g. great line, mediocre visual)
- **C** (potentially useful) — needs a companion clip, a title card doing heavy
  lifting, or trimming to work
- **D** — do not cut unless Tal specifically asks for more quantity

## Anti-patterns already seen in this project

- Scoring by transcript keyword alone opened a reel on an empty beach
  (`06-story-structure`) — a moment needs a **visible** reason to work, not just
  an audible one. Check the keyframe.
- Letting the highest-scoring category dominate every candidate — greetings and
  reactions score well on almost every axis; a set of "A" candidates that are
  all the same shape is not 9 real candidates, it's 1 candidate found 9 times.
  Diversify topic across the classification list before finalizing.
- A high `emotion_score` from a transcript line that reads dramatically on paper
  but falls flat on camera. Score after watching the keyframe/still, not after
  reading the sentence.

## Reporting

Give Tal the actual numbers and the actual count — 3 excellent candidates
reported as 3, not padded to 10; 18 reported as 18, not trimmed to a round
number. Lead with classification, not score, when presenting
(`shorts_candidates.json` → the "DEFAULT OUTPUT AFTER ANALYSIS" format in
`pipeline.md`).

## Reproducible weighted variant

When a ranking needs to be **defensible and re-runnable** (a batch review, MAIN
vs TRIAL, "why did you pick that hook") use the weighted 0–4 model with a
mandatory evidence note per factor and an explicit deduction pass:
[`candidate-scoring.md`](candidate-scoring.md) (ported from OpenChatCut's
`long-video-to-shorts` selection rubric). The axes above and that model measure
the same thing — use whichever the situation calls for; don't run both and average.
