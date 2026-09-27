#!/usr/bin/env python
"""WHERE DOES CLIP B SIT ON CLIP A'S TIMELINE?

Tal, on coffee-kindness: *"you didn't use the Sony camera. You should use both,
because sometimes it's too dark in that video."* He was right, and
find-coverage.mjs now says WHICH other camera rolled on the same conversation.
But knowing a second camera exists is useless without knowing the OFFSET
between them — the two bodies were started by hand, seconds or minutes apart.

This measures it. Output: `offset` seconds such that

    time_in_B = time_in_A - offset

so a beat at 12.5s in the glasses clip is at 12.5 - offset in the Sony clip.

HOW, and why not raw waveform. The two cameras have different mics at different
distances, different AGC and different noise floors, so their WAVEFORMS do not
correlate. Their loudness ENVELOPES do — a laugh is loud on both, a pause is
quiet on both. So both are reduced to a 100 Hz RMS envelope, mean-removed, and
cross-correlated by FFT. That survives completely different microphones.

The returned `score` is the normalised peak (0-1). Measured on this footage:
a true match scores > 0.5 and is obvious; unrelated clips sit under 0.25.
ALWAYS check the score — a confident-looking offset from an unrelated pair is
how a beat ends up cut to the wrong moment.

    python scripts/align-cameras.py <idA> <idB>
    python scripts/align-cameras.py <idA> <idB> --json
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

ROOT = Path(r"C:/Users/taldo/Downloads/videos to edit/system")
CACHE = ROOT / "projects/_frameio/cache"
ENV_SR = 100          # envelope samples per second


def source_for(cid):
    """Same resolution order the builder uses: local original, HQ span, proxy."""
    ls = CACHE / "local-sources.json"
    if ls.exists():
        loc = json.loads(ls.read_text(encoding="utf-8")).get(cid) or {}
        p = loc.get("path")
        if p and Path(p).exists():
            return Path(p)
    for c in (CACHE / "hq" / f"{cid}.mp4", CACHE / "proxies" / f"{cid}.mp4",
              CACHE / "audio" / f"{cid}.flac"):
        if c.exists():
            return c
    return None


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
    env = np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    env = np.log1p(env * 50)              # compress: a shout must not dominate
    return env - env.mean()


def align(ea, eb, min_overlap_s=8.0):
    """Offset in seconds of B relative to A, plus a 0-1 confidence.

    NORMALISE PER LAG, NOT GLOBALLY. The first version divided the correlation
    peak by the total energy of both envelopes and scored a KNOWN-good pair
    (C0481 Sony vs the glasses clip on the same conversation) at 0.10 — looking
    exactly like an unrelated pair. The cameras overlap only PARTLY: 438s of
    Sony against 298s of glasses, and a lag where 60s overlap is compared
    against the energy of all 736s. The denominator was mostly energy that
    never took part in the match.

    So the correlation at each lag is divided by the energy of only the samples
    that actually overlap AT that lag, via cumulative sums. Lags with less than
    `min_overlap_s` of overlap are discarded outright — a 2-second overlap can
    correlate perfectly by chance and will win every time otherwise.
    """
    ea = ea / (ea.std() + 1e-9)
    eb = eb / (eb.std() + 1e-9)
    na, nb = len(ea), len(eb)
    n = 1 << int(np.ceil(np.log2(na + nb)))
    cc = np.fft.irfft(np.fft.rfft(ea, n) * np.conj(np.fft.rfft(eb, n)), n)
    cc = np.concatenate((cc[-(nb - 1):], cc[:na]))
    lags = np.arange(-(nb - 1), na)

    # energy of the overlapping slice of each envelope, per lag
    ca = np.concatenate(([0.0], np.cumsum(ea ** 2)))
    cb = np.concatenate(([0.0], np.cumsum(eb ** 2)))
    a0 = np.clip(lags, 0, na); a1 = np.clip(lags + nb, 0, na)
    b0 = np.clip(-lags, 0, nb); b1 = np.clip(na - lags, 0, nb)
    ov = np.minimum(a1 - a0, b1 - b0)
    ea_e = ca[a1] - ca[a0]
    eb_e = cb[b1] - cb[b0]
    denom = np.sqrt(np.maximum(ea_e, 1e-9) * np.maximum(eb_e, 1e-9))
    score = cc / denom
    score[ov < int(min_overlap_s * ENV_SR)] = -1.0
    k = int(np.argmax(score))
    return lags[k] / ENV_SR, float(score[k]), float(ov[k] / ENV_SR)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2:
        sys.exit(__doc__)
    ida, idb = args[0], args[1]
    pa, pb = source_for(ida), source_for(idb)
    if not pa or not pb:
        out = {"ok": False, "error": f"missing source for {ida if not pa else idb}"}
    else:
        ea, eb = envelope(pa), envelope(pb)
        if ea is None or eb is None:
            out = {"ok": False, "error": "no decodable audio"}
        else:
            off, score, ov = align(ea, eb)
            out = {"ok": True, "a": ida, "b": idb,
                   "offset": round(off, 3), "score": round(score, 3),
                   "overlap_s": round(ov, 1),
                   "note": "time_in_B = time_in_A - offset",
                   "confident": score >= 0.5 and ov >= 15}
    if "--json" in sys.argv:
        print(json.dumps(out))
    elif out.get("ok"):
        print(f"offset {out['offset']:+.3f}s   score {out['score']:.3f}"
              f"   overlap {out['overlap_s']}s"
              f"   {'CONFIDENT' if out['confident'] else 'LOW - do not trust'}")
    else:
        print("FAILED:", out["error"])


if __name__ == "__main__":
    main()
