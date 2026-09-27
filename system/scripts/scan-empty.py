# How much of a finished film has NO visible person in it.
#
# Tal has said this three different ways: "only use steady clips", the empty
# pavement captioned "HOW ARE YOU", and now a wheelbarrow captioned "FOR YOU".
# The builder warns per beat; this measures the finished FILM so the worst
# offenders can be found without watching all 32.
import sys, os, json, subprocess
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vendor/cv410"))
import cv2

HAAR = cv2.data.haarcascades
front = cv2.CascadeClassifier(HAAR + "haarcascade_frontalface_default.xml")
alt   = cv2.CascadeClassifier(HAAR + "haarcascade_frontalface_alt2.xml")
prof  = cv2.CascadeClassifier(HAAR + "haarcascade_profileface.xml")
hog = cv2.HOGDescriptor(); hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

def has_person(img):
    g = cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    for c in (front, alt):
        if len(c.detectMultiScale(g, 1.08, 6, minSize=(30, 30))): return True
    if len(prof.detectMultiScale(g, 1.08, 6, minSize=(30, 30))): return True
    if len(prof.detectMultiScale(cv2.flip(g, 1), 1.08, 6, minSize=(30, 30))): return True
    r, _ = hog.detectMultiScale(img, winStride=(8, 8), padding=(8, 8), scale=1.05)
    return len(r) > 0

path = sys.argv[1]; N = int(sys.argv[2]) if len(sys.argv) > 2 else 12
cap = cv2.VideoCapture(path)
dur = cap.get(cv2.CAP_PROP_FRAME_COUNT) / max(1e-6, cap.get(cv2.CAP_PROP_FPS))
seen, tried, empties = 0, 0, []
for i in range(N):
    t = dur * (i + 0.5) / N
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000.0)
    ok, img = cap.read()
    if not ok or img is None: continue
    small = cv2.resize(img, (720, int(img.shape[0] * 720 / img.shape[1])))
    tried += 1
    if has_person(small): seen += 1
    else: empties.append(round(t, 1))
cap.release()
print(json.dumps({"file": os.path.basename(path), "seen": seen, "of": tried,
                  "empty_at": empties}))
