# SYSTEM AUDIT — restructuring the editor around Tal's content

Audited 2026-09-20 against the actual disk, not against docs. Nothing was
installed, deleted, or changed to produce this. Three findings below change
the plan Tal wrote, so they come first.

---

## HEADLINE FINDINGS

### A. Six of the seven custom craft skills are empty scaffolding

Tal's instruction #3 — "my custom knowledge ALWAYS beats generic advice" — is
the right principle, but the knowledge it points at barely exists yet.

| Skill | SKILL.md | examples | neg-examples | reference-analysis | templates |
|---|---|---|---|---|---|
| `01-longform-to-short` | 420w | 1 | 1 | 1 | 9 real files |
| `02-multicam-and-coverage` | 416w | `.gitkeep` | `.gitkeep` | `.gitkeep` | `.gitkeep` |
| `03-audio-post` | 447w | `.gitkeep` | `.gitkeep` | `.gitkeep` | `.gitkeep` |
| `04-captions-and-typography` | 978w | `.gitkeep` | `.gitkeep` | `.gitkeep` | `.gitkeep` |
| `05-motion-graphics` | 382w | `.gitkeep` | `.gitkeep` | `.gitkeep` | `.gitkeep` |
| `06-story-structure` | 825w | `.gitkeep` | `.gitkeep` | `.gitkeep` | `.gitkeep` |
| `07-cinematic-reference` | 789w | `.gitkeep` | `.gitkeep` | `.gitkeep` | `.gitkeep` |
| `08-creator-formats` | 2058w | `.gitkeep` | `.gitkeep` | 3 real analyses | 1 real |

`07-cinematic-reference` — the skill whose entire job is holding reference
analyses — contains zero reference analyses.

**Consequence:** telling me "your skills beat generic skills" today mostly
means "prefer 400 words of your principles over 2000 words of someone else's
specifics." The principles are correct, but they lose on detail. The fix is
not a rule change, it is filling these files.

### B. The media library and the learning loop were destroyed, not just `projects/`

`public/` does not exist. That took with it:

- `system/public/footage/<shoot>/library.db` — the SQLite moment library: clips,
  words, speech, frames, interactions, moments, reactions, edits.
- `system/public/footage/<shoot>/frames/` — every cached keyframe and CLIP embedding.
- `projects/_profile.json` — the style-learning loop from `proj-confirm`.

So instruction #10 (visual understanding) and #6 (learn from corrections) are
not new features. **They existed and were deleted.** The code that builds them
survives (`scripts/index-footage.mjs`, `group-interactions.mjs`,
`extract-moments.mjs`, `extract-reactions.mjs`, `proj-confirm.mjs`), so this is
a re-run, not a rebuild — but it is hours of compute on 437 + 328 clips.

### C. The raw material for the Golden Reference Library and the eval suite both survive

This is the good news, and it is substantial.

- **All raw footage survives**: `ALL VIDS ISRAEL` (437), `VIDEOS OF META` (328),
  `ABRAHM` (22), `table asking a. Question` (18), `TO UPLOAD` (12),
  `feed homeless` (9), `CANCER` (6), `taiwan 1111` (5).
- **120 finished videos survive** in `Videos Edited by AI/Final Variations/`,
  with `_manifest.txt` mapping each back to its old project path — so each
  finished cut can be traced to the shoot it came from.

Raw input *and* known-good output both exist for the same shoots. That is
exactly what instruction #16 needs.

**The blocker:** the approval records lived in `projects/*/review/review-manifest.json`,
which is gone. **I do not know which of the 120 Tal actually liked.** Without
that, a "golden" reference library is just 120 files. This is the one thing
only he can supply.

---

## 1. CURRENT ARCHITECTURE

```
CLAUDE.md (master orchestrator, 537 lines)
├── §5c routing table ......... maps request → skill
├── §7 known truths ........... 30+ hard-won environment/footage facts
│
├── .claude/skills/ (42) ...... hyperframes(9) remotion(12) motion-craft(5)
│                               ai-editor caption-qc content-engine video-editor …
├── ~/.claude/skills/ (97) .... ~70 gsd-* (software planning, not video)
│                               + ~27 real, several duplicating the above
├── skills/01-08 + auto-video-editor ... Tal's craft base (see Finding A)
├── .claude/agents/ (10) ...... manager media-ingest transcriber audio-engineer
│                               reference-analyzer moment-finder rough-cut-editor
│                               caption-editor caption-qc quality-control
│
├── scripts/ (60) ............. proj-* loop, index/group/moments, publish,
│                               dub, hooks, schedule-trials, review-server
├── tools/ (4) ................ qa-check.py whisperx-align.py
│                               verify-captions.py review-video.py(parked)
├── vendor/ ................... video-use (browser-use) OpenChatCut (0xsline)
├── bin/ ...................... deep-filter.exe yt-dlp.exe
└── memory/ (28 files) ........ auto-loaded index + one fact per file

DESTROYED: public/ (library.db, frames) · projects/ (_profile.json,
           music, ShortSync key, all review-manifests)
```

