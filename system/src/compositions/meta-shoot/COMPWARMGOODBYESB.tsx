import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPWARMGOODBYESB.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_WARM_GOODBYES_B
 * strategy: COMP_WARM_GOODBYES · longer 11-beat, different order
 * 11 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPWARMGOODBYESB: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPWARMGOODBYESB_METADATA = clipReelMetadata(SPEC);
