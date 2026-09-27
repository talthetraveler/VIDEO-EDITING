import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

export type TimelineEvent = { time: string; label: string; highlight?: boolean };

/** A vertical timeline. A spine draws down; nodes + rows pop in sequence. */
export const Timeline: React.FC<{
  events: TimelineEvent[];
  theme?: Theme;
  stepFrames?: number;
}> = ({ events, theme = DEFAULT_THEME, stepFrames = 8 }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const draw = interpolate(frame, [0, events.length * stepFrames], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.inOut,
  });
  const dot = scaleToWidth(30, width);
  const spine = scaleToWidth(3, width);
  const gap = scaleToWidth(44, width);
  const timeSize = scaleToWidth(theme.type.size.label, width);
  const labelSize = scaleToWidth(theme.type.size.h2, width) * 0.72;

  return (
    <Interactive.Div
      name="Timeline"
      style={{ position: "relative", display: "flex", flexDirection: "column", gap }}
    >
      {/* spine sits under the centre of the dot column */}
      <div
        style={{
          position: "absolute",
          left: dot / 2 - spine / 2,
          top: dot / 2,
          width: spine,
          height: `${draw}%`,
          background: theme.palette.hairline,
        }}
      />
      {events.map((e, i) => {
        const t = interpolate(frame, [i * stepFrames, i * stepFrames + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.out,
        });
        const c = e.highlight ? theme.palette.accent : theme.palette.accentAlt;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: scaleToWidth(24, width),
              opacity: t,
              translate: `${interpolate(t, [0, 1], [-16, 0])}px 0px`,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: dot,
                height: dot,
                marginTop: timeSize * 0.15,
                borderRadius: "50%",
                background: theme.palette.bg,
                border: `${spine}px solid ${c}`,
                boxShadow: e.highlight ? `0 0 ${dot}px ${c}` : undefined,
                scale: String(interpolate(t, [0, 1], [0.4, 1])),
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: scaleToWidth(4, width) }}>
              <span style={{ fontFamily: theme.type.mono, fontWeight: theme.type.weight.bold, fontSize: timeSize, color: c }}>
                {e.time}
              </span>
              <span style={{ fontFamily: theme.type.body, fontWeight: theme.type.weight.medium, fontSize: labelSize, color: theme.palette.ink }}>
                {e.label}
              </span>
            </div>
          </div>
        );
      })}
    </Interactive.Div>
  );
};
