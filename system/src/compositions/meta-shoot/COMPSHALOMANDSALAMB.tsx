import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPSHALOMANDSALAMB.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_SHALOM_AND_SALAM_B
 * strategy: COMP_SHALOM_AND_SALAM · longer 11-beat, different order
 * 11 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPSHALOMANDSALAMB: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPSHALOMANDSALAMB_METADATA = clipReelMetadata(SPEC);
