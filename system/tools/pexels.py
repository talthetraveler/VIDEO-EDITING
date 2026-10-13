"""Free stock video from Pexels for ILLUSTRATIVE b-roll (Pexels licence: free to use and edit, credit not required;
never imply the people shown are the real people in the story - label the shot "ILLUSTRATIVE STOCK").
  python pexels.py find "boy closed door night" [portrait]   -> prints ids + writes a contact sheet of the first frames
  python pexels.py get <id> <out.mp4> [max_height]            -> downloads that clip (default 1080 on the short side)
No key needed: it reads the public search page. If Pexels blocks that, put a free key in system/.env as PEXELS_API_KEY."""
import sys, re, os, json, subprocess, urllib.request, urllib.parse
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "pexels-cache")
os.makedirs(CACHE, exist_ok=True)


def page(q, orient):
    u = "https://www.pexels.com/search/videos/" + urllib.parse.quote(q) + "/" + (f"?orientation={orient}" if orient else "")
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read().decode("utf-8", "replace")


def files(html):
    out = {}
    for m in re.finditer(r"https://videos\.pexels\.com/video-files/(\d+)/[^\"\ ]+?_(\d+)_(\d+)_(\d+)fps\.mp4", html):
        out.setdefault(m.group(1), {})[(int(m.group(2)), int(m.group(3)))] = m.group(0)
    return out


if sys.argv[1] == "find":
    q = sys.argv[2]
    orient = sys.argv[3] if len(sys.argv) > 3 else ""
    f = files(page(q, orient))
    json.dump({k: {f"{w}x{h}": u for (w, h), u in v.items()} for k, v in f.items()}, open(os.path.join(CACHE, "last.json"), "w"), indent=0)
    from PIL import Image, ImageDraw
    ids = list(f)[:18]
    tiles = []
    for vid in ids:
        (w, h), u = min(f[vid].items(), key=lambda kv: kv[0][0] * kv[0][1])
        p = os.path.join(CACHE, f"{vid}_s.mp4")
        if not os.path.exists(p):
            open(p, "wb").write(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120).read())
        j = os.path.join(CACHE, f"{vid}.jpg")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "1", "-i", p, "-frames:v", "1", "-vf", "scale=200:200:force_original_aspect_ratio=decrease,pad=200:200:(ow-iw)/2:(oh-ih)/2", j])
        d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip()
        best = max(f[vid])
        print(vid, f"{best[0]}x{best[1]}", d + "s")
        if os.path.exists(j):
            tiles.append((vid, j))
    s = Image.new("RGB", (200 * 6, 200 * ((len(tiles) + 5) // 6)), "black")
    dr = ImageDraw.Draw(s)
    for i, (vid, j) in enumerate(tiles):
        x, y = (i % 6) * 200, (i // 6) * 200
        s.paste(Image.open(j), (x, y)); dr.rectangle([x, y, x + 80, y + 14], fill="black"); dr.text((x + 2, y + 1), vid, fill="yellow")
    s.save(os.path.join(CACHE, "sheet.jpg"), quality=85)
    print("sheet:", os.path.join(CACHE, "sheet.jpg"))
elif sys.argv[1] == "get":
    vid, out = sys.argv[2], sys.argv[3]
    mh = int(sys.argv[4]) if len(sys.argv) > 4 else 1080
    f = json.load(open(os.path.join(CACHE, "last.json"))).get(vid)
    if not f:
        f = {f"{w}x{h}": u for (w, h), u in files(urllib.request.urlopen(urllib.request.Request(f"https://www.pexels.com/video/{vid}/", headers=UA), timeout=60).read().decode("utf-8", "replace")).get(vid, {}).items()}
    ok = [(k, u) for k, u in f.items() if min(map(int, k.split("x"))) <= mh]
    k, u = max(ok or f.items(), key=lambda kv: int(kv[0].split("x")[0]) * int(kv[0].split("x")[1]))
    open(out, "wb").write(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=300).read())
    print("saved", out, k, "https://www.pexels.com/video/" + vid + "/")
