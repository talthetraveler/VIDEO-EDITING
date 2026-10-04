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
