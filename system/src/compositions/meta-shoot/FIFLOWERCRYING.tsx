import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIFLOWERCRYING.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_FLOWER_CRYING
 * strategy: Flowers: 'I saw you were sad, you were crying'
 * 2 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIFLOWERCRYING: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIFLOWERCRYING_METADATA = clipReelMetadata(SPEC);
