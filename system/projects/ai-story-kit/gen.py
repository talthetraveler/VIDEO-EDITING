# Illustration pictures for a story reel, made with Agnes AI (free, Tal's key AGNES_API_KEY). Run inside a version folder that holds story.py:
#   GEN = {name: "what the picture shows"}   -> photos/g_<name>.jpg (1080x1920). Existing files are kept.
# RULE: illustrations show actions, places and objects only. Never a face standing in for a real person (hands, backs, objects).
import sys, os, json, urllib.request, concurrent.futures as cf
sys.path.insert(0, os.getcwd())
import story as S
KEY = os.environ["AGNES_API_KEY"]
STYLE = getattr(S, "GENSTYLE", "Cinematic documentary photograph, 35mm film, natural light, shallow depth of field, realistic, vertical frame. ")


def go(kv):
    k, p = kv
    out = f"photos/g_{k}.jpg"
    if os.path.exists(out):
        return k, "kept"
    body = json.dumps({"model": "agnes-image-2.5-flash", "prompt": STYLE + p, "size": "1080x1920", "n": 1}).encode()
    for i in range(6):
        try:
            r = urllib.request.Request("https://apihub.agnes-ai.com/v1/images/generations", data=body, headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
            u = json.load(urllib.request.urlopen(r, timeout=240))["data"][0]["url"]
            open("photos/_g.tmp" + k, "wb").write(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=120).read())
            import subprocess
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "photos/_g.tmp" + k, "-q:v", "2", out], check=True)
            os.remove("photos/_g.tmp" + k)
            return k, "ok"
        except Exception as e:
            err = str(e)[:120]
            import time
            time.sleep(20 * (i + 1))          # 429: the free key allows about one picture every few seconds
    return k, "FAILED " + err


with cf.ThreadPoolExecutor(1) as ex:
    for k, r in ex.map(go, S.GEN.items()):
        print(k, r)
