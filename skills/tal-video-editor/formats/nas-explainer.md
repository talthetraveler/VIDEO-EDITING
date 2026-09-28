# FORMAT — Nas-style Story / Explainer

> **For a Social Accords video, skip to the section at the bottom** —
> measured 2026-09-27 from two of his own. It overturns this table on the
> things that matter most: **1–2 caption words, not 4–6; ~180 wpm, not 132;
> 29–39 cuts/min, not 22.** The table below is NAS Daily's own channel.

Script or VO drives the picture. Faster visual progression than a street
conversation. Information delivered warmly. **[S]**

All numbers below are **measured** from 10 top-performing NAS Daily verticals
(477K–6.8M views), not from blog posts. **[M]**

| | |
|---|---|
| **Title card** | Optional. If used, a centre reveal card rather than the top pill |
| **Captions** | **Bottom third y ≈ 0.76**, SENTENCE case, white bold, **NO stroke** (soft shadow only), **4–6 words visible**, ONE span lit `#FFE21F` |
| **Caption emphasis** | **Static semantic emphasis, NOT karaoke.** ~half the cards have no lit word at all — this is the key difference from the street format |
| **Hook** | Strong first line of the script. State the surprise immediately |
| **Pacing** | **22 cuts/min** (range 16–27). Median shot **2.4s**. 15% of shots under 1s |
| **Speech rate** | **132 wpm** — slower than conversational. Derived rule: **one cut every ~6 spoken words** |
| **B-roll** | Heavy. The picture illustrates the narration continuously |
| **Graphics** | Yes — numbers get their own full-screen animated beat |
| **Music** | Continuous bed under the VO |
| **Runtime** | **64–178s, median 157s** |
| **Natural audio** | Under the VO, present but secondary |

## The retired myth

**This is not a one-minute format any more.** Median is 157s. Anyone citing
"That's one minute" is citing 2016. **[M]**

## Cut rate tracks information density, not excitement

The densest video in the sample was the most factual (26.8 cuts/min); the
slowest was the emotional payoff (16.4). **Speed up for information, slow down
for feeling** — not the other way round. **[M]**

## Caption engine note

Tal's stored `caption.text` is ALL-CAPS, which made proper-noun scoring light
nearly every word. `scripts/lib/emphasis.mjs` detects shouty input, drops the
case heuristics and uses a case-blind names gazetteer. But `caption.words[]`
**preserves original casing**, so the sentence-case NAS look works with no
recaption — index emphasis against `words[]`, never `text`. **[M]**

Presets: `caption/nas_caption.json` (`highlight: "keyword"`),
`title/nas_card.json`.

## Failure states

- **Applying this cut rate to a street conversation.** It shreds the held faces
  that format lives on. This is an explicit rule. **[S]**
