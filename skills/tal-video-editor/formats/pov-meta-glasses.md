# FORMAT — POV STREET (greetings & questions)

**This is Tal's signature format.** Meta Ray-Ban POV, first person, hand visible
reaching into frame. He walks up to a stranger, says one thing, and the whole
video is what their face does next.

Covers: *"what makes you happy"*, *"Shabbat Shalom / Salam Aleikum"*,
*"Shana Tova"*, flowers, water, hugs, notes — anything where the shape is
**approach → one line → reaction → next person.**

Everything below is **measured off Tal's own finished, posted edits**, not
inferred. Sources in `projects/_refs/tal/`.

---

## 1. MEASURED REFERENCES — his own cuts of this exact format

| His edit | Dur | Cuts | Cuts/min | Avg shot |
|---|---|---|---|---|
| *Love is the answer* (what makes you happy) | 36s | 16 | **26.5** | 2.1s |
| *The side of Israel you do not see online* (Shana Tova) | 59s | 30 | **30.4** | 1.9s |
| *I love Israel for the people* (Shabbat Shalom) | 45s | 12 | **15.7** | 3.5s |

**Target: ~2 seconds per person, 15–30 cuts/min.** One exchange per shot. The
cut IS the structure — every cut is a new face.

### ⚠ MEASUREMENT TRAP — do not repeat this mistake

ffmpeg `select='gt(scene,N)'` is **threshold-sensitive on similar-looking
footage**. Beach after beach after beach scores low even at a real cut.

| Threshold | *Love is the answer* |
|---|---|
| 0.30 | 5 cuts — **wrong** |
| 0.20 | 16 cuts — **matches the dialogue** |
| 0.12 | 20 cuts |

At 0.30 this file once recorded "his biggest reel has ZERO cuts." At 0.20 it has
4. **Always measure at 0.20, and sanity-check against the transcript** — if the
transcript shows 18 exchanges, 5 cuts is a measurement error, not a style.

---

## 2. STRUCTURE

```
[0-1s]  FIRST FACE, already mid-approach. Never open on an empty street.
        Title pill appears immediately and holds ~4-5s.
[…]     approach → the line → their reaction → CUT to next person
        ~2s each. Do not linger once the face has done its thing.
[mid]   one THESIS line dropped in Tal's own voice, e.g.
        "That's the Israel that the media is not seeing."
[end]   warmest reaction of the batch, or the funniest. Never a walking shot.
```

**Alternate the greeting.** Tal: *"you can do Shabbat Shalom, Salam Aleikum,
back and forth."* The switching between Jewish and Muslim greetings IS the
content, not decoration.

**Cast for visible diversity — deliberately.** Tal: *"I choose like a blonde
woman then a black guy — you want to show that diversity."* Order the cut so
consecutive people look different from each other: age, dress, hijab/kippah,
skin tone, tourist/local. Never three similar people in a row.

**Everyone is happy.** Tal: *"they just need to be happy, happy, happy."*
No confusion, no awkwardness, no one saying no. Cut those, even if the line is
funny.

---

## 3. CAPTIONS — measured off *Love is the answer*

- **GOLD/YELLOW, ALL CAPS, heavy bold, black outline.** Not white.
- **2–3 words on screen at a time.** Observed: `ME SORRY` · `FRIEND HAHAHA` ·
  `YOU HAPPY` · `HER OH` · `WHAT MAKES`
- **Position: ~72% of frame height** (y≈1380 on 1080x1920). Lower third, but
  clear of the very bottom.
- **One caption on screen at a time. Never two.** Groq word timestamps overlap
  when people talk over each other and the list is not time-sorted — sort, then
  force strictly non-overlapping windows, or they render on top of each other.

**A second system exists** (seen on his account-wide reels): white text with the
key word alone in gold. Use that only when a reference for that specific video
shows it. For this format, all-gold is correct.

---

## 4. TITLE CARD

White **rounded** pill, top-centre, black bold ALL-CAPS, two lines, flag emoji
inline. Holds the first ~4-5s, then gone.

```
ASKING PEOPLE IN ISRAEL 🇮🇱
WHAT MAKES THEM HAPPY
```
```
MEETING A LEBANESE 🇱🇧
IN ISRAEL 🇮🇱
```

Rendered by `scripts/make-title.py` — ffmpeg `drawtext` can only draw a hard
rectangle and it looks cheap next to his own reels. Keep it under 1080px wide;
drop to 46-48px font if it overflows.

---

## 5. RULES THAT APPLY HERE (from the bible, repeated because they bite here)

- **Never cut anyone off.** 0.12s before the first word, ~0.45s after the last.
  At 2s per shot the temptation to trim tight is strongest exactly here.
- **If they reply, the reply is in the shot.** A question and its answer are one
  unit and must never be split across a cut.
- **Verify against the render, not the transcript.**
  `node system/scripts/selfreview.mjs <EDIT.json> <render.mp4>` before it is sent.
- **Under 60 seconds** unless the story genuinely needs more.
- Music optional. These carry on voices and faces alone.

---

## 5. POV "MEETING A <RELIGION> IN ISRAEL" — the single-subject POV (measured 2026-09-28)

**A different format from the greeting compilation above**, and currently his
best: the two top reels of his last 10 (**1M** `Ddt3vEkMYVz`, **536K**
`Ddw_hauoMDq`, both collabs with @thesocialaccords). Full measurement:
`skills/toolbox/tal-reference-library/instagram-2026-09-28/talthetraveler.md`.

| | compilation (sections 1-4 above) | **meeting a <religion>** |
|---|---|---|
| people | many, ~2 s each | **one** (or one + a friend), a full conversation |
| runtime | 36-59 s | **63-72 s** |
| cuts/min | 15-30 | **~2 (536K: essentially one take) to ~18 (1M)**; holds of 4-7 s |
| captions | gold ALL CAPS (measured on *Love is the answer*) | **WHITE**. 1M: bold italic ALL CAPS, **one word**, y~0.70. 536K: lowercase serif 2-3 words, y~0.69 |
| title pill | ~4-5 s, y~0.11 | white rounded pill "POV: MEETING A MUSLIM IN ISRAEL", **y~0.15-0.19, 3-9 s** |

**The shape:**
1. Title pill from frame 0 naming the religion.
2. Open mid-approach on a face.
3. The identity reveal happens IN the dialogue ("you are Muslim, I am Jewish"
   -> "we're brothers"), Tal the curious outsider.
4. **The stranger says the thesis** ("we're all human, it doesn't matter").
5. Something shared on screen: food, a hug, a tourist asked about Israel.
6. End warm ("Welcome to Israel, bro" / "Shabbat Shalom"); SA end card on the 1M.

The 1M has 3 scenes with food as the thread, one-word captions, a music bed and
more cuts; the 536K is one take. **What both share is the religion in the
title, not the pacing.** Across his last 10, the top four each name a religion
or a Jewish holiday up front (a pattern to test, n=10).

**Caption colour, resolved by format:** white here and in THE STANDARD
(2026-09-24); gold stays for the greeting compilation it was measured on.
**Open question for Tal:** the 536K's lowercase serif breaks THE STANDARD's
uppercase sans, and the pipeline has no serif style. Default stays white
uppercase sans until he says otherwise.
