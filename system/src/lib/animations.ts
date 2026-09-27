/**
 * Animation helpers.
 *
 * RULE: In SCENES, keep interpolate() calls inline in the style prop so the user
 * can tweak keyframes in Remotion Studio. Use these helpers for the internal
 * mechanics of reusable COMPONENTS, where inline-editability matters less.
 *
 * Everything is frame-driven. Never use CSS transitions/animations.
 */

import { Easing, interpolate } from "remotion";

/** Easing presets — named so scenes read clearly. */
export const EASE = {
  /** Snappy UI-style ease-out (default for enters). */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Gentle ease-in-out for slow drifts / camera moves. */
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
  /** Fast in, for exits. */
  in: Easing.bezier(0.55, 0, 1, 0.45),
  linear: Easing.linear,
  /** Physical settle with no bounce. */
  spring: Easing.spring({ damping: 200 }),
} as const;

type Range = { extrapolateLeft?: "clamp" | "extend"; extrapolateRight?: "clamp" | "extend" };
const CLAMP: Range = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

/** 0→1 over [start, start+dur] with ease-out. */
export const enter = (frame: number, start = 0, dur = 12) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...CLAMP, easing: EASE.out });

/** 1→0 over the last `dur` frames before `end`. */
export const exit = (frame: number, end: number, dur = 10) =>
  interpolate(frame, [end - dur, end], [1, 0], { ...CLAMP, easing: EASE.in });

/**
 * Fade + optional slide/scale enter, fade exit. Returns a style object.
 * `total` is the clip length in frames.
 */
export const enterExit = (
  frame: number,
  total: number,
  opts: { in?: number; out?: number; slideY?: number; scaleFrom?: number } = {},
): React.CSSProperties => {
  const inDur = opts.in ?? 12;
  const outDur = opts.out ?? 10;
  const e = enter(frame, 0, inDur);
  const x = exit(frame, total, outDur);
  const opacity = Math.min(e, x);
  const style: React.CSSProperties = { opacity };
  if (opts.slideY !== undefined) {
    style.translate = `0px ${interpolate(e, [0, 1], [opts.slideY, 0])}px`;
  }
  if (opts.scaleFrom !== undefined) {
    style.scale = interpolate(e, [0, 1], [opts.scaleFrom, 1]);
  }
  return style;
};

/** Ken-Burns / punch-in scale for photos & screenshots. */
export const punchIn = (
  frame: number,
  total: number,
  from = 1,
  to = 1.12,
): number =>
  interpolate(frame, [0, total], [from, to], { ...CLAMP, easing: EASE.inOut });

/** Count a number up from 0 → value over [start, start+dur]. */
export const countUp = (
  frame: number,
  value: number,
  start = 0,
  dur = 24,
): number =>
  interpolate(frame, [start, start + dur], [0, value], { ...CLAMP, easing: EASE.out });

/** Stagger helper: delay for the i-th item. */
export const stagger = (i: number, step = 3, base = 0) => base + i * step;
