# ROUTING — pick the style from the footage. Never ask Tal.

Tal: *"I don't need to tell you which style to use, like MD Motivator or The
World Sucks. You should just know based on the video."*

This is the one table that decides. Load it for every edit. Everything in it was
**measured** from the real files (`projects/_refs/study/*/stats.json`), at scene
threshold **0.20** — not 0.30, which undercounts badly (it reported Jack Jones
at 35 cuts/min when the real figure is 103.8).

---

## 1. WHAT IS THIS FOOTAGE? → style → cut rate

| If the footage is… | Style | Target | Reference (measured) |
|---|---|---|---|
| **You help one person and they tell their story** | MD Motivator — see `formats/kindness-test.md` | **~2.1s/shot, 27/min** | `CcyT0e_lYrb` 43.9s, 20 cuts |
| **A stranger is quietly tested and chooses well** | The World Sucks — see `formats/kindness-test.md` | **2.5-4.5s/shot, 12-25/min** | *His words in the end* 59s/12 cuts · `C7mDUt5tsRC` 58.4s/21 · `CcyT0e_lYrb` 43.9s/20 |
| **Greeting many strangers** (Shabbat Shalom / Salam / Shana Tova) | POV street | **~1.9s/shot, 30/min** | *The side of Israel* 59.3s, 30 cuts |
| **Giving out many things** (roses, water, hugs, notes) | POV street, faster | **~1.1-1.5s/shot, 40-55/min** | `DS9-SeKjD6N` 54/min · `DT_GXspgP7x` 40/min · `DYwzJLmoB2S` 52/min |
| **Street Q&A, many answers** ("what makes you happy") | Q&A compilation | **~2.1s/shot, 26/min** | *Love is the answer* 36.2s, 16 cuts |
| **One conversation with one person** | Hold the shot | **6-15s/shot, 3-7/min** | `DWwnzm1jUTn` 3/min · `DY25uksM6iP` 4/min |
| **Horizontal footage of a conversation** | Square band + punch-ins | **~3.6s/shot, 15/min** | `DdeLOuyBAd2` 40.1s, 10 cuts |
| **No speech at all — music montage** | Montage | fast, zoom into faces | `DdY0DfwMFRo` 30.8/min |
| **A long emotional story told to camera** | Narration cards | **0-5 cuts total** | Cape Town wheelchair: 33s, **0 cuts** |

**The single most expensive mistake is picking the wrong row.** Fast cutting on
a one-person story destroys it; long takes on a many-people compilation kills it.

**When two attached references disagree by 10x, the brief's own words decide.**
"Short and simple, focus on her reaction" = hold the shot.
"Lots of different people" = cut fast.

---

## 2. OPENING DEVICE — three, and they are not interchangeable

**a) Title pill** — white rounded box, **top-LEFT**, holds ~4-5s then goes.
Two variants, both real:
- ALL CAPS: `THE SIDE OF ISRAEL 🇮🇱 / THE MEDIA DOESN'T SHOW YOU`
- Sentence case: `POV: the side of Israel 🇮🇱 the media doesn't show you…`

Flag emoji inline. Rendered by `scripts/make-title.py`; ffmpeg `drawtext` can
only draw a hard rectangle and looks cheap beside Tal's own reels.

**b) Narration cards** — small **white text, NO box**, upper third, plain, told
in 2-3 sequential beats before anyone speaks. From the Cape Town video:
> *"I went out for a run in the Cape Town storm"*
> *"I noticed a man in a wheelchair struggling to push himself"*
> *"So I thought I would push him to where he has to go. 4kms later, I heard his story."*

Use this when the setup needs explaining — **hospital toys, Jamaica, feed
homeless**. Tal named it for the hospital video: *"I decided to go visit a
hospital and give out toys to children"* then the toys, then a kid speaking.

**c) Straight in** — no card. Only when the first line IS the hook
("Today's your birthday?").

---

## 3. CAPTIONS — one system, measured

- **GOLD/YELLOW, ALL CAPS, heavy bold, black outline.** No box.
- **2-3 words at a time.** `SHANA TOVA` · `I'M JEWISH` · `YOU HAPPY` · `WHAT MAKES`
- **~68-76% of frame height.**
- **ONE on screen at a time, ever.** Groq word timings overlap when people talk
  over each other and are not time-sorted — sort, then force non-overlapping
  windows, or they render on top of each other (`FOR YOWEBLLRTHDAY`).
- **Must FIT.** Measure with the real font (`scripts/fit-caption.py`), never
  guess. 78px is the target; long captions shrink, short ones stay big.

**End cards:** the closing line often gets a **white pill instead of gold text**
(`BE BLESSED`), or a `Follow for more` pill.

---

## 4. CASTING AND TONE — non-negotiable

- **Visible diversity, deliberately ordered.** Tal: *"I choose like a blonde
  woman then a black guy."* Never two similar-looking people back to back.
- **Alternate the greeting** — Shabbat Shalom → Salam Aleikum → back. The
  switching IS the content.
- **Everyone is happy.** No awkwardness, no confusion, nobody saying no. Cut it
  even when the line is funny.
- **Nothing negative, ever.** The "Americans don't do that" ending was cut for
  exactly this reason.

---

## 5. HARD RULES (full detail in TAL-EDITING-BIBLE.md)

1. **Never cut anyone off.** 0.12s before the first word, ~0.45s after the last.
2. **If they reply, the reply is in the shot.** A line and its answer are one unit.
3. **Every promise in the dialogue is paid off on screen.** "I want to write
   Damien" → show the writing.
4. **Verify against the RENDERED FILE**, not the transcript:
   `node system/scripts/selfreview.mjs <EDIT.json> <render.mp4>` — non-zero exit = do not send.
5. **Read every caption.** "three here" is nonsense and no model flags it.
6. **Under 60s** unless the story genuinely needs more.
7. **9:16 vertical** for everything except horizontal sources (square band).
8. **Watch it myself before Tal sees it.** V1 should be the quality of V6.

---

## 6. STUDYING A NEW REFERENCE

Every reference Tal sends gets the same treatment, in one command:

```bash
node system/scripts/study-reference.mjs "<file or downloaded ref>"
```

Measures cuts at 0.20, builds a contact sheet, pulls a transcript.
**A reference is not "studied" until the contact sheet has been LOOKED AT.**
Instagram downloads need no login: `./bin/yt-dlp.exe -o "projects/_refs/%(id)s.%(ext)s" <url>`
