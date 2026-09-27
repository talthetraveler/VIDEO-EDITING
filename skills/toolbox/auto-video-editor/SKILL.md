---
name: auto-video-editor
description: Sets up a local, automatic talking-head video editor on a Mac. It transcribes video with faster-whisper, cuts filler words ("um", "uh", "you know") and silent pauses, re-renders with ffmpeg, and can watch a Dropbox folder so videos edited on a phone come back finished. Everything runs offline on the user's machine — no APIs, uploads, or tokens. Use this skill whenever someone wants to automatically remove filler words, dead air, ums and ahs, or silences from video; wants a talking-head, vlog, course, or podcast video tightened up; asks for a local/offline/private alternative to Descript, Opus Clip, AutoPod, or Timebolt; wants a folder that auto-edits videos dropped into it; or asks to install, tune, troubleshoot, start, or stop that watcher. Also use it when someone complains their edits are "barely shorter" or the watcher "won't stop" — those are known failure modes documented here.
---

# Auto Video Editor

Turns a rambling talking-head recording into a tight cut, entirely on the user's
Mac. It transcribes the speech, drops filler words, removes silent pauses, and
re-renders in one ffmpeg pass.

It deliberately does **not** decide which take was good — every take is kept, in
full and in order. The tool only tightens.

Two ways to run it:
- `--file <path>` — edit one video, write `<name>_edited.mp4` next to it.
- `--watch` — watch a Dropbox folder forever and edit whatever lands there.

The watch mode exists so someone can record on their phone, drop the clip into
Dropbox, and get a finished cut back without touching the Mac. It reads the
Dropbox desktop app's already-synced folder on disk, so there is no Dropbox API,
no OAuth, and no tokens.

## Bundled files

Everything needed is in `scripts/`. Copy the whole directory into the user's
project folder — the scripts locate themselves relative to their own location,
so they work from any path.

| File | Purpose |
|---|---|
| `auto_video_editor.py` | The editor. All tunables are in the CONFIG block at the top. |
| `setup.command` | Installs ffmpeg + a private `.venv` with faster-whisper. |
| `install_service.command` | Registers the background watcher as a launchd agent. |
| `start_watcher.command` / `stop_watcher.command` / `status_watcher.command` | Day-to-day control of the watcher. |

The `.command` extension makes these double-clickable in Finder, which matters —
many people who want this tool are not comfortable in a terminal.

## Installing it

Work through these in order and **verify each step before moving on**. Run the
commands yourself rather than handing the user a list; the failure modes here are
quiet ones, and catching them costs a single command.

