#!/usr/bin/env python
"""BLUR ONE PERSON'S FACE THROUGH A FINISHED CUT.

    vendor/OpenMontage/.venv/Scripts/python.exe scripts/blur-face.py \
        <in.mp4> <out.mp4> <rules.json> [--mask-only]

Built 2026-10-02 for EDEN HER STORY (Tal: "you should blur her face").
build-edit.mjs does not blur; this runs on its output.

WHY IT IS NOT JUST A FACE DETECTOR. A detector that misses one frame shows the
face for one frame, and that is the whole failure. So detection only STEERS:

  * every beat (shot) carries a PRIOR - where her head is, measured off a
    still - and a region her face must fall in, so the other person in a
    two-shot and the cartoon faces on a blanket are never picked;
  * frames with no detection are filled from their neighbours inside the same
    shot, and a shot with no detection at all uses the prior;
  * the blurred ellipse is the detected face padded out to the whole head, and
    never smaller than the prior's radius;
  * THE MASK RUNS ON THE VIDEO'S OWN CLOCK. ffmpeg's overlay pairs frames by
    TIMESTAMP, and build-edit's output is not a clean n/30 - it starts one
    frame in and gains a frame of pts at some joins. A mask clocked N/30 slid
    up to 3 frames off the picture, and on the last frame before a cut it sat
    where the NEXT shot's face would be while this shot's face was in the
    clear. mask_clock() rebuilds the video's real timestamps for the mask;
  * the cuts are located in the picture as a cross-check on the beat frame
    counts (they agreed exactly on EDEN V10), and for 2 frames either side of
    every cut BOTH shots' ellipses are drawn.

A small face is also looked for in an upscaled crop of the allowed region: in
the wide two-shot her face is ~90px and in profile, and the full-frame pass
found it in 0-12% of frames.

The picture is never round-tripped through RGB: python writes a grey MASK
video and ffmpeg merges a blurred copy through it in YUV, so every pixel
outside the ellipse is untouched by this pass apart from the re-encode.

rules.json:
  { "beats": [ {"frames": 141, "x": [0.6, 1], "y": [0.42, 0.7],
                "prior": [0.82, 0.49, 0.09], "from": 60,
                "keys": [[80, 0.94, 0.59], ...] }, ... ] }
  frames  the beat's NOMINAL length (ffprobe the beat file); the real cut is
          searched for within +-8 frames of the running sum
  x / y   allowed range of the face CENTRE, as a fraction of the frame
  prior   [cx, cy, radius-as-fraction-of-WIDTH], or null
  keys    hand keyframes [frame-in-beat, cx, cy] that OVERRIDE detection, for a
          moving shot the detector cannot follow (a face entering at the edge)
  from    first frame-in-beat to blur (she is not in the shot before it)
"""
import json
import subprocess
import sys

import cv2
import mediapipe as mp
import numpy as np

PAD_W, PAD_H = 1.25, 1.55      # detected face box -> half-axes of the head ellipse
SMOOTH = 9                     # frames, moving average on the track
FEATHER = 31                   # px, soft edge on the mask
EDGE = 2                       # frames either side of a cut that get both ellipses
SEARCH = 8                     # frames either side of the nominal cut to look in


