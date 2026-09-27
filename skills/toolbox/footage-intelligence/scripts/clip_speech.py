"""Footage intelligence — detect speech in a clip, transcribe if present (diarized).

1. Extract mono 16k audio, measure mean volume (ffmpeg volumedetect).
2. If mean_volume below the speech floor (likely ambient/silent) -> skip, has_speech=false.
3. Else upload to AssemblyAI + transcribe (universal-3-pro, speaker_labels) ->
   speaker count + utterances (speaker, text, start/end).

Key read IN-SCRIPT from your project-root .env (never shell-piped; avoids block-secrets hook).
Generic. Usage:  python clip_speech.py <clip_path> <out_json> [speech_floor_db=-40]
Prints + writes: {"clip","has_speech","mean_db","speakers","utterances":[...]}
"""
import sys, os, re, json, time, subprocess, urllib.request

clip = sys.argv[1]
out_json = sys.argv[2]
FLOOR = float(sys.argv[3]) if len(sys.argv) > 3 else -40.0
name = os.path.splitext(os.path.basename(clip))[0]

# --- locate + read AAI key from .env (walk up to your project root) ---
def find_key():
    d = os.path.abspath(os.path.dirname(__file__))
    for _ in range(10):
        env = os.path.join(d, ".env")
        if os.path.exists(env):
            for ln in open(env, encoding="utf-8", errors="ignore"):
                m = re.match(r"\s*ASSEMBLYAI_API_KEY\s*=\s*(.+)", ln)
                if m: return m.group(1).strip().strip('"').strip("'")
        nd = os.path.dirname(d)
        if nd == d: break
        d = nd
    return None

# --- audio energy gate ---
wav = os.path.join(os.path.dirname(out_json), f"{name}.16k.wav")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", clip,
                "-ac", "1", "-ar", "16000", wav], capture_output=True)
vd = subprocess.run(["ffmpeg", "-i", wav, "-af", "volumedetect", "-f", "null", "-"],
                    capture_output=True, text=True).stderr
m = re.search(r"mean_volume:\s*(-?[\d.]+) dB", vd)
mean_db = float(m.group(1)) if m else -99.0

result = {"clip": name, "has_speech": False, "mean_db": round(mean_db, 1),
          "speakers": 0, "utterances": []}

if mean_db < FLOOR:
    json.dump(result, open(out_json, "w"), indent=1)
    print(json.dumps(result)); sys.exit(0)

key = find_key()
if not key:
    result["error"] = "no ASSEMBLYAI_API_KEY in .env"
    json.dump(result, open(out_json, "w"), indent=1)
    print(json.dumps(result)); sys.exit(0)

H = {"authorization": key}
def post(url, data, headers, raw=False):
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    return urllib.request.urlopen(req).read()

# upload raw bytes
up = json.loads(post("https://api.assemblyai.com/v2/upload", open(wav, "rb").read(),
                     {**H, "content-type": "application/octet-stream"}))
body = json.dumps({"audio_url": up["upload_url"],
                   "speech_models": ["universal-3-pro"],
                   "speaker_labels": True}).encode()
job = json.loads(post("https://api.assemblyai.com/v2/transcript", body,
                      {**H, "content-type": "application/json"}))
tid = job["id"]
for _ in range(120):
    time.sleep(3)
    st = json.loads(urllib.request.urlopen(
        urllib.request.Request(f"https://api.assemblyai.com/v2/transcript/{tid}",
                               headers=H)).read())
    if st["status"] == "completed":
        utt = st.get("utterances") or []
        result["has_speech"] = bool((st.get("text") or "").strip())
        result["speakers"] = len({u["speaker"] for u in utt}) if utt else (1 if result["has_speech"] else 0)
        result["utterances"] = [{"speaker": u["speaker"], "text": u["text"],
                                 "start": round(u["start"]/1000, 2),
                                 "end": round(u["end"]/1000, 2)} for u in utt]
        if not utt and result["has_speech"]:
            result["full_text"] = st["text"]
        break
    if st["status"] == "error":
        result["error"] = st.get("error", "aai error"); break

try: os.remove(wav)
except OSError: pass
json.dump(result, open(out_json, "w"), indent=1)
print(json.dumps({k: v for k, v in result.items() if k != "utterances"}))
