import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { neonTheme, type Theme } from "../../theme/theme";
import { EASE } from "../../lib/animations";

/**
 * MODE B transition/overlay pieces. Use as <TransitionSeries.Overlay> children
 * or standalone at a cut. Prefer these — or a hard cut — over transition packs.
 */

/** A ring that expands from a point and fades — reveal / scale-change beat. */
export const ExpandingRing: React.FC<{
  theme?: Theme;
  x?: number; // %
  y?: number; // %
  color?: string;
  thickness?: number;
}> = ({ theme = neonTheme, x = 50, y = 50, color, thickness = 4 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  const c = color ?? theme.palette.accent;
  return (
    <AbsoluteFill name="ExpandingRing" style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          translate: "-50% -50%",
          width: width * 0.2,
          height: width * 0.2,
          borderRadius: "50%",
          border: `${thickness}px solid ${c}`,
          boxShadow: `0 0 ${width * 0.03}px ${c}`,
          opacity: interpolate(t, [0, 0.15, 1], [0, 0.9, 0]),
          scale: String(interpolate(t, [0, 1], [0.1, 6])),
        }}
      />
    </AbsoluteFill>
  );
};

/** Diagonal band of light sweeping once across the frame. */
export const LightSweep: React.FC<{ theme?: Theme; angle?: number; color?: string }> = ({
  theme = neonTheme,
  angle = 18,
  color,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames - 1], [-40, 140], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.inOut,
  });
  const c = color ?? theme.palette.ink;
  return (
    <AbsoluteFill name="LightSweep" style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          rotate: `${angle}deg`,
          translate: `${t}% 0`,
          background: `linear-gradient(90deg, transparent, ${c}00 35%, ${c}66 50%, ${c}00 65%, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Full-frame shockwave flash — pairs well with a BigStat slam. */
export const Shockwave: React.FC<{ theme?: Theme; color?: string }> = ({ theme = neonTheme, color }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  const c = color ?? theme.palette.accent;
  return (
    <AbsoluteFill
      name="Shockwave"
      style={{
        pointerEvents: "none",
        background: `radial-gradient(circle at 50% 50%, ${c}00 ${interpolate(t, [0, 1], [0, 70])}%, ${c}${Math.round(
          interpolate(t, [0, 0.3, 1], [0, 0.5, 0]) * 255,
        ).toString(16).padStart(2, "0")} ${interpolate(t, [0, 1], [0, 78])}%, transparent ${interpolate(t, [0, 1], [10, 90])}%)`,
      }}
    />
  );
};
