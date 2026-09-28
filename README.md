# VIDEO-EDITING

Videos in. Videos out.

```
FOOTAGE IN/     drop raw clips here, one folder per shoot ("2026-09-23 shoot")
VIDEOS OUT/     finished cuts come out here, same folder name as the shoot
assets/
  references/   reference VIDEOS, one folder per source
                (tal-own-reels, nas-daily, instagram-harvest, voiceover-broll-drive-...)
  analysis/     what was MEASURED from them (contact sheets, transcripts, findings)
  prompts/      image / video generation prompts
skills/         everything I know about editing for you
system/         the machine. you never need to open this.
```

Your iCloud Photos library is synced by iCloud for Windows to
`C:\Users\taldo\iCloudPhotos\Photos` and is readable from here as a footage
source (`CLAUDE.md` §7).

Then say **"edit this"**. Nothing else — no skill name, no format, no settings.

## How I decide what to do

There is **one** skill: `skills/tal-video-editor/`. It is the only door.

Inside it, `SKILL.md` carries the whole standard inline — story and pacing,
captions, camera and cuts, the look, audio, and the quality check. Loading that
one file is enough to cut a video correctly.

`skills/toolbox/` holds 49 other editing tools (pruned from 140 on 2026-09-27;
see `skills/toolbox/PRUNED.md`). **They are not skills and are
not offered as choices.** Many of them declare triggers like *"use this skill
every time the user wants to create a video"* — with several competing for one
trigger, the wrong one could win silently and quietly lose your framing, grade
and caption rules. They are now reference material that `SKILL.md` reaches into
on purpose, indexed by sub-problem. Nothing was deleted.

## The loop

1. You drop footage in `FOOTAGE IN/`
2. I transcribe, classify the format, and cut it
3. **A low-res preview appears in the chat**
4. You say yes
5. Only then does anything go to Frame.io

A render on this disk is not delivered, and a preview is never uploaded.

## Restoring on a new machine (Windows)

GitHub holds the **system**, not the content: skills, scripts, doctrine, every
edit spec. Footage, renders, transcripts, keys and the heavy installs stay off
it on purpose (see `.gitignore`). To rebuild, tested 2026-09-28 against a fresh
clone:

```bash
git clone -c core.longpaths=true https://github.com/talthetraveler/VIDEO-EDITING.git "videos to edit"
```

`core.longpaths` matters: a few toolbox paths are ~130 characters and a clone
into a deep folder hits Windows' 260-character limit. Without it the checkout
fails silently: the clone arrives with **zero files** on disk.

Then:

1. `cd "videos to edit/system" && npm install` (Remotion, whisper.cpp, sharp...)
2. Copy `system/.env.example` to `system/.env` and fill in the keys.
3. Frame.io: `system/projects/_frameio/credentials.example.json`, and
   `skills/tal-video-editor/reference/FRAMEIO-STATE.md` for the auth flow.
4. Re-clone the third-party toolbox skills: `skills/toolbox/CLONES.md` has
   each URL and pinned commit.
5. `system/bin/`: `yt-dlp.exe` and `deep-filter.exe` (DeepFilterNet), both
   from their GitHub releases. Full ffmpeg: `winget install Gyan.FFmpeg`.
   Python 3.12 + `pip install whisperx scenedetect`.
6. SFX: `skills/tal-video-editor/assets/sfx/CREDITS.md` lists every sound
   (Pixabay).
7. `.claude/skills` is a junction to `skills/`:
   `mklink /J .claude\skills skills` (no admin needed).

Check it worked: `node system/scripts/test-caption-timing.mjs` prints
`0 off the voice, 0 too brief, 0 over silence`.

---

Cleared 2026-09-24: every previous render, local and on Frame.io, was deleted
at your instruction. Starting from the skill, not from the old output.
