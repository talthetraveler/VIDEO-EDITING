# Put the Elie Wiesel caption style into a story build (LESSONS 119) and turn the music down.
#   python wieselcaps.py <build dir> [music dB, default -3]
# Captions: Inter 800 62px sentence case, white, soft shadow, phrase at once, dark on a light page; none while a
# title/card is up; a phrase prefixed "~" in TEXT is timed but not shown.
import sys, re, subprocess, os
d = sys.argv[1]
db = float(sys.argv[2]) if len(sys.argv) > 2 else -3.0
p = os.path.join(d, "build.py")
s = open(p, encoding="utf-8").read()
NEW = '''HIDE = [(s_[0], s_[1]) for s_ in shots if "title:" in s_[5] or "card:" in s_[5]]      # the words are already on screen as a title
caps = []
for seg, g in SEQ:
    if not TEXT[seg]:
        continue
    phrases = [p.strip() for p in TEXT[seg].split("|")]
    ws = WORDS[seg]
    total = sum(len(re.sub(r"[*\u201c\u201d~]", "", p).split()) for p in phrases)
    idx = 0
    for p in phrases:
        n_ = len(p.split())
        j = min(len(ws) - 1, round(idx * len(ws) / total))
        t_ = T[seg][0] + ws[j]["start"]
        key = next((T[seg][0] + ws[min(len(ws) - 1, round((idx + q) * len(ws) / total))]["start"] for q, wd in enumerate(p.split()) if "*" in wd), None)
        idx += n_
        if p.startswith("~") or any(a_ - 0.15 <= t_ < b_ for a_, b_ in HIDE):
            continue
        p_ = re.sub(r"[“”\ufffd~]", "", p).strip()
        if "*" in p_:                                  # the key words (from the star on) go gold, like their newest reels
            p_ = p_.split("*", 1)[0] + '<span class="k">' + p_.split("*", 1)[1].replace("*", "") + "</span>"
        caps.append([t_, p_, seg, key])
caps.sort(key=lambda c: c[0])
for i in range(1, len(caps)):          # two phrases can never share a start (Whisper sometimes hears fewer words)
    caps[i][0] = max(caps[i][0], caps[i - 1][0] + 0.35)
for i, (a, txt, seg, key) in enumerate(caps):
    nxt = caps[i + 1][0] if i + 1 < len(caps) else VOICE_END
    b = min(nxt - 0.03, T[seg][1] + 0.25, T[seg][2] - 0.02, a + 2.6)
    b = min([b] + [a_ - 0.02 for a_, b_ in HIDE if a_ > a])
    sh_ = next((s_ for s_ in shots if s_[0] <= a + 0.05 < s_[1]), shots[0])
    art_ = ART[0] - 0.05 <= a < ART[1] - 0.05
    dark = art_ or (sh_[3] == "paper.jpg" and "map" not in sh_[5]) or sh_[4] == "inset"
    y_ = 1560 if (art_ or "caplow" in sh_[5]) else 1322
    txt = txt.replace("'", "&rsquo;")
    h.append(f'      <div id="c{i}" class="clip" data-start="{a:.2f}" data-duration="{max(0.25, b - a):.2f}" data-track-index="5"><div class="capx{" dk" if dark else ""}" style="top:{y_}px" id="ct{i}">{txt}</div></div>')
    tl.append(f'tl.fromTo("#ct{i}", {{opacity:0, y:14, scale:0.96}}, {{opacity:1, y:0, scale:1, duration:0.10, ease:"power2.out"}}, {a:.2f});')
    if key:
        sfx.append((key, "boomshort", 1.0))
'''
CSS = '''      .capx { position: absolute; left: 90px; width: 900px; text-align: center; font: 800 62px/1.14 "Inter", Arial, sans-serif; letter-spacing: -0.035em; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,.6), 0 0 44px rgba(0,0,0,.45); text-transform: none; -webkit-text-stroke: 0; }
      .capx.dk { color: #16130f; text-shadow: none; }
      .capx .k { color: #FACC27; }
      .capx.dk .k { color: #c8102e; }
'''
a = s.index("HIDE = [") if "HIDE = [" in s else s.index("caps = []\n")
m = re.search(r"for seg, g in SEQ:\n    if seg(?: in WHO|\.startswith)", s[a:])
s = s[:a] + NEW + s[a + m.start():]
if "      .capx { position" in s:
    x = s.index("      .capx { position"); y = s.index("      .tagchip {", x)
    s = s[:x] + CSS + s[y:]
else:                                        # the older engine: add the class after the stylesheet is read
    m = re.search(r"^css = .*$", s, re.M)
    s = s[:m.end()] + "\ncss += '''\n" + CSS + "'''" + s[m.end():]
if "ART = " not in s:
    s = s.replace("caps = []\nfor seg, g in SEQ:", "ART = (-9, -9)\ncaps = []\nfor seg, g in SEQ:", 1)
s = s.replace('src="sfx/music.wav"', 'src="sfx/music_lo.wav"')
open(p, "w", encoding="utf-8", newline="").write(s)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(d, "sfx/music.wav"), "-af", f"volume={db}dB", os.path.join(d, "sfx/music_lo.wav")], check=True)
print("patched", d)
