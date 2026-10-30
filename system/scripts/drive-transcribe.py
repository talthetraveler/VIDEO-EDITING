#!/usr/bin/env python
"""Transcribe every video in a public Google Drive folder without keeping the videos.

python system/scripts/drive-transcribe.py <project-dir> [--limit N] [--workers 2]

Reads <project-dir>/files.json (from drive-walk.py). For each clip: reads it once over
HTTP, keeps the sound as a tiny temp file, transcribes it with Groq, grabs 3 low-res
frames, deletes the sound. One <id>.json + <id>.jpg per clip in <project-dir>/clips/,
so a stopped run resumes where it left off. Drive answers "Quota exceeded" for some
files for up to 24 hours: those are marked and tried again on the next run.
"""
import concurrent.futures as cf
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
import uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = "Mozilla/5.0"
VIDEO = (".mp4", ".mov", ".m4v")
MODEL = "whisper-large-v3"


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def groq_key():
    for line in open(os.path.join(ROOT, ".env"), encoding="utf8"):
        if line.startswith("GROQ_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"')
    raise SystemExit("GROQ_API_KEY missing from system/.env")


KEY = groq_key()
pause_until = [0.0]
lock = threading.Lock()


def url(fid):
    return "https://drive.usercontent.google.com/download?id=%s&export=download&confirm=t" % fid


def run(cmd, timeout=1800):
    return subprocess.run(cmd, capture_output=True, timeout=timeout)


def probe(u):
    p = run(["ffprobe", "-v", "error", "-user_agent", UA, "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", u], 120)
    if p.returncode:
        return None
    j = json.loads(p.stdout)
    v = next((s for s in j.get("streams", []) if s.get("codec_type") == "video"), {})
    return {"duration": float(j.get("format", {}).get("duration", 0) or 0), "width": v.get("width"), "height": v.get("height"),
            "has_audio": any(s.get("codec_type") == "audio" for s in j.get("streams", []))}


def transcribe(path):
    boundary = uuid.uuid4().hex
    parts = []
    for k, val in (("model", MODEL), ("response_format", "verbose_json"), ("temperature", "0")):
        parts.append(("--%s\r\nContent-Disposition: form-data; name=\"%s\"\r\n\r\n%s\r\n" % (boundary, k, val)).encode())
    head = "--%s\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.ogg\"\r\nContent-Type: audio/ogg\r\n\r\n" % boundary
    body = b"".join(parts) + head.encode() + open(path, "rb").read() + ("\r\n--%s--\r\n" % boundary).encode()
    for attempt in range(8):
        wait = pause_until[0] - time.time()
        if wait > 0:
            time.sleep(wait)
        req = urllib.request.Request("https://api.groq.com/openai/v1/audio/transcriptions", data=body, method="POST", headers={
            "Authorization": "Bearer " + KEY, "Content-Type": "multipart/form-data; boundary=" + boundary, "User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf8", "replace")[:300]
            if e.code == 429:
                m = re.search(r"try again in (?:(\d+)m)?([\d.]+)s", msg)
                secs = (int(m.group(1) or 0) * 60 + float(m.group(2)) + 2) if m else 60
                with lock:
                    pause_until[0] = max(pause_until[0], time.time() + secs)
                print("groq limit, waiting %ds" % secs, flush=True)
                continue
            raise RuntimeError("groq %s %s" % (e.code, msg))
        except Exception as e:
            print("groq retry", e, flush=True)
            time.sleep(5 * (attempt + 1))
    raise RuntimeError("groq gave up")


def frames(u, dur, out):
    times = [max(0.2, dur * t) for t in (0.1, 0.5, 0.9)]
    paths = []
    with tempfile.TemporaryDirectory() as d:
        for i, t in enumerate(times):
            p = os.path.join(d, "%d.jpg" % i)
            r = run(["ffmpeg", "-v", "error", "-y", "-user_agent", UA, "-ss", "%.2f" % t, "-i", u, "-frames:v", "1", "-vf", "scale=-2:240", p], 180)
            if r.returncode == 0 and os.path.exists(p):
                paths.append(p)
        if not paths:
            return False
        args = ["ffmpeg", "-v", "error", "-y"]
        for p in paths:
            args += ["-i", p]
        args += ["-filter_complex", "hstack=%d" % len(paths)] if len(paths) > 1 else []
        args += ["-frames:v", "1", out]
        return run(args, 60).returncode == 0


def process(f, clips):
    out = os.path.join(clips, f["id"] + ".json")
    if os.path.exists(out):
        old = json.load(open(out, encoding="utf8"))
        if old.get("state") == "done":
            return "cached"
    u = url(f["id"])
    info = probe(u)
    if info is None:
        json.dump({**f, "state": "blocked"}, open(out, "w", encoding="utf8"), ensure_ascii=False)
        return "blocked"
    rec = {**f, **info, "state": "done", "language": None, "text": "", "segments": []}
    if info["has_audio"]:
        fd, tmp = tempfile.mkstemp(suffix=".ogg")
        os.close(fd)
        try:
            r = run(["ffmpeg", "-v", "error", "-y", "-user_agent", UA, "-i", u, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libopus", "-b:a", "24k", tmp])
            if r.returncode:
                raise RuntimeError(r.stderr.decode("utf8", "replace")[:200])
            if os.path.getsize(tmp) > 1000:
                t = transcribe(tmp)
                rec["language"] = t.get("language")
                rec["text"] = (t.get("text") or "").strip()
                rec["segments"] = [{"start": round(s["start"], 2), "end": round(s["end"], 2), "text": s["text"].strip(),
                                    "no_speech": round(s.get("no_speech_prob", 0), 2), "logprob": round(s.get("avg_logprob", 0), 2)}
                                   for s in t.get("segments", [])]
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)
    frames(u, info["duration"], os.path.join(clips, f["id"] + ".jpg"))
    json.dump(rec, open(out, "w", encoding="utf8"), ensure_ascii=False)
    return "done"


def main():
    proj = sys.argv[1]
    clips = os.path.join(proj, "clips")
    os.makedirs(clips, exist_ok=True)
    files = [f for f in json.load(open(os.path.join(proj, "files.json"), encoding="utf8")) if f["name"].lower().endswith(VIDEO)]
    limit = int(arg("--limit", "0"))
    if limit:
        files = files[:limit]
    tally = {}
    t0 = time.time()
    with cf.ThreadPoolExecutor(int(arg("--workers", "2"))) as ex:
        jobs = {ex.submit(process, f, clips): f for f in files}
        for n, j in enumerate(cf.as_completed(jobs), 1):
            f = jobs[j]
            try:
                r = j.result()
            except Exception as e:
                r = "failed"
                print("FAILED", f["folder"], f["name"], str(e)[:200], flush=True)
            tally[r] = tally.get(r, 0) + 1
            if n % 5 == 0 or n == len(files):
                print("%d/%d %s %dmin" % (n, len(files), tally, (time.time() - t0) / 60), flush=True)
    print("FINISHED", tally, flush=True)


if __name__ == "__main__":
    main()
