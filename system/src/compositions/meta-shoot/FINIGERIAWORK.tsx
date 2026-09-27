import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FINIGERIAWORK.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_NIGERIA_WORK
 * strategy: From Nigeria, came to Israel for work
 * 5 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FINIGERIAWORK: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FINIGERIAWORK_METADATA = clipReelMetadata(SPEC);
