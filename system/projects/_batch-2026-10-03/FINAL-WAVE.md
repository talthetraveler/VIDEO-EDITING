# FINAL WAVE (Tal, 2026-10-05, going to sleep)

> "caption 5, fix the rest, and upload to frame trials. If you didn't upload
> anything else, do it. Upload everything there and that's it. Good night."

Every remaining video in the batch goes to full quality with **caption style 5**
and is uploaded by the orchestrator to
`SOCIAL ACCORDS / SHOT IN ISRAEL / FINAL VIDEOS / APPROVED FOR TRIALS`.
No further approval round. Editors do NOT upload; they report each final as it
finishes and the orchestrator checks the frames and uploads.

## Recipe for each video on your list (one build at a time)

1. `edit.json`: add `"captionStyle": "gothic"` (caption option 5: Century Gothic
   Bold, white caps, dark outline, about two words a line; in the shared
   `render-caption.py` / `build-edit.mjs` since commit 9525460). Nothing else
   about the cut changes unless your list says so.
   - A project-local builder copy must be REGENERATED from the current shared
     builder so it has the new style (and the HLG tone-map already in it).
   - Films that draw captions outside the builder (e.g. a post-step) must use
     the same face: `C:/Windows/Fonts/GOTHICB.TTF`.
2. Full quality, 1080x1920: fetch only the regions the cut uses at NATIVE
   resolution into a project-scoped folder `cache/hq-<slug>/` (the shared
   `fetch-hq.mjs` caps height at 2160, which halves portrait 4K originals, and
   pulls one long span per clip, which has timed out). Working example:
   `system/projects/ek-goodnews-ghana/_make-final-tools.mjs`.
3. DeepFilterNet with `-D` (project-local builder copy, see
   `ek-kt-shop-owner-5/_make-final-builder.mjs`) so there is no 30 ms hole at
   the head of each beat. Films on a `LOCATION-SOUND` bed: rebuild the bed from
   the full-quality audio for the same windows.
4. Blur (where the film has one, and wherever full resolution makes a child's
   or a "don't publish" person's face readable that the 540 preview hid):
   re-derive at full resolution, strength scaled to the frame
   (`ek-christian-telaviv/blur-merge.py`), verify by FRAME INDEX on every
   frame of each blurred slice + 2 either side of every cut. Confirm the
   blurred output file exists. Delete unblurred full-size intermediates.
5. -14 LUFS on the whole timeline (one gain + limiter, video stream copied),
   true peak <= -1 dBTP, yuv420p / tv.
6. Check on the finished file: frame count == duration x 30, no frozen
   frames; contact sheet vs the last preview (same framing); every caption
   read once as English in the new style (two-word lines must not split a
   name or leave a dangling "TO"/"THE" at a line end - fix the segment if so);
   caption-sync 0 adrift; words-chopped check.
7. Name: `<EXISTING_NAME>_FULL.mp4`. Report it IMMEDIATELY (path + the check
   numbers + any caveat), then start the next one. If a build dies with
   out-of-memory, wait and retry; other editors are rendering too.

Machine: 8 cores, 17 GB RAM, ~45 GB disk free. Clean `beats_*`/`tmp_*`.
Never upload, never commit. Nothing negative; children who are strangers stay
blurred or out (LESSONS 81); "don't publish" people muted + blurred (LESSONS 78).
