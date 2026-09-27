import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIMEETBADIK.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_MEET_BADIK
 * strategy: Badik: what he wishes people knew about Israel
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIMEETBADIK: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIMEETBADIK_METADATA = clipReelMetadata(SPEC);