**Total loadable skills: 139.** Genuinely useful for Tal's editing: ~25.

---

## 2. WHAT IS EXCELLENT ALREADY

Keep these untouched; they are the system's real value.

1. **`CLAUDE.md` §7 — known truths.** 30+ facts that each cost a failed render
   to learn (yuvj420p, Remotion scale integers, whisper BPE sub-words, the
   `%TEMP%` disk bomb, CLIP z-scores). This is irreplaceable and correct.
2. **The caption verification stack.** `tools/verify-captions.py` +
   `.claude/agents/caption-qc.md` (993w — the largest and best agent) +
   `whisperx-caption-pipeline-lessons`. It has caught real shipped defects.
   The 8-second blind spot on fast cuts is now documented in §8 of the
   ffmpeg pipeline doc.
3. **`ffmpeg-audio-caption-pipeline.md`** (283 lines). Genuinely portable,
   hard-won, specific. DeepFilterNet `-a 10`, the drawtext colon trap, the
   denoise-the-exact-segment rule.
4. **The `proj-*` loop** (`proj-new/render/op/confirm`). Typed ops, revision
   snapshots, `AI_DRAFT.json` never overwritten. The architecture is right —
   it just lost its learned profile.
5. **The 28 memory files.** Well-formed, one fact each, cross-linked, honest
   about confidence.
6. **`08-creator-formats`** — the one craft skill with measured reference
   analysis (Nas Daily: 157s, 22 cuts/min, 132wpm; Montana: one unbroken shot).
   This is the template every other craft skill should follow.

---

## 3. WHAT IS REDUNDANT

| Redundant | Superseded by | Why |
|---|---|---|
| `script-writer` (global) | `tal-scriptwriting` | Generic; his knows Tal's voice |
| `video-editor-silence-cut` | `scripts/tighten.mjs` | Ours knows his footage |
| `static-visual-creator` | `05-motion-graphics` + Remotion | Generic stills |
| `motion-graphics-animator` | `05-motion-graphics` + Remotion | Screen-record workflow we don't need |
| `footage-intelligence` | `npm run index` | Ours caches to `library.db` and is resumable; theirs re-reads every clip every run (violates CLAUDE.md §1 Cost) |
| `general-video` (both copies) | `video-editor` | Generic fallback |
| `embedded-captions` (2 copies) | — | Installed at project *and* global scope |
| `hyperframes-*` (9, duplicated) | — | Installed at both scopes |
| `media-use`, `music-to-video`, `product-launch-video`, `talking-head-recut`, `pr-to-video` | — | Duplicated across both scopes |
| `tools/review-video.py` | `qa-check.py` | Gemini reviewer, requested then cancelled. Parked, unused |
| `vendor/OpenChatCut` | — | Vendored, never wired in. Decide: use or archive |

Roughly **15 skills are installed twice** (project + global scope).

---

## 4. WHAT IS MISSING

Ranked by impact on edit quality.

1. **A golden reference library.** Three reference analyses exist, all of
   *other* creators (Nas, Montana, mdmotivator). **Zero analyses of Tal's own
   approved videos.** This is the biggest gap and the biggest opportunity.
2. **Visual search.** No `library.db`, so no way to answer "find the strongest
   shot of X" or "find a usable reaction." Every edit currently re-reads
   footage from scratch.
3. **A format-preset layer.** `08-creator-formats` holds two (Nas, Montana).
   Tal listed twelve.
4. **A single router.** §5c is a good table but it is prose in a 537-line file,
   not an executable entry point.
5. **The feedback loop.** `proj-confirm` diffs draft vs approved — but
   `_profile.json`, where it wrote what it learned, is gone.
