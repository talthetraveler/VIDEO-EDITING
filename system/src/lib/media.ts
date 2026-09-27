/**
 * Media probing (durations, dimensions) via Mediabunny.
 * Works in the browser, Node and Bun — safe to call from calculateMetadata.
 */

import { Input, ALL_FORMATS, UrlSource } from "mediabunny";

export const getAudioDuration = async (src: string): Promise<number> => {
  const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(src) });
  return input.computeDuration();
};

export const getVideoDuration = getAudioDuration;

export const getVideoDimensions = async (
  src: string,
): Promise<{ width: number; height: number }> => {
  const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(src) });
  const track = await input.getPrimaryVideoTrack();
  if (!track) throw new Error(`No video track in ${src}`);
  return { width: track.displayWidth, height: track.displayHeight };
};
