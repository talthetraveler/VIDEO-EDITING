import React from "react";
import { AbsoluteFill, CanvasImage, Img, interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../lib/animations";

/**
 * Ken-Burns / punch-in on a still image or screenshot.
 * `focus` is the point [x%, y%] the move pushes toward (default center).
 * Set `canvas` if this renders inside <HtmlInCanvas>.
 */
export const ScreenshotZoom: React.FC<{
  src: string;
  total: number; // clip length in frames
  from?: number; // start scale
  to?: number; // end scale
  focus?: [number, number];
  canvas?: boolean;
  style?: React.CSSProperties;
}> = ({ src, total, from = 1.04, to = 1.18, focus = [50, 50], canvas = false, style }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, total], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.inOut,
  });
  const fade = interpolate(frame, [0, 8, total - 8, total], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transformOrigin: `${focus[0]}% ${focus[1]}%`,
    scale: String(scale),
    ...style,
  };

  return (
    <AbsoluteFill name="ScreenshotZoom" style={{ opacity: fade, overflow: "hidden" }}>
      {canvas ? <CanvasImage src={src} style={imgStyle} /> : <Img src={src} style={imgStyle} />}
    </AbsoluteFill>
  );
};
