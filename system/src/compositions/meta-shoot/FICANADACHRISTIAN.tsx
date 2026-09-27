import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FICANADACHRISTIAN.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_CANADA_CHRISTIAN
 * strategy: From Canada: 'are you Jewish' — no, you're Christian, yes
 * 4 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FICANADACHRISTIAN: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FICANADACHRISTIAN_METADATA = clipReelMetadata(SPEC);
