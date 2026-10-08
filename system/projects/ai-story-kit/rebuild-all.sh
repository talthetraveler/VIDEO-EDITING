#!/bin/bash
# rebuild-all.sh: re-voice the hook, rebuild, render, deliver each story listed below; one status line per story in rebuild.log.
# The list is read on fd 3: npx and ffmpeg read stdin and once ate the list (only the first story ran).
K="$(cd "$(dirname "$0")" && pwd)"; P="$K/.."; LOG="$K/rebuild.log"; : > "$LOG"
export PYTHONUTF8=1; set -a; . "$P/../.env"; set +a
while IFS='|' read -r dir stem ver frame <&3; do
  [ -z "$dir" ] && continue
  cd "$P/$dir/v1" || { echo "$dir FAIL no folder" >> "$LOG"; continue; }
  rm -f vo/h?.wav vo/el_h?.mp3 vo/el_hook.mp3 render-final.mp4
  case "$dir" in ai-story-rawan-osman|ai-story-korea) rm -f vo/n2.wav vo/el_n2.mp3;; esac
  cp "$K"/mg-sfx/*.wav sfx/ 2>/dev/null
  python "$K/voice.py" > _voice.log 2>&1 < /dev/null || { echo "$dir FAIL voice: $(tail -1 _voice.log)" >> "$LOG"; continue; }
  python "$K/prep.py" > _prep.log 2>&1 < /dev/null || { echo "$dir FAIL prep: $(tail -1 _prep.log)" >> "$LOG"; continue; }
  if grep -q "^GEN = " story.py; then python "$K/gen.py" > _gen.log 2>&1 < /dev/null; fi
  python "$K/engine.py" > _eng.log 2>&1 < /dev/null || { echo "$dir FAIL engine: $(tail -1 _eng.log)" >> "$LOG"; continue; }
  npx --yes hyperframes@0.8.133 render -o render-final.mp4 > _render.log 2>&1 < /dev/null
  [ -f render-final.mp4 ] || { echo "$dir FAIL render" >> "$LOG"; continue; }
  cp render-final.mp4 "../$stem-$ver-full.mp4"
  [ "$dir" = "ai-story-indo-pak-express" ] && mkdir -p "$P/_metricool-upload/serve-ip4" && cp render-final.mp4 "$P/_metricool-upload/serve-ip4/indo-pak-$ver.mp4"
  ffmpeg -v error -y -i render-final.mp4 -vf scale=540:-2 -c:v libx264 -crf 27 -c:a aac -b:a 96k "../$stem-$ver-small.mp4" < /dev/null
  ffmpeg -v error -y -i render-final.mp4 -vf "fps=1/1.9,scale=180:-1,tile=14x2" -frames:v 1 "sheet-$ver.jpg" < /dev/null
  if bash "$K/deliver.sh" "$dir" "$stem-$ver" "$frame" > _deliver.log 2>&1 < /dev/null; then echo "$dir OK $ver $(head -1 _eng.log | cut -c1-34)" >> "$LOG"; else echo "$dir RENDERED $ver but upload failed" >> "$LOG"; fi
done 3<<'LIST'
ai-story-megan-phelps|megan-phelps|V3|MEGAN PHELPS-ROPER - Raised to hate V3.mp4
ai-story-indo-pak-express|indo-pak-express|V4|INDO-PAK EXPRESS - Bopanna and Qureshi V4.mp4
ai-story-rawan-osman|rawan-osman|V3|RAWAN OSMAN - From enemy to ally V3.mp4
ai-story-yehuda-pryce|yehuda-pryce|V2|DR YEHUDAH PRYCE - 24 years V2.mp4
ai-story-korea|korea|V3|KOREA - Hyun Jung-hwa and Ri Bun-hui V2.mp4
ai-story-punjabi-lehar|punjabi-lehar|V2|PUNJABI LEHAR - A Muslim and a Sikh reunite families V2.mp4
ai-story-roots|roots|V2|ROOTS - Ali Abu Awwad and Rabbi Hanan Schlesinger V2.mp4
ai-story-flight|flight|V2|FLIGHT FZ1073 - Captain Smit and the strangers who helped V2.mp4
ai-story-fabian-debora|fabian-debora|V2|FABIAN DEBORA - From gang member to teacher V2.mp4
ai-story-hadad-qureshi|hadad-qureshi|V4|HADAD AND QURESHI - The Israeli and the Pakistani at Wimbledon V3.mp4
ai-story-dor-shachar|dor-shachar|V2|DOR SHACHAR - Where is your father V2.mp4
ai-story-coptic-oct7|abanoub-samaan|V4|ABANOUB SAMAAN - One question V3.mp4
LIST
echo ALL-DONE >> "$LOG"
