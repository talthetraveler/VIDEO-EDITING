---
name: tal-video-editor
description: "THE master router for editing Tal's videos. Load this FIRST for: 'edit this', 'make a video', 'cut this video', 'make a Reel', 'make a Short', 'make a trial reel', 'turn this footage into a video', or any raw footage handed over. It classifies the format, loads only what that format needs, names the one preferred tool per job, and owns the output workflow. Never ask Tal which skill to use — decide here."
---

# TAL VIDEO EDITOR — the master router

You are editing for Tal. **This skill decides; it does not edit.** It classifies
the job, loads the minimum context, delegates, and owns where the output goes.

---

# THE STANDARD — how every cut is made

**This is the skill. Not a file it points at.** Tal, 2026-09-24: *"there
shouldn't be like a hundred skills for video editing, there should be like one
skill ... this should all be one."* So the rules live here, inline, and are in
force on every edit without anything else being loaded. The other documents in
this folder are evidence and detail, not competing authorities.

The rules below are **Tal's own written standard**, given 2026-09-24 in his
words. Stated direction outranks anything measured off a reference, and both
outrank a guess.

## Story and pacing

- Open inside the situation, then reveal context through dialogue. Avoid a long
  explanatory setup.
- Preserve the natural interaction, but remove dead air, repeated wording,
  searches for words, and exchanges that do not change the story.
- **Cut on completed thoughts and emotional turns, not at arbitrary time
  intervals.**
- Alternate POV and observer angles to reset attention and make the viewer feel
  present.
- Use wider location shots briefly as orientation or chapter resets, then
  return to faces and hands.
- Keep imperfect, human reactions when they add warmth, tension, surprise, or
  humor.
- Build toward connection: uncertainty or misunderstanding first, shared
  humanity next, then a warm payoff.

> The 1.5-3s alternation measured in his own cut is the RESULT of cutting on
> turns. Imposing it as a cadence reproduces the number and loses the reason.

## Captions

- **Bold, uppercase, WHITE sans-serif with a dark outline or shadow.**
- **1-3 words** per caption beat; one word is preferred for emphatic dialogue.
- **Lower-middle of frame**, clear of faces, hands, and platform controls.
- Each change matches the spoken word or short phrase tightly.
- Captions are rhythm: rapid speech -> rapid replacement; **pauses leave the
  screen clean.**
- Never a full sentence as a static block.
- Translated dialogue keeps the same English emphasis style. A **smaller**
  secondary original-language line may sit below **only when it adds useful
  context** — subordinate, never a co-equal second caption.
- Minimal punctuation — questions, emotional stops, clarity.

**Implementation** — `scripts/render-caption.py` (PIL -> PNG -> `movie=` +
`overlay`; drawtext takes one fontcolor for the whole string, so it cannot
colour a single word). 94px base, auto-shrink to 980px, black stroke at 10% of
font size, soft drop shadow, max 2 lines. **Default is plain white**; gold
emphasis happens only when a caption passes `"emphasis": true` or an explicit
`"key_index"` — a hook-line device, never automatic. Height is `CAP_Y` in
`build-edit.mjs`, default **0.66** of frame, per-project override `capY`.

> **A second look exists: `"captionStyle": "nas"`** — sentence case, narrow
> sans, one named phrase in gold #FACC27 at 1.4x on the line below. Measured
> off his own Social Accords videos. Only for NAS-style narrated cuts; the
> street look above stays the default. Spec: `formats/nas-explainer.md`.

> **"Clear of faces, hands, and platform controls" is NOT automated.** Nothing
> measures where the subject's face is before placing a caption. If a face sits
> low in frame, set `capY` and confirm on a still.

## Camera and cuts

- **Prefer hard cuts.** Effects must not compete with the human interaction.
- Change angle when the speaker changes, a reaction lands, or energy flattens.
- **Subtle punch-ins for emotional or surprising words; do not constantly
  zoom.** `build-edit.mjs` has NO automatic push (`zEnd = 1.0` unless a beat
  asks). Keep it that way.
