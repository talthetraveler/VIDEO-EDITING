# WHERE ARE THE EYES? For effects that frame a talking head (scripts/effect.mjs
# shoulder): the face's centre, its width, and the eye line.
#
# face-box.py (Haar) was tried first and on a test clip it locked onto an old
# woman's HAND (a ring, skin, a knuckle "face") and the over-the-shoulder zoom
# pushed into her knuckles. This uses deface's CenterFace (a neural detector,
# already installed for face blurring) which also returns five landmarks, so
# the eye line is measured, not guessed from a box.
#
# Frames come from ffmpeg, which applies the rotation tag, so an iPhone clip
# stored 1280x720 at -90 is measured upright, the way it plays.
#
#   python scripts/face-eyes.py <video> <ss> <to> [samples]
# -> {"found":n,"of":m,"cx":..,"w":..,"eyeY":..,"score":..,"dx":..}  (0-1 of the upright frame)
import sys, json, subprocess, statistics as st
import numpy as np, cv2
from deface.centerface import CenterFace

vid, ss, to = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
N = int(sys.argv[4]) if len(sys.argv) > 4 else 5
cf = CenterFace()
hits = []
for i in range(N):
    t = ss + (to - ss) * (i + 0.5) / N
    png = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", vid, "-frames:v", "1",
                          "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    if not png:
        continue
    img = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_COLOR)
    H, W = img.shape[:2]
    dets, lms = cf(img, threshold=0.4)
    if len(dets) == 0:
        continue
    # the biggest face is the one talking to camera; passers-by are smaller
    j = max(range(len(dets)), key=lambda k: (dets[k][2] - dets[k][0]) * (dets[k][3] - dets[k][1]))
    x1, y1, x2, y2, score = dets[j][:5]
    lm = lms[j]                                   # x0,y0, x1,y1 ... : left eye, right eye, nose, mouth L, mouth R
    hits.append({"cx": (x1 + x2) / 2 / W, "w": (x2 - x1) / W, "eyeY": (lm[1] + lm[3]) / 2 / H, "score": float(score)})

if not hits:
    print(json.dumps({"found": 0, "of": N}))
else:
    med = lambda k: round(float(st.median(h[k] for h in hits)), 4)
    # dx: how far the face wanders across the window. A card is placed for the median; a face that moves can walk into it.
    dx = round(float(max(h["cx"] for h in hits) - min(h["cx"] for h in hits)), 4)
    print(json.dumps({"found": len(hits), "of": N, "cx": med("cx"), "w": med("w"), "eyeY": med("eyeY"), "score": med("score"), "dx": dx}))
