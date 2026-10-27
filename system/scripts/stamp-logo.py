# The Social Accords mark, top right, on a finished video. Tal, 2026-10-14: "to every single video you ever do you
# need to add a logo on the top right, of the Social Accords." Run it as the LAST step, on the full-quality render.
#   python system/scripts/stamp-logo.py <in.mp4> <out.mp4> [--from 0] [--to END] [--logo path.png] [--width 260] [--no-outro]
# Since 2026-10-21 it also APPENDS his Social Accords outro (assets/brand/social-accords-outro.mp4) unless --no-outro.
# With no --logo it draws "@thesocialaccords" (bold white, dark outline). When Tal sends a real logo file, save it as
# assets/brand/social-accords-logo.png and it is used automatically. The picture is re-encoded once (crf 15); sound is copied (re-encoded to AAC when the outro is joined).
import sys, os, subprocess, json
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src, out = sys.argv[1], sys.argv[2]
arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation", "-of", "json", src], capture_output=True, text=True).stdout)["streams"][0]
W, H = info["width"], info["height"]
if abs(int((info.get("side_data_list") or [{}])[0].get("rotation", 0))) in (90, 270):
    W, H = H, W
k = W / 1080                                    # everything is laid out for a 1080-wide frame
logo = arg("--logo") or os.path.join(ROOT, "assets", "brand", "social-accords-logo.png")
png = out + ".logo.png"
if os.path.exists(logo):
    im = Image.open(logo).convert("RGBA")
    w = round(float(arg("--width", "260")) * k)   # --width: logo width on a 1080-wide frame (Tal 2026-10-27: "small" = 170)
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
else:
    font = next(f for f in [os.path.join(ROOT, "system", "projects", "ai-story-kit", "fonts", "Montserrat.ttf"), "C:/Windows/Fonts/arialbd.ttf"] if os.path.exists(f))
    ft = ImageFont.truetype(font, round(34 * k))
    try:
        ft.set_variation_by_axes([800])
    except Exception:
        pass
    text, s = "@thesocialaccords", max(2, round(4 * k))
    box = ImageDraw.Draw(Image.new("RGBA", (10, 10))).textbbox((0, 0), text, font=ft, stroke_width=s)
    im = Image.new("RGBA", (box[2] - box[0] + 2 * s, box[3] - box[1] + 2 * s), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((s - box[0], s - box[1]), text, font=ft, fill=(255, 255, 255, 255), stroke_width=s, stroke_fill=(0, 0, 0, 235))
im.save(png)
x, y = W - im.width - round(44 * k), round(96 * k)       # top right; 96 keeps it above a title that starts near y=170
a, b = arg("--from", "0"), arg("--to")
en = f":enable='gte(t,{a})" + (f"*lt(t,{b})'" if b else "'")
# THE OUTRO. Section 11 (approved 2026-10-21): "after he says bye, every video ends on his animated Social Accords
# logo outro (it replaces a plain black end card)." HIS file (assets/brand/social-accords-outro.mp4, conformed by
# make-outro.mjs) is appended HERE, after the mark is stamped, so the top-right mark never sits on it.
# No file yet -> no outro, said out loud. --no-outro for a collab creator's cut or the Ezel videos.
TAG = "setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=bt709"
outro = None
if "--no-outro" not in sys.argv:
    r = subprocess.run(["node", os.path.join(ROOT, "system", "scripts", "make-outro.mjs")], capture_output=True, text=True)
    if r.returncode == 0 and r.stdout.strip():
        outro = r.stdout.strip().splitlines()[-1]
    elif r.returncode == 3:
        print("no outro added: his outro file is not in assets/brand/ yet (social-accords-outro.mp4)")
    else:
        sys.exit(f"outro could not be prepared: {r.stderr.strip()}")
probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,r_frame_rate:format=duration", "-of", "json", src], capture_output=True, text=True).stdout)
has_audio = any(st["codec_type"] == "audio" for st in probe["streams"])
if outro:
    fr = next(st["r_frame_rate"] for st in probe["streams"] if st["codec_type"] == "video")
    dur = float(probe["format"]["duration"])
    # the film's sound gets an 80 ms fade at its very end so the join to the silent outro does not click
    a0 = f"[0:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=out:st={max(0, dur - 0.08):.3f}:d=0.08[a0];" if has_audio         else f"anullsrc=r=48000:cl=stereo,atrim=0:{dur:.3f}[a0];"
    # TAG = range + all three colour fields INSIDE the graph. ffmpeg 9 writes the range only with all four set:
    # "-color_range tv" alone, or setparams=range=tv alone, left an untagged source "unknown" (measured 2026-10-21)
    graph = (f"[0:v][1:v]overlay={x}:{y}{en},setsar=1,{TAG}[v0];"
             f"[2:v]scale={W}:{H}:flags=lanczos,fps={fr},format=yuv420p,setsar=1,{TAG}[v1];" + a0 +
             "[2:a]aresample=48000,aformat=channel_layouts=stereo[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]")
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", src, "-i", png, "-i", outro, "-filter_complex", graph, "-map", "[v]", "-map", "[a]",
           "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-color_range", "tv",
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
else:
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", src, "-i", png, "-filter_complex", f"[0:v][1:v]overlay={x}:{y}{en},{TAG}[v]", "-map", "[v]", "-map", "0:a?",
           "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-color_range", "tv", "-c:a", "copy", "-movflags", "+faststart", out]
subprocess.run(cmd, check=True)
os.remove(png)
print("stamped", out, f"{W}x{H}", "logo file" if os.path.exists(logo) else "handle text", "+ outro" if outro else "(no outro)")
