import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIBEACHGUY.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_BEACH_GUY
 * strategy: 'What's your favorite part about Israel?' — the beach
 * 6 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIBEACHGUY: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIBEACHGUY_METADATA = clipReelMetadata(SPEC);
