# Shared engine for the AI story reels (from ai-story-rami-bassam/v4/build.py). Run inside a version folder that holds story.py:
#   python ../../ai-story-kit/engine.py
import sys, os
sys.path.insert(0, os.getcwd())
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../tools'))
from mapgen import route_map, MAP_CSS
import json, re, subprocess
import story as S
GOLD, CREAM = "#FACC27", "#E9C98F"
END_CARD = 3.2
SEQ, TEXT, PLAN = S.SEQ, S.TEXT, S.PLAN
BITES = getattr(S, "BITES_AR", ())
WHO = getattr(S, "WHO", {})
VID = getattr(S, "VID", {})
END = getattr(S, "END", ("ENEMIES", "FAMILY."))
STORYFILE = os.path.abspath("story.py")

def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)


T, t = {}, 0.0
for n, g in SEQ:
    d = dur(f"vo/{n}.wav")
    T[n] = (round(t, 3), round(t + d, 3), round(t + d + g, 3))      # start, end of speech, end of slot
    t += d + g
VOICE_END = t
DUR = round(VOICE_END + END_CARD, 2)
if not os.path.exists("voice.wav") or os.path.getmtime("voice.wav") < max([os.path.getmtime(STORYFILE)] + [os.path.getmtime(f"vo/{n}.wav") for n, g in SEQ]):
    ins, fc = [], []
    for i, (n, g) in enumerate(SEQ):
        ins += ["-i", f"vo/{n}.wav"]
        fc.append(f"[{i}]adelay={int(T[n][0] * 1000)}:all=1[a{i}]")
    subprocess.run(["ffmpeg", "-v", "error", "-y"] + ins + ["-filter_complex", ";".join(fc) + ";" + "".join(f"[a{i}]" for i in range(len(SEQ))) + f"amix=inputs={len(SEQ)}:normalize=0[o]", "-map", "[o]", "-ar", "44100", "-ac", "1", "voice.wav"])
    if os.path.exists("words.json"):
        os.remove("words.json")
