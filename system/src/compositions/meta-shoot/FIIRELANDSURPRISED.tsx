import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIIRELANDSURPRISED.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_IRELAND_SURPRISED
 * strategy: From Ireland, 20 minutes in Jerusalem: 'what surprised you most' — the food
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIIRELANDSURPRISED: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIIRELANDSURPRISED_METADATA = clipReelMetadata(SPEC);
