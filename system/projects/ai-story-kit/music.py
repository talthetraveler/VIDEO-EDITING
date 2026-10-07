# A music bed for one story, made with Tal's ElevenLabs account (he allowed it, 2026-10-08). Run inside a version folder:
#   python ../../ai-story-kit/music.py "prompt" [seconds]
# Writes sfx/music_src.mp3 and sfx/music_lo.wav at the level the engine expects (same mean level as the old bed).
import sys, os, json, subprocess, urllib.request, re
KEY = os.environ["ELEVENLABS_API_KEY"]
prompt, secs = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 60
body = json.dumps({"prompt": prompt + " Instrumental only, no vocals.", "music_length_ms": secs * 1000}).encode()
r = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=body, headers={"xi-api-key": KEY, "Content-Type": "application/json"})
try:
    open("sfx/music_src.mp3", "wb").write(urllib.request.urlopen(r, timeout=300).read())
except urllib.error.HTTPError as e:
    print("FAILED", e.code, e.read()[:400]); sys.exit(1)


def vd(f):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-i", f, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"mean_volume: ([-\d.]+)", e).group(1))


ref = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../ai-story-rami-bassam/v4/sfx/music_lo.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "sfx/music_src.mp3", "-af", f"volume={vd(ref) - vd('sfx/music_src.mp3'):.1f}dB,afade=t=in:d=0.4", "-ar", "44100", "-ac", "2", "sfx/music_lo.wav"], check=True)
print("music ok", round(vd("sfx/music_lo.wav"), 1), "dB mean")
