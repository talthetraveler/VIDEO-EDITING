#!/bin/bash
# deliver.sh <project> <stem> "<Frame.io name>" : full render -> Frame.io EDITED AI VIDEOS (verified), then the full render is deleted locally (Tal, 2026-10-08). The small preview stays.
set -e
R="$(cd "$(dirname "$0")/../../.." && pwd)"; P="$R/system/projects/$1"
cd "$R" && node system/scripts/frameio-deliver.mjs "system/projects/$1/$2-full.mp4" --name "$3" --folder "SHOT IN ISRAEL/FINAL VIDEOS/EDITED AI VIDEOS" --allow-any-folder 2>&1 | grep -E "UPLOAD OK" && rm -f "$P/$2-full.mp4" "$P"/v1/render-final.mp4 "$P"/v1/draft.mp4 && echo "deleted local full"
