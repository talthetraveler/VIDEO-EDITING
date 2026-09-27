import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIBAKERYMANAGER25YRS.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_BAKERY_MANAGER_25YRS
 * strategy: Bakery manager, 25 years, moved here a year ago, working next week
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIBAKERYMANAGER25YRS: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIBAKERYMANAGER25YRS_METADATA = clipReelMetadata(SPEC);
