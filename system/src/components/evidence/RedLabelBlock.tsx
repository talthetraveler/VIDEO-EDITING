import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../../lib/animations";
import { EVIDENCE, BLOCK_FONT } from "./palette";

/**
 * The red label-block motif — a solid red rectangle behind white bold caps, one
 * word promoted heavier. Used in a rhythmic 3-beat ("broken trust → broken
 * families → broken lives"), each on the same block, cut against archival.
 *
 * Slam-in: quick scale from 0.9 + a hard wipe of the block from the left.
 */
export const RedLabelBlock: React.FC<{
  text: string;
  emphasis?: number; // 0-based word index rendered heavier
  at?: [number, number]; // 0..1
  size?: number; // px at 1080w
  color?: string;
}> = ({ text, emphasis, at = [0.5, 0.52], size = 96, color = EVIDENCE.red }) => {
  const frame = useCurrentFrame();
  const wipe = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const pop = interpolate(frame, [0, 9], [0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const words = text.split(/\s+/);

  return (
    <div
      style={{
        position: "absolute",
        left: `${at[0] * 100}%`,
        top: `${at[1] * 100}%`,
        translate: "-50% -50%",
        scale: String(pop),
        background: color,
        padding: `${size * 0.16}px ${size * 0.34}px`,
        clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
        boxShadow: `0 10px 30px ${EVIDENCE.shadow}`,
      }}
    >
      <div
        style={{
          fontFamily: BLOCK_FONT,
          color: "#fff",
          fontSize: size,
          lineHeight: 1.02,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ fontWeight: i === emphasis ? 900 : 700, opacity: i === emphasis ? 1 : 0.92 }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};
