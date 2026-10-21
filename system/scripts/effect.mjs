#!/usr/bin/env node
// EFFECT OF THE DAY — the three effects from Tal's toolkit PDF, on any clip.
//
//   node scripts/effect.mjs glass    <clip> --title REVENUE --end '$10K' [--colour gold] [--at 1]
//   node scripts/effect.mjs screen   <clip> --text "Stop scrolling." [--when say | --when 2-5] [--colour amber]
//   node scripts/effect.mjs shoulder <clip> --from "BEFORE | \$3,200 | per month" --to "AFTER | \$32,000 | per month"
//                                           [--style normal|transition] [--at 1] [--colour clay] [--face x,w,eye]
//   common: [--out file.mp4] [--check]  (--check = render the check stills only, no video)
//           [--set key=jsonValue ...]   (any raw setting from src/effects/settings.ts)
//
// The PDF's prompts build a separate ~/EffectOfTheDay kit. Here they live in
// the main Remotion project (src/effects/, its own entry point) so the editor
// can drop one into a cut. Settings go in as --props, never by editing a file.
//
// The source clip is read-only: it is hardlinked (or copied) into a temp
// public dir that holds nothing else, so the bundle does not copy the 5 GB
// public/ folder (CLAUDE.md §7). The temp dir is deleted afterwards.
//
// Screen push word timings: Groq word timestamps (scripts/lib/stt.mjs, the
// pipeline's default STT), else the PDF's own local Whisper (transformers.js).
// Over-the-shoulder face: scripts/face-box.py (Haar), mapped into the 9:16
// cover frame. A Haar box is a guess at ear-to-ear width; LOOK at the two
// check stills before trusting it, and pass --face to correct it.
import { existsSync, mkdirSync, linkSync, copyFileSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join, basename, extname, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import { ROOT, loadEnv, extractAudio, groqTranscribe } from "./lib/stt.mjs";

const EFFECTS = { glass: "LiquidGlassGraph", screen: "ScreenPush", shoulder: "OverTheShoulder" };
const [kind, clipArg] = process.argv.slice(2);
if (!EFFECTS[kind] || !clipArg) {
  console.error("usage: node scripts/effect.mjs <glass|screen|shoulder> <clip> [options]  (see the header)");
  process.exit(1);
}
const argv = process.argv.slice(4);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes(k);
const clip = resolve(clipArg);
if (!existsSync(clip)) { console.error(`no such clip: ${clip}`); process.exit(1); }

// ---------------------------------------------------------------- colours
// Each prompt names its own palette; a hex is used exactly as typed.
const PALETTE = {
  glass: { green: "#22C55E", gold: "#E8B44A", blue: "#3D7BFF", red: "#EF4444", purple: "#8B5CF6", white: "#FFFFFF", amber: "#FFC46B" },
  screen: { white: "#FFFFFF", green: "#7CFFA0", amber: "#FFC46B", red: "#FF6B6B", blue: "#7CC4FF", gold: "#FFC46B" },
  shoulder: { clay: "#B03926", gold: "#E8B44A", green: "#3FA66A", blue: "#3D7BFF", red: "#D9412B", purple: "#7B5CFF" },
};
const DEFAULT_COLOUR = { glass: "green", screen: "white", shoulder: "clay" };
function colour(v) {
  v = String(v ?? DEFAULT_COLOUR[kind]).trim();
  if (/^#?[0-9a-f]{3}$/i.test(v)) v = "#" + v.replace("#", "").split("").map((c) => c + c).join("");
  if (/^#?[0-9a-f]{6}$/i.test(v)) return ("#" + v.replace("#", "")).toUpperCase();
  const hex = PALETTE[kind][v.toLowerCase()];
  if (!hex) { console.error(`unknown colour "${v}" — use a hex or one of: ${Object.keys(PALETTE[kind]).join(", ")}`); process.exit(1); }
  return hex;
}

// ---------------------------------------------------------------- probe
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries",
  "format=duration:stream=codec_type,r_frame_rate,width,height:stream_side_data=rotation:stream_tags=rotate", "-of", "json", clip], { encoding: "utf8" }));
