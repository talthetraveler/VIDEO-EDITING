import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EVIDENCE } from "./palette";

/**
 * The evidence-board surface: warm paper with fibre grain and a soft vignette.
 * Full-frame background for any evidence-board scene. Optional slow drift so a
 * held graphic never feels frozen (disabled by default — turn on for long holds).
 */
export const PaperBackdrop: React.FC<{
  tone?: string;
  drift?: boolean;
  children?: React.ReactNode;
}> = ({ tone = EVIDENCE.paper, drift = false, children }) => {
  const frame = useCurrentFrame();
  const dx = drift ? Math.sin(frame / 90) * 6 : 0;
  const dy = drift ? Math.cos(frame / 110) * 5 : 0;
  return (
    <AbsoluteFill name="PaperBackdrop" style={{ backgroundColor: tone, overflow: "hidden" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="paperGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves={3} seed={7} result="n" />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 0.10  0 0 0 0 0.07  0 0 0 0 0.02  0 0 0 0.13 0"
            />
          </filter>
          <filter id="paperFibre">
            <feTurbulence type="turbulence" baseFrequency="0.006 0.08" numOctaves={4} seed={11} result="f" />
            <feColorMatrix
              in="f"
              type="matrix"
              values="0 0 0 0 0.12  0 0 0 0 0.09  0 0 0 0 0.03  0 0 0 0.10 0"
            />
          </filter>
          <radialGradient id="paperVig" cx="50%" cy="44%" r="70%">
            <stop offset="0%" stopColor="#FFFBF0" stopOpacity={0.35} />
            <stop offset="55%" stopColor={tone} stopOpacity={0} />
            <stop offset="100%" stopColor={EVIDENCE.paperEdge} stopOpacity={0.7} />
          </radialGradient>
        </defs>
        <rect
          x={-20}
          y={-20}
          width="110%"
          height="110%"
          filter="url(#paperFibre)"
          style={{ transform: `translate(${dx}px, ${dy}px)` }}
        />
        <rect x={-20} y={-20} width="110%" height="110%" filter="url(#paperGrain)" />
        <rect x={0} y={0} width="100%" height="100%" fill="url(#paperVig)" />
      </svg>
      {children}
    </AbsoluteFill>
  );
};
