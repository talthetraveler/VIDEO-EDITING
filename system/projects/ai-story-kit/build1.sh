#!/bin/bash
# build1.sh <dir> [draft|final]: voice, cut clips, draw illustrations, build, render one story. One status line on stdout.
K="$(cd "$(dirname "$0")" && pwd)"; P="$K/.."; dir="$1"; mode="${2:-draft}"
export PYTHONUTF8=1; set -a; . "$P/../.env"; set +a
cd "$P/$dir/v1" || { echo "$dir FAIL no folder"; exit 1; }
python "$K/voice.py" > _voice.log 2>&1 < /dev/null || { echo "$dir FAIL voice: $(tail -2 _voice.log)"; exit 1; }
python "$K/prep.py" > _prep.log 2>&1 < /dev/null || { echo "$dir FAIL prep: $(tail -2 _prep.log)"; exit 1; }
if grep -q "^GEN = " story.py; then python "$K/gen.py" > _gen.log 2>&1 < /dev/null; fi
# Agnes sometimes returns 736x1312; a picture smaller than the frame sits in a corner, so every illustration is brought to 1080x1920
for g in photos/g_*.jpg; do [ -f "$g" ] || continue; [ "$(ffprobe -v error -show_entries stream=width -of csv=p=0 "$g")" = 1080 ] || { ffmpeg -v error -y -i "$g" -vf "scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920" -q:v 2 "${g%.jpg}_u.jpg" < /dev/null && mv "${g%.jpg}_u.jpg" "$g"; }; done
python "$K/engine.py" > _eng.log 2>&1 < /dev/null || { echo "$dir FAIL engine: $(tail -3 _eng.log)"; exit 1; }
if [ "$mode" = draft ]; then npx --yes hyperframes@0.8.133 render -q draft -o draft.mp4 > _render.log 2>&1 < /dev/null; f=draft.mp4; else npx --yes hyperframes@0.8.133 render -o render-final.mp4 > _render.log 2>&1 < /dev/null; f=render-final.mp4; fi
[ -f "$f" ] && echo "$dir OK $f $(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)s gen-failed:$(grep -c FAILED _gen.log 2>/dev/null)" || echo "$dir FAIL render: $(tail -2 _render.log)"
