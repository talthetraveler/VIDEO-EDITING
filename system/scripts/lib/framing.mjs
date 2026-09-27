// AIM THE CROP AT THE PERSON.
//
// Tal, after watching the delivered set: *"the colors are bad, everything is
// bad about them"* — and before that, repeatedly, *"zoom in on the face and
// yeah ... zoom in so it's emotional."*
//
// WHAT WAS WRONG. Every beat was framed with a blind centre crop:
//
//     scale=1080:1920:force_original_aspect_ratio=increase,
//     crop=1080:1920:x=(iw-out_w)*xc:y=0
//
// `y=0` means "keep the top of the frame", and the default push was z=1.05 —
// i.e. none. On Meta POV footage the top of the frame is sky, a shop awning or
// a corrugated wall, and the person is in the bottom third. Measured on the
// delivered files: in SHALOM SALAM V3 three consecutive beats are more than
// half grey wall; in COFFEE KINDNESS V4 the subject is behind a water bottle
// with the wearer's own hand filling the bottom fifth of the shot.
//
// WHAT THIS DOES. Locates the subject (scripts/face-box.py), then computes a
// crop rectangle IN SOURCE PIXELS that puts their head at a real size and on
// the upper-third line — instead of cropping blind and hoping.
//
// Results are cached per (clip, span, rotation): detection is the expensive
// part and CLAUDE.md §1 Cost says never pay for it twice.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const CACHE = join(ROOT, "projects/_frameio/cache/framing");

// How much of the frame HEIGHT the head should fill.
// A frontal face box is a reliable claim about where the eyes are, so it can
// be pushed harder. A HOG body box is a guess at the top 22% of a person, so
// it gets a gentler target — over-zooming on a guess decapitates people.
// HOW BIG THE SUBJECT SITS IN FRAME.
//
// Tal, 2026-09-22: *"You zoomed way too much."* He is right. 0.20 put a head
// at a fifth of the frame height, which on a 9:16 crop of a 4K source is a
// near-portrait — it crops out the street, the other person's hands, the thing
// being given. Those are the parts that make the shot readable as a real
// encounter rather than a talking head.
//
// Widened one step across the board. A face now sits at ~15% of frame height,
// which still reads clearly on a phone while keeping context in shot.
const TARGET_H = { face: 0.145, profile: 0.135, body: 0.10 };
// Where the head sits vertically inside the finished 9:16 frame.
// 0.38 was too low: it leaves 62% of the frame BELOW the head, and on these
// shoots that space is a market counter, a shop bench or the wearer's own
// hand — measured on coffee-kindness, where the bottom half of three beats is
// countertop. 0.32 is the reporter's framing: eyes on the upper third, enough
// body to read the gesture, and the caption band at 0.72 falls on the counter
// rather than on the face.
const HEAD_Y = 0.32;

const even = (n) => Math.max(2, Math.round(n / 2) * 2);

/**
 * Locate the subject in `src` between ss..to.
 * `rot` is the transpose applied before framing (0 or 1) — the detector must
 * see the picture the same way up the viewer will, or a sideways clip reports
 * a sideways face.
 * -> { found, of, by, cx, cy, w, h } with coords 0..1, or { found: 0 }.
 */
