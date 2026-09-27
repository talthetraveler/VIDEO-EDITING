# FRAME.IO + TRANSCRIPTION — STATE HANDOFF

Written 2026-09-20 so a fresh session can resume without replaying the
conversation. Everything here is **verified against the live API / machine**,
not assumed.

---

## 1. AUTHENTICATION — DONE. DO NOT TOUCH.

**Working.** OAuth Single-Page App credential + PKCE, official `frameio` SDK.

| | |
|---|---|
| Credential type | **OAuth Single-Page App** (not Native App, not S2S) |
| Client ID | `741f4a1117f443feabbd738408165c51` |
| Client secret | **none — SPA/public client has none** |
| Redirect | `https://localhost:8080/callback` (HTTPS required even on localhost) |
| Token state | `projects/_frameio/token-state.json` (ACL: owner-only) |
| Refresh token | present — auto-refreshes, no re-login needed |

- Login: `node system/scripts/frameio-login-spa.mjs`
- Status: `node system/scripts/frameio-login-spa.mjs --status`

**Dead ends — do not retry:**
- **Server-to-server is impossible.** Adobe replies `unexpected client_secret
  parameter` — the client genuinely has no secret.
- **The old Native App credential (`84dbc380…`) cannot complete in a browser.**
  Its only registered redirect is the custom scheme
  `adobe+8dbd241e…://adobeid/<client_id>`. Windows routes that correctly (proven:
  handler logged `INVOKED … argv_present=true`), but **Chrome silently refuses
  to hand a redirect to an external protocol**, dead-ending on `/ims/fromSusi#`.
- A Windows protocol handler is still registered at
  `HKCU\Software\Classes\adobe+8dbd241e…`. Harmless. Undo in
  `projects/_frameio/UNDO-registry.txt`.
- Self-signed cert for localhost lives in `projects/_frameio/certs/`. Chrome
  shows a privacy interstitial on the callback; the code can be delivered to the
  local server directly instead of clicking through.

---

## 2. SDK CALLING CONVENTIONS — probed, non-obvious

```js
// POSITIONAL args. Passing {accountId} returns 422 "Invalid value".
client.workspaces.index(accountId)
client.projects.accountProjectsIndex(accountId)
client.folders.list(accountId, folderId)   // SUBFOLDERS ONLY
client.files.list(accountId, folderId)     // FILES ONLY — need BOTH calls
client.files.show(accountId, fileId, { include: "media_links.thumbnail,..." })
```

- Responses are wrapped: `{ response: { data: [...] } }`
- **`include` must be a COMMA-SEPARATED STRING.** An array returns only the
  first link; `{query:{include}}` is ignored silently.
- **Media links are NOT returned by default** — you must ask for them.
- **The V4 API does NOT expose transcripts.** `include=transcript` → 422
  "Unexpected field"; `/transcript`, `/transcription`, `/transcripts`,
  `/captions` → 404 "no route found". Frame.io transcription is UI-only.
- **The `video_h264_180` rendition has NO AUDIO STREAM** (ffprobe-confirmed).
  Use **`efficient`** (640×360, H.264 + AAC) for anything involving sound.

---

## 3. ACCOUNT MAP

```
Tal's Account  81f57ddf-de4c-40fb-bd14-afef691a48b2
└── Tal's Workspace  a077a88a-748f-49db-937e-83cf644cb730
    ├── SOCIAL ACCORDS    74af6ae5-…  root 2bebb2e1-65e4-48fa-a2d3-0b41a3b298d6
    │   └── SHOT IN ISRAEL
    │       ├── WHAT  MAKES YOU HAPPY   45cb31d5-b047-4a1c-bfa9-3adc1032818e
    │       ├── ABRAHAM ACCORDS, KIDNESS TEST, HUG FOR STRANGER,
    │       │   FLOWERS FOR STRANGERS, SHALOM/SALAM, NOTES TO STRANGERS,
    │       │   CONVERSATIONS, FINAL VIDEOS, feed homeless, … (19 folders)
    ├── TAL STUDIOS       6c15a4e0-…
    └── THE SIDE QUESTER  8845f104-…
```

