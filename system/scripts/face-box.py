# FACE-AWARE FRAMING.
#
# Tal, repeatedly: "zoom in on the face", "zoom in so it's emotional".
# The builder was doing a blind centre crop with a 1.05 push, so on Meta POV
# footage the subject ended up a tenth of the frame behind a water bottle with
# the wearer's own hand filling the bottom of the shot. This finds the subject
# and reports where they are, so the crop can be aimed at them.
#
# OpenCV 5 (the system cv2) DROPPED CascadeClassifier and HOGDescriptor, so
# this uses a vendored 4.10 in vendor/cv410 — installed with --target so the
# system cv2 is untouched. Do not "fix" the sys.path line by removing it.
#
# Three detectors, best first:
#   1. Haar frontal face       - the subject looking at camera
#   2. Haar profile (+mirror)  - the subject turned away
#   3. HOG full body           - too far for a face; frame the top of the body
# A detection is reported with WHICH detector found it, because a HOG body box
# is a much weaker claim about where the eyes are than a frontal face box.
#
#   python scripts/face-box.py <video> <ss> <to> [samples] [--debug out.png]
# -> {"found":n,"of":m,"by":"face|profile|body","cx":..,"cy":..,"w":..,"h":..}
import sys, os, json, statistics as st
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vendor/cv410"))
import numpy as np, cv2

vid, ss, to = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
rest = sys.argv[4:]
N = int(rest[0]) if rest and not rest[0].startswith("--") else 7
dbg = rest[rest.index("--debug") + 1] if "--debug" in rest else None
# A sideways clip must be uprighted BEFORE detection or every face is on its
# side and no cascade finds it. This mirrors the builder's transpose=N.
ROT = int(rest[rest.index("--rotate") + 1]) if "--rotate" in rest else 0
# IGNORE A BAND AT THE TOP OF FRAME.
# coffee-kindness is shot at a market stall with a PRINTED STENCIL PORTRAIT on
# the awning. Haar finds it every time, more reliably than it finds the living
# shop owner behind the counter, so auto-framing aimed the whole film at a
# poster and captioned "THE WORLD IS SO DIVIDED" over it. The poster is fixed
# scenery high in the frame; the people are not. --miny 0.30 discards any
# detection whose centre sits in the top 30% of the frame.
MINY = float(rest[rest.index("--miny") + 1]) if "--miny" in rest else 0.0

HAAR = cv2.data.haarcascades
front = cv2.CascadeClassifier(HAAR + "haarcascade_frontalface_default.xml")
alt   = cv2.CascadeClassifier(HAAR + "haarcascade_frontalface_alt2.xml")
prof  = cv2.CascadeClassifier(HAAR + "haarcascade_profileface.xml")
hog = cv2.HOGDescriptor(); hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

def detect_all(img):
    """Every face in the frame: [(x,y,w,h,kind)]. Frontal first, then profile."""
    h, w = img.shape[:2]
    g = cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    out = []
    for cas in (front, alt):
        for (x, y, bw, bh) in cas.detectMultiScale(g, 1.08, 6, minSize=(26, 26)):
            out.append((int(x), int(y), int(bw), int(bh), "face"))
    if not out:
        for (x, y, bw, bh) in prof.detectMultiScale(g, 1.08, 6, minSize=(26, 26)):
            out.append((int(x), int(y), int(bw), int(bh), "profile"))
        for (x, y, bw, bh) in prof.detectMultiScale(cv2.flip(g, 1), 1.08, 6, minSize=(26, 26)):
            out.append((int(w - x - bw), int(y), int(bw), int(bh), "profile"))
    if MINY > 0:
        out = [b for b in out if (b[1] + b[3] / 2) / max(1, h) >= MINY]
    # de-duplicate boxes the two cascades both found
    keep = []
    for b in out:
        if not any(abs(b[0]-k[0]) < b[2]*0.5 and abs(b[1]-k[1]) < b[3]*0.5 for k in keep):
            keep.append(b)
    return keep


def detect(img):
    """-> (x,y,w,h,kind) in pixels of img, or None. Box is the HEAD."""
    h, w = img.shape[:2]
    g = cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    for cas, kind in ((front, "face"), (alt, "face")):
        f = list(cas.detectMultiScale(g, 1.08, 6, minSize=(26, 26)))
        if f:
            x, y, bw, bh = max(f, key=lambda b: b[2] * b[3]); return (x, y, bw, bh, kind)
    f = list(prof.detectMultiScale(g, 1.08, 6, minSize=(26, 26)))
    if f:
        x, y, bw, bh = max(f, key=lambda b: b[2] * b[3]); return (x, y, bw, bh, "profile")
    f = list(prof.detectMultiScale(cv2.flip(g, 1), 1.08, 6, minSize=(26, 26)))
    if f:
        x, y, bw, bh = max(f, key=lambda b: b[2] * b[3]); return (w - x - bw, y, bw, bh, "profile")
    # too far away for a face: find the body and take the head-sized top of it
    r, _ = hog.detectMultiScale(img, winStride=(8, 8), padding=(8, 8), scale=1.05)
    r = [b for b in r if b[3] > h * 0.25]
    if len(r):
        x, y, bw, bh = max(r, key=lambda b: b[2] * b[3])
        hw = int(bw * 0.55)
        return (int(x + bw / 2 - hw / 2), y, hw, int(bh * 0.22), "body")
    return None

