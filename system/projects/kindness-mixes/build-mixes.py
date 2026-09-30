"""KINDNESS MIXES - rebuilt 2026-09-30 from the re-captioned clips.

Six mixed variations of the 2026-09-23 water/kindness shoot. Each segment is
one stranger from Tal's own already-edited clips; a variation is a re-ORDER of
those segments (COMPILATION-ORDER.md: never the same source clip twice in a
row, open on a face and a voice, strongest beat 3rd or 4th).

What changed from the 2026-09-24 build (variations.py, which produced the mixes
Tal said had "such a bad job on the captions"):

1. SOURCE: cut from the RE-CAPTIONED clips (caption-lines.mjs splits on
   meaning), not the old ones. Same 21 segments, same boundaries - verified
   against segments-OLD-2026-09-24.json, 0 of 21 moved - so every mix holds the
   same people it always did.
2. NO LINE CUT IN HALF: two of Tal's cuts carry a line across them (his J-cuts).
   Reordered, 03d opened on the tail "...for you" with the caption flashing for
   0.25s, and 04b ended mid "WHAT DO YOU THINK?". Those edges now fall between
   lines (EDGE_FIX below).
3. LEVELS MATCH, PER PERSON. The source clips sat at -17.9 to -21.5 LUFS.
   A first pass gave one gain per SOURCE CLIP - and measuring each segment
   afterwards showed that was not enough: the 21 people still spread over
   5.3 LU, with 05d ("HEY / I LOVED YOUR HAT") 3.5 LU under the rest, closing
   three of the six mixes quieter than everything before it. Each segment is a
   different person in a different spot, so each gets its own gain to -18 LUFS,
   capped at -4/+5 dB so a quiet street is not pumped into hiss. (Per-beat
   loudnorm is wrong WITHIN one continuous conversation - LESSONS - but these
   are separate scenes.) Every finished mix is then set to -14 LUFS with a
   measured two-pass loudnorm.
4. NO CLICK AT A JOIN: 20 ms fade in/out on every segment's audio.
"""
import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(r"C:/Users/taldo/Downloads/videos to edit/VIDEOS OUT/2026-09-23 shoot")
SEGDIR = HERE / "_segments"           # gitignored working files
SEGS = json.loads((HERE / "segments.json").read_text(encoding="utf-8"))
SEGDIR.mkdir(exist_ok=True)

# edges that cut through a line in Tal's edit -> moved to fall between lines
EDGE_FIX = {
    "03c": {"b": 16.80},   # "THIS IS FOR YOU" 16.83-17.45 crosses his cut at 17.20
    "03d": {"a": 17.50},
    "04b": {"b": 9.45},    # "WHAT DO YOU THINK?" 9.47-10.57 crosses his cut at 9.77/9.80
    "04c": {"a": 10.60},
    # FLASH FRAMES: scene detection placed these two cuts one frame late, so each
    # segment ended on one frame of the NEXT person's shot (04d: the bus street
    # flashing to a man under a red awning; 05b: the smiling older man flashing
    # to a shopping arcade). Checked on the decoded frames, not just the metric.
    # The 2026-09-24 mixes carried both. Two frames off each tail.
    "04d": {"b": 17.40},
    "05b": {"b": 14.73},
    # Four more of the same, found by a frame-exact pass (a scene change within
    # 0.12s of a segment edge) after a 0.3s window proved too coarse - Tal's own
    # angle cuts sit inside the segments. Each ended on ONE frame of the next
    # shot: 02a/02d a car interior, 04a a street, 05a a shop arcade. Looked at.
    "02a": {"b": 10.00},
    "02d": {"b": 33.33},
    "04a": {"b": 6.30},
    "05a": {"b": 7.10},
}
TARGET_CLIP_LUFS = -18.0


def lufs(path, af=None):
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path)]
    cmd += ["-af", (af + "," if af else "") + "ebur128"] if af else ["-af", "ebur128"]
    err = subprocess.run(cmd + ["-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])


def seg_lufs(clip, a, b):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-ss", str(a), "-to", str(b),
                          "-i", str(OUT / f"{clip} captioned.mp4"), "-af", "ebur128",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])

flat = {}
for clip, segs in SEGS.items():
    for i, s in enumerate(segs):
        key = f"{clip}{chr(97 + i)}"
        s = {**s, **EDGE_FIX.get(key, {})}
        s["dur"] = round(s["b"] - s["a"], 2)
        flat[key] = s

