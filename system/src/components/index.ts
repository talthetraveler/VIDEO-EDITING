/** Reusable component library. Import from "../components". */
export { Frame } from "./Frame";
export { Headline } from "./Headline";
export { TitleCard } from "./TitleCard";
export { AnimatedCounter, type CounterFormat } from "./AnimatedCounter";
export { BigStat } from "./BigStat";
export { LowerThird } from "./LowerThird";
export { Callout } from "./Callout";
export { QuoteCard } from "./QuoteCard";
export { PhoneMockup } from "./PhoneMockup";
export { BrowserMockup } from "./BrowserMockup";
export { ScreenshotZoom } from "./ScreenshotZoom";
export { BrollSequence, type BrollClip } from "./BrollSequence";
export { LogoReveal } from "./LogoReveal";
export { AutoCut, autoCutMetadata, type KeepFile } from "./AutoCut";
export { ClipReel, clipReelMetadata, type ReelBeat, type ReelSpec } from "./ClipReel";
export { ReviewBadge } from "./ReviewBadge";
export { ReviewCard } from "./ReviewCard";
export { CompareShots, type ComparePane } from "./CompareShots";

// evidence-board motion graphics (skills/08-creator-formats)
export {
  PaperBackdrop,
  PhotoPrint,
  PhotoStack,
  RedLabelBlock,
  DateStamp,
  HandScribble,
  HandPie,
  EVIDENCE,
  type PrintProps,
} from "./evidence";

// graphics
export { BarGraph, type Bar } from "../graphics/BarGraph";
export { ComparisonGraphic } from "../graphics/ComparisonGraphic";
export { Timeline, type TimelineEvent } from "../graphics/Timeline";

// maps
export { RouteMap } from "../maps/RouteMap";

// captions
export { Captions } from "../captions/Captions";

// MODE B — motion graphics / premium promo
export { NeonField } from "./motion/NeonField";
export { GlassTile } from "./motion/GlassTile";
export { TypeReveal } from "./motion/TypeReveal";
export { HeroWord } from "./motion/HeroWord";
export { DataStream, type StreamSource } from "./motion/DataStream";
export { PushIn } from "./motion/PushIn";
export { MotionSequence } from "./motion/MotionSequence";
export { ExpandingRing, LightSweep, Shockwave } from "./motion/transitions";

// theme + libs
export * from "../theme/theme";
export * from "../theme/formats";
export * from "../lib/animations";
export * from "../lib/safe-area";
export * from "../lib/beats";
