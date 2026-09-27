import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPSHABBATSHALOMB.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_SHABBAT_SHALOM_B
 * strategy: COMP_SHABBAT_SHALOM · longer 11-beat, different order
 * 11 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPSHABBATSHALOMB: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPSHABBATSHALOMB_METADATA = clipReelMetadata(SPEC);
