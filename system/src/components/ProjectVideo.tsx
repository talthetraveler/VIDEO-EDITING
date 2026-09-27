import React from "react";
import { AbsoluteFill, Series, Sequence, Audio, staticFile, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import type { CalculateMetadataFunction } from "remotion";
import { loadFonts } from "../lib/fonts";
import { EmojiText } from "../lib/emoji";

loadFonts();

/**
 * Renders a project.json timeline. The MP4 is only an output — every prop here
 * comes from editable project state (scripts/lib/project.mjs).
 *
 * Tracks handled: video, broll (overlay), title, captions. audio/music are
 * structurally present in project.json but not yet composited here.
 */

const FONT = '"Inter", system-ui, -apple-system, "Segoe UI", "Segoe UI Emoji", "Noto Color Emoji", Roboto, sans-serif';

export type VClip = {
  id: string;
  src: string;
  sourceIn: number;
  sourceOut: number;
  timelineStart?: number;
  speed?: number;
  objectPosition?: string; // manual reframe, e.g. "40%"
  rotate?: 0 | 90 | 180 | 270; // Sony fix: footage shot vertical but stored landscape with no rotation flag
};
export type CaptionGroup = {
  id: string;
  start: number;
  end: number;
  text: string;
  word_ids?: number[];
  words?: { text: string; start: number; end: number }[];
  tr?: Record<string, string>; // language code -> translated line (style unchanged)
  emphasis?: number[]; // token indices lit in highlightColor for the whole card (NAS-Daily style)
};

const RTL_LANGS = new Set(["ar", "he", "fa", "ur", "arb", "ara", "heb", "fas", "urd", "iw"]);
export type TitleItem = {
  id: string;
  text: string;
  start: number;
  end: number;
  position?: { x: number; y: number };
  style?: string; // per-item preset key (pill title vs time_jump card vs part_label)
};

export type CaptionStyle = Record<string, unknown>;
export type TitleStyle = Record<string, unknown>;

export type ProjectData = {
  fps: number;
  width: number;
  height: number;
  duration: number;
  handle?: string; // persistent @handle watermark, bottom-left, like Tal's reels
  tracks: { video: VClip[]; broll: VClip[]; title: TitleItem[]; captions: CaptionGroup[] };
  captionLang?: string; // null/"src" = original transcript; else render caption.tr[lang]
  music?: { src: string; volume?: number; duck?: boolean } | null;
  dub?: { lang: string; src: string } | null; // AI dub — replaces the spoken audio

  captionPreset: CaptionStyle;
  titlePreset: TitleStyle;
  titlePresets?: Record<string, TitleStyle>; // per-item styles by key; falls back to titlePreset
};

const Cover: React.FC<{ clip: VClip; fps: number; muted?: boolean }> = ({ clip, fps, muted }) => {
  const { width, height } = useVideoConfig();
  const rot = clip.rotate ?? 0;
  const swap = rot === 90 || rot === 270;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <Video
        src={clip.src.startsWith("http") ? clip.src : staticFile(clip.src)}
        trimBefore={Math.round(clip.sourceIn * fps)}
        trimAfter={Math.round(clip.sourceOut * fps)}
        playbackRate={clip.speed ?? 1}
        muted={muted}
        style={{
          position: "absolute",
          top: "50%",
          left: clip.objectPosition ?? "50%",
          translate: "-50% -50%",
          rotate: rot ? `${rot}deg` : undefined,
          // 90/270: the frame is rotated, so pre-rotation width spans the frame's
          // height and vice-versa (Sony vertical-stored-as-landscape fits exactly)
          minWidth: swap ? undefined : "100%",
          minHeight: swap ? undefined : "100%",
          width: swap ? height : "auto",
          height: swap ? width : "auto",
        }}
      />
    </AbsoluteFill>
  );
};

