import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FICHRISTIANRESTAURANT.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_CHRISTIAN_RESTAURANT
 * strategy: Christian restaurant owner: free food, kosher meat, 60 years, grew up with wars
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FICHRISTIANRESTAURANT: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FICHRISTIANRESTAURANT_METADATA = clipReelMetadata(SPEC);
