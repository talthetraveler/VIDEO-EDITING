# FORMAT — Long-form (YouTube)

> **PROVISIONAL.** Tal is `@talthetraveler` on YouTube but no long-form edit of
> his has been measured. This is scaffolding — **correct from the first real
> approval.** **[?]**

3+ minutes, horizontal or vertical depending on the destination. The whole
economy of the edit changes: retention is won chapter by chapter, not in the
first 1.5 seconds alone.

| | |
|---|---|
| **Title card** | Chapter cards rather than one persistent pill |
| **Captions** | Optional on YouTube — native captions may serve better. Export with `scripts/export-srt.mjs` |
| **Hook** | Still the first 1.5s, but followed by a *promise* of what the video delivers |
| **Pacing** | Varies by chapter. Slower than a Reel throughout |
| **B-roll** | Substantial — long stretches need visual variety |
| **Graphics** | Where they clarify. Chapter markers earn their place |
| **Music** | Under, varying by chapter |
| **Runtime** | 3–15 min |
| **Natural audio** | High |

## What carries over from the short formats

Everything in the bible about **story, B-roll earning its seconds, audio, and
not rewriting his script** applies unchanged. What changes is pacing and
structure, not values.

## What is different

- **Chapters.** Each needs its own small hook and payoff. A long-form video is
  several short ones with a through-line.
- **Captions may be native**, not burned in. `scripts/export-srt.mjs` produces a
  standalone `.srt` from an already-edited captions track for YouTube's own
  caption slot. **[M]**
- **Retention curve, not just the hook.** The 1.5s rule still opens it, but the
  3-minute mark matters as much.

## Relationship to Shorts

A long-form edit is the **source** for `longform-to-shorts`, not a competitor to
it. Build the long-form first, then mine it — never the reverse.
