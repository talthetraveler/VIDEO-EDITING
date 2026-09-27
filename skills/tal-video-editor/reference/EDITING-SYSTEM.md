# Tal's AI Video-Editing System

A reusable Remotion project for building **fast-paced, visually-explained social
videos** (Nas Daily / short-form doc / SaaS-explainer energy). One project, many
videos. Default output is **vertical 9:16**.

The goal: drop in a script + voiceover + a folder of footage, say **"edit this"**,
and get a polished cut where the visuals actively explain the narration — not
subtitles over a talking head.

---

## The workflow (every project)

1. **Analyse all material first** — script, VO, footage, screenshots, logos,
   music, refs. Note what real footage exists and what's missing.
2. **Write the scene plan** in `system/src/compositions/<slug>/SCENE-PLAN.md` — one
   timed block per beat: `Narration / Visual / Assets / Animation`. Get it
   approved before building.
3. **Build** with the component library. New project: `npm run new -- <slug> "<Title>" vertical`.
4. **Preview**: `npm run studio` → open `http://localhost:3000/<CompId>`.
5. **Inspect** — render stills (`npx remotion still <CompId> --frame=N --scale=0.5`)
   or the Studio. Look for: overlapping text, empty frames, weak hierarchy, bad
   crops, unreadable captions, limp transitions, pacing dead spots.
6. **Fix weak sections**, re-inspect.
7. **Render** only when asked: `npm run render <CompId> output/<slug>.mp4`.

### Pacing rules

- Something meaningful changes on screen every **1–3s** — but don't force a cut
  when a shot is working.
- Important claims get visual emphasis.
- Big stats become **full-screen animated moments** (`<BigStat>`), not a stock clip.
  _"Traffic took 10.5 hours to recover"_ → `10.5 HOURS` slams in with a supporting
  bar, not a highway shot.

### Visual hierarchy (what to show, best first)

human footage → real footage of the story → product/UI footage → screenshots →
maps → data-viz → typography → diagrams → generated imagery/video.
AI-generated footage is a fallback for when there's no stronger real visual.

### Avoid

cheesy corporate animation, transition spam, motion with no story reason,
generic AI gradients, floating 3D icons, clutter, anything that doesn't support
the narration.

---

## Project layout

```
public/
  footage/ voiceover/ images/ screenshots/ screen-recordings/
  logos/ music/ sfx/ generated/          # + per-project subfolders: <area>/<slug>/
src/
  theme/        formats.ts, theme.ts      # house style, format presets, safe sizing
  lib/          animations.ts, safe-area.ts, fonts.ts, media.ts, voiceover.ts
  components/    reusable UI + index.ts barrel (import everything from "../components")
  graphics/      BarGraph, ComparisonGraphic, Timeline
  maps/          RouteMap (no-key stylised; use remotion-maps skill for real maps)
  captions/      Captions.tsx (TikTok-style, safe-area aware)
  compositions/  <slug>/  → one real video per folder + its SCENE-PLAN.md
  generate/      prompt compiler + model registry + provider adapters (Open-Higgsfield re-impl)
  Root.tsx       composition registry
scripts/         new-video.mjs, tighten.mjs, generate.ts, generate-voiceover.ts, lib/
skills/          auto-video-editor/ (vendored macOS original, reference)
prompts/         generation prompt library (categories/, saved/)
output/          renders (gitignored except .gitkeep)
```

---

## Component library — `import { X } from "../components"`

Every component takes a `theme` (defaults to `editorialTheme`). Sizes are authored
against a 1080-wide frame and scaled via `scaleToWidth()`.

| Component | Use for |
|---|---|
| `Frame` | scene root — paints theme bg + vignette. One per scene. |
| `Headline` | big statement text, word-stagger in. `accentWords` to colour key words. |
| `TitleCard` | hook/section title — bold WHITE ALL-CAPS, upper third, drop shadow, emoji, optional list number (his @talthetraveler style). |
| `Captions` | TikTok-style caption track from a `Caption[]`. Sits in mobile safe area. `emphasize` keeps stats/names in accent; `variant="transcript"` = small pill transcript up top. |
| `BigStat` | full-screen stat moment: kicker + `AnimatedCounter` + context + optional `viz`. Shockwave ring. |
| `AnimatedCounter` | number that counts up; auto-shrinks to fit width. |
| `LowerThird` | name / role / location tag, slides from an edge. |
| `Callout` | pointer + label annotating a spot (`x`/`y` as %). |
| `QuoteCard` | pulled quote / tweet / testimonial, line-by-line. |
| `PhoneMockup` / `BrowserMockup` | shell for screen recordings, screenshots, UI. Put media as children. |
| `ScreenshotZoom` | Ken-Burns punch-in on a still (`focus` point). |
| `BrollSequence` | rapid B-roll montage, punch-in + cross-dissolve per clip. |
| `LogoReveal` | end card / brand stamp with light sweep. |
| `BarGraph` | horizontal bars, staggered grow, values count up. `highlight` a bar. |
| `ComparisonGraphic` | before/after or them/us split with a wipe reveal + "vs". |
| `Timeline` | vertical event timeline, spine draws down, nodes pop. |
| `RouteMap` | stylised A→B route on an abstract grid (no API key). |
| `AutoCut` | plays only the kept spans of a `keep.json` (output of `npm run tighten`) — the filler/pause-cut talking-head clip, rendered by Remotion. |

