# Render Tal's title pill as a transparent PNG.
#
# ffmpeg's drawtext can only draw a hard-edged rectangle; Tal's own reels use a
# ROUNDED white pill with a soft shadow. PIL gives us that, plus proper
# multi-line centring.
#
# EMOJI: Arial Bold has no emoji glyphs, so a flag renders as empty boxes. Each
# line is split into text runs and emoji runs, and each run is drawn with its
# own font (Segoe UI Emoji, in colour).
#
#   python scripts/make-title.py "LINE ONE\nLINE TWO 🇮🇱" out.png [size]
import sys, json, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter

text = sys.argv[1]
out = sys.argv[2]
SIZE = int(sys.argv[3]) if len(sys.argv) > 3 else 52
FONT = "C:/Windows/Fonts/arialbd.ttf"
EMOJI = "C:/Windows/Fonts/seguiemj.ttf"
PAD_X, PAD_Y, RADIUS, GAP = 38, 26, 30, 12
MAXW = 1000                      # must fit inside a 1080 frame

EMOJI_RE = re.compile(
    "([\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF\U0000FE0F\U00002190-\U000021FF]+)")


# --- FLAGS ---------------------------------------------------------------
# PIL has no HarfBuzz (raqm=False), so a flag emoji - which is a PAIR of
# regional-indicator codepoints - cannot be shaped and renders as the letters
# "JM" / "IL". Drawing the few flags Tal actually uses is exact and reliable.
FLAG_CODE = {"🇯🇲": "JM", "🇮🇱": "IL",
             "🇵🇸": "PS", "🇺🇸": "US",
             "🇲🇦": "MA", "🇦🇪": "AE",
             # plain stripe flags (street-oct10, 2026-10-10) - see STRIPES below
             "🇺🇦": "UA", "🇮🇩": "ID", "🇧🇪": "BE", "🇫🇷": "FR", "🇷🇴": "RO", "🇳🇬": "NG",
             "🇵🇱": "PL", "🇮🇷": "IR", "🇪🇹": "ET", "🇻🇪": "VE"}
# (direction, colours). IR / ET / VE are drawn WITHOUT their centre emblem or
# stars: at title size it is a few pixels, and a wrong emblem is worse than none.
STRIPES = {"UA": ("h", [(0, 87, 183), (255, 215, 0)]), "ID": ("h", [(206, 17, 38), (255, 255, 255)]),
           "PL": ("h", [(255, 255, 255), (220, 20, 60)]), "IR": ("h", [(35, 159, 64), (255, 255, 255), (218, 0, 0)]),
           "ET": ("h", [(7, 137, 48), (252, 221, 9), (218, 18, 26)]), "VE": ("h", [(255, 204, 0), (0, 36, 125), (207, 20, 43)]),
           "BE": ("v", [(0, 0, 0), (253, 218, 36), (239, 51, 64)]), "FR": ("v", [(0, 85, 164), (255, 255, 255), (239, 65, 53)]),
           "RO": ("v", [(0, 43, 127), (252, 209, 22), (206, 17, 38)]), "NG": ("v", [(0, 135, 81), (255, 255, 255), (0, 135, 81)])}

