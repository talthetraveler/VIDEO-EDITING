import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FICROSSCHRISTIAN.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_CROSS_CHRISTIAN
 * strategy: 'I saw your cross' — friends Jewish and Muslim, we're all human
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FICROSSCHRISTIAN: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FICROSSCHRISTIAN_METADATA = clipReelMetadata(SPEC);
