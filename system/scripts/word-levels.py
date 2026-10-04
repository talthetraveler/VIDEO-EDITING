"""WORD-LEVELS - how loud is each captioned word in the RENDERED file?
A phone held by Tal hears him 20 dB louder than the person he is talking to
(pov-church, 2026-10-04). caption-sync flags such words as "0% speech" - this
prints the level under every caption so the quiet speaker can be found and
lifted with push.boost.
  python system/scripts/word-levels.py <render.mp4> <slug> [threshold_db=-30]
"""
import json, math, struct, subprocess, sys, wave, os, tempfile
FF = r"C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe"
ROOT = r"C:/Users/taldo/Downloads/videos to edit/system"
mp4, slug = sys.argv[1], sys.argv[2]
thr = float(sys.argv[3]) if len(sys.argv) > 3 else -30
log = json.load(open(f"{ROOT}/projects/{slug}/BUILD-LOG.json", encoding="utf8"))
wavp = os.path.join(tempfile.gettempdir(), f"wl_{slug}.wav")
subprocess.run([FF, "-v", "error", "-y", "-i", mp4, "-vn", "-ac", "1", "-ar", "16000", wavp], check=True)
w = wave.open(wavp); n = w.getnframes(); d = struct.unpack("<%dh" % n, w.readframes(n)); sr = w.getframerate()
def rms(a, b):
    x = d[int(a * sr):int(b * sr)]
    return 20 * math.log10(max(1, (sum(v * v for v in x) / max(1, len(x))) ** 0.5) / 32768)
# beat offsets: beats are concatenated in order; durations from the edit (speed-aware)
offs, t = {}, 0.0
for i, b in enumerate(log["beats"]):
    if b is None: continue
    sp = (b[6] or {}).get("speed", 1) if len(b) > 6 and b[6] else 1
    offs[i + 1] = t; t += (b[2] - b[1]) / (sp if 0 < sp < 1 else 1)
quiet = 0
cur = None; row = []
for c in log["captions"]:
    bt = int(c["beat"]); a = offs[bt] + c["at"]; b = offs[bt] + c["to"]
    lv = rms(a, min(b, a + 0.6))
    if bt != cur:
        if row: print(f"{cur:02d}: " + "  ".join(row))
        cur, row = bt, []
    row.append(f"{c['text']}{'*' if lv < thr else ''}({lv:.0f})"); quiet += lv < thr
if row: print(f"{cur:02d}: " + "  ".join(row))
print(f"\n{quiet} of {len(log['captions'])} captioned words under {thr:.0f} dBFS (*)")
