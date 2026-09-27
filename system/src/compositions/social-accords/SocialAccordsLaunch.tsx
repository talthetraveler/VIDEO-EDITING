import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import type { Caption } from "@remotion/captions";
import keep from "../../../public/footage/social-accords/montana-social-accords-aroll.keep.json";
import captions from "../../../public/footage/social-accords/montana-social-accords-aroll.captions.json";
import { Captions } from "../../captions/Captions";
import { AutoCut, type KeepFile } from "../../components/AutoCut";
import { editorialTheme } from "../../theme/theme";

const KEEP = keep as KeepFile;
const CAPTIONS = captions as Caption[];
const FPS = 30;
const DURATION_IN_FRAMES = Math.round((KEEP.stats?.keptSeconds ?? 188.5) * FPS);

type BrollScene = {
  id: string;
  rawStart: number;
  rawEnd: number;
  src: string;
  sourceStart: number;
  label: string;
  accent: string;
  side?: "left" | "right";
  /** objectPosition 0..1 — bias the crop to push burned-in reel captions / signs off-frame */
  posY?: number;
  posX?: number;
  crop?: number;
  /** solid black band over the bottom fraction — for reels with burned-in captions the crop cannot clear */
  maskBottom?: number;
};

const broll = (file: string) => `footage/social-accords/instagram/${file}`;

