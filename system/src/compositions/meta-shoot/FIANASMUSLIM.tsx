import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIANASMUSLIM.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_ANAS_MUSLIM
 * strategy: Anas: Muslim, studied with Jewish and Christian kids, favorite part of Israel
 * 8 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIANASMUSLIM: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIANASMUSLIM_METADATA = clipReelMetadata(SPEC);
