import React from "react";
import { CalculateMetadataFunction, Composition, Folder } from "remotion";
import { LiquidGlassGraph } from "./LiquidGlassGraph";
import { ScreenPush } from "./ScreenPush";
import { OverTheShoulder } from "./OverTheShoulder";
import { LOGO_OUTRO, LogoOutro } from "./LogoOutro";
import type { LogoOutroProps } from "./LogoOutro";
import { LIQUID_GLASS_GRAPH, OVER_THE_SHOULDER, SCREEN_PUSH } from "./settings";
import type { LiquidGlassGraphProps, OverTheShoulderProps, ScreenPushProps } from "./settings";

// The Effect-of-the-Day effects from Tal's toolkit PDF. A separate entry point
// from src/index.ts on purpose: bundling the main Root copies public/ (~5 GB);
// scripts/effect.mjs renders this one with --public-dir pointing at a folder
// that holds only the one clip. Length and frame rate follow the clip.
type ClipProps = { clipSeconds: number; clipFps: number };
const fromClip = <T extends ClipProps>(): CalculateMetadataFunction<T> => ({ props }) => ({
  fps: props.clipFps,
  durationInFrames: Math.max(1, Math.round(props.clipSeconds * props.clipFps)),
});

export const EffectsRoot: React.FC = () => (
  <Folder name="Effects">
    <Composition id="LiquidGlassGraph" component={LiquidGlassGraph} width={1080} height={1920}
      fps={30} durationInFrames={300} defaultProps={LIQUID_GLASS_GRAPH} calculateMetadata={fromClip<LiquidGlassGraphProps>()} />
    <Composition id="ScreenPush" component={ScreenPush} width={1080} height={1920}
      fps={30} durationInFrames={300} defaultProps={SCREEN_PUSH} calculateMetadata={fromClip<ScreenPushProps>()} />
    <Composition id="OverTheShoulder" component={OverTheShoulder} width={1080} height={1920}
      fps={30} durationInFrames={300} defaultProps={OVER_THE_SHOULDER} calculateMetadata={fromClip<OverTheShoulderProps>()} />
    <Composition id="LogoOutro" component={LogoOutro} width={1080} height={1920} fps={30} durationInFrames={90}
      defaultProps={LOGO_OUTRO} calculateMetadata={({ props }: { props: LogoOutroProps }) => ({ durationInFrames: Math.round(props.seconds * 30) })} />
  </Folder>
);
