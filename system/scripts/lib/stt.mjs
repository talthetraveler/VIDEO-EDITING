// Shared STT layer: provider adapters + cache validity + a cheap silence gate.
//
// WHY THIS EXISTS: local WhisperX is accurate but pays ~4-5s of fixed model
// overhead per clip, which dominates a shoot full of 3-8s street fragments
// (measured 8.48x realtime on a 0.6s clip). Groq whisper-large-v3-turbo has no
// per-clip model load, so it wins exactly where we were losing.
//
// Local WhisperX is NOT replaced. It stays the precision/alignment layer.
//
// SECURITY: the key is read from process.env only. It is never logged, never
// written into a transcript, and never included in an error message — see
// scrub() and the catch blocks that use it.
import { readFileSync, existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

export const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
export const FF = join(ROOT, "vendor/OpenChatCut/node_modules/ffmpeg-static/ffmpeg.exe");

export const GROQ_TURBO = "whisper-large-v3-turbo";
export const GROQ_LARGE = "whisper-large-v3";

// ---------------------------------------------------------------- env

/** Load .env into process.env WITHOUT logging any value. Never overwrites an
 *  already-set variable, so a real environment variable wins over the file. */
export function loadEnv(dir = ROOT) {
  const p = join(dir, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/** Remove anything key-shaped from text before it reaches a log or a throw. */
export function scrub(s) {
  return String(s ?? "").replace(/gsk_[A-Za-z0-9]{10,}/g, "gsk_***REDACTED***");
}

// ---------------------------------------------------------------- ffmpeg probe

// ffmpeg writes MEASUREMENTS to stderr and execFileSync returns only stdout —
// that bug once reported 0 cuts on a video with 17 (CLAUDE.md is explicit).
// Anything reading an ffmpeg measurement must read BOTH streams.
const shBoth = (bin, args) => {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return (r.stdout || "") + (r.stderr || "");
};

/** duration + loudness in one pass. Used for the silence gate and for the
 *  `duration` field the discovery index never populated (0/57). */
export function probeAudio(wav) {
  const out = shBoth(FF, ["-hide_banner", "-i", wav, "-af", "volumedetect", "-f", "null", "-"]);
  const mean = /mean_volume:\s*(-?[\d.]+) dB/.exec(out);
  const max = /max_volume:\s*(-?[\d.]+) dB/.exec(out);
  const dur = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(out);
  return {
    duration: dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : null,
    mean_db: mean ? +mean[1] : null,
    max_db: max ? +max[1] : null,
  };
}

/** Extract ONLY the audio Groq needs: 16 kHz mono FLAC. Groq downsamples
 *  speech to 16k mono internally, so anything richer is wasted upload. FLAC is
 *  lossless and ~50-60% the size of the equivalent PCM WAV. We never upload the
 *  video file — we already have the proxy locally. */
export function extractAudio(src, dest) {
  spawnSync(FF, ["-y", "-v", "error", "-i", src, "-vn",
    "-ar", "16000", "-ac", "1", "-c:a", "flac", "-compression_level", "8", dest],
    { stdio: "ignore" });
  return dest;
}

/** Cheap pre-flight so we never pay to transcribe silence.
 *  Deliberately conservative — a clip that MIGHT have speech goes to the API.
 *  A clip that fails this is still kept in the library: street reactions and
 *  B-roll have no dialogue but are often the best picture we have. */
export function looksSilent(p) {
  if (p.max_db === null) return false;
  if (p.max_db < -45) return true;              // nothing above the noise floor
  if (p.mean_db !== null && p.mean_db < -60) return true;
  return false;
}

// ---------------------------------------------------------------- cache

/** Identity of the exact bytes we transcribed. If the Frame.io asset is
 *  replaced or a new version is uploaded, the proxy bytes change and this key
 *  changes, invalidating ONLY that asset. */
export function versionKey(fileMeta, proxyPath) {
  const bytes = existsSync(proxyPath) ? statSync(proxyPath).size : 0;
  return [fileMeta?.id ?? "?", fileMeta?.size_mb ?? "?", bytes].join(":");
}

/** A cached transcript is reusable if it is for the same bytes.
 *  LEGACY GRANDFATHERING: transcripts written before this layer existed have no
 *  version_key. They are real WhisperX output and we are NOT paying to redo
 *  them, so they count as valid. */
export function isCacheValid(cached, vkey) {
  if (!cached) return false;
  if (!cached.source?.version_key) return true;       // legacy local transcript
  return cached.source.version_key === vkey;
}

// ---------------------------------------------------------------- groq

let _client = null;
async function client() {
  if (_client) return _client;
  loadEnv();
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set (expected in .env at the repo root)");
  const { default: Groq } = await import("groq-sdk");
  _client = new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 0 }); // we do our own backoff
  return _client;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Transcribe one audio file with Groq.
 * verbose_json gives us segments, per-segment avg_logprob and no_speech_prob,
 * and the model's OWN detected language — never assume English
 * (whisperx-caption-pipeline-lessons: two clips that "read like English" were
 * actually Arabic).
 *
 * `language` is optional. Passing it removes the short-clip language-detection
 * failure mode, but we leave it UNSET by default because this footage is
 * genuinely mixed Hebrew/Arabic/English and we want the model's real guess.
 */
export async function groqTranscribe(wav, { model = GROQ_TURBO, language, words = false, maxAttempts = 5 } = {}) {
  const g = await client();
  const { createReadStream } = await import("node:fs");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const t0 = Date.now();
    try {
      const withResp = g.audio.transcriptions.create({
        file: createReadStream(wav),
        model,
        response_format: "verbose_json",
        ...(words ? { timestamp_granularities: ["segment", "word"] } : {}),
        ...(language ? { language } : {}),
      }).withResponse();
      const { data: r, response: httpRes } = await withResp;
      const rl = {
        remaining_requests: httpRes?.headers?.get?.("x-ratelimit-remaining-requests") ?? null,
        remaining_seconds: httpRes?.headers?.get?.("x-ratelimit-remaining-audio-seconds") ?? null,
        reset: httpRes?.headers?.get?.("x-ratelimit-reset-requests") ?? null,
      };
      const segs = (r.segments ?? []).map((s) => ({
        start: +(+s.start).toFixed(2),
        end: +(+s.end).toFixed(2),
        text: String(s.text ?? "").trim(),
        ...(s.avg_logprob !== undefined ? { avg_logprob: +(+s.avg_logprob).toFixed(3) } : {}),
        ...(s.no_speech_prob !== undefined ? { no_speech_prob: +(+s.no_speech_prob).toFixed(3) } : {}),
      }));
      return {
        language: r.language ?? null,
        duration: r.duration ?? null,
        segments: segs,
        words: (r.words ?? []).map((w) => ({
          word: w.word, start: +(+w.start).toFixed(2), end: +(+w.end).toFixed(2),
        })),
        provider: "groq",
        model,
        rate_limit: rl,
        elapsed_s: +((Date.now() - t0) / 1000).toFixed(2),
      };
    } catch (e) {
      const status = e?.status ?? e?.response?.status;
      // 429 = rate limit, 5xx = transient. Honour Retry-After when given.
      if ((status === 429 || (status >= 500 && status < 600)) && attempt < maxAttempts) {
        const hinted = +(e?.headers?.["retry-after"] ?? e?.response?.headers?.get?.("retry-after") ?? 0);
        const wait = hinted > 0 ? hinted * 1000 : Math.min(30000, 1000 * 2 ** attempt) + Math.random() * 500;
        await sleep(wait);
        continue;
      }
      throw new Error(scrub(e?.message || String(e)));   // never leak the key
    }
  }
  throw new Error("groq: exhausted retries");
}


/**
 * TRANSLATE speech to English. Tal: "you shouldn't have captions in Hebrew,
 * only English - just translate it."
 *
 * This is a SEPARATE call from transcription and the result is stored in a
 * separate field. The original-language transcript is never overwritten, and a
 * translated caption is "timing verified, wording UNVERIFIED" - we did not hear
 * the English, the model produced it.
 */
// NOTE: the translations endpoint does NOT support timestamp_granularities,
// so translated captions are timed from SEGMENTS, not words.
export async function groqTranslate(file, { model = GROQ_LARGE, maxAttempts = 4 } = {}) {
  const g = await client();
  const { createReadStream } = await import("node:fs");
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const r = await g.audio.translations.create({
        file: createReadStream(file),
        model,                          // translations endpoint needs large-v3
        response_format: "verbose_json",
      });
      return {
        segments: (r.segments ?? []).map((x) => ({ start: +(+x.start).toFixed(2), end: +(+x.end).toFixed(2), text: String(x.text ?? "").trim() })),
        words: [],
        provider: "groq", model, is_translation: true,
      };
    } catch (e) {
      const st = e?.status ?? e?.response?.status;
      if ((st === 429 || (st >= 500 && st < 600)) && attempt < maxAttempts) {
        await sleep(Math.min(20000, 1000 * 2 ** attempt)); continue;
      }
      throw new Error(scrub(e?.message || String(e)));
    }
  }
  throw new Error("groq translate: exhausted retries");
}

// ---------------------------------------------------------------- queue

/** Bounded concurrent map. Not a framework — 15 lines so we never fire an
 *  uncontrolled fan-out at the API. */
export async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const n = i++;
      if (n >= items.length) return;
      out[n] = await fn(items[n], n);
    }
  });
  await Promise.all(workers);
  return out;
}
