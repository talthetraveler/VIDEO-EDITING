import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import type { Beat } from "../../lib/beats";
import { beatFrames } from "../../lib/beats";

/**
 * Renders a MODE B beat sheet as hard cuts (the default — often stronger than a
 * transition). A beat with `enterOverlay` gets that effect layered on its cut-in
 * without shortening the timeline.
 *
 * Keep beats to 4–7. One visual idea each. Numbers get their own beat.
 */
export const MotionSequence: React.FC<{ beats: Beat[] }> = ({ beats }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {beats.map((beat, i) => {
          const Scene = beat.scene;
          // An overlay can't be the first child or adjacent to a transition.
          const Overlay = i === 0 ? undefined : beat.enterOverlay;
          return (
            <React.Fragment key={beat.id}>
              {Overlay ? (
                <TransitionSeries.Overlay durationInFrames={beat.overlayFrames ?? Math.round(fps * 0.5)}>
                  <Overlay />
                </TransitionSeries.Overlay>
              ) : null}
              <TransitionSeries.Sequence durationInFrames={beatFrames(beat, fps)} name={`${beat.id} · ${beat.idea}`}>
                <Scene />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
