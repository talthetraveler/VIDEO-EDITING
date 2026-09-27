/**
 * Generate a shot — the "Open Higgsfield" layer.
 *
 *   node --strip-types scripts/generate.ts --spec shot.json --slug miami --kind text-to-video
 *   npm run generate -- --spec shot.json --slug miami --kind image-to-video --image public/generated/miami/plate.png
 *
 * Reads a ShotSpec JSON, compiles a production-grade prompt (+ Cinema-Studio
 * camera modifiers), sends it to the configured provider, and saves the asset
 * plus a sidecar JSON into public/generated/<slug>/.
 *
 * Provider is GEN_PROVIDER (default "dry-run" — compiles + writes the request,
 * generates nothing). Set GEN_PROVIDER=muapi and MUAPI_API_KEY for real output.
 */
import { mkdirSync, writeFileSync, readFileSync, appendFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import {
  compilePrompt,
  cinemaModifiers,
  DEFAULT_NEGATIVE,
  findModel,
  defaultModel,
  getProvider,
  type ShotSpec,
  type ModelKind,
} from "../src/generate/index.ts";

const args = process.argv.slice(2);
const opt = (n: string, d?: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const has = (n: string) => args.includes(`--${n}`);

const specPath = opt("spec");
if (!specPath || !existsSync(specPath)) {
  console.error("Usage: npm run generate -- --spec <shot.json> --slug <slug> --kind <text-to-image|image-to-image|text-to-video|image-to-video|lipsync> [--model X] [--aspect 9:16] [--duration 5] [--image p] [--audio p] [--seed N] [--name shot-01] [--save]");
  process.exit(1);
}

type SpecFile = ShotSpec & {
  kind?: ModelKind;
  model?: string;
  image?: string;
  audio?: string;
  seed?: number;
  name?: string;
};
const spec: SpecFile = JSON.parse(readFileSync(specPath, "utf8"));

const kind = (opt("kind", spec.kind ?? "text-to-image")) as ModelKind;
const model = opt("model", spec.model ?? defaultModel(kind))!;
const entry = findModel(model);
if (!entry) console.warn(`⚠ model "${model}" not in registry — proceeding, but check the id.`);
if (entry && entry.kind !== kind) console.warn(`⚠ model "${model}" is ${entry.kind}, not ${kind}.`);

const slug = (opt("slug", basename(specPath).replace(/\.json$/, "")) || "misc").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
const name = (opt("name", spec.name ?? "shot") || "shot").replace(/[^a-z0-9-_]/gi, "-");
const aspect = opt("aspect", spec.aspect ?? (kind.includes("video") ? "9:16" : "9:16"))!;
const durationSec = kind.includes("video") ? Number(opt("duration", String(spec.durationSec ?? entry?.durationsSec?.[0] ?? 5))) : undefined;
const seed = opt("seed", spec.seed != null ? String(spec.seed) : undefined);
const image = opt("image", spec.image);
const audio = opt("audio", spec.audio);

const prompt = compilePrompt({ ...spec, aspect: aspect as ShotSpec["aspect"], durationSec });
const negativePrompt = spec.negative ?? DEFAULT_NEGATIVE;

const outDir = join(process.cwd(), "public", "generated", slug);
mkdirSync(outDir, { recursive: true });
const outPathNoExt = join(outDir, name);

console.log(`\n── compiled prompt (${model}, ${kind}, ${aspect}${durationSec ? `, ${durationSec}s` : ""}) ──\n`);
console.log(prompt);
if (spec.cinema) console.log(`\ncinema modifiers: ${cinemaModifiers(spec.cinema)}`);
console.log("");

const provider = getProvider();
console.log(`· provider: ${provider.name}`);
const result = await provider.generate({
  model,
  kind,
  prompt,
  negativePrompt,
  aspect,
  durationSec,
  seed: seed != null ? Number(seed) : undefined,
  image,
  audio,
  outPathNoExt,
});

const sidecar = { slug, name, kind, model, aspect, durationSec, seed, spec, prompt, negativePrompt, result };
writeFileSync(`${outPathNoExt}.json`, JSON.stringify(sidecar, null, 2));

if (result.ok) {
  console.log(`\n✓ ${result.file ?? result.url}`);
  console.log(`✓ ${outPathNoExt}.json`);
  if (has("save")) {
    const md = `\n## ${slug}/${name} — ${model} (${kind})\n\n> ${spec.subject}\n\n\`\`\`\n${prompt}\n\`\`\`\n`;
    appendFileSync(join(process.cwd(), "prompts", "saved", "winners.md"), md);
    console.log("✓ appended to prompts/saved/winners.md");
  }
} else {
  console.error(`\n✗ ${result.message}`);
  process.exit(1);
}
