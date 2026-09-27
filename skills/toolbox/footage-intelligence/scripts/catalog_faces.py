"""Footage intelligence — identify WHO is in every clip by face embedding (InsightFace).

Phase A: learn a NAMED reference face per person from the interviews (we know who's whom).
         the host = the face that recurs across the most interview clips; each subject = the
         dominant non-the host face in their own interview.
Phase B: match every other clip's faces against the references -> tag each clip with the
         people present. Writes faces-catalog.json + a per-person index.

Usage: python catalog_faces.py <footage_dir> <out_json>
Edit INTERVIEWS for the known clip->person mapping.
"""
import cv2, numpy as np, json, glob, os, sys
from insightface.app import FaceAnalysis

FOOT = sys.argv[1] if len(sys.argv) > 1 else "your project"
OUT = sys.argv[2] if len(sys.argv) > 2 else "faces-catalog.json"
INTERVIEWS = {"IMG_3815": "Speaker D", "IMG_3810": "Speaker A", "IMG_3809": "Speaker A",
              "IMG_3814": "Speaker B", "IMG_3811": "Speaker C"}
CLUSTER_T = 0.45   # same-person cosine threshold for reference clustering
MATCH_T = 0.40     # "this person is present in this clip" threshold

print("loading InsightFace buffalo_l (downloads model on first run)...", flush=True)
app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
app.prepare(ctx_id=-1, det_size=(640, 640))
print("ready", flush=True)

def clip_faces(path, n=6):
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
    dur = total / fps if fps else 0
    out = []
    for i in range(n):
        t = dur * (i + 0.5) / n if dur else 0
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, frame = cap.read()
        if not ok:
            continue
        for f in app.get(frame):
            if f.det_score > 0.5:
                area = float((f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
                out.append((f.normed_embedding.astype(np.float32), area))
    cap.release()
    return out

# ---- Phase A: references ----
print("Phase A: building reference faces from interviews", flush=True)
inst = []  # (clip, emb, area)
for clip in INTERVIEWS:
    p = os.path.join(FOOT, clip + ".mov")
    if not os.path.exists(p): continue
    fs = clip_faces(p, n=8)
    for e, a in fs: inst.append((clip, e, a))
    print("  scanned", clip, len(fs), "faces", flush=True)

clusters = []  # {embs, clips:set, centroid}
for clip, e, a in inst:
    best, bi = -1, -1
    for i, c in enumerate(clusters):
        s = float(np.dot(c["centroid"], e))
        if s > CLUSTER_T and s > best: best, bi = s, i
    if bi >= 0:
        clusters[bi]["embs"].append(e); clusters[bi]["clips"].add(clip)
        m = np.mean(clusters[bi]["embs"], axis=0); clusters[bi]["centroid"] = m / np.linalg.norm(m)
    else:
        clusters.append({"embs": [e], "clips": {clip}, "centroid": e})

clusters.sort(key=lambda c: (-len(c["clips"]), -len(c["embs"])))
anchor = clusters[0]
refs = {"the host": anchor["centroid"]}
for clip, name in INTERVIEWS.items():
    cand = [c for c in clusters if c is not anchor and clip in c["clips"]]
    if cand:
        cand.sort(key=lambda c: -len(c["embs"]))
        refs[name] = cand[0]["centroid"]
print("references built:", {n: True for n in refs}, "| the host spans", len(anchor["clips"]), "clips", flush=True)

# ---- Phase B: catalog every clip ----
print("Phase B: cataloging all clips", flush=True)
catalog = {}
clips = sorted(glob.glob(os.path.join(FOOT, "*.mov")))
for idx, p in enumerate(clips):
    clip = os.path.splitext(os.path.basename(p))[0]
    faces = clip_faces(p, n=6)
    score = {n: 0.0 for n in refs}; cnt = {n: 0 for n in refs}
    for e, a in faces:
        best, bn = -1, None
        for n, r in refs.items():
            s = float(np.dot(r, e))
            if s > best: best, bn = s, n
        if best > MATCH_T:
            cnt[bn] += 1; score[bn] = max(score[bn], round(best, 3))
    people = sorted([n for n in refs if cnt[n] >= 1], key=lambda n: -score[n])
    catalog[clip] = {"people": people, "scores": {n: score[n] for n in people},
                     "face_instances": len(faces), "is_interview": clip in INTERVIEWS}
    if idx % 15 == 0: print("  ...", idx, "/", len(clips), flush=True)

json.dump(catalog, open(OUT, "w"), indent=1)
# per-person index
byp = {}
for clip, c in catalog.items():
    for n in c["people"]:
        byp.setdefault(n, []).append(clip)
print("=== CATALOG DONE ->", OUT, "===", flush=True)
for n in sorted(byp, key=lambda n: -len(byp[n])):
    print("  %-9s %2d clips: %s" % (n, len(byp[n]), ", ".join(byp[n][:18])), flush=True)
print("CATALOG-COMPLETE", flush=True)
