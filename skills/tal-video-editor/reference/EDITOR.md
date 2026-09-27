# The editor — OpenChatCut as the foundation + this repo as the house layer

Tal wants **`github.com/0xsline/OpenChatCut`** to be the video editor (timeline,
UI/UX, "does everything"), combined with what's already here, with no
contradiction against the skills and code in this repo. This doc is the map.

Cloned to **`vendor/OpenChatCut/`** (v0.2.14, shallow). Not wired in yet.

---

## What OpenChatCut is

An open-source, **agent-native, local-first** video editor: React 19 + Remotion
4.0.509 + Vite + Electron 43. A full professional NLE (`src/editor/`:
reducer/command core, multitrack, keyframes, transitions, snap / slip / ripple,
multicam, markers, LUTs, flex-crop, rate-stretch, silence-rebuild) plus an
agent runtime (`src/agent/`: proposal-based apply, approval policy, MCP bridge,
context management, vision), captions, transcript editing, WebGL shaders,
AI generation, and MP4 / audio / captions / FCPXML / project export.

The agent contract: `begin_edit_session` → edits land on an **isolated draft** →
`review_edit_session` → applied atomically as one undo step. External agents
(Claude Code, Codex) drive the **same** `EditorCore` commands as the built-in
agent, over MCP at `http://localhost:5199/api/external-mcp/mcp`.

---

## Is there a contradiction with this repo?

**Philosophically — no. It is the same design, more complete.**

| This repo already does | OpenChatCut does the same, more maturely |
|---|---|
| `project.json` = editable source, MP4 is only output | `ProjectDoc` = shared media + timelines, versioned for migration |
| LLM never rewrites the file — typed `proj-op.mjs` ops, each snapshots a revision (undo/redo) | Agent never rewrites the file — `EditorCore` commands on an isolated draft, atomic apply, undo/redo/versions |
| `proj-op` → `proj-render` → `proj-confirm` → learn | `begin_edit_session` → draft → `review_edit_session` → applied |
| `live-render.mjs` warm bundle + `<Player>` instant preview | Remotion `<Player>` preview + `remotion/render.mjs` headless export |
| review-server per-track schedule dashboard | its own `src/review/` + timeline UI |
| `safe-area.ts` keep-out for captions | real person-segmentation → captions dodge the face, reframe follows the subject |
| `scripts/tighten.mjs` filler/pause cut | transcript-driven word-level editing + pause compression, in the UI |
| CLAUDE.md sanctioned "the AI-editor timeline (preview + timeline + inspector + chat)" as stage 2 | **this IS that stage 2, already built** |

So adopting it **fulfils** CLAUDE.md's sanctioned editor, it doesn't fight it.

### The real contradictions (2, both manageable)

1. **LICENSE — the one thing to be careful about.** OpenChatCut is
   **`AGPL-3.0-or-later`** (its bundled agent skills are adapted from ChatCut's
   `GPL-3.0-only` plugin). This repo is `UNLICENSED` (private).
   - **Private, local, personal editing on your own machine:** no obligation.
     Use it freely.
   - **If you host it** (Railway, a web app, anything users reach over a
     network) **or ship/distribute a build:** AGPL's network clause means the
     *entire combined work*, including your house layer, must be offered as
     source under AGPL. There is no partial adoption that avoids this once
     OpenChatCut code is incorporated and the thing is served to others.
   - **Safe pattern:** keep this repo's house layer (formats, caption presets,
     positivity gate, ShortSync publish, footage library) as **separate
     OpenChatCut *skills* and *plugins*** loaded at runtime from
     `~/.openchatcut/skills/…` and drive OpenChatCut over **MCP** — you compose
     tools, you don't fork the codebase. Skills/plugins you author are yours;
     the editor stays upstream AGPL and updatable with `git pull`.
   - Decide the deployment intent before merging code. Ask Tal.

