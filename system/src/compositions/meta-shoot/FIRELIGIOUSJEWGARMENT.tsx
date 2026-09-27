import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIRELIGIOUSJEWGARMENT.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_RELIGIOUS_JEW_GARMENT
 * strategy: Tourist: first time seeing a religious Jew, 'similar to the hijab'
 * 5 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIRELIGIOUSJEWGARMENT: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIRELIGIOUSJEWGARMENT_METADATA = clipReelMetadata(SPEC);
