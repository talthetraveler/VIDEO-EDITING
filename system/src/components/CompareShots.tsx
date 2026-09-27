import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Video } from "@remotion/media";

/**
 * Side-by-side camera comparison — "is Meta or the Sony wide shot better for
 * this moment" without making Tal guess from filenames. Built by
 * scripts/build-compare.mjs. Labels are real Remotion text (the bundled
 * ffmpeg has no drawtext filter), not burned in by ffmpeg.
 */
export type ComparePane = {
  /** staticFile-relative path */
  src: string;
  /** seconds into that source where this pane's sync point starts */
  inSec: number;
  label: string;
};

export const CompareShots: React.FC<{ left: ComparePane; right: ComparePane; fps: number }> = ({
  left,
  right,
  fps,
}) => {
  const url = (s: string) => (s.startsWith("http") ? s : staticFile(s));
  const Pane: React.FC<{ pane: ComparePane; side: "left" | "right" }> = ({ pane, side }) => (
    <div style={{ position: "absolute", top: 0, bottom: 0, [side]: 0, width: "50%", overflow: "hidden" }}>
      <AbsoluteFill>
        <Video
          src={url(pane.src)}
          trimBefore={Math.round(pane.inSec * fps)}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            translate: "-50% -50%",
            minWidth: "100%",
            minHeight: "100%",
            width: "auto",
            height: "auto",
          }}
        />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 20,
          [side]: 20,
          padding: "6px 16px",
          borderRadius: 8,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 1,
        }}
      >
        {pane.label}
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Pane pane={left} side="left" />
      <Pane pane={right} side="right" />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "rgba(255,255,255,0.6)" }} />
    </AbsoluteFill>
  );
};
