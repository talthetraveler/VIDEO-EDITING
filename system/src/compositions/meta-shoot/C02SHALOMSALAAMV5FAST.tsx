import React from "react";
import { AbsoluteFill } from "remotion";
import type { Caption } from "@remotion/captions";
import data from "./C02SHALOMSALAAMV5FAST.data.json";
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
 * 02_SHALOM_SALAAM__V5_FAST
 * strategy: 02_SHALOM_SALAAM V5_FAST · 6 beats · opens on od_video-3392_singular_display ("Salam Alaikum Salam Salam Alaikum")
 * 6 moments · target 19s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const C02SHALOMSALAAMV5FAST: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
      <TitleCard theme={theme} variant="pill" text="ONE GREETING, EVERY PERSON" total={78} />
    <Captions theme={theme} captions={(SPEC.captions ?? []) as Caption[]} emphasize={/shabbat|shalom|salam|alaikum|marhaba|peace|jewish|muslim|christian/i} />
  </AbsoluteFill>
);

export const C02SHALOMSALAAMV5FAST_METADATA = clipReelMetadata(SPEC);
