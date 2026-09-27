#!/usr/bin/env bash
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1
T="C:/Users/taldo/AppData/Local/Temp/claude/C--Users-taldo-Downloads-videos-to-edit/25d9b12e-086f-47d3-b937-752703ef08bf"
S="$T/scratchpad"
echo "waiting for the 1080 rebuild queue..."
until grep -q "QUEUE DONE" "$T/tasks/bmj3wuysn.output" 2>/dev/null; do sleep 20; done
echo "waiting for eden-music source..."
until [ -f "$S/hq-eden-music.log" ] && grep -q "manifest ->" "$S/hq-eden-music.log" 2>/dev/null; do sleep 15; done
echo "building eden-music"
node scripts/build-edit.mjs eden-music > "$S/eden-music.log" 2>&1
echo "   rc=$? $(tail -1 "$S/eden-music.log")"
echo
echo "=== UPLOAD ==="
node scripts/auto-deliver.mjs 2>&1 | grep -E "DELIVERING|  OK|FAILED|delivered"
echo
echo "=== WHAT IS ON FRAME.IO ==="
node scripts/frameio-remove.mjs --list 2>&1 | tail -40
