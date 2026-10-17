#!/usr/bin/env python
"""SETUP EVERYTHING - one button that makes this repo work on a new computer.

Tal, 2026-10-16: "I think it should be one button for everything ... so if I
open this up on Codex or another AI, I can edit my videos."

  python system/setup/setup_everything.py           install anything missing, then test it all
  python system/setup/setup_everything.py --check   only test and report, install nothing

Double-clicking SETUP EVERYTHING.cmd at the repo root runs the first form.

Every step is safe to re-run: what already works is detected and skipped.
Programs come from their makers (PyPI, npm, PyTorch, GitHub releases, Hugging
Face); none of them are stored in the repo. Keys are not installed here:
system/.env and the ShortSync config are gitignored - ask Tal for them.
"""
import json
import os
import platform
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # repo root
SYS = ROOT / "system"
BIN = SYS / "bin"
AUDIO_ENV = SYS / ".venv-audio"
WIN = platform.system() == "Windows"
CHECK_ONLY = "--check" in sys.argv
RESULTS = []                                        # (name, ok, note)


def run(cmd, cwd=None, timeout=3600, quiet=True):
    r = subprocess.run(cmd, cwd=cwd, capture_output=quiet, text=True, timeout=timeout,
                       shell=isinstance(cmd, str))
    return r.returncode, ((r.stdout or "") + (r.stderr or "")) if quiet else ""


def have(exe):
    return shutil.which(exe) is not None


def step(name, test, install=None, note=""):
    """test() -> (ok, detail). If not ok and installing is allowed, install() then re-test."""
    ok, detail = test()
    if not ok and install and not CHECK_ONLY:
        print(f"  installing {name} ...", flush=True)
        try:
            install()
        except Exception as e:                      # keep going; the table reports it
            detail = f"install failed: {e}"
        ok, detail2 = test()
        detail = detail2 if ok else (detail2 or detail)
    RESULTS.append((name, ok, detail or note))
    print(f"  [{'OK ' if ok else '!! '}] {name}  {detail or ''}", flush=True)
    return ok


def audio_py():
    return str(AUDIO_ENV / ("Scripts/python.exe" if WIN else "bin/python"))


def download(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url) as r, open(dest, "wb") as f:
        shutil.copyfileobj(r, f)


def github_asset(repo, tag, pick):
    api = f"https://api.github.com/repos/{repo}/releases/{'tags/' + tag if tag else 'latest'}"
    with urllib.request.urlopen(api) as r:
        rel = json.load(r)
    for a in rel["assets"]:
        if pick(a["name"]):
            return a["browser_download_url"]
    raise RuntimeError(f"no matching asset in {repo} {tag or 'latest'}")


# ---------------------------------------------------------------- the steps
def basics():
    step("Python 3.10+", lambda: (sys.version_info >= (3, 10), platform.python_version()))
    step("Node 20+", lambda: (have("node") and int(run(["node", "-v"])[1].strip().lstrip("v").split(".")[0]) >= 20,
                              run(["node", "-v"])[1].strip() if have("node") else "missing - install Node 24 from nodejs.org"))
    step("git + git-lfs", lambda: (have("git") and run(["git", "lfs", "version"])[0] == 0,
                                   "" if have("git") else "missing - install Git for Windows"))

    def ff_install():
        if WIN:
            run(["winget", "install", "-e", "--id", "Gyan.FFmpeg", "--accept-source-agreements", "--accept-package-agreements"])
        else:
            raise RuntimeError("install ffmpeg with your package manager (brew install ffmpeg / apt install ffmpeg)")
    step("ffmpeg (full build)", lambda: (have("ffmpeg") and "drawtext" in run(["ffmpeg", "-hide_banner", "-filters"])[1],
                                        "" if have("ffmpeg") else "missing"), ff_install,
         note="restart the terminal after a fresh winget install so it is on PATH")


def node_packages():
    step("Node packages (Remotion etc.)",
         lambda: ((SYS / "node_modules" / "remotion").exists(), ""),
         lambda: run("npm install", cwd=SYS, quiet=False))


def python_tools():
    req = SYS / "setup" / "requirements-tools.txt"

    def test():
        missing = []
        for mod in ("whisperx", "faster_whisper", "pyannote.audio", "cv2", "PIL", "soundfile", "scenedetect", "bidi"):
            if run([sys.executable, "-c", f"import {mod}"])[0] != 0:
                missing.append(mod)
        return (not missing, "missing: " + ", ".join(missing) if missing else "WhisperX, pyannote, OpenCV, PySceneDetect ...")
    step("Python tools (WhisperX, pyannote, ...)", test,
         lambda: run([sys.executable, "-m", "pip", "install", "--user", "-r", str(req)], quiet=False))


def binaries():
    ext = ".exe" if WIN else ""
    df = BIN / f"deep-filter{ext}"

    def df_install():
        key = {"Windows": "windows-msvc.exe", "Darwin": ("aarch64-apple-darwin" if platform.machine() == "arm64" else "x86_64-apple-darwin"),
               "Linux": "x86_64-unknown-linux-musl"}[platform.system()]
        download(github_asset("Rikorose/DeepFilterNet", "v0.5.6", lambda n: n.startswith("deep-filter-0.5.6") and n.endswith(key)), df)
        if not WIN:
            df.chmod(0o755)
    step("DeepFilterNet 0.5.6 (everyday denoise)",
         lambda: (df.exists() and run([str(df), "--version"])[0] == 0, run([str(df), "--version"])[1].strip() if df.exists() else ""),
         df_install)

    yd = BIN / f"yt-dlp{ext}"

    def yd_install():
        name = "yt-dlp.exe" if WIN else ("yt-dlp_macos" if platform.system() == "Darwin" else "yt-dlp")
        download(github_asset("yt-dlp/yt-dlp", None, lambda n: n == name), yd)
        if not WIN:
            yd.chmod(0o755)
    step("yt-dlp (reference downloads)", lambda: (yd.exists(), ""), yd_install)