- Preserve spatial continuity across POV and observer footage.
- **Let reaction shots breathe slightly longer** than ordinary dialogue cuts.

**Two cameras, when two exist.** Measured from his own coffee-shop cut: 52
shots in 163.4s, **18.7 cuts/min, median 2.28s**, A/B/A/B continuously — POV
(glasses) for the face, the hands, the money; long lens for Tal at the stall
and the room around him. **Never reject a camera because the subject is not in
it — ask which angle serves THIS beat.** Full spec:
`formats/two-camera-kindness.md`.

**And the story does not end at the transaction** — the free drink gets carried
out and given to a street cleaner. The payoff is the kindness passed on. Look
for that second beat; it is the ending.

## Visual treatment

- **Natural documentary look, not polished commercial.**
- Correct exposure and colour enough to keep faces readable while preserving
  the real environment.
- Stabilise only when shake distracts; retain handheld movement for presence.
  (There is no stabilisation in the pipeline today — do not add a blanket one.)
- Graphic effects sparingly. A brief light/flash accent can mark a major hook
  or transition; it is not the default.

**The grade, measured from two of his own cuts:**

| | coffee-shop cut | "Spread love" |
|---|---|---|
| YAVG median | 61.5 | 102 |
| SATAVG median | 4.1 | 8.6 |
| YMIN / YMAX | **0 / 255** | **0 / 255** |

**The constant is the black point at 0 and highlights reaching 255.** The
midtone level belongs to the scene — an awning-shaded stall is genuinely dark
and Damascus Gate at midday is not. Do not force one YAVG across every film.
Use `curves` (it holds the endpoints); `eq=contrast` lifts blacks.

## Audio

- **Dialogue is primary.** Clean noise while **preserving natural voice
  texture** — this is the do-not-over-denoise line. Street ambience is the
  proof it is real.
- Ambient location sound low enough to keep realism without masking speech.
- Music supports the arc, stays below dialogue, rises on movement, reactions,
  the payoff. **Tal, 2026-09-24: "you don't need to add music."** Deliver
  without it; do not caveat every cut for its absence.
- Sound effects only to reinforce a real cut, reveal, or transition.

> Denoise per shot, never per beat, and never measure the floor through
> already-cleaned audio — that combination produced an ambience shift he heard
> as a cut at 0:22.

## The quality check — run it against the RENDERED FILE

1. The opening creates a question within the first two seconds.
2. Every retained exchange changes the relationship or advances the story.
3. Captions match the exact spoken timing and stay readable on a phone.
4. POV and observer angles preserve chronological continuity.
5. The most human reaction is not cut off early.
6. Music never competes with dialogue.
7. The ending delivers a clear emotional payoff rather than simply stopping.

| check | measure it with |
|---|---|
| 3 — placement logic | `node system/scripts/test-caption-timing.mjs` — must print 0 0 0. **Run after ANY change to caption placement.** |
| 3 — the rendered file | `python system/scripts/caption-sync.py <render.mp4> <slug>` |
| 4, 5 | `node system/scripts/check-beats.mjs <slug>` |
| 6 | band-energy / `signalstats` |

1, 2 and 7 are judgement. Make them by looking at stills of the opening, each
retained in-point, and the last 3 seconds — and **say they were judged, not
measured** (CLAUDE.md §1 Honesty).

---

## Where the detail lives

Everything above is in force by default. These are the appendices — open one
when the job needs it, not to find out what the rules are:

| file | what it adds |
|---|---|
| `formats/*.md` | the 16 format presets — the more specific rule wins |
| `LESSONS.md` | 49 defects and their causes. **Read before a rebuild.** |
| `LOOK-AND-SOUND.md` | the grade/caption/sound measurement working |
| `EDITING-DOCTRINE.md` | provenance: his standard verbatim, as given |
| `formats/two-camera-kindness.md` | the full 52-shot breakdown of his cut |
| `APPROVED-JAMAICA-V14.md` | the first cut he approved |
| `COMPILATION-ORDER.md` | who appears, in what order |
| `ROUTING.md`, `DELIVERY.md` | format classification, Frame.io upload |
| `REPOS.md` | every GitHub repo Tal has handed over: installed or not, what it can and cannot do, measured |
| `TAL-EDITING-BIBLE.md`, `CLAUDE.md` §1/§7 | non-negotiables, machine truths |

