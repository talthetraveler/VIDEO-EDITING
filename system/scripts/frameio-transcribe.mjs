#!/usr/bin/env node
// Transcribe the downloaded Frame.io `efficient` proxies.
//
// The V4 API does not expose Frame.io's own transcripts (probed: 422 on
// include=transcript, 404 on every /transcript* route), so discovery runs on
// local transcription of the tiny proxies.
//
// PROVIDER: Groq whisper-large-v3-turbo is the DISCOVERY default (benchmarked
// 2026-09-20 at 0.009x realtime vs 0.30x for local WhisperX — ~33x faster —
// and measurably MORE accurate on this footage: it fixed two Korean
// hallucinations and recovered a Hebrew line local had turned to noise).
// Local WhisperX is NOT replaced: it remains the precision/fallback layer and
// the authority for final caption alignment on clips that survive into an edit.
//
// Caches per clip id and never re-transcribes unchanged bytes (CLAUDE.md §1 Cost).
//
//   node scripts/frameio-transcribe.mjs                  # groq, remaining only
//   node scripts/frameio-transcribe.mjs --provider local # local WhisperX
//   node scripts/frameio-transcribe.mjs --only <id,id>   # re-do specific assets
//   node scripts/frameio-transcribe.mjs --force          # ignore cache entirely
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  FF, groqTranscribe, probeAudio, looksSilent, versionKey, extractAudio,
  isCacheValid, pool, scrub, GROQ_TURBO, GROQ_LARGE,
} from "./lib/stt.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const PY = process.env.PYTHON ?? "python";
const CACHE = join(ROOT, "projects/_frameio/cache");
const PROXY = join(CACHE, "proxies");
const OUT = join(CACHE, "transcripts");
const TMP = join(CACHE, "audio");   // 16k mono FLAC, not giant WAVs

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const PROVIDER = args.includes("--provider") ? args[args.indexOf("--provider") + 1] : "groq";
const LIMIT = args.includes("--limit") ? +args[args.indexOf("--limit") + 1] : Infinity;
const CONC = args.includes("--concurrency") ? +args[args.indexOf("--concurrency") + 1] : 4;
// Discovery defaults to SEGMENT timestamps only. Word-level costs latency and
// is only needed once a clip is a real candidate -> --words, or align-words.mjs.
const WORDS = args.includes("--words");
// TURBO FIRST, LARGE-V3 ON THE BAD ONES. Tal's call, 2026-09-22, after turbo
// transcribed GAZA GUY's IMG_9001 as FRENCH ("Une autre chose!") when the clip
// is Arabic "wala wahed" — not one:
//   *"u can do the turbo for most of it, and if parts came out bad then u can
//   just use large v3 for those"*
// He is right that paying large-v3 rates for every clip is waste — turbo is
// correct on the large majority and 3x cheaper. The defect is not that turbo
// is bad, it is that NOTHING WAS CHECKING ITS OUTPUT. So the escalation below
// runs automatically: turbo transcribes, suspect results are re-done on
// large-v3, and the transcript records which model produced the final text.
// --no-escalate turns it off; --model pins a single model for the whole run.
const MODEL = args.includes("--model") ? args[args.indexOf("--model") + 1] : GROQ_TURBO;
const ESCALATE = !args.includes("--no-escalate") && !args.includes("--model") && PROVIDER === "groq";

