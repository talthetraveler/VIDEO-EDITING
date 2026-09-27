import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../../lib/animations";

/**
 * Virtual camera move over a scene's full duration. Wrap scene content.
 * Every move should serve a reveal / scale / focus change — not idle drift.
 */
export const PushIn: React.FC<{
  move?: "in" | "out" | "up" | "down" | "left" | "right";
  amount?: number; // scale delta for in/out, % translate for pans
  from?: number; // 0..1 of duration to start
  to?: number; // 0..1 of duration to end
  origin?: [number, number]; // transform-origin %
  children: React.ReactNode;
}> = ({ move = "in", amount, from = 0, to = 1, origin = [50, 50], children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [from * durationInFrames, to * durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.inOut,
  });

  let scale = 1;
  let translate = "0px 0px";
  if (move === "in") scale = interpolate(t, [0, 1], [1, 1 + (amount ?? 0.12)]);
  else if (move === "out") scale = interpolate(t, [0, 1], [1 + (amount ?? 0.12), 1]);
  else {
    const d = amount ?? 6;
    const map: Record<string, string> = {
      up: `0% ${interpolate(t, [0, 1], [d, -d])}%`,
      down: `0% ${interpolate(t, [0, 1], [-d, d])}%`,
      left: `${interpolate(t, [0, 1], [d, -d])}% 0%`,
      right: `${interpolate(t, [0, 1], [-d, d])}% 0%`,
    };
    translate = map[move];
    scale = 1.12; // pans need overscan so edges never show
  }

  return (
    <AbsoluteFill name="PushIn" style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: `${origin[0]}% ${origin[1]}%`, scale: String(scale), translate }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
