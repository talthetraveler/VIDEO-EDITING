import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { evolvePath } from "@remotion/paths";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";

/**
 * Stylised route animation on an abstract map — no API key, renders anywhere.
 * A route draws from origin to destination with a marker pulse on arrival.
 *
 * For a REAL geographic map (streets, satellite, labels) use the `remotion-maps`
 * skill instead — MapLibre needs no key. This is the fast default for "A → B".
 *
 * The SVG uses a square 0..1000 viewBox fit to the frame width and centred
 * vertically, so keep points/labels within ~[60, 940].
 */
export const RouteMap: React.FC<{
  theme?: Theme;
  path?: string;
  origin?: { x: number; y: number };
  dest?: { x: number; y: number };
  originLabel?: string;
  destLabel?: string;
  drawFrames?: number;
  grid?: boolean;
}> = ({
  theme = DEFAULT_THEME,
  path = "M 170 830 C 380 690, 320 430, 540 360 S 780 300, 830 180",
  origin = { x: 170, y: 830 },
  dest = { x: 830, y: 180 },
  originLabel,
  destLabel,
  drawFrames = 44,
  grid = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const progress = interpolate(frame, [0, drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.inOut,
  });
  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, path);
  const arrived = interpolate(progress, [0.82, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill name="RouteMap" style={{ background: theme.palette.bg, justifyContent: "center" }}>
      <svg viewBox="0 0 1000 1000" width={width} height={height} preserveAspectRatio="xMidYMid meet">
        {grid
          ? Array.from({ length: 21 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * 50} y1={0} x2={i * 50} y2={1000} stroke={theme.palette.hairline} strokeWidth={1} />
                <line x1={0} y1={i * 50} x2={1000} y2={i * 50} stroke={theme.palette.hairline} strokeWidth={1} />
              </React.Fragment>
            ))
          : null}

        <path d={path} fill="none" stroke={theme.palette.hairline} strokeWidth={6} />
        <path
          d={path}
          fill="none"
          stroke={theme.palette.accent}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{ filter: `drop-shadow(0 0 12px ${theme.palette.accent})` }}
        />

        <circle cx={origin.x} cy={origin.y} r={14} fill={theme.palette.accentAlt} />
        <circle cx={dest.x} cy={dest.y} r={interpolate(arrived, [0, 1], [0, 18])} fill={theme.palette.accent} />
        <circle
          cx={dest.x}
          cy={dest.y}
          r={interpolate(arrived, [0, 1], [0, 48])}
          fill="none"
          stroke={theme.palette.accent}
          strokeWidth={3}
          opacity={interpolate(arrived, [0, 1], [0.8, 0])}
        />

        {originLabel ? (
          <text x={origin.x + 30} y={origin.y + 10} fill={theme.palette.ink} fontSize={34} fontFamily={theme.type.body} fontWeight={700}>
            {originLabel}
          </text>
        ) : null}
        {destLabel ? (
          <text
            x={dest.x}
            y={dest.y - 34}
            textAnchor="end"
            fill={theme.palette.ink}
            fontSize={34}
            fontFamily={theme.type.body}
            fontWeight={700}
            opacity={arrived}
          >
            {destLabel}
          </text>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
