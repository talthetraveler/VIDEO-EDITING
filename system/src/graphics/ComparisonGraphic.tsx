import React from "react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

/** Split-screen "before / after" or "them / us". Wipe reveals the second side. */
export const ComparisonGraphic: React.FC<{
  left: { label: string; value?: string; content?: React.ReactNode };
  right: { label: string; value?: string; content?: React.ReactNode };
  theme?: Theme;
  orientation?: "horizontal" | "vertical";
}> = ({ left, right, theme = DEFAULT_THEME, orientation = "vertical" }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const wipe = interpolate(frame, [8, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const l = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const isV = orientation === "vertical";
  const labelSize = scaleToWidth(theme.type.size.label, width);
  const valueSize = scaleToWidth(theme.type.size.h1, width);

  const Side = (
    s: { label: string; value?: string; content?: React.ReactNode },
    accent: string,
    op: number,
  ) => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: scaleToWidth(16, width), opacity: op, padding: scaleToWidth(40, width) }}>
      <span style={{ fontFamily: theme.type.body, fontWeight: theme.type.weight.bold, fontSize: labelSize, textTransform: "uppercase", letterSpacing: theme.type.tracking.wide * labelSize, color: accent }}>
        {s.label}
      </span>
      {s.content}
      {s.value ? (
        <span style={{ fontFamily: theme.type.mono, fontWeight: theme.type.weight.black, fontSize: valueSize, color: theme.palette.ink }}>{s.value}</span>
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill name="ComparisonGraphic" style={{ flexDirection: isV ? "column" : "row" }}>
      {Side(left, theme.palette.negative, l)}
      <div style={{ [isV ? "height" : "width"]: scaleToWidth(2, width), background: theme.palette.hairline } as React.CSSProperties} />
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <AbsoluteFill style={{ clipPath: isV ? `inset(${(1 - wipe) * 100}% 0 0 0)` : `inset(0 0 0 ${(1 - wipe) * 100}%)` }}>
          {Side(right, theme.palette.positive, 1)}
        </AbsoluteFill>
      </div>
      <Interactive.Div name="vs" style={{ position: "absolute", left: "50%", top: "50%", translate: "-50% -50%", fontFamily: theme.type.display, fontWeight: theme.type.weight.black, fontSize: scaleToWidth(theme.type.size.h2, width), color: theme.palette.ink, background: theme.palette.bg, borderRadius: "50%", width: scaleToWidth(120, width), height: scaleToWidth(120, width), display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${theme.palette.hairline}` }}>
        vs
      </Interactive.Div>
    </AbsoluteFill>
  );
};
