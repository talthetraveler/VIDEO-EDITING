"""PUNCT-SEGMENTS - Groq sometimes returns a stretch of a clip lowercase with no
punctuation (street-oct10, 2026-10-10). The caption line-breaker needs sentence
ends, so those captions break mid-phrase ("ME EXCUSE ME HI HOW"). This replaces
the text of segments [a..b] with ONE hand-punctuated segment over the same span
and clears the aligned flag; then run tools/align-cache.py <id> --force.
The WORDS must stay the same words in the same order - punctuation and case only.

  python tools/punct-segments.py <id> <a> <b> "Punctuated text."
"""
import json, re, sys
ROOT = r"C:\Users\taldo\Downloads\videos to edit\system\projects\_frameio\cache\transcripts"
i, a, b, text = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
p = f"{ROOT}/{i}.json"; j = json.load(open(p, encoding="utf8"))
segs = j["segments"]
norm = lambda s: re.sub(r"[^a-z0-9' ]", "", s.lower()).split()
old = norm(" ".join(s["text"] for s in segs[a:b + 1]))
if old != norm(text):
    print("WORDS DIFFER - check before trusting:\n old:", " ".join(old), "\n new:", " ".join(norm(text)))
new = dict(segs[a]); new["text"] = text; new["end"] = segs[b]["end"]; new.pop("words", None)
j["segments"] = segs[:a] + [new] + segs[b + 1:]; j.pop("aligned", None)
json.dump(j, open(p, "w", encoding="utf8"), ensure_ascii=False)
print("ok", len(j["segments"]), "segments")