const TitleLayer: React.FC<{ item: TitleItem; style: TitleStyle; width: number; height: number; fps: number }> = ({
  item,
  style,
  width,
  height,
  fps,
}) => {
  const frame = useCurrentFrame();
  const s = style as Record<string, number & string>;
  const durF = Math.round((item.end - item.start) * fps);
  const entr = Number(s.entranceFrames ?? 10);
  const exitF = Number(s.exitFrames ?? 8);
  const inT = interpolate(frame, [0, entr], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outT = interpolate(frame, [durF - exitF, durF], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(inT, outT);
  const sizePx = Number(s.sizePx ?? 66) * (width / 1080);
  const y = (item.position?.y ?? Number(s.position?.["y"] ?? 0.08)) * height;
  const pill = (s.variant ?? "pill") === "pill";
  const strokeW = Number((s.stroke as unknown as Record<string, number>)?.widthPx ?? 0);
  const strokeC = String((s.stroke as unknown as Record<string, string>)?.color ?? "#000000");
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: "50%",
        translate: `-50% ${interpolate(inT, [0, 1], [-sizePx * 0.25, 0])}px`,
        maxWidth: width * Number(s.maxWidthFrac ?? 0.82),
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: Number(s.weight ?? 900),
        fontSize: sizePx,
        lineHeight: 1.06,
        letterSpacing: Number(s.tracking ?? -0.02) * sizePx,
        textTransform: s.uppercase === false ? "none" : "uppercase",
        color: String(s.textColor ?? (pill ? "#0A0A0A" : "#FFFFFF")),
        background: pill ? String(s.pillColor ?? "rgba(255,255,255,0.94)") : "transparent",
        padding: pill ? `${sizePx * 0.34}px ${sizePx * 0.58}px` : 0,
        borderRadius: pill ? sizePx * Number(s.pillRadiusFrac ?? 0.7) : 0,
        boxShadow: pill ? String(s.shadow ?? "0 6px 30px rgba(0,0,0,0.28)") : "none",
        textShadow: pill ? "none" : String(s.shadow ?? "0 4px 14px rgba(0,0,0,0.65)"),
        WebkitTextStroke: !pill && strokeW ? `${strokeW}px ${strokeC}` : undefined,
        opacity,
      }}
    >
      <EmojiText>{item.text}</EmojiText>
    </div>
  );
};

