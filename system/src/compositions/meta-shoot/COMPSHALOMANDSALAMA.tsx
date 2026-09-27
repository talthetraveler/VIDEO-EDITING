import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPSHALOMANDSALAMA.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_SHALOM_AND_SALAM_A
 * strategy: COMP_SHALOM_AND_SALAM · tight 6-beat
 * 6 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPSHALOMANDSALAMA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPSHALOMANDSALAMA_METADATA = clipReelMetadata(SPEC);
