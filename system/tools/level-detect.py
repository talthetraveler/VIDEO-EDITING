"""LEVEL-DETECT - how many degrees off level is a clip?

Tal, 2026-09-29: some POV shots are "not rotated, not straight" - Meta glasses
footage comes in a few degrees off when his head is tilted. build-edit can
turn a sideways clip 90 degrees but had no small-angle straightening.

Method: sample frames, find long straight edges (Canny + probabilistic Hough),
keep the near-VERTICAL ones (building edges, poles, door frames - they stay
vertical in the world whatever the pitch; horizontals bend with perspective),
and take the length-weighted median of how far they lean.

Output (JSON, one object per file):
  {"file", "tilt": <degrees to rotate CLOCKWISE to level it>, "lines", "confidence"}
Sign convention verified by tools/level-detect.py --selftest: a frame rotated
counter-clockwise by N degrees comes back as tilt=+N.

  python tools/level-detect.py <video> [<video> ...] [--frames 5]
  python tools/level-detect.py --selftest <video>
"""
import json, math, subprocess, sys, tempfile, os
import cv2
import numpy as np

FF = "ffmpeg"


def grab(path, t, out):
    subprocess.run([FF, "-v", "error", "-ss", f"{t:.2f}", "-i", path, "-frames:v", "1",
                    "-vf", "scale=720:-2", out, "-y"], check=True)


def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", path], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


def lean_of_image(img):
    """Return list of (lean_degrees, weight) for near-vertical lines.
    lean > 0 means the line's top is to the RIGHT of its bottom."""
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    g = cv2.GaussianBlur(g, (5, 5), 0)
    edges = cv2.Canny(g, 60, 160)
    h, w = g.shape
    minlen = int(0.12 * max(h, w))
    lines = cv2.HoughLinesP(edges, 1, np.pi / 360, threshold=60, minLineLength=minlen, maxLineGap=8)
    out = []
    if lines is None:
        return out
    # OpenCV 5 returns (N, 4); OpenCV 4 returned (N, 1, 4). reshape covers both.
    for x1, y1, x2, y2 in np.asarray(lines).reshape(-1, 4):
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy)
        if dy == 0:
            continue
        if dy > 0:  # make the line point upward (y decreases upward in images)
            dx, dy = -dx, -dy
        lean = math.degrees(math.atan2(dx, -dy))  # 0 = vertical, + = top leans right
        if abs(lean) <= 15:
            out.append((lean, L))
    return out


def wmedian(pairs):
    pairs = sorted(pairs)
    tot = sum(w for _, w in pairs)
    acc = 0
    for v, w in pairs:
        acc += w
        if acc >= tot / 2:
            return v
    return 0.0


def measure(path, n=5):
    d = duration(path)
    if d <= 0:
        return {"file": path, "tilt": 0.0, "lines": 0, "confidence": 0.0, "error": "no duration"}
    pairs = []
    with tempfile.TemporaryDirectory() as td:
        for k in range(n):
            t = d * (k + 0.5) / n
            f = os.path.join(td, f"f{k}.png")
            try:
                grab(path, t, f)
            except subprocess.CalledProcessError:
                continue
            img = cv2.imread(f)
            if img is not None:
                pairs += lean_of_image(img)
    if len(pairs) < 4:
        return {"file": path, "tilt": 0.0, "lines": len(pairs), "confidence": 0.0}
    lean = wmedian(pairs)
    # spread of the leans around the median = how much the lines agree
    spread = float(np.median([abs(v - lean) for v, _ in pairs]))
    conf = max(0.0, min(1.0, (len(pairs) / 20.0) * (1.0 - min(spread, 6.0) / 6.0)))
    # a line whose top leans RIGHT means the picture was rotated clockwise ->
    # level it by rotating COUNTER-clockwise, i.e. tilt = -lean
    return {"file": path, "tilt": round(-lean, 2), "lines": len(pairs),
            "spread": round(spread, 2), "confidence": round(conf, 2)}


def selftest(path):
    """Rotate a real frame by known angles and demand them back."""
    d = duration(path)
    with tempfile.TemporaryDirectory() as td:
        base = os.path.join(td, "b.png")
        grab(path, d / 2, base)
        img = cv2.imread(base)
        h, w = img.shape[:2]
        base_lean = wmedian(lean_of_image(img)) if lean_of_image(img) else 0.0
        print(f"base frame lean {base_lean:+.2f} (its own tilt, subtracted below)")
        for ccw in (-6, -3, 0, 3, 6):
            M = cv2.getRotationMatrix2D((w / 2, h / 2), ccw, 1.0)  # +angle = counter-clockwise
            r = cv2.warpAffine(img, M, (w, h))
            pairs = lean_of_image(r)
            got = -(wmedian(pairs) - base_lean) if pairs else float("nan")
            print(f"rotated {ccw:+d} deg CCW -> detector tilt {got:+.2f} (want {ccw:+d})  lines={len(pairs)}")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "--selftest":
        selftest(a[1])
        sys.exit(0)
    n = 5
    if "--frames" in a:
        i = a.index("--frames"); n = int(a[i + 1]); del a[i:i + 2]
    print(json.dumps([measure(p, n) for p in a], indent=1))
