import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import type { Caption } from "@remotion/captions";
import {
  Frame,
  Headline,
  BigStat,
  BarGraph,
  RouteMap,
  ComparisonGraphic,
  Timeline,
  PhoneMockup,
  Callout,
  LogoReveal,
  Captions,
  TitleCard,
  editorialTheme,
  scaleToWidth,
} from "../../components";
import { loadFonts } from "../../lib/fonts";

loadFonts();
const theme = editorialTheme;

/**
 * SYSTEM SHOWCASE — vertical 9:16.
 * Every scene uses a different reusable component so the preview doubles as a
 * living component catalogue. Real projects live in sibling folders and only
 * pull the components they need.
 */

const Pad: React.FC<{ children: React.ReactNode; center?: boolean }> = ({ children, center }) => {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        padding: scaleToWidth(theme.safe.x, width),
        paddingTop: scaleToWidth(theme.safe.top, width),
        paddingBottom: scaleToWidth(theme.safe.bottom, width),
        justifyContent: center ? "center" : "flex-start",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const HookScene: React.FC = () => (
  <Frame theme={theme}>
    <TitleCard theme={theme} text="One outage stopped a whole city" emoji="🚦" />
    <Pad center>
      <Headline
        theme={theme}
        size="h2"
        text="The whole city stopped."
        accentWords={["whole", "city", "stopped."]}
      />
    </Pad>
  </Frame>
);

const StatScene: React.FC = () => (
  <Frame theme={theme}>
    <BigStat
      theme={theme}
      value={10.5}
      format={{ decimals: 1, suffix: " HOURS" }}
      label="Time to recover"
      context="for traffic to return to normal"
      viz={
        <BarGraph
          theme={theme}
          unit="h"
          bars={[
            { label: "Normal day", value: 0.5 },
            { label: "Outage day", value: 10.5, highlight: true },
          ]}
        />
      }
    />
  </Frame>
);

const RouteScene: React.FC = () => (
  <Frame theme={theme} vignette={false}>
    <RouteMap theme={theme} originLabel="Depot" destLabel="Downtown" drawFrames={46} />
  </Frame>
);

const CompareScene: React.FC = () => (
  <Frame theme={theme}>
    <ComparisonGraphic
      theme={theme}
      left={{ label: "Before", value: "42 min" }}
      right={{ label: "After", value: "9 min" }}
    />
  </Frame>
);

const TimelineScene: React.FC = () => (
  <Frame theme={theme}>
    <Pad>
      <Headline theme={theme} size="h2" text="How the day unfolded" />
      <div style={{ height: 40 }} />
      <Timeline
        theme={theme}
        events={[
          { time: "07:14", label: "First error reported" },
          { time: "08:02", label: "Systems fully down", highlight: true },
          { time: "12:30", label: "Partial recovery" },
          { time: "17:45", label: "Back to normal" },
        ]}
      />
    </Pad>
  </Frame>
);

const PhoneScene: React.FC = () => (
  <Frame theme={theme}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <PhoneMockup theme={theme} enterFrom="bottom">
        <AbsoluteFill
          style={{
            background: `linear-gradient(160deg, ${theme.palette.bgAlt}, #1f1f2b)`,
            padding: 40,
            gap: 18,
          }}
        >
          <div style={{ height: 60, borderRadius: 14, background: theme.palette.accent, width: "55%" }} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 84, borderRadius: 16, background: "rgba(255,255,255,0.06)" }} />
          ))}
        </AbsoluteFill>
      </PhoneMockup>
    </AbsoluteFill>
    <Callout theme={theme} label="Live status page" x={58} y={30} dir="left" delay={18} />
  </Frame>
);

const OutroScene: React.FC = () => (
  <Frame theme={theme} vignette={false}>
    <LogoReveal theme={theme} wordmark="VIDEO STUDIO" tagline="drop a script. get a film." />
  </Frame>
);

const DEMO_CAPTIONS: Caption[] = [
  { text: "One outage", startMs: 200, endMs: 900, timestampMs: 550, confidence: 1 },
  { text: " stopped", startMs: 900, endMs: 1500, timestampMs: 1200, confidence: 1 },
  { text: " an entire city.", startMs: 1500, endMs: 2600, timestampMs: 2000, confidence: 1, pageBreakAfter: true },
  { text: "Traffic took", startMs: 3200, endMs: 3900, timestampMs: 3500, confidence: 1 },
  { text: " ten and a half hours", startMs: 3900, endMs: 5200, timestampMs: 4500, confidence: 1 },
  { text: " to recover.", startMs: 5200, endMs: 6200, timestampMs: 5700, confidence: 1, pageBreakAfter: true },
];

export const Demo: React.FC = () => {
  const { fps } = useVideoConfig();
  const F = (s: number) => Math.round(s * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.palette.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={F(3)} name="Hook">
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 10 })} />
        <TransitionSeries.Sequence durationInFrames={F(4)} name="Stat">
          <StatScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={F(4)} name="Route">
          <RouteScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 10 })} />
        <TransitionSeries.Sequence durationInFrames={F(3.5)} name="Compare">
          <CompareScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={F(4.5)} name="Timeline">
          <TimelineScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 10 })} />
        <TransitionSeries.Sequence durationInFrames={F(4)} name="Phone">
          <PhoneScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={F(3)} name="Outro">
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* caption track demo — first ~6s */}
      {/* default position is "center" (his real style); "lower" here so the
          catalogue's other centred text stays readable */}
      <Captions theme={theme} captions={DEMO_CAPTIONS} emphasize={/hours|city/i} position="lower" />
    </AbsoluteFill>
  );
};

/** total ≈ 3+4+4+3.5+4.5+4+3 = 26s minus ~76f of transitions. */
export const DEMO_DURATION_IN_FRAMES = Math.round(26 * 30) - 76;
