/**
 * Output format presets.
 *
 * Default for Tal's videos is VERTICAL (9:16) unless a project overrides it.
 * All component sizing scales off `width`, so switching format keeps layouts sane.
 */

export type FormatName = "vertical" | "square" | "wide";

export type Format = {
  name: FormatName;
  width: number;
  height: number;
  fps: number;
};

export const FORMATS: Record<FormatName, Format> = {
  vertical: { name: "vertical", width: 1080, height: 1920, fps: 30 },
  square: { name: "square", width: 1080, height: 1080, fps: 30 },
  wide: { name: "wide", width: 1920, height: 1080, fps: 30 },
};

export const DEFAULT_FORMAT: Format = FORMATS.vertical;

/** Seconds -> frames at the default fps. Prefer `secToFrames(s, fps)` inside components. */
export const secToFrames = (seconds: number, fps: number = DEFAULT_FORMAT.fps) =>
  Math.round(seconds * fps);

/** Scale a px value authored against a 1080px-wide frame to the current width. */
export const scaleToWidth = (px: number, width: number) => (px / 1080) * width;