1. **Homebrew.** `which brew`. If missing, print the official installer line and
   stop — installing Homebrew needs the user's password, so they must run it:
   ```
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. **ffmpeg.** `brew install ffmpeg` (skip if `ffmpeg -version` already works).
3. **Project folder.** Put `auto_video_editor.py` and the `.command` files
   together in one folder. Ask the user where they want it if it isn't obvious.
4. **Python environment**, created inside that folder:
   ```
   python3 -m venv .venv
   ./.venv/bin/pip install --upgrade pip faster-whisper
   ```
   `setup.command` does steps 1–4 for a user working alone.
5. **Test on a real video before anything else.** The first run downloads the
   Whisper model (~500 MB, needs internet); that is expected and one-time.
   ```
   ./.venv/bin/python auto_video_editor.py --file "/path/to/clip.mov"
   ```

Judge the test by whether the output got meaningfully shorter and still contains
all the speech. A good result on ordinary talking-head footage is roughly 20–45%
shorter. **If it comes back only a few percent shorter, stop and read
`references/troubleshooting.md` — that is the signature of the VAD failure**,
the single most common way this tool silently underperforms.

To confirm nothing was lost, re-transcribe the output and compare:
```
./.venv/bin/python -c "
import importlib.util
s=importlib.util.spec_from_file_location('ave','auto_video_editor.py')
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
print(' '.join(w['word'].strip() for w in m.transcribe('OUTPUT.mp4')))"
```

## Dropbox folders

If the user wants the record-on-phone workflow, **walk them through
`references/dropbox-setup.md`** rather than just creating the folders. It covers
installing the desktop app, choosing between personal and Business accounts,
forcing the folders to stay on disk, the phone side, and how to test the
round-trip. The steps live in Dropbox's UI on two devices and fail quietly when
skipped — the folders look correct and videos simply never get edited.

The one that matters most: Dropbox can keep files **online-only**, as 0-byte
placeholders. The watcher reads a local folder and knows nothing about Dropbox,
so a placeholder looks like an empty file. It logs that it's waiting and leaves
the file queued (it does not fail it), but nothing gets edited until the real
bytes arrive. `Make Available Offline` on the `AutoVideoEditor` folder is the
fix, and it's worth doing explicitly instead of hoping the default is right.

Skip all of this if they only want `--file` on local videos. Dropbox is a
convenience, not a dependency.

The script finds Dropbox by reading `~/.dropbox/info.json` (which covers personal
*and* Business installs, where the path is something like
`~/CompanyName Dropbox/First Last`), then falls back to `~/Dropbox` and
`~/Library/CloudStorage/Dropbox`. It creates four folders under the base:

```
<Dropbox>/AutoVideoEditor/
├── 1_Incoming     ← drop raw videos here
├── 2_Completed    ← finished cuts land here
├── 3_Originals    ← originals are moved here, never deleted
└── logs           ← one log per video, saying what was cut
```

If autodetect picks the wrong account, set `DROPBOX_BASE` explicitly in CONFIG.
Dropbox is just a convenience — any synced folder works, and so does a plain
local one. Nothing about the editing depends on Dropbox.

## Running it in the background

`install_service.command` installs a launchd agent
(`io.tmsmedia.autovideoeditor`) that runs the watcher under `caffeinate -i`, so
the Mac stays awake while it works, and logs to `watcher.log` in the project
folder.

It ships with both `RunAtLoad` and `KeepAlive` set to **false**, meaning it never
starts by itself and never relaunches when quit. The user starts it with
`start_watcher.command`. This is the right default: a video editor that silently
consumes CPU at every login surprises people, and one that respawns when killed
feels broken.

Some users will want it always-on instead. Flip `RunAtLoad` to `true` in the
plist to start it at login, and `KeepAlive` to `true` to have it restart if it
dies. Warn them about the tradeoff: with `KeepAlive` true, Activity Monitor and
`kill` stop working, because launchd relaunches it within seconds. Then
`launchctl unload` becomes the only way to stop it.

**These two flags change which commands work**, which is worth getting right
before telling anyone how to control it:

| `RunAtLoad` | What starts it |
|---|---|
| `true` | `launchctl load` starts it; so does logging in. |
| `false` | `launchctl load` only *registers* it. It needs an explicit `launchctl start io.tmsmedia.autovideoeditor`. |

The bundled `start_watcher.command` already handles this — it loads the job if
needed, then starts it explicitly.

Check state with `status_watcher.command`. It reports whether the process is
actually running, which is not the same as whether the job is listed: with
`KeepAlive` false, a stopped job still appears in `launchctl list` with `-` in
the PID column. Anything checking status must `pgrep` for the real process, or it
will cheerfully report "running" when nothing is.

To uninstall the service completely:
```
launchctl unload ~/Library/LaunchAgents/io.tmsmedia.autovideoeditor.plist && rm ~/Library/LaunchAgents/io.tmsmedia.autovideoeditor.plist
```

## Tuning

All knobs are in the CONFIG block at the top of `auto_video_editor.py`. Changes
take effect on the next run; restart the watcher to pick them up.

| Setting | Default | Effect |
|---|---|---|
| `MAX_PAUSE` | `0.40` | Gaps longer than this (seconds) get cut. Lower is punchier, higher is more relaxed. |
| `MARGIN` | `0.06` | Breathing room kept around each speech chunk. Raise it if cuts sound clipped. |
| `FILLERS` | see file | Words removed. Edit freely. |
| `WHISPER_MODEL` | `small.en` | `medium.en` is more accurate and slower. Use a non-`.en` model for other languages. |
| `USE_VAD` | `True` | Leave on. See troubleshooting — turning this off quietly breaks silence cutting. |

The filler list ships with `so`, `like`, `actually`, and `right` included. These
are the ones to raise proactively with the user, because they are also ordinary
sentence words — cutting every "So..." that opens a thought can make speech sound
clipped and breathless. Suggest removing them from the list if the first edit
sounds choppy, and check the per-video log, which prints a sample of what was
actually cut.

## When something looks wrong

Read `references/troubleshooting.md`. It covers the failures that are easy to
misdiagnose because the tool still produces a working video: barely-shorter
edits, a watcher that won't die, ffmpeg vanishing under launchd, and files that
sit in `1_Incoming` untouched.

`references/dropbox-setup.md` covers the phone-to-Mac loop end to end, including
the online-only trap and how to verify the round-trip actually works.

`references/user-guide.md` is written for the end user rather than for Claude —
hand it over, or paste it into their project folder as `README.md`, once the
install is verified.
