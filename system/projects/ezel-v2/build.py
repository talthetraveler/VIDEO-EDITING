#!/usr/bin/env python
"""EZEL builder. Two stages, no stream-copy joins anywhere.

  python build.py lock  <spec.json>   picture + dialogue in ONE filter graph -> <name>/locked.mov
  python build.py final <spec.json>   locked.mov + captions/title/handle/music -> <name>/<out>.mp4

Every shot's audio is forced to exactly nframes/30 seconds before the concat
filter, so picture and sound share one clock (the earlier stream-copy joins
drifted ~0.15 s). Captions are timed against locked.mov, i.e. the final
edited audio. Sources are opened read-only.
"""
import json, subprocess, sys, os, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = "C:/Users/taldo/Downloads/videos to edit/system/assets-fonts/Montserrat.ttf"
FPS = 30
W, H = 1080, 1920
TM = ("zscale=tin=arib-std-b67:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl={npl},format=gbrpf32le,"
      "zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-4000:])
        raise SystemExit("ffmpeg failed")
    return r


def lufs(path, ss, t):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-ss", str(ss), "-t", str(t), "-i", path, "-vn",
                        "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    return float(m[-1]) if m else -70.0


def frames(shot):
    return round((shot["out"] - shot["in"]) / shot.get("speed", 1.0) * FPS)


def lock(spec, d):
    shots = spec["shots"]
    cmd = ["ffmpeg", "-hide_banner", "-y"]
    fc = []
    t = 0.0
    timeline = []
    extra = []
    amap = {}
    for i, s in enumerate(shots):
        dur = s["out"] - s["in"]
        cmd += ["-ss", f"{s['in']:.4f}", "-t", f"{dur + 0.5:.4f}", "-i", s["src"]]
    for i, s in enumerate(shots):
        if s.get("asrc"):
            amap[i] = len(shots) + len(amap)
            cmd += ["-ss", f"{s['ain']:.4f}", "-t", f"{frames(s) / FPS + 0.5:.4f}", "-i", s["asrc"]]
    for i, s in enumerate(shots):
        dur = s["out"] - s["in"]
        n = frames(s)
        sp = s.get("speed", 1.0)
        z = s.get("zoom", [1.0, 1.0])
        if not isinstance(z, list):
            z = [z, z]
        fx, fy = s.get("focus", [0.5, 0.5])
        v = f"[{i}:v]"
        chain = []
        animated = abs(z[0] - z[1]) > 1e-4
        bw, bh = (2160, 3840) if animated else (W, H)
        if s.get("hdr"):
            chain.append(f"scale={bw}:{bh}:flags=bicubic")
            chain.append(TM.format(npl=s.get("npl", 203)))
        else:
            chain.append(f"scale={bw}:{bh}:flags=lanczos,format=yuv420p")
        if sp != 1.0:
            chain.append(f"setpts=(PTS-STARTPTS)/{sp}")
        chain.append(f"fps={FPS}")
        chain.append(f"tpad=stop_mode=clone:stop=30,trim=end_frame={n},setpts=PTS-STARTPTS")
        if animated:
            # smoothstep ease, supersampled 2x so the push has no pixel stepping
            p = f"(on/{max(n - 1, 1)})"
            e = f"({p}*{p}*(3-2*{p}))"
            zz = f"({z[0]}+({z[1]}-{z[0]})*{e})"
            chain.append(f"zoompan=z='{zz}':x='(iw-iw/zoom)*{fx}':y='(ih-ih/zoom)*{fy}':d=1:s={W}x{H}:fps={FPS}")
        elif z[0] != 1.0:
            sw, sh = int(W * z[0] / 2) * 2, int(H * z[0] / 2) * 2
            chain.append(f"scale={sw}:{sh}:flags=lanczos,crop={W}:{H}:{int((sw - W) * fx)}:{int((sh - H) * fy)}")
        if s.get("eq"):
            chain.append(s["eq"])
        chain.append("setsar=1,format=yuv420p")
        fc.append(v + ",".join(chain) + f"[v{i}]")
        D = n / FPS
        mute = (s.get("mute", False) or sp != 1.0) and i not in amap
        if mute:
            gain = 0.0
        else:
            cur = lufs(s.get("asrc", s["src"]), s.get("ain", s["in"]), dur)
            g_db = min(max(spec.get("dialogueLufs", -17) - cur, -6), s.get("maxGain", 24))
            g_db += s.get("gainDb", 0)
            if "gainSetDb" in s: g_db = s["gainSetDb"]
            gain = 10 ** (g_db / 20)
            s["_lufs"], s["_gainDb"] = cur, round(g_db, 1)
        fi, fo = s.get("fadeIn", 0.03), s.get("fadeOut", 0.03)
        fades = (f"afade=t=in:d={fi}," if fi > 0 else "") + (f"afade=t=out:st={max(D - fo, 0):.5f}:d={fo}," if fo > 0 else "")
        af = s.get("afilter", "anull")
        fc.append(f"[{amap.get(i, i)}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,"
                  f"highpass=f=70,{af},volume={gain:.4f},atrim=0:{D:.5f},asetpts=PTS-STARTPTS,"
                  f"{fades}apad=whole_dur={D:.5f},"
                  f"atrim=0:{D:.5f},asetpts=PTS-STARTPTS[a{i}]")
        timeline.append({**{k: v for k, v in s.items()}, "t0": round(t, 4), "t1": round(t + D, 4), "frames": n})
        t += D
    fc.append("".join(f"[v{i}][a{i}]" for i in range(len(shots))) + f"concat=n={len(shots)}:v=1:a=1[v][a]")
    out = os.path.join(d, "locked.mov")
    cmd += ["-filter_complex", ";".join(fc), "-map", "[v]", "-map", "[a]", "-r", str(FPS),
            "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", "-pix_fmt", "yuv420p",
            "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
            "-c:a", "pcm_s16le", "-ar", "48000", out]
    run(cmd)
    json.dump({"duration": t, "shots": timeline}, open(os.path.join(d, "timeline.json"), "w"), indent=1)
    run(["ffmpeg", "-hide_banner", "-y", "-i", out, "-vn", "-ac", "1", "-ar", "16000", os.path.join(d, "locked.wav")])
    print(f"locked {t:.3f}s  ->  {out}")
    for s in timeline:
        print(f"  {s['t0']:7.2f}-{s['t1']:7.2f}  {os.path.basename(s['src'])}  {s['in']}-{s['out']}"
              f"  gain {s.get('_gainDb', 'mute')}")


def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def text_png(path, lines, size, cy, weight=800, fill=(255, 255, 255), stroke=None, align="center",
             right=None, box=None, maxw=920, top=None):
    """Bold text, dark outline + soft shadow. cy = vertical centre in px."""
    while True:
        f = font(size, weight)
        widths = [ImageDraw.Draw(Image.new("RGBA", (10, 10))).textlength(l, font=f) for l in lines]
        if max(widths) <= maxw or size <= 30:
            break
        size -= 2
    st = stroke if stroke is not None else max(4, round(size * 0.11))
    lh = round(size * 1.18)
    total = lh * len(lines)
    y0 = (top if top is not None else cy - total / 2)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ds, d = ImageDraw.Draw(sh), ImageDraw.Draw(img)
    for i, (l, w) in enumerate(zip(lines, widths)):
        x = (right - w) if right is not None else (W - w) / 2
        y = y0 + i * lh
        if box:
            pad = round(size * 0.35)
            d.rounded_rectangle([x - pad, y - pad * 0.2, x + w + pad, y + lh + pad * 0.1], radius=pad, fill=box)
            d.text((x, y), l, font=f, fill=fill)
        else:
            ds.text((x + 3, y + 5), l, font=f, fill=(0, 0, 0, 170), stroke_width=st, stroke_fill=(0, 0, 0, 170))
            d.text((x, y), l, font=f, fill=fill, stroke_width=st, stroke_fill=(0, 0, 0, 255))
    out = Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)), img)
    out.save(path)
    return max(widths), size


