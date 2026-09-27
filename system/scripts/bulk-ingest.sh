#!/bin/bash
# Discover + proxy + transcribe every remaining shoot in the work queue.
# READ-ONLY against Frame.io. Downloads only `efficient` proxies, never originals.
cd "C:/Users/taldo/Downloads/videos to edit/system"
FOLDERS=(
  "SHOT IN ISRAEL/GIVING WATER TO W"
  "SHOT IN ISRAEL/FLOWERS FOR STRANGERS/CLEANER JERUSLAEM"
  "SHOT IN ISRAEL/FLOWERS FOR STRANGERS/FLOWERS"
  "SHOT IN ISRAEL/HUG FOR STRANGER/FABIAN"
  "SHOT IN ISRAEL/HUG FOR STRANGER/MAX (THIS IS ME MAX)"
  "SHOT IN ISRAEL/KIDNESS TEST/WOMEN ON FLOOR.."
  "SHOT IN ISRAEL/KIDNESS TEST/SHOP OWNER"
  "SHOT IN ISRAEL/KIDNESS TEST/Shop Owner 2"
  "SHOT IN ISRAEL/KIDNESS TEST/SHOP OWNER 3"
  "SHOT IN ISRAEL/KIDNESS TEST/SHOP OWNER 4"
  "SHOT IN ISRAEL/KIDNESS TEST/Shop owner 5"
  "SHOT IN ISRAEL/KIDNESS TEST/Shop owner 7"
  "SHOT IN ISRAEL/KIDNESS TEST/muslin guy in coffee shop"
  "SHOT IN ISRAEL/HOSPITAL KIDS TO TOYS"
  "SHOT IN ISRAEL/SHALOM/SALAM"
)
for f in "${FOLDERS[@]}"; do
  echo "=== $f"
  node scripts/frameio-discover.mjs "$f" --fetch 2>&1 | grep -E "TARGET|files ·|proxies:|Could not"
done
echo "=== TRANSCRIBING ALL (cached skipped)"
node scripts/frameio-transcribe.mjs 2>&1 | tail -6
echo "=== BULK INGEST DONE"
