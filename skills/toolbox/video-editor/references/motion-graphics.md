# Motion graphics & video editing

Remotion-first. Animate with `useCurrentFrame()` + inline `interpolate()` — never
CSS transitions/animations or Tailwind `animate-*` (they don't render). Prefer
`scale` / `translate` / `rotate` over `transform` strings so keyframes stay
editable in Studio. Assets in `public/`, loaded with `staticFile()`.

Fuller: `EDITING-SYSTEM.md`, `MOTION-PROMPT.md`. Remotion Agent Skills are
installed at `.agents/skills/` — load `remotion-markup`, `remotion-captions`,
`remotion-maps`, `remotion-render`, `remotion-studio` as needed; they're the
source of truth for Remotion code.

## Two modes

- **MODE A — real / documentary**: people, interviews, travel, kindness, street,
  real events. Priority: **real footage > motion graphics**. Theme `editorialTheme`.
- **MODE B — motion / explainer**: tech, SaaS, AI, stats, maps, product, systems,
  abstract, promo. Priority: **visual explanation + real product assets + motion
  graphics**. Theme `neonTheme` + `src/components/motion/`. See
  `formats/motion-promo.md` for the dark-motion language.

Most videos mix both. Pick per moment.

## Component library (`import { X } from "../components"`)

Every component takes a `theme` (default `editorialTheme`). Sizes authored against
1080-wide, scaled by `scaleToWidth()`.

| Component | For |
|---|---|
| `Frame` | scene root — theme bg + vignette. One per scene. |
| `Headline` | big statement text, word-stagger in; `accentWords` colours key words. |
| `TitleCard` | hook/section title — bold WHITE ALL-CAPS, upper third, drop shadow, emoji, optional list number. His style. |
| `Captions` | TikTok-style track from a `Caption[]`, in the mobile safe area; `emphasize` keeps stats/names in accent; `variant="transcript"` = small pill transcript up top. |
| `BigStat` | full-screen stat moment: kicker + `AnimatedCounter` + context + optional `viz`; shockwave ring. |
| `AnimatedCounter` | number that counts up, auto-shrinks to fit width. |
| `LowerThird` | name / role / location tag, slides from an edge. |
| `Callout` | pointer + label annotating a spot (`x`/`y` %). |
| `QuoteCard` | pulled quote / tweet / testimonial, line by line. |
| `PhoneMockup` / `BrowserMockup` | shell for screen recordings, screenshots, UI. |
| `ScreenshotZoom` | Ken-Burns punch-in on a still (`focus` point). |
| `BrollSequence` | rapid b-roll montage, punch-in + cross-dissolve per clip. |
| `LogoReveal` | end card / brand stamp with light sweep. |
| `BarGraph` | horizontal bars, staggered grow, values count up. |
| `ComparisonGraphic` | before/after or them/us split with a wipe + "vs". |
| `Timeline` | vertical event timeline, spine draws down, nodes pop. |
| `RouteMap` | stylised A→B route on an abstract grid (no API key; real maps → `remotion-maps` skill). |
| `AutoCut` | plays the kept spans of a `keep.json` — the filler/pause-cut talking clip. |

### MODE B — `src/components/motion/`

`NeonField` (true-black bg + travelling glow) · `GlassTile` (dark matte glass,
`depth` for parallax) · `HeroWord` (kinetic word replacement) · `TypeReveal`
(typing, last char flashes accent then cools) · `DataStream` (light trails, many
inputs → one hub) · `PushIn` (timed virtual camera move) · `MotionSequence` +
`Beat` (render a beat sheet as hard cuts) · `ExpandingRing` / `LightSweep` /
`Shockwave` (visual-native transitions & stat slams).

Multi-scene → `<TransitionSeries>`, `durationInFrames` inlined. VO-timed →
`voiceoverMetadata()` / `captionsToScenes()` (`src/lib/voiceover.ts`) in
`calculateMetadata`. Build reusable components, not one-offs; fold approved
patterns back into `src/components/`.

## Layout

Design a video, not a webpage. One thing to notice per scene, framed around it.
Safe area: key text ≥ 80 px from sides, ≥ 100 px top/bottom at 1080-wide (scale
with width). Headline ≥ 84 px, important supporting text ≥ 44 px at 1080-wide.
Mobile safe areas for captions in `src/lib/safe-area.ts` (TikTok/Reels/Shorts
stack UI over the right side + bottom third).
