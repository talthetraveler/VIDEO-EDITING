import React, { useMemo } from "react";
import { AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";
import type { LiquidGlassGraphProps } from "./settings";

/**
 * Velocity line graph on a liquid glass card, over your own clip.
 * The glass refracts the footage behind it: a frosted blur, the edges bend the image outward like a lens, with a slight
 * colour split at the rim. The refraction profile follows liquid-glass-js by Armagan Amcalar (MIT licence).
 * Ported from Tal's toolkit PDF ("Liquid Glass Velocity Graph"); settings arrive as props.
 */
const { fontFamily: SANS } = loadSans("normal", { weights: ["800"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["500"] });

const W = 900;          // card width
const HC = 610;         // card height
const R = 34;           // corner radius
const GRAPH_H = 420;    // graph area height
const PAD = 40;         // the line runs inside the card's side padding
const MAP_SCALE = 400;  // a refraction-map value of 1.0 moves a pixel 200 px

// Timing (seconds, counted from startAt).
const T_RISE = 0.22, T_DRAW_START = 0.18, T_PUNCH = 0.28, T_EXIT = 0.3;

const rgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

// The refraction map for the card, built once. Red = sideways offset, green = vertical offset, 128 = none.
// Offset = outward direction x (a wide edge band + a sharp rim + a faint lens across the middle), scaled by `bend`.
const useRefractionMap = (bend: number) =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = W; c.height = HC;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(W, HC);
    const cx = W / 2, cy = HC / 2;
    for (let y = 0; y < HC; y++) {
      for (let x = 0; x < W; x++) {
        const qx = Math.abs(x + 0.5 - cx) - (cx - R), qy = Math.abs(y + 0.5 - cy) - (cy - R);
        const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R;
        const d = Math.max(-outside, 0);                                   // distance in from the edge, px
        const nx = (x + 0.5 - cx) / cx, ny = (y + 0.5 - cy) / cy;
        const len = Math.hypot(nx, ny) || 1;
        const px = bend * 1920 * (0.045 * Math.exp(-0.05 * d) + 0.06 * Math.exp(-0.35 * d) + 0.012 * (1 - Math.exp(-0.1 * d)));
        const i = (y * W + x) * 4;
        img.data[i] = Math.round(255 * Math.min(1, Math.max(0, 0.5 + (px * nx) / len / MAP_SCALE)));
        img.data[i + 1] = Math.round(255 * Math.min(1, Math.max(0, 0.5 + (px * ny) / len / MAP_SCALE)));
        img.data[i + 2] = 128;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL("image/png");
  }, [bend]);

const Clip: React.FC<{ src: string; muted?: boolean }> = ({ src, muted }) => (
  <OffthreadVideo src={staticFile(src)} muted={muted}
    style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, objectFit: "cover" }} />
);

// The light that sells glass: a bright rim fading round the edge, a soft highlight top left, an inner top highlight.
const GlassRim: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, borderRadius: R, padding: 2,
      background: "linear-gradient(140deg, rgba(255,255,255,0.75), rgba(255,255,255,0.10) 32%, rgba(255,255,255,0.04) 62%, rgba(255,255,255,0.38))",
      WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
    <div style={{ position: "absolute", inset: 0, borderRadius: R,
      background: "radial-gradient(120% 70% at 12% -10%, rgba(255,255,255,0.20), rgba(255,255,255,0) 50%)",
      boxShadow: "inset 0 1.5px 1px rgba(255,255,255,0.45), inset 0 -18px 40px rgba(255,255,255,0.05)" }} />
  </>
);

