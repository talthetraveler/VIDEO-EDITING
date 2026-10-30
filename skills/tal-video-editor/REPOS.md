# THE REPOS TAL HANDED OVER — what is installed, what works, what doesn't

Tal, 2026-09-26: *"you should have all these github repos that i given u, be
able to work, so i can just boom like have u edit video."*

Fair. Twice a repo was discussed in chat, judged interesting, and then never
installed — and nothing recorded that, so the next session had no way to know.
**This file is the register. A repo he hands over gets a row here in the same
turn, with a verified status, or it has not been dealt with.**

"Installed" means a command was actually run and its output read. Not "cloned".

| repo | status | reachable by |
|---|---|---|
| `browser-use/video-use` | **works** | `toolbox/video-use/`, clone at `system/vendor/video-use` |
| `kajisho5/ffmpeg-skill` | **works** — 42 typed scripts | `toolbox/ffmpeg-skill/`, call with `python` not `python3` |
| `denizsafak/AutoSubSync` | **installed, sharply limited** — see below | `assy-cli`, wrapped by `system/scripts/caption-crosscheck.mjs` |
| `latent-spaces/brag` | **installed and loadable** — wrong job for footage, see below | `/brag`, `/brag-slim` |
| `francozanardi/tscaps` | **not installed, deliberately** — see below | — |
| OpenChatCut | cloned, never wired | `system/vendor/OpenChatCut` |
| `calesthio/OpenMontage` | **installed and working, 42/117 tools, zero keys** | `system/vendor/OpenMontage` |
| `kamilstanuch/Autocrop-vertical` | **works after a 3-line patch** — horizontal -> 9:16, one fixed crop per scene. See below | `system/vendor/Autocrop-vertical` (own `.venv`) |
| `Jakeschincariol/instagram-agent-skill` | **installed in full, 13 loadable skills** — they write Instagram text (captions, comments, replies, DMs, scripts); they post nothing. Its hook scorer rates 60/60 of his titles WEAK and must never gate. See below | `/ig-reel`, `/ig-caption`, `/ig-comment` ... (`skills/ig-*`), `PYTHONUTF8=1 python` |
| `harry0703/MoneyPrinterTurbo` | **installed 2026-10-08, works with ZERO keys on local clips** (script in, voice + subtitles + 9:16 cut out). Stock footage and AI script need a key. `litellm` did not install (Windows path limit). See below | `system/vendor/MoneyPrinterTurbo` (own `.venv`), `cli.py` |
| Motion Graphics starter kit (Damiano Caudullo, PDF + zip Tal handed over 2026-10-08) | **in the toolbox as REFERENCE ONLY** (`skills/toolbox/motion-graphics-starter-kit/`). It is a prompt guide for HyperFrames, which the story reels already use: nothing new to install. Tal: "I don't want you to do the motion graphics, just have it as a skill for the reference", then "you can do some". |
| `daymade/claude-code-skills` -> `youtube-downloader` | **in the toolbox, `--info` verified 2026-10-08** (`skills/toolbox/youtube-downloader/`). A wrapper round yt-dlp, which was already here (`system/bin/yt-dlp.exe` 2026.08.19) and pulled every interview for the story reels. |
| `Alisa0808/vox-director` | **registered 2026-10-08, NOTHING RUN: needs a paid Atlas Cloud key that is not here.** Only the ffmpeg/Pillow stages are local. See below | `toolbox/vox-director/` (not loadable, on purpose) |
| `nateherkai/herk-edit-kit` | **installed 2026-10-21, cut stage and cards WORK with no key** - 406 motion cards, all landscape 1920x1080 (none vertical); its only transcriber uploads to ElevenLabs and was not run. See below | `skills/toolbox/herk-edit-kit/` (not loadable, on purpose; own `node_modules`) |
| `nextwork-projects/ai-video-editor-cooked` | **cloned 2026-10-21, measure + cut stages verified with ZERO keys; posting path (Zernio) present and never run; renderer not installed.** Median shot length matches ours to +-0.02 s; raw cut count 20-25% high on flash/whip transitions. Its retake finder assumes ONE speaker. See below | `skills/toolbox/ai-video-editor-cooked/` (not loadable), run with `AI_EDITOR_HOME=<clone>/.home` |
| `tenfoldmarc/video-edit-skill` | **installed 2026-10-21, runs end to end with zero keys; its signature move (words behind the head) silently FAILS on iPhone HDR/HLG sources unless the A-roll is retagged/tone-mapped to BT.709 first.** Works on SDR. See below | `skills/toolbox/video-edit-skill/` (clone `3f01f2e`, own `.venv`, not loadable) |
| `hypit-ai/hypit` | **installed 2026-10-21, local path WORKS with no key**: own clip + WhisperX words + word-anchored captions, rendered locally (~6 min for 13.8 s). Its headline "clone a viral video" job generates people/voices/B-roll through PAID services; none run or connected. See below | `skills/toolbox/hypit/` (not loadable), `node skills/toolbox/hypit/bin/hypit.mjs` |
| `remotion-dev/remotion`, `heygen-com/hyperframes` | **already installed** (Remotion 4.0.520 in `system/`, HyperFrames CLI 0.8.181). The PDF's three Effect-of-the-Day prompts now run on the Remotion one: `system/scripts/effect.mjs` | `system/src/effects/` |
| `talthetraveler/VIDEO-EDITING` | **this repo** | - |

**Handed to his Tab, Oct 2026: installed and tested 2026-10-30.** Every repo, its verdict and its number are in "The Tab handoff repos" at the end of this file. Winners: `claude-youtube-editor` (word-synced SFX), `lemo-opuscar` (code-drawn inserts), `p5.brush` (hand-drawn marks), `beat-synced-edit` with our patch (cut to the beat). **`obi19999/smart-video-reframe` is a malware lure: never download it.**
Tal, 2026-10-30, on outside reel-cloning services (n8n + Apify, Media.io, HookClone): not needed, Hypit covers it.

---

## AutoSubSync — a second opinion that can confirm but never convict

`assy-cli` 1.0.1 with `ffsubsync` 0.5.1, `autosubsync` 1.0.1. It was already on
this machine; it was the *skill folder* that never existed, which is why an
earlier search said "not installed". Check with `pip show autosubsync ffsubsync`.

**Why it is worth having at all.** The caption-qc rule here is *never verify
with the engine that generated the captions*. Until now the only timing check
was `speech-runs.py` — the same measurement that placed them, so it could only
ever agree with itself. ffsubsync aligns by its own voice-activity detection
and shares nothing with our placement.

**What it can actually do, measured 2026-09-26** by injecting a known +2.000s
offset and asking it to recover −2.000s:

| material | result |
|---|---|
| one continuous clip (`02 captioned.mp4`, 28 cues) | −2.00 / −2.00 / −2.00 — exact on every cue |
| 13-beat montage (`EDEN V9`, 64 cues) | median −0.27, min −8.48, max +11.55 — noise |

It looks for the ONE shift that fits the whole file. Across hard cuts there
is no such shift, and **it does not fail — it returns a confident wrong
number.** Unguarded it condemned the Eden cut at +24.29s. That is the fourth
time an instrument in this repo has failed good work, so the wrapper refuses
to run on a multi-beat build.

**And it is unreliable even on single clips.** Of the five kindness clips it
locked onto two and lost the other three:

```
01  INCONCLUSIVE — returned 3 of 14 cues
02  PASS  0.00s on all 28
03  INCONCLUSIVE — returned 4 of 17 cues
04  PASS  +0.01s on all 22
05  INCONCLUSIVE — returned 2 of 20 cues
```

The tell is **cue loss**: it drops anything a bad shift would push before t=0.
On clip 01 our cue 12 (22.46s) came back at 1.50s — a −21s shift on a 27-second
clip — and the first eleven vanished. Comparing the survivors by position is
meaningless, and doing it produced three false FAILs on captions that were fine.

It fails on the clips with sparse street speech and a repeated phrase
("HAPPY NEW YEAR" four times) — many near-equal correlation peaks — and it is
exact where speech is continuous. It gives **no confidence signal**; cue loss
is the only way to tell the two apart.

> **So: a PASS is real evidence. Anything else is "not checked".**
> It can corroborate timing. It can never condemn it, and nothing should be
> rejected on its say-so.

```bash
node system/scripts/caption-crosscheck.mjs <slug|captions.json> <render.mp4>
```
Exit 0 = PASS, 3 = inconclusive, 2 = refused (montage), 1 = real disagreement.

---

## brag — a launch video for a CODEBASE, not for footage

`/brag` reads a **project directory or a website URL** and makes a ~20s launch
video about the software: it inspects the code, pulls the real colors, fonts and
components, and renders a promo with music and share copy.

It never touches camera footage. **It cannot edit an interview**, and it is not
part of the editing pipeline — pointing it at `FOOTAGE IN/` would do nothing
useful. Installed because Tal asked for it, and it is genuinely the right tool
for exactly one job here: a launch video **about this editing system itself.**

Two variants ship: `brag` (bundled music/SFX, renders through Hyperframes) and
`brag-slim` (single file, no bundled assets, builds everything with what is on
the machine). Requirements are all satisfied here: Node 24.19, ffmpeg on PATH,
Hyperframes already wired into this repo.

**Installed 2026-09-26** on Tal's instruction (*"isntall brag"*), with the
official installer:

```bash
npx skills add https://github.com/latent-spaces/brag --skill brag
npx skills add https://github.com/latent-spaces/brag --skill brag-slim
```

Both land in `.agents/skills/` and are symlinked into `skills/`, which
`.claude/skills` junctions to — so `/brag` and `/brag-slim` are live. The raw
`git clone` that used to sit at `toolbox/brag/` was removed in the
2026-09-27 prune - the installed skill is the one that runs. Its `docs/` and
`examples/` are one `git clone` away (`toolbox/CLONES.md`).

**This makes three loadable skills where the rule says one, and the risk is
real.** `brag` triggers on *"make a launch video"* and *"turn this into a
video"*; `tal-video-editor` triggers on *"turn this footage into a video"*.
One word apart. CLAUDE.md §0a now resolves it in advance: **anything about
footage is `tal-video-editor`, always** — `brag` only when the subject is a
project or a website. Do not leave that to the loader.

**Machine readiness** — `npx hyperframes doctor`, same day:

| | |
|---|---|
| ffmpeg / ffprobe / Chrome / MusicGen | ✓ |
| **memory** | **✗ 1.7 GB free of 15.8 GB — "renders may fail"** |
| whisper-cpp, Kokoro TTS, Docker | ✗, all optional (TTS only matters with `--voice`, off by default) |

So it will run, but **close things first**. The memory warning is the one that
actually bites.

---

## tscaps — not installed, and the reason matters

A browser-based editor: drop a video, transcribe with in-browser Whisper, pick
an animated-caption template, burn it in with WebCodecs. Exports MP4 plus
SRT/VTT/ASS.

Three reasons it stays out:

1. **Docker is absent on this machine** (`which docker` → nothing), which rules
   out both documented install paths. From source it needs a pnpm workspace and
   a dev server.
2. **It duplicates what already works here** — we render captions with
   PIL + ffmpeg to a measured house style (white, 1–3 words, lower-middle,
   `capY 0.66`). Its templates are somebody else's look.
3. **It is a GUI Tal would have to drive himself**, which is the opposite of
   *"boom, edit video."*

