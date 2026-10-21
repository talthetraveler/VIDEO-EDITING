// EFFECT OF THE DAY — default settings for the three effects in Tal's toolkit PDF
// (tal_video_toolkit.pdf, 2026-10-21). Each effect is a composition in
// ./Root.tsx; `scripts/effect.mjs` fills the clip values and the user's
// settings in as input props, so these are only the starting point.
// Times are seconds into the clip. Colours are hex.

export type LiquidGlassGraphProps = {
  clipFile: string;   // relative to the render's public dir
  clipSeconds: number;
  clipFps: number;
  startAt: number;    // when the glass card rises in
  title: string;      // small label, top left of the card
  startValue: number; // the counter starts here...
  endValue: number;   // ...and counts up to here as the line draws
  prefix: string;     // e.g. "$"
  suffix: string;     // e.g. "%", "K"
  decimals: number;
  lineColour: string;
  nodeColour: string;
  textColour: string;
  shape: number[];    // the line's heights left to right, 0 = bottom, 1 = top
  drawSeconds: number;
  holdSeconds: number;
  cardTop: number;    // px from the top of the 1080x1920 frame
  frost: number;      // 0 = clear, 12 = heavy
  bend: number;       // 0 = flat, 1.5 = strong lens edge
};

export const LIQUID_GLASS_GRAPH: LiquidGlassGraphProps = {
  clipFile: "input/my-clip.mp4",
  clipSeconds: 10,
  clipFps: 30,
  startAt: 1.0,
  title: "RETENTION",
  startValue: 18,
  endValue: 82,
  prefix: "",
  suffix: "%",
  decimals: 0,
  lineColour: "#22C55E",
  nodeColour: "#FFFFFF",
  textColour: "#F4EFE6",
  shape: [0.18, 0.22, 0.26, 0.34, 0.4, 0.52, 0.64, 0.78, 0.92],
  drawSeconds: 1.16,
  holdSeconds: 1.5,
  cardTop: 900,
  frost: 7,
  bend: 1.0,
};

export type ScreenPushWord = { text: string; start: number };

export type ScreenPushProps = {
  clipFile: string;
  clipSeconds: number;
  clipFps: number;
  // The screen cuts in on the first word, cuts to each word as it is said,
  // and cuts back to the clip at endAt.
  words: ScreenPushWord[];
  endAt: number;
  textColour: string;
  allCaps: boolean;
  zoom: number;         // 2 = a few words show, 3.1 = one word fills the frame
  pixelSize: number;    // one screen pixel before the zoom (6 fine, 14 chunky)
  screenColour: string; // the unlit screen
  fringe: number;       // red/cyan split at the letters' edges, px
  glow: number;         // 0 none, 1 strong
  focusFalloff: number; // blur above and below the line (0 all sharp)
};

export const SCREEN_PUSH: ScreenPushProps = {
  clipFile: "input/my-clip.mp4",
  clipSeconds: 10,
  clipFps: 30,
  words: [
    { text: "you", start: 0.3 }, { text: "post", start: 0.55 }, { text: "every", start: 0.85 },
    { text: "single", start: 1.15 }, { text: "day,", start: 1.5 }, { text: "and", start: 2.0 },
    { text: "still", start: 2.25 }, { text: "no", start: 2.6 }, { text: "booked", start: 2.85 },
    { text: "calls.", start: 3.2 },
  ],
  endAt: 3.7,
  textColour: "#FFFFFF",
  allCaps: false,
  zoom: 3.1,
  pixelSize: 10,
  screenColour: "#363636",
  fringe: 3,
  glow: 0.85,
  focusFalloff: 5,
};

export type ShoulderCard = { label: string; big: string; small: string };

export type OverTheShoulderProps = {
  clipFile: string;
  clipSeconds: number;
  clipFps: number;
  // "normal": push in, look at the start card, whip to the end card, pull back.
  // "transition": the same, and the start card's big text breaks into light
  // and streaks across into the end card.
  style: "normal" | "transition";
  start: ShoulderCard; // over the left shoulder, shown first
  end: ShoulderCard;   // over the right shoulder, shown second
  startAt: number;     // the whole move takes 4.6 s from here
  accent: string;
  // Where the face is, so the clip is framed the way the effect was designed
  // (head ~a third of the frame wide, eyes ~a quarter down, face centred).
  faceX: number;       // 0 = left edge, 1 = right edge
  faceWidth: number;   // ear to ear, as a share of frame width
  eyeY: number;        // 0 = top, 1 = bottom
};

export const OVER_THE_SHOULDER: OverTheShoulderProps = {
  clipFile: "input/my-clip.mp4",
  clipSeconds: 10,
  clipFps: 30,
  style: "normal",
  start: { label: "BEFORE", big: "$3,200", small: "per month" },
  end: { label: "AFTER", big: "$32,000", small: "per month" },
  startAt: 1.0,
  accent: "#B03926",
  faceX: 0.5,
  faceWidth: 0.32,
  eyeY: 0.255,
};
