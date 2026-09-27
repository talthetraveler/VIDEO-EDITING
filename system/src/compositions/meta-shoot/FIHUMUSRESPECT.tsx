import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIHUMUSRESPECT.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_HUMUS_RESPECT
 * strategy: 'Best humus in Israel', 60 years, 'we respect everybody'
 * 6 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIHUMUSRESPECT: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIHUMUSRESPECT_METADATA = clipReelMetadata(SPEC);