2. **Skill namespace overlap.** OpenChatCut ships ~26 generic agent skills
   (`long-video-to-shorts`, `explainer-video`, `talking-head-guide`,
   `beat-sync-montage`, `batch-montage-variants`, `multi-clips-to-reels`,
   `news-rough-cut`, `create-motion-graphics`, `transcription`,
   `music-intelligence`, `storyboard-shot-breakdown`, …). This repo's
   `skills/01-08` + `skills/toolbox/*` cover the same ground **but tuned to
   Tal** (the positivity gate, "Israel beyond headlines", his caption style,
   the NAS / narrated-cut format, his footage-library pipeline).
   - **Resolution:** OpenChatCut's skills = generic *mechanics* (default).
     This repo's = the *house / content* layer that overrides them: content
     rules, the narrated-cut format + evidence-board, caption style,
     publishing, footage library. Register them as OpenChatCut custom skills so
     they load alongside, and they win where they apply. No file collision —
     different directories (`~/.openchatcut/skills/` vs `skills/toolbox/`).

Nothing in CLAUDE.md's **non-negotiables** conflicts: OpenChatCut never touches
`raw/` (it writes to `~/.openchatcut` + IndexedDB), exports are always new
files, denoise / positivity / no-auto-post are house policy that lives in the
skill layer on top.

---

## What to take from OpenChatCut (genuinely new here)

- The **professional timeline**: reducer/command core, keyframes, transitions,
  snap/slip/ripple, multicam, markers, LUTs, flex-crop — years of work, tested
  (`*.verify.ts` everywhere).
- The **MCP bridge** — Claude Code editing the real timeline via
  `begin_edit_session` / `review_edit_session`. This is the "chat edits the
  video" loop, done right, with atomic draft apply.
- **Visual geometry** — in-browser person segmentation: captions auto-avoid the
  speaker, reframe follows the subject, overlays land in empty space. Replaces
  the crude `safe-area.ts`.
- **WebGL shaders / GL transitions**, the **captions module** (word runs,
  motion, pagination, SRT/translation export), **transcript-driven editing**,
  **FCPXML export**.
- Its **skill-creator** + `~/.openchatcut/skills/` convention — the same layout
  as `.claude/skills`, so the house skills port straight over.

## What this repo keeps and contributes as the house layer

- **Creator-format skills** — `skills/08-creator-formats/` (FORMAT A narrated
  cut incl. the V3 recipe, FORMAT B one-take) + `skills/01-07`.
- **Caption style** — `projects/_presets/caption/nas_caption.json`,
  `scripts/lib/emphasis.mjs` (yellow-keyword picker),
  `src/components/ProjectVideo.tsx` `highlight:"keyword"`. Port as an
  OpenChatCut caption preset + a skill.
- **Evidence-board motion graphics** — `src/components/evidence/*`
  (`PaperBackdrop`, `PhotoStack`, `HandScribble`, `HandPie`, …). Port as
  OpenChatCut motion-graphics **templates**.
- **Positivity gate** — `scripts/lib/positivity.mjs`. A skill rule + a
  transcript-edit filter.
- **Publishing** — `scripts/publish.mjs` (ShortSync API, per-track main/trial,
  scheduled) + the per-track review dashboard. A post-export step: OpenChatCut
  exports the MP4 → hand to `publish.mjs`.
- **Footage library / moment pipeline** — `npm run index/group/moments/search`,
  the SQLite `library.db`. Feeds OpenChatCut's media pool.
- **CLAUDE.md** stays the master content orchestrator (who Tal is, the
  non-negotiables, the house style). OpenChatCut is the tool it drives.

---

## Adoption path (staged — nothing is wired yet)

1. **Run it side-by-side.** `cd vendor/OpenChatCut` → `nvm use 24` →
   `npm i` → `npm run dev` (or `npm run desktop:dev`). Open a project, try the
   timeline. No commitment.
2. **Connect Claude Code over MCP.**
   `claude mcp add --transport http openchatcut http://localhost:5199/api/external-mcp/mcp`
   then `npx skills add 0xsline/OpenChatCut`. Now chat can edit its real timeline.
3. **Port the house layer as skills/templates** into `~/.openchatcut/skills/`:
   the narrated-cut format, the caption preset + emphasis picker, the
   evidence-board templates, the positivity rule.
4. **Wire publishing** — an export post-hook → `scripts/publish.mjs`.
5. **Point its media pool** at the footage library.
6. Keep `vendor/OpenChatCut` as an upstream checkout — `git pull` for updates;
   never edit files inside it (all customisation lives in skills/plugins).

