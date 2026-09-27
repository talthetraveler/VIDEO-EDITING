import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIBELARUSTOURIST.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_BELARUS_TOURIST
 * strategy: Belarus tourist: 'people here are nice even though I'm not Jewish'
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIBELARUSTOURIST: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIBELARUSTOURIST_METADATA = clipReelMetadata(SPEC);
