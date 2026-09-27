/**
 * Fonts. Uses @remotion/google-fonts so weights are bundled and render-safe.
 * Call loadFonts() once at module scope in a composition or component that needs it.
 */

import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadRobotoMono } from "@remotion/google-fonts/RobotoMono";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";

export const { fontFamily: interFamily } = loadInter("normal", {
  weights: ["400", "500", "700", "900"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const { fontFamily: robotoMonoFamily } = loadRobotoMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

/** Hand/marker face for the evidence-board look (labels, annotations). */
export const { fontFamily: caveatFamily } = loadCaveat("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

/** Call to guarantee fonts are registered before first paint. */
export const loadFonts = () => ({ interFamily, robotoMonoFamily, caveatFamily });