const BROLL_SCENES: BrollScene[] = [
  // ---- wall-to-wall B-roll. Montana stays on camera ONLY for 51.6-63.0
  // (her name + "grandchild of Holocaust survivors / where hatred can lead").
  // Graphic beats: OpeningPhone (1.9-10), AlgorithmBoard (10-34.4),
  // SocialAccordsImpact (163.6-166.6), ClosingLockup (185.2-end).

  { id: "enemy-a", maskBottom: 0.26, crop: 1.4,   rawStart: 34.4, rawEnd: 39.0,  src: broll("Montana_Tucker_DJ100ADJSgU.mp4"), sourceStart: 120, label: "SOMEONE YOU'VE NEVER MET", accent: "#4DA3FF", side: "right", posY: 0.34, posX: 0.62 },
  { id: "enemy-b", maskBottom: 0.24, crop: 1.72,   rawStart: 39.0, rawEnd: 43.6,  src: broll("Montana_Tucker_DTatvYeEzmy.mp4"), sourceStart: 10,  label: "EVEN IF YOU'VE NEVER MET THEM", accent: "#4DA3FF", side: "left",  posY: 0.14 },
  { id: "viral-too", rawStart: 43.6, rawEnd: 51.4,  src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 15,  label: "LOVE CAN GO VIRAL TOO", accent: "#FFE14D", side: "left",  posY: 0.5 },

  // 51.6-63.0 = Montana on camera (no scene)

  { id: "different", rawStart: 63.0, rawEnd: 73.4,  src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 4, label: "PEOPLE WHO SEE THE WORLD DIFFERENTLY", accent: "#43E0A0", side: "left", posY: 0.5 },
  { id: "stories", maskBottom: 0.16,   rawStart: 73.4, rawEnd: 82.0,  src: broll("Montana_Tucker_DLh9NVbxS_b.mp4"), sourceStart: 118, label: "PEOPLE, NOT STEREOTYPES", accent: "#FFE14D", side: "right", posY: 0.42 },
  { id: "views",     rawStart: 82.0, rawEnd: 91.6,  src: broll("Montana_Tucker_C8UqBOVJxFA.mp4"), sourceStart: 37,  label: "3 BILLION VIEWS", accent: "#4DA3FF", side: "left",  posY: 0.40 },
  { id: "spread",    rawStart: 91.6, rawEnd: 96.5,  src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 24,  label: "MAKE HUMANITY SPREAD", accent: "#43E0A0", side: "right", posY: 0.5 },
  { id: "helping",   rawStart: 96.5, rawEnd: 104.4, src: broll("Montana_Tucker_DObW_JBERrJ.mp4"), sourceStart: 19,  label: "HELPING A STRANGER", accent: "#43E0A0", side: "left",  posY: 0.32 },
  { id: "listen-a", maskBottom: 0.24, crop: 1.72,  rawStart: 104.4, rawEnd: 111.0, src: broll("Montana_Tucker_DTatvYeEzmy.mp4"), sourceStart: 8,  label: "SOMEONE YOU'RE TOLD TO HATE", accent: "#4DA3FF", side: "right", posY: 0.14 },
  { id: "listen-b", rawStart: 111.0, rawEnd: 120.2, src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 50, label: "ACTUALLY LISTENING", accent: "#4DA3FF", side: "left", posY: 0.5 },
  { id: "chain",     rawStart: 120.2, rawEnd: 125.4, src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 44, label: "ONE. THEN ANOTHER.", accent: "#FFE14D", side: "left",  posY: 0.5 },
  { id: "one-person", maskBottom: 0.26, crop: 1.4,rawStart: 125.4, rawEnd: 130.3, src: broll("Montana_Tucker_DJ100ADJSgU.mp4"), sourceStart: 158, label: "ONE PERSON CAN'T DO IT ALONE", accent: "#FFB84D", side: "right", posY: 0.34, posX: 0.6 },
  { id: "tellers-a", rawStart: 130.3, rawEnd: 137.0, src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 8, label: "STORYTELLERS AROUND THE WORLD", accent: "#43E0A0", side: "right", posY: 0.5 },
  { id: "tellers-b", rawStart: 137.0, rawEnd: 143.0, src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 32, label: "ACTS OF KINDNESS", accent: "#FFE14D", side: "left",  posY: 0.5 },
  { id: "unexp-a", maskBottom: 0.26, crop: 1.4, posX: 0.6, rawStart: 143.0, rawEnd: 148.4, src: broll("Montana_Tucker_DJ100ADJSgU.mp4"), sourceStart: 200, label: "UNEXPECTED CONVERSATIONS", accent: "#FFB84D", side: "left", posY: 0.34 },
  { id: "unexp-b", maskBottom: 0.16,   rawStart: 148.4, rawEnd: 154.0, src: broll("Montana_Tucker_DLh9NVbxS_b.mp4"), sourceStart: 142, label: "WHO WE ARE TO EACH OTHER", accent: "#4DA3FF", side: "right", posY: 0.42 },
  { id: "create", maskBottom: 0.16,    rawStart: 154.0, rawEnd: 163.6, src: broll("Montana_Tucker_DLh9NVbxS_b.mp4"), sourceStart: 143, label: "CREATE MORE HUMANITY", accent: "#4DA3FF", side: "right", posY: 0.42 },

  // 163.6-166.6 = SocialAccordsImpact (no scene)

  { id: "mvmt-a",    rawStart: 166.6, rawEnd: 170.4, src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 16, label: "A GLOBAL MOVEMENT", accent: "#43E0A0", side: "left",  posY: 0.5 },
  { id: "mvmt-b", rawStart: 170.4, rawEnd: 173.6, src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 36, label: "FIGHT HATE WITH HUMANITY", accent: "#FFE14D", side: "right", posY: 0.5 },
  { id: "mvmt-c",    rawStart: 173.6, rawEnd: 176.4, src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 20, label: "WITH HUMANITY", accent: "#43E0A0", side: "left",  posY: 0.5 },
  { id: "human",     rawStart: 176.4, rawEnd: 185.0, src: broll("Montana_Tucker_C-vEx9rJgwd.mp4"), sourceStart: 30, label: "BEHIND EVERY LABEL, A HUMAN BEING", accent: "#FFE14D", side: "left",  posY: 0.5 },
];

const rawToTimeline = (rawSeconds: number) => {
  let timeline = 0;
  for (const [start, end] of KEEP.segments) {
    if (rawSeconds < start) return timeline;
    if (rawSeconds <= end) return timeline + (rawSeconds - start);
    timeline += end - start;
  }
  return timeline;
};

const fromRaw = (rawSeconds: number) => Math.max(0, Math.round(rawToTimeline(rawSeconds) * FPS));
const durRaw = (rawStart: number, rawEnd: number) => Math.max(1, fromRaw(rawEnd) - fromRaw(rawStart));

