# Labelled frame strips of proxies, for LOOKING at every clip before choosing.
#   python strips.py <index-slug> <outdir> [--step S] [--only name,name] [--h 300]
import json, subprocess, sys, os, math
from PIL import Image, ImageDraw, ImageFont
ROOT = "C:/Users/taldo/Downloads/videos to edit/system"
FFDIR = "C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin"
FF, FP = FFDIR + "/ffmpeg.exe", FFDIR + "/ffprobe.exe"
slug, outdir = sys.argv[1], sys.argv[2]
arg = lambda k, d: (sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d)
STEP = float(arg("--step", "0")); H = int(arg("--h", "300")); MAXN = int(arg("--max", "10"))
ONLY = [s for s in arg("--only", "").split(",") if s]
T0 = float(arg("--from", "0")); T1 = float(arg("--to", "0")); VF = arg("--vf", ""); TAG = arg("--tag", "sheet")
idx = json.load(open(f"{ROOT}/projects/_frameio/cache/index/{slug}.json", encoding="utf8"))
files = sorted(idx["files"], key=lambda f: f["name"])
if ONLY: files = [f for f in files if any(o in f["name"] for o in ONLY)]
font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 20)
os.makedirs(outdir, exist_ok=True)
rows = []
for f in files:
    src = f"{ROOT}/projects/_frameio/cache/proxies/{f['id']}.mp4"
    if not os.path.exists(src): print("missing", f["name"]); continue
    d = float(subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip() or 0)
    a, b = (T0, T1 or d)
    span = b - a
    n = max(2, min(MAXN, math.ceil(span / STEP))) if STEP else max(2, min(MAXN, math.ceil(span / 2.5)))
    times = [a + span * (i + 0.5) / n for i in range(n)]
    tiles = []
    for t in times:
        tmp = f"{outdir}/_t.jpg"
        subprocess.run([FF, "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", src, "-frames:v", "1", "-vf", (VF + "," if VF else "") + f"scale=-2:{H}", tmp])
        if not os.path.exists(tmp): continue
        im = Image.open(tmp).convert("RGB"); im.load(); os.remove(tmp)
        dr = ImageDraw.Draw(im); dr.rectangle([0, 0, 78, 24], fill=(0, 0, 0)); dr.text((3, 1), f"{t:.1f}", font=font, fill=(255, 255, 0))
        tiles.append(im)
    if not tiles: continue
    w = sum(t.width for t in tiles); row = Image.new("RGB", (w, H + 28), (20, 20, 20))
    ImageDraw.Draw(row).text((4, 3), f"{f['name']}  {f['id'][:8]}  {d:.1f}s  [{f.get('bucket','')}]", font=font, fill=(255, 255, 255))
    x = 0
    for t in tiles: row.paste(t, (x, 28)); x += t.width
    rows.append((f["name"], row))
# pack rows into sheets of <= ~1900px tall
sheet, y, k = [], 0, 0
def flush():
    global sheet, y, k
    if not sheet: return
    W = max(r.width for _, r in sheet); im = Image.new("RGB", (W, y), (0, 0, 0)); yy = 0
    for _, r in sheet: im.paste(r, (0, yy)); yy += r.height
    p = f"{outdir}/{TAG}_{k:02d}_{sheet[0][0].split('.')[0]}-{sheet[-1][0].split('.')[0]}.jpg"; im.save(p, quality=80); print(p, im.size); k += 1; sheet = []; y = 0
for nm, r in rows:
    if y + r.height > 2000: flush()
    sheet.append((nm, r)); y += r.height
flush()
