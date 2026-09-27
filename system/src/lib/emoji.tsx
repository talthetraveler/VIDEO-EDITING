import React from "react";
import { Img, staticFile } from "remotion";

/**
 * Render emoji (esp. flags) as Twemoji SVGs. Headless Chrome on Windows renders
 * 🇮🇱 as "IL" and ☪️ as a monochrome glyph — SVG images fix both. Assets live in
 * public/twemoji/<dash-joined-lowercase-codepoints>.svg (fetched from
 * jdecked/twemoji). Missing file → the raw character is kept as a fallback.
 */

// flag = two regional indicators; plus a few symbols we actually use
const EMOJI_RE =
  /(\p{Regional_Indicator}\p{Regional_Indicator})|([☀-➿✡☪❤✝⛪]️?)|(\uD83D[\uDE4F\uDD25\uDC47])|(🕌)/gu;

const toName = (s: string) =>
  Array.from(s)
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((h) => h !== "fe0f" && h !== "200d")
    .join("-");

export const EmojiText: React.FC<{ children: string; className?: string }> = ({ children }) => {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  EMOJI_RE.lastIndex = 0;
  let key = 0;
  while ((m = EMOJI_RE.exec(children))) {
    if (m.index > last) out.push(children.slice(last, m.index));
    const glyph = m[0];
    out.push(
      <Img
        key={`e${key++}`}
        src={staticFile(`twemoji/${toName(glyph)}.svg`)}
        alt={glyph}
        draggable={false}
        style={{
          height: "0.92em",
          width: "auto",
          margin: "0 0.06em",
          verticalAlign: "-0.12em",
          display: "inline-block",
        }}
      />,
    );
    last = m.index + glyph.length;
  }
  if (last < children.length) out.push(children.slice(last));
  return <>{out}</>;
};

/** true if the string contains something EmojiText would swap for an image */
export const hasEmoji = (s: string) => {
  EMOJI_RE.lastIndex = 0;
  return EMOJI_RE.test(s);
};