On a **creative** call this file wins over any of them and over every generic
skill. On a purely **technical** call (a codec, an API signature) the technical
source wins.

---

**ONE DOOR, MANY TOOLS.** Tal, 2026-09-22: *"i dont want so many skills, i
just want... when i ask u to edit my videos"*, and 2026-09-24: *"whatever you
need to be doing to edit the video to make it the best video editor, you should
use."*

Both are true at once, and the distinction is the whole point:

> **He never picks a tool, and neither does a trigger. This file picks, by
> sub-problem, and opens the file on purpose.**

The 49 editing tools live in `skills/toolbox/` — read by path, never loaded as
skills. That demotion is deliberate: dozens declare *"use this skill EVERY time
the user wants to create a video"*, and when several match one request the wrong
one can win silently, losing the framing, the grade and the caption rules with
nothing erroring. **Pruned 2026-09-27 from 140 to 49** - every cut, and why, is in `toolbox/PRUNED.md`.

**USING THEM IS A STEP, NOT AN OPTION.** Before cutting, open the rows below
that the job actually touches. "I have a toolbox" is not the same as reading it.

| sub-problem | open | watch out |
|---|---|---|
| where a cut may fall; dead air out, laughs kept | `toolbox/cut-video/`, `toolbox/cut-silences/`, `toolbox/cut-mistakes/` | `cut-video`'s own docs record **1-6s MFA drift on retake-heavy footage** — this footage is nothing but retakes. Ground-truth every boundary against real audio. |
| caption craft and every pitfall already paid for | `toolbox/04-captions-and-typography/`, `toolbox/embedded-captions/`, `toolbox/remotion-captions/` | house style is set HERE (white, 1-3 words, lower-middle). They inform timing, never look. |
| proving captions match the speech | `toolbox/caption-qc/`, `toolbox/multilingual-dialogue-qc/` | the pre-delivery gate. Cue lists must be build-emitted, never hand-typed. |
| two cameras / coverage / continuity | `toolbox/02-multicam-and-coverage/` | pairs with `formats/two-camera-kindness.md`, which outranks it |
| story shape, hook, payoff, ordering | `toolbox/06-story-structure/`, `toolbox/director/`, `toolbox/video-storytelling/` | the closest thing to the real gap (below) |
| audio levels, ducking, cleanup | `toolbox/03-audio-post/` | the do-not-over-denoise line is absolute |
| b-roll on the WORD it illustrates | `toolbox/find-broll/` | it does not choose the moment |
| following a subject who WALKS | `toolbox/clipify/` | take the tracker, not its moment-picking |
| zoom / punch-in emphasis | `toolbox/add-zooms/` | `zoompan` retimes by FRAME COUNT (LESSONS 21). `build-edit.mjs` already owns zoom — **never both on one file** |
| a raw ffmpeg filter or encode question | `toolbox/ffmpeg-skill/` | 42 typed scripts; call with `python`, not `python3` |
| reading a reference into a recipe | `toolbox/07-cinematic-reference/`, `toolbox/08-creator-formats/`, `toolbox/tal-reference-library/` | technique only, never assets (CLAUDE.md 1 Rights) |
| long source -> short | `toolbox/01-longform-to-short/`, `toolbox/youtube-clipper/` | |
| a second opinion on a finished render | `toolbox/vertical-video-editing/` | **steal its quality check, never its pipeline** |
| motion / titles, when a film actually needs them | `toolbox/05-motion-graphics/`, `toolbox/motion-doctrine/`, `toolbox/style-library/` | taste only; they do not know this footage |
| hook or caption copy | `toolbox/tal-scriptwriting/` | |
| an INDEPENDENT check on caption timing | `caption-crosscheck.mjs` (AutoSubSync/ffsubsync) | a PASS is real evidence; anything else means **not checked**. It refuses on a montage and loses lock on sparse street speech - `REPOS.md` has the measurements |
| a launch video about a PROJECT or a URL | `/brag-slim` (installed skill) | reads a codebase, **not footage**. Never point it at a shoot |

