"""A re-post variant of Tal's own finished "Meeting a Lebanese in Israel" (2026-10-11).
Tal: "do a slight zoom in, maybe add Arabic captions under, so the metadata is different."
His burned captions stay; a small Arabic line is added under them, sentence by sentence,
timed from the WhisperX-aligned words of the finished file. Picture is zoomed 4%.
The Arabic is Claude's translation and UNVERIFIED."""
import json, re, subprocess, os
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
ROOT = "C:/Users/taldo/Downloads/videos to edit"
SRC = ROOT + "/FOOTAGE IN/copy_216A7624-F8E8-432F-AE76-6BBC38314160.MP4"
TR = ROOT + "/system/projects/_frameio/cache/transcripts/local-ca0f05005525c073.json"
OUT = ROOT + "/system/projects/st-lebanon"
S = [("you're a christian that lives in israel and from lebanon and do you feel safe", "أنت مسيحي من لبنان وتعيش في إسرائيل · هل تشعر بالأمان؟"),
("hey excuse me sorry are you from israel", "لو سمحت، هل أنت من إسرائيل؟"), ("no i'm from lebanon", "لا، أنا من لبنان"),
("you're from lebanon yeah wow amazing", "من لبنان؟ رائع"), ("how long have you been in israel for", "منذ متى وأنت في إسرائيل؟"),
("uh 11 years now", "منذ ١١ سنة"), ("you've been in israel for 11 years", "أنت في إسرائيل منذ ١١ سنة"),
("you're from lebanon and are you jewish", "أنت من لبنان · وهل أنت يهودي؟"), ("no i'm christian", "لا، أنا مسيحي"),
("wait you're a christian that lives in israel and from lebanon", "مسيحي من لبنان ويعيش في إسرائيل"), ("and do you feel safe", "وهل تشعر بالأمان؟"),
("of course this is the best place to be if you ask me", "طبعًا · هذا أفضل مكان برأيي"), ("for me as a christian as a gay it's", "بالنسبة لي كمسيحي وكمثلي"),
("It's the only place in the Middle East where I can feel safe.", "هو المكان الوحيد في الشرق الأوسط الذي أشعر فيه بالأمان"),
("You feel safer in Israel as a Lebanese Christian than in Europe?", "تشعر بأمان أكثر في إسرائيل من أوروبا؟"), ("Of course.", "طبعًا"),
("A lot of people hate Israel because they just see the news and the media.", "كثيرون يكرهون إسرائيل لأنهم يرون الأخبار فقط"),
("So what would you tell them?", "فماذا تقول لهم؟"), ("I would tell them to come and visit and see for themselves.", "تعالوا وزوروا وانظروا بأنفسكم"),
("I wish more people could visit us and not hate us.", "أتمنى أن يزورنا الناس ولا يكرهونا"), ("That's the only way.", "هذه الطريقة الوحيدة"),
("Come and visit and see for yourself, right?", "تعالوا وانظروا بأنفسكم"), ("Habibi.", "حبيبي"), ("So nice to meet you, bro.", "تشرفت بمعرفتك يا أخي"),
("You too.", "وأنا أيضًا"), ("Yala. I'll see you around. Take care.", "يلا · أراك قريبًا")]
norm = lambda w: re.sub(r"[^a-z0-9']", "", w.lower())
words = sorted(json.load(open(TR, encoding="utf8"))["words"], key=lambda x: x["start"])
wn = [norm(w["word"]) for w in words]
cues, k = [], 0
for en, ar in S:
    toks = [norm(t) for t in en.split() if norm(t)]
    if wn[k:k + len(toks)] != toks:
        print("MISMATCH at", k, wn[k:k + len(toks)], "!=", toks); raise SystemExit(1)
    cues.append([words[k]["start"], words[k + len(toks) - 1]["end"], ar]); k += len(toks)
print("matched", k, "of", len(wn), "words")
for i, c in enumerate(cues):
    nxt = cues[i + 1][0] if i + 1 < len(cues) else c[1] + 0.6
    c[1] = round(min(c[1] + 0.25, nxt - 0.02), 2); c[0] = round(max(0, c[0] - 0.03), 2)
f = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 46)
ins, fc, prev = [], [], "[z]"
for i, (a, b, ar) in enumerate(cues):
    t = get_display(arabic_reshaper.reshape(ar)); w = int(f.getlength(t)) + 40
    im = Image.new("RGBA", (w, 90), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.text((22, 14), t, font=f, fill=(0, 0, 0, 120), stroke_width=5, stroke_fill=(0, 0, 0, 120))
    d.text((20, 10), t, font=f, fill=(255, 255, 255, 255), stroke_width=5, stroke_fill=(10, 10, 10, 255))
    p = f"{OUT}/sub/{i:02d}.png"; im.save(p); ins += ["-i", p]
    fc.append(f"{prev}[{i + 1}:v]overlay=x=(W-w)/2:y=1375-h/2:enable='gte(t\,{a})*lt(t\,{b})'[o{i}]"); prev = f"[o{i}]"
graph = "[0:v]scale=1124:1998:flags=lanczos,crop=1080:1920,setsar=1[z];" + ";".join(fc)
out = OUT + "/POV Meeting a Lebanese in Israel (Arabic) FINAL.mp4"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC] + ins + ["-filter_complex", graph, "-map", prev, "-map", "0:a",
  "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "-color_range", "tv", "-r", "30",
  "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
json.dump(cues, open(OUT + "/cues-ar.json", "w", encoding="utf8"), ensure_ascii=False, indent=0)
print("->", out, os.path.getsize(out))
