# The flat Social Accords mark, measured off the reference Tal sent 2026-10-27 ("this is the logo"):
# "THE" white bold, wide-spaced; "SOCIAL" white medium weight, wide-spaced; "ACCORDS" flat muted gold, bold, the widest line.
# Widths/heights are proportions taken from his image (THE 190, SOCIAL 610, ACCORDS 795 px wide; caps 45 / 75 / 70 px;
# gaps 35 / 30 px). Writes assets/brand/social-accords-logo.png, the file stamp-logo.py uses. The 3D gold one is kept as -gold3d.png.
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT = os.path.join(ROOT, "system", "assets-fonts", "Montserrat.ttf")
S = 1.0                                    # scale: 1 unit = 1 px of his 860-px-wide reference
GOLD = (214, 170, 66, 255)
WHITE = (255, 255, 255, 255)
def font(cap, wght):
    f = ImageFont.truetype(FONT, round(cap / 0.70 * S))
    try: f.set_variation_by_axes([wght])
    except Exception: pass
    return f
def line(text, cap, wght, width):
    f = font(cap, wght); d = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    glyphs = [d.textbbox((0, 0), ch, font=f) for ch in text]
    ink = sum(b[2] - b[0] for b in glyphs)
    track = (width * S - ink) / (len(text) - 1)
    return f, glyphs, track
rows = [("THE", 45, 650, 190, WHITE), ("SOCIAL", 75, 500, 610, WHITE), ("ACCORDS", 70, 720, 795, GOLD)]
gaps = [35, 30]
W, H = round(900 * S), round(400 * S)
im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
y = 0
for i, (text, cap, wght, width, col) in enumerate(rows):
    f, glyphs, track = line(text, cap, wght, width)
    x = 0
    for ch, b in zip(text, glyphs):
        d.text((x - b[0], y - b[1]), ch, font=f, fill=col)     # ink-aligned: cap top at y, left edge at x
        x += (b[2] - b[0]) + track
    y += cap * S + (gaps[i] * S if i < len(gaps) else 0)
im = im.crop(im.getbbox())
pad = round(18 * S)
canvas = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0)); sh.paste((0, 0, 0, 140), (pad + 3, pad + 4), im)
canvas = Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)), canvas)
canvas.alpha_composite(im, (pad, pad))
out = os.path.join(ROOT, "assets", "brand", "social-accords-logo.png"); canvas.save(out); print(out, canvas.size)