export const LiquidGlassGraph: React.FC<LiquidGlassGraphProps> = (S) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - S.startAt;    // time since the card started
  const map = useRefractionMap(S.bend);

  const formatValue = (v: number) =>
    `${S.prefix}${v.toLocaleString("en-US", { minimumFractionDigits: S.decimals, maximumFractionDigits: S.decimals })}`;

  const drawEnd = T_DRAW_START + S.drawSeconds;
  const exitStart = drawEnd + S.holdSeconds;
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

  // 1. The card rises in: fast start, long soft landing.
  const rise = interpolate(t, [0, T_RISE], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  // 2. The velocity ramp: the line creeps, rushes through the middle and lands softly.
  const draw = interpolate(t, [T_DRAW_START, drawEnd], [0, 1], { ...clamp, easing: Easing.bezier(0.7, 0, 0.25, 1) });
  // 3. A small punch when the line lands, settling exactly back to rest.
  const punch = interpolate(t, [drawEnd - 0.04, drawEnd + 0.08, drawEnd + T_PUNCH], [0, 1, 0], { ...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1) });
  // 4. The exit: the card sinks a little and fades, accelerating away.
  const exit = interpolate(t, [exitStart, exitStart + T_EXIT], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.9, 0.4) });

  const visible = t >= 0 && exit < 1;
  const s = (0.96 + 0.04 * rise) * (1 + 0.035 * punch);
  const dy = (1 - rise) * 60 + exit * 40;
  const op = rise * (1 - exit);

  // Where the card is on screen this frame (scaled about its centre), so the glass lines up with it.
  const cx = 540, cy = S.cardTop + HC / 2 + dy;
  const rx = cx - (W * s) / 2, ry = cy - (HC * s) / 2, rw = W * s, rh = HC * s;

  // The node always leads: find the head by arc length and cut the line and fill exactly there.
  const pts = S.shape.map((y, i) => [PAD + (i / (S.shape.length - 1)) * (W - 2 * PAD), (1 - y) * GRAPH_H]);
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let left = draw * total, k = 0;
  while (k < seg.length - 1 && left > seg[k]) { left -= seg[k]; k++; }
  const u = seg[k] ? Math.min(1, left / seg[k]) : 0;
  const head = [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u];
  const d = [...pts.slice(0, k + 1), head].map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const value = S.startValue + (S.endValue - S.startValue) * draw;
  const text = rgb(S.textColour), line = rgb(S.lineColour);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Clip src={S.clipFile} />

      {visible && (
        <>
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id="liquid-glass" filterUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920} colorInterpolationFilters="sRGB">
              <feImage href={map} x={rx} y={ry} width={rw} height={rh} preserveAspectRatio="none" result="map" />
              <feGaussianBlur in="SourceGraphic" stdDeviation={S.frost} result="frost" />
              {/* three passes, each bent a little less, give the slight colour split at the rim */}
              <feDisplacementMap in="frost" in2="map" scale={MAP_SCALE * s} xChannelSelector="R" yChannelSelector="G" result="dR" />
              <feDisplacementMap in="frost" in2="map" scale={MAP_SCALE * s * 0.96} xChannelSelector="R" yChannelSelector="G" result="dG" />
              <feDisplacementMap in="frost" in2="map" scale={MAP_SCALE * s * 0.92} xChannelSelector="R" yChannelSelector="G" result="dB" />
              <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
              <feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
              <feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
              <feComposite in="r" in2="g" operator="arithmetic" k2={1} k3={1} result="rg" />
              <feComposite in="rg" in2="b" operator="arithmetic" k2={1} k3={1} />
            </filter>
          </svg>

          {/* your clip again, refracted, cut to the card's shape */}
          <div style={{ position: "absolute", inset: 0, opacity: op,
            clipPath: `inset(${ry}px ${1080 - rx - rw}px ${1920 - ry - rh}px ${rx}px round ${R * s}px)` }}>
            <div style={{ position: "absolute", inset: 0, filter: "url(#liquid-glass)" }}><Clip src={S.clipFile} muted /></div>
          </div>

          {/* the glass surface, the light on it and the graph */}
          <div style={{ position: "absolute", left: (1080 - W) / 2, top: S.cardTop, width: W, height: HC, borderRadius: R,
            background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(180,180,180,0.03) 60%, rgba(0,0,0,0.12))",
            boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
            opacity: op, transform: `translateY(${dy}px) scale(${s})`, transformOrigin: "50% 50%" }}>
            <GlassRim />
            <div style={{ position: "relative", padding: "34px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 40px 18px" }}>
                <span style={{ fontFamily: MONO, fontSize: 32, letterSpacing: 4, color: `rgba(${text},0.8)`, textShadow: "0 1px 8px rgba(0,0,0,0.45)" }}>{S.title}</span>
                <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: S.textColour, letterSpacing: -2, textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}>
                  {formatValue(value)}<span style={{ fontSize: 46 }}>{S.suffix}</span>
                </span>
              </div>
              <svg width={W} height={GRAPH_H} style={{ display: "block", overflow: "visible" }}>
                <defs>
                  <linearGradient id="lg-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor={S.lineColour} stopOpacity={0.45} />
                    <stop offset="1" stopColor={S.lineColour} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((g) => (
                  <line key={g} x1={PAD} x2={W - PAD} y1={g * GRAPH_H} y2={g * GRAPH_H} stroke={`rgba(${text},0.1)`} strokeWidth={2} />
                ))}
                <path d={`${d} L${head[0]},${GRAPH_H} L${PAD},${GRAPH_H} Z`} fill="url(#lg-fill)" opacity={Math.min(1, draw * 4)} />
                <path d={d} fill="none" stroke={S.lineColour} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 10px rgba(${line},0.8))` }} />
                <circle cx={head[0]} cy={head[1]} r={13} fill={S.nodeColour} stroke={S.lineColour} strokeWidth={6} opacity={draw > 0.01 ? 1 : 0} />
              </svg>
            </div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
