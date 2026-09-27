import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../../lib/animations";
import { EVIDENCE, BLOCK_FONT } from "./palette";

/**
 * Small red date-stamp chyron, top-left, over archival footage.
 * ("9 NOVEMBER, 1938"). Fades + slides in a few px; no exit unless you unmount.
 */
export const DateStamp: React.FC<{
  text: string;
  corner?: "tl" | "tr" | "bl" | "br";
  size?: number; // px at 1080w
}> = ({ text, corner = "tl", size = 30 }) => {
  const frame = useCurrentFrame();
  const e = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const slide = interpolate(e, [0, 1], [-10, 0]);
  const vy = corner[0] === "t" ? { top: `${size * 1.4}px` } : { bottom: `${size * 1.4}px` };
  const vx = corner[1] === "l" ? { left: `${size * 1.4}px` } : { right: `${size * 1.4}px` };

  return (
    <div
      style={{
        position: "absolute",
        ...vy,
        ...vx,
        opacity: e,
        translate: `${corner[1] === "l" ? slide : -slide}px 0`,
        background: EVIDENCE.red,
        color: "#fff",
        fontFamily: BLOCK_FONT,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: `${size * 0.28}px ${size * 0.55}px`,
      }}
    >
      {text}
    </div>
  );
};