Multi-scene videos use `<TransitionSeries>`; keep `durationInFrames` inlined so
they're editable in Studio. Voiceover-timed videos use `voiceoverMetadata()` /
`captionsToScenes()` from `src/lib/voiceover.ts` in `calculateMetadata`.

Add reusable parts here rather than rebuilding per video. As Tal approves
patterns, fold them back into these components.

---

## Two visual modes

- **MODE A — Real / Documentary** (`editorialTheme`): people, interviews, travel,
  kindness, street, real events. Priority: **real footage > motion graphics**.
- **MODE B — Motion / Explainer** (`neonTheme` + `src/components/motion/`): tech,
  SaaS, AI, stats, maps, product features, systems, abstract, promo reveals.
  Priority: **visual explanation + real product assets + motion graphics**.

Most videos **mix both** in one timeline. Full details, beat-sheet format,
dark-motion language, refinement vocab and the quality checklist live in
**`MOTION-PROMPT.md`**. MODE B components:

| Component | Use for |
|---|---|
| `NeonField` | true-black bg + one restrained glow travelling the neon arc |
| `GlassTile` | dark matte glass panel with depth/lit-edge; `depth` for parallax layers |
| `HeroWord` | kinetic word replacement (hook / manifesto beat) |
| `TypeReveal` | typing reveal; last char flashes accent then cools to ink |
| `DataStream` | light trails: many inputs → one hub |
| `PushIn` | virtual camera move over a scene (in/out/pan, timed) |
| `MotionSequence` + `Beat` | render a beat sheet as hard cuts; per-beat `enterOverlay` |
| `ExpandingRing` / `LightSweep` / `Shockwave` | visual-native transitions & stat slams |

Brand colour: set it as `palette.accent` (hero slot); the cool→warm progression
builds around it — woven in, not pasted on. For a full promo, deliver the MP4
(HTML/Player preview optional; Remotion stays the final framework).

---

## Generative visuals

`npm run generate -- --spec <shot.json> --slug <slug> --kind <kind>` — local
re-implementation of Open-Higgsfield-AI: `src/generate/prompt.ts` compiles a
ShotSpec + Cinema-Studio camera params into one prompt; `src/generate/registry.ts`
is the model list; `src/generate/providers/` are swappable adapters (`dry-run`
default = compile only, no cost; `muapi` = the paid gateway Higgsfield uses).
Output → `public/generated/<slug>/`. Spec: `prompts/shot.example.json`.
Full pipeline in `PIPELINE.md`.

When writing a spec by hand, still fill every slot. Reference vocabulary from
Open-Higgsfield-AI's Cinema Studio:

- **Cameras:** 8K Digital · Cine Digital · 70mm Film · Studio S35 · 16mm Film · Large-Format Digital
- **Lenses:** Anamorphic · Macro · 70s Cinema Prime · Modern Prime · Swirl-Bokeh Portrait · Vintage Prime · Halation Diffusion · Clinical Sharp Prime
- **Focal length:** 8mm ultra-wide · 14mm · 24mm · 35mm (human eye) · 50mm · 85mm tight portrait
- **Aperture:** f/1.4 shallow · f/4 balanced · f/11 deep focus

Fill every slot — never "traffic in Miami cinematic":

```
Subject:        <who/what, doing what>
Environment:    <location, time of day, weather, era>
Camera angle:   <eye-level / low / high / overhead / dutch>
Lens & look:    <focal length, prime/anamorphic, aperture, film stock or digital>
Camera move:    <static / slow push-in / dolly / crane up / handheld follow / orbit — speed>
Lighting:       <key direction, hard/soft, practicals, colour temp, contrast ratio>
Motion in frame:<what moves and how fast>
Composition:    <framing, headroom, rule-of-thirds, foreground layers>
Mood:           <two or three adjectives>
Realism:        <photoreal / documentary / stylised>
Duration:       <seconds>   Aspect ratio: <9:16 | 1:1 | 16:9>
Negative:       <no text, no logos, no warping, no extra limbs>
```

Keep the system independent of any one generator — this is a reference, not a dependency.

---

## Remotion skills

Official Remotion Agent Skills are installed under `.agents/skills/` (symlinked
into Claude Code). Load them by name: `remotion-best-practices` (router),
`remotion-markup`, `remotion-captions`, `remotion-maps`, `remotion-render`,
`remotion-studio`, `remotion-multimedia`, etc. They are the source of truth for
how Remotion code should be written.

Core Remotion rules: animate with `useCurrentFrame()` + `interpolate()` (never CSS
transitions/animations or Tailwind animate-\* classes); keep `interpolate()` inline
in `style` and prefer `scale`/`translate`/`rotate` over `transform` strings so the
user can tweak keyframes in Studio; assets go in `public/` and load via
`staticFile()`; `<Video>`/`<Audio>` from `@remotion/media`.
