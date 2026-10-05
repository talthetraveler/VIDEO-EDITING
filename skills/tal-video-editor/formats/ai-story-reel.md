# FORMAT — AI STORY REEL (a narrated true story, built from found pictures, no camera)

Tal, 2026-10-05: *"overall should be the ultimate video that can be very similar
to this [instagram.com/thecommaeffect] ... you can literally combine all the
things you know about video editing, and HyperFrames and everything to recreate
this style, and like finding stock footage or generating. The only thing you're
missing is the voiceover, which you can use open source for, and then music,
which I'll have to add ... do a deep analysis to recreate these videos. Look at
the script, the story, how it worked, the effects."*

This is the one format here with **none of his footage in it**. A voice tells a
true story about a person or a company in 30-110 seconds and every line is
covered by a found picture. `voiceover-broll.md` is the same idea with HIS
voice over HIS footage; when he hands over footage, that file wins.

Route here when he says "a cool story", "an AI video", "like the Comma Effect",
"like Jewish Business Report", "like the Waze one", or names a person or
company and hands over no footage.

**THE TARGET IS THE COMMA EFFECT.** The other four accounts are variations of
the same machine, and each one contributes a piece worth taking (section 5).

## What was studied, and how far to trust it

14 reels from 5 accounts, downloaded low-res (480p or under, 38 MB in all) to
`assets/references/ai-story-reels/low/` so Tal can watch them. Shot lists,
transcripts and contact sheets: `assets/analysis/ai-story-reels/` (neither
folder is in git). Rebuild with
`node system/scripts/reference-shots.mjs <video> --out <dir>`.

| account | reel | length | wpm | shots/min | median hold | words per shot |
|---|---|---|---|---|---|---|
| **thecommaeffect** | Item7Go restaurant `Dd4DErXug8O` (55.9K likes) | 111.2s | 168 | 44 | 1.40s | 3.8 |
| **thecommaeffect** | Sayyu Dantata / MRS `DeCqUN-Bbhp` (23.1K) | 109.1s | 173 | 31 | 1.97s | 5.5 |
| **thecommaeffect** | Sadio Mane mangoes `Ddt0nnduVXp` | 108.1s | 180 | 44 | 1.46s | 4.1 |
| thenumbersgame1 | James Dacombe `DdRCkQBt8N8` (10.3K) | 83.2s | 166 | 69 | 0.84s | 2.4 |
| thenumbersgame1 | On Running `Dd6SXrWtsKW` | 87.9s | 187 | 85 | 0.68s | 2.2 |
| thenumbersgame1 | hair / shower water `Dd9CLhANvj7` | 141.8s | 182 | 45 | 1.16s | 3.9 |
| theventure | Brabus `DcQyk2NxFYi` (58.6K) | 67.6s | 192 | 20 | 2.38s | 9.4 |
| theventure | Home Shopping Network `DeFgaKMNfTa` | 64.3s | 222 | 31 | 2.30s | 7.2 |
| theventure | Richard Socher `DeE9EN0osI-` | 62.9s | 204 | 27 | 2.30s | 7.5 |
| jewishbusinessreport | Sivan's Kitchen `Dd3wxLQttl0` (13.3K) | 27.8s | 222 | 43 | 1.35s | 5.0 |
| jewishbusinessreport | Mid-Day Squares `DdzFBakNLD6` | 40.4s | 207 | 45 | 2.42s | 4.6 |
| deploytlv | Waze `DeClc4-tpzR` | 68.9s | 171 | 37 | 1.42s | 4.1 |
| deploytlv | "everyone is a programmer" `DdxzQw_NW5W` | 42.7s | 140 | 25 | 1.21s | 5.4 |
| deploytlv | AWS Summit `Ddwk64HNHXf` | 43.4s | 191 | 26 | 3.50s | 7.3 |

- **Shots/min is an estimate, not a count by eye.** It is the scene detector
  with every burst of sub-0.3s hits (a counter rolling, a money flurry, a zoom)
  counted as one shot. On the sheets I looked at it is close; on the ones I did
  not it is unchecked (LESSONS 53).
