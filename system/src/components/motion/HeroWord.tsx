import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { neonTheme, type Theme } from "../../theme/theme";
import { EASE } from "../../lib/animations";
import { fitText } from "@remotion/layout-utils";
import { scaleToWidth } from "../../theme/formats";

/**
 * Kinetic word replacement: one hero phrase at a time, each entering with a
 * mask-up + tracking expansion and leaving with a light-fast exit.
 * Great for a hook or a 3-word manifesto beat.
 */
export const HeroWord: React.FC<{
  words: string[];
  theme?: Theme;
  holdFrames?: number; // per word
  fontSizePx?: number;
  color?: string;
}> = ({ words, theme = neonTheme, holdFrames = 26, fontSizePx, color }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const idx = Math.min(words.length - 1, Math.floor(frame / holdFrames));
  const local = frame - idx * holdFrames;
  const word = words[idx] ?? "";

  const target = scaleToWidth(fontSizePx ?? theme.type.size.mega, width);
  const cap = width * 0.86;
  const fitted = fitText({
    text: word,
    withinWidth: cap,
    fontFamily: theme.type.display,
    fontWeight: theme.type.weight.black,
  }).fontSize;
  const size = Math.min(target, fitted);

  const inT = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const outT = interpolate(local, [holdFrames - 6, holdFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.in });

  return (
    <AbsoluteFill name="HeroWord" style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          fontFamily: theme.type.display,
          fontWeight: theme.type.weight.black,
          fontSize: size,
          color: color ?? theme.palette.ink,
          letterSpacing: interpolate(inT, [0, 1], [size * 0.12, theme.type.tracking.tight * size]),
          clipPath: `inset(${interpolate(inT, [0, 1], [100, 0])}% 0 ${interpolate(outT, [0, 1], [0, 100])}% 0)`,
          opacity: 1 - outT * 0.4,
          translate: `0px ${interpolate(inT, [0, 1], [size * 0.18, 0])}px`,
          textShadow: `0 0 ${size * 0.5}px ${theme.palette.accent}44`,
        }}
      >
        {word}
      </div>
    </AbsoluteFill>
  );
};
