import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FICHINAAMERICAVISIT.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_CHINA_AMERICA_VISIT
 * strategy: Tourists from China / America here to visit
 * 6 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FICHINAAMERICAVISIT: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FICHINAAMERICAVISIT_METADATA = clipReelMetadata(SPEC);
