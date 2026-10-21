import React, { useEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, Easing, OffthreadVideo, continueRender, delayRender, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";
import type { OverTheShoulderProps, ShoulderCard } from "./settings";

// Effect of the Day: the over-the-shoulder zoom. The camera pushes in on you, looks to a card over one shoulder,
// whips across to a card over the other, and pulls back out. Style "transition": the start card's big text breaks
// into light, streaks across at light speed and rebuilds as the end card's big text.
// Ported from Tal's toolkit PDF ("EP. 04 Over-the-Shoulder Zoom"); settings arrive as props.

const sans = loadSans("normal", { weights: ["700", "800"] });
const mono = loadMono("normal", { weights: ["400"] });
const W = 1080, H = 1920, RES = 2, INK = "#1F1E1B", GREY = "#8A8A8E";
const k = (t: number, a: number, b: number, from: number, to: number, ease = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(t, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const useT = () => { const f = useCurrentFrame(), { fps } = useVideoConfig(); return { f, fps, t: f / fps }; };

// ---------- the camera: measured curves (progress per ninth of the move), zoom in log space, every move lands exactly on its value
type Move = { t: number; kind: "in" | "pan" | "whip" | "drift" | "return"; to: number; x?: number; dur?: number };
const CURVES = { in: [0, 0.21, 0.43, 0.61, 0.73, 0.83, 0.9, 0.96, 1], out: [0, 0.14, 0.37, 0.57, 0.71, 0.8, 0.87, 0.94, 1] };
const CURVE_OF: Record<Move["kind"], "in" | "out"> = { in: "in", pan: "in", whip: "in", drift: "out", return: "out" };
const DUR_OF: Record<Move["kind"], number> = { in: 0.36, pan: 0.42, whip: 0.5, drift: 0.42, return: 0.9 };
const progress = (kind: Move["kind"], u: number) => {
  if (u <= 0) return 0; if (u >= 1) return 1;
  const p = CURVES[CURVE_OF[kind]], x = u * (p.length - 1), i = Math.floor(x), f = x - i;
  const m = (j: number) => (p[Math.min(j + 1, p.length - 1)] - p[Math.max(j - 1, 0)]) / (Math.min(j + 1, p.length - 1) - Math.max(j - 1, 0));
  return (2 * f ** 3 - 3 * f ** 2 + 1) * p[i] + (f ** 3 - 2 * f ** 2 + f) * m(i) + (-2 * f ** 3 + 3 * f ** 2) * p[i + 1] + (f ** 3 - f ** 2) * m(i + 1);
};
const cameraAt = (moves: Move[], t: number) => {
  let z = 1, x = 0;
  for (const m of moves) {
    if (t < m.t) break;
    const d = m.dur ?? DUR_OF[m.kind], u = (t - m.t) / d, p = progress(m.kind, u);
    const from = z, fx = x;
    z = Math.exp(Math.log(from) + (Math.log(m.to) - Math.log(from)) * p);
    if (m.x !== undefined) x = fx + (m.x - fx) * p;
    if (u >= 1) { z = m.to; if (m.x !== undefined) x = m.x; }
  }
  return { z, x };
};
const movesFrom = (T0: number): Move[] => [
  { t: T0 + 0.05, kind: "in", to: 1.25, dur: 0.5 },          // push in
  { t: T0 + 0.9, kind: "pan", to: 1.25, x: 110 },            // look at the start card
  { t: T0 + 2.4, kind: "whip", to: 1.27, x: -110 },          // whip to the end card, a 2 % scale bump
  { t: T0 + 2.9, kind: "drift", to: 1.25, dur: 0.2 },        // the bump settles
  { t: T0 + 3.7, kind: "return", to: 1.0, x: 0 },            // pull back out
];
const ANCHOR = { x: 0.5 * W, y: 0.25 * H };                  // the zoom stays centred on the eyes

// your clip, framed the way the effect was designed: head ~0.32 of the frame wide, eyes ~a quarter down, face in the middle
const fitFor = (S: OverTheShoulderProps) => {
  const s = Math.max(1, 0.32 / S.faceWidth);
  const tx = Math.min(0, Math.max(W - s * W, W / 2 - s * S.faceX * W));
  const ty = Math.min(0, Math.max(H - s * H, 0.255 * H - s * S.eyeY * H));
  return { s, tx, ty };
};
const Footage: React.FC<{ S: OverTheShoulderProps; moves: Move[] }> = ({ S, moves }) => {
  const { t } = useT();
  const { z, x: cx } = cameraAt(moves, t);
  const fit = fitFor(S);
  const room = (W / 2) * (z - 1);                             // never slide past the picture's edge
  const x = Math.max(-room, Math.min(room, cx));
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <AbsoluteFill style={{ transform: `translate(${x}px, 0px) scale(${z})`, transformOrigin: `${ANCHOR.x}px ${ANCHOR.y}px` }}>
        <AbsoluteFill style={{ transform: `translate(${fit.tx}px, ${fit.ty}px) scale(${fit.s})`, transformOrigin: "0 0" }}>
          <OffthreadVideo src={staticFile(S.clipFile)} style={{ width: W, height: H, objectFit: "cover" }} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- the cards: a white card over each shoulder, a thin outline and a soft warm glow, tilted 4 degrees, springing in
const CARD = { top: 520, edge: 70, w: 330, padX: 30, padY: 26, radius: 26 };
const EYE_H = 28, BIG_H = 80, BIG_BASE = 63, SUB_H = 34, INNER = CARD.w - 2 * CARD.padX - 6;
const CARD_H = 6 + 2 * CARD.padY + EYE_H + BIG_H + SUB_H;
const bigFont = (size: number) => `800 ${size}px ${sans.fontFamily}`;
// the big text: 64 px, shrunk only if it would not fit; the SAME drawing feeds the card and the light streaks
const drawBig = (ctx: CanvasRenderingContext2D, text: string, color: string) => {
  ctx.setTransform(RES, 0, 0, RES, 0, 0); ctx.clearRect(0, 0, INNER, BIG_H);
  let size = 64; ctx.font = bigFont(size);
  while (size > 26 && ctx.measureText(text).width > INNER) { size -= 2; ctx.font = bigFont(size); }
  ctx.fillStyle = color; ctx.textBaseline = "alphabetic"; ctx.fillText(text, 0, BIG_BASE);
};
const Big: React.FC<{ text: string; color: string; visible: boolean }> = ({ text, color, visible }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = ref.current; if (c) drawBig(c.getContext("2d")!, text, color); }, [text, color]);
  return <canvas ref={ref} width={INNER * RES} height={BIG_H * RES} style={{ display: "block", width: INNER, height: BIG_H, opacity: visible ? 1 : 0 }} />;
};
const Card: React.FC<{ side: "l" | "r"; card: ShoulderCard; accent: string; at: number; out: number; bigVisible: boolean; flash: number }> = ({ side, card, accent, at, out, bigVisible, flash }) => {
  const { f, fps, t } = useT();
  if (t < at || t > out + 0.25) return null;
  const p = spring({ frame: f - Math.round(at * fps), fps, config: { damping: 12, stiffness: 170, mass: 0.7 } }) * (1 - k(t, out, out + 0.2, 0, 1));
  return (
    <div style={{ position: "absolute", top: CARD.top, [side === "l" ? "left" : "right"]: CARD.edge, width: CARD.w,
      padding: `${CARD.padY}px ${CARD.padX}px`, boxSizing: "border-box",
      borderRadius: CARD.radius, backgroundColor: "#FFFFFF", border: `3px solid ${accent}`,
      boxShadow: `0 22px 50px rgba(0,0,0,0.3), 0 0 ${34 + 50 * flash}px rgba(255,236,220,${0.55 + 0.4 * flash})`,
      filter: flash > 0 ? `brightness(${1 + 0.35 * flash})` : undefined,
      transform: `scale(${0.6 + 0.4 * p}) rotate(${side === "l" ? -4 : 4}deg)`, opacity: Math.min(1, p * 2) } as React.CSSProperties}>
      <div style={{ height: EYE_H, fontFamily: mono.fontFamily, fontSize: 22, letterSpacing: 3, color: accent, whiteSpace: "nowrap", overflow: "hidden" }}>{card.label}</div>
      <Big text={card.big} color={side === "l" ? INK : accent} visible={bigVisible} />
      <div style={{ height: SUB_H, fontFamily: sans.fontFamily, fontWeight: 700, fontSize: 26, color: GREY, whiteSpace: "nowrap", overflow: "hidden" }}>{card.small}</div>
    </div>
  );
};

// ---------- the light-speed transition: every lit pixel of the start text flies to a lit pixel of the end text
type P = { sx: number; sy: number; gx: number; gy: number; dep: number; fl: number; r: number };
const samplePts = (text: string, side: "l" | "r") => {
  const c = document.createElement("canvas"); c.width = INNER * RES; c.height = BIG_H * RES;
  const ctx = c.getContext("2d")!; drawBig(ctx, text, "#000");
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const left = side === "l" ? CARD.edge : W - CARD.edge - CARD.w;
  const cx = left + CARD.w / 2, cy = CARD.top + CARD_H / 2, a = ((side === "l" ? -4 : 4) * Math.PI) / 180;
  const pts: { x: number; y: number; xn: number }[] = [];
  for (let y = 0; y < c.height; y += 4) for (let x = 0; x < c.width; x += 4) {
    if (d[(y * c.width + x) * 4 + 3] > 110) {
      const lx = left + 3 + CARD.padX + x / RES - cx, ly = CARD.top + 3 + CARD.padY + EYE_H + y / RES - cy;
      pts.push({ x: cx + lx * Math.cos(a) - ly * Math.sin(a), y: cy + lx * Math.sin(a) + ly * Math.cos(a), xn: x / c.width });
    }
  }
  return pts.sort((p, q) => p.x - q.x);
};
// light speed: almost still, then everything at once, then a hard brake
const warp = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 0.5 * Math.pow(2, 20 * u - 10) : 1 - 0.5 * Math.pow(2, -20 * u + 10));
const posAt = (p: P, t: number, charge: number) => {
  const u = Math.max(0, Math.min(1, (t - p.dep) / p.fl)), e = warp(u), bulge = Math.sin(Math.PI * e);
  let x = p.sx + (p.gx - p.sx) * e, y = p.sy + (p.gy - p.sy) * e + (p.r - 0.5) * 110 * bulge;
  const sh = u <= 0 ? k(t, charge, p.dep, 0, 1, Easing.in(Easing.quad)) : 0;   // the charge before take-off
  x += (random(`x${p.r}${Math.floor(t * 60)}`) - 0.5) * 2.4 * sh; y += (random(`y${p.r}${Math.floor(t * 60)}`) - 0.5) * 2.4 * sh;
  return { x, y, u, e };
};
const Streaks: React.FC<{ ps: P[]; until: number; accent: string; charge: number; depart: number }> = ({ ps, until, accent, charge, depart }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const { t } = useT();
  useEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    ctx.setTransform(RES, 0, 0, RES, 0, 0); ctx.clearRect(0, 0, W, H);
    if (t < charge || t >= until) return;
    const still = new Path2D(), landed = new Path2D(), glow = new Path2D();
    for (const p of ps) {
      const a = posAt(p, t, charge), b = posAt(p, t - 0.045, charge);
      if (a.u <= 0 || a.e < 0.015) still.rect(a.x - 1.2, a.y - 1.2, 2.4, 2.4);
      else if (a.u >= 1 || a.e > 0.985) landed.rect(a.x - 1.2, a.y - 1.2, 2.4, 2.4);
      else { glow.moveTo(b.x, b.y); glow.lineTo(a.x + 0.01, a.y); }
    }
    const c = k(t, charge, depart, 0, 1, Easing.in(Easing.quad));
    ctx.fillStyle = INK; ctx.shadowColor = accent; ctx.shadowBlur = 36 * c; ctx.fill(still); ctx.shadowBlur = 0;
    ctx.fillStyle = accent; ctx.fill(landed);
    ctx.lineCap = "round"; ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = accent + "29"; ctx.lineWidth = 5; ctx.stroke(glow);                       // the coloured glow
    ctx.strokeStyle = "rgba(255,244,236,0.55)"; ctx.lineWidth = 1.3; ctx.stroke(glow);         // the white-hot core
    ctx.globalCompositeOperation = "source-over";
  }, [t, ps, until, accent, charge, depart]);
  return <canvas ref={ref} width={W * RES} height={H * RES} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};

