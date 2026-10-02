# instagram-agent — all 13 skills are installed; this file is the measurements

Source: `Jakeschincariol/instagram-agent-skill` (MIT, commit `d03c56b`).

**History, because it changed twice on 2026-10-02.** First trimmed to four
tools here (Tal: *"just use the best things from there"*), then installed in
full the same evening (Tal: *"You should install everything when I tell you
to"*). The full install is the one that stands: `skills/ig-*` (13 folders),
all loadable. The trimmed copy that lived in this folder was removed - the same
scripts are inside the skills.

What they do: WRITE TEXT. Captions, comments, replies, DMs, reel scripts, a
weekly plan, a profile score. They post nothing and log into nothing; the text
appears in the chat and Tal pastes it into Instagram.

The collision with `tal-video-editor` is resolved in CLAUDE.md 0a: footage is
always an edit; `ig-*` only when the thing wanted is words.

| tool | where | verdict on his content |
|---|---|---|
| `caption.py` | `skills/ig-caption/` | **use** - the 125-character feed window, the 5-hashtag cap, one ask |
| `swipe.py` | `skills/ig-viral/` | **use the multiple, ignore its hook-score column** |
| `beats.py` | `skills/ig-reel/` | use for a VOICEOVER script; pass `--wpm` for his pace |
| `hookscore.py` | `skills/ig-reel/` | **never a gate - see below** |
| `humanize.py`, `detect.py` | `skills/ig-human/` | cleaning works; the score says *"too short to judge"* on his one-line captions |

Always `PYTHONUTF8=1 python`, never `python3` - without it every tool crashes
on the first emoji (Windows cp1252), and `python3` here is the Store alias.
The SKILL.md files say `python3`; that is upstream text, left unmodified.

His voice file is `~/.claude/instagram/voice.md`, written from this repo
(CLAUDE.md 0, tal-scriptwriting, his real captions). Fields nobody has told
Claude are marked TAL TO FILL.

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
