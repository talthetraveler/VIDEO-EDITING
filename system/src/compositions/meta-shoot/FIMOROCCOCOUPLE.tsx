import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIMOROCCOCOUPLE.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_MOROCCO_COUPLE
 * strategy: Muslim couple from Morocco: 'I'm Jewish, so happy to see you here', 'it's hard'
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIMOROCCOCOUPLE: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIMOROCCOCOUPLE_METADATA = clipReelMetadata(SPEC);
