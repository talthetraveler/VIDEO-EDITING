# Rami Elhanan and Bassam Aramin. Narrator: ElevenLabs "Sarah". Facts: their own words in the BBC interview; Wikipedia (Rami Elhanan); Commons caption of the 2016 joint memorial ceremony photo.

import json, os, base64, subprocess, urllib.request, re
KEY = os.environ["ELEVENLABS_API_KEY"]
VOICE = "EXAVITQu4vr4xnSDxMaL"          # Sarah
L = [("h1", "An Israeli father"),
     ("h2", "lost his daughter to a suicide bombing."),
     ("h3", "A Palestinian father"),
     ("h4", "lost his daughter to an Israeli bullet."),
     ("h5", "Today, they call each other family."),
     
     ("n3", "Bassam's daughter Abir was ten. A rubber bullet hit her outside her school."),
     ("n4", "They could have become enemies. Instead, they joined hundreds of bereaved families, Israeli and Palestinian, who mourn together."),
     ("n5", "Now their sons stand on the same stage, and speak side by side."),
     ("n6", "This story is proof that grief can bring people together.")]


def vd(f):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-i", f, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"mean_volume: ([-\d.]+)", e).group(1))


for i, (n, t) in enumerate(L):
    if os.path.exists(f"vo/{n}.wav"):
        continue
    p = L[i - 1][1] if i else ""
    x = L[i + 1][1] if i + 1 < len(L) else ""
    body = json.dumps({"text": t, "model_id": "eleven_multilingual_v2", "previous_text": p, "next_text": x, "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "speed": 1.0}}).encode()
    r = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128", data=body, headers={"xi-api-key": KEY, "Content-Type": "application/json"})
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
