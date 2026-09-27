import React from "react";
import { AbsoluteFill, Series, staticFile } from "remotion";
import { Video } from "@remotion/media";
import type { CalculateMetadataFunction } from "remotion";
import type { Caption } from "@remotion/captions";

/**
 * A reel assembled from BEATS taken across many source clips (e.g. one greeting
 * per person, pulled from 40 different Meta-glasses clips). Each beat trims a
 * span out of its source; beats play back to back as hard cuts.
 *
 * This is the multi-source sibling of <AutoCut> (which is one clip). Build the
 * `beats` list from a scene/greeting index — see scripts/build-reel.mjs.
 */

export type ReelBeat = {
  /** staticFile-relative path, e.g. "footage/shabbat-strangers/IMG_0421.mp4" */
  src: string;
  /** seconds into the source where this beat starts */
  startSec: number;
  /** seconds into the source where it ends */
  endSec: number;
  /** optional per-beat caption text (overrides the track caption for its span) */
  caption?: string;
  /** words in the caption to emphasise (the greeting word) */
  emphasize?: string[];
  objectPosition?: string;
};

export type ReelSpec = {
  fps: number;
  width: number;
  height: number;
  beats: ReelBeat[];
  /** optional continuous caption track already timed to the assembled reel */
  captions?: Caption[];
};

export const ClipReel: React.FC<{ spec: ReelSpec; muted?: boolean }> = ({ spec, muted }) => {
  const url = (s: string) => (s.startsWith("http") ? s : staticFile(s));
  return (
    <AbsoluteFill name="ClipReel" style={{ backgroundColor: "#000" }}>
      <Series>
        {spec.beats.map((b, i) => {
          const dur = Math.max(1, Math.round((b.endSec - b.startSec) * spec.fps));
          return (
            <Series.Sequence key={i} durationInFrames={dur} name={`beat ${i + 1}`}>
              {/*
                `objectFit` is ignored by <Video> from @remotion/media in 4.0.520,
                which letterboxed the 3:4 Meta-glasses source inside the 9:16
                frame. Do the cover crop with the classic min-width/min-height +
                centred-absolute trick on the element itself instead.
              */}
              <AbsoluteFill style={{ overflow: "hidden" }}>
                <Video
                  src={url(b.src)}
                  trimBefore={Math.round(b.startSec * spec.fps)}
                  muted={muted}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: b.objectPosition ?? "50%",
                    translate: "-50% -50%",
                    minWidth: "100%",
                    minHeight: "100%",
                    width: "auto",
                    height: "auto",
                  }}
                />
              </AbsoluteFill>
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};

export const clipReelMetadata =
  (spec: ReelSpec): CalculateMetadataFunction<Record<string, unknown>> =>
  () => ({
    durationInFrames: Math.max(
      1,
      spec.beats.reduce((n, b) => n + Math.round((b.endSec - b.startSec) * spec.fps), 0),
    ),
    fps: spec.fps,
    width: spec.width,
    height: spec.height,
  });
