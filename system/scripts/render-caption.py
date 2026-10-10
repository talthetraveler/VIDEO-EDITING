# RENDER A CAPTION AS A PNG — bold WHITE uppercase, heavy black stroke.
#
# 2026-09-24: WHITE IS THE DEFAULT. Tal's own written standard says "bold,
# uppercase, white sans-serif text with a dark outline or shadow", and his own
# cut of the coffee-shop footage is plain white throughout. The gold key word
# (from the 2026-09-23 reference screenshots) is now a HOOK-LINE device only:
# it is applied when the caller passes an explicit "key_index", or
# "emphasis": true to let this file pick the word. Never automatically.
#
# Tal, 2026-09-23, pointing at three reference reels: *"use the format of
# captions from the middle picture ... you see how it's big and nice."*
# Those are the Hormozi/Steve-O style: heavy uppercase, WHITE body, ONE word
# per line lifted in yellow, and a black stroke thick enough to hold on any
# background.
#
# WHY A PNG AND NOT drawtext. ffmpeg's drawtext takes a single fontcolor for
# the whole string, so a gold word inside a white line is impossible without
# computing each word's x by hand and stacking filters. PIL can measure and
# draw the line in one pass, and an overlay of a pre-rendered RGBA PNG is
# cheaper in the filter graph than N drawtext calls.
#
# stdin:  [{"text": "I THINK IT'S A LOT", "key": "LOT"}, ...]
# argv:   <outdir> <maxw> <basesize>
# stdout: [{"file": "...png", "w": 812, "h": 240}, ...]
import sys, json, os, re
from PIL import Image, ImageDraw, ImageFont

OUT   = sys.argv[1]
MAXW  = int(sys.argv[2]) if len(sys.argv) > 2 else 980
BASE  = int(sys.argv[3]) if len(sys.argv) > 3 else 96

FONT_PATH = "C:/Windows/Fonts/ariblk.ttf"      # Arial Black — the heaviest stock face
# STYLE "gothic" - Tal, 2026-10-05, shown six looks on one still: "caption 5".
# Century Gothic Bold (rounded geometric), still WHITE uppercase with a dark
# outline, and broken about TWO WORDS A LINE ("I ACTUALLY / BEAT CANCER").
# Opt-in per project: edit.json "captionStyle": "gothic".
GOTHIC_PATH = "C:/Windows/Fonts/GOTHICB.TTF"
WHITE  = (255, 255, 255, 255)
GOLD   = (245, 197, 66, 255)
STROKE = (0, 0, 0, 255)
SHADOW = (0, 0, 0, 150)

# Words never worth lifting — an emphasised "THE" looks like a mistake.
STOP = set(("A AN THE AND OR BUT TO OF IN ON AT FOR FROM WITH IS ARE WAS WERE BE "
            "I YOU HE SHE IT WE THEY ME HIM HER THEM US MY YOUR HIS ITS OUR THEIR "
            "THIS THAT SO DO DOES DID HAVE HAS HAD WILL WOULD CAN COULD NOT JUST "
            "IF AS BY UP OUT NO YES OK OKAY").split())

_cache = {}
_FACE = [FONT_PATH]          # the face in force for the caption being drawn
def font(sz):
    k = (_FACE[0], sz)
    if k not in _cache:
        _cache[k] = ImageFont.truetype(_FACE[0], sz)
    return _cache[k]

def two_per_line(words, f, maxw):
    """Style "gothic": break a short caption two words a line.
    2 words -> one line; 3 -> 2+1, or 1+2 when the second word points forward
    ("TO", "THE", "MY" must not end a line); 4 -> 2+2. Longer captions, or a
    line that does not fit, return None and the greedy wrap decides."""
    n = len(words)
    if n <= 2:
        cand = [words]
    elif n == 3:
        # three short words read better whole ("WE ARE BROTHERS") than as 1+2
        sp = wordw(" ", f)
        if sum(wordw(w, f) for w in words) + sp * 2 <= maxw * 0.78:
            return [words]
        bare = re.sub(r"[^A-Z0-9']", "", words[1].upper())
        cand = [words[:1], words[1:]] if bare in STOP else [words[:2], words[2:]]
    elif n == 4:
        cand = [words[:2], words[2:]]
    else:
        return None
    space = wordw(" ", f)
    for ln in cand:
        if sum(wordw(w, f) for w in ln) + space * (len(ln) - 1) > maxw:
            return None
    return cand

