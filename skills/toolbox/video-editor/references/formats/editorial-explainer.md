# Editorial explainer (MODE A + B mix)

The default. Nas-Daily / short-form-doc / SaaS-explainer energy. His footage and
guests carry the story; motion graphics explain the abstract parts; big stats
become full-screen moments. Most of his non-format videos are this.

Full detail: `EDITING-SYSTEM.md`. Plan file: `SCENE-PLAN.md`
(`npm run new -- <slug> "<Title>" vertical`).

## Method

1. Analyse all material — script, VO, footage, screenshots, logos, music, refs.
   Note what real footage exists and what's missing.
2. Write `SCENE-PLAN.md`: one timed block per beat — `Narration / Visual / Assets
   / Animation`. Approve before building.
3. Build from `src/components/`. 4. Preview. 5. Inspect stills. 6. Fix. 7. Render.

## Pacing

Something meaningful changes on screen every **1–3 s** — but don't force a cut on
a working shot. Important claims get visual emphasis. Large stats → full-screen
`<BigStat>` (e.g. "10.5 hours to recover" → `10.5 HOURS` slams in + a supporting
bar, not a highway clip).

## Visual hierarchy — best first

human footage → real story footage → product/UI footage → screenshots → maps →
data-viz → typography → diagrams → generated imagery. AI-generated visuals only
when there's no stronger real option.

## Mixing modes in one timeline

Example: him on camera → traffic footage → animated map → guest → product UI →
data-viz → real highway → giant `80%` → human ending. Use whichever mode explains
each moment.

## Components (`import from "../components"`)

`Frame` `Headline` `Captions` `BigStat` `AnimatedCounter` `LowerThird` `Callout`
`QuoteCard` `PhoneMockup` `BrowserMockup` `ScreenshotZoom` `BrollSequence`
`LogoReveal` `BarGraph` `ComparisonGraphic` `Timeline` `RouteMap` `AutoCut`.
Details in `references/motion-graphics.md`.

## Avoid

Corporate-cheese animation, transition spam, motion with no story reason, generic
AI gradients, floating 3D icons, clutter, anything that doesn't support the
narration.