if not os.path.exists("words.json"):          # time the words one segment at a time (LESSONS 106)
    key, allw = os.environ["GROQ_API_KEY"], []
    for n, g in SEQ:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"vo/{n}.wav", "-ac", "1", "-ar", "16000", "vo/_x.flac"])
        out = subprocess.run(["curl", "-s", "https://api.groq.com/openai/v1/audio/transcriptions", "-H", f"Authorization: Bearer {key}", "-F", "file=@vo/_x.flac", "-F", "model=whisper-large-v3-turbo", "-F", "response_format=verbose_json", "-F", "timestamp_granularities[]=word", "-F", "language=" + getattr(S, "BITELANG", {}).get(n, "ar" if n in BITES else "en")], capture_output=True, text=True).stdout
        allw.append({"seg": n, "words": [{"word": x["word"].strip(), "start": round(x["start"], 3)} for x in json.loads(out).get("words", [])]})
    os.remove("vo/_x.flac")
    json.dump(allw, open("words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
WORDS = {s["seg"]: s["words"] for s in json.load(open("words.json", encoding="utf-8"))}


class _M(dict):          # how much of a clip is left after the chosen start
    def __contains__(self, k):
        return k[0] in VID

    def __getitem__(self, k):
        f, a = (VID[k[0]], k[1]) if k[0] in VID else ("src/" + k[1].split("@")[0], float(k[1].split("@")[1]))
        return dur(f) - a - 0.03


MAXLEN = _M()
CREDIT = {"V": "", "X": "", "X2": "", "I": "", "A": ""}
CREDIT.update(getattr(S, "CREDIT", {}))
for _n in VID:
    CREDIT.setdefault(_n, "")
PC = getattr(S, "PC", {})          # credit per photo file
BITESRC = {}
POS = []
T["end"] = (VOICE_END, DUR, DUR)

h, tl, sfx, shots = [], [], [], []
ARROWS, MAPS = [], []
for seg, parts in PLAN:
    s0, _, s1 = T[seg]
    acc = s0
    fixed = sum(-p[0] for p in parts if p[0] < 0)
    tot = sum(p[0] for p in parts if p[0] > 0)
    for share, k, ref, x, flags in parts:
        a, b = acc, acc + (-share if share < 0 else share / tot * (s1 - s0 - fixed))
        acc = b
        shots.append((round(a, 2), round(b, 2), k, ref, x, flags, seg))
for i, (st, en, k, ref, x, flags, seg) in enumerate(shots):
    d = en - st
    mode = x if isinstance(x, str) else ""
    if mode.startswith("tall"):
        x, mode = int(mode[4:]), "tall"
    isvid = k in VID or k == "V"
    if (k, ref) in MAXLEN:
        assert d <= MAXLEN[(k, ref)] + 0.02, f"shot {k} {ref} is {d:.2f}s but only {MAXLEN[(k, ref)]}s of it exists ({seg})"
    style = "" if mode in ("band", "win", "wide") else (f"object-position:{x}% 50%;transform-origin:50% 38%;" if mode == "tall" else f"object-position:{x}% 30%;transform-origin:{x}% 34%")
    if "grey" in flags.split():
        style += "filter:grayscale(1) brightness(.62) contrast(1.1);"
    if "cine" in flags:
        style += "filter:grayscale(.9) contrast(1.15) brightness(.8);"
        h.append(f'      <div id="cine{i}" class="clip" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="3"><div class="solid" id="cdim{i}" style="background:rgba(0,0,0,.15)"></div><div class="cinev" id="cv{i}" style="left:0;top:330px;width:1080px;height:1216px;border-radius:0"></div></div>')
        tl.append(f'tl.fromTo("#cdim{i}", {{opacity:0}}, {{opacity:1, duration:0.35}}, {st:.2f}); tl.fromTo("#cv{i}", {{opacity:0}}, {{opacity:1, duration:0.5}}, {st:.2f});')
        tl.append(f'tl.fromTo("#v{i}", {{scale:1.0}}, {{scale:1.16, duration:{d:.2f}, ease:"power1.in"}}, {st:.2f});')
        sfx += []
    if "door" in flags:
        sfx.append((st + 0.9, "door", 1.0))
    if "boots" in flags:
        sfx.append((st + 0.05, "boots", 2.0))
    if "run" in flags:
        sfx.append((st, "run", 2.2))
    if "thud" in flags:
        sfx.append((st + 0.95, "thud", 0.8))
    if "glass" in flags:
        sfx.append((st + 0.25, "glass", 0.8))
    if not isvid and "whip" not in flags and "tint" not in flags and "article" not in flags and seg != "end":
        pass
    cls = f" {mode}" if mode else ""
    if isvid:
        src, ms = (f"src/{ref.split('@')[0]}", float(ref.split("@")[1]) if "@" in ref else 0.0) if k == "V" else (VID[k], ref)
        if mode == "inset":
            h.append(f'      <div id="pg{i}" class="clip" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="30"><div class="solid" style="background:#f6f4ef"></div></div>')
        if mode in ("band", "tall", "wide"):
            h.append(f'      <video id="bg{i}" class="clip footage bandbg" src="{src}" data-start="{st:.2f}" data-duration="{d:.2f}" data-media-start="{ms}" data-track-index="30" muted playsinline></video>')
        h.append(f'      <video id="v{i}" class="clip footage{cls}" src="{src}" data-start="{st:.2f}" data-duration="{d:.2f}" data-media-start="{ms}" data-track-index="0" muted playsinline style="{style}"></video>')
    else:
        h.append(f'      <img id="v{i}" class="clip footage{cls}" src="photos/{ref}" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="0" style="{style}" />')
    cred_ = PC.get(ref) or ("ILLUSTRATION &middot; AI IMAGE" if str(ref).startswith("g_") else None) or (getattr(S, "BITECREDIT", {}).get(seg) if k == "V" else None) or CREDIT.get("X" if k == "V" else k, "")
    if d >= 0.7 and seg != "end" and cred_:
        h.append(f'      <div id="cr{i}" class="clip" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="1"><div class="credit{" lowc" if mode else ""}">{cred_}</div></div>')
    # movement: every shot pushes in gently; a still photo also slides; one punch-in only on a long shot
    small = bool(mode) or k == "V"
    k0, k1 = (1.0, 1.06) if small else (1.0, 1.10)
    fl = flags.split()
    z = next((float(f[1:]) for f in fl if re.fullmatch(r"z[\d.]+", f)), 1.0)
    k0, k1 = round(k0 * z, 3), round(k1 * z, 3)
    num = next((f[4:] for f in fl if f.startswith("num:")), None)
    if num:
        h.append(f'      <div id="bn{i}" class="clip" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="4"><div class="bignum" id="bnt{i}">{num}</div></div>')
        tl.append(f'tl.fromTo("#bnt{i}", {{scale:2.4, opacity:0}}, {{scale:1, opacity:1, duration:0.16, ease:"back.out(2.2)"}}, {st + 0.10:.2f}); tl.to("#bnt{i}", {{scale:1.08, duration:{max(0.1, d - 0.4):.2f}, ease:"none"}}, {st + 0.26:.2f}); tl.to("#bnt{i}", {{opacity:0, duration:0.10}}, {en - 0.12:.2f});')
        sfx.append((st + 0.08, "impact2", 1.2))
    for f_ in fl:
        if f_.startswith("arrow:"):          # arrow:X,Y  -> a hand-drawn gold arrow from the title up to the person ("this man", Tal 2026-10-08)
            av_ = [float(v) for v in f_[6:].split(",")]          # optional third number: how long the arrow stays (it may outlive its shot)
            ARROWS.append((i, st, av_[2] if len(av_) > 2 else d, av_[0], av_[1], av_[3] if len(av_) > 3 else 125))          # 4th number: how far from the face centre the tip stops (face radius + a margin)
        if f_.startswith("map:"):            # map:NAME,lon,lat;NAME,lon,lat@lon0,lon1,lat0,lat1  -> route map with two pins
            pts_, box_ = f_[4:].split("@")
            MAPS.append((i, st, d, [(q.split(",")[0].replace("_", " "), float(q.split(",")[1]), float(q.split(",")[2])) for q in pts_.split(";")], [float(v) for v in box_.split(",")]))
        if f_.startswith("count:"):          # count:#hex|lead|NUMBER|suffix  -> a number that rolls up (Motion Graphics starter kit: "count-up")
            col_, lead_, num_, *suf_ = f_.split(":", 1)[1].replace("_", " ").split("|")
            suf_ = suf_[0] if suf_ else ""
            cd_ = min(1.05, d * 0.5)
            h.append(f'      <div id="cn{i}" class="clip" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="4"><div class="solid" style="background:{col_}"></div><div class="tw" style="top:600px"><span class="lead" id="cnl{i}">{lead_}</span><span class="big" id="cnb{i}" style="font-size:300px">0</span><span class="cnsuf" id="cns{i}">{suf_}</span></div></div>')
            tl.append(f'tl.fromTo("#cnl{i}", {{opacity:0, y:18}}, {{opacity:1, y:0, duration:0.16}}, {st + 0.05:.2f}); (function(){{var o={{v:0}}, el=document.querySelector("#cnb{i}"); tl.to(o, {{v:{int(num_)}, duration:{cd_:.2f}, ease:"power2.out", onUpdate:function(){{el.textContent=Math.round(o.v);}}}}, {st + 0.12:.2f});}})(); tl.fromTo("#cns{i}", {{opacity:0, y:24}}, {{opacity:1, y:0, duration:0.2, ease:"back.out(2)"}}, {st + 0.12 + cd_:.2f}); tl.fromTo("#cnb{i}", {{scale:1}}, {{scale:1.1, duration:0.12, yoyo:true, repeat:1}}, {st + 0.12 + cd_:.2f});')
            sfx += [(st + 0.12, "mg_counter", 1.05), (st + 0.12 + cd_, "mg_chime", 0.95)]
        if f_.startswith("check:"):          # check:#hex|title|item|item|item  -> a list that ticks itself ("checklist tick"), editorial paper look
            col_, ttl_, *items_ = f_.split(":", 1)[1].replace("_", " ").split("|")
            rows_ = "".join(f'<div class="ckrow" id="ck{i}_{q}"><span class="ckdot" id="ckd{i}_{q}">&#10003;</span><span class="cktxt">{it_}</span></div>' for q, it_ in enumerate(items_))
            h.append(f'      <div id="ckw{i}" class="clip" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="4"><div class="solid" style="background:{col_}"></div><div class="ckwrap"><div class="ckrule"></div><div class="cktitle" id="ckt{i}">{ttl_}</div>{rows_}</div></div>')
            tl.append(f'tl.fromTo("#ckt{i}", {{opacity:0, y:20}}, {{opacity:1, y:0, duration:0.2}}, {st + 0.05:.2f});')
            for q in range(len(items_)):
                t_ = st + 0.35 + q * (d - 0.9) / len(items_)
                tl.append(f'tl.fromTo("#ck{i}_{q}", {{opacity:0, scale:0.6, y:40}}, {{opacity:1, scale:1, y:0, duration:0.3, ease:"back.out(2.2)"}}, {t_:.2f}); tl.fromTo("#ckd{i}_{q}", {{scale:0}}, {{scale:1, duration:0.2, ease:"back.out(3)"}}, {t_ + 0.14:.2f});')
                sfx += [(t_, "mg_pop", 0.17), (t_ + 0.14, "mg_success" if q == len(items_) - 1 else "mg_chime", 0.75 if q == len(items_) - 1 else 0.95)]          # a ding on every item (Tal: "when it pops up make a ding and nicer")
        if f_.startswith("title:") or f_.startswith("card:"):
            parts_ = f_.split(":", 1)[1].replace("_", " ").split("|")
            card = f_.startswith("card:")
            col = parts_.pop(0) if card else None
            lead_, big_ = parts_[0], "<br />".join(parts_[1:])
            bg_ = f'<div class="solid" style="background:{col}"></div>' if card else ""
            top_ = 640 if card else (300 if mode == "inset" else 1090)
            fs_ = 104 if len(parts_) > 2 else (118 if len(big_) > 9 else (150 if len(big_) > 5 else 230))
            h.append(f'      <div id="tw{i}" class="clip" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="4">{bg_}<div class="tw{" dark" if mode == "inset" else ""}" style="top:{top_}px"><span class="lead" id="twl{i}">{lead_}</span><span class="big" id="twb{i}" style="font-size:{fs_}px">{big_}</span></div></div>')
            tl.append(f'tl.fromTo("#twl{i}", {{opacity:0, y:18}}, {{opacity:1, y:0, duration:0.16}}, {st + 0.05:.2f}); tl.fromTo("#twb{i}", {{opacity:0, scale:1.9}}, {{opacity:1, scale:1, duration:0.16, ease:"power4.out"}}, {st + min(0.45, d * 0.35):.2f}); tl.to("#twb{i}", {{scale:1.06, duration:{max(0.1, d - 0.7):.2f}, ease:"none"}}, {st + min(0.45, d * 0.35) + 0.16:.2f});')
            sfx.append((st + min(0.45, d * 0.35) - 0.02, "mg_pop", 0.17))
        if f_.startswith("cuts:"):
            names_ = f_[5:].split(",")
            for q_, o_ in enumerate(names_):
                t_ = st + 0.25 + q_ * (d - 0.5) / len(names_)
                x_, y_, w_ = POS[q_]
                for z_ in range(3):
                    h.append(f'      <div class="clip" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="{60 + q_ * 3 + z_}"><img id="ct{i}_{q_}_{z_}" class="cut" src="photos/{o_}{z_}.png" style="left:{x_}px;top:{y_}px;width:{w_}px;opacity:0" /></div>')
                    tl.append(f'tl.fromTo("#ct{i}_{q_}_{z_}", {{scale:0.2, rotation:{-16 + q_ * 14}}}, {{scale:1, rotation:{-5 + q_ * 5}, duration:0.2, ease:"back.out(2.2)"}}, {t_:.2f});')
                    for w2_ in range(int((en - t_) * 6)):
                        tl.append(f'tl.set("#ct{i}_{q_}_{z_}", {{opacity:{1 if w2_ % 3 == z_ else 0}}}, {t_ + w2_ / 6:.3f});')
                sfx += [(t_, "slap", 0.38), (t_ + 0.18, "pop", 0.72)]
    tag = next((f[4:] for f in re.findall(r"tag:[A-Z ,.'0-9]+?(?= [a-z]|$)", flags)), None)
    if tag:
        h.append(f'      <div id="tg{i}" class="clip" data-start="{st:.2f}" data-duration="{min(d + 0.9, 1.8):.2f}" data-track-index="8"><div class="tagchip" id="tgc{i}">{tag.strip()}</div></div>')
        tl.append(f'tl.fromTo("#tgc{i}", {{scale:1.9, opacity:0, rotation:-7}}, {{scale:1, opacity:1, rotation:-3, duration:0.12, ease:"power4.out"}}, {st + 0.06:.2f}); tl.to("#tgc{i}", {{opacity:0, duration:0.10}}, {st + min(d + 0.9, 1.8) - 0.12:.2f});')
        sfx.append((st + 0.05, "stamp", 0.48))
    if i > 0 and seg != "end":
        if "whip" in fl:                                   # a whip already has its whoosh: add a quick flash
            h.append(f'      <div id="wf{i}" class="clip" data-start="{st:.2f}" data-duration="0.20" data-track-index="7"><div class="solid" id="wfs{i}" style="background:#fff"></div></div>')
            tl.append(f'tl.fromTo("#wfs{i}", {{opacity:0.10}}, {{opacity:0, duration:0.16, ease:"power2.out"}}, {st:.2f});')
        elif "tint" not in fl and "cine" not in fl:        # every other cut clicks
            pass                                           # house model: no click on an ordinary cut (LESSONS 125)
    if "bigflash" in fl:
        h.append(f'      <div id="fz{i}" class="clip" data-start="{st:.2f}" data-duration="0.34" data-track-index="7"><div class="solid" id="fzs{i}" style="background:#fff"></div></div>')
        tl.append(f'tl.fromTo("#fzs{i}", {{opacity:1}}, {{opacity:0, duration:0.30, ease:"power2.out"}}, {st:.2f});')
        sfx.append((st - 0.02, "boomshort", 1.0))
    if "flash" in fl:
        h.append(f'      <div id="fz{i}" class="clip" data-start="{st:.2f}" data-duration="0.30" data-track-index="7"><div class="solid" id="fzs{i}" style="background:#fff"></div></div>')
        tl.append(f'tl.fromTo("#fzs{i}", {{opacity:0.9}}, {{opacity:0, duration:0.24, ease:"power2.out"}}, {st:.2f});')
    if "thud0" in fl:
        sfx.append((st, "thud", 0.8))
    if "door0" in fl:
        sfx.append((st, "door", 1.0))
    if "shim" in fl:
        sfx.append((st + 0.1, "shimmer", 2.48))
    drift = 0 if (isvid or "still" in flags) else (-1) ** i * 18
    t0 = st
    if "whip" in flags:
        tl.append(f'tl.fromTo("#v{i}", {{scale:{round(k0 * (1.10 if small else 1.16), 3)}}}, {{scale:{k0}, duration:0.26, ease:"power3.out"}}, {st:.2f});')
        sfx.append((st - 0.05, "whoosh-short", 0.57))
        t0 = st + 0.26
    if d >= 99 and "still" not in flags:          # the mid-shot punch-in read as a cut: off
        mid = t0 + (en - t0) / 2
        tl.append(f'tl.fromTo("#v{i}", {{scale:{k0}, x:{drift}}}, {{scale:{k1}, x:0, duration:{mid - t0:.2f}, ease:"none"}}, {t0:.2f});')
        tl.append(f'tl.fromTo("#v{i}", {{scale:{k1 + 0.14:.2f}, x:0}}, {{scale:{k1 + 0.2:.2f}, x:{-drift}, duration:{en - mid:.2f}, ease:"none"}}, {mid:.2f});')
    elif "still" not in flags and "cine" not in flags:
        tl.append(f'tl.fromTo("#v{i}", {{scale:{k0}, x:{drift}}}, {{scale:{k1}, x:{-drift}, duration:{en - t0:.2f}, ease:"none"}}, {t0:.2f});')
    if "tint" in flags:
        h.append(f'      <div id="tn{i}" class="clip" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="3"><div class="solid" style="background:{GOLD};mix-blend-mode:multiply"></div><div class="solid" style="background:rgba(250,204,39,.25)"></div></div>')
        sfx.append((st, "click", 0.2))
h.append(f'      <div id="shade" class="clip" data-start="0" data-duration="{DUR}" data-track-index="2"><div class="shade"></div></div>')
h.append(f'      <div id="logo" class="clip" data-start="0" data-duration="{DUR}" data-track-index="9"><div class="wordmark"><span class="w1">THE</span><span class="w2">SOCIAL</span><span class="w3">ACCORDS</span></div></div>')


def shot_of(flag):
    return next((s for s in shots if flag in s[5].split()), None)


def arrow(aid, start, d, path, head, plen=1500):
    h.append(f'''      <div id="{aid}" class="clip" data-start="{start:.2f}" data-duration="{d:.2f}" data-track-index="6">
        <svg class="arrow" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><mask id="{aid}m"><path id="{aid}p" d="{path}" fill="none" stroke="#fff" stroke-width="30" stroke-linecap="round"/></mask></defs>
        <g mask="url(#{aid}m)"><path d="{path}" fill="none" stroke="{GOLD}" stroke-width="18" stroke-linecap="round"/></g>
        <path id="{aid}h" d="{head}" fill="none" stroke="{GOLD}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg></div>''')
    tl.append(f'gsap.set("#{aid}p", {{strokeDasharray:{plen}, strokeDashoffset:{plen}}}); tl.to("#{aid}p", {{strokeDashoffset:0, duration:0.42, ease:"power1.inOut"}}, {start + 0.05:.2f});')
    tl.append(f'tl.fromTo("#{aid}h", {{opacity:0, scale:0.3, transformOrigin:"50% 50%"}}, {{opacity:1, scale:1, duration:0.14, ease:"back.out(3)"}}, {start + 0.42:.2f});')
    sfx.append((start + 0.04, "marker", 0.6))


import math
for i_, st_, d_, ax_, ay_, pb_ in ARROWS:
    sx_, sy_ = (880.0, 1060.0) if ax_ < 620 else (200.0, 1060.0)
    cx_, cy_ = sx_ + (140 if ax_ < 620 else -140), (sy_ + ay_) / 2
    ang_ = math.atan2(ay_ - cy_, ax_ - cx_)
    ax_, ay_ = ax_ - pb_ * math.cos(ang_), ay_ - pb_ * math.sin(ang_)          # the tip stops beside the head and points at the person: it never lies across the face (Tal, 2026-10-09)
    hd_ = " ".join(f"{'M' if k == 0 else 'L'}{ax_ - 78 * math.cos(ang_ + t_):.0f} {ay_ - 78 * math.sin(ang_ + t_):.0f} L{ax_:.0f} {ay_:.0f}" for k, t_ in enumerate((0.5, -0.5)))
    arrow(f"ar{i_}_{int(ax_)}", st_ + 0.18, max(0.5, d_ - 0.18), f"M{sx_:.0f} {sy_:.0f} Q {cx_:.0f} {cy_:.0f}, {ax_:.0f} {ay_:.0f}", hd_)
for i_, st_, d_, pts_, box_ in MAPS:
    _h, _t, _s = route_map(f"mp{i_}", st_, d_, pts_, f"photos/_map{i_}.jpg", box_[0], box_[1], box_[2], box_[3], track=3)
    h.append(_h); tl += _t; sfx += [(x[0], x[1], 0.6) if len(x) == 2 else x for x in _s]
a = shots[0]
h.append(f'      <div id="open" class="clip" data-start="{a[0]:.2f}" data-duration="{a[1] - a[0]:.2f}" data-track-index="3"><div class="glow" id="glow"></div></div>')
tl.append('tl.fromTo("#glow", {opacity:0, yPercent:30}, {opacity:1, yPercent:0, duration:0.3, ease:"power2.out"}, 0);')
ART = (-9, -9)
# the end card
e0 = VOICE_END
h.append(f'''      <div id="end" class="clip" data-start="{e0:.2f}" data-duration="{DUR - e0:.2f}" data-track-index="7"><div class="dim" style="background:rgba(8,6,5,.82)"></div>
        <div class="endwrap" id="endw"><div class="e1" id="e1">{END[0]}<span class="strike" id="estr"></span></div><div class="e2" id="e2">{END[1]}</div><div class="e3" id="e3">FOLLOW THE SOCIAL ACCORDS<br />FOR STORIES THAT UNITE PEOPLE</div></div></div>''')
tl.append(f'tl.fromTo("#e1", {{opacity:0, scale:1.3}}, {{opacity:1, scale:1, duration:0.2, ease:"power3.out"}}, {e0 + 0.10:.2f});')
tl.append(f'tl.fromTo("#estr", {{scaleX:0}}, {{scaleX:1, duration:0.32, ease:"power2.inOut"}}, {e0 + 0.65:.2f}); tl.to("#e1", {{opacity:0.45, duration:0.25}}, {e0 + 0.90:.2f});')
tl.append(f'tl.fromTo("#e2", {{opacity:0, scale:0.5, y:40}}, {{opacity:1, scale:1, y:0, duration:0.26, ease:"back.out(2.2)"}}, {e0 + 1.10:.2f}); tl.fromTo("#e3", {{opacity:0}}, {{opacity:1, duration:0.3}}, {e0 + 1.70:.2f});')
tl.append(f'tl.fromTo("#endw", {{scale:1}}, {{scale:1.07, duration:{DUR - e0:.2f}, ease:"none"}}, {e0:.2f});')
sfx += [(e0 + 0.02, "whoosh", 0.57), (e0 + 0.62, "whoosh-short", 0.57), (e0 + 1.08, "boom", 2.0), (e0 + 1.12, "pianohi", 2.0), (e0 + 1.15, "shimmer", 2.48),  ]
sfx += [(0.02, "pop", 0.72), (T[next(n for n, g in SEQ if not n.startswith("h"))][0] - 0.02, "impact", 1.2)]

# ---- 3. captions: one pill at a time, never two on screen, under the face when someone is on camera ----------
def win_at(t):
    s = next((s for s in shots if s[0] <= t < s[1]), None)
    return bool(s) and isinstance(s[4], str)


def tall_at(t):
    s = next((s for s in shots if s[0] <= t < s[1]), None)
    return bool(s) and isinstance(s[4], str) and s[4].startswith("tall")


HIDE = [(s_[0], s_[1]) for s_ in shots if "title:" in s_[5] or "card:" in s_[5] or "count:" in s_[5] or "check:" in s_[5] or "map:" in s_[5]]      # the words are already on screen as a title
caps = []
for seg, g in SEQ:
    if not TEXT[seg]:
        continue
    phrases = [p.strip() for p in TEXT[seg].split("|")]
    ws = WORDS[seg]
    total = sum(len(re.sub(r"[*“”~]", "", p).split()) for p in phrases)
    idx = 0
    for p in phrases:
        n_ = len(p.split())
        j = min(len(ws) - 1, round(idx * len(ws) / total))
        t_ = T[seg][0] + ws[j]["start"]
        key = next((T[seg][0] + ws[min(len(ws) - 1, round((idx + q) * len(ws) / total))]["start"] for q, wd in enumerate(p.split()) if "*" in wd), None)
        idx += n_
        if p.startswith("~") or any(a_ - 0.15 <= t_ < b_ - 0.05 for a_, b_ in HIDE):
            continue
        p_ = re.sub(r"[“”�~]", "", p).strip()
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
    tl.append(f'tl.fromTo("#ct{i}", {{opacity:0, y:18, scale:0.82}}, {{opacity:1, y:0, scale:1, duration:0.14, ease:"back.out(2.4)"}}, {a:.2f});')
    if key:
        sfx.append((key, "mg_snap", 0.16))
for seg, g in SEQ:
    if seg in WHO:
        h.append(f'      <div id="who_{seg}" class="clip" data-start="{T[seg][0]:.2f}" data-duration="{T[seg][1] - T[seg][0]:.2f}" data-track-index="6"><div class="who" style="top:{1600 if tall_at(T[seg][0] + 0.3) else 1580}px"><span>{WHO[seg]}</span></div></div>')
sfx = sorted(set((round(max(0, t), 2), n, d) for t, n, d in sfx))
h.append(f'      <audio id="music" data-start="0" data-duration="{DUR}" data-track-index="80" src="sfx/music_lo.wav"></audio>')
h.append(f'      <audio id="vo" data-start="0" data-duration="{VOICE_END:.2f}" data-track-index="10" src="voice.wav"></audio>')
for i, (t, n, d) in enumerate(sfx):
    h.append(f'      <audio id="fx{i}" data-start="{t:.2f}" data-duration="{d}" data-track-index="{11 + i}" src="sfx/{n}.wav"></audio>')

css = re.search(r"<style>(.*?)</style>", open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../ai-story-daryl-davis/v10/index.html"), encoding="utf-8").read(), re.S).group(1)
css += MAP_CSS
css += '''
      .capwrap .cap { white-space: nowrap; }
      .cap-tal { font-size: 46px; }
      .capx { position: absolute; left: 90px; width: 900px; text-align: center; font: 900 72px/1.12 "Montserrat", "Inter", Arial, sans-serif; letter-spacing: -0.03em; color: #fff; text-shadow: 0 3px 0 rgba(0,0,0,.55), 0 4px 14px rgba(0,0,0,.75), 0 0 50px rgba(0,0,0,.55); text-transform: none; -webkit-text-stroke: 0; }
      .capx.dk { color: #16130f; text-shadow: none; }
      .capx .k { color: #FACC27; font-size: 1.16em; text-transform: uppercase; letter-spacing: -0.02em; }
      .capx.dk .k { color: #c8102e; }
      .e2 { font-size: 132px !important; white-space: nowrap; }
      .e3 { font-size: 42px; line-height: 1.55; letter-spacing: .14em; color: #fff; text-align: center; }
      .tagchip { position: absolute; left: 70px; top: 240px; font: 900 46px/1 "Montserrat", Arial, sans-serif; letter-spacing: 0.05em; color: #0b0b0d; background: #FACC27; padding: 16px 24px 14px; border-radius: 10px; box-shadow: 0 12px 34px rgba(0,0,0,.55); transform-origin: 0 50%; }
      .bignum { position: absolute; left: 0; width: 1080px; top: 250px; text-align: center; font: 900 330px/1 "Montserrat", Arial, sans-serif; letter-spacing: -0.04em; color: #FACC27; -webkit-text-stroke: 18px #0b0b0d; paint-order: stroke fill; text-shadow: 0 16px 50px rgba(0,0,0,.6); }
      .cinev.full { left: 0; top: 0; width: 1080px; height: 1920px; border-radius: 0; }
      .yearsub { position: absolute; left: 0; width: 1080px; top: 1400px; text-align: center; font: 800 54px/1 'Montserrat', sans-serif; letter-spacing: .18em; color: #fff; text-shadow: 0 4px 18px rgba(0,0,0,.7); }
      video.footage.tall { inset: auto; left: 0; top: 330px; width: 1080px; height: 1216px; object-fit: cover; }
      video.footage.band { inset: auto; left: 0; top: 560px; width: 1080px; height: 608px; object-fit: cover; }
      video.footage.band { inset: auto; left: 0; top: 420px; width: 1080px; height: 810px; object-fit: cover; }
      video.footage.wide { inset: auto; left: 0; top: 600px; width: 1080px; height: 608px; object-fit: cover; }
      video.footage.bandbg { filter: blur(26px) brightness(0.62) saturate(1.15); }
      .tw { position: absolute; left: 0; width: 1080px; display: flex; flex-direction: column; align-items: center; color: #fff; text-shadow: 0 6px 30px rgba(0,0,0,.6); }
      .tw.dark { color: #1b1712; text-shadow: none; }
      .cnsuf { font: 900 96px/1 "Montserrat", Arial, sans-serif; letter-spacing: -0.02em; color: #FACC27; margin-top: 14px; }
      .ckwrap { position: absolute; left: 80px; top: 470px; width: 920px; color: #1a1a1a; }
      .ckrule { width: 120px; height: 8px; background: #c2412d; margin-bottom: 34px; }
      .cktitle { font: italic 500 100px/1.05 "EB Garamond", Georgia, serif; margin-bottom: 54px; }
      .ckrow { display: flex; align-items: center; gap: 34px; margin-bottom: 40px; background: #fff; border-radius: 34px; padding: 34px 38px; box-shadow: 0 18px 44px rgba(40,30,10,.22), 0 2px 0 rgba(0,0,0,.06); transform-origin: 50% 50%; }
      .ckdot { flex: none; width: 108px; height: 108px; border-radius: 50%; background: #34c759; color: #fff; font: 900 66px/108px Arial, sans-serif; text-align: center; }
      .cktxt { font: 800 70px/1.12 "Montserrat", Arial, sans-serif; letter-spacing: -0.03em; }
      .tw .lead { font: italic 500 70px/1 "EB Garamond", Georgia, serif; }
      .tw .big { font: 900 230px/0.98 "Montserrat", Arial, sans-serif; letter-spacing: -0.04em; margin-top: 8px; white-space: nowrap; }
      img.cut { position: absolute; height: auto; filter: drop-shadow(0 18px 22px rgba(0,0,0,.35)); }
      video.footage.inset { inset: auto; left: 130px; top: 600px; width: 820px; height: 615px; object-fit: cover; box-shadow: 0 20px 50px rgba(0,0,0,.25); }
      img.footage.bandbg { inset: 0; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; filter: blur(30px) brightness(0.4); }
      video.footage.bandbg { inset: 0; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; filter: blur(30px) brightness(0.4); transform: scale(1.2); }
      .cinev { position: absolute; left: 40px; top: 400px; width: 1000px; height: 1040px; border-radius: 34px; background: radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 38%, rgba(0,0,0,.78) 100%); }
'''
if os.environ.get('HOOK_ONLY'):
    DUR = float(os.environ['HOOK_ONLY'])
html = f'''<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <link rel="stylesheet" href="captions.css" />
    <style>{css}</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920">
{chr(10).join(h)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
      {chr(10).join("      " + x for x in tl).strip()}
      tl.to({{}}, {{ duration: 0.01 }}, {DUR - 0.01});
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
'''
open("index.html", "w", encoding="utf-8", newline="").write(html)
json.dump({"T": T, "shots": shots, "caps": caps, "DUR": DUR}, open("timeline.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
gaps = [round(T[SEQ[i + 1][0]][0] - T[SEQ[i][0]][1], 2) for i in range(len(SEQ) - 1)]
print(f"{DUR}s total, voice ends {VOICE_END:.2f}; {len(shots)} shots = {round(len(shots) / DUR * 60)} a minute; shortest shot {min(s[1] - s[0] for s in shots):.2f}s; {len(caps)} captions; longest pause {max(gaps)}s")
for s in shots:
    print(f"  {s[0]:6.2f}-{s[1]:6.2f}  {s[6]:4s} {s[2]} {s[3]}")