**None of this closes the real gap.** Every failure Tal has flagged was a
**selection** failure — the wrong moment chosen, a wheelbarrow captioned "FOR
YOU", a caption drawn after the sentence ended — not a rendering one. These
tools place and polish a shot already chosen. **Choosing is this file's job**,
done by reading the transcripts and looking at real frames.

## STEP -1 — IF THE FOOTAGE IS ON FRAME.IO

When Tal names a Frame.io location — *"go to Social Accords → Assets → Shot in
Israel → What Makes You Happy and edit the best video"* — the source is
Frame.io, not a local folder.

```bash
node system/scripts/frameio.mjs discover "Assets/Shot in Israel/What Makes You Happy"
```

**Discovery downloads NO originals.** It pulls metadata, Frame.io's own
auto-transcripts, comments and durations, and caches them. Read the transcripts
to find the strongest answers, characters, hooks and emotional moments. Pull
**proxies** (`proxy <fileId>`) to look at the candidates visually.

**Only then** `pull <fileId>` the originals — for the handful of clips actually
going in the cut. A shoot is hundreds of GB; discovery must never trigger that.

**Source footage is read-only.** Never delete, rename, move, overwrite or modify
anything in a source folder. The CLI has no such command — keep it that way.

Frame.io transcripts are fine for **discovery**. But if a selected clip is
Hebrew, Arabic or mixed-language, still run `multilingual-dialogue-qc` before
final captions — Frame.io's transcript is not a substitute for the original /
translation / speaker / uncertainty record.

**Delivery:** after Tal approves, `node system/scripts/frameio.mjs deliver <final.mp4>`
uploads to **Assets → Shot in Israel → Final Videos → Edited by Claude** — the
only approved destination. **Never upload V1/V2/review renders.** Those stay in
chat. No trial variations unless he asks.

---

## STEP 0 — CLASSIFY before loading anything

Answer three questions first. Do not load a single specialist skill until you have.

**1. Which format?** Match against `formats/`:

| Signal in the footage or the ask | Format |
|---|---|
| **Travelling with no money**: hitchhiking, asking strangers for a ride / a meal / a bed, the trip itself is the story (PROVISIONAL, 2026-09-28) | `no-money-travel` |
| Meta Ray-Ban POV, handheld, first-person | `pov-meta-glasses` |
| Walking up to strangers, greetings, giving something | `pov-kindness` |
| One person, real substance, a payoff | `human-story` |
| Script/VO explaining something, facts, numbers | `nas-explainer` |
| **Tal's own voice over B-roll**: his life story, a mission, a cause, "here's my voice, do the B-roll" | `voiceover-broll` |
| One person to camera, no script | `talking-head` |
| Asking strangers a question, many answers | `street-interview` |
| An organisation, a cause, a mission | `nonprofit-story` |
| A product, a company, technology | `startup-tech` |
| Music-led, feeling over information | `emotional-montage` |
| Talking-head + machine-gun cutaways + kinetic type | `social-accords` |
| 3+ minutes, YouTube | `longform` |
| One long source → several verticals | `longform-to-shorts` |
| A motion-graphic reference to rebuild — same timing, new look | `motion-recreation` |

**State the format and keep going. Do not wait for approval.**

```
FORMAT: POV Kindness — confidence HIGH
```

Then edit. **Only stop and ask when** you are genuinely torn between two formats
whose difference would materially change the video (e.g. `talking-head` at
moderate pace vs `social-accords` at ~41 cuts/min — that choice has produced a
rejected edit before). Otherwise just make the video. Tal wants minimal
babysitting.

