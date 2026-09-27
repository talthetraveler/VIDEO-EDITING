#!/usr/bin/env python
"""ARE THE CAPTIONS ON SCREEN WHILE HE IS ACTUALLY SPEAKING?

Tal, 2026-09-23: *"check this out, every video, that it makes sense and the
captions are actually appearing when I speak."*

Reading captions back as English proves the WORDS are right. It says nothing
about WHEN they appear. This measures that, against the finished file's own
audio — not against the transcript, not against the edit JSON, both of which
are what produced the timings in the first place.

METHOD
  1. Decode the rendered mp4's audio to a 100 Hz loudness envelope.
  2. Speech = envelope above (median + a margin), held through short dips so a
     pause inside a sentence does not split it into two regions.
  3. For every caption in BUILD-LOG.json, measure:
       - ONSET ERROR: distance from the caption's start to the nearest speech
         onset. Negative = the caption arrived early, positive = late.
       - OVER SILENCE: the fraction of the caption's life with no speech under
         it.
  4. Report the film's median and worst onset error, and any caption that sits
     over silence for most of its life.

WHAT THE NUMBERS MEAN, measured on this footage: a caption that starts within
±0.35s of the onset reads as "on the word". Beyond ~0.8s it is visibly adrift.
A caption over 70% silence is on the wrong shot or the wrong moment entirely.

    python scripts/caption-sync.py <slug> [...]        # named projects
    python scripts/caption-sync.py --all
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

ROOT = Path(r"C:/Users/taldo/Downloads/videos to edit/system")
ENV_SR = 100


def envelope(path, sr=8000):
    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-i", str(path), "-f", "s16le", "-acodec",
         "pcm_s16le", "-ac", "1", "-ar", str(sr), "-"],
        capture_output=True).stdout
    if not raw:
        return None
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    hop = sr // ENV_SR
    n = len(a) // hop
    if n < 10:
        return None
    return np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)


def speech_mask(env, hold=0.30):
    """True where someone is speaking. The threshold is relative: street noise
    sets the floor, and an absolute dB gate would call a loud market silent."""
    db = 20 * np.log10(env + 1e-9)
    floor = np.percentile(db, 20)
    peak = np.percentile(db, 95)
    thr = floor + (peak - floor) * 0.35
    m = db > thr
    # close gaps shorter than `hold` so a breath does not end a sentence
    k = int(hold * ENV_SR)
    if k > 1:
        idx = np.flatnonzero(m)
        if idx.size:
            for a, b in zip(idx[:-1], idx[1:]):
                if 1 < b - a <= k:
                    m[a:b] = True
    return m


def onsets(mask):
    d = np.diff(mask.astype(np.int8))
    return (np.flatnonzero(d == 1) + 1) / ENV_SR


def check(slug):
    d = ROOT / "projects" / slug
    log = d / "BUILD-LOG.json"
    if not log.exists():
        return None
    try:
        cfg = json.loads((d / "edit.json").read_text(encoding="utf-8"))
        out = cfg.get("out")
        caps = json.loads(log.read_text(encoding="utf-8")).get("captions", [])
    except Exception:
        return None
    if not out or not (d / out).exists() or not caps:
        return None

    env = envelope(d / out)
    if env is None:
        return None
    m = speech_mask(env)
    ons = onsets(m)
    if not len(ons):
        return None

    # TIMELINE FROM THE RENDERED SEGMENTS, NOT FROM edit.json.
    #
    # The first version of this summed `b[2]-b[1]` out of the edit JSON and
    # reported every film as badly out of sync. That was the INSTRUMENT being
    # wrong: `snapBoundaries` moves each beat's in/out to protect word tails,
    # so a rendered beat is routinely 0.3-1.2s longer than its JSON span, and
    # the error compounds across the film. A measurement that condemns
    # everything is usually measuring the wrong thing — check it before acting.
    #
    # The beats_* folder holds what was actually concatenated. Use those.
    beat_dirs = sorted(d.glob("beats_*"), key=lambda p: p.stat().st_mtime)
    if not beat_dirs:
        return None
    segs = sorted(beat_dirs[-1].glob("*.mp4"))
    if not segs:
        return None
    starts, acc = {}, 0.0
    for f in segs:
        dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                              "format=duration", "-of", "csv=p=0", str(f)],
                             capture_output=True, text=True).stdout.strip()
        try:
            dur = float(dur)
        except ValueError:
            return None
        starts[f.stem] = acc          # "01", "02", ... matching BUILD-LOG beat
        acc += dur

    errs, silent = [], []
    for c in caps:
        base = starts.get(str(c.get("beat")), None)
        if base is None:
            continue
        t = base + float(c.get("at", 0))
        j = int(np.argmin(np.abs(ons - t)))
        errs.append(t - ons[j])
        a = int(max(0, t) * ENV_SR)
        b = min(len(m), a + int(1.2 * ENV_SR))
        if b > a:
            sil = 1.0 - m[a:b].mean()
            if sil > 0.70:
                silent.append((round(t, 1), c.get("text", "")[:34], round(sil, 2)))
    if not errs:
        return None
    e = np.abs(np.array(errs))
    return {
        "slug": slug, "n": len(errs),
        "median": round(float(np.median(e)), 2),
        "p90": round(float(np.percentile(e, 90)), 2),
        "on_word": round(float((e <= 0.35).mean() * 100)),
        "adrift": int((e > 0.8).sum()),
        "over_silence": silent[:4],
    }


def main():
    args = sys.argv[1:]
    slugs = ([p.name for p in sorted((ROOT / "projects").iterdir())
              if p.is_dir() and not p.name.startswith("_")]
             if "--all" in args else [a for a in args if not a.startswith("--")])
    rows = [r for r in (check(s) for s in slugs) if r]
    rows.sort(key=lambda r: -r["median"])
    print(f"\n{'film':26} {'caps':>5} {'median':>7} {'p90':>6} {'on-word':>8} {'adrift':>7}")
    for r in rows:
        flag = "  <-- CHECK" if r["median"] > 0.5 or r["on_word"] < 55 else ""
        print(f"{r['slug']:26} {r['n']:>5} {r['median']:>7.2f} {r['p90']:>6.2f} "
              f"{r['on_word']:>7}% {r['adrift']:>7}{flag}")
        for t, txt, sil in r["over_silence"]:
            print(f"       {t:>6}s  over {int(sil*100)}% silence:  {txt!r}")
    print("\nmedian/p90 = seconds between a caption's start and the nearest speech onset.")
    print("on-word = share within 0.35s. adrift = captions more than 0.8s out.")


if __name__ == "__main__":
    main()
