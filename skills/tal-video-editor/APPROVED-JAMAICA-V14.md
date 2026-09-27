# APPROVED — Jamaica V14. This is the standard.

Tal, 2026-09-21: *"this is great, the V14, study this skill and the editing
style you did, I love it."*

**First cut Tal has approved.** Every story video should be built to this shape
on the FIRST version. Fourteen versions produced it; nothing should need
fourteen again.

---

## THE RECIPE

**113 seconds. 14 beats. 11 source clips out of 25.**

| # | Beat | Why it's there |
|---|---|---|
| 1 | **Tal to camera inside the shelter** — *"this family of 10 completely lost their home … the baby sleeping on old mattresses"* | OPENS ON A HUMAN. One context beat, not four. |
| 2 | *"What's your dream for your birthday?"* | meet the person |
| 3 | *"…see if I could get a bicycle"* / *"A bicycle?"* / *"Okay, let's make that happen"* → **his reply** *"that would be really great"* | the ask AND the answer, never split |
| 4 | *"alright guys, we'll be back with the bicycle"* | the promise |
| 5 | **in the car, his story** — *"the hurricane … three years to build … in a minute it's all gone"* | the emotional core |
| 6 | *"and I just, I miss my home"* | |
| 7 | *"this is what life's about, helping people … then you gotta help someone else"* | the theme, in HIS words |
| 8 | bike shop — *"we're buying him a bicycle"* / *"matching your shirt?"* | both smiling |
| 9-10 | *"I want to write Damien"* → *"What'd you write?"* → *"33 … my birthday"* | **promise paid off on screen** |
| 11-12 | *"New bike, who this?"* → riding together | the joy |
| 13 | *"you bring like a full enjoyment to my life right now"* | the payoff, from him |
| 14 | *"Just continue. Do good. Leave negative thoughts."* | **his message, not Tal's** |

## WHY IT WORKS — the transferable shape

```
OPEN ON A FACE (context, once)
  -> MEET THE PERSON (one question)
    -> THE ASK + THEIR ANSWER + THE DECISION
      -> THE PROMISE
        -> THEIR STORY (the longest beat — let it run)
          -> THE THEME, IN THEIR WORDS
            -> THE DOING (shop, the detail, the name)
              -> THE JOY (riding, laughing, together)
                -> THE PAYOFF, FROM THEM
                  -> THEIR MESSAGE
```

- **Never open on a landscape.** V13 did and was rejected.
- **Never say the same thing twice.** V13 had four clips of "look how they
  live"; V14 has one.
- **End on THEIR words, on both faces.** Not the creator, not a walking shot.
- **The longest beat is their story** (22.9s here). Everything else is short.

## THE CRAFT SETTINGS THAT SHIPPED

- **Square band** (1:1 on 1080x1920, blurred darkened fill) because the source is
  16:9. A 9:16 crop keeps 31% of the frame and decapitates people; 1:1 keeps 56%.
  Band sits at y=330, above centre, so faces are higher.
- **Slow punch-in** 1.00 → 1.06 across each beat. Movement without cutting.
- **Gold ALL-CAPS captions**, 78px shrinking only when a line would overflow,
  black outline, y = 72% of frame height, **one on screen at a time**, timed from
  real Groq word timestamps.
- **Title pill**: white rounded box with soft shadow, top, drawn flag —
  `POV: I BOUGHT A BIKE FOR A MAN / IN JAMAICA 🇯🇲 WHO LOST HIS HOME`. Holds 4.5s.
- **DeepFilterNet -a 10** per beat (never -a 25), `highpass=70`,
  `loudnorm I=-16`. Street ambience kept.
- **Grade**: `contrast 1.06, brightness +0.015, saturation 1.12`, slight warm
  balance. Small moves — it must not look graded.
- **Boundaries**: 0.12s before the first word, tail padded to the real gap.

## REPRODUCE IT

`projects/jamaica-bike/build.mjs` is the working script; `EDIT.json` is the
recipe. For a new shoot use the generic path:

```bash
node system/scripts/frameio-discover.mjs "<folder>" --fetch
node system/scripts/frameio-transcribe.mjs --words        # EVERY clip
node system/scripts/autotrim.mjs <slug> <id...>
node system/scripts/build-edit.mjs <slug>
node system/scripts/selfreview.mjs <EDIT.json> <render.mp4>
```
