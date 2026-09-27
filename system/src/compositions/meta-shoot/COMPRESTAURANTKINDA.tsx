import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPRESTAURANTKINDA.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_RESTAURANT_KIND_A
 * strategy: COMP_RESTAURANT_KIND · tight 6-beat
 * 6 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPRESTAURANTKINDA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPRESTAURANTKINDA_METADATA = clipReelMetadata(SPEC);