def wordw(w, f):
    return f.getbbox(w)[2] - f.getbbox(w)[0]

def pick_key(words):
    """The word the line is about: longest non-stopword, ties go to the later one
    (a payoff usually lands at the end of the line)."""
    best, bi = None, -1
    for i, w in enumerate(words):
        bare = re.sub(r"[^A-Z0-9']", "", w.upper())
        if not bare or bare in STOP or len(bare) < 4:
            continue
        if best is None or len(bare) >= len(best):
            best, bi = bare, i
    return bi

def layout(words, f, maxw):
    """Greedy wrap to at most 2 lines. Returns list[list[word]] or None."""
    space = wordw(" ", f)
    lines, cur, curw = [], [], 0
    for w in words:
        ww = wordw(w, f)
        add = ww + (space if cur else 0)
        if cur and curw + add > maxw:
            lines.append(cur); cur, curw = [w], ww
        else:
            cur.append(w); curw += add
    if cur: lines.append(cur)
    return lines if len(lines) <= 2 else None

def forced(parts, f, maxw):
    """An explicit break ("A\\nB", from a merge of two spoken lines): keep it
    if both parts fit on their own line, else None (the greedy wrap decides)."""
    if len(parts) != 2:
        return None
    space = wordw(" ", f)
    for p in parts:
        if sum(wordw(w, f) for w in p) + space * (len(p) - 1) > maxw:
            return None
    return parts

# SECOND LINE (street-oct10, 2026-10-10). Tal: "add captions under in Arabic that
# are small." An item may carry "sub": a translation drawn BELOW the English at
# 58% of its size, white, same stroke. PIL here has no raqm, so Arabic is shaped
# with arabic_reshaper and ordered with python-bidi before drawing.
SUB_FONT = "C:/Windows/Fonts/arialbd.ttf"
def shape_sub(t):
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(t))
    except Exception:
        return t

def render(text, key_idx, idx, style=None, sub=None):
    _FACE[0] = GOTHIC_PATH if style == "gothic" else FONT_PATH
    words = [w for w in re.split(r"\s+", text.strip()) if w]
    if not words:
        return None
    parts = [[w for w in re.split(r"\s+", p.strip()) if w] for p in text.strip().split("\n")]
    parts = [p for p in parts if p]
    size = BASE
    lines = None
    # a break between two spoken lines wins ("YUSUF ARE YOU MUSLIM? / YES", not
    # "YUSUF ARE YOU / MUSLIM? YES") as long as it fits at >= 68% of the base
    # size; below that, legibility beats grammar and the greedy wrap decides.
    while len(parts) == 2 and size >= max(46, round(BASE * 0.68)):
        lines = forced(parts, font(size), MAXW)
        if lines:
            break
        size -= 4
    if not lines:
        size = BASE
    if not lines and style == "gothic" and len(parts) < 2:
        lines = two_per_line(words, font(size), MAXW)
    while not lines and size >= 46:
        f = font(size)
        lines = layout(words, f, MAXW)
        if lines:
            break
        size -= 4
    if not lines:
        f = font(46); lines = [words]

    f = font(size)
    space = wordw(" ", f)
    stroke = max(6, round(size * 0.10))
    asc, desc = f.getmetrics()
    lh = asc + desc
    gap = round(size * 0.14)
    W = MAXW + stroke * 4
    H = len(lines) * lh + (len(lines) - 1) * gap + stroke * 4
    sub_f = None
    if sub:
        ss_ = max(36, round(size * 0.72))
        sub_t = shape_sub(sub.strip())
        while ss_ > 24:
            sub_f = ImageFont.truetype(SUB_FONT, ss_)
            if sub_f.getlength(sub_t) <= MAXW:
                break
            ss_ -= 2
        sa, sd = sub_f.getmetrics()
        H += sa + sd + gap
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    n = 0
    y = stroke * 2
    for ln in lines:
        lw = sum(wordw(w, f) for w in ln) + space * (len(ln) - 1)
        x = (W - lw) // 2
        for w in ln:
            col = GOLD if n == key_idx else WHITE
            # soft drop shadow first, then the stroked glyph
            d.text((x + 3, y + 4), w, font=f, fill=SHADOW,
                   stroke_width=stroke, stroke_fill=(0, 0, 0, 110))
            d.text((x, y), w, font=f, fill=col,
                   stroke_width=stroke, stroke_fill=STROKE)
            x += wordw(w, f) + space
            n += 1
        y += lh + gap

    if sub_f is not None:
        sst = max(4, round(sub_f.size * 0.10))
        sx = (W - sub_f.getlength(sub_t)) // 2
        d.text((sx + 2, y + 3), sub_t, font=sub_f, fill=SHADOW, stroke_width=sst, stroke_fill=(0, 0, 0, 110))
        d.text((sx, y), sub_t, font=sub_f, fill=WHITE, stroke_width=sst, stroke_fill=STROKE)

    img = img.crop(img.getbbox() or (0, 0, W, H))
    path = os.path.join(OUT, f"cap_{idx:04d}.png")
    img.save(path)
    return {"file": path.replace("\\", "/"), "w": img.width, "h": img.height, "size": size}


