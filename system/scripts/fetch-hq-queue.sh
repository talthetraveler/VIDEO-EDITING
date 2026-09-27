#!/usr/bin/env bash
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1
S="C:/Users/taldo/AppData/Local/Temp/claude/C--Users-taldo-Downloads-videos-to-edit/25d9b12e-086f-47d3-b937-752703ef08bf/scratchpad"
for slug in "$@"; do
  echo "=== HQ $slug  $(date +%H:%M:%S)"
  node scripts/fetch-hq.mjs "$slug" > "$S/hq-$slug.log" 2>&1
  echo "    rc=$? $(tail -2 "$S/hq-$slug.log" | head -1)"
done
echo "HQ QUEUE DONE $(date +%H:%M:%S)"
