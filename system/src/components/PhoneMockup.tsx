import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

/**
 * A phone shell to hold a screen recording, screenshot, or app UI.
 * Put your <Video>/<CanvasImage>/JSX as children — it fills the screen.
 */
export const PhoneMockup: React.FC<{
  theme?: Theme;
  widthPx?: number; // device width @1080w frame
  float?: boolean; // subtle idle bob
  enterFrom?: "bottom" | "scale" | "none";
  children: React.ReactNode;
}> = ({ theme = DEFAULT_THEME, widthPx = 620, float = true, enterFrom = "bottom", children }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const w = scaleToWidth(widthPx, width);
  const h = w * 2.16;
  const radius = w * 0.14;

  const t = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const bob = float ? Math.sin(frame / 22) * (w * 0.012) : 0;
  const enterY = enterFrom === "bottom" ? interpolate(t, [0, 1], [h * 0.5, 0]) : 0;
  const enterScale = enterFrom === "scale" ? interpolate(t, [0, 1], [0.86, 1]) : 1;

  return (
    <Interactive.Div
      name="PhoneMockup"
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        padding: w * 0.028,
        background: "#0a0a0c",
        border: `${w * 0.012}px solid #26262c`,
        boxShadow: `0 ${w * 0.06}px ${w * 0.16}px rgba(0,0,0,0.55)`,
        opacity: t,
        translate: `0px ${enterY + bob}px`,
        scale: String(enterScale),
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: radius * 0.82, overflow: "hidden", background: theme.palette.bgAlt }}>
        {children}
        {/* notch */}
        <div style={{ position: "absolute", top: 0, left: "50%", translate: "-50% 0", width: w * 0.34, height: w * 0.05, background: "#0a0a0c", borderRadius: `0 0 ${w * 0.04}px ${w * 0.04}px` }} />
      </div>
    </Interactive.Div>
  );
};
