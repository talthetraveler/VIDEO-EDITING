# The head-image reel

Reverse-engineered 2026-08-17 from `instagram.com/p/DbUOEYuCZlm`. Every number is
measured; every rule exists because a build shipped wrong without it.

**What it is:** he talks to camera. A picture sits in the empty space above his
head and changes with each line; the caption sits directly under the picture.
Hard cuts, no motion. The picture **illustrates the noun literally**.

NOT the cutout format (masked over full-screen images — `cutout-reel.md`). NOT
the Jack b-roll montage (`broll-montage.md`). NOT the one-shot no-overlay format
(`talking-head.md`).

## The three enforced rules (do not relitigate)

1. **His footage is never moved, scaled, cropped or padded.** A build that shifted
   him down and blurred the exposed band was rejected: *"you're doing something
   that kind of like cuts my face and also cuts the video at the top."* The
   picture shrinks instead.
2. **Never cut him off before he finishes.** See `../clean-cuts.md`. Single most
   repeated note in the project. When in doubt, cut LATER.
3. **Captions get a soft drop shadow, never a stroke/border.**

## Layout (1080×1920, 30 fps CFR)

Reference plate fitted in 990×630, bottom pinned at `0.428·H`, caption beneath.
His framing is tighter than the reference's, so measure per video:

- **Plate**: top at `0.030·H`; **bottom = his head-top p25**, measured on the CUT
  take by dark-hair detection in the central 44 % of columns at 3 fps. Aspect
  preserved, max width `0.90·W`. Comes out 310–500 px tall. It may graze his hair
  — he allowed *"if they cover my hair just a little bit, that's fine."*
- **Caption**: top-anchored `0.006·H` under the plate, so it lands **on his hair,
  never his face**. His chin is ~`0.78·H` and Instagram UI covers the bottom
  ~20 % — there is nowhere else.
- **Font**: SF Pro Bold (`/System/Library/Fonts/SFNS.ttf` +
  `set_variation_by_name("Bold")`). Start 60 px, step 56 / 52 / 48 / 44 until it
  fits **two lines max** (a third reaches his forehead). Max width `0.86·W`.
- **Shadow**: black text on its own RGBA layer at `(+3,+5)`, `stroke_width=3`,
  `GaussianBlur(7)`, `alpha_composite` under the white text. No outline on the
  white text.

## Images

One search per beat (`ddgs`, e.g. `cutout-format/pipeline/images.py`).

- **safesearch ON, always** — it defaulted off and returned explicit images for
  "blank to do list notepad on a desk". Eyeball a contact sheet of the FINAL
  picks before rendering.
- Queries name a **concrete thing**. Stock-photo-shaped queries ("empty desk with
  closed laptop") return junk — vans, anatomy diagrams, anime. If `stock=`
  dominates the report, rewrite around a specific object, don't retry.
- Reusing a neighbouring beat's other candidate index is often faster and safer
  than a fresh search.
- **His own photos when the line is about his body or his story** — `~/Downloads/תמונות`,
  `/Volumes/Seagate/the video/` (read in place, never copy off the drive). "I got
  the six pack" over a stock torso is exactly what he complained about.

## Beats

- Split the cut into caption beats on clause boundaries.
- **Beat counts must not change between runs** or the images unmap. Whisper drops
  punctuation run-to-run, merging beats — patch it in a word-level `FIX` list
  (e.g. `["yesterday","that's"] → ["yesterday.","That's"]`) rather than remapping.

## Run order (original Mac pipeline, `~/אינסטגרם/head-image-format/`)

```
tx_aroll.py         transcribe the cut takes (writes wavs)
recut.py            place boundaries -> cuts_v3.json
verify_junctions.py the four mandatory checks (../clean-cuts.md §4)
edl.py              cut video+audio together -> aroll_vN.mp4
beats.py            split into caption beats -> beats.json
enhance.py          resemble-enhance -> clean_vN.wav
build4.py           render -> out/vN.mp4
gate.py             spec / audio / overlay gate
syncheck.py         captions vs rendered audio
```

## Porting status (this repo, Windows)

- **Cut**: `npm run tighten` covers filler/pause; retake selection + boundary
  placement = follow `../clean-cuts.md` by hand until ported.
- **Render**: rebuild `build4.py` as a Remotion composition — his `<Video>`
  untouched at full frame (rule 1), a `<CanvasImage>` plate sized to head-top p25,
  `<Captions>` (drop shadow, no stroke) anchored under the plate. Head-top p25
  detection is a small script over sampled frames.
- **Images**: `npm run generate` can produce a plate when search fails, but
  literal web images are preferred here — keep the `ddgs` search.
- **Fonts**: SF Pro isn't on Windows; use Inter Bold via `src/lib/fonts.ts` or
  bundle SFNS as a local font if rendering on his Mac.
