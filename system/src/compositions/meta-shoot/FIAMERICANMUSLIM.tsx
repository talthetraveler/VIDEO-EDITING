import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIAMERICANMUSLIM.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_AMERICAN_MUSLIM
 * strategy: American Muslim tourist: 'I just landed and saw Muslims everywhere'
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIAMERICANMUSLIM: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIAMERICANMUSLIM_METADATA = clipReelMetadata(SPEC);
