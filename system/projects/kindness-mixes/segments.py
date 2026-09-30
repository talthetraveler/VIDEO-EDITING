"""Find the person-segments inside each already-edited clip.

KINDNESS MIXES, rebuilt 2026-09-30 from the RE-CAPTIONED clips (caption-lines.mjs:
splits on meaning). The 09-24 mixes were cut from the old captions - the ones Tal
called "such a bad job" ("LIKED THE LOOK. HAVE A" / "DAY. I LIKED THE LOOK").
"""
import json
import subprocess
from pathlib import Path

OUT = Path(r"C:/Users/taldo/Downloads/videos to edit/VIDEOS OUT/2026-09-23 shoot")


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                                 "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout.strip())


def cuts(p, th=0.20):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-filter_complex",
                          f"select='gt(scene,{th})',metadata=print:file=-", "-an",
                          "-f", "null", "-"], capture_output=True, text=True).stdout
    ts = sorted({round(float(l.split("pts_time:")[1].split()[0]), 2)
                 for l in out.splitlines() if "pts_time:" in l})
    return [t for t in ts if t > 1.0]


segments = {}
for n in ("01", "02", "03", "04", "05"):
    p = OUT / f"{n} captioned.mp4"
    d = dur(p)
    c = cuts(p)
    caps = json.loads((OUT / "_json" / f"{n} captioned.captions.json").read_text(encoding="utf-8"))
    bounds = [0.0] + c + [d]
    segs = []
    for i in range(len(bounds) - 1):
        a, b = bounds[i], bounds[i + 1]
        if b - a < 2.0:
            continue
        inside = [x for x in caps if x["a"] >= a - 0.1 and x["b"] <= b + 0.1]
        segs.append({"clip": n, "a": round(a, 2), "b": round(b, 2),
                     "dur": round(b - a, 2), "caps": len(inside),
                     "first": inside[0]["text"] if inside else "",
                     "last": inside[-1]["text"] if inside else ""})
    segments[n] = segs
    print(f"{n}.mp4  {d:.1f}s -> {len(segs)} person-segments")
    for s in segs:
        print(f"    {s['a']:6.2f}-{s['b']:6.2f} ({s['dur']:5.2f}s) {s['caps']:>2} caps   "
              f"{s['first'][:26]:28} ... {s['last'][:24]}")

Path(r"C:/Users/taldo/Downloads/videos to edit/system/projects/kindness-mixes/segments.json").write_text(
    json.dumps(segments, indent=1), encoding="utf-8")
tot = sum(len(v) for v in segments.values())
print(f"\n{tot} person-segments available to mix")