- **Looked at with my own eyes:** contact sheets for Item7Go (3 of 4), Dantata
  (1), Mane (1), Dacombe (4 of 7), Brabus (2 of 3), Mid-Day Squares (1 of 3),
  Waze (1 of 2), and six frame-by-frame effect strips. **Transcript and numbers
  only, picture not looked at:** On Running, hair, HSN, Socher, Sivan, both
  short Deploy reels.
- wpm and transcripts are Groq Whisper; names come out misspelt ("Ibikbemi",
  "Ribas" for Brabus), so the words are right and the spellings are not.
- Loudness of every one is about -14 LUFS, which is Instagram, not them
  (LESSONS 58). It says nothing about their mix.

## 1. THE SCRIPT — the same skeleton in all five accounts

**No pauses.** Not one gap over 0.5s in any Comma, TNG, Venture or JBR reel.
The voice starts in the first 0.1s and stops on the last frame. (Waze is the
exception: its gaps are where real interview clips play.)

**Line 1 is a formula, word for word:**

> **"This [who] [did the improbable thing with a number in it]."**
> **"Meet [full name]."**

- Comma: "This Nigerian man went from running a small roadside restaurant to
  building one of the fastest-growing fast food chains in the country. Meet..."
- Comma: "This Nigerian man went from working for Dangote to controlling one of
  the largest filling station networks in West Africa, running over 800
  stations. Meet Sayyu Dantata."
- Venture: "This guy turned his dad's car into a $250 million empire. Meet Bodo
  Buschmann, the founder of Brabus."
- Venture: "This guy got paid in can openers and turned them into a $2 billion
  TV channel. Meet Bud Paxson."
- TNG: "This guy's shoe idea was rejected by Nike, so he built his own brand.
  Today it's worth over $10 billion."
- JBR: "This Jewish mom went from 200 followers to over 2 million."

