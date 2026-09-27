# Auto Video Editor

Drop a talking-head video into a folder. Your Mac removes the **silences** and
the **filler words**, and puts the finished cut in a "Completed" folder.

Every take is kept, in full and in order — if you say something twice, both times
survive. The tool only tightens; it never decides which take was the good one.

Everything runs on your own machine. Nothing is uploaded anywhere.

---

## One-time setup

1. **Double-click `setup.command`.** If macOS says it's from an unidentified
   developer, right-click it → **Open** → **Open**. That's only needed once.

That's everything you need to edit videos by hand. The Dropbox part below is
optional — it's only for sending videos from your phone.

Setup installs the video engine and the transcriber into a private folder next to
the script. It takes a few minutes.

---

## Editing one video

```bash
./.venv/bin/python auto_video_editor.py --file "/path/to/clip.mov"
```

You get `clip_edited.mp4` next to the original, and a summary of what was
removed. **The very first run downloads the transcription model (about 500 MB),
so it needs internet and takes a few extra minutes.** After that it's offline.

---

## Optional: editing from your phone

This lets you record on your phone, drop the video in a folder, and get the
finished cut back — without touching the Mac.

1. **Install the Dropbox app on your Mac** and sign in — dropbox.com/install.
   The website by itself isn't enough; Dropbox has to be syncing on the Mac.
2. **Start the watcher once** (`start_watcher.command`). It creates the four
   folders below inside your Dropbox.
3. **Tell Dropbox to keep those files on your Mac.** In Finder, right-click the
   `AutoVideoEditor` folder → **Make Available Offline**.

   Don't skip this one. If Dropbox keeps your videos in the cloud instead of on
   the Mac, the editor sees empty files and nothing happens — with no obvious
   error to tell you why.
4. **Install the Dropbox app on your phone**, signed into the same account.
   To send a video: share it → Dropbox → choose `AutoVideoEditor/1_Incoming`.

   Careful: **Camera Uploads is a different folder.** Videos that auto-upload
   there won't be edited. The video has to go into `1_Incoming`.
5. **Try it once.** Upload a short clip from your phone, wait for the Dropbox
   check-mark, and the finished cut appears in `2_Completed` a few minutes later
   and syncs back to your phone.

Your Mac has to be awake with the watcher running. If it's asleep or stopped,
videos just wait in `1_Incoming` until it's back — nothing is lost.

## The folders

Four folders appear inside your Dropbox:

```
Dropbox/AutoVideoEditor/
├── 1_Incoming     ← put raw videos here
├── 2_Completed    ← finished edits appear here
├── 3_Originals    ← your untouched originals
└── logs           ← what got cut, per video
```

Upload to `1_Incoming` from your phone, wait, collect the result from
`2_Completed`. Your original is never deleted — it's moved to `3_Originals`.

To have this run in the background, double-click **`install_service.command`**
once. Then:

- **`start_watcher.command`** — start editing
- **`stop_watcher.command`** — stop
- **`status_watcher.command`** — is it running?

It never starts on its own — not at login, not after a reboot. It runs only when
you start it. While it's stopped, videos you drop in just wait; nothing is lost,
and they're picked up next time you start it.

If you stop it from Activity Monitor, quit the process named **`Python`**. The
`caffeinate` process next to it is just the keep-awake helper.

---

## Making it cut more or less

Open `auto_video_editor.py` in any text editor. Everything adjustable is in the
**CONFIG** block at the top:

- **`MAX_PAUSE = 0.40`** — pauses longer than this (in seconds) get cut. Lower
  for punchier, higher for a more relaxed pace.
- **`MARGIN = 0.06`** — breathing room around each kept chunk. Raise it if cuts
  sound clipped.
- **`FILLERS`** — the words that get removed. Add or delete freely.
- **`WHISPER_MODEL = "small.en"`** — change to `"medium.en"` for slightly better
  accuracy, at the cost of speed.

Save the file and run it again. If the background watcher is running, stop and
start it so it picks up your changes.

**If the edit sounds choppy,** the usual culprit is the filler list: it includes
`so`, `like`, `actually`, and `right`, which are also ordinary sentence words.
Cutting every "So..." that opens a sentence can sound breathless. Delete those
four from `FILLERS` and try again. The log in `logs/` shows exactly which words
were cut.

---

## If something's wrong

- **The edit is barely shorter than the original** → open `auto_video_editor.py`
  and check that `USE_VAD = True` in CONFIG. With it off, the tool can't see the
  pauses it's meant to cut.
- **Nothing happens when I drop a file in** → run `status_watcher.command`. If
  it says STOPPED, run `start_watcher.command`. Otherwise make sure the file
  finished syncing (green check in Dropbox) and is a video file.
- **`ffmpeg: command not found`** → run `setup.command` again.
- **It found the wrong Dropbox** → set `DROPBOX_BASE` in the CONFIG block to the
  folder you want, in quotes.
- **Something was transcribed wrong** → longer pauses and clearer audio help.
  `"medium.en"` is more accurate if you don't mind waiting longer.
