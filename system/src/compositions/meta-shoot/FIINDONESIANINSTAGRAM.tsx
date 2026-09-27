import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIINDONESIANINSTAGRAM.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_INDONESIAN_INSTAGRAM
 * strategy: Indonesian tourist: surprised to see Muslims, 'we need to be friends'
 * 7 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIINDONESIANINSTAGRAM: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIINDONESIANINSTAGRAM_METADATA = clipReelMetadata(SPEC);