## The decision for Tal

**Where will this run?** Local desktop app for you only → adopt OpenChatCut
wholesale, port the house layer as skills, ignore AGPL. **Hosted / shipped to
other people** → the whole thing becomes AGPL open-source; decide that's
acceptable, or keep OpenChatCut as a separate tool you drive over MCP and don't
fork. This choice gates everything else.

---

## Status (2026-09-10) — installed and running

- `cd vendor/OpenChatCut && npm install` — done (808 pkgs). Native scripts
  approved + rebuilt (onnxruntime-node, koffi, protobufjs). `sync:mediapipe`
  (person-seg + face models) and `sync:whisper-cli` (local transcription) done.
- **`npm run dev:isolated` is running** — app at **http://localhost:5199/**
  (`<title>OpenChatCut</title>`, HTTP 200). Isolated dev profile at
  `~/.openchatcut/dev-profiles/`. Chrome Headless Shell downloaded for Remotion
  render. Soft warnings only: `semantic vectors unavailable` (needs an
  embeddings key, optional).
- **House layer ported:** `~/.openchatcut/skills/talthetraveler-house/SKILL.md`
  — non-negotiables (positivity, source integrity, no auto-post, no
  over-denoise), the 97-track music library + low-volume rule, the caption
  style, FORMAT A / B pointers, evidence-board templates, the `publish.mjs`
  hand-off.

### To connect Claude Code to the running editor (Tal runs this once)

```
claude mcp add --transport http openchatcut http://localhost:5199/api/external-mcp/mcp
```

then restart Claude Code. The `.mcp.json` in `vendor/OpenChatCut/` already has
the connection for a checkout opened there directly. After connecting:
`npx skills add 0xsline/OpenChatCut` installs its skill router; then "Set up
OpenChatCut" and use `begin_edit_session` / `review_edit_session`.

### Editing knowledge ported INTO the house system (2026-09-10)

Tal: "take the skills and the UI/UX inspiration and the skills of editing — it
knows how to edit really good videos — bring that all into what we're building,
the ultimate video editor system on localhost." So the OCC *editing knowledge*
(not code, not the app) is folded into this repo's skills, adapted to the house
rules (positivity, his caption/title style, ShortSync, A#/B# review IDs):

- **`skills/toolbox/video-editor/references/clean-cuts.md` §7** — "A-roll semantic
  judgment" from OCC `talking-head-guide`: retake selection (cut from the failure
  point, keep the unrepeated lead-in, prefer the later complete take), false-start
  rules, context-dependent fillers, pause = compress-not-zero (~0.3 s; 0.3–0.5 s
  between sentences), A-roll timing anchors captions/music/B-roll, end-to-end QA.
- **`skills/01-longform-to-short/references/candidate-scoring.md`** — OCC's
  weighted 0–4 selection rubric (standalone 18 / hook 16 / payoff 14 / context 14
  / visual 12 / platform 10 / boundaries 8 / distinctiveness 8), evidence note per
  factor, deduction pass, reject-before-ranking list. Pointer added in `scoring.md`.
- **`scripts/ingest.mjs`** already implements OCC's talking-head first pass:
  repeated-take detection, tail-trim on a cut-off interviewer question, pause
  cut, positivity gate, hook-first TRIAL with a cold-open lead-in extension.
  `--translate` (default on — Tal's footage is often he/ar) via `tighten.mjs`.

Other useful OCC skills for reference (not yet ported, low priority): `beat-sync-montage`,
`news-rough-cut` (strict "no added audio" info style), `storyboard-shot-breakdown`.

### Still to wire (staged)

- **`:4100` editor timeline UX** — Tal likes the ChatCut timeline. Bring its
  interaction patterns (ripple/slip trim, snap, marker lane, transcript-linked
  scrub) into `scripts/review-server.mjs` `buildEditor()`.
- Port `src/components/evidence/*` as motion-graphics templates.
- Port `nas_caption` + `emphasis.mjs` as a caption preset.
- Export post-hook → `scripts/publish.mjs`.
- Point the media pool at the footage library (`system/public/footage/<shoot>/`).
