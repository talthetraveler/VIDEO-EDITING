import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

/**
 * A pointer + label that annotates something on screen (a spot on a map,
 * a UI element, a face). Position with `x`/`y` as % of the frame.
 */
export const Callout: React.FC<{
  label: string;
  x: number; // 0..100
  y: number; // 0..100
  theme?: Theme;
  dir?: "up" | "down" | "left" | "right";
  delay?: number;
}> = ({ label, x, y, theme = DEFAULT_THEME, dir = "down", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const t = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const line = scaleToWidth(64, width);
  const dot = scaleToWidth(16, width);

  const offset: React.CSSProperties =
    dir === "down" ? { flexDirection: "column-reverse" }
    : dir === "up" ? { flexDirection: "column" }
    : dir === "left" ? { flexDirection: "row" }
    : { flexDirection: "row-reverse" };

  return (
    <Interactive.Div
      name="Callout"
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        translate: "-50% -50%",
        display: "flex",
        alignItems: "center",
        gap: scaleToWidth(10, width),
        opacity: t,
        ...offset,
      }}
    >
      <div style={{ width: dot, height: dot, borderRadius: "50%", background: theme.palette.accent, boxShadow: `0 0 ${dot}px ${theme.palette.accent}` }} />
      <div style={{ width: dir === "left" || dir === "right" ? line * t : scaleToWidth(2, width), height: dir === "up" || dir === "down" ? line * t : scaleToWidth(2, width), background: theme.palette.accent }} />
      <div
        style={{
          fontFamily: theme.type.body,
          fontWeight: theme.type.weight.bold,
          fontSize: scaleToWidth(theme.type.size.label, width),
          color: theme.palette.ink,
          background: theme.palette.bgAlt,
          border: `1px solid ${theme.palette.hairline}`,
          padding: `${scaleToWidth(8, width)}px ${scaleToWidth(14, width)}px`,
          whiteSpace: "nowrap",
          opacity: interpolate(t, [0.6, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {label}
      </div>
    </Interactive.Div>
  );
};