const vs = probe.streams.find((s) => s.codec_type === "video");
// iPhone clips store 1280x720 with a -90 rotation tag: the picture is portrait on screen.
const rot = Math.abs(+(vs.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? vs.tags?.rotate ?? 0)) % 180;
if (rot === 90) [vs.width, vs.height] = [vs.height, vs.width];
const [fn, fd] = vs.r_frame_rate.split("/").map(Number);
const clipFps = +(fn / (fd || 1)).toFixed(3);
const clipSeconds = +(+probe.format.duration).toFixed(3);
const vertical = Math.abs(vs.width / vs.height - 9 / 16) < 0.01;
console.log(`clip: ${basename(clip)}  ${vs.width}x${vs.height}  ${clipFps} fps  ${clipSeconds}s`);
if (!vertical) console.log(`  not 9:16 — it will be cropped to fill 1080x1920 (cover)`);

// ---------------------------------------------------------------- props per effect
const props = { clipFile: `input/clip${extname(clip).toLowerCase()}`, clipSeconds, clipFps };
let checkTimes = [];

if (kind === "glass") {
  // "$10K" -> prefix $, 10, K;  "2.4M" -> 2.4, M, 1 decimal;  "82%" -> 82, %
  const end = String(opt("--end", "82%")).trim();
  const m = /^([^\d.\-]*)(-?[\d,]*\.?\d+)(.*)$/.exec(end);
  if (!m) { console.error(`--end "${end}" has no number in it`); process.exit(1); }
  const num = m[2].replace(/,/g, "");
  const decimals = num.includes(".") ? num.split(".")[1].length : 0;
  const endValue = +num;
  Object.assign(props, {
    title: String(opt("--title", "RETENTION")).toUpperCase(),
    prefix: m[1].trim(), suffix: m[3].trim(), decimals, endValue,
    // about a fifth of the end, rounded the same way, so the counter has room to climb (82 -> 18)
    startValue: +(endValue * 0.22).toFixed(decimals),
    lineColour: colour(opt("--colour")),
    startAt: +opt("--at", 1.0),
  });
  const need = 0.18 + 1.16 + 1.5 + 0.3 + 0.3;     // draw start + draw + hold + exit + a breath
  if (props.startAt + need > clipSeconds) {
    const moved = Math.max(0, +(clipSeconds - need).toFixed(2));
    console.log(`  startAt ${props.startAt}s leaves too little clip — moved to ${moved}s`);
    props.startAt = moved;
  }
  checkTimes = [props.startAt + 1.6];
}

if (kind === "screen") {
  const raw = String(opt("--text", "Stop scrolling."));
  const text = raw.replace(/^"(.*)"$/s, "$1").trim().split(/\s+/);
  const when = String(opt("--when", "say")).trim();
  const norm = (w) => w.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, "");
  let words, endAt;
  const range = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/.exec(when);
  const said = range ? null : await transcribe(clip);
  if (range) {
    const [a, b] = [+range[1], +range[2]];
    words = text.map((t, i) => ({ text: t, start: +(a + (i * (b - a)) / text.length).toFixed(2) }));
    endAt = b;
    // if what is said inside the range matches the text word for word, use the real starts instead
    const inRange = (opt("--words") ? JSON.parse(readFileSync(opt("--words"), "utf8")) : await transcribe(clip))
      .filter((w) => w.start >= a - 0.05 && w.start < b);
    if (inRange.length === text.length && inRange.every((w, i) => norm(w.text) === norm(text[i])))
      words = text.map((t, i) => ({ text: t, start: inRange[i].start }));
  } else {
    const t = said.map((w) => norm(w.text)), want = text.map(norm);
    let at = -1;
    for (let i = 0; i + want.length <= t.length && at < 0; i++)
      if (want.every((w, j) => t[i + j] === w)) at = i;
    if (at < 0) {
      console.error(`"${raw}" is not something said in this clip. Transcript:\n  ${said.map((w) => w.text).join(" ")}`);
      console.error(`Give seconds instead, e.g. --when 2-5`);
      // let the Groq connection close first: exiting mid-close trips a libuv assertion on Windows
      await new Promise((r) => setTimeout(r, 200));
      process.exit(2);
    }
    words = text.map((x, j) => ({ text: x, start: said[at + j].start }));
    const last = said[at + text.length - 1];
    endAt = Math.max(last.end + 0.3, last.start + 0.9);
  }
  // Every word holds at least 3 frames. Whisper gave "I" 0.02 s before "just" on the first test: a one-frame
  // flash nobody can read. Push the next word later instead (never more than the shortfall).
  const minHold = 3 / clipFps;
  for (let i = 1; i < words.length; i++)
    words[i].start = +Math.max(words[i].start, words[i - 1].start + minHold).toFixed(3);
  endAt = Math.max(endAt, words[words.length - 1].start + minHold);
  endAt = +Math.min(endAt, clipSeconds).toFixed(2);
  Object.assign(props, { words, endAt, textColour: colour(opt("--colour")), allCaps: false });
  if (text.length > 15) console.log(`  ${text.length} words — reads best at 3 to 15; building it anyway`);
  console.log("  word timings:"); for (const w of words) console.log(`    ${w.start.toFixed(2)}  ${w.text}`);
  console.log(`    ${endAt.toFixed(2)}  (cut back to the clip)`);
  const first = words.find((w) => w.text.replace(/[^\p{L}\p{N}]/gu, "").length >= 3) ?? words[0];
  checkTimes = [first.start + 0.05];
}

