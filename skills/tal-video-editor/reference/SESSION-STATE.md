# SESSION STATE — 2026-09-21

Written so a compacted session resumes without replaying the conversation.
**Read `CLAUDE.md` §0b first — it auto-loads the editing system.**

---

## WHAT IS BUILT / IN FLIGHT

| Video | State |
|---|---|
| **Jamaica — the bike** | V14 rendering. V13 rejected: opened on an empty landscape and ran 28s of repetitive "look at this". V14 opens on Tal's face inside the shelter (`0310 @0.6`), one context beat only. ~113s. **Still owed:** music, full-quality re-cut from originals, upload. |
| **Eden — cancer story** | V1 rendering. Opens on Tal to camera, volunteers, her answers only (no questions), `5 MINUTES LATER` card, singers, closes on "pray for her / come visit her". English captions translated from Hebrew. |
| Everything else | Footage discovered + proxied + transcribed. Not cut. |

## THE GOLD IN THE FOOTAGE

- **`IMG_9265.mov`** (503s, Hebrew) — Eden, 30, leukemia 1 year, lost her mother
  to cancer (17 years ill) *while Eden was sick herself*.
  *"I need to be strong — for everyone, for myself, for my family."*
  *"To be a healthy girl. To take care of myself."*
  *"You can shake, be a little sad — but don't lie down. Lift your head up."*
- **`IMG_9260`** (46s) / **`IMG_9259`** (26s) — Tal's narration takes. SPLIT these:
  setup at the top, "pray for her / come visit her" at the end.
- **`IMG_8798`** (133s) — the volunteers: *"we're going to people that are sick
  to make them happy before Shabbat"*, *"the rabbi said making people happy is
  the best thing you can do."* **Its own video.**
- **`IMG_8803`** (49s) — *"we're going to play for a cancer patient… each week we
  don't forget to visit her."* Contains the singers arriving at Eden.
- **`IMG_8823`** (109s, Hebrew) — second cancer story, a woman who nursed her
  mother through 17 years of illness while ill herself.
- Jamaica `video-4955` equivalent: **`IMG_8628`** in WHAT MAKES YOU HAPPY — the
  newlyweds, groom in a **wheelchair**, *"we had fun at the dance floor and this
  is how it ended up… it's fine. I'm so happy."* Invisible in the transcript.

## OPEN ITEMS NEEDING TAL

1. **Music files** — none on disk. IG audio-matching flags ripped tracks.
   **BUT** Tal pointed out the footage contains people singing on camera — use
   that as the bed where it exists.
2. **Eden vs the `IMG_8802` exclusion** — Tal earlier said do not use the
   cancer-patient footage near `IMG_8802`; he then asked for the Eden story.
   Eden is a different clip. Not yet explicitly confirmed.
3. Approve/kill the video list in `PREP.md`.

## FOLDERS — REAL COUNTS (pagination bug fixed; it was inflating 15x)

IN: `giving back in jamaica` 25 · `GIVING WATER TO W` 8 · `HOSPITAL KIDS TO TOYS`
128 · `SHALOM/SALAM` 100 · `FLOWERS` 33 · `OLD LADY JERUSALEM` 5 ·
`CLEANER JERUSLAEM` 4 · `MAX` 15 · `FABIAN` 7 · `WHAT MAKES YOU HAPPY` 57 ·
`muslin guy in coffee shop` 5 · `WOMEN ON FLOOR..` 6 · `SHOP OWNER` 2 ·
`Shop Owner 2` 3 · `SHOP OWNER 3` 2 · `SHOP OWNER 4` 5 · `Shop owner 5` 2 ·
`Shop owner 7` 1 (Tal: still make it — another angle, reduce noise) ·
**ADDED 2026-09-21:** `feed homeless`, `SHANA TOVA`, `table asking a. Question`

OUT: `save a child's heart` · `fabian and avi` · `e&s` · `ABRAHAM ACCORDS` ·
`NOTES TO STRANGERS` · `arab and Hebrew teacher` · all of `TAL STUDIOS`

## DELIVERY

