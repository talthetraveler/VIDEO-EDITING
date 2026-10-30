"""Reframe one raw .insv to 9:16: find the people, aim a level camera at them, pick the best stretch.

    PY = system/vendor/Autocrop-vertical/.venv/Scripts/python.exe  (cv2, ultralytics, yolov8n.pt)
    PY system/tools/insv-reframe.py analyze <clip.insv> --out <dir>
    PY system/tools/insv-reframe.py render  <clip.insv> --out <dir> [--size 540x960] [--name x.mp4]

`analyze` writes <dir>/plan.json: the camera path, each sample's score and the chosen span.
`render` reads it. Edit plan.json by hand to change the aim, the span or the zoom.
The picture is world-locked and level from the gyro, one lens wherever the view fits inside it.
"""
import argparse
import json
import math
import os
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from insv import Insv, decode, equirect_dirs, quat_matrix  # noqa: E402

YOLO_WEIGHTS = Path(__file__).parents[1] / "vendor/Autocrop-vertical/yolov8n.pt"
SAMPLE_FPS = 4
EQ_W, EQ_H = 1600, 800
LENS_REACH_DEG = 98.0     # beyond this a lens's rim is too soft to use
HALF_V_FOV_DEG = 48.0     # default zoom, rectilinear


def rot_view(yaw, pitch):
    """View -> world. Yaw from world forward towards +x, pitch up."""
    y, p = math.radians(yaw), math.radians(pitch)
    cy, sy, cp, sp = math.cos(y), math.sin(y), math.cos(p), math.sin(p)
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])  # y is down: pitch up is minus y
    return Ry @ Rx


def view_dirs(w, h, half_v_deg):
    tv = math.tan(math.radians(half_v_deg))
    th = tv * w / h
    xs = (np.arange(w) + 0.5) / w * 2 - 1
    ys = (np.arange(h) + 0.5) / h * 2 - 1
    x, y = np.meshgrid(xs * th, ys * tv)
    d = np.stack([x, y, np.ones_like(x)], -1)
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


class Motion:
    def __init__(self, clip):
        self.t, q = clip.orientation()
        self.R = quat_matrix(q)

    def at(self, t):
        return self.R[min(int(np.searchsorted(self.t, t)), len(self.t) - 1)]


def smooth(a, sigma):
    """Gaussian along time, edges held, in samples."""
    r = max(1, int(3 * sigma))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    return np.convolve(np.pad(a, r, mode="edge"), k, "valid")


