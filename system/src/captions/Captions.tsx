import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  createTikTokStyleCaptions,
  type Caption,
  type TikTokPage,
} from "@remotion/captions";
import { DEFAULT_THEME, type Theme } from "../theme/theme";
import { scaleToWidth } from "../theme/formats";
import { SAFE_VERTICAL } from "../lib/safe-area";

/**
 * Caption track. Two variants, matching @talthetraveler's layered style:
 *
 *  - "keyphrase" (default) — large white bold, 2–3 words, lower-centre third,
 *    active word highlighted, drop shadow, no stroke.
 *  - "transcript" — small near-verbatim ~2 lines in a translucent dark pill,
 *    upper area, no per-word highlight. Sits under a <TitleCard>.
 *
 * Pass a `Caption[]` (see @remotion/captions). Both can run at once — give the
 * transcript a larger `switchEveryMs` (~3000) and the keyphrase the default.
 */

type Variant = "keyphrase" | "transcript" | "oneWord";
type Position = "center" | "lower" | "top";

/**
 * "oneWord" — exactly ONE word on screen at a time, big and centred, swapping on
 * that word's own timing (the modern TikTok / Hormozi caption). No grouping.
 * Each word holds from its start until the next word starts.
 */
const OneWord: React.FC<{ text: string; theme: Theme; emphasize?: RegExp }> = ({ text, theme, emphasize }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = scaleToWidth(theme.type.size.h1, width) * 1.08;
  const pop = interpolate(frame, [0, 3, 6], [0.62, 1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isEmph = emphasize?.test(text.trim());
  return (
    <div
      style={{
        fontFamily: theme.type.display,
        fontWeight: theme.type.weight.black,
        fontSize,
        lineHeight: 1,
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: theme.type.tracking.tight * fontSize,
        color: isEmph ? theme.palette.accent : "#FFFFFF",
        WebkitTextStroke: `${Math.max(2, fontSize * 0.02)}px rgba(0,0,0,0.85)`,
        textShadow: "0 4px 8px rgba(0,0,0,0.55), 0 10px 32px rgba(0,0,0,0.5)",
        scale: String(pop),
        maxWidth: width * 0.9,
      }}
    >
      {text.trim()}
    </div>
  );
};

const KeyphrasePage: React.FC<{
  page: TikTokPage;
  theme: Theme;
  emphasize?: RegExp;
  uppercase?: boolean;
}> = ({ page, theme, emphasize, uppercase }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const absoluteMs = page.startMs + (frame / fps) * 1000;
  const fontSize = scaleToWidth(theme.type.size.caption, width);
  const pop = interpolate(frame, [0, 4], [0.86, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: `${fontSize * 0.16}px ${fontSize * 0.28}px`,
        // A flex item defaults to min-width:auto and will NOT wrap below its
        // content width — long captions ran off both edges without this.
        minWidth: 0,
        maxWidth: width * 0.86,
        fontFamily: theme.type.body,
        fontWeight: theme.type.weight.black,
        fontSize,
        lineHeight: 1.1,
        textAlign: "center",
        textTransform: uppercase ? "uppercase" : "none",
        letterSpacing: uppercase ? theme.type.tracking.tight * fontSize : 0,
        // heavy drop shadow, no stroke, no box — matches @talthetraveler
        textShadow: "0 3px 5px rgba(0,0,0,0.6), 0 6px 22px rgba(0,0,0,0.5)",
        scale: String(pop),
      }}
    >
      {page.tokens.map((token, i) => {
        const isActive = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
        const isEmph = emphasize?.test(token.text.trim());
        return (
          <span
            key={`${token.fromMs}-${i}`}
            style={{
              // "pre" would keep a whole multi-word caption on ONE unbreakable
              // line and run it off both edges — our beats emit one caption per
              // phrase, not per word. "pre-wrap" keeps the leading space AND
              // lets it wrap.
              whiteSpace: "pre-wrap",
              // DEFENSIVE: a flex item's default min-width is "auto" (its own
              // content width), so even with pre-wrap a single overlong token
              // (a whole-phrase caption blob, upstream bug or bad data) won't
              // shrink and runs off both edges — exactly what shipped in the
              // pre-word-level-caption renders. minWidth:0 lets THIS token
              // wrap/shrink too, not just the container.
              minWidth: 0,
              maxWidth: "100%",
              overflowWrap: "break-word",
              // His reels are white, with cream/gold for emphasis — never a blue
              // "active word" tint. Active only gets a tiny lift.
              color: isEmph ? theme.palette.accent : theme.palette.ink,
              translate: isActive ? "0px -2px" : "0px 0px",
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};

const TranscriptPage: React.FC<{ page: TikTokPage; theme: Theme }> = ({ page, theme }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = scaleToWidth(theme.type.size.label, width);
  const op = interpolate(frame, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        maxWidth: "80%",
        padding: `${fontSize * 0.35}px ${fontSize * 0.7}px`,
        borderRadius: fontSize * 0.55,
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        fontFamily: theme.type.body,
        fontWeight: theme.type.weight.medium,
        fontSize,
        lineHeight: 1.25,
        textAlign: "center",
        opacity: op,
      }}
    >
      {page.text}
    </div>
  );
};

export const Captions: React.FC<{
  captions: Caption[];
  theme?: Theme;
  variant?: Variant;
  /**
   * Where the keyphrase sits. "center" (default) = vertically centred, matching
   * @talthetraveler's reels. "lower" = lower third. "top" = under a TitleCard.
   * Ignored for variant="transcript" (always top).
   */
  position?: Position;
  /** ALL-CAPS the keyphrase (some of his videos do, recent ones are sentence-case). */
  uppercase?: boolean;
  switchEveryMs?: number;
  /** keyphrase only — words/regex kept in the accent colour (stats, names). */
  emphasize?: RegExp;
  /** manual offset in px @1920h from the anchored edge; overrides `position`. */
  offset?: number;
}> = ({
  captions,
  theme = DEFAULT_THEME,
  variant = "keyphrase",
  position = "center",
  uppercase,
  switchEveryMs,
  emphasize,
  offset,
}) => {
  const { fps, height } = useVideoConfig();
  const combine = switchEveryMs ?? (variant === "transcript" ? 3000 : 1100);
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: combine }),
    [captions, combine],
  );

  // ---- oneWord: one Sequence per caption, held to the next word's start ----
  if (variant === "oneWord") {
    const words = captions
      .map((c) => ({ text: c.text.trim(), startMs: c.startMs, endMs: c.endMs }))
      .filter((w) => w.text.length > 0)
      .sort((a, b) => a.startMs - b.startMs);
    const minLen = Math.round(0.18 * fps);
    const maxHoldMs = 900; // don't let one word sit forever over a silence
    const edge =
      offset != null
        ? (offset / 1920) * height
        : position === "lower"
          ? (SAFE_VERTICAL.bottom / 1920) * height
          : position === "top"
            ? (320 / 1920) * height
            : null;
    const posStyle: React.CSSProperties =
      edge == null ? { top: "50%", translate: "0 -50%" } : position === "top" ? { top: edge } : { bottom: edge };
    return (
      <AbsoluteFill name="Captions:oneWord" style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", ...posStyle, width: "100%", display: "flex", justifyContent: "center" }}>
          {words.map((w, i) => {
            const next = words[i + 1];
            const startFrame = Math.round((w.startMs / 1000) * fps);
            const hardEnd = next ? Math.round((next.startMs / 1000) * fps) : Infinity;
            const naturalEnd = Math.round((Math.min(w.endMs, w.startMs + maxHoldMs) / 1000) * fps);
            const endFrame = Math.min(hardEnd, Math.max(naturalEnd, startFrame + minLen));
            if (endFrame - startFrame <= 0) return null;
            return (
              <Sequence key={i} from={startFrame} durationInFrames={endFrame - startFrame} layout="none">
                <OneWord text={w.text} theme={theme} emphasize={emphasize} />
              </Sequence>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }

  const isTranscript = variant === "transcript";
  const anchor: "top" | "bottom" | "center" =
    isTranscript || position === "top" ? "top" : position === "lower" ? "bottom" : "center";
  const edgePx =
    offset != null
      ? (offset / 1920) * height
      : anchor === "top"
        ? (300 / 1920) * height
        : (SAFE_VERTICAL.bottom / 1920) * height;

  const posStyle: React.CSSProperties =
    anchor === "center"
      ? { top: "50%", translate: "0 -50%" }
      : anchor === "top"
        ? { top: edgePx }
        : { bottom: edgePx };

  return (
    <AbsoluteFill name={`Captions:${variant}`} style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          ...posStyle,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {(() => {
          // Strictly monotonic, non-overlapping windows — two pages never show at
          // once. A page lasts until its own last token ends (or the next page
          // starts). `combine` controls GROUPING only; using it as a hard length
          // cap silently truncated multi-second captions to ~1s.
          const minLen = Math.round(0.5 * fps);
          let prevEnd = 0;
          return pages.map((page, index) => {
            const next = pages[index + 1] ?? null;
            const startFrame = Math.max(prevEnd, Math.round((page.startMs / 1000) * fps));
            const tokenEndMs = page.tokens.length ? Math.max(...page.tokens.map((t) => t.toMs)) : page.startMs;
            const naturalEnd = Math.round((tokenEndMs / 1000) * fps);
            const hardEnd = next ? Math.round((next.startMs / 1000) * fps) : Infinity;
            const endFrame = Math.min(hardEnd, Math.max(naturalEnd, startFrame + minLen));
            const durationInFrames = endFrame - startFrame;
            if (durationInFrames <= 0) return null;
            prevEnd = endFrame;
            return (
              <Sequence key={index} from={startFrame} durationInFrames={durationInFrames} layout="none">
                {isTranscript ? (
                  <TranscriptPage page={page} theme={theme} />
                ) : (
                  <KeyphrasePage page={page} theme={theme} emphasize={emphasize} uppercase={uppercase} />
                )}
              </Sequence>
            );
          });
        })()}
      </div>
    </AbsoluteFill>
  );
};