Upload approved cuts to `SOCIAL ACCORDS/SHOT IN ISRAEL/FINAL VIDEOS/EDITED BY CLAUDE`
(`da1be559-d19b-4b41-8fb9-cdff73c1eacd`). Tal reviews via Frame.io comments and
says what he dislikes; revise from those.

**Make 1-2 VARIATIONS per video** with different hooks so he has real choices.
Everything **under 2 minutes**; montages shorter.

## WHERE THE KNOWLEDGE LIVES

- `CLAUDE.md` §0b — auto-loads everything, survives `/compact`
- `skills/tal-video-editor/ROUTING.md` — style picked from the footage
- `skills/tal-video-editor/LESSONS.md` — 10 rules from 14 versions
- `skills/tal-video-editor/formats/` — kindness-test, giving-things,
  pov-meta-glasses
- `skills/toolbox/tal-reference-library/measured-2026-09.md` — 30 references
- `TAL-EDITING-BIBLE.md` · `PREP.md` · `WORK-QUEUE.md` · `FRAMEIO-STATE.md`

---

## 2026-09-21 — JAMAICA V14 APPROVED ✅

Tal: *"this is great, the V14 ... I love it."* First approved cut.
Recipe saved to `skills/tal-video-editor/APPROVED-JAMAICA-V14.md` and
linked from `CLAUDE.md` §0b. **Build every story video to that shape on V1.**

**Next, in order:**
1. Download ONLY the 11 originals V14 uses → re-cut at full quality → upload to
   `FINAL VIDEOS/EDITED BY CLAUDE`.
2. Work every remaining folder, **clip by clip**, 1-2 variations each:
   Eden story · volunteers · hospital toys (bounce religious Muslim ↔ religious
   Jew) · Shalom/Salam · what makes you happy · flowers · old lady · cleaner ·
   max · fabian · water · 8 kindness tests · feed homeless · shana tova ·
   table asking a question.
3. Low music under everything. Where the footage HAS live singing, use that.

---

## 2026-09-21 03:00 — DELIVERY PIPELINE LIVE

