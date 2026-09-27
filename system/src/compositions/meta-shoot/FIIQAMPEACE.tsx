import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIIQAMPEACE.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_IQAM_PEACE
 * strategy: Iqam near the mosque: peace through dialogue
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIIQAMPEACE: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIIQAMPEACE_METADATA = clipReelMetadata(SPEC);
