import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FISRILANKANWORKER.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_SRI_LANKAN_WORKER
 * strategy: Sri Lankan worker: studied Israel in school, 'the people are the best', a gift
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FISRILANKANWORKER: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FISRILANKANWORKER_METADATA = clipReelMetadata(SPEC);
