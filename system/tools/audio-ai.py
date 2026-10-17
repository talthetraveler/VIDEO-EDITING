#!/usr/bin/env python
"""AUDIO AI - open-source speech tools for Tal's footage, one entry point.

Tal, 2026-10-16: he wanted Adobe Podcast's "Enhance Speech", which has no API an
AI can drive, so these are the open-source equivalents, installed by
SETUP EVERYTHING.cmd into their own env (system/.venv-audio, GPU if present):

  enhance  <in> <out> [--denoise-only]   Resemble Enhance (Resemble AI, MIT).
           Removes noise AND rebuilds a muffled/thin voice - the closest thing
           to Adobe's Enhance Speech. --denoise-only = its noise stage alone.
           Full enhance REGENERATES the voice: on a measured street clip it
           dropped two words. Check captions against its output, by ear.
  clean    <in> <out>                    ClearerVoice MossFormer2_SE_48K (Alibaba,
           Apache-2.0). A second speech enhancer to compare against `enhance`.
  music    <in> <out>                    Demucs htdemucs (Meta, MIT). Keeps the
           voices, removes music/background bed (a shop radio, a street speaker).
  separate <in> <outdir>                 ClearerVoice MossFormer2_SS_16K. Splits two
           people talking over each other into two files. Only SIMULTANEOUS
           speech - turn-taking goes all into one file (use diarize.py for that).

Measurements and timings: skills/tal-video-editor/REPOS.md.

Run with the env's python:
  system/.venv-audio/Scripts/python system/tools/audio-ai.py enhance in.wav out.wav

THE LINE (CLAUDE.md 1 Audio): do NOT over-denoise. Street ambience is the proof
it is real. build-edit.mjs already runs DeepFilterNet gently on every render;
these are for a clip that needs more, chosen by listening, never stacked blind.
Models download from their makers on first use and are cached; nothing here is
pushed to GitHub.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def device():
    import torch
    return "cuda" if torch.cuda.is_available() else "cpu"


def load_mono(path):
    import torchaudio
    wav, sr = torchaudio.load(str(path))
    return wav.mean(dim=0), sr


def _stub_deepspeed():
    """resemble_enhance imports deepspeed at module level for TRAINING only
    (Engine, DeepSpeedConfig); inference never calls it, and deepspeed does not
    build on Windows. Register an empty stand-in so the import succeeds. Done
    here rather than by patching site-packages, so a fresh setup needs no edit."""
    import types
    if "deepspeed" in sys.modules:
        return
    try:
        import deepspeed  # noqa: F401  (a real install wins)
        return
    except ImportError:
        pass
    mods = {n: types.ModuleType(n) for n in ("deepspeed", "deepspeed.accelerator", "deepspeed.runtime",
                                             "deepspeed.runtime.engine", "deepspeed.runtime.utils")}
    def unavailable(*_a, **_k):
        raise RuntimeError("deepspeed is not installed - training is not supported here, inference only")
    mods["deepspeed"].DeepSpeedConfig = unavailable
    mods["deepspeed"].init_distributed = unavailable
    mods["deepspeed.accelerator"].get_accelerator = unavailable
    mods["deepspeed.runtime.engine"].DeepSpeedEngine = type("DeepSpeedEngine", (), {})
    mods["deepspeed.runtime.utils"].clip_grad_norm_ = unavailable
    sys.modules.update(mods)


def cmd_enhance(a):
    import torch
    import torchaudio
    _stub_deepspeed()
    if os.name == "nt":
        # the model's hparams.yaml was written on Linux and stores paths as
        # !!python/object/apply:pathlib.PosixPath, which cannot be built on Windows
        import pathlib
        pathlib.PosixPath = pathlib.WindowsPath
    from resemble_enhance.enhancer.download import REPO_DIR
    from resemble_enhance.enhancer.inference import denoise, enhance
    # its download() runs `git pull` on the 1.6 GB model repo on EVERY call
    # (~3 min each, measured). Once the weights are on disk, point at them.
    run_dir = REPO_DIR / "enhancer_stage2"
    run_dir = run_dir if (run_dir / "hparams.yaml").exists() else None
    dwav, sr = load_mono(a.inp)
    dev = device()
    if a.denoise_only:
        out, new_sr = denoise(dwav, sr, dev, run_dir=run_dir)
    else:
        # the same defaults as Resemble AI's own demo app: midpoint solver,
        # 64 steps, denoise-before-enhance on (lambd 0.9), prior temperature 0.5
        out, new_sr = enhance(dwav, sr, dev, nfe=64, solver="midpoint", lambd=0.9, tau=0.5, run_dir=run_dir)
    torchaudio.save(str(a.out), out.unsqueeze(0).cpu(), new_sr)
    print(f"enhance ({'denoise only' if a.denoise_only else 'full'}) on {dev}: {a.out}  ({new_sr} Hz)")


def _clearvoice(task, model, inp, out_path):
    from clearvoice import ClearVoice
    cv = ClearVoice(task=task, model_names=[model])
    result = cv(input_path=str(inp), online_write=False)
    cv.write(result, output_path=str(out_path))
    return result


def cmd_clean(a):
    _clearvoice("speech_enhancement", "MossFormer2_SE_48K", a.inp, a.out)
    print(f"clean (ClearerVoice MossFormer2_SE_48K): {a.out}")


def cmd_separate(a):
    outdir = Path(a.out)
    outdir.mkdir(parents=True, exist_ok=True)
    # given a FILE path it writes <name>_s1.wav and <name>_s2.wav beside it;
    # given an existing folder it refuses ("Directory exists") and writes nothing
    _clearvoice("speech_separation", "MossFormer2_SS_16K", a.inp, outdir / (Path(a.inp).stem + ".wav"))
    files = sorted(p.name for p in outdir.rglob("*.wav"))
    print(f"separate (ClearerVoice MossFormer2_SS_16K): {len(files)} file(s) in {outdir}: {', '.join(files)}")


def cmd_music(a):
    with tempfile.TemporaryDirectory() as td:
        r = subprocess.run([sys.executable, "-m", "demucs", "--two-stems", "vocals", "-n", "htdemucs",
                            "-d", device(), "-o", td, str(a.inp)], capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(f"demucs failed:\n{r.stderr[-1500:]}")
        voc = list(Path(td).rglob("vocals.wav"))
        if not voc:
            sys.exit("demucs ran but wrote no vocals.wav")
        shutil.copyfile(voc[0], a.out)
    print(f"music removed (Demucs htdemucs, voices kept): {a.out}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("enhance"); e.add_argument("inp"); e.add_argument("out"); e.add_argument("--denoise-only", action="store_true")
    for name in ("clean", "music"):
        p = sub.add_parser(name); p.add_argument("inp"); p.add_argument("out")
    s = sub.add_parser("separate"); s.add_argument("inp"); s.add_argument("out")
    a = ap.parse_args()
    if not Path(a.inp).exists():
        sys.exit(f"no such file: {a.inp}")
    {"enhance": cmd_enhance, "clean": cmd_clean, "music": cmd_music, "separate": cmd_separate}[a.cmd](a)


if __name__ == "__main__":
    main()
