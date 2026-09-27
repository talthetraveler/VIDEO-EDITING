import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../../lib/animations";
import { EVIDENCE } from "./palette";

type Kind = "circle" | "underline" | "arrow" | "strike";

/**
 * A marker annotation that draws itself on — the "someone circled this" beat.
 * Position it over the thing you're pointing at. Wobbly via a turbulence
 * displacement filter so it reads hand-drawn, not vector.
 *
 *   <HandScribble kind="circle" at={[0.62,0.4]} w={0.3} h={0.14} />
 *   <HandScribble kind="arrow"  at={[0.5,0.3]}  w={0.22} h={0.12} rotate={20} />
 */
export const HandScribble: React.FC<{
  kind?: Kind;
  at?: [number, number]; // centre, 0..1
  w?: number; // 0..1 of frame width
  h?: number; // 0..1 of frame height
  rotate?: number;
  color?: string;
  stroke?: number; // px at 1080w
  delay?: number;
  drawFrames?: number;
}> = ({
  kind = "circle",
  at = [0.5, 0.5],
  w = 0.3,
  h = 0.14,
  rotate = 0,
  color = EVIDENCE.gold,
  stroke = 12,
  delay = 0,
  drawFrames = 16,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });

  const W = 400;
  const H = 400;
  let d = "";
  if (kind === "circle") {
    d = "M60,210 C40,90 150,40 220,44 C320,50 372,150 348,240 C326,322 200,372 120,332 C64,304 44,250 66,196";
  } else if (kind === "underline") {
    d = "M40,240 C120,214 220,262 300,232 C332,220 356,236 372,244";
  } else if (kind === "strike") {
    d = "M40,210 C150,190 250,236 372,196";
  } else {
    // arrow: a curved shaft + a small head
    d = "M60,90 C120,60 260,80 300,220 M300,220 L268,176 M300,220 L336,182";
  }

  const dash = 1400;
  // SVG filter ids must be unique per document — key off every distinguishing param
  const fid = `sc-${kind}-${Math.round(at[0] * 1000)}-${Math.round(at[1] * 1000)}-${Math.round(w * 1000)}-${Math.round(
    rotate,
  )}-${Math.round(delay)}`;
  return (
    <AbsoluteFill name="HandScribble" style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: `${at[0] * 100}%`,
          top: `${at[1] * 100}%`,
          width: `${w * 100}%`,
          height: `${h * 100}%`,
          translate: "-50% -50%",
          rotate: `${rotate}deg`,
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: "visible" }}>
          <defs>
            <filter id={fid}>
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={5} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={7} />
            </filter>
          </defs>
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={stroke * (W / 1080) * 2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${fid})`}
            strokeDasharray={dash}
            strokeDashoffset={dash * (1 - t)}
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
