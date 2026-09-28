# Instagram harvest, 2026-09-28 — six accounts, last ~10 reels each

Tal: *"take the last 10 … from Tal the Traveler. Check out the different styles
he does, POV styles, Nas Daily styles … then NAS Daily … aija, erez.v1 …
montanatucker … md motivator"*, then *"you can just do it for the last X
amount of videos"* and *"use different agents"*.

58 reels, one agent per account. Every agent looked at every shot on contact
sheets (several also built 1–2 fps strips), read Groq word-timed transcripts,
measured the audio, and checked its instruments against known answers. Nothing
was played continuously. **Text only here**; the videos, sheets and transcripts
stay on the laptop (`assets/references/instagram-harvest/`,
`assets/analysis/instagram-harvest/`, both git-ignored).

| account | reels | file | the one-line takeaway |
|---|---|---|---|
| **talthetraveler** | 10 | `talthetraveler.md` | His best format now is **POV "MEETING A <RELIGION> IN ISRAEL"**: one person, a 63–72 s conversation, white captions, the stranger says the thesis (1M, 536K) |
| nasdaily | 9 | `nasdaily.md` | NAS now: 122 s median, 28.6 cuts/min, 140 wpm, **outlined** captions at y≈0.645 with an inline yellow word; top reels are "access stories" that show the ending first |
| aija | 10 (9 hers) | `aija.md` | Founder reveal wins (933K, 663K): open mid-action, founder in his own voice, end back on the opening shot with an acted-out thesis. Her "come with me" format is closest to Tal's and did worst — likely too long, hook without a twist |
| erez.v1 | 9 | `erez.v1.md` | Mostly song + Hebrew text cards; the one reel with real dialogue and a question in the first second did 2.7× the rest. Emoji stickers on the subject's body at the reaction |
| montanatucker | 10 | `montanatucker.md` | Her feed moved to talking commentary ("receipts") at 34–47 cuts/min; the Social Accords launch reel the system's recipe is built on is her lowest (231K). 9/11 street interview = speaker-colour captions |
| mdmotivator | 10 | `mdmotivator.md` | One template, 3-minute cap, 2–4 escalating reveals; **the top 3 hold the first reveal 9.8–18 s (mean 13.3) vs 7.8 s** for the rest. Dry open, music enters at the story turn |

`lists.json` = the reel ids and grid view counts used (pinned reels skipped).

## Across all six — what holds everywhere

1. **A face and a spoken line in the first second.** No account opens silent,
   on scenery, or on a title card alone. (NAS first word by 0.14 s; aija 0.0–0.5 s;
   MD's first line is captioned from frame 0; erez's best reel asks its question at 0.0 s.)
2. **The picture shows the noun being said**, lists at one shot per item
   (0.25–1.2 s). Confirms `formats/voiceover-broll.md`.
3. **Talk is jump-cut; the emotional beat is held.** MD reveals 7–18 s,
   aija's subject answers, Tal's own reveals 11–15 s.
4. **A single light-leak / white flash at section changes** in produced pieces
   (NAS 8/9, aija 2–7 per video, Montana's produced pieces, Tal's) — never on
   ordinary cuts, and absent from casual formats.
5. **A music bed ~12–19 dB under the voice** in every narrated or produced
   piece; MD and Tal's V4 use it dynamically (dry open → bed at the turn →
   swell or silence at the reveal).
6. **The stranger/subject says the thesis**, not the creator (Tal's 1M,
   MD's endings, aija's founder, erez's stranger-as-hero reels).

## The instrument lesson — Instagram normalises loudness

All downloaded reels, across every account, read **−14.0 to −14.7 LUFS**.
Tal's own ORIGINAL exports from the Drive zip the same day read −6.2 to −14.5.
So **a reel downloaded from Instagram says nothing about the creator's mix**:
never calibrate a loudness target from one. Loudness RANGE (LRA) survives and
is useful (song-driven 0.5–3 LU vs dialogue 7–11 LU). Written into
`tal-video-editor/LESSONS.md`.

## Where this changed the skill

- `formats/pov-meta-glasses.md` — new §: POV single-subject "MEETING A <RELIGION>"
- `formats/kindness-test.md` — the open caption flag resolved by his posted cut; MD's template
- `formats/nas-explainer.md` — NAS as of 2026-09; the `nas` caption look no longer matches
- `formats/social-accords.md` — Montana's current styles
- `formats/street-interview.md` — question at 0 s, speaker-colour captions
- `formats/voiceover-broll.md` — aija's founder arc and the pull-back open
- `formats/giving-things.md` — two stale lines corrected
