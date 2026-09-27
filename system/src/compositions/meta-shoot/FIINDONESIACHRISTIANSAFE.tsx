import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIINDONESIACHRISTIANSAFE.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_INDONESIA_CHRISTIAN_SAFE
 * strategy: Indonesian Christian: 'no Jewish people in Indonesia', do you feel safe here
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIINDONESIACHRISTIANSAFE: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIINDONESIACHRISTIANSAFE_METADATA = clipReelMetadata(SPEC);
