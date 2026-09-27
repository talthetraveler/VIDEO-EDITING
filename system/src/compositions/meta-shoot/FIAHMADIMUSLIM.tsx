import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIAHMADIMUSLIM.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_AHMADI_MUSLIM
 * strategy: Ahmadi Muslim: 'love for all, hatred for none'
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIAHMADIMUSLIM: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIAHMADIMUSLIM_METADATA = clipReelMetadata(SPEC);
