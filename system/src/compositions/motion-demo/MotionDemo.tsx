import React from "react";
import { AbsoluteFill } from "remotion";
import {
  NeonField,
  HeroWord,
  DataStream,
  GlassTile,
  BigStat,
  TypeReveal,
  PushIn,
  MotionSequence,
  LightSweep,
  ExpandingRing,
  neonTheme,
  scaleToWidth,
  type Beat,
} from "../../components";
import { loadFonts } from "../../lib/fonts";

loadFonts();
const theme = neonTheme;

/**
 * MODE B showcase — premium dark motion language.
 * Beat sheet lives in ./BEAT-SHEET.md. One visual idea per beat, hard cuts.
 */

const Beat1: React.FC = () => (
  <AbsoluteFill>
    <NeonField theme={theme} progress={0.05} />
    <PushIn move="in" amount={0.1}>
      <HeroWord theme={theme} words={["THE", "ENTIRE", "CITY"]} holdFrames={22} />
    </PushIn>
  </AbsoluteFill>
);

const Beat2: React.FC = () => (
  <AbsoluteFill>
    <NeonField theme={theme} progress={0.3} originY={55} />
    <DataStream
      theme={theme}
      sources={[
        { x: 18, y: 34, label: "Cameras" },
        { x: 82, y: 32, label: "GPS" },
        { x: 16, y: 78, label: "Sensors" },
        { x: 84, y: 80, label: "Transit" },
      ]}
      hub={{ x: 50, y: 56 }}
    />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: scaleToWidth(150, 1080), paddingLeft: 48, paddingRight: 48 }}>
      <span style={{ fontFamily: theme.type.display, fontWeight: theme.type.weight.black, fontSize: scaleToWidth(76, 1080), color: theme.palette.ink, letterSpacing: 1 }}>
        ONE LIVE SYSTEM
      </span>
    </AbsoluteFill>
  </AbsoluteFill>
);

const Beat3: React.FC = () => (
  <AbsoluteFill>
    <NeonField theme={theme} progress={0.5} />
    <PushIn move="left" amount={4}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: scaleToWidth(40, 1080) }}>
        <GlassTile theme={theme} widthPx={560} heightPx={200} depth={0.4} delay={2}>
          <div style={{ height: "40%", width: "55%", borderRadius: 12, background: theme.palette.accent }} />
        </GlassTile>
        <GlassTile theme={theme} widthPx={620} heightPx={260} delay={8}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ height: 22, width: "70%", borderRadius: 8, background: "rgba(255,255,255,0.22)" }} />
            <div style={{ height: 16, width: "50%", borderRadius: 8, background: "rgba(255,255,255,0.12)" }} />
            <div style={{ height: 16, width: "60%", borderRadius: 8, background: "rgba(255,255,255,0.12)" }} />
          </div>
        </GlassTile>
      </AbsoluteFill>
    </PushIn>
  </AbsoluteFill>
);

const Beat4: React.FC = () => (
  <AbsoluteFill>
    <NeonField theme={theme} progress={0.78} glow={0.7} />
    <BigStat
      theme={theme}
      value={10.5}
      format={{ decimals: 1, suffix: " HRS" }}
      label="Traffic recovered in"
      context="40 minutes ahead"
    />
  </AbsoluteFill>
);

const Beat5: React.FC = () => (
  <AbsoluteFill>
    <NeonField theme={theme} progress={0.95} />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: scaleToWidth(90, 1080) }}>
      <TypeReveal theme={theme} text={"See it before\nit spreads."} fontSizePx={96} charsPerSecond={22} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const BEATS: Beat[] = [
  { id: "b1", durationSeconds: 3, idea: "establish scale", onScreenText: "THE ENTIRE CITY", scene: Beat1 },
  { id: "b2", durationSeconds: 3.5, idea: "data aggregation", onScreenText: "ONE LIVE SYSTEM", scene: Beat2, enterOverlay: () => <LightSweep theme={theme} />, overlayFrames: 14 },
  { id: "b3", durationSeconds: 3, idea: "the product", onScreenText: "", scene: Beat3, enterOverlay: () => <LightSweep theme={theme} /> },
  { id: "b4", durationSeconds: 4, idea: "the number", onScreenText: "10.5 HRS", scene: Beat4, enterOverlay: () => <ExpandingRing theme={theme} />, overlayFrames: 18 },
  { id: "b5", durationSeconds: 2.5, idea: "call to action", onScreenText: "See it before it spreads", scene: Beat5 },
];

export const MotionDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <MotionSequence beats={BEATS} />
  </AbsoluteFill>
);

export const MOTION_DEMO_DURATION = Math.round((3 + 3.5 + 3 + 4 + 2.5) * 30);