const soft = Easing.bezier(0.16, 1, 0.3, 1);

const BrollWindow: React.FC<{ scene: BrollScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const enter = interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft });
  const exit = 1; // hard cut out — the next scene (rendered above) covers this one

  return (
    <AbsoluteFill
      name={`Broll:${scene.id}`}
      style={{
        background: "#050506",
        opacity: enter * exit,
      }}
    >
      <Video
        src={staticFile(scene.src)}
        muted
        trimBefore={Math.round(scene.sourceStart * FPS)}
        objectFit="cover"
        style={{
          width: "100%",
          height: "100%",
          // bias the crop toward scene.posY so burned-in reel captions sit off-frame
          objectPosition: `${Math.round((scene.posX ?? 0.5) * 100)}% ${Math.round((scene.posY ?? 0.5) * 100)}%`,
          scale: interpolate(frame, [0, durRaw(scene.rawStart, scene.rawEnd)], [scene.crop ?? 1.16, (scene.crop ?? 1.16) + 0.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          filter: "contrast(1.05) saturate(1.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.24), rgba(0,0,0,0) 28%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.55) 74%, rgba(0,0,0,0.9)), linear-gradient(${scene.side === "left" ? 90 : 270}deg, rgba(0,0,0,0.45), transparent 46%)`,
        }}
      />
      {scene.maskBottom ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${scene.maskBottom * 100}%`,
            background: "linear-gradient(180deg, transparent, #000 22%, #000)",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          top: 148,
          [scene.side === "left" ? "left" : "right"]: 58,
          maxWidth: width * 0.62,
          padding: "14px 18px",
          borderLeft: `8px solid ${scene.accent}`,
          background: "rgba(0,0,0,0.62)",
          color: "#FFFFFF",
          fontFamily: editorialTheme.type.body,
          fontSize: 36,
          fontWeight: 900,
          lineHeight: 1.04,
          letterSpacing: 0,
          boxShadow: "0 16px 44px rgba(0,0,0,0.35)",
          translate: `${interpolate(frame, [0, 12], [scene.side === "left" ? -24 : 24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft })}px 0px`,
        }}
      >
        {scene.label}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 126,
          left: 58,
          right: 58,
          height: 3,
          background: "rgba(255,255,255,0.18)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${interpolate(frame, [0, durRaw(scene.rawStart, scene.rawEnd)], [8, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`,
            background: scene.accent,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const OpeningPhone: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 10, 22], [0, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft });
  const takeover = interpolate(frame, [160, 250], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft });
  const cards = [
    { text: "HATE", x: 84, y: 308, delay: 10, color: "#FF4D4D" },
    { text: "OUTRAGE", x: 688, y: 430, delay: 24, color: "#FFB84D" },
    { text: "COPY", x: 126, y: 1040, delay: 38, color: "#FFFFFF" },
    { text: "REPOST", x: 650, y: 1140, delay: 52, color: "#FFFFFF" },
  ];

  return (
    <AbsoluteFill name="PhoneOpening">
      <div
        style={{
          position: "absolute",
          left: 118,
          top: 618,
          width: 166,
          height: 350,
          borderRadius: 28,
          background: "rgba(0,0,0,0.82)",
          border: "5px solid rgba(255,255,255,0.45)",
          boxShadow: "0 16px 44px rgba(0,0,0,0.5)",
          rotate: "-5deg",
          opacity: interpolate(frame, [0, 8, 235, 258], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <Video
          src={staticFile(broll("Montana_Tucker_C-vEx9rJgwd.mp4"))}
          muted
          trimBefore={Math.round(16 * FPS)}
          objectFit="cover"
          style={{ width: "100%", height: "100%", borderRadius: 22, opacity: 0.82 }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.62)",
          opacity: takeover * 0.95,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 160 - takeover * 160,
          top: 300 - takeover * 300,
          width: 760 + takeover * 320,
          height: 1180 + takeover * 740,
          borderRadius: 48 - takeover * 48,
          overflow: "hidden",
          border: `${6 - takeover * 6}px solid rgba(255,255,255,0.72)`,
          boxShadow: "0 28px 90px rgba(0,0,0,0.55)",
          opacity: interpolate(frame, [118, 146], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft }),
        }}
      >
        <Video
          src={staticFile(broll("Montana_Tucker_C8UqBOVJxFA.mp4"))}
          muted
          trimBefore={Math.round(22 * FPS)}
          objectFit="cover"
          style={{ width: "100%", height: "100%", filter: "contrast(1.1) saturate(1.05)" }}
        />
      </div>
      {cards.map((card) => (
        <div
          key={card.text}
          style={{
            position: "absolute",
            left: card.x,
            top: card.y,
            padding: "12px 18px",
            background: "rgba(0,0,0,0.72)",
            border: `3px solid ${card.color}`,
            color: card.color,
            fontFamily: editorialTheme.type.body,
            fontSize: 44,
            fontWeight: 900,
            lineHeight: 1,
            opacity: interpolate(frame, [card.delay, card.delay + 8, 240, 260], [0, pop, pop, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            scale: interpolate(frame, [card.delay, card.delay + 8], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft }),
          }}
        >
          {card.text}
        </div>
      ))}
    </AbsoluteFill>
  );
};

const AlgorithmBoard: React.FC = () => {
  const frame = useCurrentFrame();
  // "one becomes two, two becomes four, four becomes dozens" — the grid multiplies.
  const stages = [
    { at: 0, cols: 1, rows: 1 },
    { at: 40, cols: 2, rows: 1 },
    { at: 95, cols: 2, rows: 2 },
    { at: 150, cols: 4, rows: 3 },
    { at: 240, cols: 6, rows: 5 },
    { at: 380, cols: 8, rows: 7 },
  ];
  const cur = [...stages].reverse().find((x) => frame >= x.at) ?? stages[0];
  const count = cur.cols * cur.rows;
  const push = 1 + interpolate(frame, [0, 620], [0, 0.16], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tiles = [];
  for (let r = 0; r < cur.rows; r++)
    for (let c = 0; c < cur.cols; c++) {
      const born = stages.find((st) => st.cols > c || st.rows > r)?.at ?? 0;
      const a = interpolate(frame, [born, born + 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft });
      const flick = 0.62 + 0.38 * Math.abs(Math.sin((frame + (r * 7 + c * 13)) / (4 + ((r + c) % 3))));
      tiles.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            left: `${(c + 0.5) * (100 / cur.cols)}%`,
            top: `${8 + (r + 0.5) * (78 / cur.rows)}%`,
            width: `${88 / cur.cols}%`,
            height: `${70 / cur.rows}%`,
            translate: "-50% -50%",
            background: "#170d0f",
            border: `${Math.max(1.5, 6 / Math.max(cur.cols, 3))}px solid #FF4D4D`,
            borderRadius: 6,
            opacity: a * flick,
            scale: String(interpolate(a, [0, 1], [0.7, 1]) * (0.97 + 0.03 * Math.sin((frame + r * 5 + c * 9) / 6))),
          }}
        />,
      );
    }
  return (
    <AbsoluteFill name="AlgorithmBoard" style={{ background: "#08080B" }}>
      <AbsoluteFill style={{ scale: String(push), transformOrigin: "50% 42%" }}>{tiles}</AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 42%, transparent 30%, rgba(8,8,11,0.85))" }} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          fontFamily: editorialTheme.type.display,
          fontWeight: 900,
          fontSize: 190,
          color: "#fff",
          textShadow: "0 8px 40px rgba(0,0,0,0.8)",
          scale: String(interpolate(frame % 55, [0, 6, 12], [0.94, 1.05, 1], { extrapolateRight: "clamp" })),
        }}
      >
        {count >= 30 ? "DOZENS" : `×${count}`}
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "16%",
          translate: "-50% 0",
          fontFamily: editorialTheme.type.body,
          fontWeight: 800,
          fontSize: 40,
          letterSpacing: "0.04em",
          color: "#FF6B6B",
          opacity: interpolate(frame, [10, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {frame < 95 ? "ONE TOXIC VIDEO BECOMES TWO" : frame < 240 ? "TWO BECOMES FOUR" : "UNTIL HATE IS A TREND"}
      </div>
    </AbsoluteFill>
  );
};

