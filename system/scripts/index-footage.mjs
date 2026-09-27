#!/usr/bin/env node
/**
 * Index a folder of raw clips ONCE into a searchable moment library.
 *
 *   node scripts/index-footage.mjs <folder> --slug <shoot> [--model medium]
 *        [--lang auto] [--frames 5] [--force] [--limit N]
 *
 * Per clip (resumable — skips clips already in the DB):
 *   1. ffprobe metadata (duration, dims, fps, mtime)                [npx remotion ffmpeg]
 *   2. multilingual transcription + word timings + speech regions   [whisper.cpp]
 *   3. keyframe extraction (N evenly-spaced frames)                 [npx remotion ffmpeg]
 *   4. CLIP embedding per frame + cheap visual tags                 [Transformers.js, local]
 *
 * Writes public/footage/<slug>/library.db  (+ frames/ jpgs).
 * Then: group-interactions.mjs  ->  extract-moments.mjs  ->  library-summary.mjs
 *
 * NEVER modifies source files. Multilingual by default — do not pass a *.en model
 * for footage with Hebrew/Arabic.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync, mkdirSync, linkSync, copyFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { homedir, tmpdir, cpus } from "node:os";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";
import { openDb, f32ToBlob } from "./lib/db.mjs";
import { norm, mergeTokensToWords } from "./lib/autocut-core.mjs";
import { embedImage, vocabEmbeddings } from "./lib/clip.mjs";
import { cosine } from "./lib/db.mjs";

const WHISPER_VERSION = "1.5.5";
const VIDEO_EXTS = new Set([".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi"]);
const HOTWORDS =
  "Shalom, Shabbat Shalom, Salam, Salam Alaikum, Wa Alaikum Salam, Marhaba, Toda, Yalla, Israel, Jaffa, Tel Aviv, Jerusalem";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const has = (n) => args.includes(`--${n}`);
const folder = args.find((a) => !a.startsWith("--"));
if (!folder || !existsSync(folder)) {
  console.error("Usage: node scripts/index-footage.mjs <folder> --slug <shoot> [--model medium] [--frames 5]");
  process.exit(1);
}
const slug = (opt("slug", basename(folder)) || basename(folder)).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
const model = opt("model", "medium"); // multilingual. small=488MB, medium=1.5GB
const lang = opt("lang", "auto");
const nFrames = Math.max(2, parseInt(opt("frames", "5"), 10));
const limit = opt("limit") ? parseInt(opt("limit"), 10) : Infinity;
const force = has("force");

const root = process.cwd();
const cacheRoot = join(homedir(), ".cache", "video-studio");
const whisperDir = join(cacheRoot, "whisper.cpp");
const outDir = join(root, "public", "footage", slug);
const framesDir = join(outDir, "frames");
mkdirSync(framesDir, { recursive: true });
mkdirSync(cacheRoot, { recursive: true });

/**
 * Resolve Remotion's bundled ffmpeg binary once. Calling it directly is ~12x
 * faster than `npx remotion ffmpeg` (which pays ~2s of npx startup per call —
 * at 7 calls/clip that alone was an hour across 328 clips).
 */
