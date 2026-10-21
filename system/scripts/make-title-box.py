# THE TITLE, section 11 (Tal's master prompt, approved 2026-10-21): "a solid white
# rounded box, tight to the text, two lines. Text black, heavy condensed italic
# (Barlow Condensed Black Italic), centred, sentence case, no yellow, no emojis.
# Placed low, with the box just above the top of the speaker's head, never over
# the face or head. On screen from the first frame, no fade-in."
# This replaces make-title.py's white/yellow pill as the default title.
#
#   python scripts/make-title-box.py "Line one\nLine two" out.png [size]
# -> prints {"w":..,"h":..} of the PNG (transparent outside the box)
#
# One line given -> split into two balanced lines at a word boundary.
# Emojis are dropped (the rule says none) and the drop is reported.
import sys, os, re, json
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT = os.path.join(ROOT, "assets", "brand", "fonts", "BarlowCondensed-BlackItalic.ttf")
text, out = sys.argv[1].replace("\\n", "\n"), sys.argv[2]
SIZE = int(sys.argv[3]) if len(sys.argv) > 3 else 78
PAD_X, PAD_Y, GAP = round(SIZE * 0.36), round(SIZE * 0.2), round(SIZE * 0.06)
RADIUS = round(SIZE * 0.3)
MAXW = 960                                   # the box must fit inside a 1080 frame with a margin

EMOJI = re.compile("[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF️‍]+")
if EMOJI.search(text):
    print("title: emojis dropped (section 11: no emojis)", file=sys.stderr)
    text = EMOJI.sub("", text)
lines = [re.sub(r"\s+", " ", l).strip() for l in text.split("\n") if l.strip()]
if any(l.isupper() and len(l) > 3 for l in lines):
    print("title: written in capitals - section 11 asks for sentence case", file=sys.stderr)

font = ImageFont.truetype(FONT, SIZE)
width = lambda s: font.getbbox(s)[2] - font.getbbox(s)[0]
if len(lines) == 1:                          # two lines: split where the halves are most even
    ws = lines[0].split(" ")
    if len(ws) > 1:
        k = min(range(1, len(ws)), key=lambda i: abs(width(" ".join(ws[:i])) - width(" ".join(ws[i:]))))
        lines = [" ".join(ws[:k]), " ".join(ws[k:])]
while max(width(l) for l in lines) + 2 * PAD_X > MAXW and SIZE > 40:
    SIZE -= 2; font = ImageFont.truetype(FONT, SIZE)

# Line height from the font, not the glyphs, so "ag" and "AT" sit on the same baselines.
asc, desc = font.getmetrics()
lh = asc + desc
bw = max(width(l) for l in lines) + 2 * PAD_X
bh = len(lines) * lh + (len(lines) - 1) * GAP + 2 * PAD_Y - round(desc * 0.55)   # descenders rarely reach the box edge
im = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.rounded_rectangle([0, 0, bw - 1, bh - 1], radius=RADIUS, fill=(255, 255, 255, 255))
for i, l in enumerate(lines):
    l0 = font.getbbox(l)[0]
    x = (bw - width(l)) / 2 - l0
    d.text((x, PAD_Y + i * (lh + GAP) - round(desc * 0.2)), l, font=font, fill=(0, 0, 0, 255))
im.save(out)
print(json.dumps({"w": bw, "h": bh, "lines": lines, "size": SIZE}))
