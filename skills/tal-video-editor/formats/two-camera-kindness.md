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

## 7. Worked example — ROMAN, Tel Aviv (2026-09-28)

Nine clips: seven Sony (`C0484`, `C0485`, `C0488`–`C0492`) and two chest-cam
POV (`VID_…059`, `VID_…060`). Tal asked for **two cuts from one shoot** — a
story and a fast montage — so this is the full recipe for both. The edit
specs are `system/projects/roman-story/edit.json` and
`system/projects/roman-montage/edit.json`; the beat-by-beat reasoning is in
`system/projects/roman-story/NOTES.md`.

### The two variations are different films, not a long and a short

| | STORY | MONTAGE |
|---|---|---|
| length | 107s | 40s |
| driven by | what people say | what happens |
| captions | every spoken line | only 3 lines: *a day and a half*, *my father*, *you look good* |
| cuts | on completed thoughts (builder snaps to words) | on ACTION — `"snap": false` |
| ending | the real goodbye | the happy reaction |
| sound | dialogue, chest-cam mic | natural sound; add music at post |

### The steps, in order

1. **Put every clip on one clock.** Creation times are per device and the
   clocks disagree. Sync the cameras by AUDIO correlation, then confirm the
   offset from the content — the same line appearing in both transcripts.
   Here: VID059 = C0484 − 2.19s (r 0.89), VID059 = C0485 + 85.00s (r 0.90),
   VID060 = C0485 − 173.26s (r 0.70). A number without a content check is a
   guess.
2. **Rebuild the real order of events from that clock** before choosing a
   single shot. It overturned the brief here: the new clothes (C0488, 11:42)
   came *before* the food (C0489, 11:44), not after.
3. **Look at every clip as a timeline strip**, one frame every 2–3s, rotated.
   A transcript does not show an empty toilet doorway, a camera whip, a
   finger over the lens, or which way someone's back is facing. Every one of
   those was in this shoot and would otherwise have been cut in.
4. **Read the Hebrew for every line that carries the story.** The machine
   translation inverted the father line ("for me" — the Hebrew is AGAINST
   me), turned *feed* into *eat* and *rebel* into *tired*. Write the corrected
   English into `cache/translate/<id>.json` (machine copy kept as
   `.bak-machine`), **timed from the Hebrew words**, not the rounded segments.
5. **Check whose mouth moves.** The best line in the shoot — *"if I have the
   strength to give someone food, I always give it"* — is the shawarma
   owner's, not Roman's. It became the second kindness beat: the owner
   promising to feed him again next time.
6. **Caption what was said, not what the brief assumed.** Roman says "a day and
   a half". "Two days" was Tal's question.
7. **Picture from the best angle, sound from the nearest mic.** The chest cam
   is inches from the speaker; the Sony is metres away on a loud street. The
   shirt scene is Sony picture with chest-cam sound (`push.audio`), lined up
   by the measured offset.
8. **Frame by hand when a face matters.** Autoframe aimed at Tal's profile on
   the hook and cut Roman's head off on the new-clothes payoff. Measure the
   face position off a still, set `{z, x, y, manual: true}`, and check the
   caption line (y 0.66) does not cross the speaker's mouth.
9. **No shots of Tal's back** (his rule). Where the only camera on a line is
   behind him, cut the line — "a place to rest, one metre by one metre" went.
10. **Pin every beat that matters** with `push.exact`. Snapping stretched the
    3-second hook to 8.8s and dragged the goodbye into a camera whip.
11. **Read every caption as English, then measure it** with
    `caption-sync.py` — and re-transcribe any window it flags, from the
    RENDERED file, before believing it (whisper writes "תודה" on silence).

### The checks that caught real defects — run all of them

| check | what it caught here |
|---|---|
| timeline strips of every clip | an empty doorway, a whip, a lens obstruction, Tal's back |
| read the Hebrew | an inverted meaning, three mistranslations, a misattributed line |
| caption-sync, then re-transcribe the flagged windows | captions over silence (9 -> 1) |
| build log: asked length vs rendered length | a 3s hook stretched to 8.8s |
| contact sheet of the render | a decapitated payoff, a hook aimed at the wrong person |
| luma per beat on the source | the new-clothes shot at 206 with 37% clipped |
| **decode the same frame from beat file and final** | **Sony shots washed out by the join (0/254 -> 16/236)** |

The last is the only way to see a colour-range bug — a contact sheet reads
each beat's own flag and looks fine. See LESSONS 57.

### What the footage could not give

- Sky already clipped to 255 in camera stays white. The exposure fix restores
  faces and skin; it does not invent highlights (8-bit source).
- No licensed music on the machine. The montage is delivered on natural sound;
  add a track from Instagram's own audio library at post time.
