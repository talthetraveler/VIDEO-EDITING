# Narration for a story reel. Run inside a version folder that holds story.py (VOICE, L = [(segment, text), ...]).
# ElevenLabs, one file per segment, trimmed to the speech and levelled to -20 dB mean. Existing vo/<seg>.wav are kept.
import sys, os, json, base64, subprocess, urllib.request, re
sys.path.insert(0, os.getcwd())
import story as S
KEY = os.environ["ELEVENLABS_API_KEY"]
L = S.L
os.makedirs("vo", exist_ok=True)


def vd(f):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-i", f, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"mean_volume: ([-\d.]+)", e).group(1))


# The hook (segments h1, h2, ...) is ONE take, then cut between the lines: five separate takes sounded chopped (Tal, 2026-10-08).
HS = [(n, t) for n, t in L if re.fullmatch(r"h\d+", n)]
if HS and not all(os.path.exists(f"vo/{n}.wav") for n, _ in HS):
    text = " ".join(t for _, t in HS)
    nxt = next((t for n, t in L if not re.fullmatch(r"h\d+", n)), "")
    body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2", "next_text": nxt, "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "speed": getattr(S, "SPEED", 1.0)}}).encode()
    r = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{S.VOICE}/with-timestamps?output_format=mp3_44100_128", data=body, headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(r))
    open("vo/el_hook.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
    al = d["alignment"]
    cs, ce = al["character_start_times_seconds"], al["character_end_times_seconds"]
    cuts, pos = [max(0, cs[0] - 0.06)], 0
    for k, (n, t) in enumerate(HS[:-1]):
        pos += len(t)
        cuts.append((ce[pos - 1] + cs[min(pos + 1, len(cs) - 1)]) / 2)
        pos += 1
    cuts.append(ce[-1] + 0.12)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "vo/el_hook.mp3", "-ar", "44100", "-ac", "1", "vo/_h.wav"])
    gain = -20.0 - vd("vo/_h.wav")
    for k, (n, t) in enumerate(HS):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "vo/_h.wav", "-ss", f"{cuts[k]:.3f}", "-to", f"{cuts[k + 1]:.3f}", "-af", f"volume={gain:.1f}dB", f"vo/{n}.wav"])
        print(n, round(cuts[k + 1] - cuts[k], 2), "(one take)")
    os.remove("vo/_h.wav")

for i, (n, t) in enumerate(L):
    if os.path.exists(f"vo/{n}.wav"):
        continue
    p = L[i - 1][1] if i else ""
    x = L[i + 1][1] if i + 1 < len(L) else ""
    body = json.dumps({"text": t, "model_id": "eleven_multilingual_v2", "previous_text": p, "next_text": x, "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "speed": getattr(S, "SPEED", 1.0)}}).encode()
    r = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{S.VOICE}/with-timestamps?output_format=mp3_44100_128", data=body, headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(r))
    open(f"vo/el_{n}.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
    al = d["alignment"]
    a = max(0, al["character_start_times_seconds"][0] - 0.06)
    b = al["character_end_times_seconds"][-1] + 0.12
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"vo/el_{n}.mp3", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-ar", "44100", "-ac", "1", "vo/_t.wav"])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "vo/_t.wav", "-af", f"volume={-20.0 - vd('vo/_t.wav'):.1f}dB", f"vo/{n}.wav"])
    os.remove("vo/_t.wav")
    print(n, round(b - a, 2))
print("voice done")
