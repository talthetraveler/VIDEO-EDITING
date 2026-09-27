import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIJEWHATEEUROPE.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_JEW_HATE_EUROPE
 * strategy: 'As a Jew in Israel I get so much hate from Europe and America'
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIJEWHATEEUROPE: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIJEWHATEEUROPE_METADATA = clipReelMetadata(SPEC);
