#!/usr/bin/env python
"""WHO IS TALKING — speaker diarization for Tal's footage.

Groq gives text with no speaker labels. On this footage that is a real defect,
not a nicety: every clip is Tal plus a stranger, and without labels a caption
cannot be attributed, the stranger's best line cannot be found automatically,
and "is the speaker on screen" has no ground truth to check against.

pyannote/speaker-diarization-community-1, run LOCALLY. No per-minute cost.
Tal supplied the HuggingFace token on 2026-09-22 and accepted the model's
user conditions (company: talthetraveler, use case: media/dubbing).

    python scripts/diarize.py <clip-id|path> [more...]
    python scripts/diarize.py --folder gaza-guy        # every clip in an index
    python scripts/diarize.py --all                    # every cached transcript

Writes projects/_frameio/cache/diarize/<id>.json and never re-does a clip
whose result is newer than its audio (CLAUDE.md 1 Cost).

TWO TRAPS ALREADY PAID FOR, do not re-derive:
  1. torchaudio on this machine has NO decode backend (torchcodec is not
     installed correctly). torchaudio.load() raises "Couldn't find appropriate
     backend". Audio is decoded with ffmpeg to raw PCM and handed to pyannote
     as an in-memory {'waveform','sample_rate'} dict, which its own warning
     recommends anyway.
  2. pyannote 4.x renamed `use_auth_token` to `token`, and
     Pipeline.from_pretrained('pyannote/speaker-diarization-3.1') silently
     REDIRECTS to 'pyannote/speaker-diarization-community-1' — a different
     gated repo. Being granted 3.1 and segmentation-3.0 is not enough; the
     403 comes from community-1 and names a file, not the repo, in its
     first line.
"""
import json, os, subprocess, sys, time
from pathlib import Path

ROOT = Path(r"C:/Users/taldo/Downloads/videos to edit/system")
CACHE = ROOT / "projects/_frameio/cache"
AUDIO, OUT, TRANS = CACHE / "audio", CACHE / "diarize", CACHE / "transcripts"
OUT.mkdir(parents=True, exist_ok=True)

for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

TOKEN = os.environ.get("HF_TOKEN")
if not TOKEN:
    sys.exit("HF_TOKEN missing from .env")


def load_pcm(path, sr=16000):
    """ffmpeg -> mono float32 tensor. See trap 1 in the docstring."""
    import numpy as np, torch
    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-i", str(path), "-f", "s16le",
         "-acodec", "pcm_s16le", "-ac", "1", "-ar", str(sr), "-"],
        capture_output=True).stdout
    if not raw:
        return None, sr
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return torch.from_numpy(a.copy()).unsqueeze(0), sr


def targets(argv):
    if "--all" in argv:
        return [p.stem for p in sorted(AUDIO.glob("*.flac"))]
    if "--folder" in argv:
        idx = json.loads((CACHE / "index" / (argv[argv.index("--folder") + 1] + ".json")).read_text(encoding="utf-8"))
        return [f["id"] for f in idx["files"]]
    return [a for a in argv[1:] if not a.startswith("--")]


def main():
    ids = targets(sys.argv)
    if not ids:
        sys.exit(__doc__)
    force = "--force" in sys.argv

    from pyannote.audio import Pipeline
    print(f"loading pyannote/speaker-diarization-community-1 …", flush=True)
    pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-community-1", token=TOKEN)

    done = skipped = failed = 0
    t0 = time.time()
    for cid in ids:
        wav = AUDIO / f"{cid}.flac"
        dest = OUT / f"{cid}.json"
        if not wav.exists():
            print(f"  no audio: {cid}"); failed += 1; continue
        if dest.exists() and not force and dest.stat().st_mtime >= wav.stat().st_mtime:
            skipped += 1; continue

        name = cid
        tp = TRANS / f"{cid}.json"
        if tp.exists():
            try: name = json.loads(tp.read_text(encoding="utf-8")).get("name", cid)
            except Exception: pass

        w, sr = load_pcm(wav)
        if w is None:
            print(f"  no decodable audio: {name}"); failed += 1; continue
        t = time.time()
        try:
            res = pipe({"waveform": w, "sample_rate": sr})
        except Exception as e:
            print(f"  FAILED {name}: {type(e).__name__} {str(e)[:70]}"); failed += 1; continue
        ann = getattr(res, "speaker_diarization", res)

        turns = [{"start": round(s.start, 2), "end": round(s.end, 2), "speaker": spk}
                 for s, _, spk in ann.itertracks(yield_label=True)]
        spk = sorted({t_["speaker"] for t_ in turns})
        talk = {s: round(sum(x["end"] - x["start"] for x in turns if x["speaker"] == s), 1) for s in spk}
        dest.write_text(json.dumps({
            "id": cid, "name": name, "duration": round(w.shape[1] / sr, 2),
            "speakers": len(spk), "talk_time": talk, "turns": turns,
            "model": "pyannote/speaker-diarization-community-1",
            "diarized_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }, indent=2), encoding="utf-8")
        done += 1
        print(f"  {name}  {len(spk)} speaker(s), {len(turns)} turns  "
              f"{talk}  ({time.time()-t:.1f}s)", flush=True)

    el = time.time() - t0
    print(f"\ndiarized {done}, cached {skipped}, failed {failed} in {el/60:.1f} min -> {OUT}")


if __name__ == "__main__":
    main()