const ffmpegBin = (() => {
  const cands = readdirSync(join(root, "node_modules", "@remotion"))
    .filter((d) => d.startsWith("compositor-"))
    .map((d) => join(root, "node_modules", "@remotion", d, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"));
  return cands.find((p) => existsSync(p)) ?? null;
})();
const ffmpeg = (a) => {
  try {
    if (ffmpegBin) {
      return execFileSync(ffmpegBin, ["-hide_banner", ...a.map((x) => String(x).replace(/^"|"$/g, ""))], {
        stdio: ["ignore", "ignore", "pipe"],
      }).toString();
    }
    return execFileSync("npx", ["remotion", "ffmpeg", ...a], { shell: true, stdio: ["ignore", "ignore", "pipe"] }).toString();
  } catch (e) {
    return String(e.stderr ?? "");
  }
};
const probe = (p) => {
  const s = ffmpeg(["-i", p]);
  const dm = s.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  const rm = s.match(/(\d+(?:\.\d+)?)\s*fps/);
  const wh = s.match(/,\s(\d{2,5})x(\d{2,5})[\s,]/);
  const ct = s.match(/creation_time\s*:\s*([0-9T:\-.Z]+)/);
  const audio = /Audio:/.test(s);
  return {
    duration_s: dm ? +dm[1] * 3600 + +dm[2] * 60 + +dm[3] : 0,
    fps: rm ? +rm[1] : 30,
    width: wh ? +wh[1] : null,
    height: wh ? +wh[2] : null,
    creation_ms: ct ? Date.parse(ct[1]) || 0 : 0,
    has_audio: audio ? 1 : 0,
  };
};

/**
 * Capture order. Preference:
 *   1. container creation_time (real capture clock)
 *   2. a timestamp in the filename (20250712_143022 …)
 *   3. 0 — caller falls back to the numeric sequence id
 * File mtime is deliberately NOT used: exported/downloaded folders (e.g. the
 * Meta glasses export) all carry the same download time and would collapse every
 * clip into one interaction.
 */
const captureMs = (name, meta) => {
  if (meta.creation_ms) return meta.creation_ms;
  const m = name.match(/(20\d{2})[-_]?(\d{2})[-_]?(\d{2})[-_ T]?(\d{2})?(\d{2})?(\d{2})?/);
  if (m) {
    const [, Y, Mo, D, h = "0", mi = "0", s = "0"] = m;
    const t = Date.parse(`${Y}-${Mo}-${D}T${h.padStart(2, "0")}:${mi.padStart(2, "0")}:${s.padStart(2, "0")}`);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
};

/** Numeric sequence id from names like od_video-1243_… / video-4464_… */
const seqOf = (name) => {
  const m = name.match(/(\d{3,})/);
  return m ? parseInt(m[1], 10) : 0;
};

const db = openDb(join(outDir, "library.db"));
const seen = new Set(db.prepare("SELECT id FROM clips").all().map((r) => r.id));

// whisper install (cwd workaround for the unquoted Expand-Archive on Windows)
console.log(`· whisper.cpp (${model})…`);
process.chdir(cacheRoot);
try {
  await installWhisperCpp({ to: whisperDir, version: WHISPER_VERSION });
  await downloadWhisperModel({ model, folder: whisperDir });
} finally {
  process.chdir(root);
}
const vocab = await vocabEmbeddings();

// Sort by the numeric sequence id, NOT the filename string — prefixes like
// "od_video-" / "video-" interleave and would otherwise scramble capture order.
const files = readdirSync(folder)
  .filter((f) => VIDEO_EXTS.has(extname(f).toLowerCase()))
  .sort((a, b) => seqOf(a) - seqOf(b) || a.localeCompare(b))
  .slice(0, limit);
console.log(`· ${files.length} clips in ${folder}\n`);

const insClip = db.prepare(`INSERT OR REPLACE INTO clips
  (id,path,abs_path,ext,bytes,duration_s,width,height,fps,created_ms,order_index,language,transcript,has_audio,indexed_at)
  VALUES (@id,@path,@abs_path,@ext,@bytes,@duration_s,@width,@height,@fps,@created_ms,@order_index,@language,@transcript,@has_audio,@indexed_at)`);
const insWord = db.prepare("INSERT OR REPLACE INTO words (clip_id,idx,word,norm,start_s,end_s) VALUES (?,?,?,?,?,?)");
const insSpeech = db.prepare("INSERT INTO speech (clip_id,start_s,end_s) VALUES (?,?,?)");
const insFrame = db.prepare("INSERT OR REPLACE INTO frames (clip_id,t_s,jpg_path,embed) VALUES (?,?,?,?)");

/**
 * whisper.cpp scales badly past ~4 threads: 4 concurrent processes at -t2 beat
 * one at -t8 by ~3.7x on this box (measured). So run a small pool of clips in
 * parallel, each with few threads, and serialise only the SQLite writes.
 */
const CONCURRENCY = Math.max(1, parseInt(opt("jobs", String(Math.max(2, Math.floor(cpus().length / 2)))), 10));
const WHISPER_THREADS = Math.max(1, Math.floor(cpus().length / CONCURRENCY));

const pending = files
  .map((f, i) => ({ f, i, id: basename(f, extname(f)).replace(/[^a-z0-9-_]/gi, "_") }))
  .filter((x) => force || !seen.has(x.id));
console.log(`· ${pending.length} to index (${files.length - pending.length} cached) · ${CONCURRENCY} jobs × ${WHISPER_THREADS} threads\n`);

/** Everything for one clip that can run off the main thread. */
async function analyse({ f, i, id }) {
  const abs = join(folder, f);
  const meta = probe(abs);

  // Make the clip reachable via staticFile() for rendering — hardlink (instant,
  // zero extra space on the same volume), fall back to copy across volumes.
  // Sources are never modified.
  const linked = join(outDir, f);
  if (!existsSync(linked)) {
    try {
      linkSync(abs, linked);
    } catch {
      try {
        copyFileSync(abs, linked);
      } catch {
        /* unreadable source — the clip is still indexed, just not renderable */
      }
    }
  }

  // ---- transcription ----
  let transcript = "";
  let language = null;
  const words = [];
  if (meta.has_audio && meta.duration_s > 0.3) {
    const wav = join(tmpdir(), `vsidx_${id}_${Date.now()}.wav`);
    ffmpeg(["-i", abs, "-vn", "-ac", "1", "-ar", "16000", "-y", wav]);
    if (existsSync(wav)) {
      try {
        const out = await transcribe({
          inputPath: wav,
          whisperPath: whisperDir,
          whisperCppVersion: WHISPER_VERSION,
          model,
          tokenLevelTimestamps: true,
          language: lang === "auto" ? null : lang,
          additionalArgs: [
            ["--prompt", HOTWORDS],
            ["-t", String(WHISPER_THREADS)],
          ],
        });
        language = out.result?.language ?? null;
        const { captions } = toCaptions({ whisperCppOutput: out });
        // whisper.cpp gives BPE sub-word tokens; merge them into real words
        // (leading space = word boundary) before anything downstream sees them.
        const toks = captions
          .filter((c) => /[\p{L}\p{N}]/u.test(c.text))
          .map((c) => ({ word: c.word ?? c.text, start: c.startMs / 1000, end: c.endMs / 1000 }));
        words.push(...mergeTokensToWords(toks));
        transcript = words.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();
      } catch {
        /* leave the clip transcript-less rather than failing the whole batch */
      }
      try {
        execFileSync("node", ["-e", `require('fs').rmSync(${JSON.stringify(wav)},{force:true})`]);
      } catch {}
    }
  }

  // ---- keyframes + CLIP ----
  const dur = meta.duration_s || 1;
  const times = Array.from({ length: nFrames }, (_, k) => +(((k + 0.5) / nFrames) * dur).toFixed(2));
  const frameRows = [];
  for (const t of times) {
    const jpg = join(framesDir, `${id}_${String(t).replace(".", "_")}.jpg`);
    ffmpeg(["-ss", String(t), "-i", abs, "-frames:v", "1", "-q:v", "3", "-vf", "scale=384:-2", "-y", jpg]);
    if (!existsSync(jpg)) continue;
    try {
      const emb = await embedImage(jpg);
      frameRows.push({ t, jpg, emb });
    } catch {
      /* skip this frame's embedding */
    }
  }

  // speech regions from word gaps
  const regions = [];
  if (words.length) {
    let s = words[0].start;
    let e = words[0].end;
    for (const w of words.slice(1)) {
      if (w.start - e <= 0.5) e = Math.max(e, w.end);
      else {
        regions.push([s, e]);
        s = w.start;
        e = w.end;
      }
    }
    regions.push([s, e]);
  }

  return {
    row: {
      id,
      path: `footage/${slug}/${f}`,
      abs_path: abs,
      ext: extname(f).toLowerCase(),
      bytes: (() => {
        try {
          return statSync(abs).size;
        } catch {
          return 0;
        }
      })(),
      duration_s: meta.duration_s,
      width: meta.width,
      height: meta.height,
      fps: meta.fps,
      created_ms: captureMs(f, meta),
      order_index: seqOf(f) || i,
      language,
      transcript,
      has_audio: meta.has_audio,
      indexed_at: Date.now(),
    },
    words,
    regions,
    frameRows,
    f,
  };
}

/** SQLite is synchronous — all writes happen here, on the main thread. */
const commit = ({ row, words, regions, frameRows }) => {
  const id = row.id;
  db.transaction(() => {
    insClip.run(row);
    db.prepare("DELETE FROM words WHERE clip_id=?").run(id);
    words.forEach((w, k) => insWord.run(id, k, w.word, norm(w.word), w.start, w.end));
    db.prepare("DELETE FROM speech WHERE clip_id=?").run(id);
    for (const [a, b] of regions) insSpeech.run(id, a, b);
    db.prepare("DELETE FROM frames WHERE clip_id=?").run(id);
    for (const fr of frameRows) insFrame.run(id, fr.t, `${slug}/frames/${basename(fr.jpg)}`, f32ToBlob(fr.emb));
  })();
};

// ---- worker pool -------------------------------------------------------
let done = 0;
let failed = 0;
const t0 = Date.now();
let next = 0;
const worker = async () => {
  while (next < pending.length) {
    const item = pending[next++];
    try {
      const res = await analyse(item);
      commit(res);
      done++;
    } catch (e) {
      failed++;
      console.log(`  ✗ ${item.f}: ${e.message}`);
    }
    if (done % 10 === 0 || done + failed === pending.length) {
      const mins = (Date.now() - t0) / 60000;
      const rate = done / Math.max(mins, 0.01);
      console.log(
        `  ${String(done).padStart(4)}/${pending.length}  ${rate.toFixed(1)}/min  eta ${Math.round((pending.length - done) / Math.max(rate, 0.01))}min`,
      );
    }
  }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// stale vocab reference kept for the tagging pass in extract-moments
void vocab;
void cosine;

console.log(`\n════ indexed ${done} new (${failed} failed) / ${files.length} total ════`);
console.log(`✓ ${join("public", "footage", slug, "library.db")}`);
console.log("Next: node scripts/group-interactions.mjs --slug " + slug);