if (kind === "shoulder") {
  const card = (s, d) => {
    const parts = String(s ?? d).split("|").map((x) => x.trim());
    return parts.length === 1 ? { label: "", big: parts[0], small: "" } : { label: parts[0] ?? "", big: parts[1] ?? "", small: parts[2] ?? "" };
  };
  Object.assign(props, {
    style: opt("--style", "normal") === "transition" ? "transition" : "normal",
    start: card(opt("--from"), "BEFORE | $3,200 | per month"),
    end: card(opt("--to"), "AFTER | $32,000 | per month"),
    startAt: +opt("--at", 1.0),
    accent: colour(opt("--colour")),
  });
  if (props.startAt + 4.6 > clipSeconds) {
    const moved = Math.max(0, +(clipSeconds - 4.6).toFixed(2));
    console.log(`  the move needs 4.6 s after startAt — moved startAt to ${moved}s`);
    props.startAt = moved;
  }
  Object.assign(props, opt("--face") ? parseFace(opt("--face")) : measureFace());
  console.log(`  face: faceX ${props.faceX}  faceWidth ${props.faceWidth}  eyeY ${props.eyeY}`);
  checkTimes = [props.startAt + 1.9, props.startAt + 3.3];
}

for (const kv of argv.filter((a, i) => argv[i - 1] === "--set")) {
  const [k, ...v] = kv.split("="); const s = v.join("=");
  try { props[k] = JSON.parse(s); } catch { props[k] = s; }
}

// ---------------------------------------------------------------- render
const effectId = EFFECTS[kind];
const slug = { glass: "liquid-glass", screen: "screen-push", shoulder: "over-the-shoulder" }[kind];
const out = resolve(opt("--out", join(ROOT, "projects/_effects", `${basename(clip, extname(clip))}-${slug}.mp4`)));
const work = join(tmpdir(), "tal-effects", `${Date.now()}`);
mkdirSync(join(work, "public/input"), { recursive: true });
mkdirSync(dirname(out), { recursive: true });
try {
  const link = join(work, "public", props.clipFile);
  try { linkSync(clip, link); } catch { copyFileSync(clip, link); }
  const propsFile = join(work, "props.json");
  writeFileSync(propsFile, JSON.stringify(props, null, 1));
  const common = [`--props=${propsFile}`, `--public-dir=${join(work, "public")}`];
  const rem = (args) => {
    // node + the CLI file, not `npx` through a shell: "videos to edit" has spaces and a shell splits them.
    const r = spawnSync(process.execPath, [join(ROOT, "node_modules/@remotion/cli/remotion-cli.js"), ...args, ...common], { cwd: ROOT, stdio: "inherit" });
    if (r.status !== 0) throw new Error(`remotion ${args[0]} failed (exit ${r.status})`);
  };
  const checks = [];
  for (const [i, t] of checkTimes.entries()) {
    const png = out.replace(/\.mp4$/i, `.check${checkTimes.length > 1 ? i + 1 : ""}.png`);
    rem(["still", "src/effects/index.ts", effectId, png, `--frame=${Math.round(t * clipFps)}`]);
    checks.push(png);
  }
  console.log(`check stills (LOOK at these before trusting the render):\n  ${checks.join("\n  ")}`);
  if (!flag("--check")) {
    rem(["render", "src/effects/index.ts", effectId, out, "--codec=h264", "--crf=16", "--pixel-format=yuv420p", "--color-space=bt709"]);
    const o = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries",
      "format=duration:stream=codec_type,codec_name,width,height,pix_fmt,color_range,r_frame_rate", "-of", "json", out], { encoding: "utf8" }));
    const v = o.streams.find((s) => s.codec_type === "video"), a = o.streams.find((s) => s.codec_type === "audio");
    console.log(`rendered: ${out}\n  ${v.width}x${v.height} ${v.codec_name} ${v.pix_fmt} range=${v.color_range ?? "?"} ${v.r_frame_rate} ` +
      `${(+o.format.duration).toFixed(2)}s  audio=${a ? a.codec_name : "NONE"}`);
    if (!a) console.log("  WARNING: no audio stream in the output");
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

