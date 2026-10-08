# One-off (2026-10-08): new hooks for the 13 stories, written against skills/ig-reel/hookscore.py (Tal: "you should be
# using one that's 10000"), plus the flow settings (hook as one take, 0.25 s between paragraphs). Rewrites story.py in place.
import re, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rehook_data import S
for slug, c in S.items():
    if len(sys.argv) > 1 and slug not in sys.argv[1:]:
        continue
    p = os.path.join(ROOT, slug, "v1", "story.py")
    s = open(p, encoding="utf-8").read()
    N = len(c["h"])
    # L: drop the old hook lines, put the new ones first
    s = re.sub(r'\n\s*\("h\d", "[^\n]*', "", s)
    s = re.sub(r'L = \[\("h\d", "[^\n]*\n', "L = [\n", s)
    lines = "".join(f'     ("h{k + 1}", "{t}"),\n' for k, (t, *_r) in enumerate(c["h"]))
    s = s.replace("L = [", f'L = [  # hook: "{c["line"]}" (ig-reel hookscore {c["score"]})\n' + lines + "     ", 1) if "L = [\n" not in s else s.replace("L = [\n", f'L = [  # hook: "{c["line"]}" (ig-reel hookscore {c["score"]})\n' + lines, 1)
    # TEXT: hidden hook captions
    s = re.sub(r'\n\s*"h1": "~[^\n]*\n', "\n    " + " ".join(f'"h{k + 1}": "~{hk[0].replace(chr(39), "&rsquo;")}",' for k, hk in enumerate(c["h"])) + "\n", s, 1)
    # SEQ: one-take hook, a breath between paragraphs
    m = re.search(r"SEQ = \[(.*?)\][^\n]*\n", s)
    segs = re.findall(r'\("(\w+)", ([\d.]+)\)', m.group(1))
    body = [f'("h{k + 1}", {0 if k < N - 1 else .30})' for k in range(N)] + [f'("{n}", {max(float(g), .25) if i < len([x for x in segs if not re.fullmatch(r"h\d", x[0])]) - 1 else float(g)})' for i, (n, g) in enumerate([x for x in segs if not re.fullmatch(r"h\d", x[0])])]
    s = s.replace(m.group(0), "SEQ = [" + ", ".join(body) + "]\n", 1)
    # PLAN: the hook shots
    a = s.index('    ("h1", [')
    b = min(i for i in [s.find('\n    ("b', a), s.find('\n    ("n', a)] if i > 0) + 1
    hp = ""
    for k, hk in enumerate(c["h"]):
        t, key, ref, x, title = hk[:5]
        fl = ("glow " if k == 0 else "bigflash " if k == N - 1 else "") + (hk[5] + " " if len(hk) > 5 else "") + "title:" + title
        hp += f'    ("h{k + 1}", [(1, "{key}", {ref}, {x}, "{fl}")]),\n'
    s = s[:a] + hp + s[b:]
    for seg, (txt, cap) in c.get("n", {}).items():
        s = re.sub(r'\("%s", "[^\n]*"\),' % seg, '("%s", "%s"),' % (seg, txt), s, 1)
        s = re.sub(r'\n\s*"%s": "[^\n]*",\n' % seg, '\n    "%s": "%s",\n' % (seg, cap), s, 1)
    for seg, shots in c.get("plan", {}).items():
        s = re.sub(r'\n    \("%s", \[.*?\]\),[^\n]*\n' % seg, '\n    ("%s", %s),\n' % (seg, shots), s, 1)
    for name, spec in c.get("clips", {}).items():
        if ('"%s":' % name) not in s:
            s = s.replace("CLIPS = {", 'CLIPS = {"%s": %s, ' % (name, spec), 1)
    if c.get("gen"):
        add = ", ".join('"%s": "%s"' % kv for kv in c["gen"].items() if ('"%s":' % kv[0]) not in s)
        if add:
            s = s.replace("GEN = {", "GEN = {" + add + ", ", 1)
    if c.get("map") and "map:" not in s:          # a route map as the first shot of the first paragraph (countries, not towns)
        seg, flag = c["map"]
        s = s.replace('    ("%s", [' % seg, '    ("%s", [(.34, "X2", "paper.jpg", 50, "%s"), ' % (seg, flag), 1)
    for old, new in c.get("subs", []):
        s = s.replace(old, new)
    if c.get("collage") and "GENSTYLE" not in s and "GEN = {" in s:
        s += chr(10) + '# The illustrations in the Vox paper-collage look (style block from skills/toolbox/vox-ai-motion-graphics-generator), made with Agnes.' + chr(10) + 'GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Figures are printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: parchment cream, charcoal black, warm gold accent, one deep green. No text, no letters, no faces. Subject: "' + chr(10)
    compile(s, p, "exec")
    open(p, "w", encoding="utf-8", newline="").write(s)
    print("rehooked", slug)
