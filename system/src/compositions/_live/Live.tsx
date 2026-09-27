import React from "react";
import type { CalculateMetadataFunction } from "remotion";
import { ProjectVideo, type ProjectData } from "../../components/ProjectVideo";
import placeholder from "./data.json";

/**
 * The "Live" composition — a single permanent slot the review server renders
 * against a bundle it built ONCE at startup. The project timeline is passed as
 * inputProps at render time (NOT a static import — webpack would inline it into
 * the warm bundle and every re-render would render the same thing). So a
 * re-render is just the frames: seconds, not the ~90 s bundle + Root.tsx
 * rewrite that scripts/proj-render.mjs pays per call.
 *
 * data.json is only the at-rest placeholder / defaultProps. The batch path
 * (scripts/proj-render.mjs) still uses its own _proj mechanism.
 */
const PLACEHOLDER = placeholder as unknown as ProjectData;
const pick = (props: Record<string, unknown>): ProjectData =>
  props && (props as { tracks?: unknown }).tracks ? (props as unknown as ProjectData) : PLACEHOLDER;

export const Live: React.FC<Record<string, unknown>> = (props) => <ProjectVideo data={pick(props)} />;

export const liveMetadata: CalculateMetadataFunction<Record<string, unknown>> = ({ props }) => {
  const d = pick(props);
  return {
    durationInFrames: Math.max(
      1,
      d.tracks.video.reduce(
        (n, c) => n + Math.max(1, Math.round(((c.sourceOut - c.sourceIn) / (c.speed ?? 1)) * d.fps)),
        0,
      ),
    ),
    fps: d.fps,
    width: d.width,
    height: d.height,
  };
};
