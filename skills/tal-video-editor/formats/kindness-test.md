# FORMAT — KINDNESS TEST ("The World Sucks" style)

For: `KIDNESS TEST/*` — shop owner 1-7, muslin guy in coffee shop, women on
floor. Tal: *"these videos are going to be very similar to The World Sucks."*

Measured from two references Tal supplied (`projects/_refs/study/`):

| Reference | Dur | Cuts | /min | Avg shot |
|---|---|---|---|---|
| *His words in the end* (Arabic, shop owner) | 59s | 12 | **12.2** | 4.54s |
| *A little expensive for a chocolate* | 179s | 75 | **25.1** | 2.36s |
| `C7mDUt5tsRC` restaurant moment (Tal named it most important) | 58s | 21 | 21.6 | 2.65s |
| `CcyT0e_lYrb` MD Motivator — Michael | 44s | 20 | 27.3 | 2.09s |

**Target: 2.5-4.5s per shot, 12-25 cuts/min.** Slower than a greeting
compilation, faster than a single-take conversation. The short reference is the
slower one — when the subject is *speaking*, hold on them.

---

## THE SHAPE — four beats, always in this order

```
1. SETUP     who they are, where we are. Fast, minimal. 5-10s.
2. THE TEST  the ask. One clear moment. The viewer must understand
             exactly what is being requested and what refusing would mean.
3. THE DECISION  the stranger chooses. THIS IS THE TURN. Do not rush it and
             do not cut away from their face while they decide.
4. THE PAYOFF  the stranger SAYS WHY, in close-up, in their own words.
```

**The payoff is the stranger talking, never the creator narrating.** In *His
words in the end* the final 30 seconds are one man's face saying
*"goodness has no limits — it surpasses all religions."* That is the video. The
kindness itself is only the setup for him saying that.

Tal: *"let the stranger reveal who they are before delivering the payoff."*

---

## WHAT THE REFERENCES ACTUALLY DO

**Push in as they speak.** Both references get visibly tighter on the face
through the payoff — wide at the setup, close by the last line. On horizontal or
static footage this is a punch-in inside the take, not a cut.

**End on the face, mid-thought-completed.** Neither reference ends on a walking
shot, a logo, or the creator. Both end on the subject's face having just
finished the line that matters.

**The money/goods are shown, not discussed.** A hand extending cash, a bag being
handed over. One shot each, no lingering.

**Captions in the references are small white lower-third sentence case.**
**Do NOT copy that.** Tal's own system is bold WHITE uppercase with a dark
outline, 1-3 words, lower-middle of frame (SKILL.md -> THE STANDARD) — see
ROUTING.md §3. Copy their *structure*, never their typography.

---

## ARABIC AND HEBREW

Several of these shoots are in Arabic (`muslin guy in coffee shop` especially).

- **Transcribe with Groq; trust the model's own detected language.** Never assume
  English because it "reads like" English — two clips on a previous shoot were
  actually Arabic.
- **Keep the original-language transcript. Translation is a SEPARATE field**,
  never overwritten onto the original.
- Captions for a translated line are **timing-verified, wording-unverified** —
  say so rather than claiming the captions are verified.
- Run the second-model diff (`scripts/caption-audit.mjs`) on any clip that
  reaches the final cut; disagreements are where the model guessed.

---

## PER-SHOOT NOTES (from the Frame.io folders)

| Folder | Files | Note |
|---|---|---|
| `muslin guy in coffee shop` | 5 · 7GB | Tal: *"the folder is great."* C0481 = Sony/main, VID = Meta POV. Use both angles. |
| `SHOP OWNER` … `Shop owner 7` | 1-5 each | Small folders — if the story is weak, **do not force it**. Tal said so explicitly. |
| `WOMEN ON FLOOR..` | 6 · 495MB | Strongest moment first, then reveal context. |

**Two cameras:** the Sony/main angle should show WHAT is happening; the Meta POV
should make the viewer FEEL it. Switch only when the change brings the viewer
closer — not on a rhythm.

---

## RULES THAT BITE HERE

- **Never cut the stranger off mid-sentence.** Their words are the whole payoff.
- **Reduce background noise** (DeepFilterNet `-a 10`, never `-a 25`) — shops and
  streets are loud, but the ambience stays; it is the proof it is real.
- **Under 60s** unless the subject's own speech genuinely needs longer.
- **Nothing negative.** Cut any moment of awkwardness or refusal that reads badly.

---

# HIS OWN SHORT CUTS — measured 2026-09-28

