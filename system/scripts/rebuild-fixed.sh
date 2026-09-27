#!/usr/bin/env bash
# Rebuild every project on the 2026-09-23 pipeline (LESSONS 33-41):
#   snap-then-de-overlap · one crop + one denoise per continuous shot ·
#   no automatic push · measured grade · white/gold PNG captions.
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1
LOG="projects/_frameio/cache/rebuild-2026-09-23.log"
run() {
  slug="$1"
  out=$(timeout 3000 node scripts/build-edit.mjs "$slug" 2>&1)
  ov=$(echo "$out" | grep -c "overlap by")
  sh=$(echo "$out" | grep -c "one continuous shot")
  er=$(echo "$out" | grep -cE "^Error|Error:")
  tot=$(echo "$out" | grep -oE "TOTAL [0-9.]+s" | head -1)
  if echo "$out" | grep -q "TOTAL"; then
    echo "OK   $slug  $tot  overlaps_fixed=$ov  shots_merged=$sh"
  else
    echo "FAIL $slug  $(echo "$out" | grep -E 'Error' | head -1 | cut -c1-90)"
  fi
}
export -f run
ls -d projects/*/ | sed 's|projects/||;s|/||' | grep -v '^_' | while read s; do
  [ -f "projects/$s/edit.json" ] || continue; echo "$s"
done | xargs -P 3 -I{} bash -c 'run {}' | tee "$LOG"
echo "" | tee -a "$LOG"
echo "$(grep -c '^OK' "$LOG") ok · $(grep -c '^FAIL' "$LOG") failed" | tee -a "$LOG"