The subject is never named in the hook. A stranger ("this guy", "this Nigerian
man") plus the outcome, THEN the name. The name is the second beat.

**Then, in order:**

1. **Hook** (0-6s): the formula. Outcome and obstacle in one sentence.
2. **"Meet [Name]"** (6-8s) + one line of who they are today.
3. **Origin** (8-25s): a year, an age, a place, one concrete small picture. "In
   1977, Bodo is 22 and working at his father's Mercedes dealership." "After
   graduating in 2012 he set up a tiny kiosk outside campus."
4. **The insight**: what they saw that nobody else did. Comma says it outright:
   "recognized a massive market opportunity", "spotted a market opportunity in
   logistics", "he noticed the painful truth".
5. **Obstacle / pivot**: "When university strikes threatened...", "Mercedes buys
   AMG and suddenly every independent tuner loses their edge", "He took the
   prototype to Nike. They said no."
6. **The moves, each one a decision with a number**: "cut costs by up to 60%",
   "bought over Chevron's retail business in 2008", "orders 200 cars in a
   single deal". Comma repeats one sentence shape: **"Instead of [what everyone
   does], he [did the opposite]."**
7. **Proof of scale**: three numbers back to back. "100 countries, employs 500
   people, generates $250 million a year."
8. **Last line.** Comma always: **"Today, [Name] [scale], proving that
   [lesson]."** Venture ends on the hook's number. TNG ends by returning to the
   first image ("started coding at 13, in a bedroom in Harrogate"). JBR returns
   to the first place ("the same Friday kitchen").

**Voice per account.** Comma is business-school, past tense, long sentences,
168-180 wpm. Venture is present tense, short sentences, a joke in the setup,
192-222 wpm. TNG is fragments: "No drilling. No incisions. Just light." "They
said no." Present tense and fragments read faster and younger; Comma's
sentences read like a case study.

**Length.** Comma 108-111s and about 315 words. Venture 63-68s, about 220
words. JBR 28-40s, 100-140 words. Pick the length first; it sets the word count.

## 2. THE COMMA EFFECT LOOK — the default to build

Everything here was seen on its frames.

- **Frame 1:** a tight portrait of the subject, a red glow rising from the
  bottom of the frame, and a **hand-drawn white dashed arrow** that draws
  itself up toward the face in the first 0.2s. Caption "THIS NIGERIAN MAN".
- **Captions:** a **red pill, white bold sans caps, 2-3 words, one at a time**,
  centred at about 63-65% of the height. They are NOT a transcript: only the
  key phrase of each line is shown ("A PHYSICS GRADUATE", "45 LOCATIONS",
  "BUY-AND-GO MODEL", "PURE VOLUME"). The voice carries the sentence.
- **The name card** (at "Meet..."): back to the portrait, an **orange
  light-leak** sweeps across, then the first name and the surname land on two
  stacked red blocks in a **white serif**. About 1 second.
- **Light-leak transitions**: an orange/red film-burn wash for 2-4 frames at
  every chapter change (seen at 6.6s, 17.5s, 40.7s, 52.9s, 73.9s). Ordinary
  cuts everywhere else. This is the signature.
- **Black grid cards**: a black background with a faint grid, used three ways:
  a rounded-corner video window in the middle (the "aside" clip), cut-out
  objects that pop in one at a time (jollof, fried rice, shawarma as the voice
  lists them), and a bare year in white serif ("1995").
- **Big-number cards**: the number huge over a darkened shot. "75% OF
  NIGERIANS" over a pot of rice; "800+" in red over the lower half of a
  filling station.
- **Footage**: real clips of the actual business and person (openings, crowds,
  drone shots of the buildings, news clips), mixed with stock and what look
  like generated stills (the mango farmer portraits). A black-and-white
  treatment marks the past.
- **Logo**: small, top right (Mane) or none.
- **Pace**: 31-44 shots a minute, holds of 1.4-2.0s, one picture per 4-5 words.

## 3. EFFECTS LIBRARY — what each of the others adds

| effect | from | what it is | use it for |
|---|---|---|---|
| **Text behind the building** | Venture, Brabus 1.7s | "$250 MILLION" on a blue bar slides in *behind* the building's roofline | the hook's number |
| **Typed name + brand stamp** | Venture 3.6s | name types on letter by letter top-left, the logo fades onto the subject's chest | "Meet..." |
| **Year roller** | Venture 5.8s, 28.5s | digits roll like an odometer to "1977" over an aged photo | every date |
| **Polaroid stack on a colour card** | Venture 11.4s | a flat sky-blue card, 2-3 photos drop in as a loose stack | a line with no footage (a feeling, a taste) |
| **Old photos brought to life** | Venture | period-looking stills with slow motion in them | the origin years |
| **Rolling money counter** | Venture ending | "$193.4M -> $250.0M" counts up on the last shot | the final number |
| **Black caption pill, white caps, small** | Venture | lower third, one line of 3-5 words | calmer than the red pill |
| **Solid colour cards** | TNG 12.2s, 16.4s, 66.8s | a full red or full white frame with just "At 16", "At 17", "$3.3" | chapter marks, ages |
| **Letterbox on white** | TNG 20.6s | the clip shrinks to a band across the middle of a white page, caption in black above it | technical explanation |
| **Word-by-word caption build** | TNG | small white sans, mid-frame, words add on: "worth" -> "worth over $1" | fast, clean |
| **Machine-gun flurry** | TNG 31.6s, 64.0s | 10-15 cuts of 2-3 frames (banknotes) under one number | every big money figure |
| **Real headline with a highlight** | TNG 74s, Deploy | a small real headline fades up on white and a red bar wipes across the key words | proof |
| **Article as the picture** | Deploy | the real article laid out clean, one word highlighted in soft red, italic serif caption on a white band | proof-led stories |
| **Named photo cards** | Deploy 7.7s | a photo on a card with the person's name in italic under it | introducing people |
| **Viewfinder corners** | Deploy 0.0s | thin white corner brackets around a face | "this is the person" |
| **Real soundbites** | Deploy | the subject's own interview audio, quoted on screen | when a real clip exists |
| **White flash in** | JBR | the cut goes to white and the next photo fades up from overexposed | soft, feminine, food |
| **Serif caption, lower case** | JBR | white serif with a soft shadow, fragments | warm human stories |

TNG is the fastest thing here (69-85 shots a minute, a new picture every 2
words). Venture is the slowest (20-31) and has the most designed graphics.
Comma sits in the middle and is the most repeatable.

## 4. THE ULTIMATE — one recipe that takes the best of each

- **Script:** the Comma skeleton, written in Venture's short present-tense
  sentences, with TNG's fragments for the punches. Hook formula, "Meet [Name]",
  "Instead of X, he Y", three numbers, "Today... proving that...".
- **Length:** 60-75s (about 210-240 words) by default; 100s+ only when the
  story has a second obstacle.
- **Captions:** the Comma red pill, key phrase only, one at a time. On a Tal
  story swap red for his own colour once he picks one.
- **Open:** portrait + drawn arrow (Comma), then the number behind the building
  (Venture).
- **Name:** light-leak into the serif name card (Comma).
- **Every date:** year roller (Venture). **Every age:** solid colour card (TNG).
- **Every big number:** a 12-cut flurry into a big-number card, and a rolling
  counter on the last one.
- **Proof:** one real headline with a highlight (TNG / Deploy), at least once.
- **Chapter changes:** light-leak. Everything else is a hard cut.
- **Pace:** 40-45 shots a minute, a new picture every 4 words.
- **From Tal's own styles:** NAS-style one-idea-per-cut (`nas-explainer.md`),
  his rule that every promise in the words is paid off on screen, and nothing
  negative: the story is told so the subject would share it.

## 5. WHERE THE PICTURES COME FROM

- **Download this video and recreate it** (Tal, 2026-10-05): download the link
  with `system/bin/yt-dlp.exe -S "res:480,+size"` into
  `assets/references/<name>/` so he can watch it, study it, write what is new
  into this file, then rebuild the EDIT with a new script.
- **Listing a page without logging in:** open
  `instagram.com/<account>/embed/` in the built-in browser and read the
  shortcodes out of the page source; it shows the newest dozen posts and which
  are videos. No scrolling, no login, no 429. Then yt-dlp each reel, 10s apart.
- For the new video, in this order: his own footage and photos; openly licensed
  and public-domain sources (Wikimedia Commons, Pexels, Pixabay, archive.org);
  generated shots (`npm run generate`); the real article as proof. The
  references plainly use the subject's own social clips and news footage; that
  is their call. Ours: a clip pulled off someone else's reel is for studying,
  and goes in a final cut only if Tal says he has the right (CLAUDE.md 1).
- **Every date, number and quote is checked against a source before the voice
  is made**, and kept in a ledger: URL, publisher, which beat.

## 6. HOW IT GETS BUILT

HyperFrames, not `build-edit.mjs`: there is no footage to trim. Load
`hyperframes` -> `general-video`. Check `hyperframes-registry` before
hand-building any effect in section 3 (light leaks, counters, grids are the
kind of thing it already has).

1. Script to the skeleton, word count from the length.
2. **Voice:** `npx hyperframes tts` (Kokoro, runs locally, free). The command
   exists on this machine; no voice has been generated or judged yet. The
   ElevenLabs pipeline (`system/scripts/generate-voiceover.ts`) is the upgrade
   if Tal wants a specific voice. Target 170-200 wpm with no gaps: generate,
   then close every pause over 0.3s.
3. Word timings from the finished voice (whisper) decide every cut and caption.
4. One picture per 4 words; each effect is a sub-composition.
5. **Music is Tal's**: deliver with the voice on its own track and leave room.
6. Preview in chat, he approves, then Frame.io.

**State on 2026-10-05:** studied, not yet built. The first attempt,
`AI VIDEO STYLE COOL STORIES EDITED BY AI/daryl-davis/`, was an empty
HyperFrames starter when checked, and another session was editing it.
