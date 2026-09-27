import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPSALAMALAIKUMB.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_SALAM_ALAIKUM_B
 * strategy: COMP_SALAM_ALAIKUM · longer 11-beat, different order
 * 11 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPSALAMALAIKUMB: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPSALAMALAIKUMB_METADATA = clipReelMetadata(SPEC);
