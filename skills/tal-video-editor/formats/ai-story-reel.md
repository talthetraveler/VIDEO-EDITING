# FORMAT — AI STORY REEL (a narrated true story, built from found pictures, no camera)

Tal, 2026-10-05, pointing at the folder `AI VIDEO STYLE COOL STORIES EDITED BY AI`:
*"go to the AI video of cool styles. Examples there. Look at that."*

This is the one format here with **none of his footage in it**. A voice tells a
true story about a person or a company in 30-70 seconds and every line is
covered by a found picture: a photo of the person, the product, a news article
on screen. `voiceover-broll.md` is the same idea with HIS voice and HIS
footage; when both could apply, footage of his wins and that file is used.

Route here when he says "a cool story", "an AI video", "like Jewish Business
Report", "like the Waze one", or names a person/company to tell the story of
and hands over no footage.

## The three references

Copies: `assets/references/ai-story-reels/` (not in git: third-party reels).
The first study of them, with the transcript breakdowns: `STYLE-STUDY.md` in
the same folder.

| | **DeployTLV, Waze** | **JBR, Sivan's Kitchen** | **JBR, Mid-Day Squares** |
|---|---|---|---|
| source | instagram.com/deploytlv/reel/DeClc4-tpzR | instagram.com/jewishbusinessreport/reel/Dd3wxLQttl0 or DdzFBakNLD6 (the study lists both links without saying which is which) | same |
| runtime | 69.0s | 27.8s | 40.4s |
| scene-detector hits | 33 (~29/min) | 18 (~39/min) | 29 (~43/min) |
| picture | **documents**: a news article fills the frame, one word highlighted | **people**: full-frame portraits and lifestyle photos | **people + product**: founders, bars, shelves |
| caption | black serif italic on a small white panel, mid-frame | white serif, lower-middle, soft shadow, no panel | same as Sivan |
| watermark | none seen | small account mark, upper-left | same |

**How much of this is measured, and by whom.** Runtimes are ffprobe. The
scene-detector numbers are raw hits at threshold 0.3 and were NOT checked by
eye, so treat them as an upper bound (LESSONS 53: a highlight wiping across an
article fires the detector without a cut). The picture and caption rows are
from stills I looked at: two Waze frames and one contact sheet per JBR reel
(4 and 3 frames). The narration numbers below come from the earlier study's
Whisper transcripts and loudness readings and were not re-run.

## 1. The script (from the study's transcripts)

About **200 words a minute**, no silence longer than 0.2s, talking from the
first frame to the last. Around -16.6 integrated, peaks near -0.9 dB.

1. **Hook, 0-6s.** A contrast with a number in it, and the outcome is in the
   same sentence as the obstacle. Sivan: a tiny follower count to two million.
   Mid-Day Squares: the refusals, the factory, "money they didn't have".
2. **The person, 6-15s.** Who, where, one concrete picture of the start (a
   Friday kitchen, a condo kitchen making 50 bars a day).
3. **The turn, 15-26s.** The rejection, the problem, the decision.
4. **A second problem** in anything over 30s, so the story does not end early
   (Mid-Day Squares: the cocoa price).
5. **Payoff, last 5-8s.** The scale, then back to the human: the same kitchen,
   the family still running it.

Matter-of-fact delivery. It does not pause for drama after each sentence.

## 2. The picture

- **One line, one picture, and the picture is the literal thing being said.**
  "Brother Jake joined" is over Jake. No abstract filler, ever.
- **Two picture modes, and a film can mix them:**
  - *Person mode (JBR).* Full-frame photo or clip of the person, product or
    place. Slow push or drift on stills.
  - *Proof mode (DeployTLV).* The real article as the picture: publication
    name and date at the top, headline in serif, and **one word highlighted in
    soft red** as the voice reaches it ("relocation", "belongs"). The article
    is laid out clean on a near-white page, not a raw screenshot.
- Gather per beat in this order: the hero shot, one primary-source proof, one
  human/context picture, one before-and-after. Search with the fact and its
  date ("Waze Facebook 2013 headline"), not "Waze b-roll".

## 3. Captions — NOT the house style

Tal's street captions are bold white caps. These are the opposite, and that is
the look:

- **Serif, lower case, 2-3 words, fragments of the line**, not a full
  transcript: "started with a", "renamed the page", "to leave Israel".
- Person mode: white with a soft shadow, lower-middle.
- Proof mode: black italic on a small white panel so it reads over text.
- Rule 5 still holds: every fragment is read as English before it ships.

## 4. Sound

Voice on top, a very quiet bed under it, at most a soft whoosh on a proof
reveal and one low hit on the biggest number. The voice vendor and the SFX
library of the references cannot be identified from the audio; nobody should
claim to know them.

## 5. Rules that are ours, not theirs

- **Copy the system, never the content.** Their footage, wording and voice
  stay theirs (CLAUDE.md 1 Rights).
- **Every date, number and quote is checked against a source before the voice
  is recorded**, and the source goes in a ledger: URL, publisher, which beat,
  can we use it. A proof-mode article must be the real article.
- Pictures: his own, licensed, public-domain, or cleared. Say which.
- Voice: needs a voice Tal has approved. No clonable sample of his was found
  in the project on 2026-10-05; ask him once, then save the answer here.
- **Positive only** applies here too (rule 7): a story about a person is told
  so that person would share it.

## 6. How it gets built

HyperFrames, not `build-edit.mjs`: there is no footage to trim. Load
`hyperframes` -> `general-video`; stills and articles are HTML scenes, the
voice is one audio track, captions come from the voice's word timings.

**State on 2026-10-05:** nothing has been built in this style yet. The first
attempt, `AI VIDEO STYLE COOL STORIES EDITED BY AI/daryl-davis/`, is an empty
HyperFrames starter (a 10-second card that says "Title"). No script, no
voice, no pictures.
