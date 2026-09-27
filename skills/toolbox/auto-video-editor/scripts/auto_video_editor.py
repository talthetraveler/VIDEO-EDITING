#!/usr/bin/env python3
"""
Auto Video Editor
=================
Removes, from a talking-head video:
  1) filler words                  -> um, uh, you know, etc. (see FILLERS)
  2) silences / long pauses        -> any gap longer than MAX_PAUSE

Every take is kept, in full and in order — nothing is deduplicated.

Two ways to run
---------------
  # Process one file (great for checking quality):
  python3 auto_video_editor.py --file "/path/to/clip.mov"

  # Watch your Dropbox folder forever (the hands-off mode):
  python3 auto_video_editor.py --watch

In --watch mode it looks at INCOMING_DIR, edits anything new, writes the
finished cut to COMPLETED_DIR, and moves the original into ORIGINALS_DIR.
Because those folders live inside your Dropbox, uploading from your phone and
downloading the result "just works" — no Dropbox API, no tokens.

Everything you'd want to tune is in the CONFIG block right below.
"""

import argparse
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime

# ============================ CONFIG ============================
# ---- Dropbox folders ------------------------------------------
# By default this AUTO-DETECTS where Dropbox lives on your Mac and puts the
# working folders under  <Dropbox>/AutoVideoEditor/ . You normally don't need
# to touch this. To force a specific location, just set DROPBOX_BASE yourself,
# e.g.  DROPBOX_BASE = "/Users/you/Dropbox"
HOME = os.path.expanduser("~")


def _detect_dropbox_base():
    import json
    # Most reliable: the Dropbox app writes its real path here.
    info = os.path.join(HOME, ".dropbox", "info.json")
    try:
        data = json.load(open(info))
        for k in ("personal", "business"):
            p = data.get(k, {}).get("path")
            if p and os.path.isdir(p):
                return p
    except Exception:
        pass
    # Fallbacks for common install locations.
    for c in (os.path.join(HOME, "Dropbox"),
              os.path.join(HOME, "Library", "CloudStorage", "Dropbox")):
        if os.path.isdir(c):
            return c
    return os.path.join(HOME, "Dropbox")  # will be created if needed


DROPBOX_BASE  = _detect_dropbox_base()
INCOMING_DIR  = os.path.join(DROPBOX_BASE, "AutoVideoEditor", "1_Incoming")
COMPLETED_DIR = os.path.join(DROPBOX_BASE, "AutoVideoEditor", "2_Completed")
ORIGINALS_DIR = os.path.join(DROPBOX_BASE, "AutoVideoEditor", "3_Originals")
LOG_DIR       = os.path.join(DROPBOX_BASE, "AutoVideoEditor", "logs")

# ---- Editing behavior -----------------------------------------
MAX_PAUSE      = 0.40   # seconds; a gap between kept words longer than this is cut
MARGIN         = 0.06   # seconds of breathing room kept around each speech chunk
MIN_SEGMENT    = 0.08   # drop resulting chunks shorter than this (clicks/artifacts)

# Filler words/phrases to remove. Delete any you'd rather keep.
# (Multi-word entries like "you know" are matched as a unit.)
FILLERS = [
    "um", "uh", "uhh", "umm", "erm", "hmm", "mm", "mhm", "uh-huh",
    "like", "you know", "i mean", "kind of", "sort of", "so",
    "basically", "literally", "actually", "right",
]

# ---- Transcription --------------------------------------------
# "small.en" is the sweet spot for speed/quality on Apple Silicon.
# Bump to "medium.en" for a bit more accuracy (slower, larger download).
WHISPER_MODEL   = "small.en"
COMPUTE_TYPE    = "int8"   # int8 = fast + low memory on M-series
# Voice-activity detection. Keep this True: without it Whisper stretches a
# word's end-time across the pause that follows it, which hides the silences
# we are trying to cut. With it, real gaps show up and get removed.
USE_VAD         = True
VIDEO_EXTS      = {".mov", ".mp4", ".m4v", ".mkv", ".avi", ".webm"}

