/**
 * Beat-sheet scaffold for MODE B motion sequences.
 *
 * A beat = timing + narration + on-screen text + ONE primary visual + motion +
 * purpose. Author the beat sheet FIRST (see compositions/<slug>/BEAT-SHEET.md),
 * then map each entry to a scene component and list them here.
 */

import type React from "react";

export type Beat = {
  id: string;
  /** seconds — used to derive durationInFrames */
  durationSeconds: number;
  /** the ONE visual idea, for reference in code review */
  idea: string;
  onScreenText?: string;
  narration?: string;
  /** the scene component for this beat */
  scene: React.FC;
  /** optional overlay at the cut INTO this beat (LightSweep, ExpandingRing…) */
  enterOverlay?: React.FC;
  overlayFrames?: number;
};

export const beatFrames = (beat: Beat, fps: number) =>
  Math.round(beat.durationSeconds * fps);

export const totalBeatFrames = (beats: Beat[], fps: number) =>
  beats.reduce((sum, b) => sum + beatFrames(b, fps), 0);
