import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

/**
 * Big statement text. Words rise + fade in with a stagger.
 * Use for section titles and punchy claims — NOT for running captions.
 */
export const Headline: React.FC<{
  text: string;
  theme?: Theme;
  size?: "h1" | "h2" | "mega";
  align?: "left" | "center";
  accentWords?: string[]; // words to paint in the accent color
  delay?: number;
  color?: string;
}> = ({
  text,
  theme = DEFAULT_THEME,
  size = "h1",
  align = "left",
  accentWords = [],
  delay = 0,
  color,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const words = text.split(" ");
  const fontSize = scaleToWidth(theme.type.size[size], width);
  const accentSet = new Set(accentWords.map((w) => w.toLowerCase().replace(/[.,!?]/g, "")));

  return (
    <Interactive.Div
      name="Headline"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: `0 ${fontSize * 0.28}px`,
        justifyContent: align === "center" ? "center" : "flex-start",
        textAlign: align,
        fontFamily: theme.type.display,
        fontWeight: theme.type.weight.black,
        letterSpacing: theme.type.tracking.tight * fontSize,
        lineHeight: 1.04,
        fontSize,
        color: color ?? theme.palette.ink,
      }}
    >
      {words.map((w, i) => {
        const start = delay + i * 3;
        const t = interpolate(frame, [start, start + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.out,
        });
        const isAccent = accentSet.has(w.toLowerCase().replace(/[.,!?]/g, ""));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: t,
              translate: `0px ${interpolate(t, [0, 1], [fontSize * 0.5, 0])}px`,
              color: isAccent ? theme.palette.accent : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </Interactive.Div>
  );
};
