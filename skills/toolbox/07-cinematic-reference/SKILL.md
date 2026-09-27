---
name: 07-cinematic-reference
description: Turn a reference video into a reusable structural recipe — technique only, never assets.
---

# 07 · Cinematic Reference

Reference videos are studied for **structure, pacing, and technique**. Their
content is never lifted.

## Hard rule

**Do not automatically extract or reuse third-party copyrighted material —
music, footage, graphics, logos — unless Tal provides the assets and confirms he
can use them.** Analysing a reference produces *notes*, not media. Do not rip a
music bed out of a reference and drop it under a cut.

**The one standing exception:** `scripts/recreate.mjs` (the folder+reference →
edit pipeline, `.claude/skills/content-engine/`) extracts the reference's music
bed via demucs voice-separation and uses it under the recreated cut — Tal
explicitly asked for this capability (2026-09-11, "pulling the music track off
the reference... build this"). That's a standing go for *that tool's* specific
job, not a blanket license — footage and graphics from a reference are still
never lifted, and a `recreate.mjs` run should still be treated as "his call, his
rights exposure" the same as everything he asks posted.

## Ingesting a reference

```bash
bin/yt-dlp.exe -f "bv*+ba/b" -o "projects/<P>/reference/%(id)s.%(ext)s" "<url>"
```

Then extract keyframes with the bundled ffmpeg and **actually look at them**.
Reading a title and a description is not analysis; say which you did.

## The recipe format

Write one Markdown file per reference into `reference-analysis/`:

```markdown
# <title> — <creator>
source: <url>   duration: <s>   format: 9:16 / 16:9

## Beat map
0.0–1.4   HOOK      close face, no context, question audible
1.4–3.1   PREMISE   wide, title card, single line
...

## Numbers
beats: 14 · avg beat: 1.8 s · shortest: 0.7 s · longest: 4.2 s
cuts on speech end: 4 / on reaction: 9 / on visual: 1
captions: 2–4 words, centred, white + yellow emphasis
music: none / bed at ~−24 LUFS ducked under speech

## What makes it work
<3–5 bullets, mechanical not vibes>

## What to steal
<transferable technique>

## What NOT to steal
<anything specific to their footage, their brand, or their rights>
```

## Measure, don't vibe

The useful output of a reference pass is **numbers**: beats per minute, average
beat length, where the first cut lands, how long the hook holds, how many words
per caption page, when the first face appears. Those transfer. "It feels
premium" does not.

## Comparing our cut to a reference

Line the two beat maps side by side and check:

- Does our hook land as early as theirs?
- Are our beats systematically longer? (They usually are.)
- Do we cut on reactions as often as they do?
- Do we hold the payoff as long as they do?

## Tooling

`mimic-mcp` (`analyze_reference`, `analyze_creator`, `critique_reel`,
`draft_recipe`) is configured in `.mcp.json` and is a Node MCP — it runs here.
Its output is a starting point; verify the beat map against actual keyframes
before trusting it.

## Worked examples

- `skills/08-creator-formats/montana-social-accords-recipe.md` — Montana
  Tucker's launch film, frame-by-frame, turned into FORMAT A's fast end.
- `projects/call-someone-you-love/NOTES.md` — a full recreate of the
  dhar.mann "leave a message for someone you miss" reel, built from Tal's own
  Damascus Gate table shoot: participant-roster method (rotate sideways
  footage → extract a still per clip → read them as images → who's who),
  frame-exact word-level captions, DeepFilterNet denoise, signal-measured
  exposure match, PySceneDetect single-shot verification, and the two real
  caption bugs it caught (see `04-captions-and-typography`). `spec.json` +
  `build.mjs` there are a reusable pattern for a from-scratch reference
  recreate outside the `recreate.mjs` pipeline.
- **"Tal Sample.mp4"** (2026-09-12, Tal-supplied, not tracked in this repo's
  own review folders — same "CALL SOMEONE YOU LOVE" Damascus Gate phone-booth
  prop as the project above, single continuous 45.8s take, one subject) —
  Tal flagged it as a quality bar. Measured, not vibed, before writing this
  down: captions are white sans-serif, no stroke/box, ~y=0.68, phrase-grouped
  (2-6 words), and — the actual technique worth stealing — **silent during
  every pause, never held over dead air**; two real gaps in his speech (5.4s,
  2.4s) get zero caption, which is exactly why "the dead space" reads as
  intentional silence instead of a stall. Audio: -19.7 LUFS integrated (still
  under the -14 platform target — even a video good enough to hold up as an
  example has this exact problem, worth checking every time, not just when
  something sounds off), true peak -4.15 dBTP (lots of headroom). Confirmed
  "sad music in the background" objectively rather than taking it on faith —
  a spectrogram of a quiet dialogue gap (`showspectrumpic`) shows clear
  horizontal harmonic bands (sustained musical notes) under the broadband
  street-ambience noise, not just crowd sound. Color: UAVG 121.8 / VAVG 133.5
  (`signalstats`) — a mild, consistent warm push, not a heavy grade.

## Related

`06-story-structure`, `.claude/skills/video-editor/references/house-style.md`,
`.claude/skills/content-engine/` (the `recreate.mjs` automated version of this).