def analyze(args):
    from ultralytics import YOLO
    clip = Insv(args.clip)
    motion = Motion(clip)
    model = YOLO(str(YOLO_WEIGHTS))
    side = 1440
    k = side / clip.width
    dirs = equirect_dirs(EQ_W, EQ_H)
    samples, prev = [], None
    wrap = EQ_W // 8  # people on the panorama's edge
    for n, (a, b) in enumerate(decode(args.clip, side, rate=SAMPLE_FPS)):
        t = n / SAMPLE_FPS
        m0, m1, w = clip.blend_map(dirs @ motion.at(t))
        i0 = cv2.remap(a, m0[0] * k, m0[1] * k, cv2.INTER_LINEAR)
        i1 = cv2.remap(b, m1[0] * k, m1[1] * k, cv2.INTER_LINEAR)
        eq = (i0 * w[..., None] + i1 * (1 - w[..., None])).astype(np.uint8)
        boxes = model.predict(np.hstack([eq, eq[:, :wrap]]), imgsz=1600, classes=[0], conf=0.3,
                              verbose=False)[0].boxes
        people = []
        for (x1, y1, x2, y2), c in zip(boxes.xyxy.cpu().numpy(), boxes.conf.cpu().numpy()):
            cx = (x1 + x2) / 2
            if cx >= EQ_W:
                continue
            people.append({"lon": cx / EQ_W * 360 - 180, "lat": 90 - (y1 * 0.7 + y2 * 0.3) / EQ_H * 180,
                           "w": (x2 - x1) / EQ_W * 360, "h": (y2 - y1) / EQ_H * 180, "conf": float(c)})
        small = cv2.cvtColor(cv2.resize(eq, (400, 200), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        change = 0.0 if prev is None else float(np.abs(small.astype(float) - prev).mean())
        prev = small.astype(float)
        samples.append({"t": t, "people": people, "change": change})
        if n % 8 == 0:
            print(f"t={t:.1f} people={len(people)} change={change:.1f}", flush=True)

    # the subject is where the most person area sits; aim at its area-weighted middle
    lons = np.array([p["lon"] for s in samples for p in s["people"]])
    area = np.array([p["w"] * p["h"] for s in samples for p in s["people"]])
    if len(lons) == 0:
        raise SystemExit("no people found: this clip needs a hand-set aim in plan.json")
    hist = np.zeros(360)
    np.add.at(hist, ((lons + 180).astype(int)) % 360, area)
    wide = np.convolve(np.r_[hist[-45:], hist, hist[:45]], np.ones(61), "same")[45:-45]
    home = float(np.argmax(wide) - 180)

    def off(lon):
        return (lon - home + 180) % 360 - 180

    yaw, pitch, have, fill = [], [], [], []
    for s in samples:
        near = [p for p in s["people"] if abs(off(p["lon"])) < 60]
        if near:
            wt = np.array([p["w"] * p["h"] for p in near])
            yaw.append(home + float(np.average([off(p["lon"]) for p in near], weights=wt)))
            pitch.append(float(np.average([p["lat"] for p in near], weights=wt)))
            fill.append(float(wt.sum()))
        else:
            yaw.append(np.nan)
            pitch.append(np.nan)
            fill.append(0.0)
        have.append(bool(near))
    idx = np.arange(len(samples))
    h = np.array(have)
    sigma = 1.0 * SAMPLE_FPS
    yaw = smooth(np.interp(idx, idx[h], np.array(yaw)[h]), sigma)
    pitch = smooth(np.interp(idx, idx[h], np.array(pitch)[h]), sigma)

    # best stretch: people on screen, and the picture changing (the near world moving past)
    change = np.array([s["change"] for s in samples])
    fill = np.array(fill)
    score = 0.6 * fill / max(fill.max(), 1e-6) + 0.4 * change / max(np.percentile(change, 98), 1e-6)
    win = int(args.seconds * SAMPLE_FPS)
    totals = np.convolve(score, np.ones(win), "valid")
    best = int(np.argmax(totals))
    plan = {
        "clip": args.clip, "camera": clip.model, "fps": clip.fps, "duration": clip.duration,
        "home_yaw": home, "span": [best / SAMPLE_FPS, (best + win) / SAMPLE_FPS],
        "half_v_fov": HALF_V_FOV_DEG, "pitch_bias": 0.0,
        "path": [{"t": i / SAMPLE_FPS, "yaw": round(float(yaw[i]), 2), "pitch": round(float(pitch[i]), 2),
                  "score": round(float(score[i]), 3), "fill": round(float(fill[i]), 1),
                  "change": round(float(change[i]), 2), "people": len(samples[i]["people"])}
                 for i in idx],
    }
    os.makedirs(args.out, exist_ok=True)
    Path(args.out, "plan.json").write_text(json.dumps(plan, indent=1))
    print("home yaw", round(home, 1), "span", plan["span"], "frames with a subject", int(h.sum()), "of", len(h))


def render(args):
    clip = Insv(args.clip)
    motion = Motion(clip)
    plan = json.loads(Path(args.out, "plan.json").read_text())
    W, H = (int(x) for x in args.size.split("x"))
    start, end = plan["span"] if args.span is None else [float(x) for x in args.span.split(",")]
    side = 2880 if H >= 1920 else 1920
    k = side / clip.width
    gw, gh = W // 4, H // 4
    grid = view_dirs(gw, gh, plan["half_v_fov"])
    pt = np.array([p["t"] for p in plan["path"]])
    py = np.array([p["yaw"] for p in plan["path"]])
    pp = np.array([p["pitch"] for p in plan["path"]]) + plan.get("pitch_bias", 0.0)
    times = clip.frame_times()
    first = int(math.ceil(start * clip.fps))
    name = args.name or f"{Path(args.clip).stem}_9x16_{H}.mp4"
    out = str(Path(args.out, name))
    enc = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
        "-r", f"{clip.fps}", "-i", "-", "-ss", f"{start:.3f}", "-t", f"{end - start:.3f}", "-i", args.clip,
        "-map", "0:v", "-map", "1:a", "-shortest",
        "-vf", "fps=30,scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20" if H >= 1920 else "24",
        "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    use, counts = None, {0: 0, 1: 0, "blend": 0}
    log = []
    for n, (a, b) in enumerate(decode(args.clip, side, start, end - start)):
        i = first + n
        t = float(times[min(i, len(times) - 1)])
        yaw, pitch = float(np.interp(t, pt, py)), float(np.interp(t, pt, pp))
        d = grid @ rot_view(yaw, pitch).T @ motion.at(t)
        (x0, y0, th0), (x1, y1, th1) = clip.lenses[0].project(d), clip.lenses[1].project(d)
        reach = [float(np.degrees(th0.max())), float(np.degrees(th1.max()))]
        fits = [reach[0] < LENS_REACH_DEG, reach[1] < LENS_REACH_DEG]
        if use is None or not fits[use]:
            use = 0 if fits[0] and (not fits[1] or reach[0] <= reach[1]) else (1 if fits[1] else None)
        size = (W, H)
        if use is not None:
            mx, my = (x0, y0) if use == 0 else (x1, y1)
            src = a if use == 0 else b
            frame = cv2.remap(src, cv2.resize(mx * k, size), cv2.resize(my * k, size),
                              cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            counts[use] += 1
        else:
            w = np.clip(0.5 + (th1 - th0) / math.radians(16.0), 0, 1).astype(np.float32)
            f0 = cv2.remap(a, cv2.resize(x0 * k, size), cv2.resize(y0 * k, size), cv2.INTER_CUBIC,
                           borderMode=cv2.BORDER_REPLICATE)
            f1 = cv2.remap(b, cv2.resize(x1 * k, size), cv2.resize(y1 * k, size), cv2.INTER_CUBIC,
                           borderMode=cv2.BORDER_REPLICATE)
            ww = cv2.resize(w, size)[..., None]
            frame = (f0 * ww + f1 * (1 - ww)).astype(np.uint8)
            counts["blend"] += 1
        log.append((round(t, 2), use, round(yaw, 1), round(pitch, 1)))
        enc.stdin.write(frame.tobytes())
    enc.stdin.close()
    enc.wait()
    print(out, "frames", len(log), "lens use", counts, "exit", enc.returncode)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("command", choices=["analyze", "render"])
    p.add_argument("clip")
    p.add_argument("--out", required=True)
    p.add_argument("--seconds", type=float, default=8.0)
    p.add_argument("--size", default="540x960")
    p.add_argument("--span", help="start,end in seconds, overrides plan.json")
    p.add_argument("--name")
    a = p.parse_args()
    (analyze if a.command == "analyze" else render)(a)


if __name__ == "__main__":
    main()
