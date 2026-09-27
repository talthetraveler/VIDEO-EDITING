#!/usr/bin/env bash
# Sequential build queue. Builds run ONE at a time (CLAUDE.md: racing two
# builds corrupted output twice); auto-deliver.mjs uploads each as it lands.
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1
S="C:/Users/taldo/AppData/Local/Temp/claude/C--Users-taldo-Downloads-videos-to-edit/25d9b12e-086f-47d3-b937-752703ef08bf/scratchpad"
for slug in "$@"; do
  echo "=== BUILD $slug  $(date +%H:%M:%S)"
  node scripts/build-edit.mjs "$slug" > "$S/$slug.log" 2>&1
  echo "    rc=$? $(tail -1 "$S/$slug.log")"
done
echo "QUEUE DONE $(date +%H:%M:%S)"
