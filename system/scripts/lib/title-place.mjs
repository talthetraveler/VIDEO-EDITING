// WHERE THE SECTION 11 TITLE GOES: "Placed low, with the box just above the top
// of the speaker's head, never over the face or head." And: "Titles and name
// tags never cover [the logo]" - the top-right mark stamp-logo.py puts at
// y 96..203 on a 1080x1920 frame.
//
// Measured on the RENDERED opening (the frame the viewer sees, after the
// builder's crop and zoom), with scripts/face-eyes.py over the title's window.
// Returns { y, why } - y is the box's TOP edge in px on the 1920 frame.
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
export const LOGO_BOTTOM = 96 + Math.round(260 * 350 / 847);   // stamp-logo.py: 260 px wide, 847x350 source, y 96
const GAP = 22;                                                // air between the box and the crown of the head

export function placeTitle(video, { from = 0, to = 3, boxH, H = 1920, fallback = 300 } = {}) {
  let f;
  try {
    const outp = execFileSync("python", [join(ROOT, "scripts/face-eyes.py"), video, String(from), String(to), "5"], { encoding: "utf8" });
    f = JSON.parse(outp.trim().split(/\r?\n/).pop());
  } catch { f = { found: 0 }; }
  const minY = LOGO_BOTTOM + 12;
  if (!f.found) return { y: Math.max(minY, fallback), why: `no face in the opening ${from}-${to}s: default y ${Math.max(minY, fallback)} - LOOK at it` };
  // CenterFace's box starts near the hairline; the crown is about a third of a face higher.
  const crown = (f.top - 0.35 * f.h) * H;
  const above = Math.round(crown - GAP - boxH);
  if (above >= minY) return { y: above, why: `above the head (crown ${Math.round(crown)} px)` };
  // No room between the logo and the head: never over the head, so below the chin instead.
  const below = Math.round(f.bot * H + GAP);
  return { y: below, why: `head too high for the box (crown ${Math.round(crown)} px, logo ends ${LOGO_BOTTOM}): placed under the chin - LOOK at it` };
}
