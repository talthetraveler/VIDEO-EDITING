/**
 * Mobile safe areas.
 *
 * TikTok / Reels / Shorts stack UI (caption, username, buttons, progress bar)
 * over the RIGHT side and BOTTOM third of a 9:16 frame. Keep captions and key
 * text inside the box below or they collide with platform chrome.
 *
 * Values are px against a 1080x1920 frame. Scale for other sizes.
 */

export const SAFE_VERTICAL = {
  top: 220, // below the "For You" / status area
  bottom: 400, // above caption + action rail + progress bar
  left: 60,
  right: 150, // extra room for the like/comment/share rail
};

export const SAFE_SQUARE = { top: 90, bottom: 120, left: 90, right: 90 };
export const SAFE_WIDE = { top: 70, bottom: 90, left: 120, right: 120 };

/** Convenience: a style object that constrains content to the vertical safe box. */
export const safeBoxStyle = (
  width: number,
  height: number,
  safe = SAFE_VERTICAL,
): React.CSSProperties => {
  const sx = (v: number) => (v / 1080) * width;
  const sy = (v: number) => (v / 1920) * height;
  return {
    position: "absolute",
    top: sy(safe.top),
    bottom: sy(safe.bottom),
    left: sx(safe.left),
    right: sx(safe.right),
  };
};
