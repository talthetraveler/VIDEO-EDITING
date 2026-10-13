# Free text-to-video on Agnes AI's cloud (key: AGNES_API_KEY in system/.env). Request shape read from
# lcy362/agnes-video-generator core/api/agnes_video.py (MIT). 4-12 s, 720p, 16 requests a minute per key.
#   python agnes.py "<prompt>" out.mp4 [seconds=5] [aspect=9:16]
# Anything made with this is an ILLUSTRATION and gets labelled AI-GENERATED on screen. Never a stand-in for a real person.
import sys, os, json, time, urllib.request, urllib.error
ROOT = "https://apihub.agnes-ai.com"
MODEL = "agnes-video-2.5-flash"


def call(url, body=None):
    r = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                               headers={"Authorization": "Bearer " + os.environ["AGNES_API_KEY"], "Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(r, timeout=90))
    except urllib.error.HTTPError as e:
        return {"http": e.code, "body": e.read().decode("utf-8", "replace")[:400]}


def make(prompt, out, seconds=5, aspect="9:16"):
    for attempt in range(30):               # the free queue is often full (HTTP 503 video_queue_full): wait and retry for 15 minutes
        sub = call(ROOT + "/v1/videos", {"model": MODEL, "prompt": prompt, "mode": "text", "seconds": str(max(4, min(int(seconds), 12))), "size": "720P", "aspect_ratio": aspect})
        if sub.get("http") in (503, 429):
            time.sleep(30); continue
        break
    vid = sub.get("video_id") or sub.get("task_id") or sub.get("id")
    if not vid:
        print("submit failed:", sub); return False
    t0 = time.time()
    while time.time() - t0 < 1500:
        time.sleep(20)
        st = call(f"{ROOT}/agnesapi?video_id={vid}&model_name={MODEL}")
        s = str(st.get("status", "")).lower()
        if s == "completed":
            url = st.get("remixed_from_video_id") or st.get("video_url") or st.get("url")
            urllib.request.urlretrieve(url, out)
            print("saved", out, round(time.time() - t0), "s"); return True
        if s == "failed" or "http" in st:
            print("failed:", str(st)[:300]); return False
    print("timed out"); return False


if __name__ == "__main__":
    a = sys.argv
    make(a[1], a[2], a[3] if len(a) > 3 else 5, a[4] if len(a) > 4 else "9:16")