6. **An eval benchmark.** Nothing measures whether a change made edits better.
7. **Confidence scoring.** Done ad-hoc in prose ("timing verified, wording
   unverified"), never structured.
8. **Reference-vs-output comparison.** No tooling compares a finished cut's
   pacing against approved references.

---

## 5–7. SKILL CLASSIFICATION

### CORE — the router may load these (target: ~12)

| Skill | Job | Trigger |
|---|---|---|
| `tal-video-editor` *(to build)* | Master router | Any edit request |
| `skills/01-08` | Tal's craft knowledge | Router loads the relevant 1–2 |
| `video-editor` | Operating skill, format routing | Craft questions mid-edit |
| `ai-editor` | The `proj-*` draft→review→learn loop | Raw clips handed over |
| `caption-qc` | Proves captions match speech | Before every delivery |
| `content-engine` | Post / recut / dub / analytics | "post this", "what's working" |
| `ffmpeg-skill` | 42 typed ffmpeg scripts | Encode/filter execution |
| `tal-scriptwriting` | Hooks and copy in his voice | Script/hook/caption copy |

### SPECIALIST — loaded only on explicit trigger

- **HyperFrames build** (10): `hyperframes` + `-core/-animation/-audio/-cli/-creative/-keyframes/-registry/-studio`, `motion-doctrine`, `cut-the-curve`, `seam-craft`, `captions-overlay`, `oversized-cursor`. Only for HTML→video builds.
- **Remotion code** (12): the `remotion-*` family. Only when writing Remotion.
- **Captions onto existing footage**: `embedded-captions`.
- **Conversational single-video edit**: `video-use`.
- **Covers**: `thumbnail-designer` + `gpt-image-prompt`.
- **Carousels**: `carousel-creator`.

### REFERENCE — consult, never auto-load

`CLAUDE.md` §7 · `ffmpeg-audio-caption-pipeline.md` · `video-qa-pipeline.md` ·
`toolbox.md` · `PIPELINE.md` · `EDITING-SYSTEM.md` · `MOTION-PROMPT.md` ·
`EDITOR.md` · `batch-indexing.md`

### REDUNDANT — see §3

### IRRELEVANT — must never enter an editing context

- **~70 `gsd-*` skills** + **33 `gsd-*` agents.** Software project planning.
- **`zernio-publish`, `zernio-comment-to-dm`** — account Tal does not have.
- **`extracting-transcripts`** — AssemblyAI key Tal has not supplied.
- **`slideshow`, `figma`, `pr-to-video`, `changelog-video`,
  `product-launch-video`, `faceless-explainer`** — decks, SaaS promos, code
  explainers. Not his content.

**Result: 139 installed → ~12 core, ~26 specialist, ~9 reference, the rest
walled off.**

---

## 8–9. AGENTS: 10 → 4

The current 10 average 360 words each. The weakest are thin wrappers
(`media-ingest` 232w, `reference-analyzer` 240w, `manager` 265w). Tal named the
real problem himself: **creative intent dies at the handoffs** between
`reference-analyzer` → `moment-finder` → `rough-cut-editor`.

That chain is three agents, three context boundaries, and the thing being
passed — *why this moment matters* — is exactly what a structured handoff
flattens. Merging it is the single highest-value agent change.

| New agent | Absorbs | Why the merge is right |
|---|---|---|
| **`footage-analyst`** | `media-ingest` + `transcriber` + *(new)* visual analysis | One pass over footage → one artifact (probe + transcript + word timings + visual attributes). No reason to split reading a file from describing it. |
| **`story-editor`** | `reference-analyzer` + `moment-finder` + `rough-cut-editor` | **The critical merge.** Reference → moment → cut is one continuous creative judgment. Splitting it forces intent through two lossy serializations. |
| **`finisher`** | `audio-engineer` + `caption-editor` | Both execute against an already-locked cut. Both are technical, both touch the same timeline. |
| **`qa`** | `caption-qc` + `quality-control` | Both verify. `caption-qc` (993w) is the strong one and absorbs `quality-control`'s frame inspection. |

**Retire `manager`** (265w). The router orchestrates; a manager agent adds a
context boundary and removes nothing.

---

## 10. PROPOSED `tal-video-editor` ARCHITECTURE

A router, not a doer. It decides, loads, delegates, and never edits directly.

```
TRIGGER: "edit this" · "make a video" · "cut this" · "make a Reel/Short"
         · "make a trial reel" · "turn this footage into a video"

STEP 0  CLASSIFY  (always, before anything loads)
        ├─ Format?        → match to a preset (§12)
        ├─ Closest approved references? → retrieve top 2–5 (§12)
        └─ Complexity?    → decides what gets loaded below

STEP 1  LOAD  (minimum viable context — this is instruction #18)
        ALWAYS:  TAL-EDITING-BIBLE.md  +  the matched format preset
                 +  the 2–5 retrieved references
        THEN, only if the job needs it:
           talking-head ....... 04-captions  03-audio
           human story ........ 06-story  04-captions  03-audio
           montage ............ 06-story  08-formats  03-audio
           animated explainer . 06-story  05-motion  remotion-*  hyperframes-*
           longform→short ..... 01-longform  06-story

STEP 2  EXECUTE  (one preferred tool per job, fallback only on failure)

        job                 preferred              fallback
        ingest/probe        scripts/index-footage  ffprobe direct
        transcription       whisper.cpp medium     WhisperX
        word timing         WhisperX align         whisper.cpp -sow -ml 1
        visual analysis     CLIP + PySceneDetect   frame sampling
        denoise             deep-filter.exe -a 10  ffmpeg afftdn
        rough cut           story-editor agent     —
        captions            caption pipeline       embedded-captions
        motion graphics     Remotion               HyperFrames
        render              Remotion --crf 24      ffmpeg libx264
        loudness            loudnorm → −14 LUFS    —
        QA                  qa-check + verify-captions  —

STEP 3  VERIFY   qa-check.py · verify-captions.py · reference comparison (§13)
STEP 4  DELIVER  low-res proxy → Tal reviews → notes → final → QA the final
```

**Non-negotiable:** the bible and the retrieved references outrank every
generic skill on creative calls. Generic skills supply technical capability
only. Where they conflict on *creative* grounds, Tal's style wins; where they
conflict on *technical* grounds (a codec, an API), the technical source wins.

---

## 11. PROPOSED FOLDER STRUCTURE

Additive. Nothing existing moves.

```
videos to edit/
├── TAL-EDITING-BIBLE.md          ← canonical definition of a "Tal edit"
├── SYSTEM-AUDIT.md               ← this file
├── skills/tal-video-editor/
│   ├── SKILL.md                  ← the router
│   ├── formats/                  ← 12 presets, one file each
│   │   ├── human-story-nas.md        talking-head-explainer.md
│   │   ├── pov-kindness.md           street-interview.md
│   │   ├── meta-glasses-pov.md       nonprofit-story.md
│   │   ├── startup-tech.md           emotional-montage.md
│   │   ├── social-accords.md         longform-youtube.md
│   │   └── longform-to-shorts.md     trial-reel-variations.md
│   └── references/
│       ├── loading-policy.md     ← what loads when (instruction #18)
│       └── tool-preferences.md   ← preferred + fallback per job
│
├── golden-references/            ← §12
│   ├── INDEX.md                  ← searchable table, all refs
│   ├── <slug>/analysis.md        ← one per approved video
│   ├── <slug>/transcript.json
│   ├── <slug>/metrics.json       ← cuts/min, ASD, caption density…
│   └── <slug>/frames/
│
├── eval/                         ← §14
│   ├── cases/<case>/{brief.md,raw→,known-good.mp4,rubric.md}
│   └── RESULTS.md                ← every run, dated, scored
│
└── skills/01-08/                 ← fill the empty folders (Finding A)
```

---

## 12. PROPOSED GOLDEN REFERENCE SYSTEM

**Source material: the 120 surviving finished videos + all raw footage.**

**Blocked on one input from Tal:** which of the 120 he actually likes. The
approval records were destroyed. Fastest unblock — I generate a contact sheet
(first frame + title + runtime) of all 120, he marks the good ones. An hour of
his time, and it is the foundation everything else sits on.

Per approved reference, stored as `golden-references/<slug>/analysis.md`:

**Measured automatically** (scripts, not judgment — instruction #9):
runtime · shot-change timestamps · cuts per minute · average shot duration ·
pacing curve (cuts/10s bucketed) · talking-head vs B-roll % · caption density
(words/min, cues/min) · silence ratio · music-vs-dialogue LUFS balance ·
hook length (time to first face/first word) · resolution/fps/loudness

**Judged by me, from frames + transcript** (and labelled with confidence):
hook type and why it works · story structure beat-by-beat · emotional arc ·
caption style · music behaviour · B-roll behaviour · camera style · graphics ·
CTA · **what Tal specifically said he liked**

**Retrieval, before any edit:** classify the new footage's format, then pull
the 2–5 nearest approved references by format → subject → emotional register.
Those references, not generic advice, drive hook, pacing and structure.

---

## 13. PROPOSED FEEDBACK / MEMORY SYSTEM

Every correction gets classified at the moment it is given:

```
Tal says something corrective
        │
        ├─ VIDEO-SPECIFIC ("cut this clip", "use that shot")
        │     → apply now, log in the project's NOTES.md, do not generalise
        │
        └─ REUSABLE PREFERENCE ("too slow", "stop changing my script",
                                 "more emotional", "less cinematic")
              → check against existing rules FIRST
                   ├─ agrees      → strengthen, add the example
                   ├─ refines     → narrow the old rule's scope, keep both
                   └─ CONTRADICTS → surface it, ask which wins, never
                                    silently stack contradictory memories
              → write to memory + the relevant craft skill + the bible
```

**The conflict rule matters most.** Memory today is append-only, and Tal's
instruction #6 is explicit: most recent and most specific wins, but the
conflict must be *named*, not buried. Concretely: "cut faster" on a montage
and "give emotional moments room" on a human story are not a contradiction —
they are two format presets. Resolving them into one global rule would make
both worse. Conflicts usually mean a missing format distinction.

`proj-confirm` already diffs AI draft vs Tal's approved cut. Restoring
`_profile.json` gives that loop somewhere to write again.

---

## 14. PROPOSED EVALUATION BENCHMARK

Buildable today: raw input and known-good output both survive for the same
shoots, linked by `_manifest.txt`.

**4–6 cases**, each a shoot where the finished cut is known-good:

| Case | Raw | Tests |
|---|---|---|
| Abraham Accords | `ABRAHM` (22) | Multi-language captions, exclusion constraint, montage pacing |
| Table / call-someone | `table asking a. Question` (18) | Full-story selection, emotional arc, silence handling |
| Meta shoot | `VIDEOS OF META` (328) | Story-vs-compilation classification, interaction grouping |
| Feed homeless | `feed homeless` (9) | POV kindness format |
| Cancer | `CANCER` (6) | Sensitive-subject restraint |

**Scored per case** — automatic where possible:
1. Story found matches the known-good cut's subject (binary)
2. Right speakers preserved (% overlap)
3. Strongest moments retained (% of known-good beats present)
4. Hook quality (judged, with reasoning shown)
5. Caption accuracy (`verify-captions.py`, automatic)
6. Pacing distance from known-good (cuts/min, ASD, runtime — automatic)
7. Constraint compliance (e.g. Abraham's exclusion rule — automatic)

Rule: **run old and new against the same cases, publish both numbers.** A
change that does not move the benchmark does not ship. No vibes.

---

## 15. TOP 5 CHANGES, RANKED BY EDIT QUALITY

**1. Build the Golden Reference Library from the 120 surviving videos.**
Nothing else comes close. It converts editing from "apply remembered
principles" to "match the closest thing Tal already approved." It is the
difference between a good editor and one who has worked with him for six
months. *Blocked only on Tal marking which of the 120 he likes.*

**2. Fill the six empty craft skills — especially `negative-examples/`.**
Finding A. Every one of those folders should hold real cuts from the 120,
with the specific reason each worked or failed. Knowing what he rejected and
why prevents more bad edits than knowing what he likes.

**3. Merge `reference-analyzer` + `moment-finder` + `rough-cut-editor` into
`story-editor`.** Tal identified this himself. Reference → moment → cut is one
creative judgment; three agents means two lossy handoffs of exactly the thing
that matters. Cheapest change on this list, immediate quality effect.

**4. Rebuild the visual index with the attributes from instruction #10.**
`library.db` is gone but the code survives. Re-run it, extended with
shot size, speaking/listening/reacting, camera movement, usability and
B-roll category. Without it, every edit re-reads footage from scratch and
B-roll selection is guesswork. Hours of compute, no new dependencies.

**5. Stand up the eval benchmark before changing anything else.** Otherwise
items 1–4 are unfalsifiable. Build it first, measure the current system,
then measure each change.

---

## WHAT I NEED FROM TAL

1. **Which of the 120 finished videos do you actually like?** Everything in
   §12 depends on it. I can generate a contact sheet of all 120 to make this
   fast.
2. **Re-add the ShortSync API key.** Nothing can be posted or scheduled
   without it, and the posted-vs-unposted split must come from ShortSync's
   own history, not filenames.
3. **`vendor/OpenChatCut` — use it or archive it?** Vendored, never wired in.

## WHAT I HAVE NOT DONE

Nothing was installed, deleted, moved, or rewritten for this audit. The
proposals above are proposals. No skill was uninstalled — walling irrelevant
ones out of editing context is a routing change, not a deletion, exactly as
instructed.
