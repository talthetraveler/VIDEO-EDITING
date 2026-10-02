# RENDER-STICKER — one emoji as a transparent PNG, for the sticker layer.
#
#   python scripts/render-sticker.py <out.png> <emoji> [size_px=190]
#
# Erez-style: an emoji sticker placed on the subject's BODY at the reaction
# beat (never over a face). Colour glyphs come from Segoe UI Emoji, the same
# font make-title.py uses for flags. Prints "w h" of the PNG.
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

out, emoji = sys.argv[1], sys.argv[2]
size = int(sys.argv[3]) if len(sys.argv) > 3 else 190
font = ImageFont.truetype("C:/Windows/Fonts/seguiemj.ttf", size)
pad = int(size * 0.18)
probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
b = probe.textbbox((0, 0), emoji, font=font, embedded_color=True)
w, h = b[2] - b[0] + 2 * pad, b[3] - b[1] + 2 * pad
glyph = Image.new("RGBA", (w, h), (0, 0, 0, 0))
ImageDraw.Draw(glyph).text((pad - b[0], pad - b[1]), emoji, font=font, embedded_color=True)
# soft drop shadow so it reads on a bright street
alpha = glyph.split()[3]
shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
shadow.putalpha(alpha.point(lambda a: int(a * 0.45)))
shadow = shadow.filter(ImageFilter.GaussianBlur(size * 0.04))
img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
img.alpha_composite(shadow, (int(size * 0.03), int(size * 0.04)))
img.alpha_composite(glyph)
img.save(out)
print(w, h)
