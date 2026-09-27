import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIBAKERYMAHMOUD.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_BAKERY_MAHMOUD
 * strategy: Muslim baker, wouldn't let me pay
 * 12 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIBAKERYMAHMOUD: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIBAKERYMAHMOUD_METADATA = clipReelMetadata(SPEC);