// WHAT "CAME OUT BAD" MEANS, MEASURED.
//
// These are the four signatures actually seen in this footage, not a guess:
//
//   1. WRONG LANGUAGE. This footage is Hebrew, Arabic and English, and the
//      shoots are mixed mid-sentence. Anything else — French on IMG_9001,
//      Korean on the earlier batch — is the model inventing a language, and
//      the text that comes with it is invented too.
//   2. LOW CONFIDENCE. mean avg_logprob under -0.6, the threshold already used
//      for the console warning.
//   3. LOOPING. A hallucinating whisper repeats one phrase to fill the clip
//      ("Une autre chose! Une autre chose!"). Measured as: the most common
//      segment text occupies over half the segments, with 4+ segments.
//   4. NOTHING FROM A CLIP THAT IS NOT SILENT. The silence gate above already
//      removed genuinely quiet clips, so empty text here means a dropped line
//      — which is exactly how IMG_8991's "I am a Jew living in Israel" was
//      lost when auto-detect called a 9-second English clip Hebrew.
const EXPECTED_LANGS = new Set(["hebrew", "arabic", "english"]);
function suspect(r, segs, conf) {
  const lang = String(r.language ?? "").toLowerCase();
  if (lang && !EXPECTED_LANGS.has(lang)) return `language=${r.language}`;
  if (conf !== null && conf < -0.6) return `confidence=${conf}`;
  if (!segs.length || !segs.some((s) => String(s.text ?? "").trim())) return "empty";
  if (segs.length >= 4) {
    const counts = new Map();
    for (const s of segs) {
      const k = String(s.text ?? "").trim().toLowerCase();
      if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const top = Math.max(0, ...counts.values());
    if (top / segs.length > 0.5) return `looping x${top}`;
  }
  return null;
}

// NOT ALL SUSPECT RESULTS ARE EQUALLY SUSPECT, and the first version of this
// escalation got that wrong in a way worth recording. IMG_9001 was flagged
// "language=French" on turbo, re-run on large-v3, and large-v3 returned the
// CORRECT Arabic — but with low confidence, because the clip is six retakes of
// two words over street noise. A flat "is it still suspect?" test rejected the
// right answer and kept the French hallucination.
//
// So severity is ranked. A wrong language or an empty result means the text is
// not what was said at all. Looping means part of it is invented. Low
// confidence only means the model found it hard — the words are usually still
// right. A second pass is accepted when it is STRICTLY less severe, so a
// correct-but-unsure Arabic beats a confident-sounding French, and a
// same-severity swap is refused rather than trading one guess for another.
const SEVERITY = (why) => {
  if (!why) return 0;
  if (why.startsWith("language") || why === "empty") return 3;
  if (why.startsWith("looping")) return 2;
  return 1;                                     // confidence
};
// Optional language hint. NOT forced by default: this footage is genuinely
// mixed Hebrew/Arabic/English and a wrong hint is worse than no hint.
const LANG = args.includes("--language") ? args[args.indexOf("--language") + 1] : undefined;
const ONLY = args.includes("--only")
  ? new Set(args[args.indexOf("--only") + 1].split(",").map((s) => s.trim()))
  : null;

const idx = JSON.parse(readFileSync(join(CACHE, "discover-index.json"), "utf8"));
const byId = Object.fromEntries(idx.files.map((f) => [f.id, f]));

// ---------------------------------------------------------------- local provider

function localTranscribe(wav) {
  const py = `
import json, sys, warnings
warnings.filterwarnings("ignore")
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import whisperx
m = whisperx.load_model("small", "cpu", compute_type="int8")
a = whisperx.load_audio(r"${wav.replace(/\\/g, "/")}")
r = m.transcribe(a, batch_size=8)
segs = [{"start": round(s["start"],2), "end": round(s["end"],2), "text": s["text"].strip()} for s in r["segments"]]
print("@@@" + json.dumps({"language": r.get("language"), "segments": segs}, ensure_ascii=False))
`;
  const t0 = Date.now();
  const out = execFileSync(PY, ["-c", py], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"],
  });
  const p = JSON.parse(out.slice(out.indexOf("@@@") + 3));
  return { ...p, words: [], provider: "local-whisperx", model: "whisperx-small-int8", elapsed_s: +((Date.now() - t0) / 1000).toFixed(2) };
}

// ---------------------------------------------------------------- build worklist

const proxies = readdirSync(PROXY).filter((f) => f.endsWith(".mp4"));
const work = [];
let skipped = 0;

for (const file of proxies) {
  const id = file.replace(/\.mp4$/, "");
  if (ONLY && !ONLY.has(id)) continue;
  const dest = join(OUT, `${id}.json`);
  const vkey = versionKey(byId[id], join(PROXY, file));
  if (!FORCE && existsSync(dest)) {
    let cached = null;
    try { cached = JSON.parse(readFileSync(dest, "utf8")); } catch {}
    // CACHE GATE: same bytes -> never pay again. Legacy transcripts (written
    // before version_key existed) are real output and count as valid.
    if (isCacheValid(cached, vkey)) { skipped++; continue; }
  }
  work.push({ id, file, vkey, meta: byId[id] ?? { name: id, bucket: "?" } });
}

