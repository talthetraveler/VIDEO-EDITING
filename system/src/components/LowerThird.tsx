import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

/** Name / role / location tag that slides in from the left edge. */
export const LowerThird: React.FC<{
  title: string;
  subtitle?: string;
  theme?: Theme;
  total?: number; // clip length in frames, for auto-exit
  side?: "left" | "right";
}> = ({ title, subtitle, theme = DEFAULT_THEME, total, side = "left" }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const inT = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const outT = total ? interpolate(frame, [total - 10, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const op = Math.min(inT, outT);
  const dx = interpolate(inT, [0, 1], [side === "left" ? -60 : 60, 0]);

  return (
    <Interactive.Div
      name="LowerThird"
      style={{
        alignSelf: side === "left" ? "flex-start" : "flex-end",
        display: "flex",
        flexDirection: "column",
        gap: scaleToWidth(6, width),
        padding: `${scaleToWidth(16, width)}px ${scaleToWidth(28, width)}px`,
        borderLeft: side === "left" ? `${scaleToWidth(6, width)}px solid ${theme.palette.accent}` : undefined,
        borderRight: side === "right" ? `${scaleToWidth(6, width)}px solid ${theme.palette.accent}` : undefined,
        background: theme.palette.scrim,
        backdropFilter: "blur(6px)",
        opacity: op,
        translate: `${dx}px 0px`,
      }}
    >
      <span style={{ fontFamily: theme.type.display, fontWeight: theme.type.weight.bold, fontSize: scaleToWidth(theme.type.size.h2, width), color: theme.palette.ink }}>
        {title}
      </span>
      {subtitle ? (
        <span style={{ fontFamily: theme.type.body, fontWeight: theme.type.weight.medium, fontSize: scaleToWidth(theme.type.size.label, width), color: theme.palette.inkMuted, textTransform: "uppercase", letterSpacing: theme.type.tracking.wide * scaleToWidth(theme.type.size.label, width) }}>
          {subtitle}
        </span>
      ) : null}
    </Interactive.Div>
  );
};
