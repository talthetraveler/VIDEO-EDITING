#!/usr/bin/env node
// Local WhisperX vs Groq turbo, on clips we ALREADY have local transcripts for.
// Reuses the cached wavs and the cached local JSON — no new work, no re-pay.
//   node scripts/stt-benchmark.mjs
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { groqTranscribe, probeAudio, GROQ_TURBO, pool, scrub } from "./lib/stt.mjs";

const CACHE = "C:/Users/taldo/Downloads/videos to edit/system/projects/_frameio/cache";
const idx = JSON.parse(readFileSync(join(CACHE, "discover-index.json"), "utf8"));
const byName = Object.fromEntries(idx.files.map((f) => [f.name, f]));

// chosen to cover: long-en, mid-en, short-en, micro-en, hebrew x2, and the two
// clips local WhisperX hallucinated Korean on.
const PICK = [
  "video-4955_singular_display.mov", "IMG_1213.mov", "IMG_7718.mov", "IMG_8622.mov",
  "video-4841_singular_display.mov", "video-4848_singular_display.mov",
  "IMG_8616.mov", "IMG_9118.MOV",
];

const rows = [];
const jobs = PICK.map((name) => {
  const meta = byName[name];
  if (!meta) return null;
  const wav = join(CACHE, "wav", `${meta.id}.wav`);
  const local = join(CACHE, "transcripts", `${meta.id}.json`);
  if (!existsSync(wav) || !existsSync(local)) return null;
  return { name, meta, wav, local };
}).filter(Boolean);

console.log(`benchmarking ${jobs.length} clips (cached wavs, cached local transcripts)\n`);

const t0 = Date.now();
await pool(jobs, 4, async (j) => {
  const p = probeAudio(j.wav);
  const loc = JSON.parse(readFileSync(j.local, "utf8"));
  const locText = (loc.segments ?? []).map((s) => s.text).join(" ").trim();
  try {
    const g = await groqTranscribe(j.wav, { model: GROQ_TURBO });
    const gText = g.segments.map((s) => s.text).join(" ").trim();
    rows.push({
      name: j.name, dur: p.duration, groq_s: g.elapsed_s,
      rtf: p.duration ? +(g.elapsed_s / p.duration).toFixed(2) : null,
      local_lang: loc.language, groq_lang: g.language,
      local_words: locText ? locText.split(/\s+/).length : 0,
      groq_words: gText ? gText.split(/\s+/).length : 0,
      groq_word_ts: g.words.length,
      local_text: locText, groq_text: gText,
    });
  } catch (e) {
    rows.push({ name: j.name, dur: p.duration, error: scrub(e.message) });
  }
});
const wall = (Date.now() - t0) / 1000;

rows.sort((a, b) => (b.dur ?? 0) - (a.dur ?? 0));
const audio = rows.reduce((t, r) => t + (r.dur ?? 0), 0);
console.log("clip".padEnd(34), "dur".padStart(7), "groq".padStart(7), "RTF".padStart(6), " local→groq lang", " words l/g", " wordTS");
for (const r of rows) {
  if (r.error) { console.log(r.name.padEnd(34), "ERROR", r.error.slice(0, 60)); continue; }
  console.log(
    r.name.slice(0, 33).padEnd(34),
    (r.dur?.toFixed(1) + "s").padStart(7),
    (r.groq_s + "s").padStart(7),
    String(r.rtf).padStart(6),
    ` ${String(r.local_lang).padEnd(4)}→ ${String(r.groq_lang).padEnd(6)}`,
    ` ${String(r.local_words).padStart(3)}/${String(r.groq_words).padEnd(3)}`,
    ` ${r.groq_word_ts}`
  );
}
console.log(`\naudio ${audio.toFixed(1)}s | groq wall-clock ${wall.toFixed(1)}s (concurrency 4) | aggregate RTF ${(wall / audio).toFixed(3)}x`);
console.log(`groq turbo list price $0.04/hr audio -> this benchmark cost ~$${((audio / 3600) * 0.04).toFixed(4)}`);

writeFileSync(join(CACHE, "stt-benchmark.json"), JSON.stringify({ when: new Date().toISOString(), wall_s: wall, audio_s: audio, rows }, null, 2), "utf8");
console.log(`\ntext comparison -> projects/_frameio/cache/stt-benchmark.json`);
