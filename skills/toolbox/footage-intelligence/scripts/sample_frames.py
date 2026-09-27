"""Footage intelligence — sample frames from a clip for Claude vision.

Extracts N evenly-spaced frames and tiles them into ONE labelled contact sheet
(t=0.0s, 1.2s, ...). One image is cheaper + gives Claude temporal context vs N reads.
Also emits clip metadata (duration, resolution, fps, has_audio).

Generic — works on any video. Usage:
    python sample_frames.py <clip_path> <out_dir> [n_frames=6]
Writes <out_dir>/<clipname>.sheet.jpg and prints a JSON line:
    {"clip","sheet","dur","w","h","fps","has_audio","frame_times":[...]}
"""
import sys, os, json, subprocess, math

clip = sys.argv[1]
out_dir = sys.argv[2]
n = int(sys.argv[3]) if len(sys.argv) > 3 else 6
os.makedirs(out_dir, exist_ok=True)
name = os.path.splitext(os.path.basename(clip))[0]

def ffprobe(args):
    return subprocess.run(["ffprobe", "-v", "error", *args, clip],
                          capture_output=True, text=True).stdout.strip()

dur = float(ffprobe(["-show_entries", "format=duration", "-of", "csv=p=0"]) or 0)
wh = ffprobe(["-select_streams", "v:0", "-show_entries", "stream=width,height",
              "-of", "csv=s=,:p=0"]).replace("\n", ",").split(",")
wh = [x for x in wh if x.strip().isdigit()]
w, h = (int(wh[0]), int(wh[1])) if len(wh) >= 2 else (0, 0)
rfr = ffprobe(["-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
               "-of", "csv=p=0"]) or "30/1"
try:
    num, den = rfr.split("/"); fps = float(num) / float(den) if float(den) else 30.0
except Exception:
    fps = 30.0
has_audio = bool(ffprobe(["-select_streams", "a:0", "-show_entries",
                          "stream=index", "-of", "csv=p=0"]))

# even sample times (centered in N buckets), skip a hair off the very ends
times = [round(dur * (i + 0.5) / n, 2) for i in range(n)] if dur else [0.0]

# extract each frame downscaled, label with timestamp, then tile
tiles = []
for i, t in enumerate(times):
    fp = os.path.join(out_dir, f"{name}.f{i}.jpg")
    # fixed 480x480 cell (fit + pad) so portrait & landscape frames tile uniformly
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", clip,
                    "-frames:v", "1", "-vf",
                    "scale=480:480:force_original_aspect_ratio=decrease,"
                    "pad=480:480:(ow-iw)/2:(oh-ih)/2:color=black,"
                    "drawtext=text='t\\="+str(t)+"s':x=8:y=8:"
                    "fontsize=24:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4",
                    fp], capture_output=True)
    if os.path.exists(fp):
        tiles.append(fp)

sheet = os.path.join(out_dir, f"{name}.sheet.jpg")
if tiles:
    cols = min(3, len(tiles)); rows = math.ceil(len(tiles) / cols)
    # concat the per-frame inputs into one stream, then tile that stream
    inputs = sum([["-i", t] for t in tiles], [])
    concat = "".join(f"[{i}:v]" for i in range(len(tiles)))
    fc = f"{concat}concat=n={len(tiles)}:v=1:a=0[s];[s]tile={cols}x{rows}:padding=6:color=black[o]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs,
                    "-filter_complex", fc, "-map", "[o]",
                    "-frames:v", "1", sheet], capture_output=True)
    for t in tiles:
        try: os.remove(t)
        except OSError: pass

print(json.dumps({"clip": name, "sheet": sheet if os.path.exists(sheet) else None,
                  "dur": round(dur, 2), "w": w, "h": h, "fps": round(fps, 2),
                  "has_audio": has_audio, "frame_times": times}))
