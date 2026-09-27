import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIANGOLAGAYSAFE.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_ANGOLA_GAY_SAFE
 * strategy: From Angola: 'I feel safer being gay here than in Angola'
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIANGOLAGAYSAFE: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIANGOLAGAYSAFE_METADATA = clipReelMetadata(SPEC);
