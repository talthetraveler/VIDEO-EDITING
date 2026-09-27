/**
 * Voiceover-driven timing.
 *
 * Pattern: one MP3 per scene in public/voiceover/<project>/<scene>.mp3.
 * calculateMetadata() measures them and sizes the composition to the VO,
 * then passes per-scene frame durations down as props so scenes self-time.
 *
 * If you have ONE continuous VO track + a captions JSON instead, use
 * `captionsToScenes()` to derive scene boundaries from caption page breaks.
 */

import type { CalculateMetadataFunction } from "remotion";
import { staticFile } from "remotion";
import type { Caption } from "@remotion/captions";
import { getAudioDuration } from "./media";

export type SceneTiming = {
  id: string;
  audio?: string; // staticFile path, if per-scene VO
  durationInFrames: number;
  fromFrame: number; // absolute start in the composition
};

export type VoiceoverProps = {
  scenes: SceneTiming[];
  totalInFrames: number;
};

/** Build a calculateMetadata fn from a list of per-scene VO files. */
export const voiceoverMetadata = <P extends Record<string, unknown>>(opts: {
  fps: number;
  project: string;
  sceneFiles: { id: string; file: string; padSeconds?: number }[];
}): CalculateMetadataFunction<P & VoiceoverProps> => {
  return async ({ props }) => {
    let cursor = 0;
    const scenes: SceneTiming[] = [];
    for (const s of opts.sceneFiles) {
      const path = staticFile(`voiceover/${opts.project}/${s.file}`);
      const seconds = (await getAudioDuration(path)) + (s.padSeconds ?? 0.15);
      const durationInFrames = Math.ceil(seconds * opts.fps);
      scenes.push({ id: s.id, audio: path, durationInFrames, fromFrame: cursor });
      cursor += durationInFrames;
    }
    return {
      durationInFrames: cursor,
      props: { ...props, scenes, totalInFrames: cursor },
    };
  };
};

/** Split a captions array into scenes at `pageBreakAfter` boundaries. */
export const captionsToScenes = (
  captions: Caption[],
  fps: number,
): SceneTiming[] => {
  const scenes: SceneTiming[] = [];
  let startMs = captions[0]?.startMs ?? 0;
  let idx = 0;
  captions.forEach((c, i) => {
    const isLast = i === captions.length - 1;
    if (c.pageBreakAfter || isLast) {
      const endMs = c.endMs;
      const fromFrame = Math.round((startMs / 1000) * fps);
      const durationInFrames = Math.max(1, Math.round(((endMs - startMs) / 1000) * fps));
      scenes.push({ id: `scene-${++idx}`, fromFrame, durationInFrames });
      startMs = captions[i + 1]?.startMs ?? endMs;
    }
  });
  return scenes;
};
