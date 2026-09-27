# Clean cuts

Two jobs, different tools:

- **Fillers + dead air** → `npm run tighten` (automated, local, keeps every take).
- **Retake selection + precise boundary placement** → the procedure below,
  reverse-engineered on the head-image reel. `tighten` does NOT do this yet; when
  footage has retakes, do it by the spec here. Porting it into
  `scripts/tighten.mjs` is a known TODO.

Rule 2 governs everything here: **never cut him off before he finishes. When in
doubt, cut LATER.** More builds have been rejected for early cuts than anything
else.

---

## 1. Filler + pause pass — `npm run tighten`

```
npm run tighten -- <video> --slug <slug> [--model small.en] [--max-pause 0.4]
npm run tighten -- --batch <folder> --slug <slug> [--model small.en]
```

`--batch` runs every video in a folder and also writes
`public/footage/<slug>/<slug>.index.json` — each clip's transcript, kept spans,
and **greeting hits** (space-insensitive: `shabbat shalom`, `salam alaikum`,
`marhaba`, `welcome`, `god bless you`, …). This is the entry point for
cutting kindness-greeting reels from a shoot — see
`formats/kindness-greetings.md`.

- Local whisper.cpp (`@remotion/install-whisper-cpp`), no API. Model cached in
  `~/.cache/video-studio/` (must be a space-free path — the installer can't quote).
- Cuts filler words (`um, uh, like, you know, i mean, so, basically, actually,
  right`, …) and any gap `> MAX_PAUSE` (0.40 s). `MARGIN` 0.06 s kept around each
  chunk. Same logic as the original auto-video-editor; pure functions in
  `scripts/lib/autocut-core.mjs` (also copied into this skill's `scripts/`).
- Writes `public/footage/<slug>/<name>.keep.json` (spans), `.captions.json`
  (`Caption[]`), `.cut.log`, and a `<Pascal>Cut.tsx` composition. `<AutoCut>`
  plays the kept spans — **no ffmpeg re-encode**, the Remotion render is the cut.
- `so`, `like`, `actually`, `right` are also real words. If the first pass sounds
  clipped, trim them from `FILLERS` and re-run. Check `.cut.log` for what went.
- **< 8 % shorter** = the VAD/timestamp failure. Try `--model medium.en` or a
  lower `--max-pause`.
- Hand-tune by editing `keep.json` directly.

## 2. Retake selection

Whisper deletes disfluencies, so a clean transcript proves nothing. Three
detectors on the CUT take's word timings — **take the union**:

- **Stretched word** — any word longer than `max(0.62 s, 4.2 × median word
  length)`. Highest precision by far (3 real stutters, 0 false positives across
  six takes). Run it first; needs no model.
- **Speech density** — per 1.6 s window, words-per-second-of-speech under
  `0.62 × his median`. Noisy: long words (*painkillers*, *comparison*) fire it.
  Cross-check, don't trust alone.
- **Repeated opening** — consecutive segments sharing ≥ 3 opening words.

Then **dense-sweep** each flagged span (0.8 s window, 0.25 s step) to find where
the clean take starts. **Always keep the LAST complete take.**

## 3. Placing the boundary

Two thresholds off the 5 ms amplitude envelope:

- **SPEECH gate** = `p99.5 − 26 dB`
- **END-OF-SPEECH** = the envelope drops within **8 dB of the noise floor (`p2`)
  and STAYS there 120 ms.** Peak-relative gates find the end of the *loud* part;
  his tails decay below them and cuts land early. On one take the true end was
  **1.6 s** after a peak-gate cut.

Rules:
- A boundary may only move **through sub-floor samples**, and must stop before the
  next take's onset.
- **Scan from the cut**, never from a point past it, or you measure the retake's
  end instead of this take's.
- **Air after the cut**: `sentence` 0.35–0.60 s · `clause` 0.25–0.45 s ·
  `splice` (mid-sentence join) ≈ 0.
- Take the tail first. If a retake blocks the tail, take the rest from the next
  HEAD with a **220 ms stand-off from the dropped speech**. That stand-off is a
  HEAD-only rule — applying it to the tail makes the decay check unsatisfiable.

## 4. Verify every junction (mandatory)

Transcribe SOURCE `[cut − 2.0, cut]` in isolation:
1. It must **end with that segment's last words** and contain **no word of the
   next take**.
2. A second read to `cut + 0.6` must show the **final word unchanged** (proves it
   isn't truncated).
3. Level at the cut **≥ 20 dB below his speech peak**.
4. **≥ 60 ms since real voice.**

## 5. Two failure modes that read clean and are not

- **Fragment** — a boundary inside a sound keeps half a word. One build shipped a
  "but" = discarded take's "b" + kept take's "ut". **Tell:** moving the cut
  earlier makes a word *vanish* from the transcript.
- **Wrong side** — the waveform can't tell "last kept word" from "first discarded
  word". Auto-moving boundaries out of sounds clips real onsets. **Report it and
  decide by transcribing**, don't let a script guess.

## 6. Audio finish (when the format calls for it)

- **Voice**: `resemble-enhance`, blended **75 % wet / 25 % original**. 100 % wet
  sounds robotic. CPU only, ~2 min/take. Two-pass `loudnorm` (single-pass goes
  dynamic silently); `aresample + pan` for stereo (`-ac 2` from mono costs 3 dB).
- **Never transcribe the enhanced audio for captions** — time captions off the
  pre-enhancement cut. Enhancement preserves timing to 0 ms.
- **Voice** `loudnorm I=-16:TP=-2`; **music bed** `I=-31` (15 dB under, never
  ducking). Beds from the approved palette only — see `house-style.md`.

---

## 7. A-roll semantic judgment (from ChatCut `talking-head-guide`)

§2–§5 above are the **detection + boundary** mechanics. This is the **which-take,
which-words** judgment that sits on top. Adapted from OpenChatCut's
`talking-head-guide` (`vendor/OpenChatCut/`, AGPL — knowledge only). It's a
semantic pass: read the transcript, decide, then apply `proj-op` cuts. Not a
heuristic — `scripts/ingest.mjs` does a crude k-gram first pass, this is the real
one.

**Edit by complete semantic units.** Move/keep/delete whole sentences, ideas,
answers, or steps. Don't cut a half-sentence just because a few words match.

**Retakes / repeated attempts** — keep ONE complete, natural version:
1. Confirm it's actually a retake (same intended idea re-attempted) — not
   emphasis, a rhetorical beat, or a second pass that adds new info/tone.
2. Define the complete version to keep — it may need a lead-in, connector,
   section marker, topic setup, contrast, subject, or conclusion. Those aren't
   filler when the kept content depends on them.
3. Cut only the failed/covered part. **The cut starts at the repeated or failed
   idea, not automatically at the earlier transition or setup.** If earlier
   speech has useful context the kept version doesn't repeat, keep it.
4. Usually prefer the LATER attempt (closer to intended take) — but not
   mechanically. If the later one is missing context/subject/conclusion, keep the
   more complete earlier version or splice its lead-in.
5. Never stitch unfinished fragments from different attempts into one artificial
   sentence.
   - `There, there's no After Effects…` → drop the abandoned restart → `There's no After Effects…`
   - `And secondly … and secondly, we're introducing a new UI.` → keep ONE lead-in → `And secondly, we're introducing a new UI.` (not: bare `We're introducing a new UI.`)

**False starts / unfinished fragments** — remove only when it clearly carries no
useful info (abandoned thought with a complete version later; a dangling
"this is actually…"). Do NOT remove an imperfect sentence that still has useful
info, a lead-in that supplies a needed subject/object, or setup/contrast/tone.

**Fillers** — `um uh er ah` safe to bulk-remove. `so like then just right`
context-dependent: keep when it carries sequence, continuation, contrast, cause,
reference, or natural tone; keep if removing it makes the splice sound hard.

**Pauses** — default to **compress, not zero**. >0.8–1 s → ~0.3 s. Between
sentences keep 0.3–0.5 s. Around topic shifts/emphasis keep slightly longer.
Normal in-sentence breaths: leave them. A long pause before a removed retake goes
with it. Never create a black `[gap]` on the only video track as a pacing pause —
cover it with B-roll / a card, or keep source silence.

**A-roll timing anchors everything downstream** — finalize the speech cut before
captions, music length, B-roll cut-covers, or MG placement. An upstream shift
forces redoing all of them.

**QA before done** — re-read the result end to end: broken logic, missing
context, over-deletion, missed cleanup, wrong order, pauses too tight/long, hook
in the first seconds, a real payoff, clean boundaries, no line the source doesn't
support. For his footage also: nothing negative about Israel slipped through, his
question is still in front of the answer.
