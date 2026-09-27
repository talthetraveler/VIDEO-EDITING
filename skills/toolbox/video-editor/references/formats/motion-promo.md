# Motion promo (MODE B)

Premium dark motion-graphics film from a script or website. Apple-product-reveal
crossed with synthwave. Use for tech / SaaS / product / launch / data — NOT for
human stories (those are footage-first). Selective: don't force this look onto
every video.

Repo: `neonTheme` + `src/components/motion/`. Full spec: `MOTION-PROMPT.md`.

## Workflow

1. Duration. 2. Aspect. 3. Analyse the script. 4. **4–7 timed beats.**
5. ONE visual idea per beat. 6. On-screen text (2–6 words). 7. Animation + camera
move. 8. Preview stills. 9. Build. 10. Review. 11. Fix weak timing/composition.
12. Render. Full promo → MP4 (+ optional HTML/Player preview).

## Beat sheet — write first (`BEAT-SHEET.md`)

Each beat: **timing · narration · on-screen text · primary visual · motion ·
purpose.**

```
BEAT 1 — 0:00–0:03
Narration:   "This system sees the entire city."
On-screen:   THE ENTIRE CITY
Visual:      Dark map appears from black; roads light cyan from downtown out.
Motion:      Slow camera push forward; network builds outward.
Purpose:     Establish scale.
```

`src/lib/beats.ts` (`Beat` type) + `<MotionSequence beats={…}>` render it as
**hard cuts** (usually stronger than a transition); a beat can carry an
`enterOverlay` (`LightSweep` / `ExpandingRing` / `Shockwave`).

## One idea per beat

One concept, one focal point, one message. Not five widgets / three charts /
paragraphs. The viewer instantly knows where to look.

## Numbers get their own shot

`80%` · `10.5 HOURS` · `174,000` · `40 MINUTES AHEAD`. Emphasise with scale,
bloom, counter, shockwave, map reaction, graph movement, bg shift. Motion must
communicate scale/importance, never decorate. `<BigStat>` + `<Shockwave>`.

## Dark motion language

- **Background** true/near-black (`<NeonField>`). No charcoal gradient unless the
  design motivates it.
- **Light reveals objects** — rim light, bloom, controlled glow, reflections, lit
  edges, light trails, subtle volumetrics.
- **Glass** — dark matte, depth, reflection, controlled transparency, physical
  lighting, clear hierarchy (`<GlassTile>`, `depth` prop for parallax layers).
- **Colour** — restrained travelling spectrum: cyan/blue → violet → magenta/warm
  (`neonArc(t)`). A supplied brand colour becomes the **hero** (`palette.accent`);
  build supporting colours around it — woven in, not pasted on.
- **Typography** — large hero words, short phrases, restrained weights, purposeful
  tracking. Reveals: typing, mask, character illumination, scale, tracking
  expansion, light sweep, kinetic word replacement (`<HeroWord>`, `<TypeReveal>`).
  Typing flashes the last character in accent then cools to ink. Don't overuse.
- **Camera** — push-in, pullback, parallax, controlled orbit, rack-focus, depth
  change, macro, overhead (`<PushIn>`). Every move serves reveal / scale / focus /
  transition / excitement. No constant meaningless motion.
- **Transitions** — emerge from the visual (expanding ring, light sweep, object
  passing camera, map zoom, screen push-in, match cut, shape morph, shockwave,
  camera move, UI expanding into the next scene) **or a hard cut**. No transition
  packs.

## Product UI

Don't just show a screenshot. Rebuild key UI natively, animate the cursor, zoom to
the feature, highlight fields, connect an action to its result, simplify a busy
dashboard, animate data appearing. Stay accurate — **never invent functionality
the product doesn't have.**

## Script

15–20 s ≈ 4–5 ideas · 30 s ≈ 5–7. Too many points → pick the strongest. Lead with
the sharpest line. Strong scripts: concrete actions, numbers, transformations,
problems, outcomes.

## Refinement notes → surgical changes

"beat 3 too fast" → stretch that beat only. "make it pop" → more contrast / scale /
bloom / colour energy, not clutter. "too busy" → fewer elements, stronger focal
point. "colder/warmer" → shift supporting palette toward cyan / magenta (keep
brand hero). "laggy" → check easing / interpolation / asset perf. "different
opening" → rethink hook + first shot, not the transition. "use #6633EE" → rebuild
palette around it as hero. "drop this scene" → remove beat, redistribute time.
**Preserve everything already working.**

## Quality checklist

Story readable without a paragraph? One obvious place to look? Every beat has time
to register? Smooth deliberate easing? Every word readable on a phone? Palette
controlled? Intentional depth? No overlap / clip / jitter / abrupt easing /
unfinished state? Consistent brand feel across scenes? Nothing reads as AI slop?
Fix any "no".