# ============================================================ STYLE "nas"
# The Social Accords NAS-style look — MEASURED 2026-09-27 off frames of his own
# MATTHEW NO LIMITS and OUR BIG KITCHEN (formats/nas-explainer.md), not guessed:
#
#   - sentence case, exactly as spoken. Never uppercased.
#   - a narrow sans at regular weight — tall letters, not heavy. Bahnschrift
#     ships with Windows. Its width was MEASURED against theirs, not eyeballed:
#     matching their letter height, SemiCondensed lands within 5% of their
#     width (paycheck 96%, Coffee shop 94.5%). Condensed was 17-20% too narrow
#     - the first attempt used it and visibly squeezed every word.
#   - NO outline. A soft blurred drop shadow only.
#   - white body; the key phrase in GOLD #FACC27 (sampled: #F7CB30..#FACC27
#     across four frames) and ~1.4x LARGER, on its own line below:
#         a real            No Limits
#         paycheck          Coffee shop
#     1.4x comes from paycheck / Coffee shop. The Holocaust frame measured
#     bigger, but its "gold" included the yellow BIG logo on the host's cap.
#   - a number is its own big BOLD white line, the words small beneath:
#         300,000
#         meals
#
# Gold is never automatic — about half their captions have no gold at all.
# The caller names the phrase ("key": "Coffee shop"); otherwise it is white.
NAS_FONT = "C:/Windows/Fonts/bahnschrift.ttf"
NAS_GOLD = (0xFA, 0xCC, 0x27, 255)
NAS_KEY_SCALE = 1.4
NAS_NUM_SCALE = 1.6
_nas_cache = {}

def nas_font(sz, style="SemiCondensed"):
    k = (sz, style)
    if k not in _nas_cache:
        f = ImageFont.truetype(NAS_FONT, sz)
        names = f.get_variation_names()
        want = [n for n in names if (n.decode() if isinstance(n, bytes) else n) == style]
        if want:
            f.set_variation_by_name(want[0])
        _nas_cache[k] = f
    return _nas_cache[k]

NUMBER = re.compile(r"^[$€£]?\d[\d,.]*[%+]?$")

def nas_span(words, key):
    """Word index range [i, j) of the key phrase, matched case-insensitively
    and ignoring punctuation. None if absent."""
    if not key:
        return None
    norm = lambda w: re.sub(r"[^\w']", "", w).lower()
    kw = [norm(w) for w in key.split() if norm(w)]
    ws = [norm(w) for w in words]
    for i in range(len(ws) - len(kw) + 1):
        if ws[i:i + len(kw)] == kw:
            return (i, i + len(kw))
    return None

