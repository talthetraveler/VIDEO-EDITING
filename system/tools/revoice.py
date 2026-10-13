"""Re-record only the narration lines of a story build at a given speed.  python revoice.py <build dir> [speed]
Reads L (the lines) and VOICE from that folder's el.py; writes vo/<name>.wav. Tal, 2026-10-06: "don't speak so fast"."""
import sys, os, re, json, base64, subprocess, urllib.request
d = sys.argv[1]; speed = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
src = open(os.path.join(d, "el.py"), encoding="utf-8").read()
ns = {}
exec(src[src.index("L = ["):src.index("\n\n\ndef vd")], ns)
VOICE = re.search(r'VOICE = "([^"]+)"', src).group(1) if "VOICE = " in src else "nPczCjzI2devNBz1zQrb"
KEY = os.environ["ELEVENLABS_API_KEY"]; L = ns["L"]
def vd(f):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-i", f, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"mean_volume: ([-\d.]+)", e).group(1))
tot = 0
for i, (n, t) in enumerate(L):
    p = L[i - 1][1] if i else ""; x = L[i + 1][1] if i + 1 < len(L) else ""
    body = json.dumps({"text": t, "model_id": "eleven_multilingual_v2", "previous_text": p, "next_text": x, "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "speed": speed}}).encode()
    r = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128", data=body, headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    j = json.load(urllib.request.urlopen(r))
    mp3 = os.path.join(d, "vo", f"el_{n}.mp3"); open(mp3, "wb").write(base64.b64decode(j["audio_base64"]))
    al = j["alignment"]; a = max(0, al["character_start_times_seconds"][0] - 0.06); b = al["character_end_times_seconds"][-1] + 0.12
    tmp = os.path.join(d, "vo", "_t.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-ar", "44100", "-ac", "1", tmp])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"volume={-20.0 - vd(tmp):.1f}dB", os.path.join(d, "vo", f"{n}.wav")]); os.remove(tmp)
    tot += b - a; words = len(t.split())
    print(n, round(b - a, 2), "s", round(words / (b - a) * 60), "wpm")
print("narration total", round(tot, 1), "s")
