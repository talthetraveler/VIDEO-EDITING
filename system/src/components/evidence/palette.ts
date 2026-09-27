/**
 * Evidence-board palette + shared feel.
 *
 * Reverse-engineered from measured frames of two viral advocacy verticals
 * (scratch/refs/mt2 — "granddaughter" / Mamdani reply). The look is a
 * notebook / evidence-board: a warm paper surface, photo prints that scale and
 * stack with soft shadows, and hand-drawn marker annotations. Accent language
 * is strict blue + gold (Israel flag).
 *
 * Structure/technique only — no footage, music, or graphics from the reference
 * is reused (CLAUDE.md §1 Rights).
 */
export const EVIDENCE = {
  paper: "#F4EEE2", // warm off-white, NOT white
  paperEdge: "#E7DEC9", // vignette / fibre tone
  ink: "#1C1A17", // near-black hand text
  inkSoft: "#6B6155", // faded pencil label
  blue: "#3B82C4", // flag blue — big slice / primary fill
  blueDeep: "#2C6AA8",
  gold: "#F2C230", // flag gold — the emphasis colour
  goldDeep: "#D9A400",
  red: "#C8102E", // label-block / date-stamp red (archival)
  shadow: "rgba(40, 30, 15, 0.28)",
} as const;

/** A casual hand/script stack for labels and annotations.
 *  Caveat is loaded via src/lib/fonts.ts (loadFonts()); the rest are fallbacks. */
export const HAND_FONT =
  '"Caveat", "Bradley Hand", "Segoe Print", "Comic Sans MS", ui-rounded, cursive';
/** A heavy grotesk for the red label-blocks and number pops. */
export const BLOCK_FONT =
  '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Deterministic pseudo-random in [-1,1] from an integer seed (no Math.random). */
export const wobble = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};
