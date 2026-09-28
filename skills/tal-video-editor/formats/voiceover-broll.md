# FORMAT — VOICEOVER + B-ROLL (his voice drives, the picture illustrates)

Tal, 2026-09-28, handing over a zip of his own cuts: *"see like how I did that
video where it showed the references ... 'For two years, I traveled the whole
world hiding that I was Jewish.' You can see the script and how I wrote it and
then how the B-rolls align with that ... you should be able to know how to do
voiceover videos. I could just give you my voice and then you do the
B-rolls."*

**Measured from two of his own finished films.** Every detected shot was put on
a contact sheet and looked at, both were transcribed with word timings, and the
sound was measured. Sheets, shot lists and transcripts:
`assets/analysis/voiceover-broll/` (not in git: it holds transcripts).
Originals: `assets/references/voiceover-broll-drive-2026-09-28/`.
Rebuild any of it with `node system/scripts/reference-shots.mjs <video> --out <dir>`.

**Every shot of both films, in words, next to the line spoken over it:
`voiceover-broll-breakdown.md`.** Read it before cutting a VO film: it is the
closest thing to watching him cut one.

| | **"Hiding that I was Jewish"** (`Tal Dooreck.mp4`) | **Julius / Save a Child's Heart** (`Tal Dooreck-Julius.mp4`) |
|---|---|---|
| kind | **personal manifesto**: his life story -> a mission -> CTA | **subject story**: one person's story, told by Tal, with the subject's own voice |
| runtime | 127.4s | 160.9s |
| real shots (by eye) | **~85** (the detector fired 174 times; scrolling screen recordings and whip moves fire every frame) | **~75** (115 detector hits) |
| cuts/min | **~40** | **~28** |
| speech rate | **193 wpm** | **199 wpm** |
| A-roll share | ~21 shots, ~28% of runtime | ~12 studio shots, plus the sit-down interview |
| loudness | −14.5 LUFS, peak +0.3 dBFS | −13.3 LUFS, peak +0.2 dBFS |
| ending | CTA: "comment the word, peace" | brand shout + tagline |

**Faster than the Social Accords NAS pair** (`nas-explainer.md`: 175-183 wpm,
29-39 cuts/min). This is the fastest-talking, fastest-cutting format in the
system. The manifesto is the fastest of all.

---

## 1. THE RULE THAT MAKES IT WORK: the script decides what's on screen

Every line of the script gets one of five jobs, and the job decides the shot.
This is the whole method; the rest is detail.

| the line is... | on screen | from his film |
|---|---|---|
| **a PIVOT**: "But", "So", "And then", "And today", an opinion, a question to the viewer | **Tal to camera** (A-roll) | "And today, social media can make that even worse" · "So I started traveling to help people back" · "And then I stopped hiding" · "But honestly, this is not enough" · "Do you believe that too?" |
| **a concrete NOUN or EVENT** | **literal B-roll of exactly that thing**, cut on the phrase | "traveled the whole world" -> volcano crater · "hitchhiked" -> in the back of a desert truck · "lived with a tribe in the Amazon" -> tribe dancing · "crossed Cuba on a horse" -> on a horse · "built homes in Jamaica" -> hurricane rubble · "about Israel" -> an Israeli flag |
| **a LIST** | **one shot per item**, ~0.7-1.2s each | "fed me / drove me / let me sleep" -> food on the floor / on a motorbike / asleep · "Palestinian / Israeli / black / white" -> a different person on every word |
| **an ABSTRACT claim** | **a receipt**: proof it's real | "fuel antisemitism" -> protest sign "ANTISEMITISME = VIOLENCES + CRIMES" · "Islamophobia" -> "WE STAND WITH MUSLIMS" · "so much hate online" -> **real hateful tweets floated over his A-roll**, background blurred · "nearly a billion views" -> screen recording scrolling his IG grid · "The Social Accords" -> screen recording of the website |
| **the SUBJECT's own words** | **the subject on camera**, their own audio | "Hi, I'm Julius and this is my story" · the sit-down: "Of course, I was so lonely" · "they should not give up" |

**The failure this prevents:** B-roll picked by mood ("something warm here")
instead of by the noun. In his films the picture changes **when the thing
named changes**, not on a timer. Read a shot list of either film and every
shot's words describe what is in it.

