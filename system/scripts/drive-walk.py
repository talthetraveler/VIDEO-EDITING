#!/usr/bin/env python
"""List every file under a public ("anyone with the link") Google Drive folder.

python system/scripts/drive-walk.py <folderId> <out.json>

Uses Drive's embedded folder view, which needs no login. Skips macOS "._" junk.
"""
import html
import json
import re
import sys
import time
import urllib.request

UA = {"User-Agent": "Mozilla/5.0"}
ENTRY = re.compile(r'<div class="flip-entry" id="entry-([\w-]+)".*?flip-entry-title">([^<]*)<', re.S)


def children(folder_id):
    url = "https://drive.google.com/embeddedfolderview?id=" + folder_id
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                page = r.read().decode("utf8", "replace")
            return [(m.group(1), html.unescape(m.group(2)).strip()) for m in ENTRY.finditer(page)], page
        except Exception as e:
            print("retry", folder_id, e, file=sys.stderr)
            time.sleep(2 * (attempt + 1))
    raise RuntimeError("cannot list " + folder_id)


def is_folder(page, entry_id):
    i = page.find('id="entry-%s"' % entry_id)
    return "/drive/folders/" in page[i:i + 600]


def walk(folder_id, path, out):
    kids, page = children(folder_id)
    for eid, name in kids:
        if is_folder(page, eid):
            walk(eid, path + [name], out)
        elif not name.startswith("._"):
            out.append({"id": eid, "name": name, "folder": "/".join(path)})


if __name__ == "__main__":
    files = []
    walk(sys.argv[1], [], files)
    json.dump(files, open(sys.argv[2], "w", encoding="utf8"), ensure_ascii=False, indent=0)
    by = {}
    for f in files:
        by[f["folder"]] = by.get(f["folder"], 0) + 1
    for k in sorted(by):
        print(by[k], k)
    print("TOTAL", len(files))
