import React from "react";
import { AbsoluteFill } from "remotion";
import type { Caption } from "@remotion/captions";
import keep from "../../../public/footage/social-accords/montana-social-accords-aroll.keep.json";
import captions from "../../../public/footage/social-accords/montana-social-accords-aroll.captions.json";
import { AutoCut, autoCutMetadata, type KeepFile } from "../../components/AutoCut";
import { Captions } from "../../captions/Captions";

const KEEP = keep as KeepFile;
const CAPTIONS = captions as Caption[];

/** Tightened cut of montana-social-accords-aroll.mov + synced captions. Edit montana-social-accords-aroll.keep.json to hand-tune. */
export const SocialAccordsCut: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <AutoCut keep={KEEP} />
    <Captions captions={CAPTIONS} />
  </AbsoluteFill>
);
export const SOCIALACCORDS_CUT_METADATA = autoCutMetadata(KEEP);
