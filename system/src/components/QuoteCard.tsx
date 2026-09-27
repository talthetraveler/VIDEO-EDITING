import React from "react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

/** A pulled quote / tweet / testimonial. Words fade in line by line. */
export const QuoteCard: React.FC<{
  quote: string;
  attribution?: string;
  theme?: Theme;
}> = ({ quote, attribution, theme = DEFAULT_THEME }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const lines = quote.split("\n");
  const size = scaleToWidth(theme.type.size.h2, width);

  return (
    <AbsoluteFill name="QuoteCard" style={{ justifyContent: "center", alignItems: "center", padding: scaleToWidth(80, width) }}>
      <div
        style={{
          borderLeft: `${scaleToWidth(6, width)}px solid ${theme.palette.accent}`,
          paddingLeft: scaleToWidth(32, width),
          display: "flex",
          flexDirection: "column",
          gap: scaleToWidth(18, width),
        }}
      >
        <span style={{ fontFamily: theme.type.mono, fontSize: size * 2, lineHeight: 0.6, color: theme.palette.accent }}>“</span>
        {lines.map((ln, i) => {
          const t = interpolate(frame, [i * 4, i * 4 + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
          return (
            <span
              key={i}
              style={{
                fontFamily: theme.type.display,
                fontWeight: theme.type.weight.bold,
                fontSize: size,
                lineHeight: 1.25,
                color: theme.palette.ink,
                opacity: t,
                translate: `0px ${interpolate(t, [0, 1], [14, 0])}px`,
              }}
            >
              {ln}
            </span>
          );
        })}
        {attribution ? (
          <Interactive.Div
            name="Attribution"
            style={{
              marginTop: scaleToWidth(10, width),
              fontFamily: theme.type.body,
              fontWeight: theme.type.weight.medium,
              fontSize: scaleToWidth(theme.type.size.label, width),
              color: theme.palette.inkMuted,
              opacity: interpolate(frame, [lines.length * 4 + 6, lines.length * 4 + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            — {attribution}
          </Interactive.Div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