// ---------------------------------------------------------------- helpers
async function transcribe(file) {
  if (opt("--words")) return JSON.parse(readFileSync(opt("--words"), "utf8"));
  loadEnv();
  const tmp = join(tmpdir(), `effect-${Date.now()}.flac`);
  try {
    if (process.env.GROQ_API_KEY) {
      extractAudio(file, tmp);
      const r = await groqTranscribe(tmp, { words: true, language: opt("--language") });
      return r.words.map((w) => ({ text: String(w.word).trim(), start: w.start, end: w.end })).filter((w) => w.text);
    }
  } finally { rmSync(tmp, { force: true }); }
  // No key: the PDF's own local route — Whisper base via transformers.js, about 0.1 s late, so shifted earlier.
  console.log("  no GROQ_API_KEY — transcribing locally (Whisper base, transformers.js)");
  const wav = join(tmpdir(), `effect-${Date.now()}.wav`);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav]);
  const buf = readFileSync(wav); rmSync(wav);
  let p = 12; while (buf.toString("ascii", p, p + 4) !== "data") p += 8 + buf.readUInt32LE(p + 4);
  const pcm = buf.subarray(p + 8), audio = new Float32Array(pcm.length >> 1);
  for (let i = 0; i < audio.length; i++) audio[i] = pcm.readInt16LE(i * 2) / 32768;
  const { pipeline } = await import("@huggingface/transformers");
  const asr = await pipeline("automatic-speech-recognition", "onnx-community/whisper-base_timestamped", { dtype: "fp32" });
  const lang = opt("--language");
  const res = await asr(audio, { return_timestamps: "word", chunk_length_s: 30, stride_length_s: 5, ...(lang ? { language: lang } : {}) });
  const EARLY = 0.1; let prev = -1; const words = [];
  for (const c of res.chunks) {
    const text = c.text.trim(); if (!text) continue;
    const start = Math.max(0, prev + 0.05, c.timestamp[0] - EARLY);
    words.push({ text, start: +start.toFixed(2), end: +Math.max(start + 0.05, c.timestamp[1] ?? c.timestamp[0]).toFixed(2) });
    prev = start;
  }
  return words;
}

function parseFace(s) {
  const [faceX, faceWidth, eyeY] = String(s).split(",").map(Number);
  return { faceX, faceWidth, eyeY };
}

function measureFace() {
  const a = props.startAt, b = Math.min(clipSeconds, a + 4.6);   // the whole move, not just its first frame
  let f;
  try {
    // CenterFace with eye landmarks. NOT face-box.py: its Haar cascade took a hand with a ring for a face.
    f = JSON.parse(execFileSync("python", [join(ROOT, "scripts/face-eyes.py"), clip, String(a), String(b), "7"], { encoding: "utf8" }).trim().split(/\r?\n/).pop());
  } catch (e) { f = { found: 0 }; }
  if (!f.found) {
    console.log(`  no face found near ${a}s — using the design defaults; pass --face x,w,eye after looking`);
    return { faceX: 0.5, faceWidth: 0.32, eyeY: 0.255 };
  }
  if (f.dx > 0.08) console.log(`  WARNING: the face moves ${Math.round(f.dx * 100)}% of the frame width during the move — a card may touch it. The effect wants a still talking head.`);
  // face-eyes reports the upright source frame (0-1). Map it through the 9:16 cover crop the composition applies.
  const c = Math.max(1080 / vs.width, 1920 / vs.height);
  const ox = (1080 - vs.width * c) / 2, oy = (1920 - vs.height * c) / 2;
  const X = (u) => (u * vs.width * c + ox) / 1080, Y = (v) => (v * vs.height * c + oy) / 1920;
  return {
    faceX: +X(f.cx).toFixed(3),
    faceWidth: +((f.w * vs.width * c) / 1080).toFixed(3),
    eyeY: +Y(f.eyeY).toFixed(3),
  };
}
