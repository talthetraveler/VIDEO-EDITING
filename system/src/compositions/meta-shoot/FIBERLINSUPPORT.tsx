import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIBERLINSUPPORT.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_BERLIN_SUPPORT
 * strategy: Tourists from Berlin: 'why do you support Israel' — for humanity
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIBERLINSUPPORT: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIBERLINSUPPORT_METADATA = clipReelMetadata(SPEC);
