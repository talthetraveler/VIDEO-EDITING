import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIFLOWERSISTERS.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_FLOWER_SISTERS
 * strategy: Flowers: thought she was Jewish — she's Christian, her caretaker and sister, from Russia
 * 7 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIFLOWERSISTERS: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIFLOWERSISTERS_METADATA = clipReelMetadata(SPEC);