def audio_ai():
    py = audio_py()

    def env_install():
        run([sys.executable, "-m", "venv", str(AUDIO_ENV)])
        run([py, "-m", "pip", "install", "--upgrade", "pip"])
        gpu = have("nvidia-smi") and run(["nvidia-smi", "-L"])[0] == 0
        idx = "https://download.pytorch.org/whl/cu124" if gpu else "https://download.pytorch.org/whl/cpu"
        run([py, "-m", "pip", "install", "torch", "torchaudio", "--index-url", idx], quiet=False)
    step("Audio-AI env + PyTorch (GPU if present)",
         lambda: (Path(py).exists() and run([py, "-c", "import torch"])[0] == 0,
                  run([py, "-c", "import torch;print('torch',torch.__version__,'GPU' if torch.cuda.is_available() else 'CPU')"])[1].strip()
                  if Path(py).exists() else ""),
         env_install)

    # resemble-enhance's own requirements pin deepspeed (training only, does not
    # build on Windows) - so it is installed without them and its runtime needs are listed here
    def resemble_install():
        run([py, "-m", "pip", "install", "resemble-enhance", "--no-deps"], quiet=False)
        run([py, "-m", "pip", "install", "librosa", "omegaconf", "rich", "resampy", "tabulate", "tqdm",
             "numpy<2.3", "pandas", "matplotlib", "celluloid", "ptflops", "scipy", "soundfile"], quiet=False)
    step("Resemble Enhance (Resemble AI) - clean + restore voice",
         # importing it directly needs audio-ai.py's deepspeed stand-in; the self-test is the real proof
         lambda: (run([py, "-c", "import importlib.util as u; assert u.find_spec('resemble_enhance')"])[0] == 0, ""), resemble_install)

    step("Demucs (Meta) - remove music under speech",
         lambda: (run([py, "-c", "import demucs"])[0] == 0, ""),
         lambda: run([py, "-m", "pip", "install", "demucs"], quiet=False))

    step("ClearerVoice-Studio (Alibaba) - split overlapping speakers",
         lambda: (run([py, "-c", "from clearvoice import ClearVoice"])[0] == 0, ""),
         lambda: run([py, "-m", "pip", "install", "clearvoice"], quiet=False))


def self_test():
    """Run every audio tool on a real 3-second clip of speech made on the spot."""
    py = audio_py()
    if not Path(py).exists():
        return
    tmp = SYS / "setup" / "_selftest"
    tmp.mkdir(exist_ok=True)
    src = tmp / "speech.wav"
    # a spoken sentence: Windows SAPI voice, macOS `say`, else a tone (still proves the tools run)
    if WIN:
        ps = ("Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; "
              f"$s.SetOutputToWaveFile('{src}'); $s.Speak('Testing the audio tools for Tal the traveler.'); $s.Dispose()")
        run(["powershell", "-NoProfile", "-Command", ps])
    elif have("say"):
        run(["say", "-o", str(src), "--data-format=LEI16@22050", "Testing the audio tools."])
    if not src.exists():
        run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=440:d=3", str(src)])
    noisy = tmp / "noisy.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-f", "lavfi", "-i", "anoisesrc=d=4:c=pink:a=0.05",
         "-filter_complex", "[0][1]amix=inputs=2:duration=first", "-ac", "1", "-ar", "44100", str(noisy)])
    tool = str(SYS / "tools" / "audio-ai.py")
    # enhance runs --denoise-only here: same model load, ~5 s. Full enhance took
    # 10 min on this 4 s clip in one measured run - too slow for a setup check.
    for name, args in [("enhance", ["enhance", "--denoise-only", str(noisy), str(tmp / "enhance.wav")]),
                       ("clean", ["clean", str(noisy), str(tmp / "clean.wav")]),
                       ("music", ["music", str(noisy), str(tmp / "music.wav")]),
                       ("separate", ["separate", str(noisy), str(tmp / "separate")])]:
        code, out = run([py, tool] + args, timeout=1800)
        lines = [l for l in out.strip().splitlines() if l.strip() and "%|" not in l and "warn" not in l.lower()]
        last = (lines or [""])[-1][:110]
        RESULTS.append((f"self-test: audio-ai {name}", code == 0, last))
        print(f"  [{'OK ' if code == 0 else '!! '}] self-test {name}  {last}", flush=True)
    shutil.rmtree(tmp, ignore_errors=True)          # nothing kept local


def main():
    print(f"SETUP EVERYTHING  ({'check only' if CHECK_ONLY else 'install + test'})  repo: {ROOT}\n", flush=True)
    for part in (basics, node_packages, python_tools, binaries, audio_ai):
        part()
    self_test()
    print("\n" + "-" * 78)
    bad = [r for r in RESULTS if not r[1]]
    for name, ok, note in RESULTS:
        print(f"{'OK ' if ok else 'XX '} {name:<52} {note[:60] if note else ''}")
    print("-" * 78)
    print("Keys (not installed by this script): system/.env  (GROQ_API_KEY, HF_TOKEN) - ask Tal.")
    print(f"{len(RESULTS) - len(bad)}/{len(RESULTS)} working." + ("" if not bad else "  Fix the XX lines above, then run this again."))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
