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

### The article highlight (DeployTLV), how it is done — BUILT AND TESTED

Tal, 2026-10-05, watching the Waze reel: *"look how they did all the
highlighting ... they found the article and they did a screenshot of it ... you
see how it highlighted it?"*

It is **not a screenshot.** Read frame by frame: the article is re-typeset as a
clean page so it is sharp at any size.

- Off-white page. Top row: publication name in small spaced caps on the left,
  the date on the right, a thin rule under it.
- Headline in a serif, then a rule, then standfirst, byline and body in a sans.
- **The highlight is a soft red bar that wipes left to right behind the key
  words in about 0.35s, landing on the spoken word** ("$1 Billion-Plus" as the
  voice says "a billion dollars").
- A second mark for the biggest fact: a **hand-drawn red ring** that draws
  itself around the number (Haaretz card, 40.8s).
- The page drifts slowly upward the whole time; it never sits still.
- The caption is italic serif in a white band between two thin black rules, at
  about 60-70% height, and **the same red highlight wipes the key words in the
  caption too.** The band stays put across cuts, including over footage.
- Other Deploy pieces: photo cards with the person's name in italic beneath;
  rounded video windows floating over a blurred copy of the same clip; thin
  white corner brackets on a face. The cartoon cars are footage they found
  (it looks like Waze's own old promo animation; not confirmed), not something
  they animated.

**Working build:** `system/projects/ai-story-fx-test/index.html` (HyperFrames,
7s, passes `hyperframes check`, rendered and looked at). The highlight is a
`background-size` tween from 0% to 100% on a span; the ring is an SVG path with
a `stroke-dashoffset` tween; both are placed at the word's time from the
voice's word timings. Copy that file as the starting block.

**For a real video** the headline, publication and date must be the real
article's, checked against the source, and the body is either the real opening
lines or left out. The test card's body is grey bars on purpose.

**Word timings for a generated voice:** `hyperframes transcribe` reports
`whisper_unavailable` on this machine. Use Groq directly
(`whisper-large-v3-turbo`, `timestamp_granularities[]=word`); it returned
clean timings for the Kokoro voice.

### The five caption styles — BUILT (Tal: "copy the caption style of the Jewish reports, and all of them")

Ready to use: `system/projects/ai-story-kit/captions.css` with the fonts beside
it in `fonts/` (all open licence, from github.com/google/fonts). Proof next to
the references: `ai-story-kit/caption-compare.jpg` (theirs on top, ours under).

| class | account | what it is, at 1080x1920 |
|---|---|---|
| `cap-jbr` | Jewish Business Report | white Source Serif 4, weight 560, 90px, sentence case, soft dark shadow, centred at 59% height, 1-2 lines |
| `cap-comma` | The Comma Effect | red `#e8141c` block, white Montserrat 800 caps 46px, centred at 65% |
| `cap-comma-name` | Comma name card | two stacked red blocks, white Cormorant Garamond 142px |
| `cap-venture` | The Venture | black rounded pill, white Montserrat 600 caps 33px, at 76.5% |
| `cap-venture-hook` | Venture hook line | white rounded pill, black Montserrat 700 caps 38px, two lines, at 75% |
| `cap-venture-plain` | Venture long line | plain white Montserrat 500, 38px, two lines, at 51% |
| `cap-tng` | The Numbers Game | white Inter 700, 58px, lower case, tight tracking, dead centre (49%); black on white cards |
| `cap-deploy` + `band-deploy` + `hl` | DeployTLV | italic EB Garamond 66px in a white band between two rules, key words on a soft red highlight |

The fonts are the closest open ones by eye at 480p, not confirmed matches;
sizes and positions were measured off their frames.

### OUR OWN STYLE: "TAL STORY" — the default from 2026-10-05

**ELIE WIESEL FOUNDATION, THE WHOLE PAGE (8 reels measured 2026-10-07; Tal: "study Elie Wiesel, all of the videos...
the soup video, I really, really liked it... it should just make sense. Boom, fast"). THIS IS THE HOUSE MODEL.**

| Reel | Len | Cuts/min | Words/min | Opening line |
|---|---|---|---|---|
| DdbjUfvt5T2 soup | 63 s | 36 | 130 | "This soup is 500 years old and it's completely free." |
| Dd1Zme0NLJD Yeonmi Park | 68 s | 31 | 164 | "This woman escaped North Korea. She's the most wanted woman in the country." |
| Ddtg5_vN0xP Bashar and the baby | 60 s | 36 | 176 | "This Arab man found a baby abandoned on the street." |
| Ddq9ZnAt-uo empty library | 68 s | 35 | 147 | "This secret library is holding thousands of invisible books, and it hides a dark secret." |
| DdoYgC4NwAH ozone | 87 s | 29 | 148 | "Did you know there was only one time in history when every country agreed on something?" |
| DeKSZLztRqk Wiesel on antisemitism | 118 s | 37 | 145 | (his own speech, archive) |
| DT_WuiNkg_b, DQaFnNJDSEq (pinned) | 3-4 min | 18-27 | 67-107 | institutional films: not the model |

- **Pace: 60-90 s, a cut every 1.7-2 s (29-37 a minute), 130-176 words a minute.** Fast, never frantic. (Obsession's
  97 cuts a minute is a different channel; do not chase it.)
- **Line 1 is always "This [person/thing] [one astonishing fact]."** Line 2 places it ("It all started on a rainy day on
  the streets of Nazareth." / "Hidden inside the old city of Jerusalem is..."). No question is needed.
- **The middle is plain chronology in short sentences, each one understandable alone**, with one human aside ("But this
  place is so weird."). Numbers are made relatable ("That's before the United States existed, before electricity").
- **The ending names the meaning in one sentence: "This story is beautiful because it proves that..." / "This story is
  proof that..." / "Because sometimes, the most powerful thing you can give someone isn't money."** then "Follow the
  Elie Wiesel Foundation for more." on a white logo card. OURS: "Follow The Social Accords for stories that unite people."
- **"Bashar" (Ddtg5_vN0xP) is the exact template for a story with the real person on camera (Younes):** hook as BIG
  words landing one at a time over the footage ("This / ARAB MAN / found a / Baby / ABANDONED / on the street");
  a HOST on camera for the joining lines; the subject's own lines filmed where it happened; dark stylised
  AI re-creations for the past (rainy street, the baby), never a fake face of the real people; both people together
  for the reunion; captions = white sentence case, 2-3 words, THE KEY WORDS ON THE SECOND LINE IN YELLOW.
- **Every phrase has the picture of that phrase.** If the line says Pakistan, the flag is on screen; if it says heart,
  a heart. (Tal on Ayesha V2: "This girl is from Pakistan (Pakistan flag), switch, the heart (heart VFX) is from India
  (flag cut).")

**SOUND OF THE HOUSE MODEL (measured 2026-10-07 with demucs + numpy; the model cannot hear, so these are numbers, with a
chance control for every SFX figure).**

| Reel | Narrator pitch | Voice | Music bed | Bed under voice | Whoosh on cuts (chance) | Low hit on cuts (chance) |
|---|---|---|---|---|---|---|
| Soup DdbjUfvt5T2 | 226 Hz, a woman | -14.5 LUFS | -25.0 | 10.5 dB | 50% (39%) | 16% (17%) |
| Yeonmi Park Dd1Zme0NLJD | 196 Hz, a woman | -15.1 | -21.8 | 6.7 dB | 60% (38%) | 37% (21%) |
| Bashar Ddtg5_vN0xP | 186 Hz, a woman | -16.6 | (location sound leaks in: not readable) | n/a | 67% (49%) | 31% (20%) |
| Obsession AboFlah DeEGDO-SH6n | 162 Hz | -15.0 | -21.5 | 6.5 dB | 66% (69%) | 17% (22%) |

- **The Elie Wiesel narrator is a young woman, around 190-225 Hz, and no pause is longer than half a second.** Closest
  AI voices to try: an ElevenLabs female narrator ("Sarah"), then compare with Brian, Kokoro and a free online voice.
- **Music sits 6.5-10.5 dB under the voice and never stops.** Ours at -26 LUFS under a -17 LUFS voice is about 9 dB
  under: inside their range (the soup reel's end of it).
- **Their sound design is LIGHT.** A whoosh lands on roughly one cut in five more than chance, a low hit on about one in
  six, and the soup reel has almost none: the music carries it. Obsession, at 97 cuts a minute, has NO measurable
  effect on the cuts at all. **So: no click or tick on every cut.** A whoosh on a whip or a scene change, a hit on a
  title or a number, a stamp on a date tag, and silence otherwise. (LESSONS 111's "SFX on every cut" was built for the
  punch-layer style; it does not belong on the house model.)

**REFERENCE: OBSESSION (@theobsession, 1.05M) "AboFlah" (DeEGDO-SH6n, 67 s, measured 2026-10-07). Tal: *"look at the
Instagram page, the Obsession. Look how they do their videos"* (said after Ayesha V1 "doesn't really make sense").**
- **Script: 194 words in 67 s (174 a minute), 19 sentences, NO interview bites, NO question after the hook.** Shape:
  fact + twist in two sentences ("posted for four years without earning anything. Then he raised $11 million in 11
  days.") -> "Meet X." -> straight chronology, one dated, numbered fact per sentence ("In October 2021...", "It took
  him 28 hours.") -> today's number -> a CALLBACK ending that answers the obstacle from the start ("His father spent
  years telling him it wasn't the right life. 50 million people disagree."). Every sentence is understandable alone:
  a place or a thing is never named before the viewer knows why it matters.
- **Picture: 108 cuts in 67 s = one new picture about every 0.6 s; the subject's FACE is in nearly every one.** Each
  phrase of 2-3 words gets its own picture. Never an unexplained object.
- **Cards:** flat RED (or white) full-screen cards with a few small words for a time jump or the punchline ("Three
  months later / he did it again", "50 million / people disagree"); a cream name card with a red label and a photo;
  news headlines zoomed until the number fills the screen, the number in a red box; counters ticking over footage.
- **Captions:** tiny white sentence case, 1-3 words, dead centre of the frame (0.5), no box.

**REFERENCE: JEWS OF NY "Younes + Shalev" (DeKU1HEqTxp, @jews_of_ny with @shalevb10, 97 s, measured 2026-10-07).
Tal: *"I really liked how they... look at the script. Make it a bit similar"* and *"I don't think we should use the
actual picture of the Jews of New York, that's their video."* SO: THE FRAMEWORK IS THE REFERENCE, THEIR FOOTAGE IS NOT
A SOURCE. This is the model for a story where BOTH people are on camera (the two-voice story):**

1. Both greet the camera together, one line (0-2 s).
2. Each says who he is in ONE identity line: "I am an Arab Muslim who saved lives on October 7." / "I am Shalev, one
   of the many people Younes saved." (2-12 s). No narrator anywhere.
3. The meeting, told from BOTH sides, alternating every 3-5 s: "I saw a young guy, I was scared" / "The second I heard
   his Arabic accent, I was terrified".
4. The small detail that turns it (the earrings: "he wasn't a terrorist, he was one of us").
5. The kindness, said by the one who received it ("like we were one of his kids. Water, food").
6. The danger, told as DIALOGUE in direct quotes ("How can I help you?" / "You've got Jews inside the farm").
7. The fear admitted ("I could barely stand, but I didn't show him"), then the line that saved them ("I'm a father,
   I have a family, leave me alone").
8. The other one names what it cost ("Younes risked his own life").
9. Why they tell it + the message, split between the two ("Muslims and Jews / we can live together / humanity over
   hatred"). 10. Thank you, and a hug. Hold the hug.

Picture: 47 cuts in 97 s (29 a minute); the two stand side by side with one mic; a 1-2 s cutaway lands on the exact
noun (earrings close-up, the room, the CCTV motorcycle, the crawl space, family photos, the rally). Punch-in on the
speaker between sentences. Captions burned in white caps, 2-4 words, with an Arabic line under the opening and the
closing only. Hebrew is spoken and captioned in English.

**CAPTIONS AND TITLES, ELIE WIESEL FOUNDATION (three reels measured, 2026-10-06; LESSONS 119).** Caption: Inter 800,
62 px on 1080x1920, sentence case, white with a soft shadow, no stroke, no box, dark on a light page, 2-4 words shown
at once, centre at 0.70 of the height. Title: italic serif lead + heavy caps word (+ italic tail), in the same
lower-centre zone, over a picture. **A title replaces the caption: never both on screen.** Built in
`ai-story-retik-quigley/v2/build.py` (`.capx`, `HIDE`, `~phrase`).

**REFERENCE: THE ELIE WIESEL FOUNDATION "Yeonmi Park" (Dd1Zme0NLJD), measured 2026-10-06. THIS IS THE CLOSEST MODEL
FOR OUR PERSON STORIES.** Tal: *"study this style, study this script, study everything ... you should be able to do
exactly these types of videos ... combine all my styles and make the best thing."* 68s, 186 words = **164 wpm**, 44 cuts
(39 a minute by scene detect; more with the graphic changes), music+effects only 6 dB under the voice (loud).

SCRIPT, sentence by sentence (20 sentences, average 9 words):
1. "This woman escaped North Korea."                                  (who + the act, 5 words)
2. "She's the most wanted woman in the country."                      (raise the stakes)
3. "And Kim Jong-un's government is actively trying to find her ..."  (the threat, present tense)
4. "But why?"                                                         (two-word question, host on camera)
5. "This is Yeonmi Park."                                             (name card)
6-7. childhood: "saw a lot of terrible things. Abandoned babies, malnourished kids, and people crying out for help."  (list of 3)
8. "This is not a place where you can have a family or live a normal life."
9. "So she decided to escape."                                        (the turn, host on camera)
10. "At age 13, she and her mom took a chance and escaped through the Yalu River to China."   (age + route = MAP)
11. "And she finally could start a new life in South Korea."          (map)
12. what she does now. 13. the threat returns ("Now, the ... government is trying to find her and discredit her.")
14. "But she keeps going."  15. "She's determined to share the truth with the world."
16-19. the meaning, addressed to US: "She wants us to remember to never take freedom for granted. Because there are
people out there risking their lives ... to know what it feels like to be free."   20. follow card.
Present tense for now, past for the back-story. No quote from the subject at all: the HOST carries it.

PICTURE, in order: subject close-up + two-weight title ("This WOMAN") -> three one-word place cards (ESCAPED / NORTH /
KOREA, each on its own shot) -> **a stylised "wanted" portrait: the subject restyled against a line-up wall, then the same
framing in a field** (AI image edit of her photo) with "Wanted WOMAN" -> host: "But why?" -> name on a white page with
the footage in a framed inset ("This is YEONMI PARK", huge bold) -> host -> three one-word cards over archive ("A LOT OF /
TERRIBLE / THINGS") -> **black-and-white photo COLLAGE on paper** (cut-out leader, buildings, children, red bar over the
eyes), items added as the list is spoken, tiny caption under -> archive street footage with small captions -> host ->
old photos (her at 13, with her mother) -> **animated MAP**: dotted red route drawn across a river, labels, then a
satellite map zooming onto South Korea -> her on stage -> host -> leader footage with words stacking up line by line
("is trying to / find her / and discredit / her") -> her portraits with two-weight titles ("She wants us to REMEMBER",
"never take FREEDOM for GRANTED") -> host for the last lines -> logo card.

WHAT WE HAVE / WHAT IS NEW:
- have: two-weight titles, one-word cards, framed inset, name card, paper cut-out collage (Paperima), small captions,
  punch-ins, sound on cuts, music.
- NEW to build: (a) an **animated map** with a drawn route (SVG path with stroke-dashoffset over a map image; free map
  tiles/Natural Earth, or a generated map still); (b) **words stacking line by line** over footage; (c) the **restyled
  portrait** (needs an image-to-image model; our 4 GB card can do SD img2img at low res, quality unproven); (d) the HOST.
- The host is about 40% of the running time and says the connective lines ("But why?", "So she decided to escape.",
  the whole ending). Without Tal on camera we keep those as voice-over on pictures.

**REFERENCE: THE ELIE WIESEL FOUNDATION "500-year-old soup" (DdbjUfvt5T2), measured 2026-10-06.**
Tal: *"Study this reference and make sure you can do the exact same thing."* File:
`assets/references/ai-story-reels/low2/DdbjUfvt5T2.mp4`; sheet + transcript in
`assets/analysis/ai-story-reels/batch2/`. 63s, 136 words = **130 wpm** (slow and clear),
~45 cuts (43 a minute), a HOST talking to her phone camera for about a third of it.

Script (12 sentences): object hook with a number and a twist ("This soup is 500 years old
and it's completely free.") -> where ("Hidden inside the Old City of Jerusalem is a tiny
kitchen called ...") -> the date, then THREE comparisons ("before the United States
existed, before electricity, before cars") -> the daily routine with numbers (6 a.m., 50
kilos of rice) -> who it is for ("no matter their religion, nationality, or background")
-> what it survived, as a list of three (empires, wars, pandemics) -> the turn ("But
somehow, the soup never stopped.") -> the meaning ("the most powerful thing you can give
someone isn't money. It's simply a warm meal ...") -> follow card.

The six building blocks, all of which the engine can do:
1. **Two-weight kinetic title over footage**: a small italic serif lead-in + one HUGE bold
   sans keyword, built word by word, centred ("is 500 years old"; "and it's completely
   FREE"; "called HASEKI SULTAN IMARET"; "in 1552"; "50 kilos of RICE").
2. **Small plain captions** for ordinary sentences: white sans, about 2-3 words, low centre,
   no box.
3. **Framed inset**: the footage shrinks into a window on a white page with a dark caption
   under it ("Hidden inside / the Old City / of Jerusalem").
4. **Cut-out collage**: on a paper-textured background, one cut-out object pops in per
   item of a list (Statue of Liberty = "the United States", a light bulb = "electricity",
   a car = "cars"), each with its caption.
5. **Colour card + cut-out + one word**: teal + a helmet "EMPIRES", dark teal + a soldier
   silhouette "WARS", blue + a mask "PANDEMIC".
6. **Host on camera** between sections, then a white logo card "follow for more".

What it needs that we do not have by default: (a) cut-out objects (make with the local
generator on a plain background + `hyperframes remove-background`, or Pexels photos cut
out), (b) a real kitchen/location shoot, (c) Tal filmed talking to camera. Without (c)
the same video works as voice-over only.

**REFERENCE BATCH 2, measured 2026-10-06** (Tal: *"good references to add to the
list, look how they do sound effects, movements and the b-rolls"*; of the
Smashi reel: *"this is very good, I want to be able to copy this exact style
if I need"*). Files: `assets/references/ai-story-reels/low2/`, measurements
`assets/analysis/ai-story-reels/batch2/`.

| Reel | Account | Length | Words/min | Cuts/min (scene detect) | What it is |
|---|---|---|---|---|---|
| DbfQ23EoxTd | smashibusiness | 86s | 195 | 26 | bin Laden: 100% AI-generated period images, each one MOVING (image-to-video), one consistent AI character |
| DeGg_V_krJ- | smashibusiness | 101s | 180 | 46 | same house style, mixed with real footage |
| DdrInyCThKy | founding.mena | 70s | 184 | 89 | AlBaik: a new real picture every ~0.6s, one-word captions, solid brand-yellow cards |
| DeIScNvD_zb | the.genius.series | 56s | 199 | 79 | one-word centred captions, colour cards with big type, grids of faces |
| DchZZ2biSNI / DcZrFUZkklt | theindicpulse | 90s / 107s | 156 / 148 | 28 / 27 | slower essay style |
| DQ5N9sOjduX | unpackedmedia | 112s | 195 | 19 | news explainer |
| DUTWuspjHIa | ysocialnetwork | 109s | 199 | 21 | talking explainer |

Scene detection UNDER-counts these: it misses motion-graphic changes and
moving AI shots. Read the 2 fps sheets, not the number.

**What they share (and what we were missing):**
- **The voice never stops and it is FAST: 180-200 words a minute.** No gaps
  between sentences at all.
- **A new picture every 0.6-1.0s in the fast ones** (founding.mena: one picture
  per 1-3 spoken words).
- **Captions are ONE or TWO words, centred**, popping with the word. Smashi:
  bold white caps with a soft shadow, two short lines, low-centre.
- **Solid colour cards as punctuation** (founding.mena: full-screen brand
  yellow with one word, about every 8-10s; Genius: navy cards with big type).
- **Sound under everything.** Rough count of sound hits with the voice removed
  (demucs; the detector is NOT validated, treat as an order of magnitude):
  founding.mena ~70 a minute, Genius ~58, Smashi far more (a busy, quiet bed).
  40-66% of the cuts have a hit within 0.15s. Music sits 5-19 dB under the
  voice (Genius 5, founding.mena 8, Smashi 19).

**THE SMASHI STYLE (to copy exactly when asked):**
1. Script: "This man [did the impossible thing]." -> "Meet [full name], the
   [origin] who ..." -> rise in steps -> the relationship that made him ->
   the numbers -> death/legacy -> "This dreamer arrived with nothing and left
   behind ...". 280 words in 86s, zero pauses.
2. Picture: ~35 AI images in ONE consistent look (warm sepia, period costume,
   wide cinematic), the same character in most, each animated 2-3s (he walks
   toward camera, crowds move, money falls, a plane in a storm). Never a real
   photo.
3. Layouts: full frame; a THREE-PANEL vertical stack when a list is spoken
   ("no money, no connections, no formal education"; "Mecca, Medina and
   Al-Aqsa"), one panel landing per item; a name title over a dark green grid
   with a glitch on "Meet ...".
4. Captions: white bold caps, 2 short lines, lower-centre, 2-4 words, changing
   with the voice. Logo top-left the whole time.
5. NEEDS: an image generator that can make ~35 consistent images and an
   image-to-video model. The free services here give ~3 stills then stop, so
   this style waits on Tal's open-source generator (he offered it 2026-10-06).

**Updated 2026-10-06, later (Zaal + Boger, Liraz; LESSONS 110). Newest template:
`system/projects/ai-story-zaal-boger/v2/build.py`** (tall window for 16:9
talking heads, full-width band for two-shots, fixed-length shots with a
negative share, per-event sounds, music bed, `hq/` 1080p sources). Three
videos exist in this style: Daryl Davis (V14), Tim Zaal + Matthew Boger,
Liraz Charhi. Rule added: read every real line cold, and give every event in
the script a picture of that event (generate a faceless still if none exists).

**Updated 2026-10-06 (Daryl Davis V13, LESSONS 109). Working template:
`system/projects/ai-story-daryl-davis/v13/build.py`.**
- Hook = fact, then twist, as two short lines ("This man convinced members of
  the KKK to quit. And he's a Black musician.").
- Arrows: one solid gold marker stroke, drawn FROM THE TOP down onto the thing.
- One cinematic beat per video, on the reveal: grey picture, slow push, riser,
  heartbeat, boom + low piano note.
- Our sound set lives in `v13/sfx/` (marker, shutter, paper, glass, riser2,
  heart, boom, pianolow, pianohi): a shutter on every plain photo cut, the
  signature instrument of the subject on the name and the end card.
- Every strong object in a frame is explained by the script or the shot goes.


Tal: *"you choose the best or whatever you want, to make our own style."*
Chosen, and built in `system/projects/ai-story-kit/captions.css` (sample:
`ai-story-kit/tal/tal-story-style.mp4`). It has not been used on a real video
or approved on one yet; treat his first reaction as the real test.

It is the Comma Effect's system in his colours, not their red:

| piece | class | what |
|---|---|---|
| caption | `cap-tal` | white rounded pill, black Montserrat 800 caps, 48px, 2-3 words, key phrase only, at 65% height |
| the number / the turn | `cap-tal gold` | the same pill in his gold `#FACC27` |
| name card | `cap-tal-name` | the name in white Cormorant Garamond, a gold tag line under it |
| a real quote | `cap-tal-quote` | white italic EB Garamond (the Jewish Business Report feel), key words on a gold highlight |
| big number | `cap-tal-big` | the figure huge in gold over a darkened shot |
| article proof | `hl-gold` | the DeployTLV re-typeset article, highlight wipe in gold |

Why these: the pill reads on any picture without an outline, white and gold
are already his (LOOK-AND-SOUND: gold `#FACC27`), the serif is kept for names
and real quotes so a quote looks different from narration, and nothing here is
another account's colour. Script in the Venture voice, music 14 dB under the
voice, a whoosh only on designed transitions.

## 3a. VOICE, MUSIC, SFX — measured, not listened to

The model reads text and pictures; it cannot play sound. So audio is studied
by tools: Whisper for the words, demucs to split voice from music, ffmpeg and
numpy to measure. Each instrument's limit is stated.

**Voice.** Every narrator is a man. Pitch by autocorrelation, with the music
still underneath, so read it as "deeper / lighter", not as an exact figure:
Comma 94-102 Hz (the deepest, slow and weighty), JBR 100-106, Deploy 116, TNG
and Venture 127-133 (lighter, younger, faster). Speed is in the table at the
top. No voice pauses over 0.5s.

**Music.** There is a bed under the voice in every reel.
Control test: a voice-only file's quietest tenth sits 53 dB below its typical
level. The references' quietest tenth sits only 7-11 dB below (Comma -8.6, TNG
-9.3, Venture -10.7, JBR -7.2), so something is always playing. Waze is the
calmest at -14. TNG leaves about 1 second of music after the last word; Comma
and Venture cut dead on it. What the music IS (genre, track) cannot be read
this way. Tal adds music himself.

**SFX and music, with the voice removed.** Four reels were split into voice
and everything-else with demucs (`python -m demucs --two-stems vocals`, free,
local, installed 2026-10-05), then the everything-else track was checked at
every cut. Each figure has a chance control: the same test with the cut times
shifted at random.

| reel | music under the voice | a high "whoosh" on the cuts | chance | reading |
|---|---|---|---|---|
| Venture Brabus | -14.4 dB | **74% of cuts** | 27% | **whoosh on nearly every cut** |
| JBR Mid-Day | -9.3 dB | **73% of cuts** | 36% | **whoosh on the cuts** (its white flashes) |
| Comma Item7Go | -14.2 dB | 41% | 43% | **no SFX on ordinary cuts**; the music carries it |
| TNG Dacombe | -9.6 dB | 33% | 32% | **no SFX tied to cuts**; a loud beat-driven track |

- **Two mixes.** Comma and Venture keep the music 14 dB under the voice. TNG
  and JBR run it louder, about 9.5 dB under.
- **Two SFX habits.** Venture and JBR put an airy whoosh on almost every cut.
  Comma and TNG do not; their cuts are silent and the track does the work.
- **Comma's music has a slow, regular pulse**: a low hit every 4.0 seconds for
  the whole reel (1.0, 5.0, 9.0, 13.0 ...). Its cuts do not land on it.
- **TNG's track has a kick about every 0.65s** (roughly 92-99 BPM).
- Bass hits on cuts: no better than chance in any of the four.
- Limits: the split is not perfect, hi-hats in the music count as "airy"
  events (which is why the chance column matters), and this says where sounds
  are, not what they are. The other ten reels were not split.

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
- **Mix:** voice on top, music 14 dB under it (the Comma / Venture mix).
- **SFX rule for our build:** a short whoosh on designed transitions and
  cards (the Venture habit), nothing on plain cuts (the Comma habit).

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

**State on 2026-10-05:** first one built: Daryl Davis, four versions in one day
(`system/projects/ai-story-daryl-davis/`, `v11/build.py` is the working
template (timeline built from the sound; shots are shares of each voice segment) (the subject on camera for his own lines, real footage and Commons photos, no AI stills): shot table, caption table, real-voice quote table, effect blocks,
SFX table). What Tal corrected on the way is LESSONS 100 to 107; read both
before building the next one. Not approved yet.
---

## 8. A SECOND VOICE: THE SLOW PORTRAIT (@wardrobehistorian, Michèle Lamy, read 2026-10-05)

Tal: *"look at the shots ... I like how real the shots looked, and look at the
audio ... make sure you listen to the audio to know the script and how they do
it so you're going to make the best script."* (48.9K likes, 115s.)

**The script. This is the opposite of the fast business reels and it works.**

| | Lamy portrait | Venture / Founded |
|---|---|---|
| speed | **134 wpm** | 170-220 |
| pause between sentences | **0.8s median, 20 of 30 over half a second** | none |
| sentences | 31, **8 words** each, 5 of them 1-3 words | 12-20 words |
| opener | **"This is Michèle Lamy."** Name first, no hook number | stranger + number, name second |
| order | strict life order: born, studied, moved, met | hook, then origin |

- **Every sentence is one plain fact.** "She was born in 1944 in Jura,
  France." No adjectives doing the work, no "incredible".
- **One long list sentence early** to show a restless life (27 words: studied
  law, skipped lectures, defence attorney, cabaret dancer, "sometimes on the
  same day"), then short ones for the rest.
- **Mirrored pairs**: "He fell in love with her. She fell in love with him.
  She was 50. He was 33."
- **One-word sentences for texture**: "Dark. Sculptural."
- **A list that lands on the last word**: "Business partner, muse, mirror,
  eventually wife."
- **Present tense for the ending**: "She still wears his clothes every day."
- **The other person's words close it**: "Rick once said, without Michèle
  there is no Rick Owens."

Use this voice when the subject is a PERSON and the feeling matters more than
the numbers (which is most of Tal's people). Use the fast voice (section 1)
for a business or a "how did he do it".

**The sound (voice removed with demucs, measured).** Voice -14.1 LUFS, music
and effects -32.5: the bed sits **18 dB under the voice**, the quietest of
every reel studied. Sound effects on cuts: 12% against 11% by chance, which
is none. Two soft events in the whole reel, at the start and the end. A calm
voice, room to breathe, almost no effects. I cannot tell whether the voice is
a person or a model.

**The pictures are generated, not found.** 34 cuts a minute, 2-3 second
shots, one colour grade throughout, and the same present-day face in 1944, in
a 1979 restaurant and in a courtroom: these scenes were never filmed. It is a
consistent-character image model plus image-to-video.

- **What we can do today without connecting anything:** realistic STILLS. The
  Hugging Face key already in `system/.env` reaches FLUX schnell
  (`router.huggingface.co/fal-ai/fal-ai/flux/schnell`), about a second an
  image. Tested 2026-10-05: three 1983-bar stills, used in Daryl Davis V6 with
  a slow push. Each one carries an "ILLUSTRATION · AI-GENERATED" label.
- **What needs a service:** MOVING generated shots like this reel, and a
  consistent face across scenes.
- **Our line:** generate places, objects, hands and backs. A real person's
  face in a scene that never happened is not generated here; a real person is
  shown with real photos and footage (Wikimedia Commons had seven freely
  licensed photos of Daryl Davis; `photos/LEDGER.json` records each licence).

## 9. VOICE: ELEVENLABS (key in `system/.env` as `ELEVENLABS_API_KEY`, added 2026-10-05)

Use it for the narrator instead of Kokoro. Daryl Davis V10: voice "Brian"
(`nPczCjzI2devNBz1zQrb`), model `eleven_multilingual_v2`, speed 1.12, one
request per line with `previous_text` and `next_text` so the lines flow, the
`/with-timestamps` endpoint. To re-voice a finished cut without re-timing the
picture, place each new line at its old start time and speed it up by a few
percent only if it would run into the next one (`v10/starts.json`).

The account was on the free tier when tested: 10,000 characters a month (a
56-second script is about 580), and **music generation was refused: "Music
API is not available for free users."** Check
`GET /v1/user/subscription` before promising music.
