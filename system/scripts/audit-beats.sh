#!/usr/bin/env bash
# Which films still caption dialogue over a shot with nobody in it?
# Prints one line per project: bad/total beats, worst first.
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1
out="projects/_frameio/cache/beat-audit.txt"; : > "$out"
run() {
  slug="$1"
  r=$(timeout 900 node scripts/check-beats.mjs "$slug" 2>/dev/null | tail -1)
  n=$(echo "$r" | grep -oE "^[0-9]+" )
  t=$(echo "$r" | grep -oE "of [0-9]+" | grep -oE "[0-9]+")
  [ -z "$n" ] && { echo "ERR $slug"; return; }
  echo "$n $t $slug"
}
export -f run
ls -d projects/*/ | sed 's|projects/||;s|/||' | grep -v '^_' | while read s; do
  [ -f "projects/$s/edit.json" ] || continue; echo "$s"
done | xargs -P 4 -I{} bash -c 'run {}' >> "$out"
sort -rn "$out"
