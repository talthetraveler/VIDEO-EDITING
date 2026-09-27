import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { neonTheme, type Theme } from "../../theme/theme";
import { EASE } from "../../lib/animations";
import { scaleToWidth } from "../../theme/formats";

/**
 * Dark matte glass panel with depth, a lit edge and a soft inner highlight.
 * Hold app UI, an icon, a stat, a label. Floats in with a parallax offset.
 */
export const GlassTile: React.FC<{
  theme?: Theme;
  widthPx?: number;
  heightPx?: number;
  delay?: number;
  depth?: number; // 0 = front, 1 = far — dims + shrinks + blurs slightly
  tint?: string; // edge-light colour; defaults to theme accent
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  theme = neonTheme,
  widthPx = 360,
  heightPx = 240,
  delay = 0,
  depth = 0,
  tint,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const w = scaleToWidth(widthPx, width);
  const h = scaleToWidth(heightPx, width);
  const r = Math.min(w, h) * 0.12;
  const edge = tint ?? theme.palette.accent;

  const t = interpolate(frame, [delay, delay + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  const far = interpolate(depth, [0, 1], [1, 0.82]);
  const bob = Math.sin((frame + delay * 3) / 40) * (w * 0.006) * (1 - depth * 0.5);

  return (
    <Interactive.Div
      name="GlassTile"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        padding: r * 0.7,
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.25))",
        border: `1px solid ${edge}55`,
        boxShadow: `0 ${h * 0.12}px ${h * 0.3}px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 ${r}px ${edge}22`,
        backdropFilter: `blur(${10 - depth * 4}px)`,
        opacity: t * far,
        scale: String(interpolate(t, [0, 1], [0.9, 1]) * far),
        translate: `0px ${interpolate(t, [0, 1], [h * 0.18, 0]) + bob}px`,
        filter: depth > 0 ? `blur(${depth * 1.5}px)` : undefined,
        color: theme.palette.ink,
        fontFamily: theme.type.body,
        ...style,
      }}
    >
      {/* lit top edge */}
      <div style={{ position: "absolute", inset: 0, borderRadius: r, background: `linear-gradient(180deg, ${edge}22, transparent 22%)`, pointerEvents: "none" }} />
      {children}
    </Interactive.Div>
  );
};