- Karaoke-highlighting every word — this format is semantic emphasis
- Putting captions at y 0.67 (that is the street format's position)
- A big stat shown as a number over stock footage instead of its own beat

---

# SOCIAL ACCORDS IN NAS STYLE — measured from two of his own, 2026-09-27

> **A third, 2026-09-28: Julius / Save a Child's Heart** — same arc, 199 wpm,
> ~28 cuts/min, with the subject's sit-down interview and the org's name
> shouted to camera. Measured in `voiceover-broll.md`, which also holds the
> script -> B-roll method (PIVOT / NOUN / LIST / ABSTRACT / SUBJECT) that
> both formats use.

Tal handed over `MATTHEW NO LIMITS new intro` and `OUR BIG KITCHEN V4`:
*"these are both nas daily style videos, study every shot, look at the script,
transcribe ... understand the sound design and music."*

**Both end on the Social Accords logo. These are HIS brand's videos in NAS
style — so where they disagree with the NAS Daily numbers above, THESE WIN.**
Every shot was looked at (contact sheets in `assets/analysis/nas-daily/`),
both were transcribed with word timings, and the audio was measured.

## The numbers — and where they overturn the table above

| | Matthew | Kitchen | the NAS table above said |
|---|---|---|---|
| runtime | 96s (86s + 10s end card) | 143s (133s + 9s end card) | median 157s |
| real shots | 42 | 87 | |
| **cuts/min** | **29** | **39** | 22 |
| **median shot** | **1.55s** | **1.13s** | 2.4s |
| shots under 1s | 2 | **37** | 15% |
| **speech rate** | **183 wpm** | **175 wpm** | 132 wpm |
| pauses ≥0.3s | **1.0s in 87s** | **2.2s in 136s** | |
| **caption words on screen** | **1–2** | **1–2** | 4–6 |
| loudness | −15.5 LUFS | −16.6 LUFS | |

**Faster, tighter, fewer words on screen than NAS Daily itself.** Cut rate
tracks information: Kitchen (a dense history lesson) runs 39/min; Matthew (a
character story) 29/min.

Cut counts were validated, not trusted: Matthew held at 41–45 across detector
thresholds 0.18–0.35 (robust); Kitchen swung 87–111 because whip transitions
and push-ins register as several "cuts" — hits under 0.35 were checked on the
contact sheet and dropped as artifacts of one shot.

## The story arc — identical in both

| beat | Matthew | Kitchen |
|---|---|---|
| **1. Hook = the surprising fact, in the first sentence** | "This is my new friend Matthew. He has Down syndrome, his father passed away from cancer…" | "This kitchen exists because of a teenager who survived the Holocaust" |
| **2. Scale / stakes** | "…so today he works at a cafe to help his single mom" | "…and now it serves more than **300,000 meals per year**" |
| **3. The hand-off line** | "Here's the story." | "Let me take you back 80 years ago." |
| **4. Backstory** | 20 years teaching; the same problem every year | Hungary, age 14, Auschwitz, the camp kitchen |
| **5. The obstacle** | "no one was willing or able to hire them" | "everyone around her was starving" |
| **6. The turn** | "Kia took a huge **leap of faith**" | "Margaret did something incredibly dangerous" |
| **7. What exists now** | No Limits Coffee Shop — work, earn, prove it | Our Big Kitchen, born in COVID, friends and neighbours joined |
| **8. The subject in their own voice** | "I am Matthew" / what he does at work | the founder: "Everyone's welcome to receive a meal" |
| **9. The value, stated plainly** | "Sometimes people don't need you to do everything for them. They just need someone to give them a chance." | "You can be a Jew, a Muslim, a Christian, a Hindu… if you are hungry, this kitchen feeds you." |
| **10. Callback to the opening** | — | "80 years ago Margaret shared what little food she had… and today this place feeds those in need" |
| **11. Brand line** | "So what are the limits?" | "Now **that** is the story of Our Big Kitchen." |
| **12. End card** | Social Accords, ~10s | Social Accords, ~9s |

The host is **personally inside** the story in Kitchen ("my grandmother was
from Hungary… survived Auschwitz too") — that is the emotional peak, placed
after the history and before the values.

## Captions

- **1–2 words at a time**, sentence case, white, **no heavy stroke**, soft shadow.
- **One key word lifted in yellow/gold**: *story*, *paycheck*, *Coffee shop*,
  *the Holocaust*, *Margaret Feder*, *per year*, *America*, *In need*.
- Lower-middle of frame.
- **Burned captions were hand-corrected where speech recognition fails.**
  Matthew's own lines transcribe as nonsense ("I work at a scoop of food");
  the video shows "I SERVE / I'M PUSHING / I CLEAN TABLES". With a speaker
  who has a speech difference, a human writes the caption. Always.

## Visual devices — each one a deliberate beat

1. **Archival photo + a yellow circle drawn round the face** that matters.
2. **A big number gets its own full-screen beat**, counting up: 296,793 → 300,000.
3. **A document with yellow highlighter** on the key line (the eulogy, "in 2019").
4. **AI-generated period imagery with ONE consistent character** — Margaret in
   Hungary, the transport, the camp kitchen — where no footage can exist.
5. **The identity montage**: one different person per word, ~0.6s each —
   *a Jew / a Muslim / a Christian / a Hindu / an atheist / young / old / poor /
   homeless*. The values line, made visible.
6. **Host to camera in two settings**: on location, and a clean white studio
   for the direct-address bridge.
7. **The subject to camera** in their own words ("I am Matthew").
8. Storefront / doorway reveal on "But this café…".

## Sound

- **A music bed under every second of speech**, never dropping out — its
  stereo component is constant through speech and pauses alike (a mono voice
  has none). Roughly **12–15 dB under the voice.**
- **Pauses are removed.** 1–2 seconds of silence ≥0.3s across the whole film.
  Every breath is cut.
- **No SFX on ordinary cuts.** Measured against 300 random moments as a
  control: cuts carry *less* high-frequency energy than chance, and fewer
  spikes than chance predicts. The picture changes on the voice's rhythm alone.
- **A real whoosh on the ONE structural transition** — the whip into the
  flashback ("Let me take you back"): stereo high-frequency +22 dB against
  +12 dB mono. Its stereo spread is what proves it is an effect and not the
  voice's "s". The "80 years ago" callback, by the same test, is just the voice.
- **End card**: Matthew keeps the music under it; Kitchen's is near-silent.
- **Kitchen's true peak is +0.7 dBFS — it clips.** Do not copy that; hold −1 dBTP.

## Honest limits of this analysis

- Watched = contact sheets of every shot + transcripts + audio measurement.
  Not continuous viewing — the renderer cannot play video.
- The music was measured, not identified. Whether it is licensed library
  music, and what it is, is unknown — **never lift it** (CLAUDE.md §1 Rights).
- Transcription errors in the source analysis: "Fieder" = Feder, "Lysi" =
  legacy, "OPKLA" = the kitchen's LA name. Matthew's closing line did not
  transcribe reliably.


## USING IT — `"captionStyle": "nas"` (built 2026-09-27)

```json
{
  "captionStyle": "nas",
  "captionKeys": ["paycheck", "Coffee shop", "the Holocaust", "per year"]
}
```

- **`captionStyle: "nas"`** switches `build-edit.mjs` to this look. Leave it
  out and every project renders the street style exactly as before — the
  change is 4 guarded lines in the builder and a purely additive block in
  `render-caption.py` (verified by diff: 0 lines of the street path removed).
- **`captionKeys`** names the gold phrases. **Gold is never automatic** —
  about half their captions have none. A caption containing a key gets it
  lifted; the longest match wins; everything else stays white.
- Height defaults to block-centre **y 0.72** (white line ~0.70, gold ~0.77).
  `capY` still overrides.

**How it was matched, not guessed:**

| | theirs (measured) | ours |
|---|---|---|
| gold | #F7CB30 – #FACC27 | `#FACC27` |
| font | narrow humanist sans | Bahnschrift **SemiCondensed** — width **94.5–96%** of theirs at matched height |
| gold word | 1.4× white, line below | 1.4×, line below |
| gold size at 1080 wide | ~142px | 140px |
| case | sentence case | preserved end to end, including hand corrections |
| edge | soft shadow, no outline | soft wide shadow + a tight one, no outline |
| numbers | big bold white, words beneath | Bold SemiCondensed 1.6×, words beneath |

**Two deliberate differences:**
- **A second, tighter shadow.** Theirs alone failed on a bright busy
  background — white words over a white blanket went grey-on-white in the
  first real render. Still no stroke.
- **Always centred.** They sometimes stagger the white line left of the gold
  one; that reads as a per-shot hand choice, so centre is the default.

**Not identical:** the typeface family. Theirs is rounder and softer;
Bahnschrift is more squared-off. Proportions match, personality does not
quite. If Tal supplies their actual font file, swap `NAS_FONT` in
`render-caption.py` and nothing else changes.
