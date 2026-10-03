#!/usr/bin/env python
"""ARE THE CAPTIONS ON SCREEN WHILE HE IS ACTUALLY SPEAKING?

Tal, 2026-09-23 and again 2026-09-24: *"make sure when I speak then the
captions show up."*

Measured against the FINISHED FILE'S OWN AUDIO — not the transcript, not the
edit JSON, both of which are what produced the timings in the first place.

WHY v1 WAS WRONG (it condemned all 25 films, including one Tal had approved)
  v1 scored every caption by its distance to the nearest SPEECH ONSET. But an
  onset is the start of an utterance, and most captions do not start one —
  they replace the previous caption 1-3 words into continuous speech, where by
  definition there is no onset nearby. v1 therefore marked correct captions
  "adrift" for the crime of appearing mid-sentence. `call-spread-love`, which
  Tal reviewed and called clean, scored 56% by that measure.

  A measurement that fails everything is usually measuring the wrong thing.

WHAT IS ACTUALLY MEASURABLE HERE
  Most of this footage is Hebrew and Arabic, and the captions are ENGLISH
  TRANSLATIONS. So caption text cannot be matched to the spoken words — there
  is no word-level ground truth to align against. What can be measured:

  1. COVERAGE — the fraction of a caption's on-screen life that has speech
     under it. This is the real answer to "does it show up when I speak".
     A caption over silence is on the wrong shot or the wrong moment.
  2. ONSET ERROR, for utterance-OPENING captions only — a caption whose start
     follows >=0.3s of silence should land on the word that breaks it. These
     are the ones a viewer notices, and the only ones where an onset exists.
  3. TAIL — a caption still on screen well after the speech stopped.

THRESHOLDS, measured on this footage
  coverage >= 0.75 reads as "on the words". Below 0.50 is visibly wrong.
  An opening caption within +-0.35s of its onset reads as on the word;
  beyond 0.8s is visibly adrift.

    python scripts/caption-sync.py <slug> [...]
    python scripts/caption-sync.py --all
    python scripts/caption-sync.py --all --verbose     # list every bad caption

v1 is kept as scripts/caption-sync-v1.py.
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

ROOT = Path(r"C:/Users/taldo/Downloads/videos to edit/system")
ENV_SR = 100
SRT_DIR = None   # set by --srt <dir>: also write each film's captions as SRT,
                 # so an INDEPENDENT synchroniser (AutoSubSync/ffsubsync) can
                 # be run against the same timeline as a second opinion.


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
    segs = sorted(beat_dirs[-1].glob("*.mp4")) if beat_dirs else []
    starts, durs, acc = {}, {}, 0.0
    if not segs:
        # NO beats_* FOLDER (2026-10-03): the ek- batch deletes it after every
        # build to save disk, and this check then skipped 44 of 47 films
        # without a word. BUILD-LOG's own beats are what was rendered, so use
        # (out-in)/speed - but ONLY when they add up to the finished file.
        # A film whose beats were snapped or retimed does not add up, and is
        # reported as not measurable instead of measured on a wrong timeline.
        try:
            beats = json.loads(log.read_text(encoding="utf-8")).get("beats", [])
            real = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                         "-of", "csv=p=0", str(d / out)], capture_output=True, text=True).stdout.strip())
        except Exception:
            return None
        for i, b in enumerate(beats, 1):
            push = b[6] if len(b) > 6 and isinstance(b[6], dict) else {}
            dur = (float(b[2]) - float(b[1])) / float(push.get("speed", 1) or 1)
            key = f"{i:02d}"
            starts[key] = acc
            durs[key] = dur
            acc += dur
        if not beats or abs(acc - real) > 0.25:
            print(f"{slug:28s} NOT MEASURABLE: no beats_* folder, and BUILD-LOG beats sum to {acc:.2f}s against a {real:.2f}s file")
            return None
    for f in segs:
        dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                              "format=duration", "-of", "csv=p=0", str(f)],
                             capture_output=True, text=True).stdout.strip()
        try:
            dur = float(dur)
        except ValueError:
            return None
        starts[f.stem] = acc          # "01", "02", ... matching BUILD-LOG beat
        durs[f.stem] = dur
        acc += dur

    # Caption windows: a caption lives until the next one, or the end of its
    # beat. BUILD-LOG records only the start, so derive the end.
    abs_caps = []
    for c in caps:
        base = starts.get(str(c.get("beat")), None)
        if base is None:
            continue
        # Prefer the TRUE end when build-edit logged it. Films rendered before
        # 2026-09-24 only recorded the start, so the window is derived below -
        # say which one a number came from rather than mixing them silently.
        abs_caps.append({"t": base + float(c.get("at", 0)),
                         "true_to": (base + float(c["to"])) if c.get("to") is not None else None,
                         "beat": str(c.get("beat")),
                         "text": c.get("text", "")})
    abs_caps.sort(key=lambda c: c["t"])
    if not abs_caps:
        return None
    film_end = acc
    for i, c in enumerate(abs_caps):
        nxt = abs_caps[i + 1]["t"] if i + 1 < len(abs_caps) else film_end
        beat_end = starts[c["beat"]] + durs[c["beat"]]
        # cap the life at 3.2s — a caption is replaced, not held all beat
        if c["true_to"] is not None:
            c["end"] = c["true_to"]
        else:
            c["end"] = min(nxt, beat_end, c["t"] + 3.2)
        if c["end"] <= c["t"]:
            c["end"] = min(c["t"] + 0.8, film_end)

    if SRT_DIR is not None:
        def ts(x):
            h = int(x // 3600); mm = int(x % 3600 // 60)
            ss = int(x % 60); ms = int(round((x - int(x)) * 1000))
            return f"{h:02d}:{mm:02d}:{ss:02d},{ms:03d}"
        lines = []
        for i, c in enumerate(abs_caps, 1):
            lines += [str(i), f"{ts(c['t'])} --> {ts(c['end'])}", c["text"], ""]
        out_srt = SRT_DIR / f"{slug}.srt"
        out_srt.write_text(chr(10).join(lines), encoding="utf-8")
        print(f"  srt -> {out_srt}   ({len(abs_caps)} cues, film {acc:.1f}s)")

    covs, opens, bad = [], [], []
    for c in abs_caps:
        a = int(max(0.0, c["t"]) * ENV_SR)
        b = min(len(m), int(c["end"] * ENV_SR))
        if b <= a:
            continue
        cov = float(m[a:b].mean())
        covs.append(cov)

        # Is this an utterance OPENER? i.e. was it quiet just before it.
        pre_a = max(0, a - int(0.30 * ENV_SR))
        is_open = pre_a < a and m[pre_a:a].mean() < 0.25
        if is_open and len(ons):
            j = int(np.argmin(np.abs(ons - c["t"])))
            if abs(ons[j] - c["t"]) < 1.5:
                opens.append(c["t"] - ons[j])

        if cov < 0.50:
            bad.append((round(c["t"], 1), c["text"][:34], round(cov, 2)))

    if not covs:
        return None
    cv = np.array(covs)
    op = np.abs(np.array(opens)) if opens else None
    return {
        "slug": slug, "n": len(covs),
        "cov_median": round(float(np.median(cv)), 2),
        "on_words": round(float((cv >= 0.75).mean() * 100)),
        "over_silence": int((cv < 0.50).sum()),
        "n_open": len(opens),
        "open_median": round(float(np.median(op)), 2) if op is not None else None,
        "open_adrift": int((op > 0.8).sum()) if op is not None else 0,
        "bad": sorted(bad, key=lambda r: r[2])[:6],
        "exact": all(c["true_to"] is not None for c in abs_caps),
    }


def main():
    global SRT_DIR
    args = sys.argv[1:]
    verbose = "--verbose" in args
    if "--srt" in args:
        SRT_DIR = Path(args[args.index("--srt") + 1])
        SRT_DIR.mkdir(parents=True, exist_ok=True)
    skip = {args[args.index("--srt") + 1]} if "--srt" in args else set()
    slugs = ([p.name for p in sorted((ROOT / "projects").iterdir())
              if p.is_dir() and not p.name.startswith("_")]
             if "--all" in args else [a for a in args if not a.startswith("--") and a not in skip])
    rows = [r for r in (check(s) for s in slugs) if r]
    rows.sort(key=lambda r: r["on_words"])
    print("")
    print(f"{'film':26} {'caps':>5} {'cov':>6} {'on-words':>9} {'silent':>7} "
          f"{'opens':>6} {'open-err':>9} {'adrift':>7}")
    for r in rows:
        flag = "  <-- FIX" if (r["on_words"] < 70 or r["over_silence"] > 2) else ""
        oe = "-" if r["open_median"] is None else f"{r['open_median']:.2f}"
        if not r["exact"]:
            flag += "  (window DERIVED, re-render for exact)"
        print(f"{r['slug']:26} {r['n']:>5} {r['cov_median']:>6.2f} "
              f"{r['on_words']:>8}% {r['over_silence']:>7} {r['n_open']:>6} "
              f"{oe:>9} {r['open_adrift']:>7}{flag}")
        if verbose or r["over_silence"] > 2:
            for t, txt, cov in r["bad"]:
                print(f"       {t:>6}s  speech under it {int(cov*100):>3}%:  {txt!r}")
    if rows:
        allc = np.array([r["on_words"] for r in rows])
        print("")
        print(f"{len(rows)} films.  on-words median {np.median(allc):.0f}% , "
              f"{int((allc < 70).sum())} below 70%.")
    print("")
    print("cov       = median share of a caption's life with speech under it")
    print("on-words  = share of captions with >=75% speech under them")
    print("silent    = captions with <50% speech under them  (the real defect)")
    print("open-err  = for captions that OPEN an utterance, seconds off the onset")


if __name__ == "__main__":
    main()
