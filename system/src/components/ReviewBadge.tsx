import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * A temporary review-ID badge burned into the corner of a REVIEW proxy render
 * ONLY. Never composed into a final/approved render — nothing imports this
 * outside scripts/build-review-reel.mjs's generated compositions.
 *
 * (The bundled ffmpeg here has no drawtext filter — it's a stripped build,
 * `--disable-filters` with a small allow-list. Any burned-in text has to come
 * from Remotion itself, not an ffmpeg filter.)
 */
export const ReviewBadge: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        top: 24,
        left: 24,
        padding: "6px 16px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.7)",
        color: "#fff",
        fontFamily: "monospace",
        fontWeight: 700,
        fontSize: 34,
        letterSpacing: 1,
      }}
    >
      {id}
    </div>
  </AbsoluteFill>
);
