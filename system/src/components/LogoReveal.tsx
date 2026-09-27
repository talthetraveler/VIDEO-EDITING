import React from "react";
import { AbsoluteFill, CanvasImage, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

/** End card / brand stamp. Logo scales up behind a wipe of light. */
export const LogoReveal: React.FC<{
  src?: string;
  wordmark?: string;
  tagline?: string;
  theme?: Theme;
  canvas?: boolean;
}> = ({ src, wordmark, tagline, theme = DEFAULT_THEME, canvas = false }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const t = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const shine = interpolate(frame, [6, 24], [-120, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoSize = scaleToWidth(320, width);

  return (
    <AbsoluteFill name="LogoReveal" style={{ justifyContent: "center", alignItems: "center", gap: scaleToWidth(24, width), background: theme.palette.bg }}>
      <div style={{ position: "relative", opacity: t, scale: String(interpolate(t, [0, 1], [0.8, 1])) }}>
        {src ? (
          canvas ? (
            <CanvasImage src={src} style={{ width: logoSize, height: logoSize, objectFit: "contain" }} />
          ) : (
            <Img src={src} style={{ width: logoSize, height: logoSize, objectFit: "contain" }} />
          )
        ) : (
          <span style={{ fontFamily: theme.type.display, fontWeight: theme.type.weight.black, fontSize: scaleToWidth(theme.type.size.h1, width), color: theme.palette.ink }}>
            {wordmark}
          </span>
        )}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", translate: `${shine}% 0`, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }} />
        </div>
      </div>
      {tagline ? (
        <span style={{ fontFamily: theme.type.body, fontWeight: theme.type.weight.medium, fontSize: scaleToWidth(theme.type.size.label, width), color: theme.palette.inkMuted, letterSpacing: theme.type.tracking.wide * scaleToWidth(theme.type.size.label, width), opacity: interpolate(frame, [14, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          {tagline}
        </span>
      ) : null}
    </AbsoluteFill>
  );
};
