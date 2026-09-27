import { writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import type { Provider, GenerationRequest, GenerationResult } from "./types.ts";

/**
 * muapi.ai adapter — the gateway Open-Higgsfield-AI uses to reach 200+ hosted
 * image/video models. Paid, per-generation; needs MUAPI_API_KEY.
 *
 * The exact request/response schema differs per model family on muapi. This
 * adapter implements the common "create task → poll → download" shape and keeps
 * the endpoints overridable via env so you can match the docs without editing
 * code:
 *
 *   MUAPI_API_KEY      (required)
 *   MUAPI_BASE_URL     default https://api.muapi.ai
 *   MUAPI_CREATE_PATH  default /v1/{model}/predictions      ({model} is substituted)
 *   MUAPI_STATUS_PATH  default /v1/predictions/{id}
 *
 * Verify against https://muapi.ai docs for your model before a paid run.
 */

const env = (k: string, d = "") => process.env[k] ?? d;

const toDataUri = async (pathOrUrl?: string) => {
  if (!pathOrUrl) return undefined;
  if (/^https?:/.test(pathOrUrl)) return pathOrUrl;
  const buf = await readFile(pathOrUrl);
  const ext = pathOrUrl.split(".").pop()?.toLowerCase() ?? "png";
  const mime = ext === "mp3" || ext === "wav" ? `audio/${ext}` : `image/${ext === "jpg" ? "jpeg" : ext}`;
  return `data:${mime};base64,${buf.toString("base64")}`;
};

export const muapiProvider: Provider = {
  name: "muapi",
  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const key = env("MUAPI_API_KEY");
    if (!key) throw new Error("MUAPI_API_KEY is not set. export it, or use GEN_PROVIDER=dry-run.");

    const base = env("MUAPI_BASE_URL", "https://api.muapi.ai");
    const createPath = env("MUAPI_CREATE_PATH", "/v1/{model}/predictions").replace("{model}", req.model);
    const statusPath = env("MUAPI_STATUS_PATH", "/v1/predictions/{id}");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "x-api-key": key };

    const input: Record<string, unknown> = {
      prompt: req.prompt,
      negative_prompt: req.negativePrompt,
      aspect_ratio: req.aspect,
      seed: req.seed,
    };
    if (req.durationSec) input.duration = req.durationSec;
    const img = await toDataUri(req.image);
    const aud = await toDataUri(req.audio);
    if (img) input.image = img;
    if (aud) input.audio = aud;

    const created = await fetch(base + createPath, {
      method: "POST",
      headers,
      body: JSON.stringify({ input }),
    });
    const createdJson = await created.json().catch(() => ({}));
    if (!created.ok) {
      return { ok: false, provider: "muapi", model: req.model, message: `create ${created.status}: ${JSON.stringify(createdJson)}` };
    }

    type Job = Record<string, unknown> & {
      id?: string; prediction_id?: string; task_id?: string; status?: string;
      output?: { url?: string } | string[] | undefined;
      result?: { url?: string }; video_url?: string; image_url?: string; url?: string;
    };
    let job = createdJson as Job;
    const id = job.id ?? job.prediction_id ?? job.task_id;
    // poll until a terminal state
    for (let i = 0; i < 120 && id && !["succeeded", "completed", "failed", "error"].includes(job.status ?? ""); i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const s = await fetch(base + statusPath.replace("{id}", id), { headers });
      job = (await s.json().catch(() => job)) as Job;
    }

    const out = job.output;
    const url: string | undefined =
      (out && !Array.isArray(out) ? out.url : undefined) ??
      (Array.isArray(out) ? out[0] : undefined) ??
      job.result?.url ?? job.video_url ?? job.image_url ?? job.url;
    if (!url) {
      const dump = `${req.outPathNoExt}.muapi.json`;
      writeFileSync(dump, JSON.stringify(job, null, 2));
      return { ok: false, provider: "muapi", model: req.model, raw: job, message: `no asset url in response — see ${dump}` };
    }

    const bin = Buffer.from(await (await fetch(url)).arrayBuffer());
    const ext = req.kind.includes("video") || req.kind === "lipsync" ? "mp4" : "png";
    const file = `${req.outPathNoExt}.${ext}`;
    writeFileSync(file, bin);
    return { ok: true, file, url, provider: "muapi", model: req.model, seed: req.seed, raw: job };
  },
};
