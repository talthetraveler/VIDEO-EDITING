#!/usr/bin/env bash
# Low-res previews for review IN CHAT (LESSONS 33: nothing reaches Frame.io
# before Tal has watched it here and said yes).
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1
ONLY="${1:-}"
for dir in projects/*/; do
  slug="$(basename "$dir")"; case "$slug" in _*) continue;; esac
  [ -f "$dir/edit.json" ] || continue
  [ -n "$ONLY" ] && [ "$slug" != "$ONLY" ] && continue
  out=$(node -e "try{console.log(require('./$dir/edit.json').out||'')}catch(e){}" 2>/dev/null)
  [ -z "$out" ] || [ ! -f "$dir/$out" ] && continue
  mkdir -p "$dir/preview"
  dst="$dir/preview/${slug}_preview.mp4"
  # skip if the preview is already newer than the render
  if [ -f "$dst" ] && [ "$dst" -nt "$dir/$out" ]; then echo "skip $slug"; continue; fi
  ffmpeg -v error -y -i "$dir/$out" -vf "scale=540:960" -c:v libx264 -preset veryfast \
     -crf 29 -c:a aac -b:a 96k "$dst" 2>/dev/null
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$dst" 2>/dev/null)
  mb=$(python -c "import os;print('%.1f'%(os.path.getsize(r'$dst')/1048576))" 2>/dev/null)
  printf '%-24s %5.1fs  %sMB\n' "$slug" "$d" "$mb"
done
