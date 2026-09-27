# THE LOOK AND THE SOUND — measured, not guessed

Tal, 2026-09-23, after rejecting a cut: *"the color grading is pretty shit ...
the captions should be bigger and different ... you can use sound effects or
sound design ... imagine you're the best editor, but use my video editing
skills."* He then handed over one reference video and three caption
screenshots. **Everything in this file is measured off those.** Re-measure
before changing any of it; do not adjust by eye.

## The reference

`Spread love 💗.mp4` — 720x1280, 25fps, 45.9s. Tal: *"the best reference ... in
terms of the color grading and the music."* Measured with `signalstats`:

| | reference | why it matters |
|---|---|---|
| YAVG median | **102** | and remarkably *stable* — the whole film sits between 100 and 106. Ours ranged 100-143, which reads as flicker. |
| YMIN median | **0** | a real black point. Hazy footage that never reaches 0 looks milky. |
| YMAX median | **255** | highlights are allowed to reach the top. |
| SATAVG median | **8.6** | see the caveat below. |
| music bed | **present** | low-band (60-250Hz) energy is **2.8x** the speech band during the quietest 25% of the film. |

### The grade

```
curves=all='0/0 0.04/0.01 0.25/0.265 0.55/0.61 0.85/0.92 1/1',
eq=saturation=1.42:gamma=1.01,colorbalance=rm=0.015:bm=-0.015
```

Plants the black point (kills the Damascus Gate haze), lifts the mids **above**
the line, rolls the highlights just under clipping so a white shirt in direct
sun keeps texture. `call-my-mother` now measures **YAVG 102.0** — on the
reference exactly.

> **The trap that cost a version.** `eq=contrast` pivots around mid-grey and
> LIFTS the black point — the opposite of what hazy footage needs. And the
> first curve written to replace it crushed the picture to **YAVG 90.5**:
> darker than the thing it was copying. Planting the black point is right;
> dragging the midtones down with it is not. **Always re-measure YAVG against
> the reference after touching the curve.**

> **SATAVG is NOT comparable across different footage.** Ours reads 5.1 against
> the reference's 8.6, and chasing that number would turn skin orange — the
> scene is a white polo shirt and grey limestone, which cannot be as saturated
> as the reference's. Use YAVG as the target; treat SATAVG as a sanity range.

## The captions

> **SUPERSEDED IN PART, 2026-09-24.** `EDITING-DOCTRINE.md` 2 — Tal's own
> written standard — sets the house caption as **bold white uppercase with a
> dark outline or shadow, 1-3 words, lower-middle of frame**, with an optional
> smaller original-language line under the English. That is also what he did in
> his own coffee-shop cut. **White is the default now**; the gold key word
> below is for a hook line, not every caption. Everything else here — the size,
> the stroke, the PNG-not-drawtext reasoning, the fit measurement — still
> stands and is still the implementation.

Tal, pointing at three reels (Acquired / Hormozi / Steve-O): *"use the format
from the middle picture ... you see how it's big and nice."*

**The style:** Arial Black, uppercase, **white body with ONE word per line in
gold**, black stroke at 10% of the font size, soft drop shadow, max two lines,
94px base, auto-shrinking to fit 980px.

**Why it is a PNG and not `drawtext`.** drawtext takes ONE `fontcolor` for the
whole string, so a gold word inside a white line is impossible without
computing each word's x by hand and stacking a filter per word.
`scripts/render-caption.py` measures and draws the line in PIL; the result is
composited with `movie=` + `overlay`.

**The key word** is the longest non-stopword of 4+ letters, ties going to the
later one (a payoff usually lands at the end of a line).

> The previous style was 78px **all-gold**. On this footage the two largest
> areas are a white polo shirt and a sunlit wall, and gold has almost no
> contrast against either — the captions were close to invisible. Bigger alone
> would not have fixed that.

## The sound

**SFX are available** at `skills/toolbox/media-use/audio/assets/sfx/` — whoosh,
whoosh-short, whoosh-cinematic, impact-bass, riser, pop, sparkle, chime, click.

**MUSIC IS NOT.** There is no music library on this machine — only
`hospital-singing.wav`, which is diegetic. The reference's bed cannot be lifted
from it: CLAUDE.md §1 Rights forbids reusing third-party music unless Tal
supplies it and confirms the rights. **Say the music is missing rather than
shipping a silent cut and calling it finished.**

**Match the device to the film.** A whoosh on every cut is a MrBeast/Hormozi
device. `call-my-mother` is a boy telling his mother he loves her at Damascus
Gate — a whoosh there would be vandalism. Percussive SFX belong on the
fast-cut formats (`social-accords`, montage), not on a quiet human story.
