import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, OffthreadVideo, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import type { ScreenPushProps } from "./settings";

/**
 * Screen push: a macro shot of a monitor built entirely in code, flat on. The line you say sits on one row of an LCD
 * (red, green and blue subpixels, dark gaps, a phosphor glow, a sharp band with soft focus above and below), and the
 * camera hard-cuts to each word the moment you say it. No glide: one word, cut, the next word. Your audio never stops.
 * Ported from Tal's toolkit PDF ("EP. 03 Screen Push"); settings arrive as props.
 */
const { fontFamily: FONT, waitUntilDone } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

const SIZE = 150;            // type size on the screen plane, px
const TRACK = -0.01 * SIZE;  // letter spacing, px
const PAD = 1400;            // screen above and below the row, so the frame is always pixels edge to edge

type Placed = { text: string; start: number; x: number; w: number };

// Lay the words out on one row, measured in the loaded font.
const layout = (S: ScreenPushProps): Placed[] => {
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = `700 ${SIZE}px ${FONT}`;
  const width = (t: string) => ctx.measureText(t).width + TRACK * t.length;
  const space = width(" ");
  let x = 0;
  return S.words.map((w) => {
    const text = S.allCaps ? w.text.toUpperCase() : w.text;
    const p = { text, start: w.start, x, w: width(text) };
    x += p.w + space;
    return p;
  });
};

const Clip: React.FC<{ src: string }> = ({ src }) => (
  <OffthreadVideo src={staticFile(src)}
    style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, objectFit: "cover" }} />
);

// One LCD pixel: three rounded subpixel capsules (R, G, B) with dark gaps between pixels and rows.
const subpixels = (P: number) => {
  const k = P / 10;
  return [["#ff8a7a", 2], ["#9affb0", 6], ["#8aa8ff", 10]].map(([c, x]) =>
    `radial-gradient(ellipse ${1.7 * k}px ${4.3 * k}px at ${(x as number) * k}px ${5.5 * k}px, ${c} 70%, transparent 100%)`).join(", ");
};

const Words: React.FC<{ words: Placed[]; color: string; dx?: number }> = ({ words, color, dx = 0 }) => (
  <>
    {words.map((p, i) => (
      <div key={i} style={{ position: "absolute", left: p.x + dx, top: PAD - SIZE * 0.82, fontFamily: FONT, fontWeight: 700,
        fontSize: SIZE, lineHeight: 1, color, whiteSpace: "pre", letterSpacing: TRACK }}>{p.text}</div>
    ))}
  </>
);

// The screen: lit text with a red copy left and a cyan copy right, multiplied by the subpixel grid, so the whole
// screen is dots (dim where nothing is lit). left/width cut a window of the row around the current word.
const Plane: React.FC<{ S: ScreenPushProps; words: Placed[]; left: number; width: number }> = ({ S, words, left, width }) => (
  <div style={{ position: "absolute", left, top: 0, width, height: 2 * PAD, background: S.screenColour, isolation: "isolate", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: -left, top: 0 }}>
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}><Words words={words} color="#ff3020" dx={-S.fringe} /></div>
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}><Words words={words} color="#20d8ff" dx={S.fringe} /></div>
      <Words words={words} color={S.textColour} />
    </div>
    <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", backgroundColor: "#000",
      backgroundImage: subpixels(S.pixelSize), backgroundSize: `${S.pixelSize}px ${S.pixelSize}px` }} />
  </div>
);

export const ScreenPush: React.FC<ScreenPushProps> = (S) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // Measure only once the font has loaded, so every word is centred on its real width.
  const [handle] = useState(() => delayRender("Loading the font"));
  const [ready, setReady] = useState(false);
  useEffect(() => { waitUntilDone().then(() => { setReady(true); continueRender(handle); }); }, [handle]);
  const placed = useMemo(() => (ready ? layout(S) : []), [ready, S]);

  const on = placed.length > 0 && t >= placed[0].start && t < S.endAt;
  if (!on) return <AbsoluteFill style={{ backgroundColor: "#000" }}><Clip src={S.clipFile} /></AbsoluteFill>;

  // The word being said right now.
  let i = 0;
  while (i < placed.length - 1 && t >= placed[i + 1].start) i++;
  const cur = placed[i];
  // A hard cut per word, with a tiny per-word offset (up to 5 px) so the cuts read as separate frames.
  const jx = ((i * 37) % 11) - 5, jy = ((i * 23) % 9) - 4;
  const cx = cur.x + cur.w / 2 + jx, cy = PAD - SIZE * 0.36 + jy;
  // As close as `zoom`, but a long word always fits with a little of the screen either side.
  const zoom = Math.min(S.zoom, (0.84 * width) / cur.w);
  // Only the part of the row the camera can see, snapped to the pixel grid so the dots never shift.
  const P = S.pixelSize;
  const half = width / 2 / zoom + 4 * P;
  const left = Math.floor((cx - half) / P) * P, span = Math.ceil((2 * half) / P + 2) * P;
  const near = placed.filter((p) => p.x + p.w + 2 * S.fringe > left && p.x - 2 * S.fringe < left + span);

  return (
    <AbsoluteFill style={{ backgroundColor: S.screenColour, overflow: "hidden" }}>
      <Clip src={S.clipFile} />
      <AbsoluteFill style={{ backgroundColor: S.screenColour, filter: "blur(0.4px)" }}>
        <div style={{ position: "absolute", left: width / 2, top: height / 2, transformOrigin: "0 0",
          transform: `scale(${zoom}) translate(${-cx}px, ${-cy}px)` }}>
          <Plane S={S} words={near} left={left} width={span} />
          {/* phosphor bloom: the lit dots bleed into white light, as on a real screen */}
          <div style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen", filter: "blur(4px) brightness(1.6)", opacity: S.glow }}>
            <Plane S={S} words={near} left={left} width={span} />
          </div>
        </div>
      </AbsoluteFill>
      {/* macro focus fall-off: soft above and below the row */}
      {S.focusFalloff > 0 && (
        <AbsoluteFill style={{ backdropFilter: `blur(${S.focusFalloff}px)`,
          WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 34%, transparent 66%, #000 100%)" }} />
      )}
    </AbsoluteFill>
  );
};
