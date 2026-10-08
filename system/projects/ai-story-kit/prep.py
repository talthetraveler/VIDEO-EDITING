# Cuts the quotes and the silent clips for a story reel. Run inside a version folder that holds story.py.
#   ON    = {seg: (source, [(a, b), ...] sound ranges joined in order, (pa, pb) picture range)}   -> vo/<seg>.wav + src/b_<seg>_0.mp4
#   CLIPS = {name: (source, a, b)} or (source, a, b, slow)                                        -> src/<name>.mp4
# Sound ranges come from silencedetect (LESSONS 131): start on the first word, drop pauses over 0.6 s.
import sys, os, re, subprocess
sys.path.insert(0, os.getcwd())
import story as S
os.makedirs("vo", exist_ok=True)
os.makedirs("src", exist_ok=True)
VF = "scale=-2:720,setsar=1"


def vd(f):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-i", f, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"mean_volume: ([-\d.]+)", e).group(1))


for seg, on_ in getattr(S, "ON", {}).items():
    src, ranges, (pa, pb) = on_[:3]
    vf_ = (on_[3] + "," if len(on_) > 3 else "") + VF          # optional picture filter first (crop, colour)
    ins, fc = [], []
    for i, (a, b) in enumerate(ranges):
        ins += ["-ss", str(a), "-to", str(b), "-i", src]
        fc.append(f"[{i}:a]afade=t=in:d=0.03,afade=t=out:st={b - a - 0.06:.3f}:d=0.06[a{i}]")
    fc.append("".join(f"[a{i}]" for i in range(len(ranges))) + f"concat=n={len(ranges)}:v=0:a=1,highpass=f=80[o]")
    subprocess.run(["ffmpeg", "-v", "error", "-y"] + ins + ["-filter_complex", ";".join(fc), "-map", "[o]", "-ar", "44100", "-ac", "1", "vo/_r.wav"], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "vo/_r.wav", "-af", f"volume={-20.0 - vd('vo/_r.wav'):.1f}dB,alimiter=limit=0.9", f"vo/{seg}.wav"], check=True)
    os.remove("vo/_r.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(pa), "-to", str(pb), "-i", src, "-vf", vf_, "-an", "-r", "30", "-c:v", "libx264", "-crf", "15", "-pix_fmt", "yuv420p", f"src/b_{seg}_0.mp4"], check=True)
    print(seg, "sound", round(sum(b - a for a, b in ranges), 2), "picture", round(pb - pa, 2))
for name, c in getattr(S, "CLIPS", {}).items():
    src, a, b = c[:3]
    slow = c[3] if len(c) > 3 else 1.0
    pre = (c[4] + ",") if len(c) > 4 else ""          # optional filter first, e.g. a crop that removes burned-in text
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-to", str(b), "-i", src, "-vf", pre + VF + (f",setpts={slow}*PTS" if slow != 1.0 else ""), "-an", "-r", "30", "-c:v", "libx264", "-crf", "15", "-pix_fmt", "yuv420p", f"src/{name}.mp4"], check=True)
    print(name, round((b - a) * slow, 2))
print("prep done")
