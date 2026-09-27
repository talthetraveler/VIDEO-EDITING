import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIINDONESIAZIONIST.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_INDONESIA_ZIONIST
 * strategy: Recently moved here: 'you're a Zionist' — I love the land of Israel
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIINDONESIAZIONIST: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIINDONESIAZIONIST_METADATA = clipReelMetadata(SPEC);