def rich_png(path, spans, size, cy, weight=800):
    """one line, each span its own colour (matches the old edit's white + yellow word)."""
    f = font(size, weight)
    dr = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    text = "".join(t for t, _ in spans)
    total = dr.textlength(text, font=f)
    st = max(4, round(size * 0.11))
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d, ds = ImageDraw.Draw(img), ImageDraw.Draw(sh)
    x0 = (W - total) / 2; y = cy - size * 1.18 / 2
    ds.text((x0 + 3, y + 5), text, font=f, fill=(0, 0, 0, 170), stroke_width=st, stroke_fill=(0, 0, 0, 170))
    d.text((x0, y), text, font=f, fill=(0, 0, 0, 255), stroke_width=st, stroke_fill=(0, 0, 0, 255))
    done = ""
    for t, col in spans:
        d.text((x0 + dr.textlength(done, font=f), y), t, font=f, fill=tuple(col))
        done += t
    Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)), img).save(path)
    return x0, total


def final(spec, d, audio_only=False):
    locked = os.path.join(d, "locked.mov")
    tl = json.load(open(os.path.join(d, "timeline.json")))
    T = tl["duration"]
    ov = os.path.join(d, "ov")
    os.makedirs(ov, exist_ok=True)
    caps = json.load(open(os.path.join(d, "captions.json"))) if os.path.exists(os.path.join(d, "captions.json")) else []
    cs = spec.get("captionStyle", {})
    inputs, fc, last = ["-i", locked], [], "[0:v]"
    k = 1
    stills = []  # (png, t0, t1, fade)
    hp = os.path.join(ov, "handle.png")
    if spec.get("handle", "@thesocialaccords"):          # "handle": "" in the spec = no logo (Tal, 2026-10-13: "take off the logo on the top right")
        text_png(hp, [spec.get("handle", "@thesocialaccords")], 34, 0, weight=700, right=W - 150, top=236, stroke=4)
        stills.append((hp, 0, T, 0))
    if spec.get("title"):
        ti = spec["title"]
        tp = os.path.join(ov, "title.png")
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        y = ti.get("y", 330)
        for li, line in enumerate(ti["lines"]):
            p = os.path.join(ov, f"title{li}.png")
            sz = ti["sizes"][li]
            text_png(p, [line], sz, 0, weight=900, top=y, maxw=900,
                     fill=tuple(ti.get("colors", [[255, 255, 255]] * 9)[li]))
            img = Image.alpha_composite(img, Image.open(p))
            y += round(sz * 1.25)
        img.save(tp)
        stills.append((tp, ti.get("t0", 0), ti["t1"], 0.35))
    for li, lab in enumerate(spec.get("labels", [])):
        p = os.path.join(ov, f"label{li}.png")
        text_png(p, [lab["text"]], 60, lab.get("y", 1330), weight=800, fill=(20, 20, 20), box=(255, 244, 170, 255))
        stills.append((p, lab["t0"], lab["t1"], 0.2))
    for ci, c in enumerate(caps):
        p = os.path.join(ov, f"cap{ci:03d}.png")
        if c.get("spans"):
            rich_png(p, c["spans"], cs.get("size", 66), c.get("y", cs.get("y", 1400)), weight=cs.get("weight", 800))
        else:
            text_png(p, c["text"].split("\n"), cs.get("size", 66), c.get("y", cs.get("y", 1400)), weight=cs.get("weight", 800),
                     maxw=cs.get("maxw", 900))
        stills.append((p, c["t0"], c["t1"], 0))
    if audio_only:
        stills = []
    else:
        for di, dl in enumerate(spec.get("erase", [])):
            fc.append(f"{last}delogo=x={dl['x']}:y={dl['y']}:w={dl['w']}:h={dl['h']}:enable='gte(t,{dl['t0']})*lt(t,{dl['t1']})'[e{di}]")
            last = f"[e{di}]"
    for p, t0, t1, fade in stills:
        if fade:
            inputs += ["-loop", "1", "-t", f"{T:.3f}", "-i", p]
            a, b = max(t0, 0), t1
            pre = f"[{k}:v]format=rgba,fade=t=in:st={a:.3f}:d={fade}:alpha=1,fade=t=out:st={b - fade:.3f}:d={fade}:alpha=1[o{k}]"
            fc.append(pre)
            fc.append(f"{last}[o{k}]overlay=0:0:enable='between(t,{a:.3f},{b:.3f})'[x{k}]")
        else:
            inputs += ["-i", p]
            fc.append(f"{last}[{k}:v]overlay=0:0:enable='gte(t,{t0:.3f})*lt(t,{t1:.3f})'[x{k}]")
        last = f"[x{k}]"
        k += 1
    # audio: dialogue + music beds
    amix = ["[0:a]anull[dlg]"]
    names = ["[dlg]"]
    for mi, m in enumerate(spec.get("music", [])):
        dur = m["t1"] - m["t0"]
        inputs += ["-ss", f"{m['ss']:.3f}", "-t", f"{dur:.3f}", "-i", m["src"]]
        fi, fo = m.get("fadeIn", 0.8), m.get("fadeOut", 1.5)
        flt = m.get("filter", "highpass=f=90")
        amix.append(f"[{k}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,{flt},"
                    f"volume={10 ** (m['gainDb'] / 20):.4f},afade=t=in:d={fi},afade=t=out:st={dur - fo:.3f}:d={fo},"
                    f"adelay={int(m['t0'] * 1000)}:all=1[m{mi}]")
        names.append(f"[m{mi}]")
        k += 1
    g = spec.get("_masterDb", 0)
    amix.append("".join(names) + f"amix=inputs={len(names)}:normalize=0:duration=first,volume={10 ** (g / 20):.4f},"
                                 f"alimiter=limit=0.84:attack=3:release=60:level=disabled[a]")
    fc += amix
    out = os.path.join(d, spec["out"])
    if audio_only:
        return ["ffmpeg", "-hide_banner", "-y"] + inputs + ["-filter_complex", ";".join(amix), "-map", "[a]", "-t", f"{T:.4f}", os.path.join(d, "_mix.wav")], None
    cmd = ["ffmpeg", "-hide_banner", "-y"] + inputs + ["-filter_complex", ";".join(fc), "-map", last, "-map", "[a]",
           "-t", f"{T:.4f}", "-r", str(FPS), "-c:v", "libx264", "-crf", str(spec.get("crf", 18)), "-preset", spec.get("preset", "medium"),
           "-pix_fmt", "yuv420p", "-profile:v", "high", "-color_range", "tv", "-colorspace", "bt709",
           "-color_primaries", "bt709", "-color_trc", "bt709", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
           "-movflags", "+faststart", out]
    return cmd, out


def main():
    mode, sp = sys.argv[1], sys.argv[2]
    spec = json.load(open(sp, encoding="utf-8"))
    d = os.path.join(HERE, spec["name"])
    os.makedirs(d, exist_ok=True)
    if mode == "lock":
        lock(spec, d)
    else:
        # two-pass static loudness: measure the mix, then apply one gain
        spec["_masterDb"] = 0
        tmp = os.path.join(d, "_mix.wav")
        pc, _ = final(spec, d, audio_only=True)
        run(pc)
        cur = lufs(tmp, 0, 9999)
        spec["_masterDb"] = round(spec.get("targetLufs", -14) - cur, 2)
        cmd, out = final(spec, d)
        run(cmd)
        os.remove(tmp)
        print(f"mix measured {cur} LUFS -> master {spec['_masterDb']} dB\nfinal -> {out}  now {lufs(out, 0, 9999)} LUFS")


main()
