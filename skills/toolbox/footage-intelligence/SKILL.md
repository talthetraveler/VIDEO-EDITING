---
name: footage-intelligence
description: Turn a raw footage/image drop into one authoritative intelligence document — every clip identified by WHO (faces→names), WHAT (Claude-vision scene/action/b-roll rating), and SAID (energy-gated diarized transcript). Deep per-clip analysis fans out one agent per clip in parallel, then junks all the data into a single reference doc (drop link + by-person + by-type + quotable + per-clip table) that any content builder reads instead of guessing. Your project-generic — parameterized by entity + drop; honesty rule: a person with zero own-clips is reported, never faked.
---

# Skill: Footage Intelligence — know WHO, WHAT, and what's SAID in every clip

Be **methodical** about raw footage + images before building anything. A content builder must
pick **the right person's actual b-roll** (real Speaker A, not a clip that merely *illustrates* the
words), the right *scene* for the line, and can mine *spoken* moments for hooks/testimonials. If a
person has NO b-roll, that's a KNOWN FACT to surface — not a guess to paper over.

This skill produces **one document per drop** — `FOOTAGE-INTELLIGENCE-<drop>.md` — that any format
(spotlight-reel, carousel, montage, future formats) queries. It is the foundation of the autonomous
ingest engine: **one footage drop in → a fully-identified, searchable library out.**

## Your project-generic
Nothing here is a client-specific. Parameterize per run:
- `ENTITY` — which scope owns the drop (project / client / tenant). The output doc lands in that
  entity's `asset-audit/` (e.g. `data/projects/<slug>/asset-audit/`).
- `DROP` — a label for this batch (e.g. `may15`) + the source (Google Drive link **or** cache path).
- `PEOPLE` — the known roster + their reference anchors (interview clips where identity is certain).
  No roster yet? Run faceless: skip Phase 1, vision+speech still produce a full catalog by scene.
a client is the **first** consumer; the same workflow ingests any client's footage.

## The pipeline (run via the workflow, see "Orchestration")

**Phase 0 — Ingest.** Bulk-pull the drop (rclone) into the cache (OUTSIDE git, multi-GB):
`your project<entity>-footage/<drop>/`. Keep raw filenames. Note the Drive link for the doc header.

**Phase 1 — Reference faces (once per drop, deterministic).**
`scripts/catalog_faces.py <footage_dir> <out.json>` — InsightFace `buffalo_l` embeddings.
Learns a NAMED reference per person from the interviews (where identity is known — edit `INTERVIEWS`),
clusters cross-interview to find the recurring interviewer, then **matches every clip** → `faces-catalog.json`
`{clip:{people, scores, face_instances, is_interview}}`. Presence floor `MATCH_T=0.40`
(same-person ≈0.5–0.8, different ≈<0.3, so 0.40 is safe).

**Phase 2 — Prep evidence (deterministic batch, no LLM).**
`scripts/prep_drop.py <footage_dir> <work_dir>` — for every clip writes:
- `<clip>.sheet.jpg` — 6-frame **contact sheet** (timestamped 3×2 tile) for Claude vision (`sample_frames.py`).
- `<clip>.speech.json` — **energy-gated** diarized transcript (`clip_speech.py`): measures mean dB,
  skips ambient/silent clips below the floor (no wasted AAI call), else AssemblyAI universal-3-pro
  with `speaker_labels` → speaker count + utterances.
- `manifest.json` — one task record per clip {path, sheet, speech_json, dur, w/h, orientation,
  faces[], face_scores, is_interview} the workflow iterates.

**Phase 3 — Deep per-clip analysis (the fan-out — one agent per clip, Claude vision).**
Each agent READS that clip's contact sheet (real Claude vision, not Gemma) + its speech JSON + its
face tags, and returns one structured record:
```json
{ "clip":"IMG_3842", "people":["Speaker A"], "scene":"1-on-1 cone drill, golden hour, turf",
  "action":"dribbling through cones, change of pace", "setting":"outdoor turf field",
  "is_broll":true, "broll_quality":8, "broll_tags":["ball-control","footwork","training"],
  "subject_isolation":"clean — only Speaker A in frame", "orientation":"landscape",
  "has_speech":true, "speakers":2, "quotable":[{"speaker":"A","text":"...","t":[12.3,15.0]}],
  "notes":"safe subject b-roll; reframe-friendly, subject centered" }
```
Vision judges: scene, action, setting, b-roll usability (0–10), isolation (is the named person ALONE
or with others?), reframe-friendliness. Speech is folded in from the JSON (the agent picks the quotable
lines). Face tags come from the catalog (agent may note "vision disagrees" if the sheet contradicts).

**Phase 4 — Junk it together → ONE doc.** `scripts/assemble_doc.py <work_dir> <records.json> <out.md>`
writes `FOOTAGE-INTELLIGENCE-<drop>.md` into the entity's `asset-audit/`:
- **Header** — drop label, Google Drive link / cache path, clip + image counts, date.
- **By person** — "Speaker A: 12 clips (4 solo b-roll, 1 interview) → IMG_3816 (juggling, 8/10), …"
- **By type** — drills · scrimmage · interviews · candid · golden-hour.
- **Quotable** — every transcribed line (speaker + clip + timestamp): raw material for hooks/testimonials.
- **Per-clip table** — the full records.
- **Gaps** — people with zero own-clips, low-quality-only b-roll, unidentified faces — stated plainly.

## Orchestration (workflow)
`scripts/footage-intelligence.workflow.js` runs Phase 3 as a deterministic fan-out (one agent per clip,
capped concurrency), then Phase 4. Phases 1–2 run first as a deterministic prep (Bash). The workflow is
opt-in (many agents, real tokens) — launch it explicitly. For a quick pass, run prep only and read the
manifest. The spotlight-reel / montage / carousel builders then read the **one doc**, not the raw drop.

## How a builder uses it
Querying "Speaker A b-roll" → the doc's by-person index → real Speaker A clips, preferring scenes that match
the words. If NONE exist → the doc's Gaps section says so; fall back to scene-relevant generic training
b-roll AND flag it ("no Speaker A-specific b-roll in this drop — used generic ball-work"). **Never silently
pass off another person as the subject.**

## Extending
- **New drop / new people**: re-run Phase 1 with new interview anchors; references persist for repeat people.
- **Images**: same embedding + vision path on stills (cv2 reads images directly) — tag photos by person.
- **Scene taxonomy**: the vision agent emits free-text scene + tags; tighten the tag vocabulary per entity.
- **Verify**: spot-check top matches per person with a face contact sheet before trusting at scale.

## Output contract
`data/<entity-scope>/asset-audit/FOOTAGE-INTELLIGENCE-<drop>.md` (committed, shareable) +
`faces-catalog.json` and `manifest.json` in the cache work dir (large, out of git).
**Honesty rule: a person with zero own-clips is reported, not faked.**
