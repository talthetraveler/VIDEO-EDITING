import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIINDONESIAHOME.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_INDONESIA_HOME
 * strategy: Indonesian visitor: 'this is your home', 'taught to hate Israel', welcome home
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIINDONESIAHOME: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIINDONESIAHOME_METADATA = clipReelMetadata(SPEC);
