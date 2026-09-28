# FORMAT — Street Interview

One question, many strangers. The answers are the content, and the range of
people *is* the point. This is the Abraham Accords / "send a message" shape.

| | |
|---|---|
| **Title card** | Often the question itself, or the premise. Top y ≈ 0.11 |
| **Title hold** | `hook` ~6s — the question is understood fast |
| **Captions** | White caps, one word gold, 2–3 words, y ≈ 0.60–0.67, speech-only |
| **Hook** | **The single strongest emotional answer, cold-opened before the premise** |
| **Pacing** | **Fast between people, but never inside an answer.** 2–8s per person |
| **B-roll** | None, or brief face flashes between answers |
| **Graphics** | Title + captions. A flash-cut cast montage is allowed once |
| **Music** | Optional. Sad/warm piano under emotional cuts works |
| **Runtime** | 60–120s |
| **Natural audio** | High |

## Structure

1. **Cold-open the strongest emotional answer** — not the premise, not Tal's
   intro. A personal, specific line (a grandfather, a memory, a name). **[S]**
2. Optionally a fast flash montage of the other faces (~0.22s each) as a
   transition into the premise.
3. **Then** Tal's setup: what this is, who he is asking.
4. The answers, cutting back and forth between different people and languages
   so it reads as a chorus, not a queue. **[S]**
5. End on the thesis line said plainly by the most credible voice.

## Hard-won rules

- **Every beat's in-point sits on that beat's FIRST SPOKEN WORD.** Starting even
  1.4s early means a person visibly talks with no caption on screen, and it
  reads as "the captions are broken." **[S — real complaint]**
- **Read every clip's transcript before choosing.** On a 22-clip shoot, three
  usable people were missed on the first pass. A clip that appears in neither
  the cut nor the exclusions list is a triage bug. **[L]**
- **Exclusion constraints are checked programmatically**, against word
  alignments, with the margin reported — never estimated by eye. **[L]**
- Prioritise **family, peace, love, connection, personal memories.** **[S]**
- Choose **stable shots.** **[S]**

## Multilingual

- English leads, other languages stack beneath — readable, clearly smaller,
  **not a footnote.** 40px under 82px English was rejected; 66/52 accepted. **[S]**
- **Assert each caption field contains its own script.** Hebrew once shipped
  inside an Arabic line. **[L]**
- Translations are always **"timing verified, wording unverified."** **[S]**

## Colour

These shoots span a wide exposure range across subjects. Measure with
`signalstats` and pull each clip **toward the group's chroma mean, not toward
neutral 128** — that keeps the golden hour while making shots match. Correct
~70% of the way, not 100%. **[L]**

---

## Measured from other creators, 2026-09-28

Files: `skills/toolbox/tal-reference-library/instagram-2026-09-28/`.

**Montana Tucker's 9/11 street interview (555K)**, the closest of her last 10
to Tal's work: open on the **strongest emotional quote** -> the controversial
answer with live host pushback by 6-9 s -> question blocks -> end on the answers
that bring people together. **Captions colour-coded by speaker: yellow for the
person answering, white for the host's question, red for key words**, placed
beside the speaker. (Tal's own bread-stall kindness cut does the same: stranger
gold, Tal white; see `kindness-test.md`.)

**erez.v1's best reel (629K)**: the question is spoken at **0.0 s** ("are you
single?"), the answer at 1.2 s, a specific comment-prompt pill already on
screen. It did **2.7x his next best**, and it is the only one of his 9 with
real dialogue. Transfer: open on the spoken question; a *specific* comment
prompt ("tell me where you're from"), not "like and follow"; one slow-motion
hold (~1.5 s) on the best reaction; an emoji sticker on the subject's body at
the reaction (waiting -> smiling), which needs a sticker layer the pipeline
doesn't have.
