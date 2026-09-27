# Pipeline: raw material → finished social video

The three stages of the system and how they connect.

```
 raw talking-head clip(s)                        script / idea
          │                                            │
          ▼                                            ▼
 ┌─────────────────────┐                     ┌────────────────────────┐
 │ 1. TIGHTEN          │  npm run tighten    │  scene plan / beat     │
 │  auto-video-editor  │───────────────┐     │  sheet (write first)   │
 │  whisper.cpp local  │  keep.json    │     └────────────────────────┘
 │  cut fillers+pauses │  captions.json│                 │
 └─────────────────────┘               ▼                 ▼
          │                   ┌──────────────────────────────────────┐
          │  <AutoCut>        │ 2. EDIT (Remotion)                    │
          └─────────────────▶ │  MODE A footage + MODE B motion gfx   │
                              │  components/, compositions/<slug>/    │
   ┌─────────────────────┐    │  <Captions> from captions.json       │
   │ 3. GENERATE         │───▶│  fill visual gaps with generated     │
   │  "Open Higgsfield"  │    │  shots (public/generated/<slug>/)    │
   │  prompt compiler +  │    └──────────────────────────────────────┘
   │  provider adapter   │                     │
   └─────────────────────┘                     ▼
                                       npm run render → output/<slug>.mp4
```

## 1. Tighten — `npm run tighten -- <video> [--slug s] [--model small.en]`

Remotion-native port of `auto-video-editor.skill` (vendored at
`skills/auto-video-editor/` for the original macOS version). Runs **fully local** —
whisper.cpp, no API, no tokens.

- Transcribes with `@remotion/install-whisper-cpp` (model cached in
  `~/.cache/video-studio/`, off any path with spaces — the installer can't quote).
- Drops the same filler list + `MAX_PAUSE` / `MARGIN` logic as the original
  (`scripts/lib/autocut-core.mjs`, unit-testable).
- Writes `system/public/footage/<slug>/<name>.keep.json`, `.captions.json`, `.cut.log`
  and a `system/src/compositions/<slug>/<Pascal>Cut.tsx`.
- **No ffmpeg re-encode** — `<AutoCut>` plays the kept spans back-to-back and the
  Remotion render IS the tightened cut. Hand-tune by editing the JSON.
- Keeps every take, in full and in order. It only tightens.
- If the result is `<8%` shorter, the log flags the VAD/timestamp issue → try
  `--model medium.en` or a lower `--max-pause`.

## 2. Edit — see `EDITING-SYSTEM.md` + `MOTION-PROMPT.md`

The tightened clip is B-roll/A-roll inside the Remotion edit. `captions.json`
feeds `<Captions>`. Build MODE A (footage) and MODE B (motion graphics) beats.

## 3. Generate — `npm run generate -- --spec <shot.json> --slug <slug> --kind <kind>`

Local re-implementation of Open-Higgsfield-AI's useful core: a **prompt compiler**
(`src/generate/prompt.ts` — ShotSpec + Cinema-Studio camera params → one
production-grade prompt) and a curated **model registry** (`src/generate/registry.ts`),
behind a **provider adapter** interface.

- Default provider `dry-run` compiles the prompt and writes a `.request.json` —
  generates nothing, costs nothing. Use it to get the prompt right.
- `GEN_PROVIDER=muapi` + `MUAPI_API_KEY` uses the muapi.ai gateway (what
  Higgsfield uses; paid per generation). Add other providers under
  `src/generate/providers/`.
- Output + a sidecar `.json` land in `public/generated/<slug>/`; `--save` appends
  the prompt to `prompts/saved/winners.md`.
- Spec format: `prompts/shot.example.json`. Categories: `prompts/categories/`.
