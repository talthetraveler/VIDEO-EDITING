#!/usr/bin/env python3
"""Beat-grid reel builder (ffmpeg + PIL). Usage: python3 reel.py edits/<spec>.json [scale]

Spec: {"name", "bpm", "beats":[...], "text":[...]}
  beat  {"v": src, "in": s, "b": beats}                     video, own audio
        {"photos": [names], "per": beats_per_photo, "audio": {"src","in"}}  stop-motion
        optional "zoom": 1.15 (static punch-in), "kb": true (slow push-in)
  text  {"t": "...", "at": beat, "to": beat, "style": hook|label|score|cta, "y": 0..1}
Every cut lands on the grid (1 beat = 60/bpm s), so a song at that tempo drops in at 0:00.
Writes preview/<name>.mp4 and preview/<name>_cues.txt (cut times + beat numbers).
"""
import json, glob, os, subprocess, sys, hashlib
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageFilter
import pillow_heif; pillow_heif.register_heif_opener()

spec = json.load(open(sys.argv[1])); scale = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
W, H = int(1080*scale)//2*2, int(1920*scale)//2*2
FPS = 30; BEAT = 60.0/spec["bpm"]
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../assets-fonts/Heebo-Black.ttf")
GRADE = "curves=all='0/0 0.06/0.04 0.5/0.5 0.94/0.97 1/1',eq=saturation=1.1"
COVER = f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}"
AUD = "aresample=48000,aformat=channel_layouts=stereo,apad"
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-color_range", "tv",
       "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-r", str(FPS)]
allf = glob.glob("raw/**/*", recursive=True)
for d in ("cache/stills", "cache/rbeats", "cache/text", "preview"): os.makedirs(d, exist_ok=True)

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: sys.exit(" ".join(map(str, cmd))[:1500] + "\n" + r.stderr[-2500:])

def still(name):
    src = [f for f in allf if os.path.basename(f).rsplit(".", 1)[0] == name][0]
    o = f"cache/stills/{name}.jpg"
    if not os.path.exists(o):
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB"); im.thumbnail((2160, 2880)); im.save(o, quality=92)
    return o

STYLE = {  # size (at 1080 wide), fill, stroke ratio
    "hook":  (96,  "white",   0.11),
    "big":   (150, "white",   0.10),
    "label": (104,  "white",   0.11),
    "score": (230, "#FACC27", 0.07),
    "cta":   (66,  "white",   0.12),
}

