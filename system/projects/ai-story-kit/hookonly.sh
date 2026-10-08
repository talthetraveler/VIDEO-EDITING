#!/bin/bash
# hookonly.sh <dir>... : rebuild and render only the first seconds (no voice, no pictures regenerated) -> hook-<dir>.jpg
K="$(cd "$(dirname "$0")" && pwd)"; P="$K/.."
export PYTHONUTF8=1; set -a; . "$P/../.env"; set +a
for dir in "$@"; do
  cd "$P/$dir/v1" || continue
  HOOK_ONLY=3.0 python "$K/engine.py" > _eng.log 2>&1 < /dev/null || { echo "$dir FAIL engine $(tail -1 _eng.log)"; continue; }
  HF_VIDEO_COVERAGE_THRESHOLD=0 npx --yes hyperframes@0.8.133 render -q draft -o _hook.mp4 > _render.log 2>&1 < /dev/null
  ffmpeg -v error -y -i _hook.mp4 -vf "select='eq(n,30)+eq(n,55)',scale=270:480,tile=2x1" -frames:v 1 "$K/hook-$dir.jpg" < /dev/null && echo "$dir ok"
done
