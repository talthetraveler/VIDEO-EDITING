# Cutout reel

**What it is:** he is masked/keyed out of his talking footage and composited over
**full-screen images** that change with each line and **illustrate the noun
literally**. Same literal-illustration rule as the head-image reel; the difference
is he sits *on* the image, not *under* a plate.

NOT the head-image reel (he stays un-touched, picture floats above him —
`head-image-reel.md`). NOT the Jack montage (`broll-montage.md`).

## Rules carried over

- **Never cut him off before he finishes** — `../clean-cuts.md`.
- **Captions: soft drop shadow, never stroke.** 2 lines max, break on speech.
- **Literal illustration** — the image is the noun just said.
- **His own photos when the line is about his body or his story** (see image rules
  in `head-image-reel.md`).
- **safesearch ON**; eyeball the final contact sheet; concrete-object queries.

## Build (this repo)

- Mask: run a matte on the talking take (his existing pipeline uses
  `cutout-format/pipeline/`). In Remotion, composite the pre-matted transparent
  video (`<Video>` with alpha, or `<OffthreadVideo>`/`@remotion/media`) over a
  `<CanvasImage>` background per beat.
- Background image: `objectFit: cover`, full frame. A slow push-in is allowed
  here (it's a full-screen image, not his face) but keep it subtle.
- Caption: bottom third, inside the mobile safe area, drop shadow.

## Spec status

The measured layout numbers for this format were not handed over with the
head-image spec. Before a first build, either ask him for the cutout build folder
/ reference post, or reverse-engineer from a shipped example the way
`head-image-reel.md` was done, and write the numbers back into this file.
