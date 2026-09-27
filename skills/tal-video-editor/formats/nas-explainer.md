# FORMAT — Nas-style Story / Explainer

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
