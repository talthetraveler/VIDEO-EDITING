# B-roll montage ("Jack")

**What it is:** script- or voiceover-driven. No talking head on screen (or only
briefly). Fast b-roll montage cut to the VO. Named "Jack" in the project.

**The Jack rule:** b-roll here is **associative, not literal** — it evokes the
feeling / world of the line, it is *not* required to be the exact noun. This is
the one format where the literal-illustration rule (head-image, cutout) is
deliberately off. If CLAUDE.md and this file ever disagree, CLAUDE.md's Jack rule
wins.

## Build (this repo)

- `<BrollSequence>` (`src/components/BrollSequence.tsx`) — hand-tuned clip list,
  punch-in + quick cross-dissolve per clip. Keep the list short and deliberate;
  don't `.map` a data dump.
- Time cuts to the VO: hard cut on stressed beats, let a shot breathe when the
  line is slow. Something changes every ~1–2 s in a montage, faster than the
  editorial default.
- Captions optional — if the VO is clear and the b-roll is strong, a montage can
  run caption-free or with sparse kinetic keywords only.
- Music bed matters more here than any other format — it's carrying the pace. Use
  the approved palette (`house-style.md`), voice `I=-16`, bed `I=-31`.

## Sourcing b-roll

His footage first, then real footage of the subject, then generated
(`references/generation.md`) — but for Jack, generated abstract/atmospheric shots
are more acceptable than in the literal formats.

## Spec status

Measured pacing/transition numbers weren't handed over. Reverse-engineer from a
shipped Jack video before locking a house cadence, and write it back here.
