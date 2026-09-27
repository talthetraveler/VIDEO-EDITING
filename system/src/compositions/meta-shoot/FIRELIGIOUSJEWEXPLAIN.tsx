import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIRELIGIOUSJEWEXPLAIN.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_RELIGIOUS_JEW_EXPLAIN
 * strategy: 'I'm trying to learn from a religious Jew who supports...'
 * 5 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIRELIGIOUSJEWEXPLAIN: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIRELIGIOUSJEWEXPLAIN_METADATA = clipReelMetadata(SPEC);