def find_cuts(path, rules):
    """Real first-frame index of every beat, from the biggest frame-to-frame change near the nominal cut."""
    cap = cv2.VideoCapture(path)
    prev, diff = None, []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        g = cv2.cvtColor(cv2.resize(frame, (54, 96), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
        diff.append(0.0 if prev is None else float(np.mean(np.abs(g - prev))))
        prev = g
    cap.release()
    n = len(diff)
    starts, acc = [0], 0
    for beat in rules["beats"][:-1]:
        acc += beat["frames"]
        lo, hi = max(1, acc - SEARCH), min(n - 1, acc + SEARCH)
        k = lo + int(np.argmax(diff[lo:hi + 1]))
        # a jump cut inside one framing barely moves the picture: only believe a peak that stands out,
        # otherwise the beat frame count (exact on every build so far) stands
        starts.append(k if diff[k] > 4 * (np.median(diff[lo:hi + 1]) + 1e-6) else acc)
    return starts, n


def detect_all(path, rules, starts, n):
    cap = cv2.VideoCapture(path)
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fd = [mp.solutions.face_detection.FaceDetection(model_selection=m, min_detection_confidence=0.25) for m in (1, 0)]
    ends = starts[1:] + [n]
    dets, bi = [], 0
    for i in range(n):
        ok, frame = cap.read()
        if not ok:
            break
        while bi + 1 < len(starts) and i >= ends[bi]:
            bi += 1
        beat = rules["beats"][bi]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        found = []
        for d in fd:
            for det in (d.process(rgb).detections or []):
                b = det.location_data.relative_bounding_box
                found.append((b.xmin + b.width / 2, b.ymin + b.height / 2, b.width, b.height * H / W, det.score[0]))
        # the allowed region, upscaled: a small or profile face the full frame missed
        x0, x1 = beat.get("x", [0, 1]); y0, y1 = beat.get("y", [0, 1])
        px0, px1 = int(max(0, x0 - 0.08) * W), int(min(1, x1 + 0.08) * W)
        py0, py1 = int(max(0, y0 - 0.10) * H), int(min(1, y1 + 0.10) * H)
        roi = rgb[py0:py1, px0:px1]
        if roi.size and (px1 - px0) < 0.75 * W:
            s = min(3.0, 1400 / max(roi.shape[0], roi.shape[1]))
            big = cv2.resize(roi, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC)
            for d in fd:
                for det in (d.process(big).detections or []):
                    b = det.location_data.relative_bounding_box
                    cx = (px0 + (b.xmin + b.width / 2) * (px1 - px0)) / W
                    cy = (py0 + (b.ymin + b.height / 2) * (py1 - py0)) / H
                    found.append((cx, cy, b.width * (px1 - px0) / W, b.height * (py1 - py0) / W, det.score[0]))
        dets.append(found)
    cap.release()
    return dets, W, H


def track(dets, rules, starts, W, H):
    """-> per-frame list of ellipses (cx, cy, rx, ry) in pixels."""
    n_all = len(dets)
    ends = starts[1:] + [n_all]
    out, report = [[] for _ in range(n_all)], []
    for bi, beat in enumerate(rules["beats"]):
        f0, n = starts[bi], ends[bi] - starts[bi]
        x0, x1 = beat.get("x", [0, 1]); y0, y1 = beat.get("y", [0, 1])
        prior = beat.get("prior")
        c = np.full((n, 4), np.nan)
        prev = None
        for i in range(n):
            cand = [d for d in dets[f0 + i] if x0 <= d[0] <= x1 and y0 <= d[1] <= y1]
            if not cand:
                continue
            ref = prev if prev is not None else (prior[:2] if prior else None)
            pick = min(cand, key=lambda d: (d[0] - ref[0]) ** 2 + (d[1] - ref[1]) ** 2) if ref is not None else max(cand, key=lambda d: d[2])
            c[i] = pick[:4]; prev = pick[:2]
        hit = int(np.sum(~np.isnan(c[:, 0])))
        keys = [k for k in beat.get("keys", []) if k[0] < n]
        if keys:                                   # a hand-keyed shot: the keys ARE the track
            c[:, 0] = np.nan; c[:, 1] = np.nan
            for k in keys:
                c[k[0], 0], c[k[0], 1] = k[1], k[2]
        known = np.where(~np.isnan(c[:, 0]))[0]
        if len(known) == 0:
            if not prior:
                report.append((bi + 1, f0, n, 0, "NO DETECTION AND NO PRIOR - NOT BLURRED")); continue
            c[:, 0], c[:, 1] = prior[0], prior[1]
        else:
            idx = np.arange(n)
            for col in (0, 1):
                c[:, col] = np.interp(idx, known, c[known, col])      # holds the nearest value at both ends
        sized = c[~np.isnan(c[:, 2])]
        fw = np.percentile(sized[:, 2], 90) if len(sized) else 0
        fh = np.percentile(sized[:, 3], 90) if len(sized) else 0
        pr = prior[2] if prior else 0.08
        rx = max(fw * PAD_W, pr); ry = max(fh * PAD_H, pr * 1.2)
        if beat.get("maxr"):
            rx, ry = min(rx, beat["maxr"]), min(ry, beat["maxr"] * 1.2)
        k = np.ones(SMOOTH) / SMOOTH
        for col in (0, 1):
            p = np.pad(c[:, col], SMOOTH // 2, mode="edge"); c[:, col] = np.convolve(p, k, mode="valid")
        first = beat.get("from", 0)
        ell = [None if i < first else (c[i, 0] * W, c[i, 1] * H, rx * W, ry * W) for i in range(n)]
        for i in range(n):
            if ell[i] is not None:
                out[f0 + i].append(ell[i])
        # both shots' ellipses for EDGE frames across each cut
        firstE = next((e for e in ell if e is not None), None); lastE = next((e for e in reversed(ell) if e is not None), None)
        for j in range(1, EDGE + 1):
            if f0 - j >= 0 and firstE is not None and first == 0:
                out[f0 - j].append(firstE)
            if f0 + n - 1 + j < n_all and lastE is not None:
                out[f0 + n - 1 + j].append(lastE)
        report.append((bi + 1, f0, n, hit, f"centre {np.median(c[:,0]):.2f},{np.median(c[:,1]):.2f}  radius {rx:.3f}x{ry:.3f} of width"
                       + ("  [hand-keyed]" if keys else "")))
    # a "clear" beat (a shot she is not in, a text card) is wiped last, so a neighbour's
    # cut-edge ellipse never smears a doorway or the words of a card (EDEN V11, 2026-10-03)
    for bi, beat in enumerate(rules["beats"]):
        if beat.get("clear"):
            for f in range(starts[bi], ends[bi]):
                out[f] = []
    return out, report


def main():
    src, dst, rules_path = sys.argv[1:4]
    rules = json.load(open(rules_path, encoding="utf8"))
    starts, n = find_cuts(src, rules)
    nominal = np.cumsum([0] + [b["frames"] for b in rules["beats"][:-1]]).tolist()
    print(f"{n} frames. cuts found at {starts}\n          nominal        {nominal}")
    dets, W, H = detect_all(src, rules, starts, n)
    tr, report = track(dets, rules, starts, W, H)
    for b, f0, nn, hit, msg in report:
        print(f"  beat {b:02d}  from f{f0:4d}  {nn:4d} frames  detected in {hit:4d} ({100*hit/max(nn,1):3.0f}%)  {msg}")
    mask_path = dst + ".mask.mkv"
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", "30",
                            "-i", "-", "-c:v", "ffv1", "-pix_fmt", "gray", mask_path], stdin=subprocess.PIPE)
    for i in range(n):
        m = np.zeros((H, W), np.uint8)
        for t in tr[i]:
            cv2.ellipse(m, (int(t[0]), int(t[1])), (int(t[2]), int(t[3])), 0, 0, 360, 255, -1)
        if tr[i]:
            m = cv2.GaussianBlur(m, (FEATHER, FEATHER), 0)
        enc.stdin.write(m.tobytes())
    enc.stdin.close(); enc.wait()
    json.dump({"frames": n, "cuts": starts, "report": report,
               "track": [[[round(float(v), 1) for v in t] for t in f] for f in tr]}, open(dst + ".track.json", "w"))
    if "--mask-only" in sys.argv:
        return
    merge(src, mask_path, dst, W, H)
    print("wrote", dst)


def mask_clock(src):
    """A setpts expression that puts mask frame N on the timestamp of video frame N.

    ffmpeg's overlay pairs frames by TIMESTAMP, and build-edit's output is not
    a clean n/30: it starts at 0.033 and gains a frame of pts at some joins
    (EDEN V10: frame 1408 sat at 47.067, three frames late). A mask clocked
    N/30 therefore drifts off the picture, and on the last frame before a cut
    it is already on the next shot. So the video's real timestamps are read
    and rebuilt as steps: (N + k0 + [N>=n1]*d1 + ...)/30.
    """
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time",
                          "-of", "csv=p=0", src], capture_output=True, text=True).stdout.split()
    pts = sorted(float(x.strip(",")) for x in out if x.strip(","))
    off = [round(t * 30) - i for i, t in enumerate(pts)]
    terms, prev = [str(off[0])], off[0]
    for i, o in enumerate(off):
        if o != prev:
            terms.append(f"gte(N,{i})*{o - prev}"); prev = o
    print(f"video clock: starts at frame-time {off[0]}, {len(terms) - 1} step(s), ends {off[-1]} frame(s) ahead of N")
    return "(N+" + "+".join(terms) + ")/(30*TB)"