const SocialAccordsImpact: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill name="SocialAccordsImpact" style={{ background: "#050506", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 42%, rgba(255,225,77,0.2), transparent 42%), linear-gradient(180deg, #060609, #111119)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          border: "3px solid rgba(255,255,255,0.16)",
          rotate: `${interpolate(frame, [0, 80], [-12, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft })}deg`,
          scale: interpolate(frame, [0, 18], [0.74, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft }),
        }}
      />
      <div
        style={{
          position: "relative",
          color: "#FFFFFF",
          fontFamily: editorialTheme.type.display,
          fontSize: 94,
          fontWeight: 900,
          lineHeight: 0.92,
          textAlign: "center",
          opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft }),
          scale: interpolate(frame, [0, 18], [0.78, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft }),
          letterSpacing: 0,
        }}
      >
        THE SOCIAL
        <br />
        ACCORDS
      </div>
      <div
        style={{
          position: "relative",
          marginTop: 34,
          padding: "12px 18px",
          color: "#050506",
          background: "#FFE14D",
          fontFamily: editorialTheme.type.body,
          fontSize: 33,
          fontWeight: 900,
          letterSpacing: 0,
          opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft }),
        }}
      >
        MAKE HUMANITY VIRAL
      </div>
    </AbsoluteFill>
  );
};