> **Measured, and NOT provable by timing.** Cut times vs word starts: median
> offset 0.07-0.11s, but a random-time control scores the same (56-89%
> within 0.1-0.2s), because at ~195 wpm a word starts every ~0.3s. So the
> evidence that cuts follow the words is **the contact sheets** (picture
> matches noun), not a timing statistic. Do not cite a timing % as proof.

## 2. A-ROLL — where his face goes, and how it's cut

- **White seamless studio, black tee, lav mic visible, chest-up.** It is the
  home base: 0.7-3.8s per visit.
- **Jump cuts between framings** inside A-roll (wide / punched-in, alternating
  every 1-2.5s). The CTA at the end is 8 jump cuts in 12s. The punch-in IS
  the energy; there is no other effect on A-roll.
- **Open on a face within the first second.** The manifesto opens on him ("For
  two"), and is in B-roll by the 4th word. Julius opens on Tal *with* Julius.
- **A-roll ≈ 25-30% of the film, spent on the turns.** B-roll on the story;
  his face when the story changes direction or he talks straight to you.
- **Overlays sit ON the A-roll**, not instead of it: tweet screenshots
  floated over his blurred studio shot while he speaks.

## 3. THE TWO SHAPES

**Personal manifesto** ("hiding that I was Jewish"), 127s:

```
HOOK (0-3.5s)      the surprising personal fact      "For two years... hiding that I was Jewish"
COST (3.5-15s)     what it made him do               hide religion, change name, lie about his mother
STAKES NOW (15-27) why it matters today              social media -> labels, antisemitism, Islamophobia
THE TURN (27-35)   what saved him                    "the kindness of strangers" -> fed / drove / sleep
PAYING BACK (35-52) proof, a LIST of real deeds      Amazon $10,000 · Cuba horse · Jamaica homes
STOPPED HIDING (52-67) the present + scale           moved to Israel · "nearly a billion views"
NOT ENOUGH (67-78) the want                          more untold stories · different religions together
THE MISSION (78-88) the initiative                   Social Accords, website screen recording
THE VALUE (88-115) the belief, as an identity montage "it does not matter where your mother is born"
CTA (115-127)      direct address, jump cuts          "comment the word, peace"
```

The callback: "where my mother was born" at 0:10 comes back as "it does not
matter where your mother is born" at 1:46. **Plant a phrase early, pay it off
in the values section.**

**Subject story** (Julius), 161s. This is the Social Accords NAS arc
(`nas-explainer.md` §"The story arc") with three additions:

1. **The subject introduces himself in his own voice in the first 8s:** "Hi,
   I'm Julius and this is my story." Same device as "I am Matthew".
2. **A sit-down interview, Tal listening in frame**, for the emotional lines:
   the loneliness, the fainting, the father's prayer, the message to children.
   Tal's question stays in ("Did he feel lonely?"): the question and its
   answer are one unit.
3. **The organisation's name is SHOUTED to camera, twice**: Tal with the
   families and babies, "Save a Child's Heart!" when it's introduced (1:26)
   and again in the last line (2:32).

It closes on the channel's own line: **"And this is something happening in
Israel that the headlines will not show you."** That is his positioning
("SHOWING YOU ISRAEL BEYOND HEADLINES"), used as the brand sign-off.

A second child, Miracle, turns up at 1:43, "the 9,000th child". **One more
face widens one story into the scale**, then "if you train one doctor, that
doctor can save thousands" is the idea it all lands on.

## 4. WHERE THE B-ROLL COMES FROM

| source | used for | note |
|---|---|---|
| **his own travel archive** (POV, selfie, Insta360) | nearly all of the manifesto | the library is his life. Ask for it, index it (`npm run index`), search it (`npm run search`) |
| **his own past reels, burned captions and all** | "LOOK HOW HAPPY", "SHANA TOVA" appear inside shots | fine in HIS work, because it's his own content. Never do it with anyone else's |
| **screen recordings** | his IG grid (scale), the initiative's website (the mission), tweets (the hate) | the receipt. Record at 1080 wide; a scroll plays ~3-4s |
| **the organisation's archive** | Julius as a child, the surgeons | supplied by the org |
| **news footage** | CTV / Africa Live clips of the Tanzanian surgeon | **16:9, letterboxed in 9:16 with black bars, source bug left on.** Third-party material: **only when Tal supplies it and confirms he can use it** (CLAUDE.md §1 Rights). Never fetch it ourselves |

`toolbox/find-broll/` owns the method for EXTERNAL receipts (classify the
beat, source, place on the word). Its "the user picks every clip" rule is
**relaxed for his own archive**: pick, cut, show him the result. Keep it
for third-party material, which he has to supply and clear anyway.

## 5. CAPTIONS — measured on full-size frames

| | manifesto | Julius |
|---|---|---|
| colour | **white**, no gold key word seen | white, none seen |
| case | **sentence case**, with punctuation | sentence case |
| edge | soft shadow, **no outline** | soft shadow |
| height | block centre **y ≈ 0.61** | **y ≈ 0.61** |
| amount | **builds word by word** into a 1-2 line phrase (~2-6 words), then clears | **1-3 words, one line**, replaced |
| type | bold, tightly tracked grotesque, ~78px at 1920 | same family, smaller (~60px) |

**Closest built look is `"captionStyle": "nas"`** (sentence case, white,
shadow, no stroke). Use it with **`captionKeys: []`** (no gold: neither film
lifts a word) and **`capY: 0.61`**.

> **GAP, not yet built:** the manifesto's word-by-word *build-up* (each word
> appears as it's spoken, the line accumulating to ~2 lines, then clearing).
> `render-caption.py` shows each caption beat whole. Julius's 1-3 word
> replacement IS reproducible today. Until the build-up exists, use the Julius
> style and say so.

## 6. SOUND

- **Voiceover never stops.** No gap below −32 dB of ≥0.3s anywhere in either
  film (silencedetect; the control, one of his dialogue films, found 18 gaps
  in 60s with the same settings). Breaths and pauses are cut out.
- **A stereo music bed under everything**, ~17-19 dB under the voice: side
  channel −33 to −35 dB RMS vs mid −16 to −17. It holds level across the whole
  film: no drop-outs, no swells were measured in 4s windows. (A mono VO has no
  side energy, so the side channel is the bed.) What the music is: unknown,
  and never lift it.
- **Subject audio** (the interview, "Hi, I'm Julius") plays at voice level,
  the bed continues under it.
- **Loudness: −13 to −15 LUFS.** Both peak slightly over 0 dBFS (+0.2 / +0.3):
  **do not copy the clipping, hold −1 dBTP.** Normalise to −14 as everywhere.

## 7. MAKING ONE FROM HIS VOICE — the workflow

```
1. VO in          his recording (+ A-roll video if he filmed himself)
                  -> transcribe-local.mjs --words (Groq, cached)
2. Tag the script  every phrase: PIVOT / NOUN / LIST / ABSTRACT / SUBJECT (§1)
                  -> write it as SCENE-PLAN.md, one row per phrase
3. Source          NOUN/LIST  -> his archive (library search), then Frame.io
                  ABSTRACT   -> a receipt: screen recording, sign, headline
                  (third-party only if he supplies it)
                  PIVOT      -> his A-roll, alternating wide/tight
                  missing shot -> say so in the plan; never fill with a
                  mood shot that doesn't match the noun
4. Cut on the phrase  each B-roll starts on the first word of the phrase it
                  illustrates and holds until the next phrase changes the noun
5. Captions       nas look, white, no gold, capY 0.61, 1-3 words
6. Sound          VO continuous; bed ~18 dB under; −14 LUFS, −1 dBTP
7. Verify         contact sheet of EVERY shot next to its words (reference-shots.mjs
                  on the render): does each picture show what's being said?
```

> **PIPELINE GAP:** `build-edit.mjs` cuts dialogue clips. It does not yet
> lay B-roll under a separate VO track. The one VO+B-roll build that exists
> (`build-social-accords-hyperframes.mjs`) is hardcoded to one Montana
> project. A general `vo + broll[]` edit spec is the next thing to build: the
> first real VO job should build it and test it against these two films'
> shot lists.

## Honest limits

- "Watched" = one frame per detected shot (259 frames across both), transcripts
  with word timings, audio measurement. Not continuous playback.
- Real shot counts are by eye from the sheets; the detector over-counts
  screen recordings and whip moves 2-3×.
- Caption sizes and heights are measured off 540px-wide frames: ±2%.
- The music was measured, not identified.