def draw_flag(code, h):
    """Return an RGBA flag image of height h."""
    w = int(h * 1.5)
    im = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    d2 = ImageDraw.Draw(im)
    if code in STRIPES:
        way, cols = STRIPES[code]
        for k, c in enumerate(cols):
            a, b2 = k / len(cols), (k + 1) / len(cols)
            d2.rectangle([0, h * a, w, h * b2] if way == "h" else [w * a, 0, w * b2, h], fill=c + (255,))
        d2.rectangle([0, 0, w - 1, h - 1], outline=(0, 0, 0, 60))
    elif code == "JM":
        d2.rectangle([0, 0, w, h], fill=(0, 0, 0, 255))
        d2.polygon([(0, 0), (w, 0), (w / 2, h / 2)], fill=(0, 155, 58, 255))
        d2.polygon([(0, h), (w, h), (w / 2, h / 2)], fill=(0, 155, 58, 255))
        d2.line([(0, 0), (w, h)], fill=(254, 209, 0, 255), width=max(2, h // 7))
        d2.line([(0, h), (w, 0)], fill=(254, 209, 0, 255), width=max(2, h // 7))
    elif code == "IL":
        b = (0, 56, 184, 255)
        d2.rectangle([0, h * 0.12, w, h * 0.24], fill=b)
        d2.rectangle([0, h * 0.76, w, h * 0.88], fill=b)
        cx, cy, r = w / 2, h / 2, h * 0.21
        lw = max(2, int(h * 0.055))
        import math
        def tri(rot):
            pts = [(cx + r * math.sin(math.radians(rot + a)), cy - r * math.cos(math.radians(rot + a))) for a in (0, 120, 240)]
            d2.line(pts + [pts[0]], fill=b, width=lw, joint="curve")
        tri(0); tri(180)
    else:
        d2.rectangle([0, 0, w, h], fill=(200, 200, 200, 255))
    return im

def runs(line):
    return [(p, bool(EMOJI_RE.fullmatch(p))) for p in EMOJI_RE.split(line) if p]

lines = text.split("\n")
probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))

def measure(size):
    f = ImageFont.truetype(FONT, size)
    try:
        fe = ImageFont.truetype(EMOJI, size)
    except Exception:
        fe = f
    widths, heights = [], []
    for ln in lines:
        w = 0
        for part, is_e in runs(ln):
            if is_e and part in FLAG_CODE:
                w += int(size * 1.5) + 10
            else:
                b = probe.textbbox((0, 0), part, font=(fe if is_e else f), embedded_color=is_e)
                w += b[2] - b[0]
        widths.append(w)
        hb = probe.textbbox((0, 0), EMOJI_RE.sub("", ln).strip() or "X", font=f)
        heights.append(hb[3] - hb[1])
    return f, fe, widths, heights

# shrink until the pill fits the frame
size = SIZE
while size > 30:
    f, fe, widths, heights = measure(size)
    if max(widths) + PAD_X * 2 <= MAXW:
        break
    size -= 2

box_w = max(widths) + PAD_X * 2
box_h = sum(heights) + GAP * (len(lines) - 1) + PAD_Y * 2

# A white pill on a BRIGHT frame disappears. On "what makes you happy" the
# card sits over a sun-lit stone street and Tal could not see it at all.
# It now carries a real drop shadow (blurred, offset) plus a thin dark edge,
# so the card separates from anything behind it — bright stone, white shirts,
# blown-out sky. The card itself stays white with black text; only its
# SEPARATION from the background changed.
MARGIN = 40
img = Image.new("RGBA", (box_w + MARGIN * 2, box_h + MARGIN * 2), (0, 0, 0, 0))

shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
ds = ImageDraw.Draw(shadow)
ds.rounded_rectangle([MARGIN - 2, MARGIN + 4, box_w + MARGIN + 2, box_h + MARGIN + 10],
                     RADIUS, fill=(0, 0, 0, 150))
shadow = shadow.filter(ImageFilter.GaussianBlur(9))
img.alpha_composite(shadow)

d = ImageDraw.Draw(img)
# thin dark edge so the pill still reads against pure white behind it
d.rounded_rectangle([MARGIN - 2, MARGIN - 2, box_w + MARGIN + 2, box_h + MARGIN + 2],
                    RADIUS + 2, fill=(0, 0, 0, 110))
d.rounded_rectangle([MARGIN, MARGIN, box_w + MARGIN, box_h + MARGIN], RADIUS,
                    fill=(255, 255, 255, 252))

y = MARGIN + PAD_Y
for ln, w, h in zip(lines, widths, heights):
    x = MARGIN + (box_w - w) / 2
    base = probe.textbbox((0, 0), EMOJI_RE.sub("", ln).strip() or "X", font=f)
    for part, is_e in runs(ln):
        fnt = fe if is_e else f
        if is_e and part in FLAG_CODE:
            fh = int(size * 0.78)
            fl = draw_flag(FLAG_CODE[part], fh)
            img.alpha_composite(fl, (int(x) + 5, int(y + (h - fh) / 2)))
            x += int(size * 1.5) + 10
            continue
        if is_e:
            d.text((x, y - base[1]), part, font=fnt, embedded_color=True)
        else:
            d.text((x, y - base[1]), part, font=fnt, fill=(17, 17, 17, 255))
        pb = probe.textbbox((0, 0), part, font=fnt, embedded_color=is_e)
        x += pb[2] - pb[0]
    y += h + GAP

img.save(out)
print(json.dumps({"w": img.width, "h": img.height, "size": size}))
