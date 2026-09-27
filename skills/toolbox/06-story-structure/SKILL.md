---
name: 06-story-structure
description: Hook → turn → payoff. Compilation ordering, genuine variation, and ending on the right beat.
---

# 06 · Story Structure

## The shape

```
HOOK (0–1.5 s)  →  PREMISE  →  TURN  →  PAYOFF  →  REST
```

- **Hook** — a face or a line that works with zero setup.
- **Premise** — what he's doing and to whom. One beat. Often carried by the
  title card, not narration.
- **Turn** — the moment the interaction becomes more than the transaction: they
  answer back, they laugh, they say something unguarded.
- **Payoff** — the strongest human moment in the whole set. This is chosen
  *first* and everything is arranged to arrive at it.
- **Rest** — a half-second of silence or a smile. End on a face, not on a word.

**Cut on energy, not on grammar.** The sentence ending is rarely the beat ending.

## Compilation ordering

For greeting / identity / reaction compilations:

1. Strongest **reaction** opens — not the strongest *line*.
2. Alternate identity, language, gender, and age across consecutive beats. Two
   similar people back-to-back reads as one person.
3. Escalate warmth: reserved → friendly → genuinely moved.
4. The second-strongest beat goes **last**, the strongest goes **first**. Middle
   is where the ordinary beats hide.
5. Never two beats from the same clip adjacent unless contiguous in time.

## Full story vs compilation — classify before you cut

Not everything is a compilation. Every interaction is one of:

- **FULL STORY** — one person, enough substance to carry a whole video:
  hook → how he approached them → who they are → the best of the conversation
  → payoff → natural ending. Score on story depth, personality, emotional
  interest, humor, uniqueness, beginning-to-end completeness, whether there is
  a payoff, and whether someone would watch this person for 30–90 seconds.
- **COMPILATION** — several short interactions that are stronger together.

For a large batch, actively hunt 1–3 full stories. Don't force a number the
footage won't support. The same interaction can feed both a standalone story
and one moment inside a compilation.

### Two traps that produced fake "stories" here

1. **Never build a full story by taking the top-N scoring moments.**
   `story_0026 / story_0028 / story_0038` were assembled that way and are quote
   collages wearing a story's title — scattered fragments from different people
   and different topics, out of order. This is the anti-pattern.
2. **An `interaction` row is often NOT one conversation.** The ≤120 s grouping
   gap merges a whole busy street into one row — `INT_0026` is 71 clips and
   many different people; `INT_0038` drifts from a Moroccan couple to Indonesia
   to Al-Aqsa. Duration and the `person` tag will both lie to you.
   **Verify by reading the moments and checking the clip ids**: a fresh
   "excuse me / do you speak English" mid-sequence, or a jump to a different
   clip, usually means a *new* person. The first A1 build spliced two separate
   groups (clips `video-1923` and `video-1915`) into one "story" for exactly
   this reason.

## Story / long-interaction ordering

Different rules. **Do not montage a story.**

- **Chronological**, and exclude greeting-tagged beats — greetings score highest
  on every metric, so a score-ranked "story" collapses into a greeting montage.
- Structure: hook → who they are → the history → a personal line → the thing
  they make → an emotional close.
- Keep the person's **strongest complete answer** whole.

## What a variation actually is

> A variation is not "changing clip #1."

A genuine variation changes at least **three** of:

| Axis | Examples |
|---|---|
| Who starts | different person, different identity, different language |
| Cast | a different subset of people entirely |
| Order | strongest-first, chronological, escalating, alternating |
| Lines | different anchor phrase, different sense of the same phrase |
| Hook | reaction-first vs line-first vs title-first |
| Pacing | 1.2 s beats vs 2.5 s beats |
| POV | his side vs their side vs reaction-only |
| Length | 12 s / 18 s / 30 s cut differently, not just trimmed |
| Ending | laugh / handshake / silence / a line |

Reject any variation whose **exact beat sequence** duplicates an earlier one —
`make-compilations.mjs` enforces this. Also reject one that differs only in
length.

## MAIN first

For every concept, build `V1_MAIN` — the single strongest possible cut — before
any alternate. Alternates are judged against it. If an alternate is better,
promote it and rename; don't quietly leave the better cut as `V4`.

## Opening failure modes

Previously shipped and rejected:

- Opened on an empty beach (score picked the loudest audio, not the best image).
- Opened on a couple walking, labelled "hugs" (CLIP mislabel — only ~2 confident
  hugs existed in 328 clips).

Fix: score openings on **visible reaction + audible reply**, not on transcript
score alone. See `interactionScore()` in `scripts/make-catalog.mjs`.

## Related

`01-longform-to-short`, `02-multicam-and-coverage`, `07-cinematic-reference`.