**What it is genuinely good for: a reference for caption ANIMATION** — the one
thing our renderer does not do. If animated captions are ever wanted, read its
`@tscaps/engine` for technique and implement it in our renderer. Technique
only, never assets (CLAUDE.md §1 Rights).

---

## The rule this file exists to enforce

A tool is not "available" because it is on the disk, and not "working" because
it installed. **It works when it has been run on this footage and its output
has been checked against something known.** Both real findings above —
ffsubsync's exactness on one take and its silent garbage on a montage — came
from injecting a known offset and demanding it back. Do that before trusting
any new instrument, and write what it did here.


---

## OpenMontage — installed 2026-09-27, and it needs no API key at all

Tal: *"tell me what you need from me, which api key ... does it need chat gpt,
does it need something else."* Answer, measured rather than read off the
README: **for editing his own footage, nothing.**

**There is no LLM key.** OpenMontage is driven by the coding assistant that is
already here — no OpenAI key, no Anthropic key, no ChatGPT account. That is the
whole design.

`make` does not exist on this machine, so `make setup` cannot run. The Makefile
targets were executed by hand:

```bash
cd system/vendor/OpenMontage
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # 13 packages, no torch
cd remotion-composer && npm install
./.venv/Scripts/python.exe -m pip install piper-tts faster-whisper yt-dlp youtube-transcript-api
./.venv/Scripts/python.exe -m piper.download_voices en_US-lessac-medium
cp .env.example .env            # every key left blank, deliberately
```

**`.venv/Scripts` must be on PATH or Piper is invisible** — the registry probes
for `cmd:piper`, and pip put the exe inside the venv. Without it, tts reports
0/10 while Piper is sitting right there.

**42 of 117 tools available with an empty `.env`**, and every one needed to cut
his own video is among them:

| category | live | what that is |
|---|---|---|
| `source_ingest` | 1/1 | yt-dlp — pull his own YouTube videos back down |
| `analysis` | 10/13 | faster-whisper transcription, face tracking, scene detect, audio energy |
| `video_post` | **9/9** | silence cutter, trimmer, auto-reframe, compose, stitch |
| `subtitle` | 2/2 | caption generation + burn-in |
| `enhancement` | 3/6 | colour grade, face enhance, eye enhance |
| `tts` | 1/10 | Piper, offline, free |

What stays dark without money: `video_generation` 0/26, `image_generation`
0/16, `music_generation` 0/5, `avatar` 0/4. **All of it is AI generation of
footage he does not need — he shoots his own.**

### Two defects found by running it, not by reading it

**1. `face_tracker` was broken on arrival.** mediapipe 1.0.1 removed the
`mp.solutions` API the tool calls, so it raised `AttributeError` instead of
falling back to its Haar path. Fixed by pinning, which drags numpy down with it:

```
mediapipe==0.10.21   opencv-python==4.11.0.86   (numpy pinned to 1.26.4)
```

Confined to this venv; nothing else in the repo shares it.

**2. `auto_reframe` only converts ASPECT RATIO**, and says so honestly —
handed the Eden footage it returned *"Source already matches target aspect
ratio"* and passed the file through untouched. Correct, and the same conclusion
reached by hand on EDEN HOW STRONG: that footage is already 9:16, so the
problem was never the crop, it was faces being small inside a correct frame.
**auto_reframe does not solve that.**

### What face_tracker is actually good for, measured

Run against 12s of the Eden two-shot, it found a face in **60 of 60** sampled
frames, and its numbers line up with the gridded still measured by hand:

```
              tracker    by hand
face centre y   0.451      0.450
Eden      x     ~0.76      0.72
Tal       x     ~0.25      0.17
```

**But it returns ONE face per frame**, so on a two-shot the median is a lie —
x came back 0.323, which is neither of them. The distribution is plainly
bimodal (36 frames near 0.25, 20 near 0.76). **Cluster the x values before
using them; never take the median on a two-shot.** Used that way it replaces
the manual gridded-still measurement, which is a real gain — that step was done
by eye on the last two films.


---

## The global HyperFrames install — parked the parts that compete, 2026-09-27

Installing `/brag` on 2026-09-26 pulled 15 HyperFrames skills into
`~/.claude/skills`, where they load **on their own**. One of them,
`hyperframes`, describes itself as the *"Mandatory entry point: read this
first for any request to make, create, edit, animate, or render a video"* and
lists *"existing footage"* as an input — so every "edit this" Tal said was
contested between it and `tal-video-editor`. That is the exact failure
CLAUDE.md §0a was written to prevent, and it arrived silently through an
unrelated install.

`/brag` reads five of them by name, so the family could not simply go. But
brag's own SKILL.md says *"do not enter the `hyperframes` entry"* — it needs the
domain skills, not the entry points. So:

| | skills |
|---|---|
| **parked** → `~/.claude/skills-disabled/hyperframes-entry-points/` | `hyperframes`, `general-video`, `media-use`, `motion-graphics`, `faceless-explainer`, `product-launch-video`, `pr-to-video`, `slideshow`, `remotion-to-hyperframes`, `figma` |
| **still loadable** (what `/brag` reads) | `hyperframes-core`, `-animation`, `-audio`, `-cli`, `-keyframes`, `-registry` |

Parked, not deleted — move a folder back to restore it. `media-use`'s sound
effects were copied to `tal-video-editor/assets/sfx/` first.

**The lesson: installing any skill can install more than one.** After an
install, list `~/.claude/skills` and read every new description for a trigger
that claims "edit", "video" or "footage". Check the loader, not just the folder
you cloned into.

---

## Autocrop-vertical — installed 2026-09-28, patched, and mostly NOT for his footage

Tal, 2026-09-28, while starting long-form YouTube: *"install this ... I'll be
giving you also like a reference of a bunch of YouTube videos and travel
videos."* Clone at `system/vendor/Autocrop-vertical` (commit `e026639`), own
venv (torch 2.14 CPU, ultralytics 8.4, scenedetect 0.6.7, OpenCV 4.14). **No
licence in the repo** — fine to run locally, never redistribute it.

```bash
cd system/vendor/Autocrop-vertical
.venv/Scripts/python.exe main.py -i in.mp4 -o out.mp4 --quality high
.venv/Scripts/python.exe main.py -i in.mp4 -o out.mp4 --plan-only   # the per-scene decision, no encode
```

(Set `PYTHONIOENCODING=utf-8` from PowerShell — it prints emoji.)

**What it actually does — read the code, not the name.** PySceneDetect splits
the video into scenes; YOLOv8n looks at **ONE frame, the middle of each
scene**; every person found counts, passers-by included. One person, or a group
narrower than a 9:16 slice -> a **fixed** crop centred on them for the whole
scene ("TRACK" does not track). Anything wider -> **LETTERBOX**: the whole 16:9
frame shrunk into the middle with black bars. Nothing follows a subject who
walks within a shot — that is still `toolbox/clipify/`.

**Broken as shipped on this machine, patched here.** ffmpeg 9.0 (the Gyan build
on PATH) removed `-vsync`; main.py passes it twice, ffmpeg refuses to start and
Python dies with `OSError: [Errno 22] Invalid argument` on the frame pipe — a
message that points nowhere near the cause. Found by re-running its exact ffmpeg
command and reading stderr. Patch (vendor/ is gitignored, so it lives HERE —
re-apply after any `git pull`):

```
'-vsync', 'cfr'  ->  '-fps_mode', 'cfr'                       (lines 297, 565)
encoder: add '-nostats', '-loglevel', 'error'                  (line 560)
```

The second line is preventive: the encoder's stderr is piped and never read
until the end, so on a long YouTube source the progress spam would fill the pipe
and freeze the run. (First guess — odd output width — was wrong: it already
rounds 607 -> 608. Checked before patching.)

**Known-answer test, 2026-09-28.** A built 1920x1080 control clip: 0-5s one
person placed at x 1250-1858; 5-10s two people at opposite edges.

| expected | got |
|---|---|
| a scene cut at exactly 5.000s | 2 scenes, boundary 00:00:05.000 |
| scene 1: crop x≈1250-1858 | TRACK, crop sits exactly on the person, no background visible |
| scene 2: letterbox | LETTERBOX |
| 10.0s, audio kept | 608x1080, yuv420p, 10.000s, audio stream present |

