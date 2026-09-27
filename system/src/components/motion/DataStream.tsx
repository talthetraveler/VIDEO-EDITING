import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { neonTheme, type Theme } from "../../theme/theme";
import { EASE } from "../../lib/animations";

export type StreamSource = { x: number; y: number; label?: string };

/**
 * Light trails flowing from N sources into one hub — "many inputs, one system".
 * Coordinates are % of the frame. One idea per beat: keep sources <= 5.
 */
export const DataStream: React.FC<{
  sources: StreamSource[];
  hub?: { x: number; y: number };
  theme?: Theme;
  drawFrames?: number;
}> = ({ sources, hub = { x: 50, y: 55 }, theme = neonTheme, drawFrames = 26 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const progress = interpolate(frame, [0, drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  const flow = (frame % 40) / 40;

  const px = (v: number) => (v / 100) * width;
  const py = (v: number) => (v / 100) * height;

  return (
    <AbsoluteFill name="DataStream">
      <svg width={width} height={height}>
        {sources.map((s, i) => {
          const x1 = px(s.x);
          const y1 = py(s.y);
          const x2 = px(hub.x);
          const y2 = py(hub.y);
          const midX = (x1 + x2) / 2;
          const d = `M ${x1} ${y1} Q ${midX} ${y1}, ${x2} ${y2}`;
          const delay = i * 0.12;
          const local = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
          return (
            <g key={i} opacity={local}>
              <path d={d} fill="none" stroke={theme.palette.hairline} strokeWidth={2} />
              <path
                d={d}
                fill="none"
                stroke={theme.palette.accentAlt}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="6 22"
                strokeDashoffset={-flow * 56}
                style={{ filter: `drop-shadow(0 0 6px ${theme.palette.accentAlt})` }}
              />
              <circle cx={x1} cy={y1} r={6} fill={theme.palette.accentAlt} />
              {s.label ? (
                <text x={x1} y={y1 - 16} textAnchor="middle" fill={theme.palette.ink} fontSize={26} fontFamily={theme.type.body} fontWeight={600}>
                  {s.label}
                </text>
              ) : null}
            </g>
          );
        })}
        <circle
          cx={px(hub.x)}
          cy={py(hub.y)}
          r={interpolate(progress, [0.5, 1], [0, 22], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          fill={theme.palette.accent}
          style={{ filter: `drop-shadow(0 0 16px ${theme.palette.accent})` }}
        />
      </svg>
    </AbsoluteFill>
  );
};
