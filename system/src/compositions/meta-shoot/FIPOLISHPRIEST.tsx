import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIPOLISHPRIEST.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_POLISH_PRIEST
 * strategy: Priest from Poland: 'is it safe being a Christian in Israel'
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIPOLISHPRIEST: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIPOLISHPRIEST_METADATA = clipReelMetadata(SPEC);