**2. Which approved references are closest?** Check
`golden-references/INDEX.md`, take the **2–5 nearest** by format → subject →
emotional register.

**Golden references are FORMAT-AWARE.** A lesson from an approved video is
**strong inside the format it came from and weak outside it.** Never apply a
POV-kindness rule to a Nas-style explainer just because it came from an approved
video. Two approved videos do not define all of Tal's content.

If the library has nothing for this format, **say so plainly** rather than
stretching a reference from a different format to cover it.

**3. How complex?** This sets what loads in Step 1.

---

## STEP 1 — LOAD the minimum

**Always:** `TAL-EDITING-BIBLE.md` + the matched preset + the retrieved references.

**Then only what the job needs:**

| Job | Also load |
|---|---|
| talking-head / street interview | `skills/04-captions-and-typography`, `skills/03-audio-post` |
| human story | `skills/06-story-structure`, `04`, `03` |
| montage / compilation | `skills/06-story-structure`, `skills/08-creator-formats`, `03` |
| nas-explainer / social-accords | `skills/08-creator-formats`, `skills/05-motion-graphics`, `06` |
| animated explainer | `05`, `06`, `remotion-*`, `hyperframes-*` |
| longform → shorts | `skills/01-longform-to-short`, `06` |

**Never load for an editing job:** any `gsd-*` skill (software planning),
`zernio-*` (no account), `extracting-transcripts` (no API key), `slideshow`,
`figma`, `pr-to-video`, `changelog-video`, `product-launch-video`,
`faceless-explainer`. See `references/loading-policy.md`.

---

## STEP 2 — EXECUTE: one preferred tool per job

Use the preferred tool. Reach for the fallback **only when the preferred one
fails**, and say that it failed.

| Job | Preferred | Fallback |
|---|---|---|
| ingest / probe | `scripts/index-footage.mjs` | `ffprobe` direct |
| transcription | whisper.cpp `ggml-medium` | WhisperX |
| word-level timing | WhisperX forced alignment | whisper.cpp `-sow -ml 1` |
| visual analysis | CLIP + PySceneDetect (`npm run index`) | frame sampling |
| denoise | `bin/deep-filter.exe -D -a 10` | `ffmpeg afftdn` |
| story + moment + cut | `story-editor` agent | — |
| captions | `proj-recaption` → caption pipeline | `embedded-captions` |
| motion graphics | Remotion | HyperFrames |
| render | Remotion `--crf 24` | ffmpeg libx264 |
| loudness | `loudnorm` → **−14 LUFS** | — |
| caption verification | `tools/verify-captions.py` | — |
| delivery QA | `tools/qa-check.py` | — |

**Split creative from technical.** Claude decides story, moments, hook, shot
choice, pacing, B-roll and music direction. **Scripts measure** word timestamps,
cut points, loudness, dimensions, silence, frame boundaries and export validity.
**Never use judgement where a script can measure exactly.**

---

## STEP 3 — VERIFY before showing Tal anything

- `tools/verify-captions.py <file> --cues <build-emitted cues.json>`
  **Its PASS proves timing only.** On fast cuts (<8s per clip-run) it silently
  skips the text check. Read the findings, not the headline.
- `tools/qa-check.py <file>` — black/frozen frames, loudness, A/V sync
- Pull real stills and **look at them**. Never call a render good because it
  compiled.
- **Check what the title and captions are actually covering.** The measured
  positions are **defaults, not coordinates**. Style consistency outranks
  identical pixel values — see "Layout" below.
- Compare against the retrieved references: runtime, cuts/min, hook length,
  caption density. Flag anything unusual — *"your approved human stories
  introduce the person within 2s; this waits 7s."*

**Confidence labels.** State these, don't bury them:
`VERIFIED` (measured) · `HIGH` · `MEDIUM` · `LOW`.
Anything MEDIUM or below gets checked again before delivery, not assumed.
A translated caption is always *"timing verified, wording unverified."*

