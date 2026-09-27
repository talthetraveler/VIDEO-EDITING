#!/usr/bin/env bash
# Contact sheet per project so every cut can be LOOKED AT before it is sent.
# CLAUDE.md 0b rule 8: "Watch it myself before Tal sees it."
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1
for dir in projects/*/; do
  slug="$(basename "$dir")"; case "$slug" in _*) continue;; esac
  [ -f "$dir/edit.json" ] || continue
  out=$(node -e "try{console.log(require('./$dir/edit.json').out||'')}catch(e){}" 2>/dev/null)
  [ -z "$out" ] && continue
  [ -f "$dir/$out" ] || continue
  node scripts/sheet.mjs "$dir/$out" "$dir/SHEET.png" 6 >/dev/null 2>&1 && echo "sheet $slug"
done
