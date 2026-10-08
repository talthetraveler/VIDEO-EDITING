#!/bin/bash
# hookcheck.sh <dir>... : voice the hook, cut clips, (re)draw illustrations, build, render only the first seconds, save hook-<dir>.jpg (3 frames)
K="$(cd "$(dirname "$0")" && pwd)"; P="$K/.."
export PYTHONUTF8=1; set -a; . "$P/../.env"; set +a
for dir in "$@"; do
  cd "$P/$dir/v1" || continue
  rm -f vo/h?.wav vo/el_h?.mp3 vo/el_hook.mp3
  if grep -q "^GENSTYLE" story.py && [ ! -d photos/_photo-style ]; then mkdir -p photos/_photo-style && mv photos/g_*.jpg photos/_photo-style/ 2>/dev/null; fi
  cp "$K"/mg-sfx/*.wav sfx/ 2>/dev/null
  python "$K/voice.py" > _voice.log 2>&1 < /dev/null || { echo "$dir FAIL voice $(tail -1 _voice.log)"; continue; }
  python "$K/prep.py" > _prep.log 2>&1 < /dev/null || { echo "$dir FAIL prep $(tail -1 _prep.log)"; continue; }
  if grep -q "^GEN = " story.py; then python "$K/gen.py" > _gen.log 2>&1 < /dev/null; grep -c FAILED _gen.log | sed "s/^/$dir gen-failed: /"; fi
  HOOK_ONLY=3.2 python "$K/engine.py" > _eng.log 2>&1 < /dev/null || { echo "$dir FAIL engine $(tail -1 _eng.log)"; continue; }
  HF_VIDEO_COVERAGE_THRESHOLD=0 npx --yes hyperframes@0.8.133 render -q draft -o _hook.mp4 > _render.log 2>&1 < /dev/null
  ffmpeg -v error -y -i _hook.mp4 -vf "select='eq(n,18)+eq(n,45)+eq(n,80)',scale=270:480,tile=3x1" -frames:v 1 "$K/hook-$dir.jpg" < /dev/null && echo "$dir ok"
done
