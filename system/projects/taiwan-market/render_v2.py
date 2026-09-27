"""Render the revised Taiwan market edit with a POV walk-up."""

import json
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent.parent
sys.path.insert(0, str(WORKSPACE / ".venv-dub/Lib/site-packages"))
import numpy as np

FFMPEG = WORKSPACE / ".venv-dub/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe"
FFPROBE = WORKSPACE / "node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe"
SOURCE = Path(r"C:\Users\taldo\Downloads\taiwan 1111")
MUSIC = WORKSPACE / "vendor/OpenChatCut/assets/audio/track-2.mp3"
BUILD = ROOT / "build"
OUTPUT = WORKSPACE / "output/taiwan-market"
BUILD.mkdir(parents=True, exist_ok=True)
OUTPUT.mkdir(parents=True, exist_ok=True)

FPS, SR, WIDTH, HEIGHT = 30, 48000, 1080, 1920
POV = "VID_20260907_152416_028.mp4"


def run(args, capture=False):
    result = subprocess.run(
        [str(FFMPEG), "-v", "error", "-nostdin", "-threads", "4", "-filter_threads", "4", *args],
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE,
    )
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors="replace"))
    return result.stdout


def probe(path):
    return json.loads(subprocess.check_output([str(FFPROBE), "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)]))


def ffpath(path):
    return str(path).replace("\\", "/").replace(":", "\\:")


def shot(file, start, end, label, audio_file=None, audio_start=None, zoom=1.0, zoom_end=1.04, cx=0.5, cy=0.43):
    frames = round((end - start) * FPS)
    return {
        "file": file, "start": start, "frames": frames, "duration": frames / FPS, "label": label,
        "audio_file": audio_file or file, "audio_start": start if audio_start is None else audio_start,
        "zoom": zoom, "zoom_end": zoom_end, "cx": cx, "cy": cy,
    }


SHOTS = [
    shot(POV, 0.00, 7.02, "POV walk-up and greeting", zoom=1.00, zoom_end=1.03, cx=0.48, cy=0.42),
    shot(POV, 7.48, 13.38, "POV request without money", zoom=1.02, zoom_end=1.06, cx=0.48, cy=0.42),
    shot(POV, 15.75, 18.76, "POV she agrees to help", zoom=1.04, zoom_end=1.08, cx=0.48, cy=0.42),
    shot("IMG_8311.mov", 8.70, 11.16, "outside handoff", POV, 19.86, zoom=1.06, zoom_end=1.12, cx=0.57, cy=0.45),
    shot("IMG_8312.mov", 0.10, 2.90, "test reveal", POV, 25.20, zoom=1.10, zoom_end=1.16, cx=0.57, cy=0.45),
    shot("IMG_8312.mov", 7.14, 15.16, "generosity reveal and reward", POV, 32.24, zoom=1.10, zoom_end=1.18, cx=0.57, cy=0.45),
    shot("IMG_8313.mov", 0.00, 14.37, "reaction and blessings", POV, 42.02, zoom=1.09, zoom_end=1.18, cx=0.56, cy=0.45),
    shot("VID_20260907_152553_029.mp4", 1.77, 5.09, "final blessing", zoom=1.08, zoom_end=1.18, cx=0.53, cy=0.46),
]

CAPTIONS = {
    POV: [
        (2.94, 4.74, "Peace be upon you, ma'am."),
        (4.74, 5.50, "And upon you peace."),
        (5.50, 6.38, "How are you?"),
        (6.40, 7.02, "I'm fine."),
        (8.30, 10.74, "Half a kilo of tomatoes. But I have no money."),
        (11.28, 11.84, "What?"),
        (11.84, 13.38, "I have no money. How many tomatoes?"),
        (15.77, 16.29, "Give me."),
        (18.04, 18.76, "Here you go."),
        (20.10, 22.28, "Thank you, ma'am."),
        (25.20, 25.62, "Ma'am?"),
        (25.96, 26.36, "Yes."),
        (26.52, 28.00, "This was only a test."),
        (32.24, 37.62, "It was an experiment. We were testing your generosity."),
        (38.26, 38.80, "God bless you."),
        (38.80, 40.26, "Here, ma'am. This is for you."),
        (40.26, 41.40, "No, no."),
        (41.40, 42.22, "Thank you."),
        (42.22, 42.76, "No, my son."),
        (42.76, 43.30, "Take it."),
        (43.30, 44.80, "No, no. Thank you."),
        (44.80, 45.86, "No, thank you."),
        (45.86, 47.02, "These are also for you."),
        (47.02, 47.28, "Thank you."),
        (47.28, 47.96, "No, my son."),
        (47.96, 49.76, "Thank you. Thank you."),
        (49.76, 50.98, "Because we appreciate you."),
        (52.33, 52.97, "Thank you."),
        (52.97, 53.89, "May God help you, ma'am."),
        (53.89, 56.39, "May God help you. May God reward you."),
    ],
    "VID_20260907_152553_029.mp4": [(1.77, 5.09, "God bless you. Thank you for your generosity.")],
}


def render_visual(item, index):
    target = BUILD / f"segment-{index:02}.mp4"
    z = f"{item['zoom']}+({item['zoom_end'] - item['zoom']})*min(on/{max(item['frames'] - 1, 1)},1)"
    vf = (
        f"fps={FPS},scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,crop={WIDTH}:{HEIGHT},"
        "eq=contrast=1.035:saturation=1.06:gamma=1.02:brightness=0.004,"
        f"zoompan=z='{z}':x='(iw-iw/zoom)*{item['cx']}':y='(ih-ih/zoom)*{item['cy']}':"
        f"d=1:s={WIDTH}x{HEIGHT}:fps={FPS},trim=end_frame={item['frames']},settb=1/{FPS},setpts=N,setsar=1"
    )
    run([
        "-ss", str(item["start"]), "-t", str(item["duration"] + 0.10), "-i", str(SOURCE / item["file"]),
        "-vf", vf, "-an", "-frames:v", str(item["frames"]), "-r", str(FPS), "-fps_mode", "cfr",
        "-c:v", "h264_nvenc", "-preset", "p4", "-cq", "19", "-bf", "0", "-pix_fmt", "yuv420p",
        "-video_track_timescale", "30000", "-map_metadata", "-1", "-y", str(target),
    ])
    stream = next(s for s in probe(target)["streams"] if s["codec_type"] == "video")
    if int(stream["nb_frames"]) != item["frames"]:
        raise RuntimeError(f"Short segment {index}: {stream['nb_frames']} != {item['frames']}")
    return target


def source_audio(item):
    samples = item["frames"] * (SR // FPS)
    raw = run([
        "-ss", str(item["audio_start"]), "-i", str(SOURCE / item["audio_file"]), "-t", str(item["duration"]),
        "-vn", "-map", "0:a:0", "-ar", str(SR), "-ac", "2", "-f", "f32le", "pipe:1",
    ], capture=True)
    audio = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
    audio = np.pad(audio, ((0, max(0, samples - len(audio))), (0, 0)))[:samples]
    if len(audio):
        rms = np.sqrt(np.mean(audio * audio))
        audio *= np.clip(0.075 / max(rms, 0.008), 0.55, 2.6)
    return audio


def write_wav(path, audio):
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(SR)
        wav.writeframes((np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes())


def clean_and_mix(dialogue):
    raw = BUILD / "dialogue.wav"
    clean = BUILD / "dialogue-clean.wav"
    write_wav(raw, dialogue)
    run(["-i", str(raw), "-af", "highpass=f=80,afftdn=nf=-24:tn=1:tr=1:om=o,lowpass=f=11000", "-y", str(clean)])
    pcm = run(["-i", str(clean), "-ar", str(SR), "-ac", "2", "-f", "f32le", "pipe:1"], capture=True)
    cleaned = np.frombuffer(pcm, np.float32).reshape(-1, 2).copy()
    cleaned = np.pad(cleaned, ((0, max(0, len(dialogue) - len(cleaned))), (0, 0)))[:len(dialogue)]
    music_pcm = run(["-stream_loop", "-1", "-i", str(MUSIC), "-t", str(len(dialogue) / SR), "-ar", str(SR), "-ac", "2", "-f", "f32le", "pipe:1"], capture=True)
    music = np.frombuffer(music_pcm, np.float32).reshape(-1, 2).copy()
    music = np.pad(music, ((0, max(0, len(dialogue) - len(music))), (0, 0)))[:len(dialogue)]
    envelope = np.full(len(dialogue), 10 ** (-28 / 20), np.float32)
    active = np.sqrt(np.mean(cleaned * cleaned, axis=1)) > 0.006
    duck = np.convolve(active.astype(np.float32), np.ones(int(0.24 * SR), np.float32), mode="same") > 0
    envelope[duck] = 10 ** (-34 / 20)
    fade = min(SR, len(envelope))
    envelope[:fade] *= np.linspace(0, 1, fade); envelope[-fade:] *= np.linspace(1, 0, fade)
    mixed = cleaned * 1.04 + music * envelope[:, None]
    mixed *= min(1.0, 0.94 / max(np.max(np.abs(mixed)), 0.01))
    return mixed


def ass_time(seconds):
    cs = round(seconds * 100)
    return f"{cs // 360000}:{cs // 6000 % 60:02}:{cs // 100 % 60:02}.{cs % 100:02}"


def caption_chunks(text):
    words, result, index = text.upper().split(), [], 0
    while index < len(words):
        take = 2 if index + 1 < len(words) and len(words[index].strip(".,?!")) + len(words[index + 1].strip(".,?!")) <= 11 else 1
        result.append(" ".join(words[index:index + take])); index += take
    return result


def build_captions():
    text = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Arial,126,&H00FFFFFF,&H000000FF,&H00141414,&H90000000,-1,0,0,0,100,100,0,0,1,5,2,2,70,70,455,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    for item in SHOTS:
        source, lo_source, hi_source = item["audio_file"], item["audio_start"], item["audio_start"] + item["duration"]
        for begin, end, phrase in CAPTIONS.get(source, []):
            lo, hi = max(begin, lo_source), min(end, hi_source)
            if hi - lo < 0.08: continue
            parts = caption_chunks(phrase)
            weights = np.array([max(2, len(part.replace(" ", ""))) ** 0.32 for part in parts]); weights = weights / weights.sum()
            bounds = np.r_[lo, lo + np.cumsum(weights) * (hi - lo)]
            for i, part in enumerate(parts):
                start = item["timeline"] + bounds[i] - lo_source
                finish = item["timeline"] + bounds[i + 1] - lo_source
                text += f"Dialogue: 0,{ass_time(start)},{ass_time(finish)},Main,,0,0,0,,{part}\n"
    path = BUILD / "captions.ass"; path.write_text(text, encoding="utf-8-sig"); return path


def main():
    visuals, audio, frame = [], [], 0
    for index, item in enumerate(SHOTS, 1):
        item["timeline"] = frame / FPS; frame += item["frames"]
        print(f"[{index}/{len(SHOTS)}] {item['label']}", flush=True)
        visuals.append(render_visual(item, index)); audio.append(source_audio(item))
    duration = frame / FPS
    listing = BUILD / "concat.txt"
    listing.write_text("\n".join("file '" + str(path).replace("\\", "/") + "'" for path in visuals), encoding="utf-8")
    picture = BUILD / "picture.mp4"; run(["-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy", "-y", str(picture)])
    mixed = clean_and_mix(np.concatenate(audio)); master = BUILD / "master.wav"; write_wav(master, mixed)
    captions = build_captions(); encoded = BUILD / "master.m4a"
    run(["-i", str(master), "-af", f"alimiter=limit=0.95,afade=t=out:st={duration - 0.28}:d=0.28", "-c:a", "aac", "-b:a", "192k", "-t", str(duration), "-y", str(encoded)])
    final = OUTPUT / "Taiwan-Market-Generosity-Approach-v2.mp4"
    run(["-i", str(picture), "-i", str(encoded), "-filter_complex", f"[0:v]subtitles='{ffpath(captions)}',fade=t=out:st={duration - 0.30}:d=0.30[v]", "-map", "[v]", "-map", "1:a:0", "-c:v", "h264_nvenc", "-preset", "p5", "-cq", "18", "-bf", "0", "-c:a", "copy", "-t", str(duration), "-movflags", "+faststart", "-y", str(final)])
    info = probe(final); video = next(s for s in info["streams"] if s["codec_type"] == "video"); sound = next(s for s in info["streams"] if s["codec_type"] == "audio")
    assert int(video["width"]) == WIDTH and int(video["height"]) == HEIGHT
    assert abs(float(video["duration"]) - float(sound["duration"])) < 0.10
    (BUILD / "timeline.json").write_text(json.dumps({"duration": duration, "shots": SHOTS, "output": str(final)}, indent=2), encoding="utf-8")
    print(f"READY {final} ({duration:.2f}s)", flush=True)


if __name__ == "__main__": main()
