# Long Form → Short — full pipeline

Take a long-form source (YouTube video, podcast, interview, travel vlog,
documentary, webinar, talking-head episode, long raw adventure, or a completed
long-form edit) and turn it into **multiple independently understandable**
vertical Shorts. **Do not simply divide the video chronologically** — find the
strongest actual stories and moments hidden inside it.

```
SOURCE VIDEO → TRANSCRIPT → STORY/MOMENT MAP → VIRAL MOMENT CANDIDATES → RANK
  → ROUGH CLIPS → TIGHTEN → REFRAME → AUDIO CLEANUP → CAPTIONS/TITLE
  → PREVIEW → HUMAN REVIEW → FINAL
```

Per source video: `source_video.json`, `transcript.json`, `moments.json`,
`shorts_candidates.json`, `clips.json`, `captions.json`, `quality-control.json`
— schemas in `../templates/`. Everything lands in
`public/footage/<slug>/`, next to the shared moment-library shoots.

## What's automated vs. what's Claude's judgment

| Stage | How | Tool |
|---|---|---|
| Ingest + transcribe | mechanical | `node scripts/longform-index.mjs <video> --slug <slug>` |
| Analyse + find moments + score | **semantic — Claude reads and decides** | read `TRANSCRIPT.md` + keyframes, write `moments.json` by hand |
| Report candidates to Tal | mechanical formatting of `moments.json` | write `shorts_candidates.json`, show him |
| Cut / tighten / reframe / caption | mechanical, given an approved candidate | `node scripts/longform-build.mjs --slug <slug> --spec <clip>.json` |
| Render preview | mechanical | `npx remotion bundle` then `npx remotion render` |
| Quality check | **Claude looks at actual stills** | render + inspect, see `.claude/agents/quality-control.md` |

## STEP 1 — analyse the entire source

Do not judge only the beginning. Read the whole `TRANSCRIPT.md` and look at the
extracted keyframes (`public/footage/<slug>/frames/`) before selecting
candidates. Map: topics, stories, scene changes, people, locations, emotional
peaks, funny sections, surprising claims, visually exciting sections, conflicts,
failures, payoffs, conclusions, strong quotes.

## STEP 2 — find short-form moments

Look specifically for: instant curiosity, a surprising fact, a strong statement,
a contrarian take, an emotional confession, a funny interaction, embarrassment,
danger, failure, unexpected success, cultural shock, a stranger interaction,
conflict, transformation, useful advice, a clear takeaway, a quotable statement,
an unusual location, unusual food, money, transportation, a challenge, a
high-energy sequence, a strong ending, a satisfying reveal.

Avoid moments that need five minutes of context, unless they can be
intelligently reconstructed into a standalone story (see Hook Reconstruction).

Score every legitimate candidate — see `scoring.md` for the rubric — and write
one `moments.json` entry per candidate (schema: `../templates/moments.json`).
**Use only content that actually exists in the source.**

### Classification

- **A** — strongest candidates
- **B** — strong candidates
- **C** — potentially useful
- **D** — do not cut unless Tal specifically asks for more quantity

Do not artificially cap the count. 3 excellent clips → report 3. 18 excellent
clips → report 18. Quality first.

## Hook reconstruction

The first sentence in the source does **not** need to be the first sentence of
the Short. Pull a strong statement from later in the same story and open with
it.

> Source: "So anyway, we arrived there in the morning, and after a while this
> guy came up…" … later: "He just gave me his motorcycle."
> Short: open on **"He just gave me his motorcycle."**, then context.

Encouraged when it improves comprehension and retention. **Never:** fabricate
dialogue, create fake quotes, change factual meaning, or imply a chronology
that makes the story false. In `clip-spec.json`, this is just beat order — list
the later beat first (see `../templates/clip-spec.json`).

## The first 2 seconds

Be extremely critical. Ask: *would someone unfamiliar with the long video
immediately have a reason to continue?* Remove "So…", "Basically…", "Anyway…",
unnecessary introductions, repeated setup, greetings, podcast housekeeping —
unless essential.

## Story completeness

A strong Short usually combines some of: **hook, context, tension/question,
development, payoff, ending.** Not every Short needs all five, but it should
feel intentionally complete. Do not end randomly because a duration target was
reached.

## Tightening

Remove: repeated statements, filler, unnecessary tangents, technical mistakes,
empty pauses, setup the Short doesn't need. Preserve: emotional hesitation,
laughter, shock, suspense, natural reaction, comedic timing. Do not turn a human
speaker into unnatural machine-gun speech. `clip-spec.json`'s `"tighten": true`
runs `removeFillers` + `wordsToSegments` (`scripts/lib/autocut-core.mjs`) per
beat — the same filler/pause logic used elsewhere in this project, applied
inside the chosen window only.

