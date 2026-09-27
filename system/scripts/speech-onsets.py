#!/usr/bin/env python
"""Speech onsets in a beat's audio, as seconds from its start.

Caption placement used to trust Groq's word timestamps. This repo already knows
they are unreliable — LESSONS records that the word array is not in speaking
order and that end times overrun by up to 2s. Measuring caption sync against
the finished audio then showed only ~30-50% of captions landing within 0.35s of
a real speech onset, with some sitting over total silence.

The audio itself is the ground truth, so onsets come from here instead.

    python scripts/speech-onsets.py <audio> -> "0.32,1.84,3.10,..."
"""
import subprocess, sys
import numpy as np

ENV_SR = 100


def main():
    path = sys.argv[1]
    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-i", path, "-f", "s16le", "-acodec",
         "pcm_s16le", "-ac", "1", "-ar", "8000", "-"],
        capture_output=True).stdout
    if not raw:
        print(""); return
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    hop = 8000 // ENV_SR
    n = len(a) // hop
    if n < 10:
        print(""); return
    env = np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(env + 1e-9)
    # RELATIVE threshold: a busy market's floor is far above a quiet street's,
    # and an absolute gate would call the market silent throughout.
    floor, peak = np.percentile(db, 20), np.percentile(db, 95)
    m = db > floor + (peak - floor) * 0.35
    # bridge gaps under 0.3s so a breath inside a sentence is not a new onset
    k = int(0.30 * ENV_SR)
    idx = np.flatnonzero(m)
    if idx.size:
        for x, y in zip(idx[:-1], idx[1:]):
            if 1 < y - x <= k:
                m[x:y] = True
    d = np.diff(m.astype(np.int8))
    ons = (np.flatnonzero(d == 1) + 1) / ENV_SR
    if m[0]:
        ons = np.concatenate(([0.0], ons))
    print(",".join(f"{t:.2f}" for t in ons))


if __name__ == "__main__":
    main()
