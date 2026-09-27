import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIFLOWERLANDED.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_FLOWER_LANDED
 * strategy: Flowers: 'I just landed, surprised to see Muslims' — 'can I have one rose for a stranger'
 * 4 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIFLOWERLANDED: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIFLOWERLANDED_METADATA = clipReelMetadata(SPEC);