export function locate(src, ss, to, rot = 0, samples = 6, opts = {}) {
  mkdirSync(CACHE, { recursive: true });
  const key = `${src.split(/[\\/]/).pop()}_${ss.toFixed(2)}_${to.toFixed(2)}_r${rot}_m${opts.minY ?? 0}`
    .replace(/[^A-Za-z0-9._-]/g, "_");
  const p = join(CACHE, `${key}.json`);
  if (existsSync(p)) { try { return JSON.parse(readFileSync(p, "utf8")); } catch {} }
  let r = { found: 0, of: samples };
  try {
    const out = execFileSync("python", [join(ROOT, "scripts/face-box.py"), src,
      String(ss), String(to), String(samples), ...(rot ? ["--rotate", String(rot)] : []),
      ...(opts.minY ? ["--miny", String(opts.minY)] : [])],
      { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
    r = JSON.parse(out.trim().split("\n").pop());
  } catch (e) {
    r = { found: 0, of: samples, error: String(e.message || e).slice(0, 160) };
  }
  writeFileSync(p, JSON.stringify(r), "utf8");
  return r;
}

/**
 * Turn a located subject into a crop rectangle in SOURCE pixels.
 *
 * W,H are the decoded dimensions AFTER rotation. Returns null when there is
 * nothing to aim at, so the caller can fall back to the old centre crop — and,
 * more importantly, so the caller can SAY that a beat has no visible person.
 */
// maxZoom 2.6 was chosen before it was clear what the sources actually are.
// fetch-hq was downscaling the originals to 1080 TALL (`scale=-2:min(1080,ih)`
// on 1080x1920 portrait footage = 608x1080), so a 2.6x crop was 416 real
// pixels blown up to 1920 — a 4.6x upscale, which is why it looked like mush.
// With the originals kept native, 2.1x is 914 real pixels to 1920: a 2.1x
// upscale, which a light unsharp carries. Do not raise this without checking
// what the source height actually is.
// maxZoom 2.1 still allowed a 2x punch-in on a wide shot. Tal's note about
// over-zooming applies to the ceiling too: 1.55 keeps the crop honest, and a
// shot that genuinely needs more than that is the wrong shot.
export function frameFor(box, W, H, { aspect = 9 / 16, maxZoom = 1.55, minZoom = 1.0 } = {}) {
  if (!box || !box.found || !box.h) return null;
  const target = TARGET_H[box.by] ?? TARGET_H.body;

  // How tall the output frame must be, in source pixels, for the head to fill
  // `target` of it. A small head far away => a small crop => a big push-in.
  let cropH = (box.h * H) / target;
  // WIDEN FOR MOVEMENT. `dx`/`dy` are how far the subject travelled across the
  // beat, in frame widths/heights. A crop sized for their median position puts
  // the counter on screen the moment they lean away from it, which is what
  // happened on the long coffee-kindness beats. Grow the window to contain the
  // whole path, plus a margin so they never touch the edge.
  const travelH = (box.dy ?? 0) * H, travelW = (box.dx ?? 0) * W;
  cropH = Math.max(cropH, travelH * 1.2 + box.h * H * 1.6, (travelW * 1.2) / aspect);
  // ...but a beat where the subject wanders must not end up with NO crop at
  // all. On coffee-kindness the 17s payoff beat ("we were raised in love, my
  // friend") widened all the way back to the full frame — the one moment that
  // most needed to be on his face. Hold at least a 1.35x push whenever a real
  // face was found often enough to trust; losing him briefly at the edge of a
  // move is a better trade than playing the whole payoff wide.
  if (box.by !== "body" && (box.found / (box.of || 1)) >= 0.45) {
    cropH = Math.min(cropH, H / 1.35);
  }
  // Never upscale past maxZoom (the source runs out of detail), and never ask
  // for a crop larger than the frame.
  cropH = Math.min(H, Math.max(H / maxZoom, cropH));
  let cropW = cropH * aspect;
  if (cropW > W) { cropW = W; cropH = cropW / aspect; }
  // A crop LARGER than a straight 9:16 of the source is not a crop at all.
  const fullH = Math.min(H, W / aspect);
  if (cropH > fullH / minZoom) cropH = fullH / minZoom, cropW = cropH * aspect;

  cropW = even(cropW); cropH = even(cropH);
  const x = Math.round(box.cx * W - cropW / 2);
  const y = Math.round(box.cy * H - cropH * HEAD_Y);
  return {
    w: cropW, h: cropH,
    x: Math.max(0, Math.min(W - cropW, x)),
    y: Math.max(0, Math.min(H - cropH, y)),
    zoom: +(H / cropH).toFixed(3),
    by: box.by,
    confidence: box.found / (box.of || 1),
  };
}