const ClosingLockup: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill name="ClosingLockup" style={{ background: "#050506", justifyContent: "center", alignItems: "center" }}>
      <Video src={staticFile(broll("Montana_Tucker_C-vEx9rJgwd.mp4"))} muted trimBefore={Math.round(46 * FPS)} objectFit="cover" style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.34, filter: "saturate(1.08)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.58)" }} />
      <div style={{ fontFamily: editorialTheme.type.display, fontSize: 92, fontWeight: 900, color: "#FFFFFF", textAlign: "center", lineHeight: 0.96, opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft }) }}>
        MAKE
        <br />
        HUMANITY
        <br />
        VIRAL
      </div>
      <div style={{ marginTop: 34, fontFamily: editorialTheme.type.body, fontSize: 34, fontWeight: 800, color: "#FFE14D", opacity: interpolate(frame, [10, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: soft }) }}>
        THE SOCIAL ACCORDS
      </div>
    </AbsoluteFill>
  );
};

const EditorialOverlays: React.FC = () => (
  <>
    <Sequence from={fromRaw(0.13)} durationInFrames={durRaw(0.13, 10.1)} layout="absolute-fill">
      <OpeningPhone />
    </Sequence>
    <Sequence from={fromRaw(10.1)} durationInFrames={durRaw(10.1, 34.4)} layout="absolute-fill">
      <AlgorithmBoard />
    </Sequence>
    {BROLL_SCENES.map((scene) => (
      <Sequence key={scene.id} from={fromRaw(scene.rawStart)} durationInFrames={durRaw(scene.rawStart, scene.rawEnd) + Math.round(0.6 * FPS)} layout="absolute-fill">
        <BrollWindow scene={scene} />
      </Sequence>
    ))}
    <Sequence from={fromRaw(163.78)} durationInFrames={durRaw(163.78, 166.58)} layout="absolute-fill">
      <SocialAccordsImpact />
    </Sequence>
    <Sequence from={fromRaw(185.4)} durationInFrames={DURATION_IN_FRAMES - fromRaw(185.4)} layout="absolute-fill">
      <ClosingLockup />
    </Sequence>
  </>
);

export const SocialAccordsLaunch: React.FC<{ showCaptions?: boolean }> = ({ showCaptions = true }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <AutoCut keep={KEEP} />
      <EditorialOverlays />
      {showCaptions ? (
        <Captions
          captions={CAPTIONS}
          position="lower"
          uppercase={false}
          offset={270}
          switchEveryMs={950}
          emphasize={/\b(hate|humanity|kindness|social|accords|viral|love|unity|creator|global)\b/i}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const SOCIAL_ACCORDS_LAUNCH_DURATION = DURATION_IN_FRAMES;
