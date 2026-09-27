"""Footage intelligence — PREP a drop for the per-clip agent fan-out.

Deterministic batch (no LLM): for every clip in the drop, produce the evidence the
analysis agents will read:
  • faces-catalog.json   (who is present, by InsightFace embedding match)  -- run separately
  • <clip>.sheet.jpg     (6-frame contact sheet for Claude vision)
  • <clip>.speech.json   (energy-gated diarized transcript, or has_speech=false)
Then emit work/manifest.json: one task record per clip the workflow iterates.

Generic across your Claude Code project — pass any drop dir. Faces step is OPTIONAL (skip with
--no-faces if the drop has no known reference people yet).

Usage:
    python prep_drop.py <footage_dir> <work_dir> [--frames N] [--speech-floor DB]
"""
import sys, os, json, glob, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
FOOT = sys.argv[1]
WORK = sys.argv[2]
FRAMES = "6"; FLOOR = "-40"
if "--frames" in sys.argv: FRAMES = sys.argv[sys.argv.index("--frames") + 1]
if "--speech-floor" in sys.argv: FLOOR = sys.argv[sys.argv.index("--speech-floor") + 1]
os.makedirs(WORK, exist_ok=True)

# accept common video extensions
exts = ("*.mov", "*.mp4", "*.m4v", "*.avi", "*.mkv")
clips = sorted(sum([glob.glob(os.path.join(FOOT, e)) for e in exts], []))
print(f"prep: {len(clips)} clips in {FOOT}", flush=True)

faces = {}
fc = os.path.join(os.path.dirname(FOOT.rstrip("/\\")), "faces-catalog.json")
fc2 = os.path.join(FOOT, "faces-catalog.json")
for cand in (fc, fc2, os.path.join(WORK, "faces-catalog.json")):
    if os.path.exists(cand):
        faces = json.load(open(cand)); print(f"  loaded faces from {cand}", flush=True); break

def run(script, *args):
    return subprocess.run(["python", os.path.join(HERE, script), *args],
                          capture_output=True, text=True)

manifest = []
for i, p in enumerate(clips):
    name = os.path.splitext(os.path.basename(p))[0]
    sheet_out = run("sample_frames.py", p, WORK, FRAMES)
    try:
        meta = json.loads(sheet_out.stdout.strip().splitlines()[-1])
    except Exception:
        meta = {"clip": name, "sheet": None, "dur": 0, "w": 0, "h": 0,
                "fps": 0, "has_audio": False}
    speech_json = os.path.join(WORK, f"{name}.speech.json")
    if meta.get("has_audio"):
        run("clip_speech.py", p, speech_json, FLOOR)
    else:
        json.dump({"clip": name, "has_speech": False, "mean_db": -99,
                   "speakers": 0, "utterances": []}, open(speech_json, "w"))
    rec = {"clip": name, "path": p, "sheet": meta.get("sheet"),
           "speech_json": speech_json, "dur": meta.get("dur"),
           "w": meta.get("w"), "h": meta.get("h"), "fps": meta.get("fps"),
           "orientation": "portrait" if meta.get("h", 0) > meta.get("w", 0) else "landscape",
           "faces": faces.get(name, {}).get("people", []),
           "face_scores": faces.get(name, {}).get("scores", {}),
           "is_interview": faces.get(name, {}).get("is_interview", False)}
    manifest.append(rec)
    if i % 10 == 0: print(f"  prepped {i+1}/{len(clips)}", flush=True)

json.dump(manifest, open(os.path.join(WORK, "manifest.json"), "w"), indent=1)
print(f"PREP-COMPLETE -> {os.path.join(WORK, 'manifest.json')} ({len(manifest)} clips)", flush=True)
