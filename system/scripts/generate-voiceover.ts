/**
 * Generate a per-scene voiceover with ElevenLabs TTS.
 *
 *   ELEVENLABS_API_KEY=... node --strip-types scripts/generate-voiceover.ts <project-slug>
 *
 * Reads scripts/vo/<slug>.json:
 *   {
 *     "voiceId": "JBFqnCBsd6RMkjVDRZzb",
 *     "modelId": "eleven_multilingual_v2",
 *     "settings": { "stability": 0.5, "similarity_boost": 0.75, "style": 0.3 },
 *     "scenes": [
 *       { "id": "01-hook", "text": "One outage stopped an entire city." },
 *       { "id": "02-stat", "text": "Traffic took ten and a half hours to recover." }
 *     ]
 *   }
 *
 * Writes public/voiceover/<slug>/<id>.mp3 for each scene.
 * Then wire timing with voiceoverMetadata() from src/lib/voiceover.ts.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node --strip-types scripts/generate-voiceover.ts <project-slug>");
  process.exit(1);
}
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("Set ELEVENLABS_API_KEY in the environment.");
  process.exit(1);
}

type Config = {
  voiceId: string;
  modelId?: string;
  settings?: Record<string, number>;
  scenes: { id: string; text: string }[];
};

const cfgPath = join(process.cwd(), "scripts", "vo", `${slug}.json`);
const cfg: Config = JSON.parse(readFileSync(cfgPath, "utf8"));
const outDir = join(process.cwd(), "public", "voiceover", slug);
mkdirSync(outDir, { recursive: true });

for (const scene of cfg.scenes) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${cfg.voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: scene.text,
        model_id: cfg.modelId ?? "eleven_multilingual_v2",
        voice_settings: cfg.settings ?? { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
      }),
    },
  );
  if (!res.ok) {
    console.error(`✗ ${scene.id}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const file = join(outDir, `${scene.id}.mp3`);
  writeFileSync(file, buf);
  console.log(`✓ ${scene.id}.mp3  (${(buf.length / 1024).toFixed(0)} KB)`);
}

console.log(`\nDone. ${cfg.scenes.length} clips in public/voiceover/${slug}/`);
