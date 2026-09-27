import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPWHEREFROMB.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_WHERE_FROM_B
 * strategy: COMP_WHERE_FROM · longer 8-beat, different order
 * 8 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPWHEREFROMB: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPWHEREFROMB_METADATA = clipReelMetadata(SPEC);
