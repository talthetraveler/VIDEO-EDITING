import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./FIONEWAYTICKET.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * FI_ONE_WAY_TICKET
 * strategy: 'They were forced to leave — one way ticket, can never go back'
 * 8 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const FIONEWAYTICKET: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const FIONEWAYTICKET_METADATA = clipReelMetadata(SPEC);
