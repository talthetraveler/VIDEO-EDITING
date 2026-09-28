"""ALIGN-CACHE - replace Groq's loose timings with WhisperX forced alignment.

Found 2026-09-29 on the israel-batch test (Meta-glasses POV, 425 clips):
Groq's segment times on this footage are rounded to whole seconds and its word
times are loose and sometimes out of order. The builder takes caption WORDING
from segments and TIMING from words, so a sentence straddling a cut was
dropped whole (a beat rendered with no captions at all) and cut points
landed inside words ("Yeah", "for", "So").

This keeps Groq's TEXT (it is good) and re-derives every segment's start/end
and every word's start/end by aligning that text to the audio with wav2vec2
(whisperx.align). The Groq original is kept in transcripts-groq/<id>.json.

  python tools/align-cache.py --slug israel-batch            # every clip of a batch
  python tools/align-cache.py local-b7bc290a0f2fb22f ...     # specific ids
  --force   re-align even if already aligned

Languages with an alignment model: English natively, Hebrew/Arabic via HF
models (checked 2026-09-11). Anything else is left untouched and reported.
"""
import json, os, shutil, sys, time

import whisperx

ROOT = r"C:\Users\taldo\Downloads\videos to edit\system"
CACHE = os.path.join(ROOT, "projects", "_frameio", "cache")
TRANS = os.path.join(CACHE, "transcripts")
BACK = os.path.join(CACHE, "transcripts-groq")
AUDIO = os.path.join(CACHE, "audio")
LANG = {"english": "en", "hebrew": "he", "arabic": "ar", "en": "en", "he": "he", "ar": "ar",
        "spanish": "es", "es": "es", "japanese": "ja", "ja": "ja", "french": "fr", "fr": "fr"}

args = sys.argv[1:]
force = "--force" in args
args = [a for a in args if a != "--force"]
shard = None
if "--shard" in args:  # --shard i/n : this worker takes every n-th id starting at i
    k = args.index("--shard"); i, n = args[k + 1].split("/"); shard = (int(i), int(n)); del args[k:k + 2]
if args and args[0] == "--ids-file":
    ids = [l.strip() for l in open(args[1], encoding="utf8") if l.strip()]
elif args and args[0] == "--slug":
    src = json.load(open(os.path.join(CACHE, "local-sources.json"), encoding="utf8"))
    ids = [k for k, v in src.items() if v.get("slug") == args[1]]
else:
    ids = args
if shard:
    ids = ids[shard[0]::shard[1]]
os.makedirs(BACK, exist_ok=True)

models = {}
done = skipped = failed = 0
t0 = time.time()
for n, cid in enumerate(ids, 1):
    tp = os.path.join(TRANS, f"{cid}.json")
    ap = os.path.join(AUDIO, f"{cid}.flac")
    if not (os.path.exists(tp) and os.path.exists(ap)):
        skipped += 1; continue
    t = json.load(open(tp, encoding="utf8"))
    if t.get("aligned") and not force:
        skipped += 1; continue
    lang = LANG.get(str(t.get("language", "")).lower())
    segs = [s for s in (t.get("segments") or []) if str(s.get("text", "")).strip()]
    if not lang or not segs:
        skipped += 1; continue
    try:
        if lang not in models:
            models[lang] = whisperx.load_align_model(language_code=lang, device="cpu")
        model, meta = models[lang]
        audio = whisperx.load_audio(ap)
        res = whisperx.align([{"start": float(s["start"]), "end": float(s["end"]), "text": s["text"]} for s in segs],
                             model, meta, audio, "cpu", return_char_alignments=False)
        new_segs, new_words = [], []
        for s in res.get("segments", []):
            ws = [w for w in s.get("words", []) if "start" in w and "end" in w]
            if not ws:
                continue
            new_segs.append({"start": round(ws[0]["start"], 3), "end": round(ws[-1]["end"], 3), "text": s["text"].strip()})
            for w in ws:
                new_words.append({"word": w["word"], "start": round(w["start"], 3), "end": round(w["end"], 3),
                                  "score": round(float(w.get("score", 0)), 3)})
        # sanity: never replace a transcript with something that lost most of it
        if len(new_words) < 0.6 * max(1, len(t.get("words") or [])) or not new_segs:
            failed += 1
            print(f"  !! {cid} alignment lost words ({len(new_words)} vs {len(t.get('words') or [])}) - kept Groq")
            continue
        if not os.path.exists(os.path.join(BACK, f"{cid}.json")):
            shutil.copy(tp, os.path.join(BACK, f"{cid}.json"))
        t["segments"], t["words"] = new_segs, new_words
        t["aligned"] = {"by": "whisperx.align", "lang": lang, "at": time.strftime("%Y-%m-%dT%H:%M:%S")}
        json.dump(t, open(tp, "w", encoding="utf8"), ensure_ascii=False, indent=1)
        done += 1
    except Exception as e:  # keep going; report
        failed += 1
        print(f"  !! {cid} {type(e).__name__}: {str(e)[:120]}")
    if n % 25 == 0:
        print(f"  {n}/{len(ids)}  aligned {done}  skipped {skipped}  failed {failed}  {time.time() - t0:.0f}s", flush=True)
print(f"DONE {len(ids)} ids: aligned {done}, skipped {skipped}, failed {failed}, {time.time() - t0:.0f}s")
