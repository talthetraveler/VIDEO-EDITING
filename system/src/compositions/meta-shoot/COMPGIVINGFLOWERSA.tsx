import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPGIVINGFLOWERSA.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_GIVING_FLOWERS_A
 * strategy: COMP_GIVING_FLOWERS · tight 6-beat
 * 4 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPGIVINGFLOWERSA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPGIVINGFLOWERSA_METADATA = clipReelMetadata(SPEC);
