---
name: 05-motion-graphics
description: The premium dark neon/glass motion layer — beat sheets, one idea per beat, number shots. Used selectively.
---

# 05 · Motion Graphics

**Used selectively.** Most street-conversation videos want no motion graphics at
all. This layer is for promos, explainers, stat-driven sections, and title
sequences — not for every video.

Full language lives in `MOTION-PROMPT.md` (MODE A vs MODE B, dark-motion
vocabulary, refinement vocabulary, quality checklist). This file is the operating
summary.

## Beat sheet first

Every motion section is planned as **4–7 beats** before any code:

```
BEAT 1 — <one visual idea>  | on-screen: <2–6 words> | 1.4 s
BEAT 2 — ...
```

Rules:
- **One visual idea per beat.** If a beat needs two sentences to describe, it's
  two beats.
- **2–6 words on screen.** Never a paragraph.
- **Every number gets its own shot.** A statistic shared with other content is a
  statistic nobody read.
- The visuals must **explain** the narration, not accompany it.

## The look

Dark ground (near-black, not pure black), glass panels with real blur and a
hairline edge, restrained neon accents, depth via layering not drop shadows.
Type is the hero; graphics support it.

- `neonTheme` for promos, `editorialTheme` everywhere else.
- Motion is **short and confident**: 8–14 frame entrances, ease-out, no bounce,
  no long fades.
- Nothing moves without a reason. If two things move at once, one of them is
  probably wrong.

## Remotion rules

- Animate with `useCurrentFrame()` + inline `interpolate()`.
- Use `scale` / `translate` / `rotate` — **not** `transform`.
- **No CSS transitions or animations.** They don't exist during rendering and
  produce a still frame in the output.
- Build reusable components in `src/components/motion/`; fold approved patterns
  back rather than writing one-off graphics.

## Quality checklist

Before calling a motion section done, render stills and confirm:

- [ ] Text is inside the safe area at every beat
- [ ] No element enters and exits within the same 6 frames
- [ ] Every number is legible at phone size (view the still at 30% scale)
- [ ] Nothing overlaps a face
- [ ] The last frame of each beat is a composition you'd screenshot
- [ ] No CSS animation anywhere in the tree

## Related

`MOTION-PROMPT.md`, `.claude/skills/video-editor/references/motion-graphics.md`,
`references/formats/motion-promo.md`.
