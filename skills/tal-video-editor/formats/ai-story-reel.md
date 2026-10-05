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

### 1a. How the sentences are built (measured on the timed transcripts)

Tal, 2026-10-05: *"just understand how the scripts are in the references."*

| | sentences | words per sentence | hook | name lands at | numbers | first number at |
|---|---|---|---|---|---|---|
| Comma Item7Go | 15 | 21 | 22 words, 6.3s | 6.7s | 11 | 13.4s |
| Comma Dantata | 16 | 20 | 24 words, 7.7s | 8.3s | 8 | 6.7s |
| Comma Mane | 16 | 20 | 32 words, 12.5s | 12.7s | 4 | 17.5s |
| Venture Brabus | 15 | 14 | 10 words, 3.4s | 3.6s | 12 | 1.5s |
| Venture HSN | 20 | 12 | 15 words, 4.5s | 4.1s | 11 | 2.4s |
| Venture Socher | 15 | 14 | 12 words, 4.7s | 4.4s | 6 | 0.3s |
| TNG Dacombe | 27 | 8 | 9 words, 2.8s | in the hook | 19 | 3.0s |
| TNG On | 18 | 15 | 14 + 14 words, 8.4s | 8.4s | 13 | 4.3s |
| JBR Sivan | 4 | 25 | 24 words, 6.2s | no "Meet" | 3 | 1.2s |
| JBR Mid-Day | 10 | 14 | 19 words, 6.4s | 10.8s, mid-sentence | 8 | 0.1s |
| Deploy Waze | 17 | 10 | 9 words, 2.7s | 6.8s, with the year | 4 | 6.8s |

(TNG's "hair" reel is a different thing: a host interviewing two founders, 42
short spoken lines of question and answer. It is not this format.)

**Three ways to write the same story:**

- **Comma = 15 long sentences.** 20 words each, past tense, one full idea with
  two clauses. The hook alone is 22-32 words and takes 6-12 seconds. Reads like
  a business case study.
- **Venture = 15-20 medium sentences, present tense.** 12-14 words. The hook is
  10-15 words and done in under 5 seconds, with the number inside the first 2.5
  seconds. This is the tightest writing of the five and the one to copy.
- **TNG = 27 fragments.** 8 words each. "He's 25, worth over $1 billion, and
  you've probably never heard of him." "Lasted two days, then dropped out."

**The words that start the sentences are the whole engine.** Nearly every
sentence after the hook opens with one of these, and each one has a job:

| opener | job | example |
|---|---|---|
| **Meet [Name]** | the reveal, always sentence 2 | "Meet Bud Paxson." |
| **In [year], [Name] is [age] and...** | the origin, present tense | "In 1977, Bud is 42 and owns a small radio station in Florida." |
| **So...** | consequence: he acts | "So he goes to collect a $1,000 ad bill." (3 times in one Venture script) |
| **But...** | the obstacle or the turn | "But Bodo sees what everyone else misses." |
| **Then... / Next...** | escalation | "Then Roger Federer invested." |
| **When [bad thing]...** | pivot under pressure (Comma) | "When university strikes threatened his business, he pivoted off campus." |
| **Instead of [the normal move], he...** | the contrarian decision (Comma, in all three) | "Instead of just donating money, he decided to build a real business." |
| **By [year]...** | scale jump | "By 1984, rental giant Sixt orders 200 cars in a single deal." |
| **Today...** | the payoff | "Today, Brabus operates in over 100 countries." |

**Things every script does:**

- **A ticking clock or a small stake early.** "Payroll is due tomorrow and he's
  about to use his own savings." "So he needs to drive a Benz to keep his job."
- **One odd concrete object carries the story.** 112 avocado-green can
  openers. A garden hose glued to a shoe. A cake page with 200 followers. Party
  jollof for 250 naira. The hook names it and the last line comes back to it.
- **A two- or three-word sentence at the turn.** "It worked." "They said no."
  "And it works." "He took it." "The newsman laughs."
- **Numbers are specific and odd**, never rounded for comfort: $9.95, 112,
  78,000 trees, 330 km/h, 13 times, $86,000 in debt. 8-19 of them per script.
- **A borrowed famous name** where one exists: Nike, Mbappe, Federer, Google,
  Facebook, Peter Thiel, Dangote, Nvidia. It is usually in the hook.
- **Three in a row at the proof**: "100 countries, employs 500 people, and
  generates $250 million a year." "No drilling, no incisions, just light."
- **The last line closes a loop.** It repeats the hook's number (Brabus), goes
  back to the hook's object ("the channel that started with 112 can openers is
  valued at more than $2 billion"), turns the hook upside down ("the brand Nike
  rejected just took their most famous athlete"), or states the lesson ("...
  proving that you don't need luxury sit-down restaurants to conquer the fast
  food industry"). Nobody ends on "follow for more".