**Note:** folder names contain stray double spaces (`WHAT  MAKES YOU HAPPY`).
Normalise whitespace before matching. There is **no "Assets" level** — it is
`SOCIAL ACCORDS → SHOT IN ISRAEL → …` directly.

### WHAT MAKES YOU HAPPY — 57 files, 2,565MB originals

| Sub-shoot | Files |
|---|---|
| clips from Levi video | 15 |
| FABIAN INTERVIEWS | 2 |
| LIELLE interviews (what Makes You Happy And Message For The World | 5 |
| RANDOM STRETS | 35 |

**These look like different shoots with different people — possibly more than
one video.** Decide from the footage; do not force one format.

---

## 4. LOCAL TRANSCRIPTION — AUDITED. GOOD ENOUGH. DO NOT ADD AN API.

**Installed:** WhisperX 3.8.6 · faster-whisper 1.2.1 · ctranslate2 4.8.2 ·
torch 2.8.0 **+cpu** · transformers 4.57.6 · **pyannote.audio 4.0.7** ·
whisper.cpp (`main.exe` + ggml base/base.en/small/small.en/**medium**)

**CUDA is NOT available** — `torch 2.8.0+cpu`, 0 devices, 8 CPU threads.

### Benchmark — 5 proxies, 233s of audio in 70s

| Clip | Duration | Processing | RTF | Lang conf |
|---|---|---|---|---|
| video-4955 (long) | 180.2s | 40.9s | **0.23×** | en 0.98 |
| IMG_1213 | 41.1s | 14.0s | 0.34× | en 0.57 |
| IMG_7718 | 7.6s | 4.8s | 0.63× | en 0.51 |
| IMG_8622 | 3.3s | 5.4s | 1.64× | en 0.73 |
| IMG_7711 | 0.6s | 4.9s | 8.48× | en — |

**Overall real-time factor: 0.30×** — 3.3× faster than realtime on CPU.

**Verdict: fast enough. Keep the local stack. Do not add ElevenLabs or Groq.**
A ~30-minute shoot transcribes in ~10 minutes, unattended, free, offline.

**The one real weakness — short clips.** Fixed model overhead (~4-5s) dominates
anything under ~10s, and language-detection confidence drops (0.51–0.73 vs 0.98
on the long clip). This produced **one Korean false positive** across 14 clips.

Mitigations, in order of preference:
1. Batch short clips into one concatenated audio stream with an offset map
2. Force `--language` when the shoot's language is known
3. Only consider an API if diarization or short-clip accuracy becomes blocking

**Diarization:** `pyannote.audio 4.0.7` IS installed — memory saying otherwise
is outdated. Untested here; the pretrained pipeline usually needs a HuggingFace
token. Verify before promising speaker separation.

---

## 4b. TRANSCRIPTION PROVIDER — GROQ IS THE DISCOVERY DEFAULT (2026-09-20)

**Groq `whisper-large-v3-turbo` is the default discovery engine.** Local
WhisperX is NOT replaced — it is the precision/fallback layer and the authority
for final caption alignment on clips that survive into an edit.

Benchmarked on 8 clips that already had local transcripts (`scripts/stt-benchmark.mjs`,
raw text comparison in `cache/stt-benchmark.json`):

| | local WhisperX | Groq turbo |
|---|---|---|
| aggregate RTF | 0.30x | **0.009x** (~33x faster) |
| all 57 clips | ~3 min | **8.8 s** |
| cost | free | **$0.0096** total |

Groq was also **more accurate on this footage**, which was the deciding factor:
- Local hallucinated Korean on 3 near-silent clips (`MBC 뉴스 김성현입니다` invented
  from street noise). Groq returns plausible English.
- Local turned a real Hebrew line into noise. Groq recovered it:
  `לראות יהודי כמוך המחייך עושה לי שמח` — "seeing a Jew like you, smiling,
  makes me happy." A usable moment local had hidden.
- Local invented `"You live here in Dishon now?"`; Groq: `"...in Israel now?"`.

**Key lives in `.env` at repo root (gitignored, chmod 600). Never printed,
never written into a transcript, scrubbed from error messages (`scrub()`).**

### Rules baked into the scripts
- **Audio only, 16 kHz mono FLAC** (`cache/audio/`, 3.3MB for 14.4 min). Video is
  never uploaded — we already hold the proxy locally.
- **Word timestamps are OFF for discovery** (latency). Opt in with `--words`
  for candidate clips / final alignment only.
- **Silence gate** (`volumedetect` max < -45dB) skips paying for silent clips,
  but marks them `usable_as_broll: true` — they are NOT dropped from the library.
- **Cache is keyed to `source.version_key` = frameio id + size + proxy bytes.**
  Unchanged bytes are never re-paid. A replaced asset invalidates only itself.
  Legacy pre-Groq transcripts are grandfathered as valid.
- **Bounded concurrency (4)**, 429/5xx backoff honouring `retry-after`,
  rate-limit headers captured per response. Synchronous endpoint, NOT Batch —
  we care about time-to-first-cut, not bulk price.
- Language hint available (`--language`) but **not forced** — this footage is
  genuinely mixed and a wrong hint is worse than none.
- Fallback for a bad important clip: `--model whisper-large-v3` on that clip,
  then `--provider local`.

```bash
node system/scripts/frameio-transcribe.mjs                    # groq, cached skipped
node system/scripts/frameio-transcribe.mjs --only <id> --words --model whisper-large-v3
node system/scripts/stt-benchmark.mjs                         # local vs groq
```

---

## 5. PIPELINE SCRIPTS (all working)

```bash
node system/scripts/frameio-login-spa.mjs              # auth (done; refreshes itself)
node system/scripts/frameio-test.mjs ["PATH/TO/FOLDER"] # read-only connection test
node system/scripts/frameio-discover.mjs "SHOT IN ISRAEL/WHAT MAKES YOU HAPPY" --fetch
node system/scripts/frameio-transcribe.mjs [--limit N] [--force]
```

`scripts/lib/frameio.mjs` + `scripts/frameio.mjs` are the older hand-written
client/CLI from before the SDK — **superseded by the SDK scripts above**, kept
only for the `deliver` upload logic which still needs porting.

### Cache (never redo this work)
```
projects/_frameio/cache/
  discover-index.json     57 files: ids, sizes, buckets, all media links
  proxies/                57 efficient renditions, 172MB (vs 2,565MB originals)
  transcripts/            per-clip JSON: ALL 57 DONE (groq turbo)
  audio/                  16kHz mono FLAC (3.3MB) — wav/ is obsolete
```

---

## 6. WHERE WE ARE / NEXT STEPS

**Done:** auth, read-only verification, discovery, 57 proxies pulled (6.7% of
original bytes), transcription running.

**Next:**
1. Finish transcribing all 57 (was ~14/57 at handoff — resume, it caches)
2. Rank moments across the transcripts: strongest hook, funniest, most
   emotional, most surprising, best character, strongest ending
3. **Visually inspect shortlisted clips** via scrub sheets / thumbnails —
   transcript strength is not enough
4. Decide format from the footage using `tal-video-editor` + the reference
   library. It may be more than one video.
5. Download ONLY selected originals
6. Edit with the Tal system
7. Upload review to `SOCIAL ACCORDS → SHOT IN ISRAEL → FINAL VIDEOS → Edited by
   Claude` (folder needs creating or locating — **not yet verified to exist**)
8. Tal leaves timestamped Frame.io comments → read via `client.comments.index`
   → revise → re-upload as a **version stack**, preserving history

**Never:** modify/rename/move/delete source footage. Never download all
originals. Review versions do not go to Frame.io until they are worth reviewing.

---

## 7. FRESH-SESSION BOOTSTRAP

Read, in this order:
1. `CLAUDE.md` (§1 non-negotiables, §7 machine truths)
2. `TAL-EDITING-BIBLE.md`
3. `skills/tal-video-editor/SKILL.md` (the router; Frame.io is Step −1)
4. **this file**
5. the format preset + references the current video actually needs — nothing else

Do **not** reload the old conversation.
