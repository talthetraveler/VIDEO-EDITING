import React from "react";
import { AbsoluteFill } from "remotion";
import type { Caption } from "@remotion/captions";
import data from "./C01SHABBATSHALOMV4FAST20SEC.data.json";
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
 * 01_SHABBAT_SHALOM__V4_FAST_20SEC
 * strategy: 01_SHABBAT_SHALOM V4_FAST_20SEC · 5 beats · opens on od_video-2421_singular_display ("Shabbat Shalom have an amazing day")
 * 5 moments · target 18s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const C01SHABBATSHALOMV4FAST20SEC: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
      <TitleCard theme={theme} variant="pill" text="I SAID SHABBAT SHALOM ALL DAY" total={78} />
    <Captions theme={theme} captions={(SPEC.captions ?? []) as Caption[]} emphasize={/shabbat|shalom|salam|alaikum|marhaba|peace|jewish|muslim|christian/i} />
  </AbsoluteFill>
);

export const C01SHABBATSHALOMV4FAST20SEC_METADATA = clipReelMetadata(SPEC);
