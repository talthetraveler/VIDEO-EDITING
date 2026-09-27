import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIIRAQJEWSPERSECUTED.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_IRAQ_JEWS_PERSECUTED
 * strategy: 'Your family's from Iraq — persecuted just for being Jews'
 * 10 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIIRAQJEWSPERSECUTED: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIIRAQJEWSPERSECUTED_METADATA = clipReelMetadata(SPEC);
