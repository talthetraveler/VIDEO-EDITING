import React from "react";
import { AbsoluteFill, Series, staticFile } from "remotion";
import { Video } from "@remotion/media";
import type { CalculateMetadataFunction } from "remotion";

/**
 * Plays only the KEPT spans of a talking-head clip, back to back (ripple).
 *
 * This is the Remotion-native version of the auto-video-editor: `scripts/tighten.mjs`
 * transcribes the clip, drops filler words + long pauses, and writes a
 * `<name>.keep.json`. This component renders that — no ffmpeg re-encode step,
 * the final render IS the tightened cut.
 *
 * The segment list is DERIVED data, not a hand-editable timeline, so mapping it
 * is fine (same as caption pages). To hand-tune, edit the JSON.
 */

export type KeepFile = {
  /** staticFile-relative path, e.g. "footage/miami/raw.mp4" */
  src: string;
  fps: number;
  /** [startSeconds, endSeconds] spans to keep, in order */
  segments: [number, number][];
  stats?: { originalSeconds: number; keptSeconds: number; fillersRemoved: number };
};

export const AutoCut: React.FC<{
  keep: KeepFile;
  muted?: boolean;
  style?: React.CSSProperties;
}> = ({ keep, muted, style }) => {
  const src = keep.src.startsWith("http") ? keep.src : staticFile(keep.src);
  return (
    <AbsoluteFill name="AutoCut">
      <Series>
        {keep.segments.map(([s, e], i) => {
          const dur = Math.max(1, Math.round((e - s) * keep.fps));
          return (
            <Series.Sequence key={i} durationInFrames={dur} name={`take ${i + 1} · ${s.toFixed(1)}s`}>
              <Video
                src={src}
                trimBefore={Math.round(s * keep.fps)}
                muted={muted}
                objectFit="cover"
                style={{ width: "100%", height: "100%", ...style }}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};

/** durationInFrames = sum of kept spans. Use as the composition's calculateMetadata. */
export const autoCutMetadata =
  (keep: KeepFile): CalculateMetadataFunction<Record<string, unknown>> =>
  () => ({
    durationInFrames: Math.max(
      1,
      keep.segments.reduce((n, [s, e]) => n + Math.round((e - s) * keep.fps), 0),
    ),
    fps: keep.fps,
  });