---

## LAYOUT — defaults, not coordinates

The measured positions are **where to start, not where to stay.**

Keep the visual language: **title toward the top, captions in the lower-middle,
short caption groups, one highlighted word where appropriate.** That is what
makes it look like Tal's.

**But the footage wins.** If the default position would cover a face, eyes, a
sign, or the object being talked about, **move it** — and keep it moved for that
shot only. A caption sitting over someone's mouth is worse than a caption 6%
higher than usual.

**Always stay inside the Reels/TikTok/Shorts safe zones.** Platform UI eats
roughly the bottom ~250px and the top ~130px of a 1920-tall frame. A title
pushed too high or a caption pushed too low disappears behind it.

`style consistency > identical pixel coordinates`

---

## STEP 4 — DELIVER

### The chat is the review workspace

```
RAW FOOTAGE → EDIT → LOW-RES REVIEW IN CHAT → NOTES
           → LOW-RES REVIEW IN CHAT → ... → APPROVED
           → FULL-QUALITY FINAL → Videos Edited by AI/Finals/
```

**Every review version is shown in this chat, not filed in a folder.**

- Render low-res (`--scale 0.5`, or a compact re-encode under ~25MB) into the
  project's own `projects/<slug>/preview/` — **a temp location, not a
  deliverable**
- Send it into the chat with the short summary below
- Revise on his notes, render again, show again
- **Do not accumulate V1/V2/V3 in `Videos Edited by AI/`.** Review renders are
  working files. Overwrite or discard them freely

### Only what he approved gets filed

On *"approved" / "final" / "this is good" / "use this one" / "ship it"*:

1. Render the **full-quality** final
2. Run final QA — `verify-captions.py`, `qa-check.py`, loudness to −14 LUFS
3. Save to **`Videos Edited by AI/Finals/<Title> FINAL.mp4`**. Never overwrite
   an existing final
4. `node system/scripts/video-manifest.mjs`
5. **Preserve the project metadata** — `projects/<slug>/` keeps `project.json`,
   `AI_DRAFT.json`, revisions, the edit-JSON and the build-emitted cues, so the
   edit can still be revised later. The review MP4s are disposable; **the edit
   data is not**

### The folders

```
Finals/     approved, full-quality, QA'd. The main library
Trials/     intentional ALTERNATES kept on purpose (Hook A vs Hook B). 1–2 max
New Edits/  only when there is a real technical reason to preserve a render
Posted/     confirmed posted. Never guess this
Archive/    the 120 legacy videos. Do not re-edit
```

**`Trials/` is not the revision cycle.** V1 → V2 → V3 is normal review and lives
in chat. `Trials/` is for two genuinely different creative versions Tal asked to
keep side by side. It has nothing to do with Instagram trial reels.

**The permanent library should contain what he approved or asked to keep —
nothing else.**

Naming: `<Title> FINAL.mp4` → `No Limits - Matthew FINAL.mp4`.
Alternates: `<Title> - Hook A.mp4`.

Then update the manifest: `node system/scripts/video-manifest.mjs`

### Sending a review version — one line, then the video

```
No Limits — Matthew | Human Story | 1:14 | Review V1
```

**That is the whole message.** Send the video. Say nothing else.

**Do not explain or defend the edit before he has watched it.** No rationale, no
beat-by-beat, no list of what you tried. He watches first, then asks. Anything
you want to justify can wait until he has an opinion of his own.

The only exception: a caveat he **must** know before watching — a constraint you
could not satisfy, a translation nobody has verified, a shot you had to use
despite a flaw. One line, after the video, not before.

Usually one strong edit is what he wants. If testing hooks, make **1–2
meaningful variations, never ten tiny ones.**

---

## STEP 5 — LEARN from the approval

This is the main learning loop, and the richest signal in the whole system: the
**delta between the V1 you made and the final Tal approved.**

