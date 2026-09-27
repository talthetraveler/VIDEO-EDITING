import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

export type CounterFormat = {
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** group thousands with commas */
  grouping?: boolean;
};

const fmt = (n: number, f: CounterFormat) => {
  const fixed = n.toFixed(f.decimals ?? 0);
  const [int, dec] = fixed.split(".");
  const grouped = f.grouping ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : int;
  return `${f.prefix ?? ""}${grouped}${dec ? "." + dec : ""}${f.suffix ?? ""}`;
};

/**
 * A number that counts up. Auto-shrinks to fit `maxWidth` so long suffixes
 * ("10.5 HOURS") never clip the frame.
 */
export const AnimatedCounter: React.FC<{
  to: number;
  from?: number;
  theme?: Theme;
  format?: CounterFormat;
  startFrame?: number;
  durationInFrames?: number;
  fontSize?: number; // target px @1080w; defaults to mega
  maxWidth?: number; // px; shrink to fit if the final string is wider
  color?: string;
  mono?: boolean;
}> = ({
  to,
  from = 0,
  theme = DEFAULT_THEME,
  format = {},
  startFrame = 0,
  durationInFrames = 26,
  fontSize,
  maxWidth,
  color,
  mono = true,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const t = interpolate(frame, [startFrame, startFrame + durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  const value = from + (to - from) * t;
  const fontFamily = mono ? theme.type.mono : theme.type.display;
  const target = scaleToWidth(fontSize ?? theme.type.size.mega, width);

  // Fit the FINAL string so the size stays stable while counting.
  const finalStr = fmt(to, format);
  const cap = maxWidth ?? width * 0.9;
  const fitted = fitText({
    text: finalStr,
    withinWidth: cap,
    fontFamily,
    fontWeight: theme.type.weight.black,
    letterSpacing: `${theme.type.tracking.tight * target}px`,
  }).fontSize;
  const size = Math.min(target, fitted);

  const settle = interpolate(t, [0.85, 1], [1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Interactive.Div
      name="AnimatedCounter"
      style={{
        fontFamily,
        fontWeight: theme.type.weight.black,
        fontSize: size,
        letterSpacing: theme.type.tracking.tight * size,
        color: color ?? theme.palette.accent,
        lineHeight: 1,
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
        scale: String(settle),
      }}
    >
      {fmt(value, format)}
    </Interactive.Div>
  );
};
