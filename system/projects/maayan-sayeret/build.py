#!/usr/bin/env python3
"""Build a montage from edits/<spec>.json -> preview/<name>.mp4 (ffmpeg only)."""
import json, glob, os, subprocess, sys
from PIL import Image, ImageOps, ImageDraw, ImageFont
import pillow_heif; pillow_heif.register_heif_opener()

spec_path = sys.argv[1]; out = sys.argv[2]; scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
W, H = (int(1080*scale)//2*2, int(1920*scale)//2*2)
FPS = 30
spec = json.load(open(spec_path))
allf = glob.glob("raw/**/*", recursive=True)
os.makedirs("cache/stills", exist_ok=True); os.makedirs("cache/beats", exist_ok=True); os.makedirs("cache/titles", exist_ok=True)
GRADE = "curves=all='0/0 0.06/0.04 0.5/0.5 0.94/0.97 1/1',eq=saturation=1.08"
COVER = f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: sys.exit(" ".join(cmd) + "\n" + r.stderr[-2000:])

def still(name):
    src = [f for f in allf if os.path.basename(f).rsplit(".", 1)[0] == name][0]
    o = f"cache/stills/{name}.jpg"
    if not os.path.exists(o):
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        im.thumbnail((2160, 2880)); im.save(o, quality=92)
    return o

def title_png(text):
    o = f"cache/titles/{abs(hash(text))}_{W}.png"
    fs = int(96*scale); f = ImageFont.truetype(FONT, fs)
    im = Image.new("RGBA", (W, int(fs*2)), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    tw = d.textlength(text, font=f, direction="rtl")
    d.text(((W-tw)/2, fs*0.4), text, font=f, fill="white", stroke_width=max(2, int(fs*0.1)), stroke_fill="black", direction="rtl")
    im.save(o); return o

AUD = "aresample=48000,aformat=channel_layouts=stereo,apad"
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-color_range", "tv",
       "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-r", str(FPS)]
parts = []
for i, b in enumerate(spec["beats"]):
    o = f"cache/beats/{i:02d}_{W}.mp4"
    if "v" in b:
        dur = b["out"] - b["in"]
        vf = f"{COVER},fps={FPS},{GRADE},scale=out_range=tv,format=yuv420p"
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(b["in"]), "-t", str(dur), "-i", b["v"]]
        if b.get("title"):
            cmd += ["-i", title_png(b["title"])]
            fc = f"[0:v]{vf}[b];[b][1:v]overlay=0:{int(H*0.12)}:enable='between(t,0.2,{dur-0.1})'[v];[0:a]{AUD}[a]"
        else:
            fc = f"[0:v]{vf}[v];[0:a]{AUD}[a]"
        cmd += ["-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", str(dur)] + ENC + [o]
    else:
        each = b["each"]; dur = each*len(b["photos"])
        cmd = ["ffmpeg", "-v", "error", "-y"]
        for p in b["photos"]:
            cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(each), "-i", still(p)]
        a = b["audio"]; ai = len(b["photos"])
        cmd += ["-ss", str(a["in"]), "-i", a["src"]]
        chains = []
        for k in range(len(b["photos"])):
            if b.get("kb"):  # slow push-in: crop shrinks from 100% to 92% around centre
                chains.append(f"[{k}:v]{COVER},scale=w='{W}*(1+0.08*t/{each})':h=-2:eval=frame:flags=bicubic,"
                              f"crop={W}:{H},setsar=1,fps={FPS}[p{k}]")
            else:
                chains.append(f"[{k}:v]{COVER},setsar=1,fps={FPS}[p{k}]")
        fc = ";".join(chains) + ";" + "".join(f"[p{k}]" for k in range(len(b["photos"]))) + \
             f"concat=n={len(b['photos'])}:v=1:a=0,{GRADE},scale=out_range=tv,format=yuv420p[v];[{ai}:a]{AUD}[a]"
        cmd += ["-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", str(dur)] + ENC + [o]
    run(cmd); parts.append(o)
    print(f"{i:02d} ok", flush=True)

with open("cache/concat.txt", "w") as f:
    for p in parts: f.write(f"file '{os.path.abspath(p)}'\n")
tmp = "cache/joined.mp4"
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "cache/concat.txt", "-c", "copy", tmp])
# loudness to -14 LUFS, short fade-out on the last beat
d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", tmp], capture_output=True, text=True).stdout)
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
import re
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex("{"):m.rindex("}")+1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"{ln},afade=t=out:st={d-1.2}:d=1.2",
     "-vf", f"fade=t=out:st={d-0.6}:d=0.6", "-c:v", "libx264", "-preset", "medium", "-crf", "21" if scale == 1 else "24",
     "-pix_fmt", "yuv420p", "-color_range", "tv", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out])
print("done", out, round(d, 2))
