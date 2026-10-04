# Caption style options for Tal (2026-10-04): "make the captions a little bit
# more aesthetic ... two words per line, or a little bit different font. You
# can put different font options." One still, six looks, same words.
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
base = Image.open(sys.argv[1]).convert("RGB")
W, H = base.size
F = "C:/Windows/Fonts/"
OPTS = [
    ("1  CURRENT", F + "ariblk.ttf", 94, ["I ACTUALLY BEAT", "CANCER"], False, None),
    ("2  TWO WORDS A LINE", F + "ariblk.ttf", 104, ["I ACTUALLY", "BEAT CANCER"], False, None),
    ("3  CONDENSED", F + "impact.ttf", 128, ["I ACTUALLY", "BEAT CANCER"], False, None),
    ("4  CLEAN / MODERN", F + "seguibl.ttf", 104, ["I ACTUALLY", "BEAT CANCER"], False, None),
    ("5  ROUNDED GEOMETRIC", F + "GOTHICB.TTF", 110, ["I ACTUALLY", "BEAT CANCER"], False, None),
    ("6  KEY WORD IN GOLD", F + "ariblk.ttf", 104, ["I ACTUALLY", "BEAT CANCER"], False, "CANCER"),
]
GOLD = (245, 197, 66)
def card(label, font_path, size, lines, lower, gold):
    im = base.copy()
    font = ImageFont.truetype(font_path, size)
    stroke = max(4, round(size * 0.10))
    # soft shadow layer
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ds = ImageDraw.Draw(sh)
    d = ImageDraw.Draw(im)
    lh = int(size * 1.16)
    y0 = int(H * 0.66) - lh * len(lines) // 2
    for i, line in enumerate(lines):
        words = line.split(" ")
        widths = [d.textlength(w + (" " if k < len(words) - 1 else ""), font=font) for k, w in enumerate(words)]
        x = (W - sum(widths)) / 2
        y = y0 + i * lh
        for w, ww in zip(words, widths):
            ds.text((x + 4, y + 6), w, font=font, fill=(0, 0, 0, 170), stroke_width=stroke, stroke_fill=(0, 0, 0, 170))
            x += ww
    im = Image.alpha_composite(im.convert("RGBA"), sh.filter(ImageFilter.GaussianBlur(7))).convert("RGB")
    d = ImageDraw.Draw(im)
    for i, line in enumerate(lines):
        words = line.split(" ")
        widths = [d.textlength(w + (" " if k < len(words) - 1 else ""), font=font) for k, w in enumerate(words)]
        x = (W - sum(widths)) / 2
        y = y0 + i * lh
        for w, ww in zip(words, widths):
            d.text((x, y), w, font=font, fill=GOLD if gold and w == gold else (255, 255, 255), stroke_width=stroke, stroke_fill=(0, 0, 0))
            x += ww
    lab = ImageFont.truetype(F + "arialbd.ttf", 54)
    d.rectangle([0, 0, W, 96], fill=(0, 0, 0))
    d.text((28, 18), label, font=lab, fill=(255, 255, 255))
    return im.resize((W // 3, H // 3), Image.LANCZOS)
cards = [card(*o) for o in OPTS]
cw, ch = cards[0].size
sheet = Image.new("RGB", (cw * 3 + 20, ch * 2 + 10), (20, 20, 20))
for i, c in enumerate(cards):
    sheet.paste(c, ((i % 3) * (cw + 10), (i // 3) * (ch + 10)))
sheet.save(sys.argv[2], quality=90)
print(sheet.size)
