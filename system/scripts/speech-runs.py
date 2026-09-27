#!/usr/bin/env python
"""WHERE IS SOMEONE ACTUALLY TALKING? Print speech runs as start,end pairs.

    python speech-runs.py <file> [floor_pct] [frac]   ->  0.10-1.02,2.30-3.44,...

Onsets alone are not enough on this footage. A street POV mic fires an onset on
a bottle crinkle, a footstep, a passing scooter — 2026-09-24, captioning clip
01, six captions landed on transients like that and sat over silence even though
the placement algorithm was correct. A RUN has a duration, so a 60ms click
cannot masquerade as a place to put a line of dialogue.

The threshold is relative (percentile of the file's own loudness), because an
absolute dB gate calls a loud market silent.
"""
import subprocess
import sys

import numpy as np

SR = 8000
HZ = 100
MIN_RUN = 0.18          # shorter than this is a transient, not speech
BRIDGE = 0.22           # a breath inside a sentence must not split it


def main():
    path = sys.argv[1]
    floor_pct = float(sys.argv[2]) if len(sys.argv) > 2 else 20.0
    frac = float(sys.argv[3]) if len(sys.argv) > 3 else 0.35

    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-i", path, "-f", "s16le", "-acodec",
         "pcm_s16le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True).stdout
    if not raw:
        print("")
        return
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    hop = SR // HZ
    n = len(a) // hop
    if n < 10:
        print("")
        return
    env = np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(env + 1e-9)

    lo, hi = np.percentile(db, floor_pct), np.percentile(db, 95)
    m = db > lo + (hi - lo) * frac

    # bridge breath-length gaps
    k = int(BRIDGE * HZ)
    idx = np.flatnonzero(m)
    if idx.size:
        for x, y in zip(idx[:-1], idx[1:]):
            if 1 < y - x <= k:
                m[x:y] = True

    runs, i = [], 0
    while i < len(m):
        if m[i]:
            j = i
            while j < len(m) and m[j]:
                j += 1
            if (j - i) / HZ >= MIN_RUN:
                runs.append((i / HZ, j / HZ))
            i = j
        else:
            i += 1

    print(",".join(f"{s:.2f}-{e:.2f}" for s, e in runs))


if __name__ == "__main__":
    main()
