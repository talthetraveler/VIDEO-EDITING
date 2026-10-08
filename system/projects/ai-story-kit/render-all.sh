#!/bin/bash
# render-all.sh: build + full render + deliver each story listed (voices, clips and illustrations must already exist: hookcheck.sh makes them).
# A full-quality copy of each is kept in _metricool-upload/serve-all/ for scheduling; delete that folder after the posts are created.
K="$(cd "$(dirname "$0")" && pwd)"; P="$K/.."; LOG="$K/render-all.log"
export PYTHONUTF8=1; set -a; . "$P/../.env"; set +a
mkdir -p "$P/_metricool-upload/serve-all"
while IFS='|' read -r dir stem ver frame <&3; do
  [ -z "$dir" ] && continue
  if [ -n "$ONLY" ] && ! echo " $ONLY " | grep -q " $dir "; then continue; fi
  cd "$P/$dir/v1" || { echo "$dir FAIL no folder" >> "$LOG"; continue; }
  rm -f render-final.mp4
  python "$K/engine.py" > _eng.log 2>&1 < /dev/null || { echo "$dir FAIL engine: $(tail -1 _eng.log)" >> "$LOG"; continue; }
  npx --yes hyperframes@0.8.133 render -o render-final.mp4 > _render.log 2>&1 < /dev/null
  [ -f render-final.mp4 ] || { echo "$dir FAIL render" >> "$LOG"; continue; }
  cp render-final.mp4 "../$stem-$ver-full.mp4"; cp render-final.mp4 "$P/_metricool-upload/serve-all/$stem.mp4"
  ffmpeg -v error -y -i render-final.mp4 -vf scale=540:-2 -c:v libx264 -crf 27 -c:a aac -b:a 96k "../$stem-$ver-small.mp4" < /dev/null
  ffmpeg -v error -y -i render-final.mp4 -vf "fps=1/1.9,scale=180:-1,tile=14x2" -frames:v 1 "sheet-$ver.jpg" < /dev/null
  if bash "$K/deliver.sh" "$dir" "$stem-$ver" "$frame" > _deliver.log 2>&1 < /dev/null; then echo "$dir OK $ver $(head -1 _eng.log | cut -c1-34)" >> "$LOG"; else echo "$dir RENDERED $ver but upload failed" >> "$LOG"; fi
done 3<<'LIST'
ai-story-hadad-qureshi|hadad-qureshi|V10|HADAD AND QURESHI - The Israeli and the Pakistani at Wimbledon V9.mp4
ai-story-megan-phelps|megan-phelps|V5|MEGAN PHELPS-ROPER - Raised to hate V5.mp4
ai-story-rawan-osman|rawan-osman|V5|RAWAN OSMAN - From enemy to ally V5.mp4
ai-story-indo-pak-express|indo-pak-express|V6|INDO-PAK EXPRESS - Bopanna and Qureshi V6.mp4
ai-story-yehuda-pryce|yehuda-pryce|V4|DR YEHUDAH PRYCE - 24 years V4.mp4
ai-story-korea|korea|V5|KOREA - Hyun Jung-hwa and Ri Bun-hui V4.mp4
ai-story-punjabi-lehar|punjabi-lehar|V4|PUNJABI LEHAR - A Muslim and a Sikh reunite families V4.mp4
ai-story-roots|roots|V5|ROOTS - Ali Abu Awwad and Rabbi Hanan Schlesinger V5.mp4
ai-story-flight|flight|V4|FLIGHT FZ1073 - Captain Smit and the strangers who helped V4.mp4
ai-story-nissim-black|nissim-black|V4|NISSIM BLACK - From Seattle to Israel V4.mp4
ai-story-fabian-debora|fabian-debora|V5|FABIAN DEBORA - From gang member to teacher V5.mp4
ai-story-dor-shachar|dor-shachar|V3|DOR SHACHAR - Where is your father V3.mp4
ai-story-coptic-oct7|abanoub-samaan|V6|ABANOUB SAMAAN - One question V5.mp4
LIST
echo ALL-DONE >> "$LOG"
