# DELIVERY — finished cut → Frame.io. Built and tested 2026-09-21.

Tal reviews on Frame.io and comments there. A render sitting on this disk is
not delivered.

```
select footage → edit → render MP4 → QA gate → deliver() → verify → mark complete
```

One command does the last four:

```bash
node system/scripts/finish.mjs <slug>                      # QA, then upload
node system/scripts/finish.mjs <slug> --name "JAMAICA HELP.mp4"
node system/scripts/finish.mjs <slug> --force-deliver      # ONLY for a flag I looked at
```

Upload alone, with no QA gate:

```bash
node system/scripts/frameio-deliver.mjs <file.mp4> [--name "Display.mp4"]
node system/scripts/frameio-deliver.mjs --resolve          # prove the folder resolves
```

---

## WHERE IT GOES

`SOCIAL ACCORDS / SHOT IN ISRAEL / FINAL VIDEOS / EDITED BY CLAUDE`
(`da1be559-d19b-4b41-8fb9-cdff73c1eacd`)

The id is **resolved from the live folder tree every time**, never hardcoded —
a stale id could put a render inside a source folder. `--folder` is refused
unless `--allow-any-folder` is also passed.

## THE V4 UPLOAD FLOW — verified live, not from docs

1. `files.createLocalUpload(account, folder, { data: { name, file_size } })`
   → a File record plus `upload_urls: [{ url, size }, …]`
2. `PUT` each presigned url with **exactly** that part's `size` bytes:
   - `x-amz-acl: private`
   - `Content-Type: video/mp4`
   Both headers are inside the presigned signature. Either one wrong is a 403
   `SignatureDoesNotMatch`, with no useful message.
3. Poll `files.show` until Frame.io reports `transcoded`.

**The SDK (frameio@4.2.6) does steps 1 and 3 but has no helper that moves
bytes.** Step 2 is a plain `fetch` PUT. That is the documented flow, not a
workaround — do not go looking for the missing SDK method again.

### Facts that cost time to find

- **`media_type` in the create body is a 422** — *"Unexpected field"*. The body
  takes `name` and `file_size` only. Frame.io derives the type from the
  filename extension, so the extension must be right.
- **Multipart starts above 10 MB, and the parts are NOT equal.**
  Measured: 20 MB → 2 × 10485760 · 120 MB → 7 parts of 17975589 (last 17975586)
  · 600 MB → 32 × 19660800. **Every real video is multipart.** Splitting the
  file evenly across N urls — what the old hand-written client did — uploads
  the wrong bytes to every part after the first. Always use the `size` the API
  returned, and refuse to upload if the parts do not sum to the file size.
- `media_links.efficient` is **only 640×360** here, same as the 180p proxy.
  It is not a quality tier. Full quality means the original (4K) — see
  `scripts/fetch-hq.mjs`.

## VERIFICATION IS PART OF DELIVERY

Successful PUTs are not proof. `deliver()` does not return until the file
exists, sits in the folder that was targeted, carries the expected name, and
Frame.io reports it accepted the media. Both test uploads came back
`transcoded` with byte counts matching the local file exactly.

## ON FAILURE

Nothing is marked delivered, the local MP4 is kept, and the output names the
stage:

```
RENDER COMPLETE
FRAME.IO UPLOAD FAILED
Local file: projects/…/X.mp4  (kept — nothing was deleted)
Stage: upload part 2/4
Error: HTTP 403 …
```

Transient failures (429, 5xx, network) retry with backoff. A 403 does **not**
retry — the signature is wrong and retrying only burns the upload window.

## SOURCE FOOTAGE STAYS READ-ONLY

`scripts/lib/frameio-deliver.mjs` exposes no delete, rename, move or overwrite.
It can only create a new file in the delivery folder.

## MANY CUTS WAITING — THE APPROVE PAGE (2026-10-03)

Tal: *"show me everything so I can just decide what to move to the frame io."*
One video goes into the chat. When several sessions have left dozens waiting,
open the page instead:

```bash
node system/scripts/approve-server.mjs        # http://localhost:4300 (.claude/launch.json: approve-page)
```

It scans `system/projects/` on every load and shows the NEWEST render of each
project, marks what is already on Frame.io (`delivered.json`, plus the batch
manifests for uploads made under a display name), and has one tick box per
video. His ticks land in `system/projects/_frameio/approve-picks.json`. **A
tick is the approval; the page uploads nothing.** After he says "send my
picks": read that file, render each pick full quality, deliver with
`frameio-deliver.mjs`, verify.

A project with a `blur-rules.json` never shows an unblurred render: `X_BLUR.mp4`
wins where it exists (eden-story), `_PREBLUR` / `_noblur` files are never
listed, and a render older than the rules file is hidden.

## 2026-10-04 — "EDITED BY CLAUDE" NO LONGER EXISTS ON FRAME.IO

`frameio-deliver.mjs` with no `--folder` now fails ("Could not resolve folder
path"). FINAL VIDEOS holds: FOR TAL TO REVIEW, FOR MONTANA TO REVIEW, TO
REVIEW, APPROVED FOR TRIALS, FINAL VIDEOS TO POST, TO POST ON OTHER PLATFORMS,
POSTED (Posted to trials / main / TikTok). Tal names the folder when he
approves; pass it explicitly:

```bash
node system/scripts/frameio-deliver.mjs <file> --name "TITLE.mp4" \
  --folder "SHOT IN ISRAEL/FINAL VIDEOS/APPROVED FOR TRIALS" --allow-any-folder
```

"Move it to Frame final videos … trial reels" (EDEN V12) went to APPROVED FOR
TRIALS. A project with a face blur uploads its `_BLUR` file by path — never
through `finish.mjs`, which reads `edit.json`'s `out`, the UNBLURRED build.

## Moving a file between Frame.io folders (measured 2026-10-04)

`client.files.move(accountId, fileId, { data: { parent_id: <folderId> } })`.
`{ body: { parent_id } }` is a **422 "Unexpected field: body"** and moves
nothing. Verify with `files.show(...).parent_id` afterwards. Tal asked for the
finished balloon video to be moved from `TAL STUDIOS / FINAL VIDEOS!` into the
shoot's own folder, `TAL STUDIOS / STRANGER HELI BALLOON`: a finished cut may
live next to its footage when he says so. Adding a file there is fine; the
source clips in that folder are still never renamed, moved or deleted.
