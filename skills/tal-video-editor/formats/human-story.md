# FORMAT — Human Story

One person, enough substance to carry the whole video. **The person and the
story must be introduced extremely quickly.** **[S]**
This is the format the two known-approved videos (`priest-01`, `bakery-hookB`)
belong to.

| | |
|---|---|
| **Title card** | Yes. `MEETING A/AN <identity> <flag> IN ISRAEL 🇮🇱` or `SHE IS FROM <place> AND <VERB-ing> <place>` |
| **Title position** | Top, **y ≈ 0.11** |
| **Title hold** | **~30–40s (the first third), then drop.** Not 6s — his own manual edits both did this **[L]** |
| **Captions** | White caps, one word gold, 2–3 words, **y ≈ 0.60**, speech-only |
| **Hook** | Kind C (payoff-line cold open) or B (title + chronological). C is the trial-variation |
| **Pacing** | **Conversation pace. Hold faces.** Cut only what is genuinely redundant |
| **B-roll** | Sparse, and only what is being spoken about |
| **Graphics** | Title + captions. Nothing else |
| **Music** | Optional, under. Often none |
| **Runtime** | 60–120s |
| **Natural audio** | High. Street stays in |

## Structure

**Problem → person → discovery → emotion/payoff.** Reveal progressively; don't
explain everything at the top. **[S]**

**Cut it as THAT PERSON'S STORY** — chronological, dead space and repetition
removed, but **never chopped into disconnected quotes.** **[S]**

> **Never rank this person's moments by score and assemble the top N.** That
> produces a quote collage wearing a story's title. Greetings score highest and
> will turn the story into a greeting montage. **Story = chronological,
> greetings excluded.** **[S]**

## The three things that go wrong most

1. **The walk-up gets cut.** Keep the subject walking toward camera, title
   already over it, already talking. Never hard-cut to a talking head. **[L]**
2. **The ending arrives 25–30s early.** Auto-generated seed windows stop before
   the real interaction ends and the strongest closing gets lost. **Extend the
   last window toward the raw clip's end and look for the payoff.** **[L]**
3. **Over-trimming.** Trim scales with how loose the raw is — he cut 3.6s from a
   clip that flowed, 17.5s from one that was circular. **Don't chase a target
   length.** **[L]**

Cut a trailing incomplete sentence and jump to the next strong beat. End on the
payoff + at most one short warm outro. **Never a slow fade.** **[M]**

## The proven recipe (from the two approved videos)

```
proj-new [--hook] --title "MEETING A/AN <identity> IN ISRAEL 🇮🇱"
  → proj-recaption      (medium + punctuation)
  → proj-render --scale 0.5
  → preview → approve → --final
```

## Trial variation

Main = chronological as he would cut it. Trial = **hook-first on the payoff
line** — cold-open the most surprising later sentence, then a `HOW IT STARTED`
card, then the meet. Guard: if the lifted moment sits in the first 25% of the
cut it is the opening, not a hook. **[M]**
