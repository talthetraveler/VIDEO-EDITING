"""TITLE / COUNTER LABEL as a transparent PNG: heavy uppercase, black stroke,
per-word colour. Used by title-captions.mjs.

stdin:  [{"lines": [[["DAY 1", "yellow"], ["OF ASKING", "white"]], ...], "size": 70, "maxw": 960, "file": "x.png"}]
stdout: [{"file":..., "w":..., "h":...}]
"""
import json, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT = "C:/Users/taldo/Downloads/videos to edit/system/assets-fonts/Montserrat.ttf"
COL = {"white": (255, 255, 255, 255), "yellow": (255, 232, 40, 255),
       "red": (255, 59, 48, 255), "green": (52, 211, 89, 255)}

def font(sz):
    f = ImageFont.truetype(FONT, sz)
    f.set_variation_by_name("ExtraBold")
    return f

res = []
for it in json.load(sys.stdin):
    sz = it.get("size", 70)
    while True:
        f = font(sz); sp = f.getlength(" ")
        widths = [sum(f.getlength(t) for t, _ in ln) + sp * (len(ln) - 1) for ln in it["lines"]]
        if max(widths) <= it.get("maxw", 960) or sz <= 30: break
        sz -= 2
    st = max(4, round(sz * 0.11)); lh = round(sz * 1.18); pad = st + 14
    W = int(max(widths)) + pad * 2; H = lh * len(it["lines"]) + pad * 2
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for layer, shadow in ((sh, True), (im, False)):
        d = ImageDraw.Draw(layer)
        for i, ln in enumerate(it["lines"]):
            x = (W - widths[i]) / 2; y = pad + i * lh
            for t, c in ln:
                if shadow: d.text((x + 3, y + 5), t, font=f, fill=(0, 0, 0, 170), stroke_width=st, stroke_fill=(0, 0, 0, 170))
                else: d.text((x, y), t, font=f, fill=COL[c], stroke_width=st, stroke_fill=(0, 0, 0, 255))
                x += f.getlength(t) + sp
    out = Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)), im)
    out.save(it["file"]); res.append({"file": it["file"], "w": W, "h": H})
print(json.dumps(res))
