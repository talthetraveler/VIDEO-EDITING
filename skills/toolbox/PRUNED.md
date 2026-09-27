# PRUNED 2026-09-27 — 140 tools down to 49

Tal: *"maybe there's so many skills that I don't need ... redundant, that do the
same thing ... I don't want it to be too much so it doesn't overload the
system ... I edit a video, boom."*

**Restoring anything:** every skill below except the three marked *clone* is in
this repo's history at commit `537bdab`:

```bash
git checkout 537bdab -- skills/toolbox/<name>
```

The three clones come back with `git clone` — their URLs are in `CLONES.md`.

## What was cut, and why

| skill | why |
|---|---|
| `cve-generate-footage` | duplicate: byte-identical to generate-footage |
| `cve-video-studio` | duplicate: byte-identical to video-studio |
| `cve-make-a-video` | duplicate: 10-line variant of make-a-video |
| `cve-gsap` | duplicate: same SKILL.md as gsap |
| `cve-short-form-video` | duplicate: 12-line variant of short-form-video |
| `cve-hyperframes` | duplicate: stale variant of hyperframes |
| `cve-hyperframes-cli` | duplicate: stale variant of hyperframes-cli |
| `cve-hyperframes-registry` | duplicate: stale variant of hyperframes-registry |
| `cve-video-use` | duplicate: same SKILL.md as video-use (the working install stays) |
| `faceless-explainer` | installed globally + loadable; this copy was stale, no Tal edits |
| `general-video` | installed globally + loadable; stale, no Tal edits |
| `hyperframes` | installed globally + loadable; stale, no Tal edits |
| `hyperframes-animation` | installed globally + loadable; stale, no Tal edits |
| `hyperframes-audio` | installed globally + loadable; stale, no Tal edits |
| `hyperframes-cli` | installed globally + loadable; stale, no Tal edits |
| `hyperframes-core` | installed globally + loadable; stale, no Tal edits |
| `hyperframes-keyframes` | installed globally + loadable; stale, no Tal edits |
| `hyperframes-registry` | installed globally + loadable; stale, no Tal edits |
| `media-use` | installed globally + loadable; its SFX moved into tal-video-editor/assets/sfx |
| `motion-graphics` | installed globally + loadable; stale, no Tal edits |
| `pr-to-video` | installed globally + loadable; and GitHub-PR videos are not his work |
| `product-launch-video` | installed globally + loadable; and SaaS promos are not his work |
| `remotion-to-hyperframes` | installed globally + loadable; stale, no Tal edits |
| `slideshow` | installed globally + loadable; slide decks are not his work |
| `hyperframes-creative` | HyperFrames extra, also in ~/.agents; unused by his pipeline |
| `hyperframes-studio` | HyperFrames extra, also in ~/.agents; unused by his pipeline |
| `music-to-video` | HyperFrames extra, also in ~/.agents; music visualisers are not his work |
| `talking-head-recut` | HyperFrames extra, also in ~/.agents; graphic-card overlays unused |
| `changelog-video` | another company's product: weekly software changelogs with an "Annie" voiceover |
| `short-form-video` | another person's project: "maintain the existing May Shorts compositions" |
| `remotion-saas` | building a SaaS app with Remotion - not video editing |
| `auto-video-editor` | Mac-only installer; this is a Windows machine |
| `make-a-video` | beginner HyperFrames wizard, covered by the global hyperframes skill |
| `generate-footage` | videos from stills + ElevenLabs narration; he films real people |
| `video-studio` | router for the cve-* bundle removed above |
| `gsap` | GSAP reference, covered by the global hyperframes-animation skill |
| `video-editor-silence-cut` | CLAUDE.md 5c: generic, the repo's own cutter knows his footage |
| `script-writer` | CLAUDE.md 5c: tal-scriptwriting wins over it |
| `motion-graphics-animator` | CLAUDE.md 5c: generic, screen-record-an-HTML-animation |
| `static-visual-creator` | CLAUDE.md 5c: generic PNG cards |
| `footage-intelligence` | CLAUDE.md 5c: duplicates npm run index, which caches and ours is resumable |
| `extracting-transcripts` | needs an AssemblyAI key he does not have; Groq + WhisperX already do this |
| `claude-shorts` | overlaps 01-longform-to-short + youtube-clipper, which the router uses |
| `nl-video-editing` | overlaps ffmpeg-skill, which the router uses |
| `video-edit` | overlaps the house pipeline (transcribe -> cut -> caption), which is better tuned |
| `short-form-edit` | overlaps the house pipeline + tal-video-editor formats |
| `brag` | raw clone superseded by the real install (/brag, /brag-slim) |
| `_not-video/` (43) | AWS, Cloudflare, Bun, Copilot, landing pages, another creator's brand kit, and `honest-agent` — which rewrites CLAUDE.md. None of it is video. |

## How the cut was decided — measured, not guessed

1. **Byte-identical content** — hashed every file of every skill. Two pairs matched exactly.
2. **Near-duplicates** — `diff`ed each `cve-*` against its twin. Same skill, older variant.
3. **Shadowed by a global install** — 15 HyperFrames skills are now installed in
   `~/.claude/skills` and load on their own. Every toolbox copy was checked for
   Tal-specific edits (`talthetraveler`, `tal-video-editor`, `LESSONS.md`,
   dated "Tal," quotes). **None had any** — they were stale upstream snapshots.
4. **Referenced by nothing** — grepped CLAUDE.md, the router, every script and
   agent. Only three candidates were referenced, and all three were handled:
   `embedded-captions` **kept**; `media-use`'s SFX library **moved** to
   `tal-video-editor/assets/sfx/`; `brag`'s router row **repointed** to the
   installed `/brag-slim`.
5. **CLAUDE.md §5c had already judged** several as losing to what this repo
   has. Those went.

## What was kept, deliberately

Everything the router's toolbox table points at; the numbered craft base
(`01`–`08`); the 12 Remotion skills (CLAUDE.md §9 names them the source of truth
for the Remotion side); `embedded-captions` + `captions-overlay`; and the three
from the content kit CLAUDE.md calls genuinely new — `thumbnail-designer`,
`gpt-image-prompt`, `carousel-creator`.

## The toolbox was never the overload

Nothing in `toolbox/` loads unless it is opened by path. Pruning it makes the
kit legible; it does not change what happens when an edit starts. **The real
overload is the global HyperFrames install** — see `tal-video-editor/REPOS.md`.