Capture what changed and why:

title was too low · hook was 4s too long · wrong B-roll choice · reaction needed
another second · captions too large · music too dramatic · he preferred natural
audio · he rejected a rewritten sentence · he removed motion graphics

### Two tiers of approval — do not confuse them

| | What it means | What you do |
|---|---|---|
| **APPROVED FOR POSTING** | "approved", "good", "ship it" — it is good enough to post | Render the final. **Do not treat every detail as ideal.** Learn only from what he explicitly corrected |
| **GOLDEN REFERENCE** | "perfect" · "this is exactly it" · "I really like this edit" · "use this style going forward" | Add to `golden-references/` with a real measured analysis, tagged with its format |

Most approvals are the first kind. **Only the second kind defines style.**

### Where a lesson goes

**To the FORMAT file, not the bible, unless it is genuinely universal.**

- A POV correction updates `formats/pov-meta-glasses.md` or `pov-kindness.md`
- A human-story correction updates `formats/human-story.md`
- Only a rule that holds across *every* format belongs in `TAL-EDITING-BIBLE.md`

Then classify the scope:

- **Video-specific** ("cut this clip") → the project's `NOTES.md`, do not generalise
- **Reusable** → check the existing rule first. Agrees → strengthen it, add the
  example. Refines → narrow the old rule's scope, keep both. **Contradicts →
  surface it and ask which wins.** Never silently stack contradictory rules.

**A contradiction usually means a missing format distinction**, not a changed
preference.

### THE BENCHMARK — corrections before approval

**This is the real measure of whether the system is learning.** Not vibes, not
how good a single edit felt.

Count the **meaningful corrections** Tal makes before he approves — a note that
changes the edit. "Make the hook shorter", "wrong B-roll", "title's too low"
each count as one. "Looks good" does not. Typos and repeats of the same note do
not.

Record on every approved final:

```json
"review_rounds": 3,
"corrections_to_approval": 8,
"corrections": ["hook 4s too long", "title too low", "cut the drone shot", ...]
```

`node system/scripts/video-manifest.mjs` carries these fields.

**The trend is the signal.** Video 1 at 14 corrections, video 5 at 6, video 15
at 2 means it is working. A flat or rising count means the lessons are being
written to the wrong place — most often a format-specific lesson filed as a
global rule, where it is too vague to fire, or a global truth filed under one
format, where it never gets loaded again.

**Review the trend every ~5 videos.** Report the number honestly even when it
goes the wrong way.

### Provisional formats

`nonprofit-story`, `startup-tech`, `longform`, `longform-to-shorts`, `no-money-travel` are marked
**PROVISIONAL** — nothing in them was measured from an approved Tal video. On
the first real edit in one of those formats, **replace the guessed rules with
what he actually corrects.** Never present guessed style knowledge as though he
taught it to you.

---

## DELIVERY — chat first, Frame.io only after he says yes

Tal, 2026-09-24, after having every uploaded cut deleted: *"for the Frame.io,
we should start it locally in the chat, and then move there."*

1. Render locally.
2. Show a **low-res preview in chat**.
3. **He approves.**
4. Only then `node system/scripts/auto-deliver.mjs <slug>`.

Uploading a review version is a defect, not a convenience. `EDITED BY CLAUDE`
on Frame.io is empty as of 2026-09-24 and stays that way until something earns
a place in it.

**Re-rendering something already delivered? Bump the version first.**
`build-edit.mjs` writes to `cfg.out` and will overwrite it in place.

## NEVER

- Ask Tal which skill to use. Decide here.
- Post anything. Publishing is `content-engine` + an explicit yes from him, and
  the ShortSync key is currently missing.
- Re-edit or bulk-analyse the 120 archived videos. Archive means archive.
- Install a new repo or skill to solve a problem the current system can handle.
  If proposing one, state: PROBLEM / CURRENT METHOD / NEW TOOL / WHY BETTER /
  DOWNSIDE / DO WE ACTUALLY NEED IT.
