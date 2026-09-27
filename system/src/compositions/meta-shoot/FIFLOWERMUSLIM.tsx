import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIFLOWERMUSLIM.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_FLOWER_MUSLIM
 * strategy: Flowers: 'are you Jewish' — no, I'm Muslim, wow
 * 4 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIFLOWERMUSLIM: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIFLOWERMUSLIM_METADATA = clipReelMetadata(SPEC);
