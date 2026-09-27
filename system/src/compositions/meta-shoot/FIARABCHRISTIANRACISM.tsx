import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIARABCHRISTIANRACISM.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_ARAB_CHRISTIAN_RACISM
 * strategy: Arab Christian, October 7: 'do you feel racism' — no, I want peace
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIARABCHRISTIANRACISM: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIARABCHRISTIANRACISM_METADATA = clipReelMetadata(SPEC);
