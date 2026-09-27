import React from "react";
import { AbsoluteFill, Series, Video, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../lib/animations";

/**
 * A rapid B-roll montage. Each clip gets a punch-in and a quick cross-dissolve.
 * Authored explicitly (no .map over a data array is fine here since clips are
 * config, not editable timeline rows — but keep the list short & hand-tuned).
 */
export type BrollClip = {
  src: string; // staticFile path or URL
  durationInFrames: number;
  trimBefore?: number;
  objectPosition?: string;
};

const Clip: React.FC<{ clip: BrollClip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.06, 1.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.inOut,
  });
  const op = interpolate(frame, [0, 6, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: op, overflow: "hidden" }}>
      <Video
        src={clip.src}
        trimBefore={clip.trimBefore ?? 0}
        // eslint-disable-next-line @remotion/no-object-fit-on-media-video -- objectFit prop not in @remotion/media@4.0.520
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: clip.objectPosition ?? "center", scale: String(scale) }}
      />
    </AbsoluteFill>
  );
};

export const BrollSequence: React.FC<{ clips: BrollClip[]; overlap?: number }> = ({ clips, overlap = 6 }) => {
  return (
    <Series name="Broll">
      {clips.map((clip, i) => (
        <Series.Sequence key={i} durationInFrames={clip.durationInFrames} offset={i === 0 ? 0 : -overlap}>
          <Clip clip={clip} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
