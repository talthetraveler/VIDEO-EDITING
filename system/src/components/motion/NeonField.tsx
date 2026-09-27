import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { neonArc, neonTheme, type Theme } from "../../theme/theme";

/**
 * MODE B background: true-black with one restrained moving glow whose hue
 * travels the neon arc (cyan → violet → magenta) across the shot.
 * `progress` overrides the auto film-position (0..1) when a scene needs a
 * specific point on the arc.
 */
export const NeonField: React.FC<{
  theme?: Theme;
  progress?: number;
  glow?: number; // 0..1 intensity
  originX?: number; // %
  originY?: number; // %
}> = ({ theme = neonTheme, progress, glow = 0.55, originX = 50, originY = 42 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = progress ?? interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hue = neonArc(t);
  const drift = Math.sin(frame / 90) * 4;

  return (
    <AbsoluteFill name="NeonField" style={{ backgroundColor: "#000000" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(90% 70% at ${originX + drift}% ${originY}%, ${hue}${Math.round(
            glow * 90,
          ).toString(16).padStart(2, "0")} 0%, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% 120%, ${theme.palette.accentAlt}22 0%, transparent 55%)`,
        }}
      />
      {/* grain-free vignette to keep the black true */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "radial-gradient(130% 100% at 50% 45%, transparent 45%, #000 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
