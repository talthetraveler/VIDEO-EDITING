"""Animated route map block (free: NASA Blue Marble, public domain, in system/tools/maps/world-nasa-8192.jpg).
route_map(pid, start, dur, points, out_img, lon0, lon1, lat0, lat1) -> (html, tl_lines, sfx)
  points = [("BOSTON", lon, lat), ("KABUL", lon, lat)]. The map is cropped to the lon/lat box at 1920px height, the camera
  pans from the first point to the last while a dotted red route is drawn, and each label stamps in when the route gets there."""
from PIL import Image
import os
Image.MAX_IMAGE_PIXELS = None
WORLD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "maps", "world-nasa-8192.jpg")


def route_map(pid, start, dur, points, out_img, lon0, lon1, lat0, lat1, track=0):
    w = Image.open(WORLD)
    W, H = w.size
    box = (int((lon0 + 180) / 360 * W), int((90 - lat1) / 180 * H), int((lon1 + 180) / 360 * W), int((90 - lat0) / 180 * H))
    crop = w.crop(box)
    mh = 1920
    mw = int(crop.width * mh / crop.height)
    crop.resize((mw, mh), Image.LANCZOS).save(out_img, quality=90)
    xy = [((lon - lon0) / (lon1 - lon0) * mw, (lat1 - lat) / (lat1 - lat0) * mh) for _, lon, lat in points]
    (x0, y0), (x1, y1) = xy[0], xy[-1]
    cxm, cym = (x0 + x1) / 2, min(y0, y1) - abs(x1 - x0) * 0.22
    d = f"M{x0:.0f} {y0:.0f} Q {cxm:.0f} {cym:.0f}, {x1:.0f} {y1:.0f}"
    plen = int(((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5 * 1.25)
    px0, px1 = min(0, 540 - x0), max(1080 - mw, 540 - x1)
    px0, px1 = max(1080 - mw, px0), min(0, px1)
    draw0, draw1 = start + 0.7, start + dur - 1.0
    labs = ""
    for i, ((name, _, _), (x, y)) in enumerate(zip(points, xy)):
        labs += f'<div class="mdot" id="{pid}d{i}" style="left:{x - 26:.0f}px;top:{y - 26:.0f}px"></div><div class="mlab" id="{pid}l{i}" style="left:{x - 300:.0f}px;top:{y + 46:.0f}px">{name}</div>'
    html = f'''      <div id="{pid}" class="clip" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{track}"><div class="mapcam" id="{pid}c" style="width:{mw}px">
        <img src="{out_img}" style="width:{mw}px;height:{mh}px;filter:saturate(.75) brightness(.72) contrast(1.08)" />
        <svg width="{mw}" height="{mh}" viewBox="0 0 {mw} {mh}" style="position:absolute;left:0;top:0"><defs><mask id="{pid}m"><path id="{pid}p" d="{d}" fill="none" stroke="#fff" stroke-width="40"/></mask></defs>
        <g mask="url(#{pid}m)"><path d="{d}" fill="none" stroke="#ff3b30" stroke-width="18" stroke-linecap="round" stroke-dasharray="2 38"/></g></svg>{labs}</div></div>'''
    tl = [f'gsap.set("#{pid}p", {{strokeDasharray:{plen}, strokeDashoffset:{plen}}}); tl.to("#{pid}p", {{strokeDashoffset:0, duration:{draw1 - draw0:.2f}, ease:"power1.inOut"}}, {draw0:.2f});',
          f'tl.fromTo("#{pid}c", {{x:{px0:.0f}, scale:1.0}}, {{x:{px1:.0f}, scale:1.0, duration:{dur - 0.6:.2f}, ease:"power1.inOut"}}, {start + 0.3:.2f});']
    sfx = [(draw0, "swish")]
    for i in range(len(points)):
        t = start + 0.25 if i == 0 else draw1 - 0.05
        tl.append(f'tl.fromTo("#{pid}d{i}", {{scale:0}}, {{scale:1, duration:0.18, ease:"back.out(3)"}}, {t:.2f}); tl.fromTo("#{pid}l{i}", {{opacity:0, scale:1.6}}, {{opacity:1, scale:1, duration:0.14, ease:"power4.out"}}, {t + 0.08:.2f});')
        sfx.append((t, "stamp"))
    return html, tl, sfx


MAP_CSS = '''
.mapcam { position: absolute; left: 0; top: 0; height: 1920px; transform-origin: 0 0; }
.mdot { position: absolute; width: 52px; height: 52px; border-radius: 50%; background: #ff3b30; border: 5px solid #fff; box-sizing: border-box; box-shadow: 0 4px 14px rgba(0,0,0,.6); }
.mlab { position: absolute; width: 600px; text-align: center; font: 900 96px/1 "Montserrat", Arial, sans-serif; letter-spacing: .02em; color: #fff; -webkit-text-stroke: 10px #0b0b0d; paint-order: stroke fill; }
'''


def stack_words(pid, start, dur, lines, top=560, track=4):
    """Words stacking up line by line over footage (the 'is trying to / find her / and discredit / her' block)."""
    spans = "".join(f'<div class="stl" id="{pid}s{i}">{l}</div>' for i, l in enumerate(lines))
    html = f'      <div id="{pid}" class="clip" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{track}"><div class="stack" style="top:{top}px">{spans}</div></div>'
    step = (dur - 0.6) / len(lines)
    tl = [f'tl.fromTo("#{pid}s{i}", {{opacity:0, y:34}}, {{opacity:1, y:0, duration:0.14, ease:"power3.out"}}, {start + 0.15 + i * step:.2f});' for i in range(len(lines))]
    return html, tl, [(start + 0.15 + i * step, "tick2") for i in range(len(lines))]


STACK_CSS = '''
.stack { position: absolute; left: 90px; width: 900px; }
.stl { font: 900 96px/1.04 "Montserrat", Arial, sans-serif; letter-spacing: -0.02em; color: #fff; text-shadow: 0 6px 24px rgba(0,0,0,.6); }
'''
