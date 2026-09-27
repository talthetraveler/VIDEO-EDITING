# FORMAT — Long-form → Shorts

One long source video mined for several standalone verticals. This has a real
built pipeline behind it: `skills/01-longform-to-short/` — **the only craft
skill with substantial content** (9 templates, 4 references).

| | |
|---|---|
| **Title card** | Per-short. Each needs its own, since each is standalone |
| **Captions** | Match whichever format the extracted short belongs to |
| **Hook** | **Reconstructed, not inherited.** The source's opening is rarely the short's hook |
| **Pacing** | Tighter than the source. Dead air that was fine at length is fatal at 60s |
| **B-roll** | Reframed from the source |
| **Graphics** | Minimal unless the moment needs one |
| **Music** | Per-short |
| **Runtime** | 30–90s each |
| **Natural audio** | Preserved from source |

## The pipeline

```bash
npm run longform:index -- <video> --slug <slug> --model medium   # transcribe + keyframes
# Claude then reads TRANSCRIPT.md + frames/ and writes moments.json
#   — this is the SEMANTIC step. It is not scripted and must not be.
npm run longform:build -- --slug <slug> --spec clip.json
```

## The two things that decide quality

**1. Hook reconstruction.** A moment lifted from the middle of a long video has
no hook — it starts mid-thought. The short's first line must be rebuilt from
whatever in that moment creates curiosity, often a later sentence pulled
forward (hook kind C). **Never just top-and-tail a timestamp range.**

**2. Each short must stand alone.** If it only makes sense to someone who
watched the source, it is not a short — it is a clip.

## Selection

**Don't rank by score and take the top N.** The same failure as elsewhere:
greetings and loud moments score highest and produce a highlight reel of
fragments rather than several complete small stories. Each candidate needs its
own beginning, middle and payoff. **[S]**

Scoring guidance for a batch: `skills/01-longform-to-short/references/candidate-scoring.md`

## After extraction

Each short is then **re-classified into its own format** — a human story lifted
out of a long-form video is edited by `human-story` rules from that point on.
This format governs the *extraction*, not the finishing.
