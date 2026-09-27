import React from "react";
import { AbsoluteFill } from "remotion";
import data from "./COMPRESTAURANTKINDB.data.json";
import {
  ClipReel,
  clipReelMetadata,
  type ReelSpec,
} from "../../components";

const SPEC = data as ReelSpec;

/**
 * COMP_RESTAURANT_KIND_B
 * strategy: COMP_RESTAURANT_KIND · longer 9-beat, different order
 * 9 moments · target ?s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const COMPRESTAURANTKINDB: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
  </AbsoluteFill>
);

export const COMPRESTAURANTKINDB_METADATA = clipReelMetadata(SPEC);
