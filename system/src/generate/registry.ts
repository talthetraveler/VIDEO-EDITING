/**
 * Model registry — a curated slice of the Open-Higgsfield-AI catalogue
 * (which routes 200+ hosted models via the muapi.ai gateway).
 *
 * We don't vendor their whole dump; we keep the models worth reaching for in
 * this workflow, tagged by kind so `scripts/generate.mjs` can validate a request.
 * Add rows as needed — `id` must match what your chosen provider expects.
 */

export type ModelKind =
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video"
  | "lipsync";

export type ModelEntry = {
  id: string;
  kind: ModelKind;
  /** rough provider family, for routing / docs */
  family: string;
  aspects: string[];
  /** video only */
  durationsSec?: number[];
  notes?: string;
};

export const MODELS: ModelEntry[] = [
  // ---- text-to-image ----
  { id: "flux-2-pro", kind: "text-to-image", family: "flux", aspects: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"], notes: "high-fidelity default" },
  { id: "flux-dev", kind: "text-to-image", family: "flux", aspects: ["1:1", "16:9", "9:16", "3:2", "2:3"], notes: "fast, cheap iterations" },
  { id: "flux-krea-dev", kind: "text-to-image", family: "flux", aspects: ["1:1", "16:9", "9:16"], notes: "photoreal aesthetic" },
  { id: "bytedance-seedream-v4", kind: "text-to-image", family: "seedream", aspects: ["1:1", "16:9", "9:16", "4:3", "3:4"], notes: "strong typography + realism" },
  { id: "google-imagen4-ultra", kind: "text-to-image", family: "imagen", aspects: ["1:1", "16:9", "9:16", "4:3", "3:4"], notes: "clean, safe, detailed" },
  { id: "ideogram-v3-t2i", kind: "text-to-image", family: "ideogram", aspects: ["1:1", "16:9", "9:16", "10:16", "16:10"], notes: "best for in-image text" },
  { id: "gpt-image-1.5", kind: "text-to-image", family: "openai", aspects: ["1:1", "3:2", "2:3"], notes: "instruction-following" },

  // ---- image-to-image / edit ----
  { id: "nano-banana-pro", kind: "image-to-image", family: "gemini", aspects: ["1:1", "16:9", "9:16"], notes: "multi-image edit, up to 14 refs" },
  { id: "flux-kontext-max-t2i", kind: "image-to-image", family: "flux", aspects: ["1:1", "16:9", "9:16"], notes: "consistent character/style edits" },
  { id: "flux-redux", kind: "image-to-image", family: "flux", aspects: ["1:1", "16:9", "9:16"], notes: "reference-guided variation" },

  // ---- text-to-video ----
  { id: "kling-o1-text-to-video", kind: "text-to-video", family: "kling", aspects: ["16:9", "9:16", "1:1"], durationsSec: [5, 10], notes: "strong motion + prompt adherence" },
  { id: "wan2.6-text-to-video", kind: "text-to-video", family: "wan", aspects: ["16:9", "9:16", "1:1"], durationsSec: [5], notes: "open-weights lineage" },
  { id: "grok-imagine-text-to-video", kind: "text-to-video", family: "grok", aspects: ["16:9", "9:16"], durationsSec: [6], notes: "fun/normal/spicy tonal modes" },
  { id: "vidu-q2-text-to-video", kind: "text-to-video", family: "vidu", aspects: ["16:9", "9:16", "1:1"], durationsSec: [4, 8], notes: "fast" },

  // ---- image-to-video ----
  { id: "kling-o1-image-to-video", kind: "image-to-video", family: "kling", aspects: ["16:9", "9:16", "1:1"], durationsSec: [5, 10], notes: "animate a still with a camera move" },
  { id: "wan2.6-image-to-video", kind: "image-to-video", family: "wan", aspects: ["16:9", "9:16"], durationsSec: [5] },
  { id: "seedance-image-to-video", kind: "image-to-video", family: "seedance", aspects: ["16:9", "9:16", "1:1"], durationsSec: [5, 10], notes: "smooth, cinematic" },

  // ---- lipsync ----
  { id: "kling-lip-sync", kind: "lipsync", family: "kling", aspects: ["16:9", "9:16", "1:1"], notes: "drive a face from an audio track" },
];

export const findModel = (id: string) => MODELS.find((m) => m.id === id);
export const modelsByKind = (k: ModelKind) => MODELS.filter((m) => m.kind === k);

/** Pick a sensible default model for a kind. */
export const defaultModel = (k: ModelKind): string =>
  ({
    "text-to-image": "flux-2-pro",
    "image-to-image": "nano-banana-pro",
    "text-to-video": "kling-o1-text-to-video",
    "image-to-video": "kling-o1-image-to-video",
    lipsync: "kling-lip-sync",
  })[k];