export const OverTheShoulder: React.FC<OverTheShoulderProps> = (S) => {
  const { t } = useT();
  const T0 = S.startAt;
  const DEPART = T0 + 2.38, CHARGE = DEPART - 0.25;
  const moves = useMemo(() => movesFrom(T0), [T0]);
  const transition = S.style === "transition";
  const [ps, setPs] = useState<P[]>([]);
  const [handle] = useState(() => delayRender("fonts and streaks"));
  useEffect(() => {
    Promise.all([sans.waitUntilDone(), mono.waitUntilDone()]).then(() => document.fonts.load(bigFont(64))).then(() => {
      if (transition) {
        const A = samplePts(S.start.big, "l"), G = samplePts(S.end.big, "r"), n = Math.max(A.length, G.length), out: P[] = [];
        for (let i = 0; i < n && A.length && G.length; i++) {
          const s = A[Math.floor((i * A.length) / n)], g = G[Math.floor((i * G.length) / n)], r = random(`p${i}`);
          out.push({ sx: s.x, sy: s.y, gx: g.x, gy: g.y, r, fl: 0.34 * (0.85 + 0.3 * random(`q${i}`)), dep: DEPART + 0.1 * (1 - s.xn) + 0.05 * r });
        }
        setPs(out);
      }
      continueRender(handle);
    });
  }, [handle, transition, S.start.big, S.end.big, DEPART]);
  const arrive = useMemo(() => (ps.length ? ps.reduce((m, p) => Math.max(m, p.dep + p.fl), 0) : T0 + 2.9), [ps, T0]);
  const flash = transition && t >= arrive ? Math.max(0, 1 - (t - arrive) / 0.2) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Footage S={S} moves={moves} />
      <Card side="l" card={S.start} accent={S.accent} at={T0 + 1.0} out={T0 + 2.35} bigVisible={!transition || t < CHARGE} flash={0} />
      <Card side="r" card={S.end} accent={S.accent} at={T0 + (transition ? 2.7 : 2.55)} out={T0 + 3.7} bigVisible={!transition || t >= arrive} flash={flash} />
      {transition && ps.length > 0 && <Streaks ps={ps} until={arrive} accent={S.accent} charge={CHARGE} depart={DEPART} />}
    </AbsoluteFill>
  );
};
