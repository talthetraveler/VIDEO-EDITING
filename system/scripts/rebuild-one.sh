#!/usr/bin/env bash
# Rebuild ONE project and write its own log. Called in parallel by rebuild-par.sh.
set -u
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1
slug="$1"
dir="projects/$slug"
log="projects/_frameio/logs/$slug.log"
mkdir -p projects/_frameio/logs
out="$(python -c "import json;print(json.load(open(r'$dir/edit.json',encoding='utf8')).get('out') or '')" 2>/dev/null)"
[ -z "$out" ] && { echo "no out" > "$log"; exit 1; }
{
  echo "=== $slug -> $out"
  node scripts/build-edit.mjs "$slug" 2>&1 | grep -viE "NAL units|^\s*$" | grep -E "framing:|NO PERSON|exposure:|noisy|caption may|TOTAL|Error"
  node scripts/sheet.mjs "$dir/$out" "$dir/SHEET.png" 9 2>&1 | tail -1
} > "$log" 2>&1
grep -q TOTAL "$log" && echo "ok   $slug" || echo "FAIL $slug"
