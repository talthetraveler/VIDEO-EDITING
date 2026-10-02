# REFERENCE INDEX — 46 videos, 34 accounts

Supplied by Tal 2026-09-20. **Titles and modes are his.** The `mode` column is
his own categorisation; `tier` is a first pass by me and should be corrected as
each one is actually analysed.

**STATUS column:**
- `MEASURED` — real frames/waveforms inspected, numbers exist
- `LISTED` — title and URL only. **Not watched. Do not describe its shots.**

Analyse on demand: `node scripts/analyze-reference.mjs <url>`

---

## HIS OWN VIDEOS — highest precedence

Future edits must feel like an evolution of these, not a switch to another
creator. **[S]**

| # | Title | Mode | Tier | Status |
|---|---|---|---|---|
| 4 | [Tal POV — Israel bakery / Meta glasses](https://www.instagram.com/reel/DZiggEMxqSp/) | POV KINDNESS | **GOLDEN** | **MEASURED** — downloaded; part of the 7-reel caption/title analysis |
| 31 | [Israel — paying kindness forward](https://www.instagram.com/reel/DS9-SeKjD6N/) | SIMPLE KINDNESS | STYLE | LISTED |
| 32 | [Israeli youth pride moment](https://www.instagram.com/reel/DYKLnZHM98Z/) | STRANGER STORY | STYLE | LISTED |
| 33 | [Normal day on an Israel train](https://www.instagram.com/reel/DY2QmhAoF-z/) | POV / SLICE | STYLE | LISTED |
| SA-1 | **MATTHEW NO LIMITS** (Social Accords) — a man with Down syndrome at a Miami café | NAS-STYLE NARRATED STORY | **GOLDEN** | **MEASURED** 2026-09-27 — every shot, transcript, sound. `assets/references/nas-daily/` |
| SA-2 | **OUR BIG KITCHEN V4** (Social Accords) — a Holocaust survivor's legacy kitchen | NAS-STYLE NARRATED STORY | **GOLDEN** | **MEASURED** 2026-09-27 — every shot, transcript, sound. `assets/references/nas-daily/` |
| VO-1 | **"For two years I traveled the whole world hiding that I was Jewish"** (`Tal Dooreck.mp4`): his manifesto, joining The Social Accords | VOICEOVER + B-ROLL (manifesto) | **GOLDEN** (Tal pointed to it first) | **MEASURED** 2026-09-28: 174 detector hits / ~85 real shots, word timings, sound. `formats/voiceover-broll.md` |
| VO-2 | **Julius / Save a Child's Heart** (`Tal Dooreck-Julius.mp4`) | VOICEOVER + B-ROLL (subject story, NAS arc) | STYLE | **MEASURED** 2026-09-28: ~75 real shots, word timings, sound. `formats/voiceover-broll.md` |
| KT-1 | **Bread stall, Damascus Gate: "I was testing your kindness"** (`2 updated.mov`) | KINDNESS TEST | STYLE | **MEASURED** 2026-09-28: 16 shots, speaker-coloured captions. `formats/kindness-test.md` |
| KT-2 | **Coffee cart, 400 shekels, V3** (`3 enhanced audio.mov`) | KINDNESS TEST | STYLE | **MEASURED** 2026-09-28. `formats/kindness-test.md` |
| KT-3 | **Coffee cart, 400 shekels, V4** (`4 revised.mov`): his revision of KT-2 | KINDNESS TEST | STYLE | **MEASURED** 2026-09-28: the V3->V4 delta is recorded. `formats/kindness-test.md` |

| IG-2026-09-28 | **Last ~10 reels of six accounts: talthetraveler (10), nasdaily (9), aija (10), erez.v1 (9), montanatucker (10), mdmotivator (10)** | ALL | STYLE (his 1M / 536K POV "meeting a <religion>" = **GOLDEN candidate**) | **MEASURED** 2026-09-28: 58 reels, every shot on sheets, transcripts, audio. Text in `instagram-2026-09-28/` (README + one file per account) |

VO-1…KT-3 came in one zip on 2026-09-28. Originals:
`assets/references/voiceover-broll-drive-2026-09-28/`; sheets, shot lists,
transcripts: `assets/analysis/voiceover-broll/` (both git-ignored). Rebuild the
analysis of any video with `node system/scripts/reference-shots.mjs`.

Also his, already measured and held elsewhere on disk:
**`Tal Sample.mp4`** (call-someone-you-love rig, 45.8s single take) and
**`MONTANA TUCKER V3.mp4`** (his own reference *cut* — 181.5s, ~41 cuts/min,
the Social Accords target).

**SA-1 / SA-2 are the Social Accords NAS-style template** — both end on the
Social Accords logo. Their measured recipe (12-beat arc, 29–39 cuts/min,
~180 wpm, 1–2 word captions, gold key phrase) is in
`tal-video-editor/formats/nas-explainer.md`, and the caption look is built:
`"captionStyle": "nas"`. Frames, transcripts and sound measurements:
`assets/analysis/nas-daily/`.

---

## PHONE-CALL / GRIEF FORMAT — the emotional core

The genre `emotional-montage` and `call-someone-you-love` were codified from.
**Captions silent during real pauses** is the rule that came out of measuring
these. **[M]**

| # | Title | Mode | Tier | Status |
|---|---|---|---|---|
| 2 | [Phone call to someone gone — Beirut Sonder](https://www.instagram.com/reel/DceB6lNtf8t/) | EMOTIONAL STORY | STYLE | LISTED |
| 5 | [Phone call to heaven tribute](https://www.instagram.com/reel/DasXehdRjae/) | EMOTIONAL STORY | STYLE | LISTED |
| 11 | [Tel Aviv — good news phone call](https://www.instagram.com/reel/DavBLeMt3gF/) | EMOTIONAL STORY | STYLE | LISTED |
| 14 | [Phone call to someone gone — Beirut Sonder](https://www.instagram.com/reel/DbixJMsh2_J/) | EMOTIONAL STORY | STYLE | LISTED |
| 17 | [Red phone — Tell Me Your Good News](https://www.instagram.com/reel/DaawK9JRrBC/) | EMOTIONAL STORY | STYLE | LISTED |
| 19 | [Phone call to someone gone — Beirut Sonder](https://www.instagram.com/reel/Da-s-oiNO0Z/) | EMOTIONAL STORY | STYLE | LISTED |
| 35 | [Grief tribute — I Wish He Was Here](https://www.instagram.com/reels/DcyrMVFpWZJ/) | EMOTIONAL STORY | STYLE | LISTED |
| — | **Hope Wins ep** (on disk) | EMOTIONAL STORY | TECHNIQUE | **MEASURED** — 44.9s, 8 pauses >1.2s all caption-silent, **−14.28 LUFS** (the loudness calibration point) |

---

## STREET Q&A / INTERVIEW

| # | Title | Mode | Tier | Status |
|---|---|---|---|---|
| 3 | [Street interview — Jean, Beirut](https://www.instagram.com/reel/DcYo0vMseJk/) | STREET Q&A | STYLE | LISTED |
| 6 | [Street interview — mental health](https://www.instagram.com/reel/DXZlLERjkPf/) | STREET Q&A | STYLE | LISTED |
| 8 | [Street Q&A — message to the world](https://www.instagram.com/reel/DapNYXWtICx/) | STREET Q&A | STYLE | LISTED |
| 12 | [Survivor family-history interview](https://www.instagram.com/reel/Da0jV66NWJm/) | STRANGER STORY | STYLE | LISTED |
| 23 | [NYC street portrait series](https://www.instagram.com/reel/Dbk6dUuB_FW/) | STRANGER STORY | STYLE | LISTED |
| 28 | [Fortune-cookie street Q&A](https://www.instagram.com/reel/DbEON4-R2ws/) | STREET Q&A | STYLE | LISTED |
| 34 | [You Matter More Than You Know](https://www.instagram.com/reels/DcWPgz0p_Nj/) | STREET Q&A | STYLE | LISTED |

---

## KINDNESS — acts, tests, generosity

| # | Title | Mode | Tier | Status |
|---|---|---|---|---|
| 1 | [Small acts, big impact](https://www.instagram.com/reel/DWRjpRPDZXh/) | SIMPLE KINDNESS | STYLE | LISTED |
| 7 | [Asking strangers for a hug](https://www.instagram.com/reel/DcRWmhnon1W/) | COMPILATION | STYLE | LISTED |
| 9 | [Giving flowers to stylish strangers](https://www.instagram.com/reel/DbYucmCxwsz/) | COMPILATION | STYLE | LISTED |
| 10 | [Free hugs sign](https://www.instagram.com/reel/DYwzJLmoB2S/) | COMPILATION | STYLE | LISTED |
| 13 | [Praying for strangers — NYC](https://www.instagram.com/reel/DcOqUbYRU_A/) | SIMPLE KINDNESS | STYLE | LISTED |
| 18 | [Stranger makeover transformation](https://www.instagram.com/reel/C8JgztIPrYk/) | KINDNESS TEST | STYLE | LISTED |
| 20 | [Asking a stranger to buy me a smoothie](https://www.instagram.com/reel/CjYWrEtJmrg/) | KINDNESS TEST | STYLE | LISTED |
| 21 | [Giving flowers to strangers](https://www.instagram.com/reel/DWwnzm1jUTn/) | COMPILATION | STYLE | LISTED |
| 22 | [Revisiting a kind stranger — Jackie](https://www.instagram.com/reel/DcNaS_-iggq/) | STRANGER STORY | STYLE | LISTED |
| 24 | [Elderly street vendor story — India](https://www.instagram.com/reel/DZmuIoWPZNx/) | STRANGER STORY | STYLE | LISTED |
| 27 | [Surprising strangers with NBA Finals tickets](https://www.instagram.com/reel/DZV49GyP8KE/) | KINDNESS TEST | STYLE | LISTED |
| 29 | [Candid fatherhood moment](https://www.instagram.com/reel/DYMZOnPyyi6/) | SIMPLE KINDNESS | STYLE | LISTED |
| 30 | [Flowers + sandwiches to strangers](https://www.instagram.com/reel/DXoFZq8EWOh/) | COMPILATION | STYLE | LISTED |
| 36 | [Restaurant kindness moment](https://www.instagram.com/p/C7mDUt5tsRC/) | SIMPLE KINDNESS | STYLE | LISTED |
| 37 | [Taking a 100-year-old stranger to Disneyland](https://www.instagram.com/p/DbVrmDwznN-/) | STRANGER STORY | STYLE | LISTED |
| 38 | [Grocery-store kindness moment](https://www.instagram.com/reel/DcrREn9GC27/) | SIMPLE KINDNESS | STYLE | LISTED |
| 39 | [Paying for a stranger's groceries](https://www.instagram.com/reel/DczV7rxhOw7/) | SIMPLE KINDNESS | STYLE | LISTED |
| 40 | [Free hugs](https://www.instagram.com/p/DT_GXspgP7x/) | COMPILATION | STYLE | LISTED |
| 41 | [Taking a homeless man to a five-star restaurant](https://www.instagram.com/p/DYXyA_fRuy4/) | STRANGER STORY | STYLE | LISTED |
| 42 | [Giving flowers to elderly strangers — Jack Jones TV / Meta glasses](https://www.instagram.com/reel/DQSJn8zirnY/) | **POV KINDNESS** | STYLE | LISTED — Tal cited this as a combining example ("ref 42 + ref 4") |
| 43 | [Surprising a family with a shopping spree](https://www.instagram.com/p/Da6O_dhhMsg/) | KINDNESS TEST | STYLE | LISTED |
| 44 | [Cooking and distributing food to homeless people](https://www.instagram.com/p/DU6ZlOSjiPq/) | SIMPLE KINDNESS | STYLE | LISTED |

---

## STORY / CAPTION TECHNIQUE

| # | Title | Mode | Tier | Status |
|---|---|---|---|---|
| 15 | [Dhar Mann-style story / caption reference](https://www.instagram.com/reel/DcJzcPuSVhZ/) | — | **TECHNIQUE** (captions) | LISTED |
| 16 | [Malaysia street love story](https://www.instagram.com/reel/DM2lX3BSdl0/) | STRANGER STORY | STYLE | LISTED |
| 25 | [Montana Tucker — Muslim/Jewish unity](https://www.instagram.com/reel/C-nbjULPGts/) | UNITY | STYLE | **MEASURED** — n=7: 6 of 7 are ONE unbroken shot, 14–43s, zero on-screen text |
| 26 | [MD Motivator — Michael](https://www.instagram.com/reel/CcyT0e_lYrb/) | STRANGER STORY | STYLE | **MEASURED** — 9 frames + `assets/analysis/mdmotivator-michael/editing-reference.md` |
| G-1 | **"Let Claude Edit Your Videos"**, The Creator Stack #113 (@pauloshimas), PDF guide, given by Tal 2026-09-29 | TALKING TO CAMERA + EFFECTS | **METHOD** | **GUIDE, NOT MEASURED** (no video). Local copy in `assets/references/creator-stack-113/`. Absorbed into `formats/talking-to-camera-effects.md`: spoken effect cues, test-shot check, clean plate, HyperFrames effects menu, and a table of where it conflicts with his standard. Its name-prompt tip was tested and REJECTED (LESSONS 65) |

---

## ACCOUNTS — ecosystem context, not templates

Street kindness · human stories · POV interactions · emotional interviews ·
surprise generosity · unity content. **None analysed.**

**Story / scripted:** [Dhar Mann](https://www.instagram.com/dhar.mann) ·
[MD Motivator](https://www.instagram.com/mdmotivator) ·
[Isaiah Garza](https://www.instagram.com/isaiahgarza) ·
[Random Acts TV](https://www.instagram.com/randomactstv)

**POV kindness / Meta glasses:** [Jack Jones TV](https://www.instagram.com/jackjonestv) ·
[Yair B Motivation](https://www.instagram.com/yairbmotivation) ·
[Justin Leusner](https://www.instagram.com/justinleusner) ·
[Alex Carabes](https://www.instagram.com/alexcarabes) ·
[Andrejko Epta](https://www.instagram.com/andrejko.epta)

**The World Sucks network** (street interviews, Arab world — directly relevant
to Tal's cross-border mission): [Lebanon](https://www.instagram.com/theworldsucks.lb) ·
[Jordan](https://www.instagram.com/theworldsucks.jordan) ·
[Syria](https://www.instagram.com/theworldsucks.sy) ·
[Egypt](https://www.instagram.com/theworldsucks.eg)

**Emotional interview / portrait:** [Beirut Sonder Stories](https://www.instagram.com/beirutsonderstories) ·
[Humans of New York](https://www.instagram.com/humansofny) ·
[Stories by Aradhana](https://www.instagram.com/storiesbyaradhana) ·
[Storiemy](https://www.instagram.com/storiemy_) ·
[We're Not Really Strangers](https://www.instagram.com/werenotreallystrangers) ·
[Lovely2Meet](https://www.instagram.com/lovely2meet) ·
[Prayers4Strangers](https://www.instagram.com/prayers4strangers)

**Israel-based:** [Gentleman IL](https://www.instagram.com/gentleman__il) ·
[Maase Tov Beyom](https://www.instagram.com/maasetovbeyom) ·
[Erez V1](https://www.instagram.com/erez.v1) ·
[Tel Aviv Yafo](https://www.instagram.com/telaviv.yafo) ·
[Israel in Persian](https://www.instagram.com/israelinpersian) ·
[Builders of Mideast](https://www.instagram.com/buildersofmideast) ·
[Montana Tucker](https://www.instagram.com/montanatucker)

**Other:** [Daily Choto](https://www.instagram.com/dailychoto) ·
[Trin Da Comic](https://www.instagram.com/trin_dacomic) ·
[Dsikorov](https://www.instagram.com/dsikorov) ·
[Bloom & Plume](https://www.instagram.com/bloomandplume) ·
[Real Fall Risk](https://www.instagram.com/realfallrisk) ·
[Niall Donnan](https://www.instagram.com/niall.donnan) ·
[Sebastian Gomez](https://www.instagram.com/sebastiangomez)

---

## NEGATIVE — do not repeat

Carried from `TAL-EDITING-BIBLE.md` §10. These are rejections with reasons, and
they outrank any positive reference that suggests otherwise.

| Rejected | Why |
|---|---|
| Wall-to-wall B-roll replacing the speaker | The speaker is the SPINE; cutaways layer on top |
| ~20 cuts/min on a fast talking-head piece | "Felt dead." The reference was ~41 |
| Captions held over silence | Speech-only, always |
| NAS's 22 cuts/min on a street conversation | Shreds the held faces the format lives on |
| Hebrew/Arabic captions at 40px under 82px English | Read as a footnote |
| Making every edit look like one creator | **The most important principle in this library** |

---

## MEASURED DATA — read this before any edit

`measured-2026-09.md` holds ffmpeg-measured cut rates for **Tal's own 6 top
reels** (ranked by views) and **20 competitor references**, plus Tal's caption
system measured off his 1.7M-view reel.

The headline finding: **Tal's biggest video (1.7M) has ZERO cuts.** Long takes
win for single-subject stories; fast cutting is for many-people compilations.
Several briefs attach references that disagree by 10x on cut rate — that file
says which one to follow and why.

Downloading any new reference: `./bin/yt-dlp.exe -o "projects/_refs/%(id)s.%(ext)s" <url>`
— Instagram needs no login and no API key.

- **@erez.v1 — cut and zoom grammar, MEASURED frame by frame 2026-10-03.** Wide → ~4-frame zoom-in → tight hold drifting in → hard cut to the other camera; time only forward. Written up in `instagram-2026-09-28/erez.v1.md` ("Cut and zoom grammar") and turned into a routable preset: `tal-video-editor/formats/erez-fast-cut.md`. Worked example: `system/projects/flowers-notes-erez`.
