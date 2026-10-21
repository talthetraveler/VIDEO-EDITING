import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

// THE SOCIAL ACCORDS OUTRO. Tal's master prompt, section 11 (approved 2026-10-21): "after he says bye, every video
// ends on his animated Social Accords logo outro (it replaces a plain black end card)." Built from his logo
// (assets/brand/social-accords-logo.png, "THE / SOCIAL" white over "ACCORDS" gold) plus the end card's words
// (LESSONS 155): @thesocialaccords and "Using social media to spread positivity and fight hate".
// Appended by scripts/stamp-logo.py, after the top-right mark is stamped, so the mark never sits on the outro.

const { fontFamily } = loadFont("normal", { weights: ["600", "800"], subsets: ["latin"] });

export type LogoOutroProps = {
  logoFile: string;   // relative to the render's public dir
  handle: string;
  mission: string;
  seconds: number;
};

export const LOGO_OUTRO: LogoOutroProps = {
  logoFile: "brand/social-accords-logo.png",
  handle: "@thesocialaccords",
  mission: "Using social media to spread\npositivity and fight hate",
  seconds: 3,
};

const LW = 780, LH = Math.round((LW * 350) / 847);  // the logo PNG is 847x350
const SPLIT = 215 / 350;                            // the empty rows between "SOCIAL" and "ACCORDS"
const TOP = 640;                                    // logo top on the 1920 frame
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const LogoOutro: React.FC<LogoOutroProps> = (P) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const src = staticFile(P.logoFile);

  // 1. "THE SOCIAL" comes into focus and settles
  const a = interpolate(t, [0, 0.45], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  // 2. "ACCORDS" rises in a beat later, with a little spring
  const b = spring({ frame: f - Math.round(0.25 * fps), fps, config: { damping: 14, stiffness: 140, mass: 0.8 } });
  // 3. a light sweep across the gold
  const sweep = interpolate(t, [0.85, 1.45], [-0.35, 1.35], { ...clamp, easing: Easing.inOut(Easing.quad) });
  // 4. the handle and the mission line
  const c = interpolate(t, [1.1, 1.6], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });

  const part = (from: number, to: number) => `inset(${(from * 100).toFixed(2)}% 0 ${((1 - to) * 100).toFixed(2)}% 0)`;
  const logo: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: LW, height: LH };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{ position: "absolute", left: (1080 - LW) / 2, top: TOP, width: LW, height: LH }}>
        <Img src={src} style={{ ...logo, clipPath: part(0, SPLIT), opacity: a,
          filter: `blur(${(1 - a) * 10}px)`, transform: `translateY(${(1 - a) * -24}px) scale(${1.08 - 0.08 * a})` }} />
        <Img src={src} style={{ ...logo, clipPath: part(SPLIT, 1), opacity: Math.min(1, b * 1.4),
          transform: `translateY(${(1 - b) * 50}px)` }} />
        {/* the sweep: a bright diagonal band, cut to the logo's own letters and to ACCORDS only */}
        <div style={{ ...logo, clipPath: part(SPLIT, 1), mixBlendMode: "screen", opacity: b,
          WebkitMaskImage: `url(${src})`, WebkitMaskSize: "100% 100%",
          background: `linear-gradient(105deg, transparent ${(sweep - 0.18) * 100}%, rgba(255,250,225,0.95) ${sweep * 100}%, transparent ${(sweep + 0.18) * 100}%)` }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOP + LH + 70, textAlign: "center", fontFamily,
        opacity: c, transform: `translateY(${(1 - c) * 24}px)` }}>
        <div style={{ fontWeight: 800, fontSize: 54, color: "#FFFFFF", letterSpacing: 1 }}>{P.handle}</div>
        <div style={{ fontWeight: 600, fontSize: 40, color: "#E8B44A", lineHeight: 1.3, marginTop: 22, whiteSpace: "pre-line" }}>{P.mission}</div>
      </div>
    </AbsoluteFill>
  );
};
