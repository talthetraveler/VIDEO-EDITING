import React from "react";
import { AbsoluteFill, Series } from "remotion";
import {
  PaperBackdrop,
  PhotoStack,
  HandPie,
  RedLabelBlock,
  PhotoPrint,
  HandScribble,
  DateStamp,
} from "../../components";
import { loadFonts } from "../../lib/fonts";

loadFonts();

/**
 * Evidence-board motion-graphics showcase. One element per beat, hard cuts.
 * Reference recipe: skills/08-creator-formats/SKILL.md.
 */

const FPS = 30;
export const EVIDENCE_DEMO_DURATION = 11 * FPS;

const B1: React.FC = () => (
  <PhotoStack
    photos={[
      { src: "evidence-demo/p1.jpg", caption: "grandparents, 1946" },
      { src: "evidence-demo/p2.jpg", caption: "the letter" },
      { src: "evidence-demo/p3.jpg" },
    ]}
    stagger={9}
  />
);

const B2: React.FC = () => (
  <HandPie title="NYC Jewish Population Share" slicePct={10} sliceLabel="Jewish 10%" restLabel="others" />
);

const B3: React.FC = () => (
  <PaperBackdrop>
    <RedLabelBlock text="broken families" emphasis={0} />
  </PaperBackdrop>
);

const B4: React.FC = () => (
  <PaperBackdrop>
    <PhotoPrint src="evidence-demo/p4.jpg" at={[0.5, 0.46]} w={0.74} ar={9 / 12} seed={4} />
    <HandScribble kind="circle" at={[0.56, 0.4]} w={0.34} h={0.16} delay={16} />
    <HandScribble kind="arrow" at={[0.24, 0.24]} w={0.2} h={0.16} rotate={35} delay={30} />
    <DateStamp text="9 November, 1938" />
  </PaperBackdrop>
);

export const EvidenceDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Series>
      <Series.Sequence durationInFrames={3.4 * FPS}>
        <B1 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={3.4 * FPS}>
        <B2 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={2 * FPS}>
        <B3 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={2.2 * FPS}>
        <B4 />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
