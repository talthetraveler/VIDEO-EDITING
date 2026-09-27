# TWO-CAMERA KINDNESS — measured from Tal's own cut

Tal, 2026-09-24, handing over `low res.mp4` (his edit of the coffee-shop
footage): *"this was the video I edited. I would have wanted you to recreate
it, notice how it switches between times ... that's the multi angle, just like
the video of the POV style and then a long angle."*

**Everything here is measured from that file — 52 shots, frame by frame.** It
is the first time this system has seen Tal cut the SAME footage it was given,
so where this contradicts a guess made earlier, this wins.

---

## 1. THE THING I HAD COMPLETELY WRONG: it is a two-camera conversation

Two cameras run on the same encounter and the cut **alternates between them
continuously** — not a wide establisher then a long POV section, but A/B/A/B
for the whole scene:

| angle | what it carries |
|---|---|
| **POV (Meta glasses)** | counter height, Tal's hand in frame, the OWNER'S FACE over the counter. The intimate beats: his expression, the drink being made, money changing hands. |
| **LONG LENS (Sony)** | Tal from outside at the stall, whole body, backpack, the market around him. The context: where this is, what the place looks like. |

**Measured:** 52 shots in 163.4s — **18.7 cuts/min**, median shot **2.28s**,
range 0.86-9.60s, p90 7.2s.

> **Why this matters more than anything else in this file.** Earlier work
> treated the Sony as "the better-exposed camera" and tried to build whole
> stretches from one angle — then got stuck because the shop owner is hidden
> behind signage in the Sony wide for most of the conversation. **That is not a
> problem in Tal's cut, because he never needs the Sony to show the owner.**
> The POV shows the face; the Sony shows the room. Choose per beat, not per
> film.

**So: never reject a camera because the subject is not in it.** Ask which of
the two angles serves THIS beat, and cut.

## 2. The story does not end at the transaction

Scene 1 (0 - ~130s) is the coffee shop: no money, the owner gives the drink
free, the conversation turns to Muslim/Jewish and a divided world, Tal tries to
pay, the owner refuses.

Scene 2 (~130 - 163s) is **Tal carrying that drink out and giving it to an
Eritrean street cleaner sitting on the ground.**

The payoff is not "he gave me a drink for free" — it is **the kindness being
passed on**. `shop-owner-bread` ends the same way ("I'll give this bread to
someone who needs it"). Look for that second beat in the footage; it is the
ending.

## 3. Captions — his own practice

- **WHITE**, uppercase, no gold. Short: **1-3 words**, often a single clause.
- Sitting around **mid-frame**, not at 72% height.
- **BILINGUAL WHEN THE SPEAKER IS IN HEBREW** — English on top, Hebrew below:
  `HAPPY? / משמח מה`, `HEBREW. / עברית`, `COFFEE HERE FOR YOU. / קפה`.

> **This contradicts `CLAUDE.md` 0b rule 3** ("English only, never caption the
> original"). That rule came from the Jamaica cut. On Hebrew dialogue his own
> practice is bilingual. Do not silently overwrite one with the other —
> the gold/white style is what he asked for in the reference screenshots
> (2026-09-23), the bilingual stacking is what he does for Hebrew.

## 4. The look, measured

| | Tal's coffee-shop cut | the "Spread love" reference |
|---|---|---|
| YAVG median | **61.5** | 102 |
| SATAVG median | **4.1** | 8.6 |
| YMIN / YMAX | 0 / 255 | 0 / 255 |

*"notice like the audio is good, the colors are low"* — and they are: this cut
is **dark and flat**, far below the other reference.

> **Do not force one YAVG target across every film.** The market stall sits
> under an awning and is genuinely dark; Damascus Gate at midday is not. Both
> of his references plant a true black point (YMIN 0) and let highlights reach
> 255 — *that* is the constant. The midtone level belongs to the scene.

## 5. Audio

A **music bed runs underneath** — low-band (60-250Hz) energy measures **5.33x**
the speech band during the quietest passages, even stronger than the
`Spread love` reference (2.80x). Street sound and dialogue sit on top of it.

There is still no music library on this machine (`LOOK-AND-SOUND.md`). Until
Tal supplies tracks, a cut in this format is unfinished and should be said to
be unfinished.

## 6. Building one

1. Find both cameras on the interaction — `scripts/find-coverage.mjs`.
2. Align them — `scripts/align-cameras.py` gives the offset; **check the score,
   a confident-looking offset from an unrelated pair is how a beat ends up on
   the wrong moment.**
3. Lay the dialogue out from the better audio (usually the POV lav/on-body mic,
   which is nearer the speaker).
4. Alternate the picture A/B roughly every 1.5-3s, choosing per beat: **face →
   POV, context → long lens.**
5. Keep going past the transaction to whatever the kindness leads to.
6. White uppercase captions, 1-3 words; stack Hebrew under English when the
   speaker is Hebrew.
7. Plant black at 0, let highlights reach 255, leave the midtones where the
   scene actually is.