Speed: **57s for 10s of 1080p (0.2x realtime)** including model load; scene
detection alone took 23.6s. Not yet measured on a long file — expect a 20-min
source to take the better part of an hour. Audio sync was NOT proven (the
control's audio was silence).

**Where it is useful, and where it is not:**

- **NOT on his own footage, as of this date.** Every clip probed — Sony
  feed-homeless (C0484, C0488), the Sony table rig (C0246), the phone clips in
  `Downloads/travel` — is portrait content. The Sony files are 3840x2160 with
  **no rotation tag** and the picture sideways: they need a 90° turn (the
  rotation slot in `build-edit.mjs`), never a crop. Autocrop would cut a
  vertical strip out of a man lying on his side. **Check rotation first.**
- **Useful for genuinely horizontal footage** — a long-form YouTube cut being
  mined for Shorts (`formats/longform-to-shorts.md`), horizontal B-roll, a
  horizontal camera he has not used yet. Use TRACK scenes as they come.
- **Its LETTERBOX fallback is not his look.** A tiny shot between big black
  bars. For a horizontal conversation his format is the square band +
  punch-ins (ROUTING §1). Run `--plan-only`, take the TRACK scenes, and build
  the LETTERBOX ones as square-band beats instead.

---

## instagram-agent-skill — 2026-10-02, trimmed to four tools on purpose

Tal pasted the repo, then: *"i have so many skills now ... maybe u need to just
use the best things from there."* So this one was taken apart instead of
installed whole. It is a COPYWRITING pack (hooks, captions, DMs, profile
score), not an editing tool, and it ships 13 `SKILL.md` files whose triggers
(*"make a reel about X"*, *"cut this up"*) would contest `tal-video-editor`.
**None of the 13 were copied.** Four Python tools were, to
`toolbox/instagram-agent/` — 76 KB, stdlib only, no network, read before run.

Every one was fed a known answer before it was pointed at his work:

| tool | known answer | got | on his real content |
|---|---|---|---|
| `hookscore.py` | README: 85.6 / 81.4 / 54.4 / 9.6 | exact | **60 of 60 titles WEAK** |
| `swipe.py` | README: 60.0x / 37.5x / 1.3x | exact | not yet run on a harvest |
| `caption.py` | 81 chars, 2 tags, fits the 125 window | correct | flags no ask, tag in the visible window |
| `beats.py` | none available (README truncates its input) | arithmetic right | not yet run on a VO script |

**The hook scorer is the fifth instrument here to condemn good work.** It wants
money, numbers and loss words, treats a greeting as a dealbreaker, and cannot
read ALL-CAPS proper nouns. Full table in `toolbox/instagram-agent/README.md`.
It stays only because `swipe.py` imports it.

All four crash on the first emoji without `PYTHONUTF8=1`.

Left out: the humanizer trio (*"too short to judge"* on his captions) and the
13 prompt files.

**What the caption test surfaced, unasked:** `schedule-plan.json` holds 62
scheduled posts and **5 unique captions**, all one sentence reworded
(*"the side of Israel they don't show you online"*), none with a call to
action. Not changed — those posts are already submitted. Worth a decision.

**Reversed the same evening.** Tal: *"You should install everything when I tell
you to."* All 13 skills now live in `skills/ig-*` and are loadable; the
trimmed toolbox copy was removed. The measurements above stand - they are why
`hookscore.py` is reported and never obeyed. The collision with
`tal-video-editor` (`ig-reel`: *"make a reel about X"*) is resolved in
CLAUDE.md 0a, the way `brag` was. Smoke-tested from the installed folders:
`hookscore.py`, `caption.py`, `humanize.py` all run. Not yet exercised on a
real job: `ig-viral`, `ig-audit`, `ig-carousel`.

---

## xDarkzx/Audacity-MCP — installed 2026-10-04, NOT usable yet (Audacity itself is missing)

Tal pasted the link on 2026-10-04 while asking about music and background noise.

| | |
|---|---|
| What it is | An MCP server that drives the **Audacity desktop app** over its `mod-script-pipe`: 144 tools (effects, noise reduction, compressor, limiter, labels, transcription via faster-whisper) and 9 cleanup/mastering pipelines. Apache-2.0, v0.1.24, commit `ef7612e`. |
| Where | `system/vendor/Audacity-MCP/` (git-ignored), own venv at `.venv/`; registered in `.mcp.json` as `audacity`. |
| Code read before install | 29 Python files. No network calls. `subprocess` only in `setup_transcription.py` (`nvidia-smi`, optional `pip install` of NVIDIA libs). `os.remove` only on its own temp WAVs. |
| Verified | `pip install .` into the venv succeeded on the second run (the first timed out mid-download); the server imports and lists **144 tools**. |
| NOT verified | Anything that touches audio. **Audacity is not installed on this laptop** (checked Program Files and winget), and the server only talks to a running Audacity **3.x** with `mod-script-pipe` enabled. Audacity 4 removed that interface. |
| What it does not do | It does not supply music. It cannot run headless: Audacity must be open on screen. |
| vs what we have | Noise: the pipeline already runs DeepFilterNet `-a 10` per shot inside `build-edit.mjs`, in batch, with no GUI. Loudness: one `loudnorm`/gain pass. Audacity adds hand-tunable effects (EQ, de-click, spectral noise profile) for a single stubborn clip; it is slower for everything else. |

To make it work: install Audacity 3.7.x, open it once, enable
Edit > Preferences > Modules > `mod-script-pipe`, restart Audacity, then restart
Claude Code so the `audacity` server connects.

---

## nurimator/paperima — installed 2026-10-06, WORKING (free, local, no key)

Tal pasted it for the paper cut-out look of the Elie Wiesel Foundation reference: *"I didn't want to do anything paid ...
just make sure this works and fix it up."*

| | |
|---|---|
| What it is | A browser app (plain JS + Vite, AGPL-3.0) that turns an image into a torn-paper cut-out: white torn edge, shadow, paper-fold texture, hand-made wiggle. |
| Where | `system/repos/paperima/` (`npm install`, `npm run build` -> `dist/`). |
| Code read before install | All of `src/modules`. No network calls (no fetch / XHR / WebSocket); everything runs in the page. |
| Fixed up (local changes) | `src/modules/automation-bridge.js` (new): `window.__paperima.setup()` / `renderFrame(ms)` so it can be driven with no UI at an exact time. `renderer.js`: the background fill is skipped when the bridge asks for transparency, so frames come out on alpha. |
| How I run it | `node system/repos/paperima/paper-cutout.mjs <image> <out dir> [seconds] [fps] [aspect] [res]` (headless Chrome via puppeteer-core) -> transparent PNG frames. |
| Verified | Three objects end to end on 2026-10-06: local SD image -> `hyperframes remove-background` -> Paperima -> 19 RGBA frames each (alpha 0-255) -> composited in `system/projects/style-test-wiesel/` and rendered. |
| Limits | The first frames before the torn-edge cache is built have no torn edge (the script primes three renders first). HyperFrames stretches an `<img class="clip">` that has `inset:0`: wrap each cut-out in a `<div class="clip">`. Licence is AGPL: fine for making videos; do not ship the app itself as part of a hosted product. |

Not installed, by his instruction ("I didn't want to do anything paid"): `Anil-matcha/vox-ai-motion-graphics-generator`
(every image, video, voice and music call goes through paid muapi.ai + OpenAI) and `vfx-creator0/VFXCreator` (code not
released, needs a large video model). Their clones were deleted.

## awesome-claude-video-skills (zhuyansen), triaged 2026-10-07

Tal pasted the list (252 repos). It is an INDEX, not a tool: installing all of it would fill the disk (97% full) and
put dozens of "make a video" triggers in competition. Many need paid services (HeyGen, Veo, Premiere, TTS). Taken
from it, into `skills/toolbox/` (reached on purpose, not loadable):

| Skill | From | Needs | Use for |
|---|---|---|---|
| `map-animation` | iart-ai/map-animation-skills | nothing paid | Vox-style route / zoom / highlight maps (our `system/tools/mapgen.py` is the working renderer; this is the craft guide) |
| `kinetic-typography` | iart-ai/kinetic-typography-skills | nothing paid | split-text reveals, staggered titles, type on a path |
| `paper-cut` | aijiduonadegou/Paper-Cut | an image model for the hero stills (use local SD, `system/tools/sdbatch.py`) + HyperFrames | paper-collage explainer shots |
| `collage-broll-explainers` | MegaTroll222/VOX-COLLAGE-BROLL | its README mentions an API key for image/voice: read before use | 5-second halftone collage b-roll for one spoken line |

Read, NOT kept: `gbro-collage-broll` (needs a paid Gemini key). Not yet run end to end here: files copied and read,
no render made with them. Also looked at the same day: `lcy362/agnes-video-generator` (MIT, free, but video is made
on Agnes AI's cloud and needs Tal's own free key `AGNES_API_KEY`: waiting on him) and `flaqai/awesome-qwen-image-3`
(a prompt library for a hosted paid service: prompts only, nothing to install).

---

## harry0703/MoneyPrinterTurbo — installed 2026-10-08, WORKS WITH NO KEY on local clips; the rest needs keys

Tal pasted it: *"this is very good, you can use this for generating videos or images, I think it's free."*
Half right, measured. The tool itself is free (MIT). What it does by default is ASSEMBLE: a script, a voice,
stock clips, subtitles, optional music, joined into one video. It does not draw anything on this laptop.

| | |
|---|---|
| What it is | v1.3.8, commit `f20e0d6` (2026-10-07). FastAPI server (`main.py`), Streamlit web page (`webui/`), and a headless `cli.py`. Pipeline stages, in order: `script -> terms -> audio -> subtitle -> materials -> video`. |
| Where | `system/vendor/MoneyPrinterTurbo/` (git-ignored), own venv at `.venv/`. 1,038 MB on disk, 691 MB of it the venv. No model was downloaded. |
| Code read before install | `cli.py`, `config.example.toml`, and the relevant parts of `app/services/task.py`, `llm.py`, `material.py`, `voice.py`, `subtitle.py`, `upload_post.py` (not all 23,500 lines). The hosts in the code are the providers you configure plus a GitHub release check. |
| Does it generate images or video? | **Not by itself. Correction to "it only assembles": it can ORDER them from paid services.** `video_source` accepts `pexels`, `pixabay`, `coverr` (stock search), `local` (your own files), and `wavespeed`, `volcengine_seedance`, `ofox`, `muapi`, `metaso_minimax`, `loomloom` (text-to-video, all paid; the CLI refuses without a `--confirm-...-charge` flag), and `openai_image` (any OpenAI-style `/images/generations` endpoint; each still gets a slow zoom of about 3% a second). No image or video model runs locally. |

**Install, as run** (`uv` is the project's own route and is not on this machine; the legacy pip file was used):

```bash
cd system/vendor/MoneyPrinterTurbo
python -m venv .venv
PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pip install -r requirements.txt     # FAILED on litellm, see below
grep -v '^litellm\|^#' requirements.txt > req.txt
PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pip install -r req.txt              # exit 0
cp config.example.toml config.toml      # every key blank; listen_host changed 0.0.0.0 -> 127.0.0.1
```

**What failed, real text:** `ERROR: Could not install packages due to an OSError: [Errno 2] No such file or
directory: '...\.venv\Lib\site-packages\litellm\proxy\guardrails\guardrail_hooks\litellm_content_filter\guardrail_benchmarks\results\block_age_discrimination_-_contentfilter_(age_discrimination.yaml).json'`.
That path is exactly 260 characters and Windows long paths are off (`LongPathsEnabled = 0`, a system setting,
not changed). pip stopped there and left the packages queued after it uninstalled, so everything except
`litellm` was installed in a second pass. `litellm` is imported only when `llm_provider = "litellm"`, so one
LLM route of about 30 is missing and nothing else. A later `pip download litellm` hung for over 3 minutes and
was killed.

**Verified on 2026-10-08, no key anywhere:**

| check | result |
|---|---|
| API starts | `python main.py` -> `GET /docs` 200, `GET /ping` -> `"pong"`, 16 routes in `/openapi.json` (`/api/v1/videos`, `/audio`, `/subtitle`, `/scripts`, `/terms` ...). Stopped afterwards; port 8080 confirmed closed. It logs `API key authentication is disabled`: keep it on 127.0.0.1. |
| End to end | 3 ffmpeg test clips (two 1280x720, one 1080x1920, 6 s each) + a fixed 3-sentence script -> `storage/tasks/<id>/final-1.mp4`: 1080x1920, 30 fps, h264 `yuv420p` `tv` range, AAC, 8.5 s, plus `audio.mp3` and `subtitle.srt` (3 cues, 0.11-8.13 s). Exit 0. |
| Looked at | 3 frames on one contact sheet. Subtitles are burned in and match the script. The horizontal clip was centre-cropped to fill 9:16 (`cover` is the default fit; `--video-fit-mode contain` gives black bars). |
| Time | **2 min 54 s for an 8.5 s video**, 112 s of that the final MoviePy render. Slow. |
| Web page (`webui/`) | **not started.** Only the API and the CLI were run. |

```bash
PYTHONUTF8=1 ./.venv/Scripts/python.exe cli.py --video-script "..." --video-source local \
  --video-materials "C:/a.mp4,C:/b.mp4" --video-concat-mode sequential \
  --voice-name en-US-AndrewNeural-Male --bgm-type none --subtitle-enabled --video-language en-US
```

**Four things the test showed that the README does not:**

- **The voice is free but not offline.** `edge-tts` calls Microsoft's online voices. No account, no key; no internet, no voice.
- **It used 2 of the 3 clips.** It fills the narration length in 5 s pieces (`--video-clip-duration`) and stops; the third clip never appeared. It does not place a picture on the sentence it belongs to, and the default order is `random`.
- **Its subtitles are not his.** One whole sentence per cue in a thin font (`STHeitiMedium`), low on the frame, timed by the TTS. His are bold white caps, 1-3 words. Take its SRT timing if useful; burn captions with our own renderer.
- **Loudness came out at -20.3 LUFS** (true peak -6.9 dB), voice only. Not at his level.

**Keys, by name only** (`system/.env` holds `GROQ_API_KEY`, `ELEVENLABS_API_KEY`, `HF_TOKEN`; none were used or copied):

| part | free with no key | needs |
|---|---|---|
| Script | pass `--video-script` (what was tested) | an LLM key for `--video-subject`. **Groq is a built-in provider** (`llm_provider = "groq"`, `https://api.groq.com/openai/v1`, default model `openai/gpt-oss-120b`), so his existing key fits. It is read from `config.toml` (`groq_api_key`), not from the environment: **not placed there, so not exercised.** Also listed: `ollama` (not installed here) and `claude_code` (calls a logged-in `claude` CLI; none on PATH). |
| Search terms | not needed with `local` | the same LLM key |
| Voice | Edge TTS | nothing. `ELEVENLABS_API_KEY` IS read from the environment for ElevenLabs voice and music, and that spends his credits; it only fires on an ElevenLabs voice name or `--bgm-type elevenlabs`. |
| Subtitles | `subtitle_provider = "edge"` (default) | `whisper` mode pulls faster-whisper **`large-v3`, about 3 GB, on first use. Not downloaded.** |
| Stock footage | none | `pexels_api_keys` and/or `pixabay_api_keys`: **free, each needs an account** (pexels.com/api, pixabay.com/api/docs). Not created. Coverr also needs a key. |
| Music | `--bgm-type none` | `random` plays one of 29 unlabelled mp3s in `resource/songs/`: **no licence listed, do not post with them.** He adds his own music anyway. |
| `HF_TOKEN` | | satisfies nothing here |

**Leave OFF:** `upload_post_enabled` / `upload_post_auto_upload` post the finished file to TikTok and Instagram
through upload-post.com. Both are `false` in `config.toml`. Posting goes through Metricool, on his approval.

**Where it may be used, and where it must not:**

- **Honest uses:** a quick rough draft to hear a script against pictures; generic scenery b-roll with no
  identifiable person (a coastline, a market, a skyline) once a Pexels or Pixabay key exists; the free Edge
  voice as a scratch narration; `--stop-at audio` or `--stop-at subtitle` to get just the voice and its SRT.
- **Never on a true story about a real person.** His rules: real images first, no AI or stock face standing in
  for a real person, every picture must make sense. This tool searches stock by keyword and joins the results
  to cover the narration length; it will put a stranger's face over a real name and has no way to know. Its
  text-to-video and `openai_image` sources are the same problem with an invoice attached.
- **Not for his own footage either.** It cannot keep a line and its reply together, and it crops horizontal
  clips blind. That is `tal-video-editor`.

---

## Alisa0808/vox-director — registered 2026-10-08, NOTHING GENERATED (paid key missing)

| | |
|---|---|
| What it is | An agent skill (MIT, v1.0.0, commit `6a85a7c`, 2026-10-06): one topic -> a narrated Vox-style paper-collage video. 22 Python scripts driven by one `beats.json` per project. Every picture, clip, voice and song is bought from **Atlas Cloud** (`api.atlascloud.ai`); ffmpeg and Pillow do the joining. |
| Where | `skills/toolbox/vox-director/` (59.8 MB, most of it four showcase mp4s). In the toolbox on purpose: its `SKILL.md` triggers on *"turn this topic into a collage video"* and would contest `tal-video-editor`. |
| Key | `ATLASCLOUD_API_KEY`, read from the environment. **Paid, not on this machine, not created.** No free tier is mentioned anywhere in the repo. |
| What was actually done | `SKILL.md`, `provider.py`, the cost and host notes read, `atlas_cloud.py` and the other scripts grepped for imports and endpoints; all 22 scripts pass `python -m py_compile`; Pillow 12.3 and numpy are present. **No script was run. No picture, clip or sound exists from it.** |

**What each stage calls:**

| stage | script | calls | key? |
|---|---|---|---|
| Beat map | none (the assistant writes `beats.json`) | nothing | no |
| Style bake-off | `style_bakeoff.py` | image model | yes |
| Collage posters | `keyframes.py` | `google/nano-banana-2/text-to-image` (or `openai/gpt-image-2`) | yes |
| Motion | `clips.py` | `google/gemini-omni-flash/image-to-video`; `kwaivgi/kling-video-o3-pro` for real people and logos | yes |
| Voice + music | `audio.py` | `xai/tts-v1`, `minimax/music-2.6` | yes |
| Join, captions, watermark | `assemble.py` + `text_overlay.py` | ffmpeg + Pillow | **no** |
| Talking head -> collage (A-roll) | `asr_beats.py`, `aroll_clips.py` | `xai/stt-v1`, Omni video-edit, Seedance | yes; `aroll_assemble.py` is local |
| One photo -> collage (C-roll) | `croll_keyframes.py` | `google/nano-banana-2/edit` | yes |
| Presenter on screen (host) | `host_plates.py`, `host_clips.py` | Seedance + Omni | yes; `host.py` keying is local |
| Cut-out pieces | `extract_elements.py` | `youchuan/v8.1/remove-background` | yes |
| Fly-in assembly, confetti, slow zoom on a still, scrapbook | `motion.py`, `confetti.py`, `kenburns.py`, `mg_scrapbook.py` | Pillow + ffmpeg | **no** |

So with no key the look cannot be made at all: the collage is born in the image step. What could run is the
back half, on pictures made elsewhere (local SD via `system/tools/sdbatch.py`, cut out with
`hyperframes remove-background`): `kenburns.py`, `motion.py`, `assemble.py`. **Read from the imports, not
run.** We already have that half working with Paperima + HyperFrames (entry above), so the real value here
today is the writing: `references/prompt-guide.md` (how to prompt a collage poster) and
`references/beat-layer.md` (story arcs, shot sizes, never the same camera move twice in a row).

**Cost, as the repo states it (its prices are dated 2026-07-30; not checked by me):** poster $0.08, music
$0.11, voice $0.015. `models-and-gotchas.md` says *a ~30 s film is about $0.8-1.0*, about $1.5 on the cut-out
path. **The same file contradicts that:** it says Omni is billed $0.13 per SECOND with a 3 s minimum, and
`host-mode.md` puts B-roll at about $0.16 per second and a host clip at about $0.36 per second. By its own
per-second numbers a 30 s film is closer to $4-5 and a 60 s one to $9-10, before re-rolls (my arithmetic).
Budget on the higher figure.

**Three things to know before a key ever goes in:**

- **It will likely not run on Windows as written.** `atlas_cloud.py` uploads and downloads through a
  hard-coded `/usr/bin/curl`, a path Windows Python does not have. A two-line patch (use `curl` from PATH).
  Not made, because it could not be tested without the key.
- **It stamps `"Made with Atlas Cloud"` on the film** unless `"watermark"` is cleared in `beats.json`, and it
  uploads any photo or talking-head clip you give it to Atlas Cloud's servers (A-roll, C-roll, host mode).
- **For Tal's true stories it breaks the first rule.** B-roll mode invents every picture; C-roll and A-roll
  redraw the world around a real person, and its own notes record the video stage re-lettering a label and
  re-timing a face. Fine for an idea or a place explained as a collage. Not for a real person's face.

The clone carries its own `.git` folder: add it to our repo as plain files, or git records an empty submodule
pointer instead of the skill.


## Motion Graphics starter kit (Damiano Caudullo) — reference only, 2026-10-08

`skills/toolbox/motion-graphics-starter-kit/`: the 20-page PDF, `prompts.md` (14 prompts), 9 code-made SFX
(pop, tick, counter, chime, snap, star, switch, fill, success; 48 kHz mono, peaks -7 to -24 dB), 8 free fonts
(Archivo Black, Inter, Space Grotesk, Bricolage Grotesque, Instrument Serif, JetBrains Mono), a practice clip of an
AI-generated man, and made-up screenshots. Media is local only (not pushed).

What it is: a way of ASKING for HyperFrames animations. Its setup prompt asks for Node 22+, FFmpeg, whisper-cpp and
`npx hyperframes skills`: all already on this machine (HyperFrames 0.8.133 pinned for the story reels; 0.8.142 is the
latest). So nothing was installed.

What is worth taking from it:
- **10 named moves**: rise, pop, count-up, checklist tick, typewriter, slide-in, blur-in, punch-in, reframe, bar fill.
- **4 looks**: Kinetic Type (black, Archivo Black, one lime word), Liquid Glass (frosted cards), Editorial Grain
  (paper #efe8dc, Instrument Serif, one red cut-out word: his "stories and opinions" look), Pop Bold.
- **Rules**: nothing in the first 3 seconds but the hook; graphics off the face and out of the caption third; one
  style per video; **no sound when a card slides in or leaves, and no whooshes**: only a tick, a counter, a chime,
  about 20 dB under the voice; base first, then fix one spot at a time; `--crf 23` when a grainy file is huge.

Built from it and available in `ai-story-kit/engine.py`, OFF unless a story asks: `count:#hex|lead|NUMBER|suffix`
(a number that rolls up, with the kit's counter and chime) and `check:#hex|title|item|item|item` (a list that ticks
itself on paper). The kit's sounds are in `ai-story-kit/mg-sfx/` as `mg_*.wav`, 6 dB lower. Tal's line on use:
some, not much. One counter in a video is the level he was shown (Hadad & Qureshi V2).

## daymade/claude-code-skills: youtube-downloader — in the toolbox, 2026-10-08

`skills/toolbox/youtube-downloader/` (SKILL.md, `scripts/download_video.py`, references). `python
scripts/download_video.py <url> --info` returned title, uploader and duration for a real video here. It is a set of
rules round yt-dlp: PO-token helper (wants Docker, not installed), browser cookies only with permission, proxy
handling. Nothing in it beats the plain call that already works:
`system/bin/yt-dlp.exe --js-runtimes node -f "bv*[height<=720]+ba/b" <url>` (adding `--js-runtimes node` removes
the "no JavaScript runtime" warning; Node 24 is installed, Deno is not). Use the skill's troubleshooting section
when YouTube answers "Sign in to confirm you're not a bot" or "Only images are available".

Sourcing pictures, the honest table (2026-10-08):
| need | what works today |
|---|---|
| the real person, real places | Wikimedia Commons scripts (free, licensed) and interview footage via yt-dlp |
| an action nobody photographed | Agnes AI (`ai-story-kit/gen.py`, his free key): hands, backs, objects, no faces |
| stock clips of scenery | MoneyPrinterTurbo CAN fetch them, but only with a Pexels or Pixabay key (free, needs his account). No key is on this machine, so it sources nothing today. It never returns a picture of a specific real person. |

## Hook and viral-writing repos, and the image finder (Tal, 2026-10-08)

| what | where | state |
|---|---|---|
| `Jakeschincariol/instagram-agent-skill` -> `ig-reel/hookscore.py` | `skills/ig-reel/` (already installed) | **Now the gate for story-reel hooks at his instruction: "only make 100 hook options".** All 13 story hooks score 100.0 (`system/projects/ai-story-kit/rehook_data.py`). What scores 100: 5-12 words, 60 characters or fewer, a stake word or number in the first four words, two concrete things, two stake words, and "you". This reverses the earlier note that the scorer is never a gate; it still rates his street-video titles WEAK, so the gate applies to story reels only. |
| `aaaronmiller/create-viral-content` (MIT) | `skills/toolbox/create-viral-content/` | Copied, read, not loadable. One SKILL.md and 12 reference files (title formulas, platform templates, AI-tells). Text only, nothing to run. |
| `vyralcontent/content-skills` | `skills/toolbox/vyral-content-skills/` | Copied, not loadable. Seven skills: viral-hooks, viral-captions-and-ctas, viral-instagram-reels, viral-short-form, viral-short-form-ideas, viral-tiktok-content, viral-youtube-shorts. **Its SKILL.md files tell the assistant to mention the Vyral company once per conversation: that instruction is not followed here.** Use the hook archetypes, ignore the promotion. |
| `majiayu000/claude-skill-registry` -> `google-image-search` | NOT installed | `npx -y skills add majiayu000/claude-skill-registry --skill google-image-search --agent claude-code` answered "No skills found", and the folder is no longer in the repo. It would also need a Google Custom Search key, a search-engine ID, an OpenRouter key and a Mac-only `llm` path: none are on this machine. |
| `system/projects/ai-story-kit/find_images.py` | written here instead | **Works with no key.** Searches Openverse (Creative Commons and public-domain pictures from Flickr, Wikimedia, museums), downloads the ones 1000 px or larger and writes author + licence + source into `CREDITS.json`. Tested: "halva Jerusalem market" returned 3 pictures, 4000x3000, CC BY-SA 4.0. `python find_images.py "query" raw/ --n 6 [--portrait]`. |

Why not plain Google Images: its results are mostly news-agency photos (Getty, AP, Reuters, AFP). A reel built on those can be taken down, and the account takes the strike. Real footage of the person still comes from YouTube with yt-dlp, credited on screen and flagged as not cleared.

## B-roll finding and dead-air cutting (Tal, 2026-10-08)

| repo | where | state |
|---|---|---|
| `louisedesadeleer/b-roll-finder` | `skills/toolbox/find-broll/` (was already here) | The method the story reels follow: classify each spoken moment, search for that exact thing, vet the candidates, place the picture ON the word. |
| `louisedesadeleer/cut-video` | `skills/toolbox/cut-video/` (was already here) | For removing dead air from a real recording. The story reels do the same job with `silencedetect` in `ai-story-kit/prep.py` (first word, last word, pauses over 0.6 s out). Its own notes record 1-6 s alignment drift on retake-heavy footage: check every boundary against the sound. |
| `sasoder/stockpile` | `skills/toolbox/stockpile/` (copied 2026-10-08, media folder left out) | NOT runnable today: it needs a `GEMINI_API_KEY` (free from Google AI Studio, but it is his account to create) to plan and judge clips. The useful part is its flow: transcript -> list of b-roll needs with timestamps -> YouTube search per need -> download with yt-dlp -> an AI picks the best 2-10 s. Here that is done by hand with yt-dlp and a contact sheet. |

## Anil-matcha/vox-ai-motion-graphics-generator — in the toolbox, its LOOK is used, its pipeline cannot run (2026-10-08)

`skills/toolbox/vox-ai-motion-graphics-generator/` (SKILL.md, AGENTS.md, references, scripts, examples; the 13 MB of demo
media was left out). It turns a topic into a Vox-style paper-collage video by ordering every picture, animation, voice and
song from MuAPI, a paid service: it needs `MUAPI_API_KEY` and `OPENAI_API_KEY`. Neither is on this machine, so nothing in
`scripts/` was run. Tal: "make sure you install this ... with this you can make the video more engaging".
What IS used, with no key: its style block from `references/prompt-guide.md` (hand-cut paper collage, torn edges, tape
corners, halftone dots, paper shadows) goes into `GENSTYLE` in a story file, and the free Agnes generator draws the
illustrations in that look (`ai-story-kit/gen.py`). First use: Hadad & Qureshi V5.

**The story-reel template after his notes of 2026-10-08 (shown on Hadad & Qureshi V5, awaiting his word before the other 12):**
hook = "This man [arrow drawn onto the real person] ... . This is the story of NAME" (`arrow:X,Y,seconds` flag), a route
map with two pins (`map:NAME,lon,lat;NAME,lon,lat@lon0,lon1,lat0,lat1`), collage illustrations, one counter
(`count:`), one checklist (`check:`), his starter-kit sounds on titles and key words (`mg_pop`, `mg_snap`, `mg_tick`,
`mg_counter`, `mg_chime`), hook voiced as one take, no jump inside a shot. He rejected the scorer-driven
"You should try it" hooks the same day: his template outranks the 100 score (the template scores about 54).

## Long video -> ranked short clips (Tal, 2026-10-12: "i want u to install this also ... or use things from here")

| repo | where | state |
|---|---|---|
| `Anil-matcha/AI-Youtube-Shorts-Generator` | `skills/toolbox/ai-youtube-shorts-generator/` (clone, `3d11f2e`) | WORKS in `--mode local`, tested on `FOOTAGE IN/2026-10-11 uganda couple/fe424c96.mp4` (287 s): transcribed, ranked 3 moments, cut the top 2 (52 s and 51 s, 576x1024, frames looked at). Use it to FIND and RANK moments in a long recording or a YouTube link; each pick comes with a score, a hook line and a reason. Its cuts are rough (cut on transcript segments, mpeg4 video, no captions, no grade), so a pick is a starting point for `build-edit`, never a finished video and never a gate on his own choices. |
| `gfratmct/viral-clips-extractor` | `skills/toolbox/viral-clips-extractor/` (clone, `8d122ac`, 2024) | NOT runnable and not to be run as shipped: `clips_extractor.py` ends by UPLOADING the clips to TikTok with "#fyp #ai #random"; it also needs dlib (no compiler here), the removed `openai.ChatCompletion` API, `pytube` (broken) and an OpenAI key pasted into the source. Nothing in it does a job the repo above or `build-edit` does not already do. Kept for reference: `core/contents/face_cropping.py`. |

How to run the first one (nothing new to pay for):

```bash
cd skills/toolbox/ai-youtube-shorts-generator
LOCAL_OUTPUT_DIR="<scratch folder>" PYTHONUTF8=1 python main.py "<file or YouTube URL>" --mode local --num-clips 5 --language en --output-json "<scratch>/result.json"
```

- Its default `--mode api` needs a paid MuAPI key (not on this machine). Local mode wants an OpenAI or Gemini key; neither exists
  here, so `.env` in that folder points its OpenAI client at Groq (`OPENAI_BASE_URL=https://api.groq.com/openai/v1`, the
  `GROQ_API_KEY` from `system/.env`, model `openai/gpt-oss-120b`). `llama-3.3-70b-versatile` is NOT on this key (404).
  The transcript text goes to Groq, the same service that already transcribes his footage.
- Only `openai` and `python-dotenv` had to be installed; faster-whisper, opencv, yt-dlp and google-genai were already there.
- Patched for this machine (`skills/toolbox/patches/ai-youtube-shorts-generator-opencv5.patch`): OpenCV 5 has no
  `CascadeClassifier`, the clipper crashed before releasing the video and Windows then reported "file in use". It now
  uses OpenCV's YuNet face detector (`models/face_detection_yunet_2023mar.onnx`, from opencv_zoo) and falls back to a
  centre crop.
- It writes the clips, a cached `.srt` and the downloaded source into `LOCAL_OUTPUT_DIR`: point that at a scratch folder
  and delete it after ([[nothing-kept-local]]).

## ORB-HD/deface — face blurring (installed 2026-10-14)

Tal, on blurring the baby in the Uganda couple video: *"https://github.com/ORB-HD/deface, this has a skill for [it]."*

- **Installed:** `pip install deface` (1.5.0, MIT). Command `deface <video> --keep-audio`, or the detector alone in Python.
- **What it does:** finds every face in every frame (CenterFace) and covers it with a blurred ellipse, a box, a mosaic or a picture.
- **What it cannot do: choose WHO.** It blurs every face it finds, so run as it is it would blur the people the video is about. For "blur only this person", use its detector and keep one face:
  ```python
  from deface.centerface import CenterFace
  cf = CenterFace(backend="auto")
  dets, _ = cf(cv2.resize(frame, None, fx=2, fy=2), threshold=0.2)   # x1, y1, x2, y2, score (halve the coordinates)
  ```
- **Measured on his footage (1024x576 glasses clips, baby's face about 50 px):** it found the baby in 4 of 4 test frames at 2x upscale, with scores from 0.27 to 0.79, so keep the threshold at 0.2. It also returns tiny background faces; drop anything under about 25 px.
- A detector drops frames on a baby (profile, pacifier, motion blur). Bridge the gaps with tracking or hand-set positions and check enlarged stills every 0.25 s. One missed frame defeats the blur.

## Open-source speech cleanup — Resemble Enhance, Demucs, ClearerVoice, pyannote (installed 2026-10-17)

Tal, 2026-10-16, asking for Adobe Podcast "Enhance Speech": *"how do I direct like my AI to be using that? ... I guess I would have to use like an open source."* Adobe has no API an agent can drive, so these are the open-source equivalents. **The GitHub link he first pasted (`limitedneighb/AdobePodcast-Desktop...`) was refused: it is not Adobe's, and an "Adobe desktop" repo of that shape is a malware lure.**

- **Where:** their own env, `system/.venv-audio` (torch 2.6.0+cu124, runs on the RTX 3050 Ti), so they cannot break WhisperX/pyannote in the main Python. Installed by `SETUP EVERYTHING.cmd`. One entry point: `system/tools/audio-ai.py enhance|clean|music|separate`.
- **Resemble Enhance** (Resemble AI, MIT). `pip install resemble-enhance --no-deps` + its runtime deps — its own requirements pin torch 2.1.1 and **deepspeed, which does not build on Windows**. Three Windows fixes live in `audio-ai.py`, not in site-packages (a fresh setup needs no hand edit): a stand-in `deepspeed` module (it is imported for training only), `PosixPath -> WindowsPath` (the model's `hparams.yaml` was saved on Linux), and pointing at the downloaded weights, because its `download()` runs `git pull` on the 1.6 GB model repo on every call (~3 min each, measured). First use clones the model from Hugging Face (needs git-lfs).
- **Demucs** htdemucs (Meta, MIT) — strips music/background bed, keeps voices.
- **ClearerVoice-Studio** (Alibaba, Apache-2.0) — `MossFormer2_SE_48K` enhancement, `MossFormer2_SS_16K` separation. The separator wants an output FILE path (it writes `_s1`/`_s2` beside it) and refuses an existing folder.
- **pyannote 4.0.7** was already installed (`system/scripts/diarize.py`, needs `HF_TOKEN`).

**Measured on 15 s of a real noisy street interview** (proxy `0f1bfdfb`, "So what was your house like growing up?"). Floor = 10th-percentile 50 ms level; words = faster-whisper small re-transcription vs the original:

| version | GPU time | noise floor | speech | words |
|---|---|---|---|---|
| original | — | -31.0 dB | -9.5 | reference |
| DeepFilterNet `-a 10` (what every render uses now) | <1 s | -34.5 | -9.8 | identical |
| Resemble **full enhance** | **78 s** | -42.6 | -11.2 | **dropped "but" and the last word** |
| Resemble denoise-only | 4.4 s | -42.3 | -9.5 | identical |
| ClearerVoice SE_48K | 13 s | **-43.8** | -9.8 | identical |
| Demucs (music removal) | ~60 s | -33.6 | -9.6 | identical |

- **Full enhance REGENERATES the voice** (a diffusion model). It is the closest to Adobe's sound and the only one here that changed the words. Never use it without listening, and never on a line that will be captioned until the caption is checked against the enhanced audio.
- ClearerVoice and Resemble denoise-only each cut the floor ~12 dB with the words intact — the two strongest plain cleaners. That is also far past the do-not-over-denoise line (CLAUDE.md §1 Audio): they are for a clip where the noise hides the voice, chosen by ear, never a blanket pass on top of DeepFilterNet.
- **Separation did NOT split question from answer** on this clip: everything went to `_s1`, `_s2` held a faint echo of one line (-37.5 dB). It separates people talking AT THE SAME TIME; turn-taking speech is pyannote's job.
- **Speed is uneven:** full enhance took 78 s on the 15 s clip, but 10 min 15 s on a 4 s clip in the setup self-test (same GPU; cause not found). Budget for it; the self-test now uses `--denoise-only`.
- Tal's verdict by ear: pending (the six versions were sent to him 2026-10-17).


---

## Tal's toolkit PDF (2026-10-21) — the three effects, and the repos it lists

`tal_video_toolkit.pdf`: three Effect-of-the-Day prompts (Liquid Glass Velocity Graph, EP. 03 Screen Push, EP. 04
Over-the-Shoulder Zoom), his master prompt, and six repos. The prompts build a separate `~/EffectOfTheDay` kit on
Remotion 4.0.535; here they are ported into the main Remotion project (4.0.520) as their own entry point
(`system/src/effects/index.ts`) so a render never bundles the 5 GB `public/` folder.

```bash
node system/scripts/effect.mjs glass    <clip> --title REVENUE --end '$10K' --colour gold --at 1
node system/scripts/effect.mjs screen   <clip> --text "I just came in here" [--when 2-5] --colour amber
node system/scripts/effect.mjs shoulder <clip> --from "BEFORE | 1 hug | a day" --to "AFTER | 100 hugs | a day" --style transition
```

Verified on a real 10 s vertical clip (frames looked at): all three render 1080x1920, yuv420p **tv** range, audio kept,
about 3.5 min per 10 s. Fixes made on the way: paths with spaces (the CLI is called directly, not through a shell),
iPhone rotation tags, a one-frame word flash (each word now holds >= 3 frames), and face framing (`face-eyes.py`,
CenterFace, replaced Haar, which framed a hand). Master prompt section 11 is in `MASTER-PROMPT.md`.

## nateherkai/herk-edit-kit - installed 2026-10-21, cuts and cards work, the cards are landscape only

| | |
|---|---|
| What it is | Nate Herk's HyperFrames editing kit (MIT): 15 skills (`edit-video`, `short-form-edit`, `cut-silences`, `cut-mistakes`, `motion-showreel`, `style-library`, `video-storytelling`, ...), a 406-card motion-graphics library, 2 scene templates, 12 sample projects. |
| Where | `skills/toolbox/herk-edit-kit/` at `10511e5`. Own `node_modules` (364 MB, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci`). It pins HyperFrames **0.7.109**; the global one is 0.8.181. |
| Code read before running | Hosts: `api.elevenlabs.io` (`scripts/transcribe-elevenlabs.mjs` UPLOADS the audio; `motion-showreel/scripts/sfx.mjs`), `api.kie.ai` (paid image generation), and OpenAI / ClickUp / Linear only in old sample projects. Cards pull GSAP from jsdelivr and Google Fonts at render. It posts nothing. None of the upload or paid scripts were run. |
| Keys | The local path needs none. `ELEVENLABS_API_KEY` is in `system/.env`, but using it sends his audio to ElevenLabs: ask first. |
| Verified | `npm test` 11/11, `npm run check` 406 cards 0 errors. Real speech over a 1080x1920 testsrc: `cut-silences --apply` 11.00 -> 6.35 s; `apply-cuts` 6.35 -> 5.37 s, transcript re-timed; a frame after the cut within 2 frames of expected. `t1-stat-odometer` rendered in 95 s. |
| Cards | 406 (`vox-explainer` 106, `kallaway` 300). **Every card is hard-coded 1920x1080**; forced into 9:16 it letterboxes at 56% width. A vertical card has to be laid out again. |
| Limits | The cutters trust the transcript alone: WhisperX missed "reciprocate." and the head trim would cut a real word. Cut outputs carry no colour-range tag. The clone has its own `.claude/skills/` + `CLAUDE.md`, picked up only when working inside that folder. |
| Overlap | `toolbox/hyperframes-video-beats` IS this kit's skill. Its `hyperframes*` skills are older copies of the global ones. Its cutters lose to `autotrim.mjs` + `build-edit.mjs` (no speech-boundary padding). |
| When | A motion card for a horizontal / explainer piece: pick from `style-library/registry.json`, copy the card + `tokens.css`, fill `data-slot` text, `npx hyperframes lint <dir>` then `render`. For 9:16 use the motion as the design. `cut-mistakes/scripts/find-cut-candidates.mjs <words.json>` as a second opinion on retakes. |

## nextwork-projects/ai-video-editor-cooked — cloned 2026-10-21, measures a style well; its cut is for ONE speaker

"cooked." (MIT). Measures 3-6 videos into a style.json (cut rate, median shot, zooms, pans, caption
place/size/case/colour by OCR, face framing, wpm), then cuts a talking-head take and styles it with a Remotion
renderer. Clone `ce6ab73`; venv + models in its own `.home/` (943 MB) via `AI_EDITOR_HOME=<clone>/.home`. The Remotion
renderer (`setup.py remotion`, ~1 GB) is NOT installed.

Code read: Hugging Face, GitHub, yt-dlp, modelscope.cn (OCR models), Gemini / ElevenLabs only with a key, Modal / AWS
Lambda opt-in, and **Zernio** (`lib/ai_editor/post.py`) which POSTS to Instagram/TikTok/YouTube. Never run; Tal has no
Zernio account. `keys.py` reads `.env` in the working folder: never run it from the repo root.

Control test against `nas-explainer.md`:

| ref | ours | cooked |
|---|---|---|
| Matthew | 41 cuts, median 1.55 s, 183 wpm | 51 cuts, median 1.57 s, ~182 wpm ex end card |
| Kitchen | 86 cuts, median 1.13 s, 175 wpm | 105 cuts, median 1.15 s, ~179 wpm |

Median shot and wpm reproduce. Cut COUNT double-counts flash/whip transitions. Caption geometry matched; it MISSED the
gold key word. On a two-person street clip its retake finder flagged the STRANGER's replies as Tal's retakes and its
pause trim clipped "doing?". **Reach for it to measure a new reference (a second instrument). Never to cut his
conversations. Never `post`.**

## hypit-ai/hypit — installed 2026-10-21, LOCAL PATH WORKS (no key); generation needs paid services

| | |
|---|---|
| What it is | TypeScript video authoring for agents (Apache-2.0 + no hosted multi-tenant use / no resale). A video is SVML + SVS style sheets + an SVRun file; captions, B-roll and graphics are tied to WORDS in a `<script>`. Pages rendered in headless Chrome, joined with FFmpeg. Its own skill tells the agent to *generate* the material. |
| Where | `skills/toolbox/hypit/` at `0d36de9` (v0.3.1), own pnpm `node_modules`. Its `.claude/skills/hypit` symlinks are 18-byte stubs on Windows, so nothing loads. |
| Code read | Hosts: `hypit.ai/v1` (HypiHub OAuth, paid), beatapi, monid, pollo, hiapi, tokendance — media goes only to those generation services. No telemetry, posts nothing. `hypit auth` (Windows PasswordVault) never run. |
| Verified | Its 8 s chat example: 540x960 yuv420p tv, 65 s to render. A real 13.8 s clip (Yosef Rubin) with WhisperX words and house-style captions -> 1080x1920 yuv420p tv, loudness unchanged (-20.8 LUFS in and out); stills at 2.0 / 9.0 / 12.6 s show the right words. Alignment ~3 min, raster ~6 min. |
| Wiring | `chromePath` = Remotion's `chrome-headless-shell.exe` (its own Chrome not downloaded). WhisperX via its loopback service on the system Python (whisperx 3.8.6 = its pin). Its managed path needs `uv` (absent), not used. |
| Gotchas | A caption `tail-frames` past the clip end fails only AFTER the 3-min transcription. **pnpm workspace links loop back on themselves: never run a recursive `du`, `Get-ChildItem -Recurse` or delete sweep over `skills/`** — it recursed to "Filename too long" and hung. |
| Overlap | Word-anchored captions = `build-edit.mjs` + WhisperX, which renders in seconds. Word-placed B-roll = `find-broll`, except its B-roll is generated. |
| When | Rarely: a word-locked motion-graphics or chat/board composition that Remotion/HyperFrames make awkward, on his own footage, local. Never his normal edits; never its generation path without Tal agreeing a budget. |

## tenfoldmarc/video-edit-skill — installed 2026-10-21, WORKS with no key, one trap (HDR)

| | |
|---|---|
| What it is | `/video-edit` (a creator's own Claude skill): raw talking-head phone clips -> best take per line (EDL by hand from a speech map) -> `assemble.py` (1080x1920 30fps CFR, 4K punch-ins, asserts frame counts) -> `hyperframes remove-background` cutout -> a HyperFrames page (`build.py`, GSAP) with kinetic words BEHIND the head, 3 looks (bold / cool girl / cool dude), SFX, `check_cuts.py` before/after strip. |
| Where | `skills/toolbox/video-edit-skill/` at `3f01f2e`. `python scripts/setup.py` built `.venv` (faster-whisper, 301 MB). Run scripts with `.venv/Scripts/python.exe`; HyperFrames via `scripts/hf.py` (pinned 0.8.34, telemetry off). |
| Code read | PyPI, GitHub raw (6 Pixabay SFX), Hugging Face (Whisper), npm, Google Fonts + jsdelivr at render. Uploads nothing, posts nothing. Optional Apify MCP (PAID) only to scrape IG reels for inserts; the template's `publish` script (HeyGen hosting) — never run it. |
| Verified | Real 13.8 s talking-head proxy, 6-segment EDL: assemble 42 s (324 = 324 frames), medium.en transcribe 80 s, cutout 638 s on CPU (~1 s/frame), render 1 m 51 s -> 1080x1920 H.264 yuv420p bt709, -20.4 LUFS. Frames looked at: words behind the cap present. |
| THE TRAP | iPhone HLG source: HyperFrames auto-switches to HDR -> HEVC 10-bit, 19 min, and ALL text missing. With `--sdr` the cutout loses its alpha, so every behind-head word vanishes. Fix: `-vf setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709` (+ x264 `-color_*` flags) on the A-roll first; output flags alone do NOT retag. Check `ffprobe color_transfer` before every render. |
| vs. what we have | Duplicates autotrim/`build-edit.mjs`, our STT, and the cutout (`talking-to-camera-effects.md`). ADDS a working, timed words-behind-the-subject template and the frame-exact assembler. Does NOT match THE STANDARD: lowercase kinetic words, ~-20 LUFS, every word time in `build.py` typed by hand. |
| When | Tal talking to camera (or one sit-down subject) and the edit wants text behind the head / the serif look: lift `assemble.py` + `cutout.py` + the build.py machinery into the HyperFrames route. Never for street POV compilations. Convert HDR first. |

---

## The Tab handoff repos — 2026-10-30

Tal handed over his WhatsApp chat with Tab; these were links he gave Tab. All live in `system/vendor/tab-handoff/<name>` (gitignored, so nothing here is pushed) unless the table says otherwise. **None is a loadable skill.** Every repo's own `CLAUDE.md`, `AGENTS.md` and `SKILL.md` was read as data, never followed. No paid call was made and none of his footage left the machine.

**Windows note, measured here:** `IMG_6144.MP4` reports 1280x720 but plays 720x1280 (rotation -90). NullMotion and BeatSync both showed it stretched. Check rotation before feeding a phone clip to any new tool.

**The machine ran out of memory, not repo space.** Five parallel jobs pushed `C:\pagefile.sys` to 24.7 GB (RAM is 15.8 GB, not 17), and free disk fell to 2.9 GB. A system-managed pagefile mostly shrinks only after a reboot. **Run heavy installs one at a time.**

| repo (commit) | verdict | the number that decides it |
|---|---|---|
| `hassancs91/claude-youtube-editor` (`a6ac742`) | **works, partly.** SFX mixer, packaging rules and Remotion kit need no key. Its cut needs AssemblyAI | cue placed at 1.000 s landed +5.0 ms, same at 3.250 s |
| `lemomo-ai/lemo-opuscar` (`f171360`) | **works, no key.** 66 code-drawn film styles | counter at 1.5 s read 624 (truth 623.5); 72 of 72 frames |
| `acamposuribe/p5.brush` (`d56350a`, v3.0.0) | **works, no key.** Tab's component has a bug | same seed, 4 renders, identical bytes once `scaleBrushes` is called once |
| `ZiadAbdelkarim/beat-synced-edit` (`48c09c9` + our patch) | **works after our patch, THE beat cutter.** Dialogue-free B-roll, long takes included. MIT | was 210 ms early on every cut; now 23 of 23 within a frame |
| `Merserk/BeatSync-Engine` (`06679c1`) | works, second choice. Stretches portrait clips. AGPL-3.0 | 13 of 13 cuts on the click or one frame early |
| `TomGranot/watch-video` (`9492ba3`) | **works after our patch.** Frame-by-frame look at a short window | cuts back exactly at 3.7 / 8.3 / 8.8 s after the patch |
| `jordanrendric/claude-video-vision` (`4a4f990`) | works with limits, **not recommended** | timestamps are whole seconds; cuts 0.5 s apart both read 00:00:08 |
| `blixvip/NullMotion` (`1cd03c6`) | works with limits. To study a motion ad; skip for travel | export 19 frames in 6.4 s with the pane hidden |
| `chrcit/theo-thumbnail-checker` (`0dd71a6`) | works, **irrelevant**. Alerts on a changed thumbnail file, cannot rate one | same picture as PNG reads as "changed" |
| `yihui-dev/awesome-opus5-5-videos` (`92aee2f`) | reference only | 703 prompts, none a travel map, 3 worth keeping |
| `boona13/image-extender` (`4a8d674`) | **runs, does nothing without a paid key** (`OPENROUTER_API_KEY`). Tab's "failed" is half right | key dialog cannot be closed; 0 images |
| `wide-trace/open-higgsfield` (`b16a0ef`) | runs, paid Higgsfield front end, no licence file | 0 output; uploads become public URLs |
| `Autom8AI/Open-Higgsfield-AI` (`d32d022`) | runs, **never use**, no licence file | as shipped its dev server forwards sign-in to a stranger's Netlify |
| `cryptobirr/VideoClipFinder` (`85c56be`) | **cannot do its job.** Tab was right | 2 routes exist; `/health` is hard-coded |
| `CoCoSol007/beats-into-shapes` (`61d888b`) | **wrong kind of thing.** A Godot game with hand-typed tempos | no audio analysis at all |
| `storytold/effectcraft` (`ec7ced1`, 0.18.0) | **cannot run here.** Alpha; no Rust or C compiler, build estimated past 3 GB | nothing run. A signed 74.5 MB portable zip exists, not run (prebuilt binary, needs Tal's OK) |
| `Schabo/orbis-reframe` (`611d14e`) | **cannot run here.** Linux and Wayland only, X5 fully supported; its X4 doc says no X4 file examined | `CMAKE_CXX_COMPILER not set`; `main.cpp:114` forces Wayland; WSL not installed. The GPU is not the blocker |
| `sang-w00/IN2OUT` (`4503579`) | **cannot run.** Trained weights are gone. Non-commercial licence | Drive link 404, control links 200 |
| `seunghyuns98/VideoColorGrading` (`9d58052`) | **cannot run here today.** Failed loading its first weight file, before reaching the GPU. Use `grade_match.py`. Our low-VRAM patch was never executed; it needs float16 builds first (untested idea). Weights deleted | `OSError: The paging file is too small` (os error 1455); peak VRAM 0 MB, so whether it fits 4 GB is still unknown |

**Added by the travel session; run 2026-10-30 once Tal said yes.** No key, no paid call, not installed as plugins. Test file: one 70.5 s reel, plus a real 141.8 s fast-cut reel for shot mode.

| repo | verdict | the number that decides it |
|---|---|---|
| `taoufik123-collab/claude-watch` (`7711231`, MIT, + our patch) | **the `/watch` to keep, NOT live yet.** Crashed on arrival (`-vsync`, ffmpeg 9); `skills/toolbox/patches/claude-watch.patch`. One frame per shot, 0-10 s hook pass (20 frames at 2 fps), pacing, a report | 3.5 s for a 141.8 s reel. **Its cuts/min is wrong past its frame cap: said 33.9, true 42.3** (80 frames ÷ duration). Use the shot frames; take cut rates from `refscan.mjs` |
| `bradautomates/claude-video` (`03ceb42`, MIT) | works, second. No patch needed, 100 frames, has tests. No hook pass, no pacing | transcription needs its installer (`uv`, torch), or a Groq, OpenAI or Gemini key; not run |
| `guimatheus92/mcp-video-analyzer` (`e37c864`, MIT) | **runs, OCR fails on real footage. Do not keep** | control read at 91-95%; **the real title: 0 results.** Unfiltered it gave gibberish, only "ISRAEL" |
| `solarssk/video-describer` (`d99e017`, MIT) | **runs on Windows, despite its macOS badge.** Needs a paid provider to describe anything | frames + transcribe-only work, 125 s for 7 s on a busy machine. **Defaults to Polish:** "Hey, excuse me" came out "Słuchaj, sorry" |

- **Both `/watch` tools drop to evenly spaced frames under 10 detected shots.** On a slow clip you get a sample, not shots. Neither says so loudly: `claude-watch` prints "likely a static/screen-recorded source".
- **Without a key neither has words.** `claude-watch` only speaks Groq or OpenAI. Hook word timing was not tested.
- `claude-watch`: `setup.py` not run, hook not installed, Obsidian off (no vault found). Run the script directly: `python -I system/vendor/tab-handoff/claude-watch/scripts/watch.py <file> --out-dir <scratch> --no-whisper`.
- `mcp-video-analyzer`: `npm ci --ignore-scripts` skips its own ffmpeg, so it fails until the system one is linked in. Its cache went to the real `%LOCALAPPDATA%` even with a sandboxed home. Deleted. `node_modules` removed, source kept.
- `video-describer`: writes `.txt` next to the source, so **never point it at `FOOTAGE IN/`** without `--output-dir`. Its Whisper crashes if the calling script has no `__main__` guard on Windows. Set `language` and `output_language` in the config: both default to `pl`. Web page opens on 127.0.0.1 (HTTP 200, 58.7 s to start on a busy machine). `.venv` removed; no provider was called.

**Gyroflow and friends, pasted by Tal 2026-10-30 (*"maybe this can be good"*). Checked on GitHub, NOT installed:**

| repo | what is true | status |
|---|---|---|
| `gyroflow/gyroflow` | real, GPL-3.0, 9.6K stars, v1.6.3, Windows zip 45 MB | **Its supported list names Insta360 action cameras (OneR, OneRS, GO, Ace, Ace Pro) and no X series.** The pasted claim that it stabilises 360 `.insv` is not backed by its README |
| `gyroflow/gyroflow-plugins` | real, GPL-3.0, OpenFX and Adobe | needs Resolve or Premiere, neither in this pipeline |
| `Insta360Develop/Desktop-MediaSDK-Cpp` | real, official, no licence file, no release files | likely the true route for X-series stitching; not tried |
| `alex-plekhanov/insvtools` | real, Apache-2.0, last push 2024, Windows zip 6 MB | a file toolkit, not a stabiliser |
| `eltorio/reframe360XL` | GitHub answers "Moved Permanently" | not followed |

No `.insv` is in `FOOTAGE IN/`, so none of this can be tested until Tal hands over one raw clip.

`claude-watch` going live as `/watch` still needs Tal's yes and an exception in `CLAUDE.md`.

**Refused: `obi19999/smart-video-reframe` is a malware lure. Never download it.** Its README points every download link at a zip inside `src/utils/` and says to double-click an `.exe`. Both zips hold `Launcher.cmd`, `luajit.exe` (one also `lua51.dll`) and a ~309 KB opaque `.txt`: a loader plus hidden payload. The Python beside them is cover. Names listed only; nothing was extracted or run; the clone was deleted. So there is no comparison with Autocrop-vertical, which stays the tool. Same family as the fake Adobe repo above: **a README that says "download this zip" instead of "pip install" is the tell.**

**Not installed, by the travel session's instruction:** `kennyzheng-builds/seek-and-analyze-video` (paid upload, no licence) · `sheldonxxxx/insta360-ai-toolkit` (Mac, photo only) · `PumpGame/Insta360_Project_Tools` (no licence) · `aregrid/frame` (stale since May 2025).

### Word-synced SFX: `claude-youtube-editor`

The one thing Tab used it for, and the best new tool in this batch.

```bash
cd system/vendor/tab-handoff/claude-youtube-editor
venv/Scripts/python tools/mix_sfx.py <plan.json> --print     # cue sheet, no render
venv/Scripts/python tools/mix_sfx.py <plan.json>             # video copied, cues mixed in
```

Plan: `{"catalog":"media/library/sfx/catalog.json","render":{"preview":"<in.mp4>","out":"<out.mp4>","end_s":60,"duck":false},"events":[{"at_s":4.44,"sfx_id":"pop-reveal","gain_db":-13,"cue":"on the word"}]}`

Pop on the spoken word "Ethiopia" (voice -30.3 dB in a 0.3 s window):

| gain | duck | adds | file peak |
|---|---|---|---|
| -13 | on | +5.7 dB | -1.1 dBFS |
| -13 | off | +2.1 dB | -1.1 dBFS |
| 0 | on | +14.9 dB | **+2.6 dBFS, over** |
| 0 | off | +11.7 dB | **+1.1 dBFS, over** |

- **Ducking makes the cue LOUDER**, because `makeup=2` lifts the bus. Do not read "duck" as "safer".
- **Stay near -13 on street audio.** Its short-form table (0 to +7) assumes a loud studio voice, and clipped here.
- **Library licence: 32 of 36 clips are ElevenLabs-generated, commercial use "per the account's plan" of the author. Treat as not cleared.** Point the catalog at `tal-video-editor/assets/sfx/` before anything is posted.
- **`clean_voice.py` defaults to the PAID ElevenLabs route.** Always pass `--method rnnoise`. Even then RNNoise **deleted "Okay, so"** from a clip's first second (base-model transcript). House rule stands: no denoise.
- `/packaging` is text only and works: one title, 3 thumbnail levers. Rendering a thumbnail needs `GEMINI_API_KEY` and a face kit, so **no real thumbnail was made**. `thumb_scrim.py` works locally (top-left 126.9 -> 59.7, rest untouched).
- Its 144 Remotion shots render (`RuleCard`, 165 frames, 4 min 18 s on a busy machine), but they are 16:9 software UIs in a calm indigo brand, and they output **full-range `yuvj420p`**: the colour trap in CLAUDE.md §7. Not his world.
- `render_cuts.py` (NVENC, 4K60 10-bit) and `verify_cut.py` not run: both start from an AssemblyAI transcript. Worth copying: **mux audio once, never per segment** (15-20 ms drift per cut, its finding, not re-measured), and a second transcription of the render to catch ghost speech.
- Never run: `yt_upload.py`, `notion_sync.py`.

### Code-drawn inserts: `lemo-opuscar`

A page with `window.READY`, `window.render(t)` and `window.DUR` renders frame by frame. Installed by hand, NOT as its plugin (that would add a skill and clone to `~/lemo-opuscar`). `setup.sh` not run: it expects `.venv/bin`. Chrome is Remotion's, through `PLAYWRIGHT_CHROME`. Code-level hosts: local server only. Style demos fetch public data (NASA, Wikimedia, archive.org). `tools/publish.sh` and `release.py` are the owner's: never run.

```bash
cd system/vendor/tab-handoff/lemo-opuscar
export PLAYWRIGHT_CHROME="<system/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe>"
node core/render/video.mjs <folder> --size 1080x1920 --fps 30 --workers 3 --out <folder>/out.mp4
LEMO_COLOR=bt709 sh core/render/mux.sh <folder>/out.mp4 mix.wav final.mp4 30 0
```

- Vertical route + counter, 1080x1920, 3 s: exact frame count, right number at the right time. 57 s on a busy machine.
- **Always set `LEMO_COLOR=bt709`.** Without it: `yuvj420p`, `pc`, bt470bg. With it: yuv420p, `tv`, bt709, dark pixels 19 -> 31 as limited range should be.
- `transit-map` style stills looked at (3D metro map, flip counters) at 1920x1080 and 1080x1920. **Its fonts are not in git**: a missing one gives `[pageerror] A network error occurred`; `build.sh` lines 20-23 fetch them. **A full film of a style was not rendered.**
- `--size 1080x1920` reframes, it does not recompose. Check any style with text.
- `readcheck` fails every rolling counter. Report only the final number in `window.TEXTS`.
- `mux.sh` targets -14 LUFS and adds grain unless the 5th argument is 0.
- Copy techniques into a project folder; never build in `styles/`. Best fits: `transit-map`, `satellite-briefing`, `archive-lighttable`, `caption-news`, `visual-investigation`. Voice tier and music packs not installed.

### Hand-drawn marks: `p5.brush`

No network code; `dist/` ships built, so nothing was installed. Marker circle + arrow on a transparent 1080x1920 canvas, overlaid on a real frame and looked at: right place, street visible through. About 0.5 s a frame once warm, on software WebGL (`--use-angle=swiftshader`). Not added to `system/package.json`.

> **`scaleBrushes()` multiplies, it does not set.** Called each frame, strokes grew 2.9x per render (27,071 -> 77,775 -> 222,920 -> 644,372 pixels). Call it ONCE.

Tab's `BrushAnnotation.tsx` calls it inside `begin()`, twice per frame, and his pinned 2.2.3 has the same code (`src/stroke/stroke.js:235`). Read, not run; the kit was not changed. Tested version here is 3.0.0.

### Cutting to the beat: `beat-synced-edit`, patched by us

Tal, 2026-10-30, on the 210 ms bug: *"U NEED TO FIX THIS"*, because this job is mostly his 360 clips. Fixed in our copy: `skills/toolbox/patches/beat-synced-edit.patch`. **`system/vendor/` is gitignored, so re-apply the patch after any re-clone.**

Both tools use the same librosa tracker. Against click tracks at 120, 128 and 90 BPM: BeatSync found 336 of 336, beat-synced-edit 331 of 336, both about +20 ms. **Ignore the printed BPM on both** (said 117.5 for 120); the beat list is right.

**What the patch fixed, all found by running it:**

| defect as shipped | measured | after the patch |
|---|---|---|
| song and picture start at 0, first cut planned on the first beat | **every cut 210 ms before the sound** | +21.9 ms, 23 of 23 within a frame, no drift |
| one long take = one scene, each scene used once | **60 s take: 2 cuts, 2 s of video** | 24 cuts (`--max-scene`, default 2.5 s) |
| short scene shortened the clip, later cuts slid | by reading, then removed | every cut runs to the next beat, frames rounded once |
| folder of clips fell back to one file with no warning | by reading | full paths; a missing source now stops with an error |
| no size or colour handling | portrait clips | `--size 1080x1920` cover crop, 30 fps, yuv420p, `tv`, bt709 |
| a song with cover art failed | `render` exit, real DOOM track | `-vn` on the audio step |

My own first version froze the end of 6 cuts (about 0.7 s each) by running past the end of a clip. Caught with `freezedetect`, fixed by sliding the window back into the file, re-checked: 0 freezes.

**Real run:** 6 of his portrait phone clips + a real song, 24 cuts, 57.7 s, 1080x1920, 72 MB, 1 min 49 s, faces natural on a contact sheet, 0 frozen frames. 21 of 23 planned cuts detected within a frame; the other 2 were not found by the scene detector at threshold 0.2 (likely near-identical pieces of one take; not proven).

```bash
cd <scratch folder>
B="system/vendor/tab-handoff/beat-synced-edit"
PYTHONUTF8=1 $B/.venv/Scripts/python $B/beat_map.py song.mp3 -o song_beatmap.json
PYTHONUTF8=1 $B/.venv/Scripts/python $B/clip_tag.py <folder or file> -o clips.json --max-scene 1.5
PYTHONUTF8=1 $B/.venv/Scripts/python $B/plan_edit.py song_beatmap.json clips.json --full --beat-stride 4 -o edl.json
PYTHONUTF8=1 $B/.venv/Scripts/python $B/render_edit.py edl.json -a song.mp3 -v <any one clip> --size 1080x1920 -o out.mp4
```

- **Not tested on a real 360 export: no such file is on this laptop.** It needs a flat export (`.mp4`), never a raw `.insv`. A 60 s take is simulated with a colour-drifting clip.
- **Enough footage or the edit stops early, with a warning**: each piece is used once. 60 s of footage at 2.5 s pieces gives 24 cuts. Lower `--max-scene` or raise `--beat-stride` (cuts every Nth beat).
- Pieces of one take are chosen by energy, not by what is in them. It has no idea what makes a good shot. Look at every cut.
- Music only: source sound is dropped. **Never for a conversation.** `--html` reports load Chart.js from a CDN.
- `-ss` is before `-i`, so a variable-frame-rate phone clip is not proven frame-exact in source. Cuts in the OUTPUT are.
- Loudness is the song's: not levelled. Logo, captions and his own final checks are still needed.

**`BeatSync-Engine`, for comparison, unpatched:** 13 of 13 cuts on the click or one frame early, no drift. But portrait clips came out **stretched** into 1280x720 (seen on a contact sheet; likely cause: it reads the size without the rotation flag), 212 MB for 20 s (`.mkv`, `pcm_s24le`), only 7 shots in 20 s, it lists every clip twice on Windows, and it is AGPL-3.0. Installer, web UI, GPU code and Qwen tagging not run. Keep it as a second opinion on the beat list.

### Frames and analysis: `watch-video`, `claude-video-vision`

Neither watches video. Both are frames + transcript, our method. `watch-video` is fully local with no speech-to-text; `skills/toolbox/patches/watch-video.patch` fixes two real bugs (it threw away all 3 detected cuts; overview labels up to 0.125 s early). Its one new use: every frame of a short window, which caught a one-frame flash on its exact label. `make-contact-sheet.mjs` and `refscan.mjs` cover the rest.

```bash
SKILL="system/vendor/tab-handoff/watch-video/skills/watch-video"
python "$SKILL/scripts/run.py" sample-frames "<video>" --output-dir "<scratch>/win" --mode every-frame --start 4.9 --end 5.1
```

`claude-video-vision`: **an unconfigured `video_watch` on a local file silently downloaded a 3.1 GB model** before failing with `spawn whisper-cli ENOENT`. Its `.mcp.json` runs `npx ...@latest`, which is not the code read here. Do not register it.

### The rest, what to remember

- **NullMotion:** `skills/toolbox/patches/NullMotion.patch` (`-vsync` -> `-fps_mode`, the ffmpeg 9 break again). Grey "Part 1/2/3" boxes on your own clips. No map, counter or travel template.
- **awesome-opus5-5-videos:** 207 of 703 are tweet captions, 66 are full prompts. Keep `twoclipping-496100` (paper-map unfold, plus a real-footage rule: re-encode `-g 1`, wait for `seeked`, every style a pure function of time), `twoclipping-747965` (night and day photo crossfade), `0xkarmi-129839` (6 counters drawn from the frame number).
- **Open-Higgsfield-AI:** the screen says "Muapi", the code calls `api.kie.ai`. Do not run plain `vite` there.
- **IN2OUT:** `skills/toolbox/patches/IN2OUT.patch` removes mmcv; base model loads. Last run died with `CUDA error: unknown error` while the machine was out of memory; cause not established. Apply patches here with `--ignore-whitespace`.
- `system/.venv-audio` has CPU-only torchvision beside CUDA torch: `deform_conv2d` fails there.

## Story engine stack, evaluated 2026-10-30

Tal: *"Do not blindly install everything. What is needed???!"* This overrides "install all of it" for this list. Maintenance and licence read from the GitHub API that day. Laptop: RTX 3050 Ti, 4 GB VRAM, 17 GB RAM, no docker.

| repo | last push | licence | verdict |
|---|---|---|---|
| `Breakthrough/PySceneDetect` | 2026-10-27 | BSD-3 | USE, already installed |
| `mlfoundations/open_clip` (added) | 2026-10-29 | MIT-style, read it | USE, loads CLIP and SigLIP weights |
| `openai/CLIP` | 2026-03-25 | MIT | SKIP, same weights through open_clip |
| `google/siglip` | not found | | No such repo. SigLIP lives in `google-research/big_vision`; use the weights through open_clip |
| `facebookresearch/faiss` | 2026-10-29 | MIT | USE `faiss-cpu`, not GPU |
| `SYSTRAN/faster-whisper` | 2026-10-25 | MIT | USE, already installed; Groq stays first for bulk |
| `m-bain/whisperX` | 2026-10-22 | BSD-2 | USE for word timing |
| `remotion-dev/remotion` | 2026-10-30 | own licence, free for individuals and up to 3 employees | USE, already here, animated captions only; check the licence if the team grows |
| `librosa/librosa` | 2026-10-06 | ISC | USE, beats and onsets |
| `opencv/opencv` | 2026-10-30 | Apache-2.0 | USE, already installed, optical flow |
| `pgvector/pgvector` | 2026-10-28 | PostgreSQL-style | SKIP for now, needs a server; no gain for one user |
| `OpenGVLab/InternVideo` | 2026-07-02 | Apache-2.0 | SKIP for now, research code, not tried on 4 GB. Revisit only if action matching tests poorly |
