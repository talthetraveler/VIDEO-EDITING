import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FICROSSSAFEGAY.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_CROSS_SAFE_GAY
 * strategy: 'You are safe here to be gay, Arab, Christian, Muslim'
 * 8 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FICROSSSAFEGAY: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FICROSSSAFEGAY_METADATA = clipReelMetadata(SPEC);
