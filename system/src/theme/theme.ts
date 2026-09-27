/**
 * House style for Tal's videos.
 *
 * Two palettes ship by default:
 *  - "editorial"  → bright, high-contrast, Nas-Daily / SaaS-explainer energy (DEFAULT)
 *  - "neon"       → pure-black, glass-and-light, synthwave promo look
 *
 * A composition picks ONE theme and threads it down through components.
 * Never hardcode colors in a scene — pull from the active theme.
 */

export type Palette = {
  bg: string;
  bgAlt: string;
  ink: string; // primary text on bg
  inkMuted: string;
  accent: string; // hero brand / emphasis color
  accentAlt: string;
  positive: string;
  negative: string;
  hairline: string; // thin lines, borders, axes
  scrim: string; // overlay behind captions over footage
};

export type Typography = {
  display: string; // huge headlines, big stats
  body: string; // captions, lower thirds, labels
  mono: string; // numbers, code, UI
  /** Sizes authored against a 1080px-wide frame; scale with scaleToWidth(). */
  size: {
    mega: number; // full-screen stat moment
    h1: number;
    h2: number;
    caption: number;
    label: number;
  };
  weight: { regular: number; medium: number; bold: number; black: number };
  tracking: { tight: number; normal: number; wide: number };
};

export type Motion = {
  /** Standard beat length range in seconds — something meaningful changes this often. */
  beatSeconds: [number, number];
  /** Default enter/exit durations in frames (at 30fps). */
  enterFrames: number;
  exitFrames: number;
  /** Punch-in scale used for photo/screenshot emphasis. */
  punchInScale: number;
};

export type Theme = {
  name: string;
  palette: Palette;
  type: Typography;
  motion: Motion;
  /** Safe-area insets in px (against a 1080-wide frame). See lib/safe-area.ts. */
  safe: { top: number; bottom: number; x: number };
};

const SHARED_TYPE: Typography = {
  display: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  body: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: '"Roboto Mono", ui-monospace, "SF Mono", Menlo, monospace',
  // caption 72 @1080w — measured against his reels, the on-screen key phrase is
  // much bigger than a typical subtitle.
  size: { mega: 240, h1: 104, h2: 64, caption: 72, label: 34 },
  weight: { regular: 400, medium: 500, bold: 700, black: 900 },
  tracking: { tight: -0.02, normal: 0, wide: 0.08 },
};

const SHARED_MOTION: Motion = {
  beatSeconds: [1, 3],
  enterFrames: 12,
  exitFrames: 10,
  punchInScale: 1.12,
};

const SHARED_SAFE = { top: 220, bottom: 320, x: 72 };

export const editorialTheme: Theme = {
  name: "editorial",
  palette: {
    bg: "#0B0B0F",
    bgAlt: "#15151D",
    ink: "#FFFFFF",
    inkMuted: "#9AA0AA",
    accent: "#FFE14D",
    accentAlt: "#4DA3FF",
    positive: "#43E0A0",
    negative: "#FF5C5C",
    hairline: "rgba(255,255,255,0.14)",
    scrim: "rgba(0,0,0,0.45)",
  },
  type: SHARED_TYPE,
  motion: SHARED_MOTION,
  safe: SHARED_SAFE,
};

export const neonTheme: Theme = {
  name: "neon",
  palette: {
    bg: "#000000",
    bgAlt: "#050509",
    ink: "#FFFFFF",
    inkMuted: "#7C8296",
    accent: "#8A5CFF", // violet hero; remap to brand color per project
    accentAlt: "#00E0D2",
    positive: "#00E0D2",
    negative: "#FF3D7F",
    hairline: "rgba(255,255,255,0.10)",
    scrim: "rgba(0,0,0,0.6)",
  },
  type: SHARED_TYPE,
  motion: { ...SHARED_MOTION, punchInScale: 1.16 },
  safe: SHARED_SAFE,
};

export const THEMES = { editorial: editorialTheme, neon: neonTheme };
export const DEFAULT_THEME: Theme = editorialTheme;

/**
 * neon-palette hue arc: open cool → middle violet → close warm/magenta.
 * Use for backgrounds / glows in promo-style videos. `t` in [0,1] across the film.
 */
export const neonArc = (t: number): string => {
  const stops = ["#0A2A6B", "#1E63D6", "#00E0D2", "#8A5CFF", "#C24BFF", "#FF3D7F"];
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.min(stops.length - 2, Math.floor(clamped * (stops.length - 1)));
  return stops[idx + 1] ?? stops[stops.length - 1];
};
