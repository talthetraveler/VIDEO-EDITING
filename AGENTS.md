# AGENTS.md — for Codex and any other AI opening this folder

This repo is Tal Dooreck Aloni's video-editing system (`@talthetraveler`,
"Showing you Israel beyond headlines"). It turns his raw street footage into
finished vertical videos. It was built with Claude Code; it is written so any
coding agent can run it.

## Read these first, in this order

1. **`CLAUDE.md`** — the master rules. Despite the name, they apply to every AI,
   not just Claude. Where anything here disagrees with it, `CLAUDE.md` wins.
2. **`skills/tal-video-editor/SKILL.md`** — THE STANDARD: how every cut is made
   (story, captions, camera, look, sound, the quality check).
3. **`skills/tal-video-editor/LESSONS.md`** — every defect found so far and its
   cause. Read before rebuilding anything.
4. **`skills/tal-video-editor/MASTER-PROMPT.md`** — the whole system as one prompt.

Tal never names a tool or a skill. "Edit this" means: read the rules above, pick
the format from the footage, cut, verify, show him.

## Set up a new computer — one button

Double-click **`SETUP EVERYTHING.cmd`** (Windows), or run:

```bash
python system/setup/setup_everything.py          # install + self-test every tool
python system/setup/setup_everything.py --check  # only report what works
```

It installs every free tool the pipeline uses (Node packages, ffmpeg, Whisper,
WhisperX, DeepFilterNet, Resemble Enhance, Demucs, ClearerVoice, pyannote,
face blurring), then tests each one on real audio and prints a table. The
programs are downloaded from their makers; none of them live in this repo.

Keys are NOT in the repo. `system/.env` (Groq, Hugging Face) and
`system/projects/_publish/shortsync.config.json` are gitignored; ask Tal for them.

## The pipeline (run from the repo root)

```bash
node system/scripts/autotrim.mjs <slug> <clip-id[:from-to]>...   # cut boundaries from speech
node system/scripts/build-edit.mjs <slug>                         # render
node system/scripts/selfreview.mjs <EDIT.json> <render.mp4>       # the gate: non-zero = don't send
```

Audio tools (in their own Python env, `system/.venv-audio`):

```bash
system/.venv-audio/Scripts/python system/tools/audio-ai.py enhance  <in.wav> <out.wav>   # Resemble Enhance: clean + restore a voice
system/.venv-audio/Scripts/python system/tools/audio-ai.py music    <in.wav> <out.wav>   # Demucs: strip music/background, keep voices
system/.venv-audio/Scripts/python system/tools/audio-ai.py separate <in.wav> <outdir>    # ClearerVoice: split two overlapping speakers
python system/scripts/diarize.py <clip-id>                                                   # pyannote: who is talking when
```

The everyday noise reduction (DeepFilterNet) already runs inside `build-edit.mjs`
on every render — never stack a second denoiser on top without listening.

## Rules no agent may skip

- **Never cut anyone off**; a question and its answer are one unit.
- **Captions:** bold white ALL-CAPS, lower-middle, one at a time, translated to English.
- **Verify the rendered file**, never the transcript. You cannot "watch" video:
  extract frames and look at them, and say that is what you did.
- **Source footage is read-only.** Never delete, move or re-encode originals.
- **Delivery:** preview to Tal → he approves → upload to Frame.io. Nothing is
  posted or uploaded without his yes.
- **GitHub is public.** Before every push run the check in `CLAUDE.md` §0b; no
  video, audio, images, transcripts or keys may ever be pushed.
- When Tal corrects something, add it to `LESSONS.md` the same day.
