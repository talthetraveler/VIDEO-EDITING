#!/bin/bash
# new.sh <project> <version>: version folder with fonts, sfx, paper, and raw/ photos resized into photos/
set -e
K="$(cd "$(dirname "$0")" && pwd)"; P="$K/../$1"; V="$P/$2"; R="$K/../ai-story-rami-bassam/v4"
mkdir -p "$V/photos" "$V/vo" "$V/src"
cp -r "$R/fonts" "$R/sfx" "$V/"; cp "$R/photos/paper.jpg" "$V/photos/"; cp "$K/../ai-story-daryl-davis/v10/captions.css" "$V/" 2>/dev/null || true
for f in "$P"/raw/*.jpg "$P"/raw/*.jpeg "$P"/raw/*.png; do [ -f "$f" ] || continue; b=$(basename "${f%.*}"); ffmpeg -v error -y -i "$f" -vf "scale='if(gt(iw,ih),-2,min(2000,iw))':'if(gt(iw,ih),min(2000,ih),-2)'" -q:v 3 "$V/photos/$b.jpg"; done
ls "$V/photos" | wc -l
