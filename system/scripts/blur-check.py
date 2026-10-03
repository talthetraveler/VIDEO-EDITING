#!/usr/bin/env python
"""DID THE BLUR HOLD? Look for a recognisable face in EVERY frame of a blurred cut.

    vendor/OpenMontage/.venv/Scripts/python.exe scripts/blur-check.py \
        <blurred.mp4> <rules.json> <track.json> [--conf 0.5]

Exit 0 = no face found where the blurred person can be; 1 = leaks, listed.

Built 2026-10-03 after EDEN V11 shipped a gate-passing blur that had locked
onto a medical pump beside her head for ~20 frames - her face sat in the
clear just below it. Sampled stills (85 per film, every cut) did not catch
it; they were the wrong instrument for a shot where the tracker drifts in
the middle. This one asks the same detector that does the tracking to find
a face in the FINISHED picture, frame by frame, inside the region the
person is allowed to be in (rules.json). A properly blurred face is not
detectable; anything it finds is a leak.

It is validated against a known answer before it is trusted: on the V11
render above it must flag the frames where her face was visible.

A FACE INSIDE A BLUR ELLIPSE IS NOT A LEAK. The first version counted every
detection and flagged 1665 of 3111 frames: the detector still finds a
face-SHAPE in a blurred head (and it scored the pump the tracker had locked
onto at 0.78). The blur hides who she is, not that a head is there. So a hit
counts only when its centre lies outside every ellipse drawn on that frame
(track.json) - which is exactly the failure that shipped.
"""
import json
import sys

import cv2
import mediapipe as mp

src, rules_path, track_path = sys.argv[1:4]
conf = float(sys.argv[sys.argv.index("--conf") + 1]) if "--conf" in sys.argv else 0.5
rules = json.load(open(rules_path, encoding="utf8"))
T = json.load(open(track_path))
starts, ells = T["cuts"], T["track"]


def covered(i, cx, cy):
    """True when (cx, cy) - fractions of the frame - sits inside one of frame i's blur ellipses."""
    for ex, ey, rx, ry in (ells[i] if i < len(ells) else []):
        if ((cx * W - ex) / rx) ** 2 + ((cy * H - ey) / ry) ** 2 <= 0.8:
            return True
    return False
fd = [mp.solutions.face_detection.FaceDetection(model_selection=m, min_detection_confidence=conf) for m in (1, 0)]

cap = cv2.VideoCapture(src)
W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
ends = starts[1:] + [n]
leaks, bi, i = [], 0, 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    while bi + 1 < len(starts) and i >= ends[bi]:
        bi += 1
    beat = rules["beats"][bi]
    if beat.get("clear") or beat.get("prior") is None and beat.get("x", [0, 1])[0] >= 1:
        i += 1; continue
    x0, x1 = beat.get("x", [0, 1]); y0, y1 = beat.get("y", [0, 1])
    px0, px1 = int(max(0, x0 - 0.08) * W), int(min(1, x1 + 0.08) * W)
    py0, py1 = int(max(0, y0 - 0.10) * H), int(min(1, y1 + 0.10) * H)
    roi = cv2.cvtColor(frame[py0:py1, px0:px1], cv2.COLOR_BGR2RGB)
    s = min(3.0, 1400 / max(roi.shape[0], roi.shape[1]))
    for img, scale in ((roi, 1.0), (cv2.resize(roi, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC), s)):
        hit = None
        for d in fd:
            for det in (d.process(img).detections or []):
                b = det.location_data.relative_bounding_box
                cx = (px0 + (b.xmin + b.width / 2) * (px1 - px0)) / W
                cy = (py0 + (b.ymin + b.height / 2) * (py1 - py0)) / H
                if x0 <= cx <= x1 and y0 <= cy <= y1 and not covered(i, cx, cy):
                    hit = (round(cx, 3), round(cy, 3), round(float(det.score[0]), 2))
                    break
            if hit:
                break
        if hit:
            leaks.append((i, bi + 1) + hit); break
    i += 1
cap.release()

print(f"{i} frames checked, confidence >= {conf}")
if not leaks:
    print("NO FACE FOUND in the blurred regions - the blur held."); sys.exit(0)
runs, cur = [], [leaks[0]]
for l in leaks[1:]:
    if l[0] - cur[-1][0] <= 3 and l[1] == cur[-1][1]:
        cur.append(l)
    else:
        runs.append(cur); cur = [l]
runs.append(cur)
print(f"LEAK: a face was found in {len(leaks)} frames, {len(runs)} run(s):")
for r in runs:
    print(f"  beat {r[0][1]:02d}  f{r[0][0]}-f{r[-1][0]}  ({len(r)} frames)  at x {r[0][2]}, y {r[0][3]}  score {max(x[4] for x in r)}")
sys.exit(1)
