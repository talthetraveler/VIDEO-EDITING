# Setting up the Dropbox side

Read this when the user wants the record-on-phone → finished-cut-on-phone
workflow. Skip it entirely if they only want to edit local files with `--file` —
Dropbox is a convenience, not a dependency, and nothing about the editing needs
it.

Walk the user through this rather than handing them the list. Most of the steps
happen in Dropbox's UI on two devices, and the failure modes are quiet: the
folders look right and files simply never get edited.

## What has to be true

The whole design rests on one thing: **the Dropbox desktop app keeps a real copy
of `1_Incoming` on the Mac's disk.** The watcher is just reading a local folder.
It has no idea Dropbox exists. If Dropbox stores those files in the cloud instead
of on disk, the watcher sees empty placeholders and edits nothing.

## Steps

1. **Install the Dropbox desktop app on the Mac** and sign in — dropbox.com/install.
   The web site alone is not enough; there has to be a syncing app on the Mac.

2. **Pick the right account.** If they're signed into both a personal and a work
   (Business) Dropbox, note that Business paths look like
   `~/Company Name Dropbox/First Last`, and `~/Dropbox` is often a symlink to it.
   The script reads `~/.dropbox/info.json`, which covers both, but on a
   dual-account machine it may choose the one they didn't mean. Confirm by
   running `--watch` and reading the path it prints, or check directly:
   ```bash
   cat ~/.dropbox/info.json
   ```
   Set `DROPBOX_BASE` in CONFIG to override.

3. **Create the folders** by running the watcher once — it makes all four on
   startup. Then confirm they exist on disk.

4. **Force the folders to stay on disk.** In Finder, right-click the
   `AutoVideoEditor` folder → **Make Available Offline** (older Dropbox versions
   call this Smart Sync → Local). This is the step people skip, and it is the one
   that breaks everything, so do it explicitly rather than assuming the default.

   Verify it, don't trust it. An online-only file reports its real size in Finder
   but occupies nothing on disk:
   ```bash
   find "<Dropbox>/AutoVideoEditor" -type f -size 0
   ```
   Any video listed there is a placeholder, not a file.

5. **Set up the phone.** Install the Dropbox mobile app and sign into the same
   account. To send a video: share sheet → Dropbox → choose
   `AutoVideoEditor/1_Incoming`. On iPhone the Files app works too, with Dropbox
   enabled under Locations.

   Warn them that Camera Uploads is a *different* folder — videos auto-uploaded
   there will never be edited. The video has to land in `1_Incoming`.

6. **Test the real loop, from the phone.** Upload a short clip, wait for the
   Dropbox check-mark on the phone, then watch the Mac:
   ```bash
   tail -f "<project folder>/watcher.log"
   ```
   The edit appears in `2_Completed` and the original moves to `3_Originals`.
   Have them confirm the finished file syncs back down to the phone — that
   round-trip is the thing they actually care about, and it's worth seeing work
   once before trusting it.

## Things that will bite

**The Mac has to be awake.** The service runs under `caffeinate -i`, which stops
idle sleep while it runs — but a closed lid on battery still sleeps, and the
watcher isn't running at all unless it was started. Videos uploaded meanwhile
just queue up in `1_Incoming` and get processed when the Mac is back and the
watcher is running. Nothing is lost; it just isn't instant.

**Big videos take a while to sync.** The watcher waits for the file size to stop
changing before touching a file, so a still-uploading video is skipped and
retried, not half-edited.

**A 0-byte file is handled gracefully.** The watcher logs that it's waiting and
leaves the file queued rather than failing it. If it stays at 0 bytes, the
offline setting in step 4 is missing.

**Shared folders are a common trap.** If `1_Incoming` lives in a folder shared by
someone else and the user has removed it from their own sync, nothing arrives
locally. Ask about this if files appear on the web but never on the Mac.
