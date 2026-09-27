import React from "react";
import { AbsoluteFill } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";

/**
 * Root wrapper for a scene. Paints the theme background and (optionally) a
 * subtle vignette. Put ONE <Frame> at the top of every scene.
 */
export const Frame: React.FC<{
  theme?: Theme;
  vignette?: boolean;
  background?: string;
  children: React.ReactNode;
}> = ({ theme = DEFAULT_THEME, vignette = true, background, children }) => {
  return (
    <AbsoluteFill
      name="Frame"
      style={{
        backgroundColor: background ?? theme.palette.bg,
        fontFamily: theme.type.body,
        color: theme.palette.ink,
      }}
    >
      {children}
      {vignette ? (
        <AbsoluteFill
          name="Vignette"
          style={{
            pointerEvents: "none",
            background:
              "radial-gradient(120% 90% at 50% 42%, transparent 55%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
