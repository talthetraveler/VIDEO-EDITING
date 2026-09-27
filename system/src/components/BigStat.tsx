import React from "react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";
import { AnimatedCounter, type CounterFormat } from "./AnimatedCounter";

/**
 * The full-screen statistic moment.
 *
 *   Narration: "Traffic took 10.5 hours to return to normal."
 *   -> <BigStat value={10.5} format={{decimals:1, suffix:" HOURS"}}
 *              context="to return to normal" />
 *
 * Slams in with a scale + shockwave ring. Optionally render a small supporting
 * visualization via the `viz` slot (e.g. a mini traffic bar).
 */
export const BigStat: React.FC<{
  value: number;
  theme?: Theme;
  format?: CounterFormat;
  label?: string; // small kicker above the number
  context?: string; // supporting line below the number
  viz?: React.ReactNode;
  accent?: string;
}> = ({ value, theme = DEFAULT_THEME, format, label, context, viz, accent }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const a = accent ?? theme.palette.accent;
  const pad = scaleToWidth(theme.safe.x, width);

  const ring = interpolate(frame, [2, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });

  return (
    <AbsoluteFill
      name="BigStat"
      style={{
        justifyContent: "center",
        alignItems: "center",
        gap: scaleToWidth(28, width),
        paddingLeft: pad,
        paddingRight: pad,
      }}
    >
      {/* shockwave ring */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
        <div
          style={{
            width: scaleToWidth(520, width),
            height: scaleToWidth(520, width),
            borderRadius: "50%",
            border: `${scaleToWidth(3, width)}px solid ${a}`,
            opacity: interpolate(ring, [0, 1], [0.5, 0]),
            scale: String(interpolate(ring, [0, 1], [0.3, 2.4])),
          }}
        />
      </AbsoluteFill>

      {label ? (
        <Interactive.Div
          name="Kicker"
          style={{
            fontFamily: theme.type.body,
            fontWeight: theme.type.weight.bold,
            fontSize: scaleToWidth(theme.type.size.label, width),
            letterSpacing: theme.type.tracking.wide * scaleToWidth(theme.type.size.label, width),
            textTransform: "uppercase",
            color: theme.palette.inkMuted,
            opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          {label}
        </Interactive.Div>
      ) : null}

      <AnimatedCounter
        to={value}
        theme={theme}
        format={format}
        color={a}
        startFrame={2}
        maxWidth={width - pad * 2}
      />

      {context ? (
        <Interactive.Div
          name="Context"
          style={{
            fontFamily: theme.type.body,
            fontWeight: theme.type.weight.medium,
            fontSize: scaleToWidth(theme.type.size.h2, width),
            color: theme.palette.ink,
            textAlign: "center",
            maxWidth: "80%",
            opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: `0px ${interpolate(frame, [12, 24], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px`,
          }}
        >
          {context}
        </Interactive.Div>
      ) : null}

      {viz ? <div style={{ marginTop: scaleToWidth(16, width), width: "80%" }}>{viz}</div> : null}
    </AbsoluteFill>
  );
};
