# ISRAEL BATCH — build brief (every video in this batch follows this)

Tal handed over 425 clips (FOOTAGE IN, Meta glasses 3:4 + a few iPhone),
2026-09-29, and went to sleep. He wakes up to an HTML page of finished videos.
His words: *"make sure all of them are perfect … there cannot be any mistakes,
none of the mistakes in the words, in the captions, in the grammar."*

Catalogue of every person/moment: `projects/israel-batch/catalog/*.json`
(key, clips[{id,from,to}], who, identity_said, type, quality, hook, best[],
cut[], caption_notes, visual_notes, notes). **Read the entry's notes and
caption_notes before cutting — they carry consent and translation warnings.**

## Tools (run from `system/`)

```bash
node scripts/autotrim.mjs <slug> <id>:<from>-<to> ...     # beats trimmed to speech (aligned words)
#   -> writes projects/<slug>/edit.json ; then add the fields below with a node one-liner
node scripts/verify-cut.mjs projects/<slug>/edit.json      # MUST end "No boundary problems"
node scripts/build-edit.mjs <slug> --preview               # render (540x960 preview is fine for review)
node scripts/selfreview.mjs projects/<slug>/edit.json projects/<slug>/<out>.mp4
#   -> section 2b = the RENDERED captions. Read every line as English.
```

Word timings for most used clips are WhisperX-aligned (`"aligned"` key in
`projects/_frameio/cache/transcripts/<id>.json`). If a clip is NOT aligned
yet: `python tools/align-cache.py <id>` first (≈1 min per 3 min of audio).
Pick windows on SEGMENT boundaries (`segments[]` start/end) — they are exact
after alignment.

## edit.json fields for this batch

```json
{
  "title": "POV: MEETING A CHRISTIAN\nIN ISRAEL 🇮🇱",   // 2 lines max, ALL CAPS, flag emoji
  "titleY": 260, "titleHold": 3.5,
  "capY": 0.69,
  "out": "<NAME>_V1.mp4",
  "beats": [...]
}
```
- **Title only when it's true:** identity words (Muslim/Christian/Jewish/
  Nigerian…) ONLY if the person says it on camera (`identity_said`). Otherwise
  a situation title ("POV: I ASKED A STRANGER FOR A RIDE TO TEL AVIV").
  Compilations: "ASKING PEOPLE IN ISRAEL 🇮🇱\nWHAT MAKES THEM HAPPY" style.
- Captions are the house style automatically (white ALL-CAPS, outline, 1-3 words).
  Hebrew/Arabic clips get English captions from the machine translation —
  **only use a translated line if it reads as sensible English and matches the
  moment; the catalogue marks several as wrong. When unsure, cut the line.**
- A beat's 7th element may carry `{"tilt": deg}` (from
  `projects/israel-batch/levels.json`, only where confidence ≥ 0.5 and
  1.5–8°) to straighten a crooked shot.

## Editing rules (Tal)

1. **Open on a face within the first second.** The hook (V2) is the single
   most interesting thing the person says — check its first frame shows the
   speaker's face; if the POV was pointing elsewhere, pick another hook line.
2. **Only the subject's answers** + the minimum of Tal's question needed to
   understand them (a line and its reply are ONE unit). Cut his prompting
   ("say this", "tell them…").
3. **Cut:** negative/political/hateful lines, failed asks, dead air, holiday
   greetings (Shana Tova/happy new year) unless they ARE the moment (Eid
   Mubarak in the bakery gift story is the moment — keep).
4. **Chronological** within a person, using the order the catalogue gives
   (capture timestamps are wrong in several sessions — the catalogue's order
   is verified by content).
5. **Never cut anyone off** — verify-cut must be clean. **End on the warmest
   line**, not the last thing said.
6. No music. Speech only; dead space out.
7. Length: one-person videos ~35-75 s; compilations 30-60 s, 1.5-4 s per
   person, never two similar people in a row, strongest answer 3rd or 4th.
8. **Respect consent flags** in the catalogue (e.g. S41-b Shmuel: 4236
   59.54-92.20 must stay out — he asked on camera).

## Variations

- `V1` = the story in order, opening on the approach (face in frame).
- `V2` = **hook first**: the strongest line (≤ 4 s) as a flash-forward beat,
  then the story. Same everything else.
- Only make a V3 if there is a genuinely different angle (e.g. a different
  title/premise), not a reshuffle.

## Output + QA (a video is NOT done until all of these are true)

- [ ] `verify-cut.mjs` → "No boundary problems"
- [ ] rendered captions (selfreview 2b) read line by line: no garbage words
      ("Hkol tiktak"), no wrong translation, no half-sentence that changes
      meaning, names spelled right (EID MUBARAK, not "Edmar Barak")
- [ ] `_review/SHEET.jpg` looked at: faces in frame, nobody decapitated,
      captions not over a face, title readable, first frame is a face
- [ ] then copy the render to
      `VIDEOS OUT/2026-09-29 israel batch/<Video Title> - V1.mp4`
- [ ] append one line of JSON to `projects/israel-batch/manifest.jsonl`:
      `{"slug","file","title","type":"person|compilation","variant":"V1|V2",
        "people":"…","duration":…,"hook":"…","caption_note":"timing verified;
        translation unverified (Hebrew)" | "timing verified",
        "status":"ready|needs-tal"}`

Slugs: `ib-<short-name>` (e.g. `ib-elias-hummus`, `ib-comp-salam`). One slug
per video variant is fine (`ib-elias-hummus-v2`) — the builder writes
`projects/<slug>/`.