const CaptionLayer: React.FC<{ g: CaptionGroup; style: CaptionStyle; width: number; height: number; lang?: string }> = ({
  g,
  style,
  width,
  height,
  lang,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = style as Record<string, never> & Record<string, number & string & Record<string, number>>;
  const sizePx = Number(s.sizePx ?? 76) * (width / 1080);
  const pop = interpolate(frame, [0, Number(s.entranceFrames ?? 4)], [0.86, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = (Number(s.position?.["y"] ?? 0.62)) * height;
  const absMs = g.start * 1000 + (frame / fps) * 1000;
  const strokeW = Number((s.stroke as Record<string, number>)?.widthPx ?? 0) * (width / 1080);
  const strokeCol = String((s.stroke as Record<string, string>)?.color ?? "#000000");
  // translated line: no source per-word timing to reuse -> spread words evenly
  // across the group's window so the active-word sweep still works
  const translated = lang && lang !== "src" ? g.tr?.[lang] : undefined;
  const rtl = !!lang && RTL_LANGS.has(lang);
  let tokens: { text: string; start: number; end: number }[];
  if (translated) {
    const ws = translated.split(/\s+/).filter(Boolean);
    const step = (g.end - g.start) / Math.max(1, ws.length);
    tokens = ws.map((t, i) => ({ text: t, start: g.start + i * step, end: g.start + (i + 1) * step }));
  } else {
    tokens = g.words?.length ? g.words : g.text.split(/\s+/).map((t) => ({ text: t, start: g.start, end: g.end }));
  }
  return (
    <div
      dir={rtl ? "rtl" : undefined}
      style={{
        position: "absolute",
        top: y,
        left: "50%",
        translate: "-50% -50%",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: `${sizePx * 0.12}px ${sizePx * 0.3}px`,
        maxWidth: width * Number(s.maxWidthFrac ?? 0.86),
        minWidth: 0,
        fontFamily: FONT,
        fontWeight: Number(s.weight ?? 900),
        fontSize: sizePx,
        lineHeight: 1.28,
        textAlign: "center",
        textTransform: s.uppercase === false ? "none" : "uppercase",
        letterSpacing: Number(s.tracking ?? 0) * sizePx,
        color: String(s.color ?? "#FFFFFF"),
        // stroke BEHIND the fill so the outline never eats the letterforms
        WebkitTextStrokeWidth: strokeW ? `${strokeW}px` : undefined,
        WebkitTextStrokeColor: strokeW ? strokeCol : undefined,
        paintOrder: "stroke fill",
        // soft drop shadow for separation from bright backgrounds (not an outline)
        filter: `drop-shadow(0 ${0.03 * sizePx}px ${0.05 * sizePx}px rgba(0,0,0,0.55))`,
        scale: String(pop),
      }}
    >
      {tokens.map((t, i) => {
        // karaoke sweep (Tal's default) vs static key-word emphasis (NAS Daily)
        const active = s.highlight === "activeWord" && t.start * 1000 <= absMs && t.end * 1000 > absMs;
        const keyword = s.highlight === "keyword" && !translated && (g.emphasis ?? []).includes(i);
        const lit = active || keyword;
        return (
          <span
            key={i}
            style={{
              whiteSpace: "pre-wrap",
              minWidth: 0,
              display: "inline-block",
              paddingBottom: "0.06em", // room for descenders inside the line box
              color: lit ? String(s.highlightColor ?? "#FFE14D") : "inherit",
              translate: active ? "0 -2px" : "0 0", // only the karaoke word bumps
            }}
          >
            <EmojiText>{t.text}</EmojiText>
          </span>
        );
      })}
    </div>
  );
};

export const ProjectVideo: React.FC<{ data: ProjectData }> = ({ data }) => {
  const { fps, width, height, tracks, captionPreset, titlePreset, titlePresets, handle } = data;
  const captionMode = (captionPreset as Record<string, string>).mode ?? "phrase";
  const styleFor = (t: TitleItem): TitleStyle => (t.style && titlePresets?.[t.style]) || titlePreset;
  const dubbed = !!data.dub?.src;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* AI DUB — replaces the spoken audio; the video track is muted below */}
      {dubbed ? (
        <Audio src={data.dub!.src.startsWith("http") ? data.dub!.src : staticFile(data.dub!.src)} />
      ) : null}
      {/* MUSIC BED — low by default; volume is set from the timeline editor */}
      {data.music?.src ? (
        <Audio
          src={data.music.src.startsWith("http") ? data.music.src : staticFile(data.music.src)}
          loop
          volume={(f) => {
            const base = data.music?.volume ?? 0.1;
            if (!data.music?.duck) return base;
            const t = f / fps;
            const speaking = (tracks.captions ?? []).some((c) => t >= c.start - 0.12 && t <= c.end + 0.25);
            return speaking ? base * 0.5 : base;
          }}
        />
      ) : null}
      {/* VIDEO */}
      <Series>
        {tracks.video.map((c) => {
          const dur = Math.max(1, Math.round(((c.sourceOut - c.sourceIn) / (c.speed ?? 1)) * fps));
          return (
            <Series.Sequence key={c.id} durationInFrames={dur} name={c.id}>
              <Cover clip={c} fps={fps} muted={dubbed} />
            </Series.Sequence>
          );
        })}
      </Series>

      {/* B-ROLL overlay */}
      {tracks.broll.map((c) => {
        const from = Math.round((c.timelineStart ?? 0) * fps);
        const dur = Math.max(1, Math.round((c.sourceOut - c.sourceIn) * fps));
        return (
          <Sequence key={c.id} from={from} durationInFrames={dur} name={`broll:${c.id}`}>
            <Cover clip={c} fps={fps} muted={dubbed} />
          </Sequence>
        );
      })}

      {/* TITLE — per-item style (pill title, time_jump card, part_label) */}
      {tracks.title.map((t) => {
        const st = styleFor(t);
        if ((st as Record<string, string>).variant === "none") return null;
        return (
          <Sequence
            key={t.id}
            from={Math.round(t.start * fps)}
            durationInFrames={Math.max(1, Math.round((t.end - t.start) * fps))}
            layout="none"
          >
            <TitleLayer item={t} style={st} width={width} height={height} fps={fps} />
          </Sequence>
        );
      })}

      {/* CAPTIONS */}
      {captionMode !== "none" &&
        tracks.captions.map((g) => (
          <Sequence
            key={g.id}
            from={Math.round(g.start * fps)}
            durationInFrames={Math.max(1, Math.round((g.end - g.start) * fps))}
            layout="none"
          >
            <CaptionLayer g={g} style={captionPreset} width={width} height={height} lang={data.captionLang} />
          </Sequence>
        ))}

      {/* @handle watermark — persistent, bottom-left, gold (like Tal's reels) */}
      {handle ? (
        <div
          style={{
            position: "absolute",
            left: width * 0.06,
            bottom: height * 0.055,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: width * 0.032,
            color: "#FFE21F",
            textShadow: "0 2px 6px rgba(0,0,0,0.7)",
            letterSpacing: -0.01 * width * 0.032,
          }}
        >
          {handle}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const projectVideoMetadata =
  (data: ProjectData): CalculateMetadataFunction<Record<string, unknown>> =>
  () => ({
    durationInFrames: Math.max(
      1,
      data.tracks.video.reduce(
        (n, c) => n + Math.max(1, Math.round(((c.sourceOut - c.sourceIn) / (c.speed ?? 1)) * data.fps)),
        0,
      ),
    ),
    fps: data.fps,
    width: data.width,
    height: data.height,
  });