const todo = work.slice(0, LIMIT === Infinity ? undefined : LIMIT);
console.log(`${proxies.length} proxies · ${skipped} cached (skipped, not re-paid) · ${todo.length} to transcribe`);
console.log(`provider: ${PROVIDER === "groq" ? `groq ${MODEL}${WORDS ? " +word-ts" : ""}${LANG ? " lang=" + LANG : ""}` : "local whisperx"} · concurrency ${PROVIDER === "groq" ? CONC : 1}\n`);
if (!todo.length) { console.log("nothing to do."); process.exit(0); }

// ---------------------------------------------------------------- run

let done = 0, silent = 0, failed = 0, billedSeconds = 0, escalatedSeconds = 0, tFirst = null, tTen = null;
const t0 = Date.now();

async function handle(j) {
  const wav = join(TMP, `${j.id}.flac`);
  const dest = join(OUT, `${j.id}.json`);
  try {
    if (!existsSync(wav)) extractAudio(join(PROXY, j.file), wav);   // cached audio layer

    const probe = probeAudio(wav);
    const base = {
      id: j.id, name: j.meta.name, bucket: j.meta.bucket,
      source: {
        frameio_file_id: j.id, filename: j.meta.name, folder: j.meta.bucket,
        size_mb: j.meta.size_mb ?? null, version_key: j.vkey,
      },
      duration: probe.duration, audio: { mean_db: probe.mean_db, max_db: probe.max_db },
    };

    // SILENCE GATE — never pay to transcribe silence. The clip is NOT dropped
    // from the library: street reactions and B-roll have no dialogue and are
    // often the best picture we have.
    if (statSync(wav).size < 1200 || looksSilent(probe)) {
      writeFileSync(dest, JSON.stringify({
        ...base, language: null, segments: [], words: [],
        silent: true, no_speech: true, usable_as_broll: true,
        provider: "silence-gate", model: null, transcribed_at: new Date().toISOString(),
      }, null, 2), "utf8");
      silent++; done++;
      console.log(`  [silent] ${j.meta.name}  (max ${probe.max_db}dB — kept as b-roll, not transcribed)`);
      return;
    }

    const meanConf = (segs) => segs.length
      ? +(segs.reduce((t, s) => t + (s.avg_logprob ?? 0), 0) / segs.length).toFixed(3)
      : null;

    let r = PROVIDER === "groq"
      ? await groqTranscribe(wav, { model: MODEL, words: WORDS, language: LANG })
      : localTranscribe(wav);

    if (PROVIDER === "groq") billedSeconds += probe.duration ?? 0;

    let segs = r.segments ?? [];
    let conf = meanConf(segs);
    let escalated = null, forcedLang = null;

    // THE SECOND PASS. Only the clips that failed a check above are re-paid
    // for, and only the better result is kept: if large-v3 comes back just as
    // suspect, turbo's text stays rather than being swapped for a different
    // guess of equal quality. Trading one hallucination for another is not a
    // fix, and silently preferring the newer call would hide that.
    if (ESCALATE) {
      const why = suspect(r, segs, conf);
      if (why) {
        try {
          // A WRONG LANGUAGE IS NOT FIXED BY ASKING AGAIN. IMG_9001 proved
          // this: re-running large-v3 with auto-detect returned Arabic once
          // and a different, equally wrong Arabic the next time. The clip is
          // six retakes of two words over street noise, and auto-detect has
          // nothing stable to lock onto.
          //
          // So when the flag is the language itself, the three languages this
          // footage actually contains are each FORCED and the most confident
          // result wins. Detection is the thing that failed, so detection is
          // the thing to take out of the loop. Three extra calls, but only on
          // the handful of clips that earned them.
          const tries = [];
          const attempt = async (language) => {
            const rr = await groqTranscribe(wav, { model: GROQ_LARGE, words: WORDS, language });
            escalatedSeconds += probe.duration ?? 0;
            const ss = rr.segments ?? [];
            const cc = meanConf(ss);
            tries.push({ r: rr, segs: ss, conf: cc, why: suspect(rr, ss, cc), forced: language ?? null });
          };

          if (!LANG && why.startsWith("language")) {
            for (const l of ["ar", "he", "en"]) await attempt(l);
          } else {
            await attempt(LANG);
          }

          // Least severe first, then most confident, then most text — a
          // near-empty result can score a deceptively good logprob.
          tries.sort((a, b) =>
            SEVERITY(a.why) - SEVERITY(b.why) ||
            (b.conf ?? -99) - (a.conf ?? -99) ||
            (b.segs.join?.("").length ?? 0) - (a.segs.join?.("").length ?? 0));
          const best = tries[0];
          const r2 = best.r, segs2 = best.segs, conf2 = best.conf, why2 = best.why;
          if (best.forced) forcedLang = best.forced;
          if (SEVERITY(why2) < SEVERITY(why)) {
            escalated = { from: MODEL, reason: why, to: GROQ_LARGE, accepted: true,
              still: why2 ?? null, forced_language: forcedLang };
            r = r2; segs = segs2; conf = conf2;
          } else {
            escalated = { from: MODEL, reason: why, to: GROQ_LARGE, accepted: false,
              still: why2 ?? null, note: "large-v3 was no better; kept the turbo text" };
          }
        } catch (e) {
          escalated = { from: MODEL, reason: why, to: GROQ_LARGE, accepted: false,
            note: "escalation failed: " + scrub(e.message).slice(0, 60) };
        }
      }
    }

    writeFileSync(dest, JSON.stringify({
      ...base,
      language: r.language ?? null,
      segments: segs,
      words: r.words ?? [],
      silent: false,
      provider: r.provider, model: r.model,
      transcribed_at: new Date().toISOString(),
      mean_avg_logprob: conf,
      // Which model produced the text above, and why, when it was not the
      // default. Absent means the first pass was clean.
      escalated,
      // ORIGINAL LANGUAGE ONLY. Translation is a separate step and must never
      // overwrite this field.
      is_translation: false,
    }, null, 2), "utf8");

    const words = segs.reduce((t, s) => t + s.text.split(/\s+/).filter(Boolean).length, 0);
    console.log(`  [${r.language ?? "?"}] ${j.meta.name}  ${segs.length} segs, ~${words} words, ${r.words?.length ?? 0} word-ts  (${r.elapsed_s}s)${conf !== null && conf < -0.6 ? "  <-- LOW CONFIDENCE" : ""}` +
      (escalated ? (escalated.accepted
        ? `
      ^ redone on large-v3 (${escalated.reason})${escalated.forced_language ? ` forced ${escalated.forced_language}` : ""}${escalated.still ? ` — still ${escalated.still}, but better` : ""}`
        : `
      ^ large-v3 tried (${escalated.reason}) — no better, kept turbo`) : ""));
    done++;
    if (tFirst === null) tFirst = (Date.now() - t0) / 1000;
    if (done === 10) tTen = (Date.now() - t0) / 1000;
  } catch (e) {
    console.log(`  FAILED ${j.meta.name}: ${scrub(e.message).slice(0, 90)}`);
    failed++;
  }
}

if (PROVIDER === "groq") await pool(todo, CONC, handle);
else for (const j of todo) await handle(j);

const wall = (Date.now() - t0) / 1000;
console.log(`\ntranscribed ${done} (${silent} silent-gated), cached ${skipped}, failed ${failed} in ${wall.toFixed(1)}s`);
if (PROVIDER === "groq") {
  // The two passes are billed at DIFFERENT rates, so one blended number would
  // understate the real cost. Turbo is $0.04/hr, large-v3 $0.111/hr.
  const turboCost = (billedSeconds / 3600) * 0.04;
  const largeCost = (escalatedSeconds / 3600) * 0.111;
  console.log(`billed audio ${(billedSeconds / 60).toFixed(1)} min turbo -> ~$${turboCost.toFixed(4)}` +
    (escalatedSeconds ? ` · ${(escalatedSeconds / 60).toFixed(1)} min re-done on large-v3 -> ~$${largeCost.toFixed(4)}` : "") +
    ` · total ~$${(turboCost + largeCost).toFixed(4)}`);
}
console.log(`-> ${OUT}`);
