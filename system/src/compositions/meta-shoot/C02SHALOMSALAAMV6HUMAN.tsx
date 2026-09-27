import React from "react";
import { AbsoluteFill } from "remotion";
import type { Caption } from "@remotion/captions";
import data from "./C02SHALOMSALAAMV6HUMAN.data.json";
import {
  ClipReel,
  clipReelMetadata,
  Captions,
  TitleCard,
  editorialTheme,
  type ReelSpec,
} from "../../components";
import { loadFonts } from "../../lib/fonts";

loadFonts();
const theme = editorialTheme;

const SPEC = data as ReelSpec;

/**
 * 02_SHALOM_SALAAM__V6_HUMAN
 * strategy: 02_SHALOM_SALAAM V6_HUMAN · 10 beats · opens on video-3567_singular_display ("Salam Alaikum do you want me")
 * 10 moments · target 38s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const C02SHALOMSALAAMV6HUMAN: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
      <TitleCard theme={theme} variant="pill" text="SHALOM, SALAAM, AND A SMILE" total={78} />
    <Captions theme={theme} captions={(SPEC.captions ?? []) as Caption[]} emphasize={/shabbat|shalom|salam|alaikum|marhaba|peace|jewish|muslim|christian/i} />
  </AbsoluteFill>
);

export const C02SHALOMSALAAMV6HUMAN_METADATA = clipReelMetadata(SPEC);
