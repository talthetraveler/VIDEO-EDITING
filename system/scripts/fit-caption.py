# Measure caption widths with the ACTUAL font and make each one fit the frame.
# Guessing at character widths is what put "LOST EVERYTHING, SOMEONE" off the
# edge of a 1080px frame.
#
# WRAP FIRST, SHRINK LAST. This used to only shrink — down to 44px — so a
# caption long enough to say something whole came out half the size of a short
# one. Tal: *"the captions should be big when he's speaking"*, and the fix for
# fragments like "TELL ME HOW YOU" was to let lines run longer, which made the
# shrinking worse. A second line at full size reads far better than one line at
# 48px, so the order is now: try full size on one line, then full size on two,
# and only shrink if even two lines will not fit.
#
# stdin:  ["CAPTION ONE", ...]
# stdout: [{"size": 78, "text": "CAPTION\nONE"}, ...]   (text may gain a \n)
import sys, json
from PIL import ImageFont, ImageDraw, Image

MAXW = int(sys.argv[1]) if len(sys.argv) > 1 else 980   # 1080 minus safe margins
BASE = int(sys.argv[2]) if len(sys.argv) > 2 else 78
FONT = "C:/Windows/Fonts/arialbd.ttf"

texts = json.loads(sys.stdin.read())
d = ImageDraw.Draw(Image.new("RGB", (10, 10)))
cache = {}

def font(size):
    if size not in cache:
        cache[size] = ImageFont.truetype(FONT, size)
    return cache[size]

def width(s, size):
    b = d.textbbox((0, 0), s, font=font(size))
    return b[2] - b[0]

def wrap2(t, size):
    """Best two-line split, or None if no split fits. Balances the lines so a
    caption never breaks as one long line over one short word."""
    words = t.split(" ")
    if len(words) < 2:
        return None
    best, bestScore = None, None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        wa, wb = width(a, size), width(b, size)
        if wa > MAXW or wb > MAXW:
            continue
        score = abs(wa - wb)          # prefer the most even break
        if bestScore is None or score < bestScore:
            best, bestScore = a + "\n" + b, score
    return best

out = []
for t in texts:
    if width(t, BASE) <= MAXW:
        out.append({"size": BASE, "text": t})
        continue
    two = wrap2(t, BASE)
    if two:
        out.append({"size": BASE, "text": two})
        continue
    # Genuinely too long for two lines at full size: shrink, still wrapping.
    size = BASE
    while size > 44:
        size -= 2
        if width(t, size) <= MAXW:
            out.append({"size": size, "text": t})
            break
        two = wrap2(t, size)
        if two:
            out.append({"size": size, "text": two})
            break
    else:
        out.append({"size": 44, "text": wrap2(t, 44) or t})
print(json.dumps(out))
