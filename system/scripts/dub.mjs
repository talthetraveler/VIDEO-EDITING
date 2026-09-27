#!/usr/bin/env node
/**
 * AI-dub a project's spoken audio into another language (open-dubbing + edge-tts).
 *
 *   node scripts/dub.mjs <projectName> --lang es|ar|he|fr|pt|de|hi|ru|en
 *   node scripts/dub.mjs <projectName> --remove
 *
 * Uses the project's current review preview as the source. open-dubbing
 * transcribes → translates (NLLB) → synthesises → time-aligns. We keep only the
 * dubbed AUDIO and attach it as `p.dub` — ProjectVideo mutes the video track and
 * plays the dub. Non-destructive: original stays in project.json, `--remove`
 * clears it. Slow on CPU (~5–15 min); run one at a time.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { loadProject, saveProject } from "./lib/project.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
if (!name) { console.error("Usage: node scripts/dub.mjs <projectName> --lang es|ar|he|… | --remove"); process.exit(1); }

const p = loadProject(name);

if (args.includes("--remove")) {
  if (p.dub) { delete p.dub; saveProject(name, p, { label: "remove dub" }); console.log(`✓ ${name}: dub removed`); }
  else console.log(`· ${name} has no dub`);
  process.exit(0);
}

const LANG = opt("lang", "");
// ISO 639-3. open-dubbing's TTS + whisper use these; its NLLB module is locally
// patched to accept "ara" (it internally codes Arabic as arb_Arab).
const ISO3 = { es: "spa", ar: "ara", he: "heb", fr: "fra", pt: "por", de: "deu", hi: "hin", ru: "rus", en: "eng", it: "ita", tr: "tur" }[LANG];
if (!ISO3) { console.error(`--lang must be one of es ar he fr pt de hi ru en it tr (got "${LANG}")`); process.exit(1); }

// ---- source: the current review preview (render one if missing) --------
const slug = name.replace(/-[ab]$/, "");
const V = name.endsWith("-b") ? "B" : "A";
let srcMp4 = join(root, "scratch", "batch", "previews", `${slug}-${V}.mp4`);
if (!existsSync(srcMp4)) srcMp4 = join(root, "projects", name, "preview", `${name}.mp4`);
if (!existsSync(srcMp4)) {
  console.log("· no preview yet — rendering one first");
  execFileSync(process.execPath, [join(root, "scripts", "proj-render.mjs"), name, "--scale", "0.5", "--no-denoise"], { cwd: root, stdio: "inherit" });
  srcMp4 = join(root, "projects", name, "preview", `${name}.mp4`);
}

const venvPy = join(root, ".venv-dub", "Scripts", "open-dubbing.exe");
if (!existsSync(venvPy)) { console.error("open-dubbing not installed (.venv-dub missing)"); process.exit(1); }
const cfg = (() => { try { return JSON.parse(readFileSync(join(root, "projects", "_dub", "config.json"), "utf8")); } catch { return {}; } })();
const hfTok = process.env.HF_TOKEN || cfg.hf_token || "";

const work = join(root, "scratch", "dub", `${name}-${LANG}`);
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

// open-dubbing renames any input with spaces/hyphens itself, and that rename
// step has raced with a fresh ffmpeg-written file on Windows (FileNotFoundError
// right after a successful render). Sidestep it: hand it an already-sanitised,
// hyphen-free copy so its own rename logic is a no-op.
const cleanSrc = join(work, `src${basename(srcMp4).replace(/[^a-zA-Z0-9.]/g, "")}`);
mkdirSync(join(work), { recursive: true });
execFileSync(process.execPath, ["-e", `require('fs').copyFileSync(${JSON.stringify(srcMp4)}, ${JSON.stringify(cleanSrc)})`]);

console.log(`· dubbing ${name} → ${LANG} (${ISO3}) from ${basename(srcMp4)}  [open-dubbing, CPU — this takes a while]`);
const r = spawnSync(
  venvPy,
  [
    "--input_file", cleanSrc,
    "--output_directory", work,
    "--source_language", "eng",
    "--target_language", ISO3,
    "--tts", "edge",
    "--stt", "faster-whisper",
    "--whisper_model", "medium",
    "--device", "cpu",
    "--device_pyannote", "cpu",
    "--nllb_model", "nllb-200-1.3B",
    ...(hfTok ? ["--hugging_face_token", hfTok] : []),
    "--clean-intermediate-files",
    "--log_level", "WARNING",
  ],
  { cwd: root, stdio: "inherit", timeout: 40 * 60 * 1000 },
);
if (r.status !== 0) { console.error(`✗ open-dubbing failed (exit ${r.status})`); process.exit(1); }

// ---- find the dubbed video/audio open-dubbing produced -----------------
const outs = readdirSync(work).filter((f) => /\.(mp4|mkv|mov|wav|mp3|m4a|aac)$/i.test(f));
// prefer a file whose name mentions the target language / "dubbed"
const pick =
  outs.find((f) => new RegExp(`(dubbed|${ISO3}|${LANG})`, "i").test(f) && /\.(mp4|mkv|mov)$/i.test(f)) ||
  outs.find((f) => /\.(mp4|mkv|mov)$/i.test(f)) ||
  outs.sort((a, b) => statSync(join(work, b)).size - statSync(join(work, a)).size)[0];
if (!pick) { console.error(`✗ no output file found in ${work}`); process.exit(1); }

const dubDir = join(root, "public", "footage", "dub");
mkdirSync(dubDir, { recursive: true });
const dst = join(dubDir, `${name}-${LANG}.m4a`);
console.log(`· extracting dubbed audio from ${pick}`);
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", join(work, pick), "-vn", "-c:a", "aac", "-b:a", "160k", dst], { stdio: ["ignore", "ignore", "inherit"] });

p.dub = { lang: LANG, src: `footage/dub/${name}-${LANG}.m4a`, at: new Date().toISOString() };
saveProject(name, p, { label: `dub → ${LANG}` });
console.log(`\n✓ ${name}: dubbed to ${LANG}  →  ${p.dub.src}`);
console.log(`  the video's own audio is muted on render; ProjectVideo plays the dub.`);
console.log(`  re-render:  node scripts/proj-render.mjs ${name} --scale 0.4`);
