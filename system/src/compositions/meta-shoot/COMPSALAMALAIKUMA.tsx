import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPSALAMALAIKUMA.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_SALAM_ALAIKUM_A
 * strategy: COMP_SALAM_ALAIKUM · tight 6-beat
 * 6 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPSALAMALAIKUMA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPSALAMALAIKUMA_METADATA = clipReelMetadata(SPEC);
