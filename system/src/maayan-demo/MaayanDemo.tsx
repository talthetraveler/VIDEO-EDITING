import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FPS, PLAN, f, segSeconds, type Cue } from "./timeline";

// ---- brand: El Hamaayan app tokens (maayan-trail-planner src/styles.css) --------------------
const GREEN = "#0B7A3B"; // --primary oklch(0.5 0.14 152)
const MINT = "#7EE2A8"; // dark-mode --primary, for text on dark ground
const FONT = "InterDemo";
const A = (p: string) => staticFile(`maayan-demo/${p}`);

const fontHandle = delayRender("Inter");
Promise.all(
  [
    ["700", "brand/inter-latin-700-normal.woff2"],
    ["800", "brand/inter-latin-800-normal.woff2"],
  ].map(([weight, file]) => new FontFace(FONT, `url(${A(file)})`, { weight }).load()),
)
  .then((faces) => {
    faces.forEach((ff) => document.fonts.add(ff));
    continueRender(fontHandle);
  })
  .catch(() => continueRender(fontHandle));

// ---- layout (1080×1920). Captions live above the phone, inside the top safe area. -----------
const SCREEN_W = 600;
const SCREEN_H = Math.round((SCREEN_W * 800) / 360); // app viewport is 360×800
const BEZEL = 16;
const PHONE_TOP = 410;

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 45 * FPS], [1.12, 1.2]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0c1a12" }}>
      <Img
        src={A("brand/hero.jpg")}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(38px) saturate(1.1)", scale: String(drift) }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,20,12,0.72) 0%, rgba(6,20,12,0.45) 40%, rgba(6,20,12,0.7) 100%)" }} />
    </AbsoluteFill>
  );
};

/** One caption card at a time: white Inter 800, one word may take the brand mint. */
const Caption: React.FC<{ cue: Cue; big?: boolean }> = ({ cue, big }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 18, stiffness: 220, mass: 0.6 } });
  const words = cue.text.split(" ");
  const accent = cue.accent?.split(" ") ?? [];
  let hit = -1;
  if (accent.length) hit = words.findIndex((w, i) => accent.every((a, k) => words[i + k] === a));
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: big ? 104 : 74,
        lineHeight: 1.08,
        letterSpacing: "-0.02em",
        color: "white",
        textAlign: "center",
        textShadow: "0 4px 24px rgba(0,0,0,0.45)",
        opacity: pop,
        translate: `0px ${interpolate(pop, [0, 1], [18, 0])}px`,
        scale: String(interpolate(pop, [0, 1], [0.96, 1])),
        maxWidth: 940,
        textWrap: "balance",
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ color: hit >= 0 && i >= hit && i < hit + accent.length ? MINT : "white" }}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

const Captions: React.FC<{ cues: Cue[]; len: number; top: number; big?: boolean; height?: number }> = ({ cues, len, top, big, height = 300 }) => (
  <>
    {cues.map((c, i) => {
      const from = f(c.at);
      const dur = Math.min(len, f(c.to)) - from;
      if (dur <= 0) return null;
      return (
        <Sequence key={i} from={from} durationInFrames={dur} layout="none">
          <div style={{ position: "absolute", left: 0, right: 0, top, height, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 70px" }}>
            <Caption cue={c} big={big} />
          </div>
        </Sequence>
      );
    })}
  </>
);

/** A plain phone: the recording fills the screen, nothing competes with it. */
const Phone: React.FC<{ children: React.ReactNode; enter?: boolean; exit?: number }> = ({ children, enter, exit }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = enter ? spring({ frame, fps, config: { damping: 20, stiffness: 120 } }) : 1;
  const outP = exit != null ? interpolate(frame, [exit, exit + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const y = interpolate(inP, [0, 1], [900, 0]) + interpolate(outP, [0, 1], [0, 1100]);
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - SCREEN_W) / 2 - BEZEL,
        top: PHONE_TOP - BEZEL,
        width: SCREEN_W + BEZEL * 2,
        height: SCREEN_H + BEZEL * 2,
        borderRadius: 78,
        background: "#0b0d0c",
        padding: BEZEL,
        boxShadow: "0 40px 120px rgba(0,0,0,0.55), inset 0 0 0 3px #2a2e2c",
        translate: `0px ${y}px`,
      }}
    >
      <div style={{ position: "relative", width: SCREEN_W, height: SCREEN_H, borderRadius: 62, overflow: "hidden", background: "#f7f8f2" }}>
        {children}
      </div>
    </div>
  );
};

