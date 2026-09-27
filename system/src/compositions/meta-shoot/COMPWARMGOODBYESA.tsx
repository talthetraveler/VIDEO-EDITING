import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPWARMGOODBYESA.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_WARM_GOODBYES_A
 * strategy: COMP_WARM_GOODBYES · tight 6-beat
 * 6 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPWARMGOODBYESA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPWARMGOODBYESA_METADATA = clipReelMetadata(SPEC);
