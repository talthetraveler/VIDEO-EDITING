import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIJAFFAMUSLIM.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_JAFFA_MUSLIM
 * strategy: Muslim from Jaffa — long conversation
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIJAFFAMUSLIM: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIJAFFAMUSLIM_METADATA = clipReelMetadata(SPEC);
