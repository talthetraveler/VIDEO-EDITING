import React from "react";
import { AbsoluteFill } from "remotion";
import { PaperBackdrop } from "./PaperBackdrop";
import { PhotoPrint, type PrintProps } from "./PhotoPrint";
import { wobble } from "./palette";

/**
 * Several prints landing on the board one after another and stacking with
 * offset + tilt — the "scattered evidence" build. Give it 2–5 photos; it lays
 * them out on a loose arc and staggers the entrances.
 */
export const PhotoStack: React.FC<{
  photos: Array<Pick<PrintProps, "src" | "caption"> & Partial<PrintProps>>;
  stagger?: number; // frames between each print landing
  paper?: boolean; // include the PaperBackdrop (off when already on a board)
  spread?: number; // how far apart, 0..1 of frame
}> = ({ photos, stagger = 8, paper = true, spread = 0.16 }) => {
  const n = photos.length;
  const body = (
    <AbsoluteFill name="PhotoStack">
      {photos.map((p, i) => {
        const t = n === 1 ? 0 : i / (n - 1) - 0.5; // -0.5..0.5
        const at: [number, number] = p.at ?? [
          0.5 + t * spread + wobble(i + 3) * 0.02,
          0.46 + Math.abs(t) * 0.06 + wobble(i + 7) * 0.02,
        ];
        return (
          <PhotoPrint
            key={i}
            {...p}
            at={at}
            w={p.w ?? (n > 3 ? 0.42 : 0.52)}
            seed={p.seed ?? i + 1}
            delay={p.delay ?? i * stagger}
          />
        );
      })}
    </AbsoluteFill>
  );
  return paper ? <PaperBackdrop>{body}</PaperBackdrop> : body;
};