- **No opinion words about the subject.** No "amazing", "incredible",
  "inspiring". The numbers do it.
- **No questions to the viewer, no "you"**, apart from one TNG line ("you've
  probably never heard of him").

**Where the beats fall, as a share of the runtime** (Venture HSN, 64s, the
cleanest example):

| share | time | beat |
|---|---|---|
| 0-6% | 0-4.1s | hook: object + number |
| 6-8% | 4.1-5.0s | "Meet Bud Paxson." |
| 8-33% | 5-21s | origin: year, age, place, the clock, the odd object arrives |
| 33-47% | 21-30s | the turn: he tries it, someone laughs, "and it works" |
| 47-61% | 30-39s | the realisation: what this means, the new decision |
| 61-90% | 39-58s | scale, one time-jump per sentence |
| 90-100% | 58-64s | last line: back to the can openers, the final number |

Comma stretches the same shape to 110s by adding two or three "moves" in the
middle, each its own "When..." or "Instead of..." sentence.

**Fill-in template (Venture voice, about 65 seconds, 220 words):**

```
This [guy / woman / nationality + job] [did odd thing with OBJECT] and turned it into [NUMBER].
Meet [Name][, the founder of X].
In [year], [Name] is [age] and [small starting situation, a place].
[The stake or clock.]
So [first action].
[The obstacle: someone says no / it fails.]
So instead of [expected], [he does the odd thing with OBJECT].
[A sceptic.] [Two-word sentence.]
But [he does it anyway], and it works.
[What he realises.]
So [the bigger decision].
[Year / "three years later"], [scale 1]. [Scale 2]. [Scale 3].
And in [year], the [thing] that started with [OBJECT] is [FINAL NUMBER].
```

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

## 3a. VOICE, MUSIC, SFX — measured, not listened to

I cannot hear. Everything here is a measurement of the audio file, and each
instrument's limit is stated.

**Voice.** Every narrator is a man. Pitch by autocorrelation, with the music
still underneath, so read it as "deeper / lighter", not as an exact figure:
Comma 94-102 Hz (the deepest, slow and weighty), JBR 100-106, Deploy 116, TNG
and Venture 127-133 (lighter, younger, faster). Speed is in the table at the
top. No voice pauses over 0.5s.

**Music.** There is a bed under the voice in every reel, and it is not quiet.
Control test: a voice-only file's quietest tenth sits 53 dB below its typical
level. The references' quietest tenth sits only 7-11 dB below (Comma -8.6, TNG
-9.3, Venture -10.7, JBR -7.2), so something is always playing. Waze is the
calmest at -14. TNG leaves about 1 second of music after the last word; Comma
and Venture cut dead on it. What the music IS (genre, track) cannot be read
this way. Tal adds music himself.

**SFX: not established yet.** With voice and music mixed together I could not
separate effects from the bed:
- Comma's five light-leak transitions are 1.2-1.8x louder than a random moment
  at four of the five, in the mid band and not in the high "whoosh" band. That
  fits a soft swell or riser on each leak. It is a hint, not a finding.
- JBR Mid-Day has twice the high-band energy on its cuts as elsewhere, which
  fits a short airy whoosh on its white flashes.
- No reel shows bass hits landing on ordinary cuts.
- To settle it the voice has to be split from the rest (demucs) and the
  remainder checked at every cut. Not done.

**What we have to make them with:**
- **Voice, free and local:** `npx hyperframes tts` (Kokoro). Installed and
  working on this machine as of 2026-10-05 (`pip install kokoro-onnx soundfile`
  was the missing piece). Male voices: `am_adam` (116 Hz, 199 wpm at speed 1.1,
  the closest to Venture/TNG), `am_michael` (117 Hz, 170 wpm), `bm_george`
  (British, 134 Hz, 181 wpm). Kokoro leaves 15-17 pauses of 0.3-0.6s per 45s;
  close them with ffmpeg `silenceremove` to match the references.
- **Voice, Groq:** the key already in `system/.env` lists
  `canopylabs/orpheus-v1-english` (an open-source model), but it answers
  "requires terms acceptance". Tal has to accept that himself at
  console.groq.com; it is not something to click for him.
- **Voice, paid:** ElevenLabs (`system/scripts/generate-voiceover.ts`), no key
  set.
- **SFX:** 19 sounds in `skills/tal-video-editor/assets/sfx/` (three whooshes,
  riser, two bass impacts, pop, click, typing, chime, sparkle, glitches).
  Starting map until the references' own SFX are measured: `riser` or
  `whoosh-cinematic` on a light-leak, `whoosh-short` on a card sliding in,
  `typing` under a typed name, `click-soft` per digit on a year roller, `pop`
  on a cut-out appearing, `impact-bass-1` once on the biggest number. Under the
  voice, never over it.
- **Mix:** voice on top; the references run a bed about 8-10 dB under it.

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
