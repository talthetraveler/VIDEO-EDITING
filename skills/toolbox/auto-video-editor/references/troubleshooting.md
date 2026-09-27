# Troubleshooting

These are the failures worth knowing about in advance, because in every one of
them the tool still runs, still prints a cheerful summary, and still produces a
playable video. Nothing errors out. That is exactly what makes them expensive to
find later.

## Contents
- [The edit is barely shorter than the original](#the-edit-is-barely-shorter)
- [The watcher won't stay stopped](#the-watcher-wont-stay-stopped)
- [Killing caffeinate leaves the editor running](#killing-caffeinate-leaves-the-editor-running)
- [Works by hand, fails as a service](#works-by-hand-fails-as-a-service)
- [status says running when it isn't](#status-says-running-when-it-isnt)
- [Files sit in 1_Incoming untouched](#files-sit-in-1_incoming-untouched)
- [Videos are 0 bytes / online-only](#videos-are-0-bytes--online-only)
- [Speech gets cut off / cuts sound clipped](#speech-gets-cut-off)
- [A failed video is retried forever](#a-failed-video-is-retried-forever)

---

## The edit is barely shorter

**Symptom:** a video full of obvious pauses comes back 10–15% shorter instead of
the expected 20–45%. The summary reports very few speech chunks — often just one.

**Cause:** `USE_VAD` is off. Without voice-activity detection, Whisper stretches
a word's end-timestamp across the pause that follows it. A single word can be
reported as lasting four seconds. Since the timeline is built from gaps *between*
words, and the stretched word leaves no gap, the silences become invisible and
survive into the cut.

**Confirm it** by comparing what ffmpeg hears against what the transcript claims:

```bash
ffmpeg -i input.mov -af silencedetect=noise=-32dB:d=0.4 -f null - 2>&1 | grep silence_
```

If that lists silences the editor did not remove, this is the cause.

**Fix:** set `USE_VAD = True` in CONFIG. On a real test clip this took the same
video from 15% shorter to 46% shorter — the feature going from broken to working.

## The watcher won't stay stopped

**Symptom:** the user quits it in Activity Monitor and it reappears within
seconds, with a different PID each time.

**Cause:** `KeepAlive` is `true` in the plist. Killing the process is precisely
how you tell launchd to relaunch it. This is not a bug, but it reliably reads as
one.

**Fix:** either stop it the way launchd expects:

```bash
launchctl unload ~/Library/LaunchAgents/io.tmsmedia.autovideoeditor.plist
```

or set `KeepAlive` to `false` so manual quitting works. The bundled plist ships
with `false` for this reason.

## Killing caffeinate leaves the editor running

**Symptom:** the user quits the watcher in Activity Monitor, but videos dropped
into `1_Incoming` still get edited.

**Cause:** the job runs `caffeinate -i <python> auto_video_editor.py --watch`, so
Activity Monitor shows **two** rows. Killing `caffeinate` does not take the
Python process with it — the editor keeps running, just without the keep-awake,
so the Mac can now sleep mid-render.

**Fix:** quit the process named **`Python`**. That one exits cleanly and
`caffeinate` follows it. `status_watcher.command` detects this half-state and
warns about it.

## Works by hand, fails as a service

**Symptom:** `--file` and `--watch` work perfectly in Terminal. Under launchd,
nothing is ever edited, and `watcher.log` shows ffmpeg or ffprobe errors — or the
duration check silently returning 0.

**Cause:** launchd hands processes a minimal `PATH` — roughly
`/usr/bin:/bin:/usr/sbin:/sbin`. Homebrew's `/opt/homebrew/bin` is not in it, so
`ffmpeg` and `ffprobe` cannot be found, even though they work fine in a shell
that sourced the user's profile.

**Fix:** the plist must set PATH explicitly:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
</dict>
```

`/usr/local/bin` covers Intel Macs, where Homebrew installs elsewhere. Verify the
way launchd sees it, not the way your shell does:

```bash
env -i PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin which ffmpeg ffprobe
```

## status says running when it isn't

**Symptom:** a status check reports the watcher is running, but no videos are
processed and no Python process exists.

**Cause:** the check tested whether the *job* is listed rather than whether the
*process* is alive. With `KeepAlive` false, a stopped job stays registered and
still appears in `launchctl list`, with `-` in the PID column instead of a
number.

**Fix:** check for the real process:

```bash
pgrep -f "auto_video_editor.py --watch"
```

Treat "is it registered" and "is it running" as two separate questions, because
with these settings they genuinely are. `status_watcher.command` reports both.

## Files sit in 1_Incoming untouched

Work through these in order:

1. **The watcher isn't running.** `status_watcher.command`. This is by far the
   most common cause, especially with the ship default of never auto-starting.
2. **Still syncing.** The watcher waits for a file's size to stop changing before
   touching it, so a partially-synced video is skipped until it settles. Look for
   the Dropbox check-mark.
3. **Not a recognised video.** Only `.mov .mp4 .m4v .mkv .avi .webm` are handled.
   Dotfiles are ignored.
4. **Wrong Dropbox account.** On machines signed into both personal and Business
   Dropbox, autodetect may pick the other one. Check the path printed at startup
   in `watcher.log` and set `DROPBOX_BASE` in CONFIG if needed.

## Videos are 0 bytes / online-only

**Symptom:** the log says a video "is still downloading from Dropbox (0 bytes)"
and it never gets edited. In Finder the file looks like it has a normal size.

**Cause:** Dropbox is keeping the file online-only — a placeholder that reports
its real size but occupies nothing on disk. The watcher reads a plain local
folder and knows nothing about Dropbox, so a placeholder is just an empty file.

**Confirm it:**

```bash
find "<Dropbox>/AutoVideoEditor" -type f -size 0
```

Anything listed is a placeholder rather than a real file.

**Fix:** in Finder, right-click the `AutoVideoEditor` folder → **Make Available
Offline** (older Dropbox versions: Smart Sync → Local). The watcher leaves such
files queued rather than failing them, so once the real bytes arrive it picks
them up on the next poll with no action needed.

Also check the user isn't uploading to **Camera Uploads** instead of
`1_Incoming` — that folder is never watched.

## Speech gets cut off

**Symptom:** words sound clipped at the start or end of a cut, or the pacing
feels breathless.

Try these in order:

- Raise `MARGIN` (`0.06` → `0.10`) for more breathing room around each chunk.
- Raise `MAX_PAUSE` (`0.40` → `0.60`) to keep natural beats between sentences.
- Remove `so`, `like`, `actually`, and `right` from `FILLERS`. These double as
  ordinary sentence words, and cutting every "So..." that opens a thought is the
  most common reason a first edit sounds choppy. The per-video log prints a
  sample of what was cut — check it before guessing.
- Try `WHISPER_MODEL = "medium.en"`. Better word timings, slower.

## A failed video is retried forever

**Symptom:** the same filename reappears in the log on every restart.

**Cause:** processed files are tracked in memory only. A successful edit moves
the original to `3_Originals`, which is what actually prevents reprocessing. A
video that fails to edit stays in `1_Incoming` and is retried each time the
watcher restarts.

**Fix:** read that video's log in `logs/` to find the real error — usually a
corrupt or truncated file — then move it out of `1_Incoming` by hand. This is
mostly harmless, but it does mean a bad file can generate a lot of log noise.
