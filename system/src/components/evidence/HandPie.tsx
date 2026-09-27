import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../../lib/animations";
import { PaperBackdrop } from "./PaperBackdrop";
import { EVIDENCE, HAND_FONT } from "./palette";

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
};
/** SVG arc wedge from 0° (12 o'clock) sweeping `sweep`° clockwise. */
const wedge = (cx: number, cy: number, r: number, sweep: number) => {
  if (sweep <= 0) return "";
  if (sweep >= 359.999) sweep = 359.999;
  const [sx, sy] = polar(cx, cy, r, 0);
  const [ex, ey] = polar(cx, cy, r, sweep);
  const large = sweep > 180 ? 1 : 0;
  return `M${cx},${cy} L${sx},${sy} A${r},${r} 0 ${large} 1 ${ex},${ey} Z`;
};

/**
 * The hand-drawn pie reveal.
 *
 *   dot → scales up to a full blue circle → a gold wedge sweeps in clockwise →
 *   the big-slice label pops inside it → the small-slice label appears out to
 *   the side → a marker arrow draws from that label to the wedge.
 *
 * Deliberately imperfect: paper background, script labels, wobbly arrow.
 */
export const HandPie: React.FC<{
  title?: string;
  slicePct: number; // 1..99 — the highlighted (gold) slice
  sliceLabel: string; // e.g. "Jewish 10%"
  restLabel?: string; // e.g. "others"
  paper?: boolean;
  size?: number; // pie diameter as fraction of frame width
}> = ({ title, slicePct, sliceLabel, restLabel = "others", paper = true, size = 0.52 }) => {
  const frame = useCurrentFrame();
  const R = 190;
  const CX = 200;
  const CY = 210;

  const titleT = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const grow = interpolate(frame, [6, 26], [0.02, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const sweep = interpolate(frame, [22, 42], [0, (slicePct / 100) * 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  const othersT = interpolate(frame, [38, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const sliceT = interpolate(frame, [46, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const arrowT = interpolate(frame, [54, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });

  // arrow: from just under the "Jewish X%" callout (upper right) curving down-left
  // to the middle of the gold wedge (~half of the slice's angular span from 12 o'clock)
  const [wx, wy] = polar(CX, CY, R * 0.72, (slicePct / 100) * 360 * 0.5);
  const aDash = 900;

  const body = (
    <AbsoluteFill name="HandPie" style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: `${size * 100}%`, position: "relative" }}>
        {title ? (
          <div
            style={{
              fontFamily: HAND_FONT,
              color: EVIDENCE.inkSoft,
              fontSize: `${R * 0.16}px`,
              textAlign: "left",
              opacity: titleT,
              translate: `0 ${interpolate(titleT, [0, 1], [-8, 0])}px`,
              marginBottom: R * 0.08,
            }}
          >
            {title}
          </div>
        ) : null}

        <svg viewBox="0 0 400 420" width="100%" style={{ overflow: "visible" }}>
          <defs>
            <filter id="pieRough">
              <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves={2} seed={9} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={5} />
            </filter>
            <filter id="pieArrowRough">
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={4} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={4} />
            </filter>
          </defs>
          <g style={{ transformOrigin: `${CX}px ${CY}px`, transform: `scale(${grow})` }} filter="url(#pieRough)">
            <circle cx={CX} cy={CY} r={R} fill={EVIDENCE.blue} />
            {sweep > 0 ? <path d={wedge(CX, CY, R, sweep)} fill={EVIDENCE.gold} /> : null}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke={EVIDENCE.ink} strokeOpacity={0.25} strokeWidth={3} />
          </g>

          {/* hand-drawn arrow: callout -> wedge */}
          {arrowT > 0 ? (
            <g filter="url(#pieArrowRough)" stroke={EVIDENCE.ink} strokeWidth={4.5} fill="none" strokeLinecap="round">
              <path
                d={`M${CX + R * 1.15},${CY - R * 0.7} C${CX + R * 0.9},${CY - R * 0.95} ${wx + 40},${wy - 55} ${wx},${wy}`}
                strokeDasharray={aDash}
                strokeDashoffset={aDash * (1 - arrowT)}
              />
              {arrowT > 0.85 ? (
                <>
                  <path d={`M${wx},${wy} l14,-4`} />
                  <path d={`M${wx},${wy} l6,14`} />
                </>
              ) : null}
            </g>
          ) : null}

          {/* big-slice label, inside the blue */}
          <text
            x={CX}
            y={CY + R * 0.55}
            textAnchor="middle"
            style={{
              fontFamily: HAND_FONT,
              fontSize: R * 0.28,
              fill: "#fff",
              opacity: othersT,
              transform: `scale(${interpolate(othersT, [0, 1], [0.8, 1])})`,
              transformOrigin: `${CX}px ${CY}px`,
            }}
          >
            {restLabel}
          </text>
        </svg>

        {/* small-slice callout, out to the top-right */}
        <div
          style={{
            position: "absolute",
            right: "-10%",
            top: `${title ? 4 : -2}%`,
            fontFamily: HAND_FONT,
            fontWeight: 700,
            color: EVIDENCE.ink,
            fontSize: `${R * 0.24}px`,
            opacity: sliceT,
            translate: `${interpolate(sliceT, [0, 1], [10, 0])}px 0`,
          }}
        >
          {sliceLabel}
        </div>
      </div>
    </AbsoluteFill>
  );

  return paper ? <PaperBackdrop>{body}</PaperBackdrop> : body;
};
