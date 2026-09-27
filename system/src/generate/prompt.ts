/**
 * Shot-prompt compiler — the reusable part of "Open Higgsfield".
 *
 * Turns a structured ShotSpec + Cinema-Studio camera params into a single
 * production-grade prompt string. Keeps the workflow independent of any one
 * generator: the same spec compiles for Flux, Seedream, Kling, Veo, etc.
 */

export type Aspect = "9:16" | "1:1" | "16:9" | "4:5" | "21:9";

export type ShotSpec = {
  subject: string;
  environment?: string;
  composition?: string; // wide / medium / close / macro / top-down / symmetrical…
  cameraMove?: string; // push-in / pullback / orbit / tracking / crane / handheld / locked-off — + speed
  lighting?: string;
  motion?: string; // what moves inside the frame
  material?: string; // glass / metal / asphalt / water / skin / screens
  depth?: string; // foreground / subject / background layers
  style?: string; // photorealistic / documentary / premium commercial / cinematic
  mood?: string;
  aspect?: Aspect;
  durationSec?: number; // for video models
  negative?: string;
  /** Cinema-Studio camera controls (ported from Open-Higgsfield-AI) */
  cinema?: CinemaControls;
};

// ---- Cinema Studio: camera settings -> prompt modifiers ---------------------
export type CameraBody =
  | "8k-digital" | "cine-digital" | "70mm-film" | "s35-studio" | "16mm-film" | "large-format";
export type Lens =
  | "anamorphic" | "macro" | "prime-70s" | "prime-modern" | "prime-warm"
  | "swirl-bokeh" | "vintage-prime" | "halation-diffusion" | "clinical-sharp" | "tilt";
export type Focal = "8mm" | "14mm" | "24mm" | "35mm" | "50mm" | "85mm";
export type Aperture = "f1.4" | "f4" | "f11";

export type CinemaControls = {
  camera?: CameraBody;
  lens?: Lens;
  focal?: Focal;
  aperture?: Aperture;
};

const CAMERA_MOD: Record<CameraBody, string> = {
  "8k-digital": "shot on a modular 8K digital cinema camera, ultra-clean highlight roll-off",
  "cine-digital": "full-frame digital cinema camera, filmic latitude",
  "70mm-film": "captured on 70mm film, fine grain, wide tonal range",
  "s35-studio": "Super-35 studio digital sensor, controlled contrast",
  "16mm-film": "16mm film, visible grain, slight gate weave, vintage texture",
  "large-format": "large-format digital sensor, shallow rendering, three-dimensional falloff",
};
const LENS_MOD: Record<Lens, string> = {
  anamorphic: "anamorphic lens, oval bokeh, horizontal flares, 2.39 feel",
  macro: "macro lens, extreme close focus, razor-thin depth of field",
  "prime-70s": "1970s cinema prime, gentle contrast, warm color science",
  "prime-modern": "modern cinema prime, neutral rendering, high micro-contrast",
  "prime-warm": "warm cinema prime, amber highlights, soft skin tones",
  "swirl-bokeh": "swirl-bokeh portrait lens, spinning background blur",
  "vintage-prime": "vintage prime, low-contrast, soft corners, bloom on speculars",
  "halation-diffusion": "halation diffusion filter, glowing highlights, dreamy roll-off",
  "clinical-sharp": "clinical sharp prime, edge-to-edge resolution, no aberration",
  tilt: "tilt lens, selective plane of focus, miniature effect",
};
const FOCAL_MOD: Record<Focal, string> = {
  "8mm": "8mm ultra-wide, strong perspective, curved edges",
  "14mm": "14mm wide angle, expansive field of view",
  "24mm": "24mm wide, environmental framing",
  "35mm": "35mm, natural human-eye perspective",
  "50mm": "50mm, mild compression, portrait-neutral",
  "85mm": "85mm telephoto, tight compression, isolated subject",
};
const APERTURE_MOD: Record<Aperture, string> = {
  "f1.4": "f/1.4, very shallow depth of field, creamy background separation",
  f4: "f/4, balanced depth of field",
  f11: "f/11, deep focus, sharp foreground to background",
};

export const cinemaModifiers = (c: CinemaControls = {}): string =>
  [
    c.camera && CAMERA_MOD[c.camera],
    c.lens && LENS_MOD[c.lens],
    c.focal && FOCAL_MOD[c.focal],
    c.aperture && APERTURE_MOD[c.aperture],
  ]
    .filter(Boolean)
    .join(", ");

// ---- compile --------------------------------------------------------------
export const compilePrompt = (s: ShotSpec): string => {
  const parts = [
    s.subject,
    s.environment,
    s.composition,
    cinemaModifiers(s.cinema),
    s.cameraMove && `camera: ${s.cameraMove}`,
    s.lighting,
    s.motion && `motion: ${s.motion}`,
    s.material,
    s.depth,
    s.style,
    s.mood,
  ].filter(Boolean);
  let p = parts.join(", ");
  if (s.negative) p += `\nNegative: ${s.negative}`;
  return p;
};

export const DEFAULT_NEGATIVE =
  "no text, no watermark, no logos, no captions, no warping, no extra limbs, no distortion";
