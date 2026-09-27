import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

/** A browser chrome frame for website screenshots / screen recordings. */
export const BrowserMockup: React.FC<{
  url?: string;
  theme?: Theme;
  widthPx?: number; // @1080w frame
  aspect?: number; // content h/w, default 0.62
  enter?: boolean;
  children: React.ReactNode;
}> = ({ url = "example.com", theme = DEFAULT_THEME, widthPx = 940, aspect = 0.62, enter = true, children }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const w = scaleToWidth(widthPx, width);
  const bar = w * 0.062;
  const dot = bar * 0.28;
  const t = enter ? interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out }) : 1;

  return (
    <Interactive.Div
      name="BrowserMockup"
      style={{
        width: w,
        borderRadius: w * 0.018,
        overflow: "hidden",
        border: `1px solid ${theme.palette.hairline}`,
        boxShadow: `0 ${w * 0.04}px ${w * 0.12}px rgba(0,0,0,0.5)`,
        background: theme.palette.bgAlt,
        opacity: t,
        translate: `0px ${interpolate(t, [0, 1], [40, 0])}px`,
        scale: String(interpolate(t, [0, 1], [0.96, 1])),
      }}
    >
      <div style={{ height: bar, background: "#1b1b22", display: "flex", alignItems: "center", gap: dot, paddingLeft: bar * 0.4 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: dot, height: dot, borderRadius: "50%", background: c }} />
        ))}
        <div style={{ flex: 1, margin: `0 ${bar * 0.5}px`, height: bar * 0.5, borderRadius: bar * 0.25, background: "#0f0f14", color: theme.palette.inkMuted, fontFamily: theme.type.mono, fontSize: bar * 0.34, display: "flex", alignItems: "center", paddingLeft: bar * 0.4 }}>
          {url}
        </div>
      </div>
      <div style={{ width: "100%", height: w * aspect, position: "relative", overflow: "hidden" }}>{children}</div>
    </Interactive.Div>
  );
};
