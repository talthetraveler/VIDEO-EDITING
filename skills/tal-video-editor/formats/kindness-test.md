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
