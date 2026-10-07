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
| `Alisa0808/vox-director` | **registered 2026-10-08, NOTHING RUN: needs a paid Atlas Cloud key that is not here.** Only the ffmpeg/Pillow stages are local. See below | `toolbox/vox-director/` (not loadable, on purpose) |

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
