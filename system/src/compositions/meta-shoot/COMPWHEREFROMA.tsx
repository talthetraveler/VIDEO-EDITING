import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPWHEREFROMA.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_WHERE_FROM_A
 * strategy: COMP_WHERE_FROM · tight 6-beat
 * 6 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPWHEREFROMA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPWHEREFROMA_METADATA = clipReelMetadata(SPEC);
