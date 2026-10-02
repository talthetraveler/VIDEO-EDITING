# instagram-agent — four tools kept out of thirteen skills

Source: `Jakeschincariol/instagram-agent-skill` (MIT, commit `d03c56b`).
Trimmed 2026-10-02. Tal: *"maybe u need to just use the best things from there."*

**Nothing here is a loadable skill.** The repo ships 13 `SKILL.md` files; none
were copied. `ig-reel` triggers on *"make a reel about X"* and `ig-repurpose` on
*"cut this up"* — both would contest `tal-video-editor` (CLAUDE.md 0a).

Always `python`, never `python3`, and always with `PYTHONUTF8=1` — without it
every tool crashes on the first emoji (Windows cp1252).

| tool | use it for | verdict on his content |
|---|---|---|
| `ig-caption/caption.py` | lint a post caption before it is scheduled: the 125 characters the feed shows, the 5-hashtag cap, one ask | **use.** |
| `ig-viral/swipe.py` | rank harvested reference reels by views / that account's own median | **use the multiple, ignore its hook-score column** |
| `ig-reel/beats.py` | time a VOICEOVER script before he records it (`formats/voiceover-broll.md`) | use, pass `--wpm` for his pace |
| `ig-reel/hookscore.py` | nothing, on its own. `swipe.py` imports it | **never a gate — see below** |

```bash
PYTHONUTF8=1 python skills/toolbox/instagram-agent/ig-caption/caption.py caption.txt
PYTHONUTF8=1 python skills/toolbox/instagram-agent/ig-viral/swipe.py captured.tsv --out swipe.md
PYTHONUTF8=1 python skills/toolbox/instagram-agent/ig-reel/beats.py script.txt --target 30
```

`swipe.py` finds `hooks.json` by relative path (`../ig-reel/`), which is why
the folder layout is the upstream one. The files are unmodified.

## hookscore.py condemns his house style — measured, 2026-10-02

Known-answer test first: the README's four example hooks came back at
85.6 / 81.4 / 54.4 / 9.6, exactly as published. The instrument works as built.

Then his real work, from `projects/israel-batch/manifest.jsonl`:

| input | STRONG | OK | WEAK |
|---|---|---|---|
| 60 titles as written (ALL CAPS) | 0 | 0 | **60** |
| the same 60 in Title Case | 1 | 7 | 52 |
| 97 spoken first lines | 7 | 13 | 77 |

Three reasons, all structural:

1. Its proper-noun check wants `Capitalised` words. His titles are ALL CAPS, so
   `MUSLIM`, `ISRAEL`, `JAFFA` count as nothing concrete.
2. It is tuned for business talking-head hooks: money, numbers, loss words.
   *"POV: MEETING A MUSLIM IN ISRAEL"* has none and is his best-known format.
3. **A greeting is a dealbreaker.** *"Hello, assalamu alaikum"* scored 15.6.
   A greeting between strangers is the subject of half his videos.

The author says the same about its limits: it separates a creator's hits from
their misses at AUC 0.56, a coin flip. It catches a talking-head preamble. It
cannot judge a stranger's face. **Do not score his titles with it, and do not
reject anything on its number.**

## Two smaller defects

- `caption.py` does not count flag emoji: 🇮🇱 reports `0 emoji` (its range
  starts at U+1F300; regional indicators are U+1F1E6-1F1FF). Harmless.
- `beats.py` was not checked against the README's printed numbers — the README
  truncates its example script, so there was no known input to feed it. Its
  arithmetic is right (62 words at 165 wpm = 22.6s).

## Left behind, and why

- **The humanizer** (`humanize.py`, `detect.py`, `slop.json`): on his real
  captions it returns *"too short to judge"* on three of five checks. The
  `humanizer` agent already covers long copy.
- **The 13 SKILL.md files** — carousels, stories, DMs, comments, profile score,
  weekly plan. Prompt text, no code; `tal-scriptwriting` and `content-engine`
  already hold his voice. One `git clone` away if wanted.
- `hooks.json` stays only because `swipe.py` reads it. Its 26 formulas are
  worth a read when writing a VOICEOVER hook; they do not describe his street
  openings.