# ---- Output encoding ------------------------------------------
VIDEO_CODEC = ["-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-pix_fmt", "yuv420p"]
AUDIO_CODEC = ["-c:a", "aac", "-b:a", "192k"]
# ===============================================================


def log(msg, logfile=None):
    line = f"[{datetime.now().strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    if logfile:
        with open(logfile, "a") as f:
            f.write(line + "\n")


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


# ---------------------- transcription --------------------------
def transcribe(video_path):
    """Return list of words: [{'word','start','end','norm'}, ...]."""
    from faster_whisper import WhisperModel

    wav = video_path + ".tmp.wav"
    run(["ffmpeg", "-y", "-i", video_path, "-vn", "-ac", "1", "-ar", "16000",
         wav, "-loglevel", "error"])

    model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type=COMPUTE_TYPE)
    segments, _ = model.transcribe(wav, word_timestamps=True, vad_filter=USE_VAD)

    words = []
    for seg in segments:
        if not seg.words:
            continue
        for w in seg.words:
            words.append({
                "word": w.word,
                "start": float(w.start),
                "end": float(w.end),
                "norm": normalize(w.word),
            })
    try:
        os.remove(wav)
    except OSError:
        pass
    return words


def normalize(token):
    return re.sub(r"[^a-z0-9]", "", token.lower())


# ---------------------- filler removal -------------------------
def remove_fillers(words):
    filler_seqs = [tuple(normalize(t) for t in f.split()) for f in FILLERS]
    filler_seqs.sort(key=len, reverse=True)  # match longest first
    kept, removed = [], []
    i = 0
    while i < len(words):
        matched = False
        for seq in filler_seqs:
            L = len(seq)
            chunk = tuple(words[j]["norm"] for j in range(i, min(i + L, len(words))))
            if chunk == seq:
                removed.extend(words[i:i + L])
                i += L
                matched = True
                break
        if not matched:
            kept.append(words[i])
            i += 1
    return kept, removed


# ---------------------- timeline build -------------------------
def words_to_segments(kept_words, total_duration):
    """Merge kept words into speech chunks; gaps > MAX_PAUSE are dropped."""
    if not kept_words:
        return []
    kept_words = sorted(kept_words, key=lambda w: w["start"])
    segs = []
    cur_s = kept_words[0]["start"]
    cur_e = kept_words[0]["end"]
    for w in kept_words[1:]:
        if w["start"] - cur_e <= MAX_PAUSE:
            cur_e = max(cur_e, w["end"])
        else:
            segs.append([cur_s, cur_e])
            cur_s, cur_e = w["start"], w["end"]
    segs.append([cur_s, cur_e])

    # add margin, clamp, drop tiny bits, merge overlaps
    out = []
    for s, e in segs:
        s = max(0.0, s - MARGIN)
        e = min(total_duration, e + MARGIN)
        if e - s < MIN_SEGMENT:
            continue
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out


def get_duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path])
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


def render(video_path, segments, out_path):
    """Keep only `segments` and concat them in one encode pass."""
    expr = "+".join(f"between(t,{s:.3f},{e:.3f})" for s, e in segments)
    vf = f"select='{expr}',setpts=N/FRAME_RATE/TB"
    af = f"aselect='{expr}',asetpts=N/SR/TB"
    cmd = ["ffmpeg", "-y", "-i", video_path,
           "-vf", vf, "-af", af,
           *VIDEO_CODEC, *AUDIO_CODEC,
           "-movflags", "+faststart", out_path, "-loglevel", "error"]
    return run(cmd)


