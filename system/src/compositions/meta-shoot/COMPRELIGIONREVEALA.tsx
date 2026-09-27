import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPRELIGIONREVEALA.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_RELIGION_REVEAL_A
 * strategy: COMP_RELIGION_REVEAL · tight 6-beat
 * 6 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPRELIGIONREVEALA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPRELIGIONREVEALA_METADATA = clipReelMetadata(SPEC);
