# Motion Prompt Mode (MODE B)

The premium motion-graphics layer of the system. Use it for a **section** of a
video or a whole promo — whenever polished motion, product/UI animation, data,
abstract explanation, or an Apple-launch-style reveal serves the story better
than footage. **Do not force this look on every video.**

## Two modes — pick per moment

| | MODE A — Real / Documentary | MODE B — Motion / Explainer |
|---|---|---|
| For | people, interviews, travel, kindness, street, real events | tech, SaaS, AI, stats, maps, product features, systems, abstract, promo reveals |
| Priority | **real footage > motion graphics** | **visual explanation + real product assets + motion graphics** |

Most strong videos **mix both** in one timeline (e.g. Tal on camera → traffic
footage → animated map → guest → product UI → data-viz → highway → giant `80%`
→ human ending). Use whichever mode explains each beat best.

## Workflow for a motion section

1. Duration. 2. Aspect ratio. 3. Analyse the script/source.
4. Convert to **4–7 timed beats**. 5. **One primary visual idea per beat.**
6. Define on-screen text (2–6 words). 7. Define animation + camera move.
8. Preview stills. 9. Build. 10. Review the visual result. 11. Fix weak
timing/composition. 12. Render.

For a full promo film, produce the **MP4** and optionally an **HTML/Player
preview**. Inside a larger Remotion video, HTML is optional — Remotion is the
final framework.

## Beat sheet (write BEFORE building — `compositions/<slug>/BEAT-SHEET.md`)

Each beat carries: **timing · narration · on-screen text · primary visual ·
motion · purpose**.

```
BEAT 1 — 0:00–0:03
Narration:     "This system sees the entire city."
On-screen:     THE ENTIRE CITY
Visual:        Dark Miami map appears from black; roads light cyan from downtown out.
Motion:        Slow camera push forward; network builds outward.
Purpose:       Establish scale.
```

`src/lib/beats.ts` (`Beat` type) + `<MotionSequence beats={...}>` render a beat
sheet as **hard cuts** (often stronger than a transition); a beat may carry an
`enterOverlay` (`LightSweep`, `ExpandingRing`, `Shockwave`).

## One idea per beat

One concept, one focal point, one message. Not five widgets / three charts /
paragraphs. The viewer must instantly know where to look.

## Text

Write for motion, not documents. **2–6 words.** `10.5 HOURS` · `174,000 EXTRA
TRIPS` · `ONE LIVE MAP` · `BEFORE TRAFFIC SPREADS`. Compress explanations into
statements. Lead with the strongest claim.

## Numbers get their own shot

`80%` · `10.5 HOURS` · `174,000` · `40 MINUTES AHEAD` · `$50` · `3 BILLION VIEWS`.
Emphasise with scale change, bloom, counter, shockwave, map reaction, graph
movement, background shift. Motion must communicate importance/scale — never
decoration. Use `<BigStat>` (+ `<Shockwave>` / `<ExpandingRing>` overlay).

## Dark motion language

- **Background** — true/near-black. No generic charcoal gradient unless the design motivates it. `<NeonField>`.
- **Light reveals objects** — rim light, bloom, controlled glow, moving reflections, lit edges, light trails, subtle volumetrics.
- **Glass** — dark matte, with depth, reflection, controlled transparency, physical lighting, clear hierarchy. `<GlassTile>` (`depth` prop for parallax layers). Not overused frosted-glass UI.
- **Colour** — restrained travelling spectrum: cyan/blue → violet → magenta/warm. `neonArc(t)`. A supplied **brand colour becomes the hero** (`palette.accent`); build supporting colours around it — woven in, not pasted on.
- **Typography** — large hero words, short phrases, strong contrast, restrained weights, purposeful tracking. Reveals: typing, mask, character illumination, scale, tracking expansion, light sweep, kinetic word replacement (`<HeroWord>`, `<TypeReveal>`). Typing may flash the last-typed character in accent then cool to ink. Don't overuse typing.
- **Camera** — treat motion graphics as cinematography: push-in, pullback, parallax, controlled orbit, rack-focus, depth changes, macro, overhead, perspective shifts (`<PushIn>`). Every move serves reveal / scale / focus / transition / excitement. No constant meaningless motion.
- **Transitions** — emerge from the visual: expanding ring, light sweep, object passing camera, map zoom, screen push-in, match cut, shape morph, shockwave, camera move, UI element expanding into the next scene, **or a hard cut** (often strongest). No random transition packs.

## Product UI

Don't just show a static screenshot. Consider rebuilding key UI natively in
Remotion, animating cursor movement, zooming to the relevant feature,
highlighting fields, connecting an action to its result, simplifying a busy
dashboard, animating data appearing, recreating low-quality screens cleanly.
Stay visually accurate where the real product matters — **never invent
functionality the product doesn't have.**

## Script length

15–20s ≈ 4–5 core ideas · 30s ≈ 5–7. Too many points → pick the strongest, don't
cram. Strong scripts have concrete actions, numbers, transformations, problems,
outcomes. ("It reads every road in Miami and spots traffic before it spreads" ≫
"An innovative enterprise platform powered by advanced technology.")

## Refinement vocabulary

| Note | Action |
|---|---|
| "Beat three is too fast" | stretch only that beat's timing; hold the rest |
| "Make it pop more" | more contrast / scale / bloom / colour energy / impact — not clutter |
| "Too busy" | fewer simultaneous elements, stronger single focal point |
| "Colder" / "Warmer" | shift supporting palette toward cyan / toward magenta (respect brand hero) |
| "It looks laggy" | inspect frame timing, easing, interpolation, asset perf |
| "Different opening" | rethink the hook and first shot, not just the transition |
| "Use #6633EE" | rebuild the palette around that colour as hero |
| "Drop this scene" | remove the beat, redistribute its time across neighbours |

Given a specific note, **preserve everything already working.**

## Quality checklist (every finished motion sequence)

Story readable without a paragraph? · One obvious place to look? · Every beat has
time to register? · Smooth deliberate easing? · Every word readable on a phone? ·
Palette controlled? · Intentional foreground/background depth? · No accidental
overlap / clipping / jitter / abrupt easing / unfinished state? · Consistent
creator/brand feel across scenes? · Nothing reads as generic AI slop? Fix any "no".

## Generated shots — see `prompts/`

When a beat needs generated video/imagery, write a full shot prompt (subject,
environment, composition, camera, camera movement, lighting, motion, material,
depth, style, aspect, duration). Reference Open-Higgsfield-AI vocab. Save
prompts that land well into `prompts/saved/`.
