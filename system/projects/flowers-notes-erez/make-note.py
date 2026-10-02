# Recreates the note card Tal pasted in chat (2026-10-02) - the app does not
# save pasted images to disk. White square card, red handwriting, a heart.
# If he drops the original file in this folder, point the sticker's `image`
# at it instead and delete nothing.
#   python make-note.py  ->  note.png (RGBA, soft shadow, slight tilt)
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
S = 900
RED = (232, 23, 79, 255)
fonts = ["C:/Windows/Fonts/Inkfree.ttf", "C:/Windows/Fonts/segoepr.ttf", "C:/Windows/Fonts/comic.ttf"]
fp = next(f for f in fonts if os.path.exists(f))
font = ImageFont.truetype(fp, 66)

# the writing, on its own layer so it can lean like handwriting
txt = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(txt)
lines = [("You are beautiful", 150), ("inside and out,", 200), ("your smile is precious", 110), ("and never stop being happy.", 70)]
y = 270
for text, x in lines:
    # draw twice, offset by a pixel, for a marker-thick stroke
    for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)):
        d.text((x + dx, y + dy), text, font=font, fill=RED)
    y += 98
# heart to the right of line 2
hx, hy, r = 740, 395, 24
d.ellipse((hx - 2 * r, hy - r, hx, hy + r), fill=RED)
d.ellipse((hx, hy - r, hx + 2 * r, hy + r), fill=RED)
d.polygon([(hx - 2 * r + 4, hy + 12), (hx + 2 * r - 4, hy + 12), (hx, hy + 2 * r + 22)], fill=RED)
txt = txt.rotate(7, resample=Image.BICUBIC, center=(S // 2, S // 2))

card = Image.new("RGBA", (S, S), (250, 250, 248, 255))
card.alpha_composite(txt)
card = card.crop((0, 190, S, 730))   # trim the blank top/bottom so the writing is bigger on a phone
CH = card.size[1]

# shadow + margin, then a small tilt of the whole card
M = 90
out = Image.new("RGBA", (S + 2 * M, CH + 2 * M), (0, 0, 0, 0))
sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
ImageDraw.Draw(sh).rectangle((M + 10, M + 16, M + S + 10, M + CH + 16), fill=(0, 0, 0, 120))
out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(22)))
out.alpha_composite(card, (M, M))
out = out.rotate(-4, resample=Image.BICUBIC, expand=True)
out.save(os.path.join(HERE, "note.png"))
print(fp, out.size)