## Target length

Do not force one duration. 15s, 25s, 35s, 50s, 70s, or longer if the story earns
it. The content determines length — never pad to hit a target.

## Vertical reframe

Output is `1080×1920`. For a horizontal source, `longform-build.mjs`'s
`<ClipReel>` does a **centred crop-to-fill** by default (the same
min-width/min-height cover technique used for the 3:4 Meta footage elsewhere —
see CLAUDE.md §7). Per-beat `objectPosition` shifts the crop left/right when
the subject isn't centred.

**No automatic face tracking is available on this machine** — no Python, no
MediaPipe. This is a real capability gap, not a detail: identify the speaker
from a still, set `objectPosition` by eye, or split a beat where someone drifts
so each half gets its own crop. Say plainly that reframing is static/manual
when reporting a cut, not "intelligently tracked."

## Top title

A persistent title card is packaging, not a transcription — it can create
curiosity, explain missing context, frame the stakes, or identify a location or
challenge. **No false clickbait.** Until Tal has trained exact wording/style
from his references, use clean, literal temporary titles. `clip-spec.json`'s
`title` renders via `<TitleCard>`.

## Captions

**Maintain word timing** — `longform-build.mjs` slices `transcript.json`
word-by-word per beat and remaps onto the assembled timeline, so `<Captions>`
gets a real word-level `Caption[]` (not one blob per beat) and pages/emphasis
work correctly. See `04-captions-and-typography` for the house caption rules
(this pipeline does not assume the POV keyphrase style belongs here — pick
`variant`/`uppercase` per Tal's reference for this specific format). Proofread
names, countries, uncommon words, and numbers before calling captions correct —
whisper gets these wrong more than ordinary words.

## Audio

Compare against source audio before finalizing. Apply noise reduction **only if
helpful** — and conservatively: **do NOT over-denoise** (CLAUDE.md §1). Normalize
speech loudness. DeepFilterNet is Python-gated and **not installed on this
machine** — say so rather than claiming it ran; use the bundled ffmpeg's
`loudnorm`/`highpass`/`adeclick` instead (see `03-audio-post`). If the long-form
source has music, decide explicitly whether it survives into the Short, and
**never introduce third-party copyrighted music without Tal's authorization.**

## Multiple variations

A strong moment can generate multiple versions — e.g. quote-first, visual-first,
question/title-first. Do this when the underlying moment is strong enough to
earn it. Do not create meaningless variations just to inflate the count (see
`06-story-structure`'s "what a variation actually is").

## Actual generation

Do not stop after writing edit instructions. `longform-build.mjs` writes a real
Remotion composition; render actual preview MP4s
(`npx remotion render <bundle> <CompId> output/<slug>/<name>.mp4 --crf 24`) and
keep the machine-readable spec (`clip-spec.json`) alongside them.

## Quality check

Before presenting a Short, with actual stills inspected (not assumed):

1. Does it make sense without the original video?
2. Is the first 2 seconds strong?
3. Is there unnecessary setup?
4. Is the strongest line buried?
5. Does it have a satisfying end?
6. Are captions accurate?
7. Is vertical framing correct?
8. Is speech understandable?
9. Is anything misleading?
10. Could removing another 1–3 seconds improve it?

Record the answer in `quality-control.json` (schema in `../templates/`).

## Training this skill from Tal's examples

When Tal provides a source + the finished Short he cut from it together,
compare them and record, in `examples/` or `reference-analysis/`: what was
removed, what was moved, what became the hook, how much context survived, how
the ending changed, shot selection, reframing, captions, top title, pacing,
reaction length. Treat that pair as high-value training data — more reliable
than a written rule.

## Performance learning (optional, only with real data)

If Tal later provides real analytics (views, average view duration, retention
curve, likes, comments, shares, saves, followers gained), record them and look
for correlations with hook type, topic, duration, story type, title, and
caption style. **Do not invent metrics. Do not promise future performance.**
Use only actual data to improve candidate ranking over time.

## Default output after analysis

```
LONG VIDEO ANALYZED
Duration: 47:12
Strong candidates found: 9

A1 — "…"   Score: 92   Estimated Short: 41 sec
A2 — "…"   Score: 90   Estimated Short: 56 sec
A3 — "…"   Score: 88   Estimated Short: 28 sec
B1 — "…"   Score: 82
```

Then, unless Tal asked for analysis only, build low-resolution previews of the
strongest requested candidates.

**The job is: find the best stories inside the long video and turn them into
actual Shorts.**
