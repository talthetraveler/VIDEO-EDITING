import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * The ~0.5–1s divider/title card shown before each candidate in a combined
 * REVIEW_ALL reel — "A3 / Candidate 3 / Duration: 00:42" — so Tal can watch
 * every proposed edit without opening 20 separate files and always knows
 * which id he's looking at.
 */
export const ReviewCard: React.FC<{ id: string; title?: string; durationLabel: string }> = ({
  id,
  title,
  durationLabel,
}) => (
  <AbsoluteFill style={{ backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", fontFamily: "system-ui, sans-serif", color: "#fff" }}>
      <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: 2 }}>{id}</div>
      {title ? <div style={{ fontSize: 32, opacity: 0.8, marginTop: 12, maxWidth: 800 }}>{title}</div> : null}
      <div style={{ fontSize: 24, opacity: 0.55, marginTop: 20 }}>Duration: {durationLabel}</div>
    </div>
  </AbsoluteFill>
);
