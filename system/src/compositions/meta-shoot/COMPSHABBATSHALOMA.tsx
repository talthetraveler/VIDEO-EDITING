import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPSHABBATSHALOMA.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_SHABBAT_SHALOM_A
 * strategy: COMP_SHABBAT_SHALOM · tight 6-beat
 * 6 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPSHABBATSHALOMA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPSHABBATSHALOMA_METADATA = clipReelMetadata(SPEC);
