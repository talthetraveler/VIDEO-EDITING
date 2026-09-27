import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { neonTheme, type Theme } from "../../theme/theme";
import { scaleToWidth } from "../../theme/formats";

/**
 * Typing reveal. The most-recently-typed character flashes in the accent colour
 * then cools to ink over ~6 frames. Use sparingly — one per sequence.
 */
export const TypeReveal: React.FC<{
  text: string;
  theme?: Theme;
  charsPerSecond?: number;
  startFrame?: number;
  fontSizePx?: number;
  weight?: number;
  caret?: boolean;
  color?: string;
}> = ({
  text,
  theme = neonTheme,
  charsPerSecond = 26,
  startFrame = 0,
  fontSizePx,
  weight,
  caret = true,
  color,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const elapsed = Math.max(0, frame - startFrame);
  const shown = Math.min(text.length, Math.floor((elapsed / fps) * charsPerSecond));
  const size = scaleToWidth(fontSizePx ?? theme.type.size.h1, width);
  const done = shown >= text.length;
  const blink = caret && !done ? (Math.floor(frame / 8) % 2 === 0 ? 1 : 0.15) : 0;

  return (
    <Interactive.Div
      name="TypeReveal"
      style={{
        fontFamily: theme.type.display,
        fontWeight: weight ?? theme.type.weight.bold,
        fontSize: size,
        letterSpacing: theme.type.tracking.tight * size,
        color: color ?? theme.palette.ink,
        lineHeight: 1.1,
        whiteSpace: "pre-wrap",
      }}
    >
      {text.slice(0, shown).split("").map((ch, i) => {
        const typedAtFrame = startFrame + (i / charsPerSecond) * fps;
        const heat = interpolate(frame, [typedAtFrame, typedAtFrame + 6], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={i}
            style={{
              color: heat > 0 ? theme.palette.accent : undefined,
              textShadow: heat > 0 ? `0 0 ${size * 0.4 * heat}px ${theme.palette.accent}` : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
      <span style={{ opacity: blink, color: theme.palette.accent }}>{caret && !done ? "|" : ""}</span>
    </Interactive.Div>
  );
};