Three of his own finished kindness tests, from the same zip as
`voiceover-broll.md`. Originals: `assets/references/voiceover-broll-drive-2026-09-28/`,
every shot on a contact sheet in `assets/analysis/voiceover-broll/`.
**These are HIS edits. Where they disagree with the World Sucks numbers
above, these win.**

| | `2 updated` bread stall, Damascus Gate | `3 enhanced audio` coffee cart, Carmel market | `4 revised` same cart, later cut |
|---|---|---|---|
| runtime | 59.7s | 59.3s | 65.7s |
| real shots | 16 | ~15 | ~15 |
| cuts/min | 15 | 15 | 14 |
| longest hold | 12.5s (the reveal, one POV take) | 14.8s (the reveal) | 11.2s |
| speech | 161 wpm | 212 wpm | 236 wpm |
| loudness | −9.1 LUFS, peak **+0.5** | **−6.2 LUFS, peak +1.9** | −6.4 LUFS, peak +1.7 |
| audio | mono | mono | mono voice + a stereo layer (side −22 dB), rising toward the end |

**Inside the 12-25/min band above, at the slow end, and the long holds are
all on THE DECISION and THE PAYOFF**, exactly as the four-beat shape says.
The reveal ("actually I do have money... this was a test") runs 11-15s as
one unbroken take. Nobody cuts away from the face while it decides.

## The shape, as he cut it

```
ASK (0-11s)        "I ran out of money... I'm really thirsty"   POV, counter height
THE YES (11-30s)   he gives; Tal asks why; identity exchange:   "I'm Jewish" / "We're brothers"
REVEAL (30-45s)    "I actually do have money. This was a test."  ONE long take
REFUSAL (45-57s)   the stranger won't take the money: WHY       "because I decided to give you without money"
PAY IT ON (57-65s) light-leak flash -> Tal carries it to a       the street cleaner in the orange vest
                   street cleaner
```

**The ending is the kindness passed on**, same as `two-camera-kindness.md` §2.
Bread stall: "I will take this bread, I will give it to someone who needs it."

## What changed from V3 to V4: his own revision

The same footage, cut twice, two days apart (`3 enhanced audio` 09-24 ->
`4 revised` 09-26). **What he put BACK in is the lesson:**

1. **The stranger's identity.** V3 cut straight from "why not?" to "I'm
   Jewish". V4 restores **"We were raised in love, my friend... as an Israeli
   Muslim Arab guy" / "Oh, you're a Muslim?"**. The line that makes "we're
   brothers" MEAN something. (Same failure as LESSONS: context beats fell out
   of Jamaica in a restructure.)
2. **The stranger's pushback on the premise**: "No, no, no. You're really not
   thirsty." Human, a little funny, kept.
3. **The refusal said twice**: "But I have 400 shekels for you" is repeated so
   the second refusal lands.
4. **A longer ending** with the cleaner: ~3s -> ~7s, down to a close-up of the
   drink in his hands.

Net +6.4s, and every added second is **identity or payoff**. None is setup.

## Captions: two looks in his own kindness cuts

| | bread stall (`2 updated`) | coffee cart (`3`, `4`) |
|---|---|---|
| colour | **colour by speaker: the stranger GOLD, Tal WHITE** (checked on 12 crops) | gold/yellow, both speakers |
| case | sentence case | **ALL CAPS**, condensed display face (Bebas-like); V3 had no punctuation, V4 added it |
| amount | **1-3 words**, each word fades in | **a full line, 1-2 lines** per caption |
| height | y ≈ 0.71 | y ≈ 0.72-0.74 |

> **CONTRADICTION: flagged for Tal, not resolved here.** THE STANDARD says
> white ALL-CAPS 1-3 words. The coffee cuts use gold ALL-CAPS full sentences;
> the bread stall uses gold/white sentence case by speaker. **THE STANDARD
> stays the default until he says otherwise.** The bread stall's
> speaker-colour rule is the one worth asking about: it tells you who is
> talking without a name, which matters when the stranger speaks broken
> English.

## The light-leak flash

A warm orange/white light-leak washes the frame for ~0.3-0.5s **once**, at
the cut from the counter to the walk to the cleaner. THE STANDARD already
allows "a brief light/flash accent to mark a major hook or transition". This
is it, measured in both coffee cuts (the bread stall has none): once, on the
payoff transition, never on ordinary cuts.

## Do NOT copy his loudness

−6 LUFS with peaks at **+1.9 dBFS** is clipped. That's what "enhanced audio"
did. Deliver at −14 LUFS, −1 dBTP as always. Street ambience stays in.