GAIN = {}
for key, s in flat.items():
    dst = SEGDIR / f"{key}.mp4"
    d = s["dur"]
    GAIN[key] = round(max(-4.0, min(5.0, TARGET_CLIP_LUFS - seg_lufs(s["clip"], s["a"], s["b"]))), 2)
    af = (f"volume={GAIN[key]}dB,afade=t=in:st=0:d=0.02,"
          f"afade=t=out:st={max(0, d - 0.02):.3f}:d=0.02")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(s["a"]), "-to", str(s["b"]),
                    "-i", str(OUT / f"{s['clip']} captioned.mp4"),
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
                    "-pix_fmt", "yuv420p", "-color_range", "tv", "-r", "30",
                    "-af", af, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
                    "-avoid_negative_ts", "make_zero", str(dst)], check=True)
print(f"cut {len(flat)} segments; per-person gains (dB):", GAIN)

# the six variations - same orders as the 2026-09-24 build
VARIATIONS = {
    "KINDNESS MIX 1 - SHANA TOVA":     ["01a", "02b", "03a", "01b", "02d", "03d"],
    "KINDNESS MIX 2 - THE COMPLIMENTS": ["05a", "04b", "05c", "04d", "05d", "04e"],
    "KINDNESS MIX 3 - MIXED":          ["02a", "05a", "01a", "04d", "03d", "05d"],
    "KINDNESS MIX 4 - HOT DAY":        ["02a", "03a", "02c", "01b", "02e", "03d"],
    "KINDNESS MIX 5 - QUICK ONES":     ["04b", "01c", "04c", "05d", "03b", "04e"],
    "KINDNESS MIX 6 - THE LONG WAY":   ["01a", "03d", "02b", "05b", "02e", "04a"],
}
report = []
for name, keys in VARIATIONS.items():
    fixed, last, pool = [], None, [k for k in keys if k in flat]
    while pool:                                   # never the same clip twice in a row
        pick = next((k for k in pool if k[:2] != last), pool[0])
        pool.remove(pick); fixed.append(pick); last = pick[:2]
    # ONE ENCODE, STRAIGHT FROM THE SOURCES. The concat demuxer with -c copy
    # joined the segment files above, and every one of them starts its video at
    # 0.067s and its audio at 0.045s (B-frame delay + AAC priming): each join
    # became a held frame (a 0.055s gap, 5 per mix, measured on packet pts) and
    # the offsets stacked. Every segment is now trimmed, gained and faded inside
    # one filter graph, timestamps reset, concatenated, and encoded once.
    ins, fc = [], []
    for i, k in enumerate(fixed):
        s, d = flat[k], flat[k]["dur"]
        ins += ["-ss", str(s["a"]), "-to", str(s["b"]), "-i", str(OUT / f"{s['clip']} captioned.mp4")]
        fc.append(f"[{i}:v]fps=30,setpts=PTS-STARTPTS,format=yuv420p[v{i}];"
                  f"[{i}:a]aresample=48000,asetpts=PTS-STARTPTS,volume={GAIN[k]}dB,"
                  f"afade=t=in:st=0:d=0.02,afade=t=out:st={max(0, d - 0.02):.3f}:d=0.02[a{i}]")
    fc.append("".join(f"[v{i}][a{i}]" for i in range(len(fixed)))
              + f"concat=n={len(fixed)}:v=1:a=1[v][a]")
    joined = SEGDIR / f"{name}.joined.mkv"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(fc),
                    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium",
                    "-crf", "18", "-pix_fmt", "yuv420p", "-color_range", "tv",
                    "-c:a", "pcm_s16le", str(joined)], check=True)
    # measured two-pass loudnorm to -14 LUFS, picture copied untouched
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(joined), "-af",
                          "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    m = json.loads(err[err.rfind("{"):err.rfind("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:"
          f"offset={m['target_offset']}:linear=true")
    dst = OUT / f"{name} V2.mp4"   # V2 = the first rebuild from the re-captioned clips
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(joined), "-c:v", "copy", "-movflags", "+faststart",
                    "-af", af, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(dst)], check=True)
    joined.unlink()
    total = sum(flat[k]["dur"] for k in fixed)
    report.append({"name": name, "file": dst.name, "order": fixed, "seconds": round(total, 1),
                   "lufs": lufs(dst)})
    print(f"{name:34} {total:5.1f}s  {report[-1]['lufs']:6.1f} LUFS   " + " -> ".join(fixed))

(HERE / "BUILD-REPORT.json").write_text(json.dumps(report, indent=1), encoding="utf-8")