def merge(src, mask_path, dst, W, H):
    # --fade-out <seconds>: fade the picture to black at the very end (the audio fade is the mixer's job)
    fade = ""
    if "--fade-out" in sys.argv:
        d = float(sys.argv[sys.argv.index("--fade-out") + 1]); c = cv2.VideoCapture(src)
        n = int(c.get(cv2.CAP_PROP_FRAME_COUNT)); fade = f",fade=t=out:s={max(0, n - int(d * 30))}:n={int(d * 30)}"
    fc = (f"[0:v]split[base][b];[b]scale={W//36}:{H//36}:flags=area,scale={W}:{H}:flags=bilinear,gblur=sigma=14[bl];"
          f"[1:v]setpts='{mask_clock(src)}',format=gray[m];[bl][m]alphamerge[fg];[base][fg]overlay=format=auto,format=yuv420p{fade}[v]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-i", mask_path, "-filter_complex", fc, "-map", "[v]", "-map", "0:a?",
                    "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "-color_range", "tv",
                    "-c:a", "copy", "-movflags", "+faststart", dst], check=True)


if __name__ == "__main__":
    if sys.argv[1] == "--merge":            # re-merge an existing mask: --merge <in.mp4> <mask.mkv> <out.mp4>
        c = cv2.VideoCapture(sys.argv[2])
        merge(sys.argv[2], sys.argv[3], sys.argv[4], int(c.get(cv2.CAP_PROP_FRAME_WIDTH)), int(c.get(cv2.CAP_PROP_FRAME_HEIGHT)))
    else:
        main()
