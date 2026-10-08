# Find real, freely licensed pictures for b-roll with no key (Tal, 2026-10-08: "for finding images to use as b-roll ... scrape Google").
# Google Images itself needs a paid Custom Search key and returns mostly press photos nobody licensed. This asks Openverse
# (openverse.org: 800M Creative Commons and public-domain pictures from Flickr, Wikimedia, museums) and saves the credit with each file.
#   python find_images.py "halva Jerusalem market" raw/ --n 6 [--portrait]
import sys, os, json, urllib.request, urllib.parse, re
q, out = sys.argv[1], sys.argv[2]
n = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 6
params = {"q": q, "page_size": 20, "license_type": "all-cc", "mature": "false"}
if "--portrait" in sys.argv:
    params["aspect_ratio"] = "tall"
UA = {"User-Agent": "TheSocialAccords-story-reels/1.0 (taldooreckaloni@gmail.com)"}
d = json.load(urllib.request.urlopen(urllib.request.Request("https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(params), headers=UA), timeout=40))
os.makedirs(out, exist_ok=True)
cp = os.path.join(out, "CREDITS.json")
credits = json.load(open(cp, encoding="utf-8")) if os.path.exists(cp) else {}
credits = credits if isinstance(credits, dict) else {}
got = 0
for r in d.get("results", []):
    if got >= n or min(r.get("width") or 0, r.get("height") or 0) < 1000:
        continue
    name = re.sub(r"[^a-z0-9]+", "_", q.lower())[:24] + f"_{got}.jpg"
    try:
        data = urllib.request.urlopen(urllib.request.Request(r["url"], headers=UA), timeout=60).read()
    except Exception as e:
        continue
    if data[:3] != b"\xff\xd8\xff":
        continue
    open(os.path.join(out, name), "wb").write(data)
    credits["raw/" + name] = {"title": r.get("title"), "author": r.get("creator"), "licence": f'CC {str(r.get("license")).upper()} {r.get("license_version") or ""}'.strip(),
                              "source_url": r.get("foreign_landing_url"), "provider": r.get("source"), "px": f'{r.get("width")}x{r.get("height")}', "query": q}
    print(name, "|", r.get("title"), "|", r.get("creator"), "|", credits["raw/" + name]["licence"], "|", credits["raw/" + name]["px"])
    got += 1
json.dump(credits, open(cp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(got, "saved to", out)
