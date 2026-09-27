import type { ModelKind } from "../registry.ts";

export type GenerationRequest = {
  model: string;
  kind: ModelKind;
  prompt: string;
  negativePrompt?: string;
  aspect: string;
  durationSec?: number;
  seed?: number;
  /** local path or URL to an input image (image-to-*, lipsync face) */
  image?: string;
  /** local path or URL to an input audio track (lipsync) */
  audio?: string;
  /** where to write the result file (extension chosen by provider) */
  outPathNoExt: string;
};

export type GenerationResult = {
  ok: boolean;
  /** written file path, if any */
  file?: string;
  /** remote URL of the asset, if the provider returns one */
  url?: string;
  provider: string;
  model: string;
  seed?: number;
  raw?: unknown;
  message?: string;
};

export type Provider = {
  name: string;
  /** throws if not configured (e.g. missing key) */
  generate: (req: GenerationRequest) => Promise<GenerationResult>;
};