**Frame.io upload works end to end.** Built and tested against the live API:
`scripts/lib/frameio-deliver.mjs` + `scripts/frameio-deliver.mjs` (one file),
`scripts/finish.mjs` (QA gate then upload), `scripts/auto-deliver.mjs --watch 45`
(uploads every finished render automatically), `scripts/frameio-comments.mjs`
(reads Tal's timestamped notes back).

Destination `SOCIAL ACCORDS / SHOT IN ISRAEL / FINAL VIDEOS / EDITED BY CLAUDE`
is RESOLVED FROM THE LIVE TREE every time, never a hardcoded id.

**Real bug found in the old client:** Frame.io splits >10MB into UNEQUAL parts
(20MB -> 2x10485760; 120MB -> 7 parts of 17975589). The old code split evenly,
which uploads wrong bytes to every part after the first. Fixed — use the `size`
the API returns, and refuse if the parts don't sum to the file.

## NEW TOOLING

- `scripts/transcribe-local.mjs` — footage already on disk enters the same cache
  (words + English translation). `build-edit` then cuts the REAL file.
- `scripts/fetch-hq.mjs` — pulls only the seconds an edit uses from the 4K
  original over HTTP Range. No 3GB downloads.
- Source priority in `build-edit`: **local original > HQ span > 360p proxy.**
- Per-beat push-in: 7th beat slot `{"z":[from,to],"x":0..1,"y":0..1}`.
- Per-beat audio from a second camera: `{"audio":{"id":"...","at":<sec>}}`.

## PIPELINE BUGS FIXED THIS SESSION (all were silently degrading every video)

1. **Per-beat `loudnorm`** normalised each beat to its own loudness -> the level
   jumped at every cut. Now ONE pass over the finished timeline + 25ms fades.
   (This is what Tal heard as "the audio messes up when the clips change".)
2. **Translated captions were timed by splitting segments evenly** -> they
   lagged the voice. Now snapped to real word onsets from the original-language
   transcript. Eden needed `--words` re-run (0 -> 781 word timings).
3. **HQ spans have their own clock.** Rebasing BOTH the seek and the caption
   lookup pulled captions from the wrong part of the clip. Keep both clocks.
4. **`beat[5] = 0` disabled auto-rotation** (`0 ?? auto` is 0). Sideways Sony
   footage rendered sideways. Use `null` in that slot.
5. **`--hq` still stitched at 540x960**, throwing away the 4K fetch.
6. **build-edit deleted every other `_V*.mp4`** in the folder — removed.

## STILL OPEN

- The first `JAMAICA HELP.mp4` delivered was the 540x960 build (bug 5). The
  1080x1920 rebuild replaces it — Tal will see two; the newer one is correct.
- `WHAT MAKES YOU HAPPY V1` was delivered twice: once from a stale render left
  over from an earlier session, once from the new 53s cut.
- Hospital: `hospital-ramallah` and `hospital-toys-montage` are written but not
  yet built.

## 2026-09-21 05:00 — 27 VIDEOS ON FRAME.IO

All in `FINAL VIDEOS / EDITED BY CLAUDE`, uploaded by
`scripts/auto-deliver.mjs --watch 45` as each render finished.

**Read Tal's notes first thing:** `node system/scripts/frameio-comments.mjs --since 12h`
Every correction goes into `LESSONS.md` the same turn it is read.

### KNOWN BAD FILES UP THERE — tell Tal, do not let him waste time on them
| File | Problem | Replaced by |
|---|---|---|
| `ROMAN TEL AVIV V1` | SIDEWAYS (rotation bug) | `ROMAN TEL AVIV V2` |
| `FEED-HOMELESS-ROMAN V1` | SIDEWAYS, same bug | `ROMAN TEL AVIV V2` |
| `SHOP OWNER BREAD V1` | title card spoils the ending | `SHOP OWNER BREAD V2` |
| `WHAT MAKES YOU HAPPY V1` (66s) | stale render from an earlier session | the 53s one |
| `WMYH-V2-FAST V1` | duplicate name of `WHAT MAKES YOU HAPPY V2 FAST` | either |

`ROMAN TEL AVIV V3` (opens on Roman instead of an empty street) was still
rendering at 05:00 and will upload itself.

### FOLDERS STILL UNCUT
`WOMEN ON FLOOR..` · `SHOP OWNER 2/3/4/5` (Arabic, need translation pass) ·
`table asking a. Question` (12 of 18 clips never transcribed — they are local
`C02xx.MP4` files, use `scripts/transcribe-local.mjs`) · `FABIAN` ·
`OLD LADY JERUSALEM` · `CLEANER JERUSLAEM` · the rest of `HOSPITAL KIDS TO TOYS`
(128 clips, only ~20 used) · the rest of `SHALOM/SALAM` (100 clips, 12 used).

### THE BIG REMAINING QUALITY GAP
Captions are chunked every 3 words regardless of phrasing, so lines break as
"NAME? HOW LONG" / "WE WANTED TO". Grouping by punctuation and pause instead of
a fixed count is the single biggest readability win still available.


## 2026-09-21 06:10 — 34 VIDEOS ON FRAME.IO. WATCH-LIST FOR TAL.

The six strongest were re-cut once more after the caption grouper was rewritten
(LESSONS §18). **These are the versions to watch — everything else is an older
pass of the same cut:**

| Watch | Ignore (superseded) |
|---|---|
| `JAMAICA HELP` (1080x1920, 101MB) | — |
| `EDEN SIMPLE V5` | `EDEN SIMPLE V4`, `EDEN CANCER V3` |
| `ROMAN TEL AVIV V3` | `V2`, `V1` and `FEED-HOMELESS-ROMAN V1` (V1s are SIDEWAYS) |
| `SHOP OWNER BREAD V3` | `V2`, `V1` (V1's title spoils the ending) |
| `COFFEE KINDNESS V3` | `V2`, `V1` |
| `HOSPITAL RAMALLAH V2` | `V1` |
| `SHOP OWNER 7 V2` | `V1` |
| `FLOWERS FOR STRANGERS V2` | `V1` |
| `SHOP OWNER JUICE V1` · `HOSPITAL TOYS MONTAGE V1` · `FLOWERS MUSLIM MAN/CHRISTIAN/MUSLIM JEW` · `GIVING WATER V1+V2` · `SHALOM SALAM V1` · `SHANA TOVA V1` · `MAX HUGS V1` · `WHAT MAKES YOU HAPPY V1 (53s) + V2 FAST` | `WHAT MAKES YOU HAPPY V1 (66s)` is a stale render from an earlier session |

**FIRST THING NEXT SESSION:**
```bash
node system/scripts/frameio-comments.mjs --since 12h
```
Map each timestamped comment to a beat in that project's `edit.json`, fix,
rebuild, re-deliver — and append the correction to `LESSONS.md` the same turn.

`scripts/auto-deliver.mjs --watch 45` may still be running in the background;
it uploads any new render in `projects/*/` exactly once.


---

## 2026-09-21 17:00 — 32 VIDEOS DELIVERED, ALL 1080x1920, ALL GATED

`FINAL VIDEOS / EDITED BY CLAUDE` holds exactly one version of each cut. Every
preview-resolution upload was deleted; 45 superseded renders sit in
`projects/<slug>/_superseded/`, which `auto-deliver` cannot see.

**STORY** Jamaica Help · Eden Simple V7 · Roman Tel Aviv V7 · Hospital Ramallah
V3 · Hospital Volunteers V2 · Jew and Muslim V2 · Shop Owner Bread V4 / 7 V3 /
Juice V2 · Coffee Kindness V4 · Flowers Muslim Man V3 / Christian V3 / Muslim
Jew V2
**COMPILATION** Flowers for Strangers V3 · Shalom Salam V3 · Shana Tova V3 ·
Max Hugs V3 · Hospital Toys Montage V3 · Giving Water V4 + Alt V2 · What Makes
You Happy V3 + Fast V5
**MUSIC CUTS (no captions)** Eden Music Cut V1 · Hospital Music Cut V1 — scored
with the volunteers' own singing, cut from `IMG_8809/8810/8811` (loud audio,
empty transcripts). `projects/_music/hospital-singing.wav`
**PHONE BOOTH** Call Daughter V1 (one take) + Cut V1 · Jerusalem Peace V2 ·
Spread Love V2 · Salam V1 · My Mother V1 · No One V1 · Pickups V1

## THE PIPELINE NOW

```bash
node system/scripts/transcribe-local.mjs "<folder>"      # local originals -> same cache
node system/scripts/fetch-hq.mjs <slug> [--force]        # 4K spans over HTTP Range
node system/scripts/build-edit.mjs <slug>                # 1080x1920 by default
node system/scripts/qa-final.mjs [file]                  # the mechanical gate
node system/scripts/auto-deliver.mjs [--watch 45]        # upload once, tombstone-aware
node system/scripts/frameio-remove.mjs --superseded --yes
node system/scripts/frameio-comments.mjs --since 24h     # read Tal's notes back
```

Beats are written as LINES via `scripts/lib/lines.mjs`, not segment ranges.

## STILL OPEN

1. **`SHALOM/SALAM` uses 12 of 100 clips.** The biggest unmined folder.
2. **Two uncut hospital stories:** `IMG_8823` (second cancer story — a woman who
   nursed her mother through illness while ill herself) and `IMG_8735` (123s).
3. **Roman's self-harm passage stays OUT.** Groq returned English gibberish over
   Hebrew audio there ("You tried to get a breath?", "Did you die?"). Needs Tal
   to say what the man actually says before it can be captioned.
4. **Caption height** is 0.72 by default (measured off his reels, approved on
   Jamaica V14); the phone-booth films use `capY: 0.58`. Tal asked for "captions
   in the middle" — one line per project to apply it everywhere.
5. **No music files** beyond the extracted hospital singing. Roman needs a track
   Tal picks; drop it in `projects/_music/` and name it in `edit.json`.
