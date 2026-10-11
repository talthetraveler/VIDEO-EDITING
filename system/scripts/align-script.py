"""ALIGN A HAND-WRITTEN SCRIPT TO AN ALREADY-EDITED VIDEO'S AUDIO.

For captioning someone's finished post (homeless-hangout, 2026-10-11): the
machine transcript is garbled wherever a quiet stranger mumbles, so the caption
wording is written by hand from two models' passes, and only the TIMING is
taken from the audio (wav2vec2 forced alignment, whisperx.align).

  python scripts/align-script.py <audio> <script.txt> <out.words.json>

script.txt, one caption sentence per line:
  @12.5            block boundary in seconds (limits drift; optional)
  {words}          spoken but NOT shown (a best guess at speech too unclear to caption)
  forty|40         align the word "forty", display "40";  eighteen|  displays nothing
out: [{"w": display, "a": s, "b": s, "show": bool, "line": n}, ...]
"""
import json, re, subprocess, sys
import whisperx

audio_p, script_p, out_p = sys.argv[1:4]
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                     "-of", "csv=p=0", audio_p]).decode().strip())
blocks, cur = [], {"start": 0.0, "toks": []}
for ln, raw in enumerate(open(script_p, encoding="utf8").read().splitlines()):
    raw = raw.strip()
    if not raw:
        continue
    if raw.startswith("@"):
        t = float(raw[1:])
        if cur["toks"]:
            cur["end"] = t; blocks.append(cur)
        cur = {"start": t, "toks": []}
        continue
    hidden = False
    for part in re.split(r"([{}])", raw):
        if part == "{": hidden = True; continue
        if part == "}": hidden = False; continue
        for tok in part.split():
            spoken, _, disp = tok.partition("|")
            cur["toks"].append({"spoken": spoken, "w": disp if "|" in tok else spoken,
                                "show": (not hidden) and bool(disp if "|" in tok else spoken), "line": ln})
cur["end"] = dur; blocks.append(cur)

model, meta = whisperx.load_align_model(language_code="en", device="cpu")
wav = whisperx.load_audio(audio_p)
out = []
for b in blocks:
    text = " ".join(t["spoken"] for t in b["toks"])
    res = whisperx.align([{"start": b["start"], "end": b["end"], "text": text}], model, meta, wav, "cpu",
                         return_char_alignments=False)
    ws = [w for s in res["segments"] for w in s["words"]]
    if len(ws) != len(b["toks"]):
        print(f"!! block @{b['start']}: {len(b['toks'])} script words vs {len(ws)} aligned", file=sys.stderr)
    for t, w in zip(b["toks"], ws):
        out.append({"w": t["w"], "a": w.get("start"), "b": w.get("end"), "show": t["show"], "line": t["line"]})
# a word the aligner could not place (digits, symbols) borrows from its neighbours
for i, o in enumerate(out):
    if o["a"] is None:
        prev = next((out[j]["b"] for j in range(i - 1, -1, -1) if out[j]["b"] is not None), 0.0)
        nxt = next((out[j]["a"] for j in range(i + 1, len(out)) if out[j]["a"] is not None), prev + 0.3)
        o["a"], o["b"] = prev, max(prev + 0.05, nxt)
json.dump(out, open(out_p, "w", encoding="utf8"), indent=0)
print(f"{len(out)} words, {sum(1 for o in out if o['show'])} shown -> {out_p}")