# ---------------------- the pipeline ---------------------------
def process(video_path, out_path, logfile=None):
    name = os.path.basename(video_path)
    log(f"Processing: {name}", logfile)
    total = get_duration(video_path)
    if total <= 0:
        log("  ! Could not read duration; skipping.", logfile)
        return False

    words = transcribe(video_path)
    log(f"  transcribed {len(words)} words", logfile)

    if not words:
        log("  no speech detected — copying through untouched.", logfile)
        shutil.copy2(video_path, out_path)
        return True

    kept_words, filler_removed = remove_fillers(words)
    segments = words_to_segments(kept_words, total)

    if not segments:
        log("  everything got cut (check thresholds) — copying through.", logfile)
        shutil.copy2(video_path, out_path)
        return True

    r = render(video_path, segments, out_path)
    if r.returncode != 0:
        log(f"  ! ffmpeg error: {r.stderr[:400]}", logfile)
        return False

    new_dur = get_duration(out_path)
    log(f"  fillers removed : {len(filler_removed)}", logfile)
    log(f"  kept {len(segments)} speech chunks", logfile)
    log(f"  length {total:.1f}s -> {new_dur:.1f}s "
        f"({100*(1-new_dur/total):.0f}% shorter)", logfile)
    if filler_removed:
        sample = " ".join(w["word"].strip() for w in filler_removed[:12])
        log(f"  e.g. fillers: {sample}", logfile)
    return True


# ---------------------- run modes ------------------------------
def process_one(path):
    if not os.path.isfile(path):
        sys.exit(f"No such file: {path}")
    base, ext = os.path.splitext(path)
    out = base + "_edited.mp4"
    ok = process(path, out)
    if ok:
        log(f"Done -> {out}")


def stable_size(path, checks=2, wait=2.0):
    """True once the file stops growing (finished syncing/copying)."""
    last = -1
    for _ in range(checks):
        try:
            sz = os.path.getsize(path)
        except OSError:
            return False
        if sz != last:
            last = sz
            time.sleep(wait)
        else:
            return True
    return os.path.getsize(path) == last


def watch():
    for d in (INCOMING_DIR, COMPLETED_DIR, ORIGINALS_DIR, LOG_DIR):
        os.makedirs(d, exist_ok=True)
    log(f"Watching: {INCOMING_DIR}")
    log(f"Output  : {COMPLETED_DIR}")
    log("Drop a video in the Incoming folder. Ctrl-C to stop.")
    seen = set()
    warned_empty = set()
    while True:
        try:
            for name in sorted(os.listdir(INCOMING_DIR)):
                if name.startswith(".") or name in seen:
                    continue
                src = os.path.join(INCOMING_DIR, name)
                if not os.path.isfile(src):
                    continue
                if os.path.splitext(name)[1].lower() not in VIDEO_EXTS:
                    continue
                # A Dropbox "online-only" file is a 0-byte placeholder until it
                # downloads. Skip it WITHOUT marking it seen, so it gets picked
                # up once the real bytes land. Marking it seen here would strand
                # it until the next restart.
                try:
                    if os.path.getsize(src) == 0:
                        if name not in warned_empty:
                            warned_empty.add(name)
                            log(f"  {name} is still downloading from Dropbox "
                                f"(0 bytes) — waiting. If it never fills in, "
                                f"right-click the folder in Finder and choose "
                                f"'Make Available Offline'.")
                        continue
                except OSError:
                    continue
                if not stable_size(src):
                    continue  # still uploading; try again next loop
                seen.add(name)
                stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                logfile = os.path.join(LOG_DIR, f"{stamp}_{name}.log")
                out = os.path.join(COMPLETED_DIR,
                                   os.path.splitext(name)[0] + "_edited.mp4")
                try:
                    ok = process(src, out, logfile)
                    if ok:
                        shutil.move(src, os.path.join(ORIGINALS_DIR, name))
                        log(f"  moved original -> 3_Originals/{name}", logfile)
                except Exception as e:  # noqa
                    log(f"  ! failed: {e}", logfile)
            time.sleep(5)
        except KeyboardInterrupt:
            log("Stopped.")
            break


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Auto video editor (fillers/silence).")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--file", help="process a single video file")
    g.add_argument("--watch", action="store_true", help="watch the Dropbox Incoming folder")
    args = ap.parse_args()
    if args.file:
        process_one(args.file)
    else:
        watch()