cap = cv2.VideoCapture(vid)
frames, shots, colors = [], [], {}
for i in range(N):
    t = ss + (to - ss) * (i + 0.5) / N
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000.0)
    ok, img = cap.read()
    if not ok or img is None:
        continue
    if ROT:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE if ROT == 1 else cv2.ROTATE_90_COUNTERCLOCKWISE)
    # DETECT AT 960, NOT 480.
    # The Sony frame is 2160x3840. Shrinking it to 480 wide takes the shop
    # owner's head from ~180px to ~40px and Haar stopped finding him entirely,
    # even though he is plainly visible and facing camera in every frame. The
    # only faces left were a passer-by in the foreground and printed text.
    # Detection cost scales with area, so this is ~4x slower per frame — worth
    # it, because framing on the wrong person is not a small error.
    s = 960.0 / img.shape[1]
    small = cv2.resize(img, (960, max(1, int(img.shape[0] * s))))
    H2, W2 = small.shape[:2]
    colors[i] = small.copy()
    found = detect_all(small)
    if not found:
        d = detect(small)                     # HOG body fallback
        found = [d] if d else []
    for (x, y, bw, bh, kind) in found:
        frames.append((i, (x + bw / 2) / W2, (y + bh / 2) / H2, bw / W2, bh / H2, kind))
        if dbg:
            col = {"face": (0, 255, 0), "profile": (0, 200, 255), "body": (255, 120, 0)}[kind]
            cv2.rectangle(small, (x, y), (x + bw, y + bh), col, 3)
            cv2.putText(small, kind, (x, max(14, y - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, col, 2)
    if dbg:
        shots.append(small)
cap.release()

if dbg and shots:
    hh = min(s.shape[0] for s in shots)
    cv2.imwrite(dbg, np.hstack([s[:hh] for s in shots]))

# WHICH PERSON IS THE SUBJECT.
#
# "Biggest face wins" is wrong for the way these are shot. On the Sony the
# INTERVIEWER stands nearest the lens with his back or shoulder to it, so his
# head is the biggest thing in frame while the person actually talking is
# further away behind a counter. Framing on the biggest face framed Tal's back
# for five beats of coffee-kindness.
#
# Track every face across the beat instead, group them into people by position,
# and choose the person who is FACING THE CAMERA most of the time. Someone
# turned away registers as a profile, or intermittently, or not at all; the
# person being interviewed looks at the lens and is detected frontally in frame
# after frame. That is the signal, and it does not depend on who is nearest.
if not frames:
    print(json.dumps({"found": 0, "of": N}))
    sys.exit(0)

people = []                       # each: list of (i, cx, cy, w, h, kind)
for f in frames:
    for p in people:
        # same person if the box centre is within ~1.2 head-widths of the group
        if abs(f[1] - p[-1][1]) < max(f[3], 0.05) * 1.6 and abs(f[2] - p[-1][2]) < max(f[4], 0.05) * 2.2:
            p.append(f); break
    else:
        people.append([f])

# A PRINTED FACE IS NOT A PERSON.
#
# The awning over this stall carries a large yellow POSTER of a man's face, and
# Haar finds it in every single frame. Because it never looks away, it scored
# as the most reliably camera-facing "person" in the shot and won the framing
# outright. Menu boards and strip lights do the same thing.
#
# Motion does not separate them: the camera is handheld, so the poster moves in
# the frame just as much as the people do. COLOUR does. A face is skin; a
# yellow screen-print, a white menu board and a fluorescent tube are not. This
# checks the middle of each candidate box for skin chroma in YCrCb, which is
# the one thing every real face here has and none of the false positives do.
def skin_fraction(p):
    """How much of this candidate's box is skin-coloured, 0..1."""
    vals = []
    for f in p:
        g = colors.get(f[0])
        if g is None:
            continue
        H3, W3 = g.shape[:2]
        # sample the middle half of the box - the edges catch hair andbackground
        x0, x1 = int(max(0, (f[1] - f[3] * 0.25) * W3)), int(min(W3, (f[1] + f[3] * 0.25) * W3))
        y0, y1 = int(max(0, (f[2] - f[4] * 0.25) * H3)), int(min(H3, (f[2] + f[4] * 0.25) * H3))
        if x1 - x0 < 4 or y1 - y0 < 4:
            continue
        patch = cv2.cvtColor(g[y0:y1, x0:x1], cv2.COLOR_BGR2YCrCb)
        Y, Cr, Cb = patch[:, :, 0], patch[:, :, 1], patch[:, :, 2]
        m = (Cr >= 133) & (Cr <= 180) & (Cb >= 77) & (Cb <= 130) & (Y >= 50)
        vals.append(float(m.mean()))
    return (sum(vals) / len(vals)) if vals else 0.0

SKIN = 0.30
real = [p for p in people if skin_fraction(p) >= SKIN]
if real:
    people = real

def score(p):
    seen = len({f[0] for f in p})                 # frames this person appears in
    frontal = sum(1 for f in p if f[5] == "face")
    return frontal * 2 + seen                     # facing camera counts double

best = max(people, key=score)
med = lambda k: st.median([f[k] for f in best])
kinds = [f[5] for f in best]
by = "face" if "face" in kinds else ("profile" if "profile" in kinds else "body")
spread = lambda k: (max(f[k] for f in best) - min(f[k] for f in best)) if len(best) > 1 else 0.0
print(json.dumps({"found": len({f[0] for f in best}), "of": N, "by": by,
                  "people": len(people),
                  "cx": round(med(1), 4), "cy": round(med(2), 4),
                  "w": round(med(3), 4), "h": round(med(4), 4),
                  "dx": round(spread(1), 4), "dy": round(spread(2), 4)}))