const Screen: React.FC<{ segments: { clip: string; from: number; to: number; rate?: number }[] }> = ({ segments }) => {
  let at = 0;
  return (
    <>
      {segments.map((s, i) => {
        const len = f(segSeconds(s));
        const node = (
          <Sequence key={i} from={at} durationInFrames={len} layout="none">
            <OffthreadVideo
              src={A(`clips/${s.clip}.mp4`)}
              trimBefore={f(s.from)}
              playbackRate={s.rate ?? 1}
              muted
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />
          </Sequence>
        );
        at += len;
        return node;
      })}
    </>
  );
};

const Hook: React.FC<{ len: number; cues: Cue[] }> = ({ len, cues }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Img src={A("brand/hero.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", scale: String(interpolate(frame, [0, len], [1.04, 1.14])) }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.6) 100%)" }} />
      <Captions cues={cues} len={len} top={1180} big height={420} />
    </AbsoluteFill>
  );
};

const PhotoBeat: React.FC<{ image: string; len: number; cues: Cue[] }> = ({ image, len, cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const push = interpolate(frame, [0, len], [1.0, 1.12]);
  return (
    <AbsoluteFill>
      <Img src={A(image)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.55)", scale: "1.2" }} />
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: 470,
          aspectRatio: "4 / 5",
          borderRadius: 36,
          overflow: "hidden",
          boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
          opacity: inP,
          translate: `0px ${interpolate(inP, [0, 1], [80, 0])}px`,
        }}
      >
        <Img src={A(image)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%", scale: String(push), transformOrigin: "50% 22%" }} />
      </div>
      <Captions cues={cues} len={len} top={150} height={300} />
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = (d: number) => spring({ frame: frame - d, fps, config: { damping: 16, stiffness: 140 } });
  const rise = (d: number) => ({ opacity: p(d), translate: `0px ${interpolate(p(d), [0, 1], [40, 0])}px` });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <Img src={A("brand/logo-512.webp")} style={{ width: 300, ...rise(4) }} />
        <div style={{ fontWeight: 800, fontSize: 112, color: "white", letterSpacing: "-0.03em", ...rise(10) }}>El Hamaayan</div>
        <div style={{ fontWeight: 700, fontSize: 50, color: MINT, ...rise(18) }}>Invite your friends</div>
        <div style={{ display: "flex", gap: 28, alignItems: "center", marginTop: 40, ...rise(26) }}>
          <Img src={A("brand/app-store-badge.svg")} style={{ height: 108 }} />
          <Img src={A("brand/google-play-badge.png")} style={{ height: 108 * 1.0 }} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 38, color: "rgba(255,255,255,0.75)", marginTop: 12, ...rise(32) }}>elamaayan.com</div>
      </div>
    </AbsoluteFill>
  );
};

export const MaayanDemo: React.FC = () => {
  const phoneBeats = PLAN.filter((b) => b.kind === "phone");
  const phoneFrom = phoneBeats[0].from;
  const phoneEnd = phoneBeats.at(-1)!.from + phoneBeats.at(-1)!.len;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0c1a12" }}>
      <Background />
      {/* the phone persists across every app beat; only its screen hard-cuts */}
      <Sequence from={phoneFrom} durationInFrames={phoneEnd - phoneFrom + 14} layout="none">
        <Phone enter exit={phoneEnd - phoneFrom}>
          {phoneBeats.map((b) => (
            <Sequence key={b.id} from={b.from - phoneFrom} durationInFrames={b.len} layout="none">
              <Screen segments={b.segments!} />
            </Sequence>
          ))}
        </Phone>
      </Sequence>
      {phoneBeats.map((b) => (
        <Sequence key={`cap-${b.id}`} from={b.from} durationInFrames={b.len} layout="none">
          <Captions cues={b.captions} len={b.len} top={96} height={290} />
        </Sequence>
      ))}
      {PLAN.filter((b) => b.kind === "hook").map((b) => (
        <Sequence key={b.id} from={b.from} durationInFrames={b.len}>
          <Hook len={b.len} cues={b.captions} />
        </Sequence>
      ))}
      {PLAN.filter((b) => b.kind === "photo").map((b) => (
        <Sequence key={b.id} from={b.from} durationInFrames={b.len}>
          <PhotoBeat image={b.image!} len={b.len} cues={b.captions} />
        </Sequence>
      ))}
      {PLAN.filter((b) => b.kind === "end").map((b) => (
        <Sequence key={b.id} from={b.from} durationInFrames={b.len}>
          <EndCard />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
