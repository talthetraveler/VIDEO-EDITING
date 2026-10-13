# The Social Accords mark, top right, on a finished video. Tal, 2026-10-14: "to every single video you ever do you
# need to add a logo on the top right, of the Social Accords." Run it as the LAST step, on the full-quality render.
#   python system/scripts/stamp-logo.py <in.mp4> <out.mp4> [--from 0] [--to END] [--logo path.png]
# With no --logo it draws "@thesocialaccords" (bold white, dark outline). When Tal sends a real logo file, save it as
# assets/brand/social-accords-logo.png and it is used automatically. The picture is re-encoded once (crf 15); sound is copied.
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
    w = round(230 * k)
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
x, y = W - im.width - round(44 * k), round(150 * k)      # top right, under the app's own top bar
a, b = arg("--from", "0"), arg("--to")
en = f":enable='gte(t,{a})" + (f"*lt(t,{b})'" if b else "'")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-i", png, "-filter_complex", f"[0:v][1:v]overlay={x}:{y}{en}[v]", "-map", "[v]", "-map", "0:a?",
                "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-color_range", "tv", "-c:a", "copy", "-movflags", "+faststart", out], check=True)
os.remove(png)
print("stamped", out, f"{W}x{H}", "logo file" if os.path.exists(logo) else "handle text")
