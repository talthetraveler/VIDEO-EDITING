import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EASE } from "../../lib/animations";
import { EVIDENCE, HAND_FONT, wobble } from "./palette";

export type PrintProps = {
  src: string; // staticFile path or absolute URL
  /** centre position on the board, 0..1 */
  at?: [number, number];
  /** width as a fraction of the frame width, 0..1 */
  w?: number;
  /** aspect ratio w/h (default 4:5 portrait-ish snapshot) */
  ar?: number;
  /** resting tilt in degrees (deterministic wobble if omitted) */
  rotate?: number;
  seed?: number;
  /** frame the print lands on, relative to its Sequence */
  delay?: number;
  caption?: string; // handwritten note under the print
  border?: number; // white matte thickness in px at 1080w
};

/**
 * One photo "print" dropped on the board: white matte, soft drop shadow, slight
 * tilt, and a scale + settle entrance (fast in, tiny overshoot, no bounce).
 */
export const PhotoPrint: React.FC<PrintProps> = ({
  src,
  at = [0.5, 0.46],
  w = 0.6,
  ar = 4 / 5,
  rotate,
  seed = 1,
  delay = 0,
  caption,
  border = 22,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const tilt = rotate ?? wobble(seed) * 4;

  const e = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const over = interpolate(f, [0, 10, 18], [0.86, 1.03, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  const drop = interpolate(f, [0, 14], [wobble(seed + 9) * 3 - 26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });

  const px = at[0] * 100;
  const py = at[1] * 100;

  return (
    <div
      style={{
        position: "absolute",
        left: `${px}%`,
        top: `${py}%`,
        width: `${w * 100}%`,
        translate: "-50% -50%",
        rotate: `${tilt}deg`,
        scale: String(over),
        opacity: e,
        transformOrigin: "50% 50%",
      }}
    >
      <div
        style={{
          background: "#FCFAF4",
          padding: `${border}px ${border}px ${border * 1.7}px`,
          boxShadow: `0 ${18 + drop}px ${46}px ${EVIDENCE.shadow}, 0 2px 6px rgba(0,0,0,0.12)`,
          borderRadius: 3,
          translate: `0 ${drop}px`,
        }}
      >
        <div style={{ width: "100%", aspectRatio: String(ar), overflow: "hidden", background: "#ddd" }}>
          <Img
            src={src.startsWith("http") ? src : staticFile(src)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
        {caption ? (
          <div
            style={{
              fontFamily: HAND_FONT,
              fontWeight: 700,
              color: EVIDENCE.ink,
              fontSize: `${border * 1.5}px`,
              lineHeight: 1.05,
              paddingTop: border * 0.55,
              textAlign: "center",
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </div>
  );
};
