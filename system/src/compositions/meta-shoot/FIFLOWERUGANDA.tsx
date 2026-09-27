import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIFLOWERUGANDA.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_FLOWER_UGANDA
 * strategy: Flowers to a Christian woman from Uganda
 * 4 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIFLOWERUGANDA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIFLOWERUGANDA_METADATA = clipReelMetadata(SPEC);
