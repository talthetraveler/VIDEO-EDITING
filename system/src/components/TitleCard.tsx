import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fitTextOnNLines } from "@remotion/layout-utils";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

/**
 * The hook / section title card, matching @talthetraveler's reels.
 *
 * His current style (watched IG 2026-09): a WHITE translucent rounded PILL with
 * BLACK bold ALL-CAPS text, 2 lines, upper third — e.g. "THE SIDE OF ISRAEL NO
 * ONE SEES", "CAN I SLEEP IN YOUR HOME?". Older reels used plain heavy white
 * caps with no box. Holds for the whole hook, never per-word — pair with
 * <Captions>.
 *
 *   variant="pill"  (default) white pill, black text     ← current style
 *   variant="box"   stacked black translucent boxes
 *   variant="plain" heavy white caps, drop shadow, no box (older)
 */
type Variant = "pill" | "box" | "plain";

export const TitleCard: React.FC<{
  text: string;
  theme?: Theme;
  variant?: Variant;
  /** list index, e.g. 1 -> "1. TEXT" */
  number?: number;
  emoji?: string;
  /** top position as a fraction of frame height */
  topFrac?: number;
  /** clip length in frames, for a fade-out */
  total?: number;
  align?: "center" | "left";
}> = ({
  text,
  theme = DEFAULT_THEME,
  variant = "pill",
  number,
  emoji,
  topFrac = 0.11,
  total,
  align = "center",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const label = `${number != null ? `${number}. ` : ""}${text.toUpperCase()}${emoji ? ` ${emoji}` : ""}`;
  const maxBoxWidth = width * (variant === "pill" ? 0.82 : 0.86);
  const { fontSize } = fitTextOnNLines({
    text: label,
    maxLines: 2,
    maxBoxWidth: maxBoxWidth * 0.9,
    fontFamily: theme.type.display,
    fontWeight: theme.type.weight.black,
    maxFontSize: scaleToWidth(variant === "pill" ? 66 : theme.type.size.h1, width),
  });

  const inT = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const outT = total ? interpolate(frame, [total - 8, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const opacity = Math.min(inT, outT);
  const rise = interpolate(inT, [0, 1], [-fontSize * 0.25, 0]);

  const common: React.CSSProperties = {
    position: "absolute",
    top: topFrac * height,
    maxWidth: maxBoxWidth,
    textAlign: align,
    fontFamily: theme.type.display,
    fontWeight: theme.type.weight.black,
    fontSize,
    lineHeight: 1.06,
    letterSpacing: theme.type.tracking.tight * fontSize,
    opacity,
    translate: `0px ${rise}px`,
  };

  let inner: React.ReactNode;
  if (variant === "pill") {
    inner = (
      <div
        style={{
          ...common,
          color: "#0A0A0A",
          background: "rgba(255,255,255,0.94)",
          padding: `${fontSize * 0.34}px ${fontSize * 0.58}px`,
          borderRadius: fontSize * 0.7,
          boxShadow: `0 ${fontSize * 0.08}px ${fontSize * 0.4}px rgba(0,0,0,0.28)`,
        }}
      >
        {label}
      </div>
    );
  } else if (variant === "box") {
    inner = (
      <div style={{ ...common, display: "flex", flexDirection: "column", gap: fontSize * 0.14, alignItems: "center" }}>
        {label.split(/\s{2,}|\n/).map((line, i) => (
          <span
            key={i}
            style={{
              color: "#fff",
              background: "rgba(0,0,0,0.72)",
              padding: `${fontSize * 0.16}px ${fontSize * 0.4}px`,
              borderRadius: fontSize * 0.14,
            }}
          >
            {line}
          </span>
        ))}
      </div>
    );
  } else {
    inner = (
      <div
        style={{
          ...common,
          color: "#FFFFFF",
          textShadow: `0 ${fontSize * 0.05}px ${fontSize * 0.18}px rgba(0,0,0,0.65)`,
        }}
      >
        {label}
      </div>
    );
  }

  return (
    <AbsoluteFill name="TitleCard" style={{ alignItems: "center", justifyContent: "flex-start" }}>
      {inner}
    </AbsoluteFill>
  );
};
