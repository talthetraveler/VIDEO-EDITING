---
name: 02-multicam-and-coverage
description: Coverage logic for single-POV footage — cutaways, interleaving people, continuity, reframing 3:4 into 9:16.
---

# 02 · Coverage & Multicam

There is no multicam here. There is **one POV camera on his face**, which means
coverage has to be *manufactured* from other clips. That is the whole craft of
this section.

## The interleave

Straight question → answer → question → answer is flat. The shape that works:

```
line (person A)  →  reaction (person B)  →  line (person C)  →  reaction (person D)
```

Cutting to a **different person's** face between lines is what makes a
compilation feel like a world instead of a list. The reaction does not have to
be to that line — it has to be *true in tone*.

## Sourcing coverage

1. **Reaction beats** (`scripts/extract-reactions.mjs`) — after-line, echo, and
   gap sources. Placement is trusted; the `kind` label is not.
2. **Silent visual moments** — a strong CLIP hit with no speech in the window is
   still a usable beat. Silence is not delete.
3. **B-roll from the same interaction** — food, street, hands, walking away.
   Always prefer b-roll from the *same* location and time of day.

## Continuity rules

- Do not cut from a person to themselves at a different distance without at
  least one intervening beat — it reads as a jump cut.
- Keep light continuity: don't put a golden-hour beat between two midday beats.
- Don't place two beats from the same clip back-to-back unless they're
  contiguous in time.
- Never imply an exchange between two people who were never in the same
  conversation. Interleave for *rhythm*, not to fabricate a dialogue.

## Reframing 3:4 → 9:16

Meta Ray-Ban footage is 3:4. The target is 9:16.

- `objectFit` is **silently ignored** by `<Video>` from `@remotion/media`
  4.0.520. Setting it produces letterboxing with no warning.
- Use an absolute-centred cover instead:

```jsx
<AbsoluteFill style={{ overflow: "hidden" }}>
  <Video
    src={url(b.src)}
    trimBefore={Math.round(b.startSec * fps)}
    style={{
      position: "absolute", top: "50%", left: b.objectPosition ?? "50%",
      translate: "-50% -50%",
      minWidth: "100%", minHeight: "100%", width: "auto", height: "auto",
    }}
  />
</AbsoluteFill>
```

- `objectPosition` per beat is the manual reframe knob — push it left or right
  when the subject sits off-centre.
- Faces must not be cropped at the chin or forehead. Check on stills, not in
  theory.

## Ordering by real time

Meta export **filename numbers are not capture order.** Sort by container
`creation_time`. File mtimes are download stamps and are useless.

## Related

`01-longform-to-short`, `06-story-structure`,
`.claude/skills/video-editor/references/batch-indexing.md`.
