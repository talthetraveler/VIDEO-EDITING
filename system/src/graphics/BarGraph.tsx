import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { EASE } from "../lib/animations";
import { scaleToWidth } from "../theme/formats";

export type Bar = { label: string; value: number; color?: string; highlight?: boolean };

/** Horizontal bar chart. Bars grow in with a stagger; values count up. */
export const BarGraph: React.FC<{
  bars: Bar[];
  theme?: Theme;
  max?: number;
  unit?: string;
  title?: string;
  delay?: number;
}> = ({ bars, theme = DEFAULT_THEME, max, unit = "", title, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const peak = max ?? Math.max(...bars.map((b) => b.value)) * 1.1;
  const rowH = scaleToWidth(96, width);
  const labelSize = scaleToWidth(theme.type.size.label, width);

  return (
    <Interactive.Div name="BarGraph" style={{ display: "flex", flexDirection: "column", gap: scaleToWidth(20, width), width: "100%" }}>
      {title ? (
        <span style={{ fontFamily: theme.type.body, fontWeight: theme.type.weight.bold, fontSize: labelSize, color: theme.palette.inkMuted, textTransform: "uppercase", letterSpacing: theme.type.tracking.wide * labelSize }}>
          {title}
        </span>
      ) : null}
      {bars.map((b, i) => {
        const start = delay + i * 5;
        const t = interpolate(frame, [start, start + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
        const pct = (b.value / peak) * 100 * t;
        const shown = b.value * t;
        const barColor = b.color ?? (b.highlight ? theme.palette.accent : theme.palette.accentAlt);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: scaleToWidth(8, width) }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: theme.type.body, fontSize: labelSize, color: theme.palette.ink }}>
              <span style={{ fontWeight: theme.type.weight.medium }}>{b.label}</span>
              <span style={{ fontFamily: theme.type.mono, fontWeight: theme.type.weight.bold, color: b.highlight ? theme.palette.accent : theme.palette.ink }}>
                {shown.toLocaleString(undefined, { maximumFractionDigits: 1 })}{unit}
              </span>
            </div>
            <div style={{ height: rowH * 0.4, borderRadius: rowH * 0.1, background: theme.palette.bgAlt, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: rowH * 0.1, background: barColor, boxShadow: b.highlight ? `0 0 ${rowH * 0.3}px ${barColor}` : undefined }} />
            </div>
          </div>
        );
      })}
    </Interactive.Div>
  );
};
