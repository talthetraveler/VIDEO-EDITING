import React from "react";
import { AbsoluteFill } from "remotion";
import type { Caption } from "@remotion/captions";
import data from "./C06RESTAURANTCONVERSATIONSV6SHORTEMOTIONAL.data.json";
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
 * 06_RESTAURANT_CONVERSATIONS__V6_SHORT_EMOTIONAL
 * strategy: 06_RESTAURANT_CONVERSATIONS V6_SHORT_EMOTIONAL · 3 beats · opens on video-4464_singular_display ("for free To be healthy Wait")
 * 3 moments · target 26s
 * Regenerate: node scripts/build-reel.mjs --slug meta-shoot --spec <edit.json>
 */
export const C06RESTAURANTCONVERSATIONSV6SHORTEMOTIONAL: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ClipReel spec={SPEC} />
      <TitleCard theme={theme} variant="pill" text="HE WOULDN'T LET ME PAY" total={78} />
    <Captions theme={theme} captions={(SPEC.captions ?? []) as Caption[]} emphasize={/shabbat|shalom|salam|alaikum|marhaba|peace|jewish|muslim|christian/i} />
  </AbsoluteFill>
);

export const C06RESTAURANTCONVERSATIONSV6SHORTEMOTIONAL_METADATA = clipReelMetadata(SPEC);