def text_png(t, style, pop=1.0):
    key = hashlib.md5(f"{t}|{style}|{pop}|{W}".encode()).hexdigest()[:12]
    o = f"cache/text/{key}.png"
    if os.path.exists(o): return o
    size, fill, sr = STYLE[style]; dr = "ltr" if style == "score" else "rtl"; fs = int(size*scale*pop); f = ImageFont.truetype(FONT, fs)
    maxw = W*0.88; lines = []
    for para in t.split("\n"):  # greedy wrap, RTL measured per line
        cur = ""
        for w in para.split(" "):
            nxt = (cur + " " + w).strip()
            if cur and ImageDraw.Draw(Image.new("L", (1, 1))).textlength(nxt, font=f, direction=dr) > maxw:
                lines.append(cur); cur = w
            else: cur = nxt
        lines.append(cur)
    sw = max(2, int(fs*sr)); lh = int(fs*1.18); h = lh*len(lines) + sw*4
    im = Image.new("RGBA", (W, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    sh = Image.new("RGBA", (W, h), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=f, direction=dr); x = (W-tw)/2; y = sw*2 + i*lh
        ds.text((x+fs*0.04, y+fs*0.06), ln, font=f, fill=(0, 0, 0, 150), direction=dr, stroke_width=sw, stroke_fill=(0, 0, 0, 150))
        d.text((x, y), ln, font=f, fill=fill, direction=dr, stroke_width=sw, stroke_fill="black")
    sh = sh.filter(ImageFilter.GaussianBlur(fs*0.06)); sh.alpha_composite(im); sh.save(o)
    return o

# ---- 1. render every beat to an exact grid length
parts, cues, t_beats = [], [], 0
for i, b in enumerate(spec["beats"]):
    o = f"cache/rbeats/{spec['name']}_{i:02d}_{W}.mp4"
    zoom = b.get("zoom", 1.0); zf = f",scale=iw*{zoom}:ih*{zoom},crop={W}:{H}" if zoom != 1.0 else ""
    if "v" in b:
        nb = b["b"]; dur = nb*BEAT
        vf = f"{COVER}{zf},fps={FPS},{GRADE},scale=out_range=tv,format=yuv420p"
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(b["in"]), "-t", str(dur+0.2), "-i", b["v"],
               "-filter_complex", f"[0:v]{vf}[v];[0:a]volume={b.get('vol',1.0)},{AUD}[a]",
               "-map", "[v]", "-map", "[a]", "-t", f"{dur:.4f}"] + ENC + [o]
    else:
        per = b["per"]*BEAT; n = len(b["photos"]); nb = b["per"]*n; dur = nb*BEAT
        cmd = ["ffmpeg", "-v", "error", "-y"]
        for p in b["photos"]: cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{per:.4f}", "-i", still(p)]
        a = b["audio"]; cmd += ["-ss", str(a["in"]), "-i", a["src"]]
        ch = []
        for k in range(n):
            if b.get("kb"):
                ch.append(f"[{k}:v]{COVER},scale=w='{W}*(1+0.07*t/{per})':h=-2:eval=frame,crop={W}:{H},setsar=1,fps={FPS}[p{k}]")
            else:
                ch.append(f"[{k}:v]{COVER}{zf},setsar=1,fps={FPS}[p{k}]")
        fc = ";".join(ch) + ";" + "".join(f"[p{k}]" for k in range(n)) + \
             f"concat=n={n}:v=1:a=0,{GRADE},scale=out_range=tv,format=yuv420p[v];[{n}:a]volume={a.get('vol',0.7)},{AUD}[a]"
        cmd += ["-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", f"{dur:.4f}"] + ENC + [o]
    run(cmd); parts.append(o)
    cues.append(f"{t_beats*BEAT:6.2f}s  beat {t_beats:5g}  {b.get('v', ' + '.join(b.get('photos', [])[:2]) + ' ...')}")
    t_beats += nb
total = t_beats*BEAT

with open("cache/rconcat.txt", "w") as f:
    for p in parts: f.write(f"file '{os.path.abspath(p)}'\n")
joined = f"cache/{spec['name']}_joined.mp4"
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "cache/rconcat.txt", "-c", "copy", joined])

# ---- 2. text overlays on the global timeline (pop-in: 1.18x for 3 frames, then 1.0x)
cmd = ["ffmpeg", "-v", "error", "-y", "-i", joined]; fc = []; last = "[0:v]"; n = 1
for k, tx in enumerate(spec.get("text", [])):
    a, z = tx["at"]*BEAT, tx["to"]*BEAT; y = tx.get("y", 0.3)
    for pop, (s, e) in ((1.18, (a, a+0.1)), (1.0, (a+0.1, z))):
        png = text_png(tx["t"], tx["style"], pop); cmd += ["-i", png]
        nxt = f"[o{n}]"
        fc.append(f"{last}[{n}:v]overlay=x=0:y=H*{y}-h/2:enable='between(t,{s:.3f},{e:.3f})'{nxt}")
        last = nxt; n += 1
# ---- 3. loudness: two-pass to -14 LUFS
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", joined, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
j = json.loads(m[m.rindex("{"):m.rindex("}")+1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
out = f"preview/{spec['name']}.mp4"
fc.append(f"{last if fc else '[0:v]'}scale=out_range=tv,format=yuv420p,setparams=range=tv[vout]"); vmap = "[vout]"
cmd += ["-filter_complex", ";".join(fc)] + ["-map", vmap, "-map", "0:a", "-af", ln,
        "-c:v", "libx264", "-preset", "medium", "-crf", "20" if scale == 1 else "23", "-pix_fmt", "yuv420p",
        "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-t", f"{total:.4f}", out]
run(cmd)
with open(f"preview/{spec['name']}_cues.txt", "w") as f:
    f.write(f"{spec['name']}  {spec['bpm']} BPM  beat={BEAT:.3f}s  total={total:.2f}s ({t_beats} beats)\n")
    f.write("Every cut sits on a beat. Drop a song at this tempo in at 0:00 on its first downbeat.\n\n")
    f.write("\n".join(cues) + "\n\nTEXT\n")
    for tx in spec.get("text", []): f.write(f"{tx['at']*BEAT:6.2f}-{tx['to']*BEAT:6.2f}s  [{tx['style']}] {tx['t']}\n")
print("done", out, f"{total:.2f}s", t_beats, "beats")