def render_nas(text, key, idx):
    words = [w for w in re.split(r"\s+", text.strip()) if w]
    if not words:
        return None
    base = BASE
    for _ in range(12):                       # shrink until every line fits
        white = nas_font(base, "SemiCondensed")
        gold = nas_font(round(base * NAS_KEY_SCALE), "SemiCondensed")
        num = nas_font(round(base * NAS_NUM_SCALE), "Bold SemiCondensed")
        span = nas_span(words, key)
        lines = []                            # list of [(word, font, colour)]
        if span and span[1] == len(words) and span[0] > 0:
            # key at the end -> white line, then the gold line beneath it
            lines.append([(w, white, WHITE) for w in words[:span[0]]])
            lines.append([(w, gold, NAS_GOLD) for w in words[span[0]:]])
        elif span:
            # key first or mid-line -> one line, mixed sizes on a shared baseline
            lines.append([(w, gold if span[0] <= i < span[1] else white,
                           NAS_GOLD if span[0] <= i < span[1] else WHITE)
                          for i, w in enumerate(words)])
        elif NUMBER.match(words[0]) and len(words) > 1:
            lines.append([(words[0], num, WHITE)])
            lines.append([(w, white, WHITE) for w in words[1:]])
        elif len(words) == 1 and NUMBER.match(words[0]):
            lines.append([(words[0], num, WHITE)])
        else:
            lines.append([(w, white, WHITE) for w in words])
        widths = [sum(wordw(w, f) for w, f, _ in ln) +
                  wordw(" ", ln[0][1]) * (len(ln) - 1) for ln in lines]
        if max(widths) <= MAXW:
            break
        base = int(base * 0.9)

    pad = round(base * 0.35)
    metrics = [max(f.getmetrics()[0] for _, f, _ in ln) for ln in lines]      # ascent
    descs = [max(f.getmetrics()[1] for _, f, _ in ln) for ln in lines]
    gap = round(base * 0.02)
    W = max(widths) + pad * 2
    H = sum(a + d for a, d in zip(metrics, descs)) + gap * (len(lines) - 1) + pad * 2
    txt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shd = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dt, ds = ImageDraw.Draw(txt), ImageDraw.Draw(shd)
    y = pad
    for ln, lw, asc, desc in zip(lines, widths, metrics, descs):
        x = (W - lw) // 2
        sp = wordw(" ", ln[0][1])
        for w, f, col in ln:
            yy = y + asc - f.getmetrics()[0]   # shared baseline across sizes
            ds.text((x, yy + max(2, base // 24)), w, font=f, fill=(0, 0, 0, 200))
            dt.text((x, yy), w, font=f, fill=col)
            x += wordw(w, f) + sp
        y += asc + desc + gap
    from PIL import ImageFilter
    # TWO shadows, still no outline. The soft wide one is their look; alone it
    # failed on a bright busy background (white words over a white Stitch
    # blanket went grey-on-white in the first real render). A tight second
    # shadow hugging the glyphs restores the edge without drawing a stroke.
    wide = shd.filter(ImageFilter.GaussianBlur(max(3, base // 14)))
    tight = shd.filter(ImageFilter.GaussianBlur(max(1, base // 45)))
    img = Image.alpha_composite(Image.alpha_composite(wide, tight), txt)
    img = img.crop(img.getbbox() or (0, 0, W, H))
    path = os.path.join(OUT, f"cap_{idx:04d}.png")
    img.save(path)
    return {"file": path.replace("\\", "/"), "w": img.width, "h": img.height, "size": base}

def main():
    os.makedirs(OUT, exist_ok=True)
    items = json.loads(sys.stdin.buffer.read().decode("utf-8"))   # never the console codepage: Arabic arrived as mojibake
    res = []
    for i, it in enumerate(items):
        if isinstance(it, dict) and it.get("style") == "nas":
            # sentence case preserved - see the "nas" block above
            res.append(render_nas(it["text"], it.get("key"), i))
            continue
        text = (it["text"] if isinstance(it, dict) else str(it)).upper()
        words = [w for w in re.split(r"\s+", text.strip()) if w]
        # White by default. Gold only on explicit request — see the header.
        key = it.get("key_index") if isinstance(it, dict) else None
        if key is None:
            key = pick_key(words) if (isinstance(it, dict)
                                      and it.get("emphasis")) else -1
        res.append(render(text, key, i, it.get("style") if isinstance(it, dict) else None,
                          it.get("sub") if isinstance(it, dict) else None))
    print(json.dumps(res))

if __name__ == "__main__":
    main()
