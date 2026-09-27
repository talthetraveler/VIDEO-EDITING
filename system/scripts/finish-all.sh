#!/usr/bin/env bash
# Wait for every build queue to drain, gate everything, upload what passes.
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1
T="C:/Users/taldo/AppData/Local/Temp/claude/C--Users-taldo-Downloads-videos-to-edit/25d9b12e-086f-47d3-b937-752703ef08bf"
for q in "$@"; do
  echo "waiting on queue $q ..."
  until grep -q "QUEUE DONE" "$T/tasks/$q.output" 2>/dev/null; do sleep 20; done
done
echo "ALL BUILD QUEUES DONE $(date +%H:%M:%S)"
echo
echo "=== QA GATE ==="
node scripts/qa-final.mjs 2>&1 | tail -80
echo
echo "=== UPLOAD ==="
node scripts/auto-deliver.mjs 2>&1 | tail -60
