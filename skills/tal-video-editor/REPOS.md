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
`git clone` at `toolbox/brag/` is now redundant but kept, because it carries
the `docs/` and `examples/` the installed skill does not. Nothing was deleted.

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
