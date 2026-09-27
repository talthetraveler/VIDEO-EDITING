#!/usr/bin/env bash
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1
T="C:/Users/taldo/AppData/Local/Temp/claude/C--Users-taldo-Downloads-videos-to-edit/25d9b12e-086f-47d3-b937-752703ef08bf"
for q in bmj3wuysn b7hggbrjx; do
  until grep -q "QUEUE DONE" "$T/tasks/$q.output" 2>/dev/null; do sleep 20; done
done
echo "ALL QUEUES DONE $(date +%H:%M:%S)"
# eden-music needs its source before it can build
node scripts/build-edit.mjs eden-music > "$T/scratchpad/eden-music.log" 2>&1
echo "eden-music rc=$? $(tail -1 "$T/scratchpad/eden-music.log")"
echo; echo "=== GATE ==="
node scripts/qa-final.mjs 2>&1 | grep -E "^(ok|FAIL)|!!|pass,"
echo; echo "=== UPLOAD ==="
node scripts/auto-deliver.mjs 2>&1 | grep -E "DELIVERING|  OK|FAILED|delivered"
