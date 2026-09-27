# LESSONS — what 13 versions of one video cost

Jamaica took **13 versions**. Almost none of the fixes were creative; they were
defects I could have caught myself. This file exists so the next video starts at
V13 quality, not V1.

**Read this before building anything.**

---

## 1. THE DEFECTS, IN ORDER, AND WHAT CAUSED EACH

| V | What Tal saw | Real cause |
|---|---|---|
| 1 | heads cut off | 9:16 centre-crop keeps only 31% of a 16:9 frame. Never blind-crop. |
| 2 | captions drifted | split each SEGMENT evenly across its words; a pause smeared them |
| 4 | "let's make that happen" snapped shut | out-point set to 48.90, the exact frame the word ended. **0s of air.** |
| 4 | his reply thrown away | Damien answered "that would be really great" — cut landed between them |
| 5 | `FOR YOWEBLLRTHDAY` | Groq word timings OVERLAP between speakers and are NOT time-sorted |
| 5 | "three here" | ASR error. Every word valid English, so nothing flags it but reading |
| 6 | caption ran off frame | raised font to 78px, never re-measured the text |
| 6 | "I want to write Damien" then nothing | a promise in the dialogue with no payoff on screen |
| 10 | cut at 1:49 | "Birthday." ends 11.22, out-point 11.34. **0.12s of air.** |
| 11 | no context at all | 4 clips describe the animal bunker; **none were used** |
| 12 | build died | started a build while the previous one still held the folder |
| 13 | "and they're living here" chopped | clip had **no word timings** — boundaries were guessed |

**The pattern: I was checking the plan, not the result.**

---

## 2. THE RULES THAT CAME OUT OF IT

1. **Air after every line.** 0.12s before the first word, ~0.45s after the last.
   A line that ends the same frame the word ends *sounds* broken.
2. **A line and its reply are ONE unit.** Never cut between them.
3. **Every promise gets paid off.** "I want to write Damien" → show the writing.
   "We'll be back with the bicycle" → show the bicycle.
4. **One caption on screen at a time.** Sort words by time, force
   non-overlapping windows.
5. **Measure caption width with the real font.** Never guess.
6. **Read every caption as English.** "three here" is nonsense.
7. **Verify against the RENDERED FILE.** Transcript math is a prediction.
8. **Check the shortlist against the WHOLE clip list after every reorder.**
   The context beats fell out during a restructure and nobody noticed for
   three versions.
9. **A clip with no word timings cannot enter an edit.** Transcribe with
   `--words` first, or the boundaries are guesses.
10. **One build at a time**, each with its own scratch dir.

---

## 3. THE ORDER THAT WORKED (story videos)

Tal rejected two structures before this one. It is also the true chronology —
when the running order matches what actually happened, it flows.

```
1  CONTEXT over b-roll of the place      "look at the situation..."
                                         "this is where they store pigs"
                                         "the baby sleeping on old mattresses"
2  MEET THE PERSON                       "what's your dream for your birthday?"
3  THE ASK + the decision                "...a bicycle?" / "let's make that happen"
4  THE JOURNEY / their story              in the car
5  THE DOING                             at the shop, the name on the frame
6  THE PAYOFF — them, speaking            "you bring full enjoyment to my life"
7  THEIR MESSAGE, not yours               "just continue, do good"
```

**Never open on the creator.** Never end on the creator. **Nothing negative** —
an ending Tal liked structurally was cut purely because one line read badly.

---

## 4. THE PIPELINE (use it; do not hand-roll)

```bash
node system/scripts/frameio-discover.mjs "<folder>" --fetch   # proxies only, never originals
node system/scripts/frameio-transcribe.mjs --words            # Groq turbo, cached
node system/scripts/autotrim.mjs <slug> <id[!a|:from-to]>...  # boundaries from speech
node system/scripts/build-edit.mjs <slug>                     # render
node system/scripts/selfreview.mjs <EDIT.json> <render.mp4>   # GATE — non-zero = do not send
```

Supporting: `study-reference.mjs` (any reference Tal sends),
`caption-audit.mjs` (two-model diff for ASR errors),
`fit-caption.py`, `make-title.py` (rounded pill + drawn flags).

**`autotrim` makes "never cut anyone off" true by construction** — it reads the
word timings and pads. That one tool removes most of the table in §1.

---

## 5. TOOL FACTS THAT COST REAL TIME

- **`execFileSync` returns ONLY stdout.** ffmpeg writes measurements to stderr.
  This is in CLAUDE.md and I still wrote it wrong — it reported 0 cuts on a
  video with 25. Use `spawnSync` and concatenate both.
- **Scene detection: measure at 0.20, not 0.30.** 0.30 called Jack Jones
  35 cuts/min; the real figure is 103.8. Sanity-check against the transcript —
  if it shows 18 exchanges and the detector says 5 cuts, the detector is wrong.
- **PIL has no HarfBuzz here**, so flag emoji render as "JM"/"IL". Flags are
  drawn as shapes in `make-title.py`.
- **ffmpeg drawtext has no bidi** — Hebrew/Arabic renders backwards. Tal wants
  **English captions only**, so translate (`groqTranslate`) rather than reverse.
- **Groq's translation endpoint has no word timestamps** — translated captions
  are timed from segments, and the wording is *unverified*. It rendered
  "המחייך" (smiling) as "alive", which changed the meaning of a line.
- **Frame.io proxies are mixed orientation.** Some are 640x360 landscape holding
  portrait content rotated 90°, heads pointing left. `transpose=1` fixes it;
  the builder auto-applies it for vertical projects.
- **Python heredocs silently eat backslashes** and `str.replace` fails silently
  when nothing matches. Patches "succeeded" twice while changing nothing. For
  anything with regex or escapes, edit the file directly and verify by reading
  it back.

---

## 6. THE ONE RULE ABOVE ALL

**Watch it myself before Tal sees it.**

Every defect in §1 was visible without him — in a contact sheet, in the caption
dump, or in the verifier. He should be giving creative direction, not QA.

---

## 7. GO THROUGH EVERY SINGLE CLIP  [S] — 2026-09-21, THE MAIN RULE

Tal: *"You should go through every single clip. That is the main rule. I'm
paying for an API. You're going through every clip in the Frame.io, you're
understanding which parts are good, which parts are needed, which parts are
their stories."*

**Transcribe every clip in the folder. Read every transcript. Look at frames for
anything without dialogue.** Then decide. Not a sample, not the long ones, not
the ones whose filenames look promising — all of them.

This was violated twice and both times it cost a version:
- Jamaica used 10 of 25 clips and was missing all four that showed where the man
  lived. Tal had to ask *"am I wrong, are there parts you didn't add?"*
- The hospital shoot's 128 clips went unread for hours because a bucket-name
  filter silently matched nothing; the cancer story sat undiscovered.

**After every reorder, re-check the shortlist against the FULL clip list.**
Beats fall out during restructures and nobody notices.

## 8. ONE CLIP CAN SERVE SEVERAL BEATS, SPLIT ACROSS THE FILM

Tal, on the Eden narration (`IMG_9260`): *"You can just use one clip ... 'I came
to the hospital and I met Eden, Eden has cancer and she's not giving up' ...
and 'I'm asking two things from you, can you pray for her' — you can just add
that later."*

A single narration take is usually **two or three separate beats**: the setup at
the top, the ask at the end. Do not treat a clip as one indivisible block.

## 9. USE THE REAL AUDIO THAT EXISTS IN THE FOOTAGE

Tal: *"you can use the song that people were singing."*

When the footage contains music being performed on camera, that IS the music
bed. No licensing problem, no Instagram audio-match risk, and it is genuinely
part of the scene. Look for it before asking for a music file.

## 10. DEVICES ARE OPTIONAL, NOT MANDATORY

The `5 MINUTES LATER` card is *an idea for showing a surprise*, not a fixture.
Tal: *"I don't know if you need the five minutes later card, but that's just an
idea."* Same for title cards — *"you can add a title card sometimes, sometimes
you don't."* Use a device when the cut needs it; drop it when it does not.

## 11. DELIVERY IS PART OF THE EDIT — 2026-09-21

A render on this disk is not delivered. Every finished cut goes to Frame.io:

```bash
node system/scripts/auto-deliver.mjs --watch 45   # uploads each render as it lands
node system/scripts/finish.mjs <slug>             # QA gate, then upload
node system/scripts/frameio-comments.mjs --since 8h   # read Tal's notes back
```

Tal reviews by commenting **with a timestamp** on the Frame.io file. Those
comments are direction — read them, map the timestamp to a beat in that
project's `edit.json`, fix, rebuild, re-deliver. And append the correction
here in the same turn.

Facts that cost time (full detail in `DELIVERY.md`):
- `media_type` in the `local_upload` body is a **422**. Name + file_size only.
- **Multipart above 10 MB, with UNEQUAL part sizes.** Splitting the file evenly
  across N presigned urls — what the old client did — uploads wrong bytes to
  every part after the first. Use the `size` the API returns.
- `media_links.efficient` is 640x360 here. It is not a quality tier.

## 12. CUT FROM THE REAL FILE, NOT A PROXY  [S]

Tal, 2026-09-21: *"it really just makes sense just to download them high res at
one time ... I don't know why I do the low res and then switch to the high res."*

He is right, and the two-step cost a whole extra render pass.

- Footage already on disk: `node system/scripts/transcribe-local.mjs "<folder>"` puts
  it in the same cache as Frame.io footage. `build-edit` then cuts the original.
- Frame.io footage: `node system/scripts/fetch-hq.mjs <slug>` pulls **only the seconds
  the edit uses** from the 4K original. `media_links.original` is a presigned
  S3 url that honours HTTP Range, so ffmpeg seeks into it over the network —
  3 s out of a 91 MB 4K file came down in 4.9 s. No 3 GB download.
- Source priority in `build-edit`: **local original > HQ span > 360p proxy.**

**AN HQ SPAN HAS ITS OWN CLOCK.** It starts at `offset` seconds into the
original, so ffmpeg's seek is rebased — but the transcript's word timings are
on the ORIGINAL timeline. Rebasing both silently pulled captions from the wrong
part of the clip and emitted **0 captions** on some beats. Keep both clocks:
seek on the span, look captions up on the original.

## 13. SIDEWAYS FOOTAGE IS EVERYWHERE — LOOK AT A FRAME FIRST

The feed-homeless Sony files are 3840x2160 with **no rotation metadata** and
the people are lying on their side. `ffprobe` says nothing is wrong. The only
way to catch it is to extract a frame and look at it. `build-edit` applies
`transpose=1` automatically for a vertical project whose source is landscape,
which is right for this footage (heads point LEFT).

Also: `tile=` silently produces garbage when the inputs are different sizes.
Force one size first — `scale=W:H:force_original_aspect_ratio=decrease,pad=W:H`.

## 14. USE THE SECOND CAMERA'S AUDIO  [S]

Tal: *"the VID ones — you can just use the audio from those, the camera
videos."* On a two-camera shoot the Sony has the picture and the chest camera
is metres closer to the speaker, so the chest cam is the only usable dialogue
track. A beat can carry `{"audio":{"id":"<other clip>","at":<same instant in
its timeline>}}` and the builder takes picture from one and sound from the
other.

## 15. COMPILATION ORDER IS A HARD RULE

See `COMPILATION-ORDER.md`. Never open a new variation on the same face, never
two similar people back to back, the strongest answer goes 3rd or 4th. Extract
a contact sheet of one frame per candidate and **order by what you can see**,
not by what the transcript says.

## 16. NEVER PUT THE PAYOFF IN THE TITLE CARD

`SHOP OWNER BREAD V1` was titled *"I told a PALESTINIAN shop owner…"* — but the
video's whole turn is at 0:52, when Tal asks *"Are you Palestinian?"* and the
man says *"Yes. This is the Palestinian culture."* and Tal answers *"I'm
Israeli. We are together."* Naming it in the first second spends the ending
before the video starts.

**The title card states the SETUP, never the reveal.**
- Setup: *"I told a shop owner in Israel I was hungry and had no money."*
- Reveal (keep it for the video): who he turns out to be.

Same rule for every kindness test: the title says what was asked, not what was
discovered.

## 17. ORIENTATION: MEASURE A DECODED FRAME, NEVER THE CONTAINER  [S]

`ffprobe -show_entries stream=width,height` returns the **coded** size. A phone
or chest-cam clip is often coded 1920x1080 with a 90-degree display matrix —
ffmpeg auto-rotates it on decode, so by the time any filter sees it, it is
1080x1920. Trusting ffprobe made the builder classify an already-upright clip
as landscape and transpose it a second time, laying Roman on his side.

Worse, **one folder can contain both kinds**: the feed-homeless Sony files have
no rotation metadata and genuinely need `transpose=1`, while the chest-cam
files in the same folder are already upright. No per-shoot constant can be
right.

**The fix:** decode ONE frame to a PNG and probe that. It is ground truth and
it is what the filter graph will actually receive.

```js
execFileSync(FF, ["-v","error","-y","-ss",String(ss),"-i",src,"-frames:v","1",probePng]);
const [W,H] = probe(probePng);   // post-rotation, always correct
```

Two separate failures produced the same sideways symptom this session — first
`beat[5] = 0` disabling auto-rotate (see §12), then this. **When something
looks sideways, extract a frame and LOOK; do not assume the previous fix held.**

## 18. CAPTIONS BREAK WHERE THE SPEAKER BREAKS, NOT EVERY N WORDS

Chunking every 3 words produced lines like **"NAME? HOW LONG"**,
**"WE WANTED TO"**, **"CAN DO TO"** — the break landed mid-thought because it
was *counted*, not *heard*.

`build-edit.mjs` now groups greedily with lookahead: take a window of at most
**5 words / 30 characters**, then cut at the best boundary INSIDE that window —

1. a full stop `.!?` wins outright,
2. else a comma / semicolon / colon,
3. else the largest inter-word pause **above 250 ms**,
4. else the window edge.

A hard cap on its own is not enough: it still split *"so we heard your / baby
is not feeling"*, because the cap — not the speech — was choosing the break.
With lookahead the same line reads *"SO WE HEARD YOUR BABY / IS NOT FEELING
WELL"*.

**Still unsolved:** when two people talk over each other, Groq's word list
interleaves them, so a caption can read *"CAN YES / YOU HELP ME"*. Sorting by
start time cannot separate speakers — that needs diarization, which is not
available on this machine. Watch for it in two-voice moments and re-cut the
beat boundary if it lands badly.

## 19. THE TITLE CARD MUST READ ON A BRIGHT FRAME  [S]

Tal, on `WHAT MAKES YOU HAPPY`: *"did you watch that video? did you see that
the title card you can't even see it — why did you do that, it's so stupid."*

He was right. The card is a white pill with black text and only a faint
`(0,0,0,55)` shadow. Over a sun-lit Jerusalem street — pale stone, white
shirts, blown-out sky — the pill has almost no edge and vanishes.

`scripts/make-title.py` now gives it a real **blurred drop shadow**
(`GaussianBlur(9)`, alpha 150, offset down) plus a **thin dark edge**
(`alpha 110`, radius+2) outside the white. The card itself is unchanged — white
with black text — only its separation from the background.

**This was only findable by extracting frame 1 and looking at it.** It passed
every automated check: the PNG composited correctly, the overlay filter ran,
the contact sheet showed a card. It was legible in Jamaica (dark shelter
interior) and invisible here. **Check the title card against the ACTUAL first
frame of each video, not against a previous video's.**

## 20. `EDIT.json` AND `edit.json` ARE THE SAME FILE ON WINDOWS  [S]

`build-edit.mjs` read `projects/<slug>/edit.json` and then wrote a build record
to `projects/<slug>/EDIT.json`. Windows paths are case-insensitive, so that is
**the same file** — every build silently overwrote its own recipe with
`{built, total_s, title, beats}`, destroying `layout` and `out`.

Symptoms, all of which looked like something else:
- a rebuild came out as `HOSPITAL-RAMALLAH_V1.mp4` instead of the `out` name
  that was set minutes earlier,
- `layout` vanished from all 20 projects (harmless only because "vertical" is
  the fallback — a square-band project would have silently re-cut wrong).

The record now goes to `BUILD-LOG.json`. **Never name an output file the same
as an input file with different casing.**

## 21. `zoompan` RESAMPLES BY FRAME COUNT — NORMALISE fps FIRST  [S]

Tal, on COFFEE KINDNESS: *"he said 'tell me' and it wasn't lined up to what he
was speaking."* The captions were right. **The picture was wrong.**

`zoompan=...:fps=30` consumes one input frame per output frame and emits them
at 30fps. The coffee-shop source is **48 fps**, so 48 frames of one real second
came out as 1.6 seconds of video. The audio (extracted separately, at real
speed) stayed correct, `-shortest` then truncated the over-long video, and the
result is a picture that drags further behind the voice with every second of
the beat.

Measured across this footage: **48/1, 30/1, and 30000/1001 all appear**, so any
video containing a mixed-rate folder had beats that drifted and beats that did
not — which is exactly why it looked random.

**Fix: `fps=30` as the FIRST filter in the chain, before scale/crop/zoompan**,
in both the vertical and square-band branches. Never rely on `zoompan`'s own
`fps` to retime; it only labels the output rate, it does not resample.

**Check for it with:** `ffprobe -select_streams v:0 -show_entries stream=r_frame_rate`
on the source, and by comparing the rendered video stream duration against the
audio stream duration — they must match to within a frame.

## 22. CUT LINES, NOT CLIPS  [S]

Tal, 2026-09-21: *"you don't need the whole clips, you just use lines from
them."*

Every edit up to this point was written as SEGMENT RANGES — "clip X from 0 to
13.4" — which drags in every repeat, aside and pause wrapped around the line
that matters. The measured rate for his formats is **1.9-2.5s a shot**
(ROUTING.md). A 13-second block is five shots' worth of one angle.

`scripts/lib/lines.mjs` builds beats from the LINE:

```js
const {beats, missing} = beatsFromLines([
  [id, "what are you guys doing",  "'What are you guys doing?'"],
  [id, "we're playing in the hospital", "'We're playing in the hospital.'"],
], { zoom: [1.0, 1.12], step: 0.012 });
```

It finds each phrase in the word timings and returns just that phrase with the
house padding (0.12s head, up to 0.45s tail clamped to the next word). Rewriting
`jew-and-muslim` this way took it from 7 beats / 66s / 9.5s-a-shot to
**15 beats / 36.7s / 2.4s-a-shot.**

**A phrase it cannot find is reported and SKIPPED, never guessed.**

### Two traps it exposed

- **Groq's word array is not in speaking order.** The tokens for "we are all
  human" come back as `we are all And human.` — a word from elsewhere wedged
  in. An exact match fails on a perfectly good line, so the matcher walks the
  target's words in order and tolerates up to 3 intruders. This is the same
  defect that interleaves two speakers into one caption (§18).
- **Never hand-type a uuid.** A made-up id made all 13 lines report "not
  found", which reads like thirteen bad phrases instead of one bad id. Resolve
  ids from `discover-index.json`, and `beatsFromLines` now throws outright when
  a clip has no word timings at all.

## 23. THE PHONE-BOOTH FOOTAGE IS SIDEWAYS, AND IT IS NOT A COMPILATION  [S]

`table asking a. Question` is the **CALL SOMEONE YOU LOVE** rig at Damascus
Gate — 18 clips, all on disk as 4K originals (5.8 GB) as well as on Frame.io.
Use the local files.

- **Stored sideways.** 3840x2160 with no rotation metadata and portrait content
  inside: the sign reads vertically and the caller lies on his side. Heads point
  LEFT, so `transpose=1`. The builder's auto-rotate handles it — just do not put
  `0` in the beat's rotation slot (§12).
- **25 fps.** Another rate the `fps=30` normalisation is needed for (§21).
- **It is a FULL STORY format, one subject, never a compilation** — see
  `skills/toolbox/video-editor/references/formats/call-someone-you-love.md`.
  The reference Tal named has **no cuts at all**; a slow push does the work a
  cut would do. Do not line-chop this one (§22 does not apply here).
- **Captions go silent during pauses.** Real pauses of 1.2-5.4s carry zero
  caption — that is what makes them read as someone feeling the words.
- **No CTA and no final caption.** It ends wordless: hangs up, sets the phone
  down, walks off.

**The gold:** `C0247` — an old man calling his daughter in America.
*"How are you, my sweet daughter? I miss you so much. I hope to see you before
I die... Bye-bye, darling. I love you."* 49 seconds, one take.
Also strong: `C0248` *"Mum — I won the case. I won the case. And I love you."*
(Arabic), `C0250`, `C0258` *"I love you, I love you, I love you."*

## 24. AN HQ SPAN ONLY COVERS THE EDIT THAT FETCHED IT

`fetch-hq` pulls the seconds ONE edit needs. A different edit reusing the same
clip can land outside that window — `eden-music` wanted 36-45s of a clip whose
span ended at 33.8s. The builder rebased onto the span anyway, seeked past the
end of the file, and died on a missing probe frame.

`build-edit` now checks the beat actually fits inside the span and falls back
to the proxy (with a printed note) when it does not. Fetch the span for the new
edit if you want it at full quality: `node system/scripts/fetch-hq.mjs <slug> --force`.

## 25. THE DELIVERY SET IS WHATEVER SITS AT 1080x1920

Because `--final` was never passed for most of this session, ~43 renders on
disk were 540x960 previews and 19 of them had been uploaded. The recovery that
worked:

```bash
# move every preview-resolution render out of the delivery path
for f in projects/*/*.mp4; do
  [ "$(ffprobe … width,height)" = "540,960" ] && mv "$f" "$(dirname "$f")/_superseded/"
done
node system/scripts/qa-final.mjs        # gate what remains
node system/scripts/auto-deliver.mjs    # upload it
```

`auto-deliver` only scans `projects/<slug>/*.mp4` at the top level, so anything
in `_superseded/` is invisible to it — which is exactly what you want for an
old version you are keeping but never sending.

---

## 26. A GATE THAT PASSES IS NOT A VIDEO THAT IS GOOD

2026-09-21. I delivered 32 videos and reported "35 pass, 1 fail" from
`qa-final.mjs`. Tal watched them:

> *"a lot of the video edits you made were so bad and the captions were
> horrible you didn't edit them good actually at all ... the audio was so bad
> did you watch all the videos that you put there ... the colors are bad like
> everything is bad about them"*

He was right, and the honest part is this: **I had not watched them.** I ran a
mechanical gate and read transcripts, then reported the gate as if it were a
judgement about the film. `qa-final.mjs` checks the container — resolution,
duration, one loudness number, black frames. Not one of the things he objected
to was inside its field of view.

**The rule: before anything is delivered, build a contact sheet from the
RENDERED file and look at it, and measure the audio curve.** Two commands:

```bash
node system/scripts/sheet.mjs <render.mp4> <out.png> 9    # 3x3 grid, read the captions
node system/scripts/qa-look.mjs <render.mp4>              # flicker, slams, floor, people
```

`scripts/sheet.mjs` is the one that ends the argument. Nine frames of the real
file, captions burned in, at a size where they can be READ. Everything below
was found in about four minutes of looking at three of those sheets.

## 27. THE FIVE DEFECTS THE CONTACT SHEETS FOUND

All measured off delivered files, all now fixed in `scripts/build-edit.mjs`.

**a) The crop was aimed at nothing.** Every beat was framed with
`crop=1080:1920:x=(iw-out_w)*xc:y=0` and a `z:[1.22,1.38]` push. `y=0` keeps
the TOP of the frame, and on POV street footage the top of the frame is sky, an
awning or a wall — the person is in the bottom third. In `SHALOM SALAM V3`
three consecutive beats are more than half grey corrugated wall. In
`COFFEE KINDNESS V4` the subject's head is **7% of frame height**, behind a
water bottle, with the wearer's own hand filling the bottom fifth.

A hand-authored push does not fix this, it *is* the problem: `{x:0.5, y:0.38}`
is a guess at where someone is standing, and 1.3x is not a zoom when the
subject needs 2.5x. **Measure, don't guess** — `scripts/face-box.py` +
`scripts/lib/framing.mjs` locate the head and compute a crop rectangle that
puts it at 20% of frame height on the upper-third line. Auto-framing now wins
over a hand push whenever a face is actually found; the hand push is the
fallback, not the authority.

OpenCV 5 (the system `cv2`) **dropped `CascadeClassifier` and `HOGDescriptor`**,
and the YuNet weights in opencv_zoo are behind git-lfs (you get a 131-byte
pointer file, and `dnn` then fails with "Failed to parse ONNX model"). 4.10 is
vendored into `vendor/cv410` with `pip install --target` so the system cv2 is
untouched. Do not "tidy up" the `sys.path.insert` at the top of `face-box.py`.

**b) Beats with no person in them.** `GIVING WATER V4` has a passing car and a
wheelbarrow. `SHALOM SALAM V3` ends on an **empty pavement with the
photographer's shadow, captioned "HOW ARE YOU"**. The builder now prints
`!! NO PERSON FOUND` for every such beat instead of silently cropping air.

**c) Captions cut mid-thought.** The 4-word cap chose the break when no comma
or pause fell inside its window, which shipped `"WHATEVER OR YOU CAN"`,
`"TELL ME HOW YOU"`, `"GUYS FROM"`, `"BE BLESSED AND NEVER"`. **A caption is a
unit of sense, not a unit of counting.** There is now a `DANGLER` set —
prepositions, conjunctions, articles, auxiliaries, pronoun subjects — and a
line that ends on one reaches forward to the word it belongs to, up to a hard
ceiling of 7 words / 34 chars. A slightly longer line that reads as English
beats a short one that reads as noise.

Two more caption rules came out of the same sheets:
- **Blank a caption that repeats the previous one.** Four beats of
  `SHALOM SALAM V3` in a row read "SHABBAT SHALOM / SHALOM SHABBAT / ACTUALLY
  SHABBAT / SHABBAT SHABBAT" — the same greeting, re-transcribed slightly
  differently each time, read as four captions. It stutters.
- **Every caption now goes into `BUILD-LOG.json`.** `"SHALOM, HOW MY CHIH"`
  reached Tal because "read every caption as English" was being done by eye on
  a frame. `qa-look.mjs` reads the list back as text.

**d) The exposure lift was a fog machine.** `gamma` up to **1.70** plus
`+0.10` brightness raises the BLACK POINT, so a dim interior came out grey and
hazy. Worse, it fired per beat, so a lifted beat sat next to an untouched one
and the picture flickered at every cut. Now capped at **gamma 1.30**, paired
with a contrast move that puts the black point back (`contrast = 1 + (g-1)*0.85`),
and `qa-look.mjs` fails any film whose luma never drops below 120.

**e) The audio, measured.**

| file | range | floor | what it means |
|---|---|---|---|
| `COFFEE KINDNESS V4` | **9.8 dB** | −25.8 dB | no silence anywhere in 76s |
| `GIVING WATER V4` | 28 dB | −43 dB | 25–30 dB slams *at the cuts* |
| `SHALOM SALAM V3` | 25 dB | −41 dB | same, plus real dead air |

Two opposite failures with one bad cause. Beats were never level-matched, so
they slammed at the joins; the fix applied for that was
`dynaudnorm=f=250:g=15:p=0.9:m=4` on the timeline, which is a level **rider** —
it lifts anything quiet by up to 12 dB, and between sentences the quiet thing
*is the street*. That is the constant roar under every word of coffee-kindness.

**Match each beat with a STATIC gain before it is cut in** (`beatGain()` —
measure the beat, apply one unchanging number, clamp ±9 dB, skip beats under
−45 dBFS so a reaction shot's noise is never boosted). Nothing then has to ride
the timeline, so the timeline chain does the opposite job: hold the floor
*down* (`compand` with downward expansion below −40 dB) and catch peaks.

**`dynaudnorm` is banned from the timeline chain.** If the cuts jump, fix the
beats, never ride the master.

---

## 28. CHECK WHICH CAMERAS WERE ROLLING — BEFORE CHOOSING A SINGLE FRAME

2026-09-21, Tal on coffee-kindness:

> *"Why did you use the video of the Muslim guy helping me and then you didn't
> use the Sony camera? You should use both, because sometimes it's too dark in
> that video and then you try to change it up but it wasn't good. You should be
> using mostly the Sony camera video, like the long lens — that's just so much
> better."*

I cut the whole film from the Meta-glasses POV and never looked for a second
camera. There was one, and the numbers are not close:

| | clip | mean luma | length |
|---|---|---|---|
| Meta glasses | `VID_20260915_142016_055.mp4` | **48** | 298s |
| Sony, long lens | `C0481.MP4` | **113** | **438s** |

**Grading a 2.4x underexposed camera is not colour work, it is damage
control** — and it is exactly what the per-beat exposure lift in §27(d) was
built to paper over. The fix for "this shot is too dark" is almost never a
curve. It is the other camera.

**And the exposure was the smaller half of the loss.** The glasses clip ran out
140 seconds before the conversation did, so three of the strongest lines the
man says were never even candidates:

> *"I don't look about the colour or the language — the one who asks for help.
> It doesn't matter, we're all human beings."*
> *"In Jaffa we are raised all together. Jews, Muslims, Christians. We don't
> know how to be divided."*
> *"Kulo Wahad. It means we're all one."*

Every version through V5 ended at "we're brothers" — 80s into a 438s
conversation — and I believed that was the whole interaction because it was the
whole *clip*. **A clip is not an interaction.**

### The tool

```bash
node system/scripts/find-coverage.mjs                 # every project, unused coverage
node system/scripts/find-coverage.mjs --clip <id>     # what else covers this clip
```

It matches on **rare 4-word shingles** from the transcripts, not on timecode —
these cameras are not jam-synced and the container times cannot be trusted
(CLAUDE.md §7). Common phrases are stopword-filtered out, because "thank you so
much" and "shabbat shalom" appear in half the library and would match
everything to everything. C0481 scores **73%** against the glasses clip, with
430 shared phrases; the next candidate is under 10%. The signal is unambiguous
when it is real.

Camera is read off the filename convention on these shoots:

| pattern | camera | use |
|---|---|---|
| `C####.MP4` | **Sony, long lens** | the A camera. Best exposure, best glass, longest takes. |
| `VID_<date>_` | Meta Ray-Ban POV | first person. Use for what only POV has — hands, receiving, the walk up. |
| `IMG_` | iPhone | varies. |

### The rule

**Run `find-coverage.mjs` before writing a single beat.** If a Sony clip covers
the interaction, it is the spine, and the POV becomes a cutaway for the shots
only it can give. CLAUDE.md §3 already said camera selection is never finalised
automatically — but with no way to *find* the alternates, that rule had nothing
to act on. Now it does.

**This was not one bad call.** Run across the library: **20 of 33 projects have
unused coverage from another camera, 8 of them Sony.** Every phone-booth film
matched a Sony clip at 100% (`C0247`, `C0251`, `C0256`, `C0257`) and not one of
them used it.

---

## 29. CAPTION WORDING COMES FROM THE SEGMENT, TIMING COMES FROM THE WORDS

Found on the Sony rebuild of coffee-kindness, on screen, in the contact sheet:

> **"THE ONE WHO FOR ASKS HELP"**

What he actually says is *"...the one who asks for help."* The segment text in
the transcript is correct. The WORD array is not: Groq returns word entries that
overlap and are not in speaking order, and §22 already knew this — `lines.mjs`
tolerates intruding tokens for exactly this reason. What was missed is that the
caption builder was assembling its text **from that same word array**, sorted by
start time. Sorting mis-ordered timestamps does not recover the order; it just
produces a confident, wrong sentence.

**Wording and timing are two different claims, and they come from two different
places.** The segment carries the right words. The word entries carry usable
timing. Take each from the source that is actually reliable for it:

```js
// per segment: correct wording + real word timings, paired in order
if (mine.length === text.length) text.forEach((t, k) =>
  rebuilt.push({ word: t, start: mine[k].start, end: mine[k].end }));
else /* counts disagree -> spread the segment evenly across its own span */
```

When the counts disagree (ASR merged or dropped a token) the fallback spreads
the segment across its own span. That is coarser timing — and it is the right
trade, because a caption that is half a beat late is a small error and a caption
that is scrambled is an unusable one.

This is the same principle as the translated-caption path, which had always
worked this way. The word-timed path was the odd one out.

## 30. Turbo transcribes, large-v3 fixes the bad ones — automatically

Tal, 2026-09-22, on GAZA GUY: *"IMG 9001 - says not one"*. Groq
whisper-large-v3-**turbo** had transcribed that clip as **French** —
"Une autre chose!" — when it is Arabic **ولا واحد** *(wala wahed)*, "not one",
six retakes of two words over street noise.

His call on the fix: *"u can do the turbo for most of it, and if parts came out
bad then u can just use large v3 for those"* — correct. Turbo is right on the
large majority and 3x cheaper. The defect was never that turbo is bad, it is
that **nothing was checking turbo's output.**

`scripts/frameio-transcribe.mjs` now runs two passes automatically. A clip is
re-done on large-v3 when it shows one of the four signatures actually seen in
this footage:

| signature | why it means the text is wrong |
|---|---|
| language not Hebrew/Arabic/English | the model invented a language, so it invented the words |
| mean avg_logprob < -0.6 | low confidence |
| one phrase fills >50% of 4+ segments | looping — the hallucination signature |
| empty text on a clip the silence gate passed | a real line was dropped |

**Severity is ranked, and this is the part that took two tries.** The first
version accepted the second pass only if it came back clean, which REJECTED the
correct Arabic for IMG_9001 because it was correct-but-unsure. A wrong language
or empty result (3) means the text is not what was said; looping (2) means part
is invented; low confidence (1) only means the clip was hard. Accept the second
pass when it is **strictly less severe** — a correct-but-unsure Arabic beats a
confident-sounding French — and refuse a same-severity swap, which is trading
one guess for another.

**A wrong language is not fixed by asking again.** Re-running auto-detect on
IMG_9001 returned a different, equally wrong Arabic each time. When the flag is
the language, the three languages this footage contains are each FORCED
(`ar`, `he`, `en`) and the most confident result wins. Detection is what
failed, so detection comes out of the loop.

Measured on GAZA GUY: 10 of 47 clips escalated, $0.0127 total against $0.0076
for turbo alone and $0.021 for large-v3 on everything.

**Related trap — short clips lose their language entirely.** IMG_8991 and
IMG_8992 are 9s and 5s of English ("I am a Jew living in Israel"). Auto-detect
called them Hebrew and returned only "אוקיי?" — the line was gone, with no
error. Any clip under ~10s whose transcript is far shorter than its duration
deserves a forced-language retry before it is trusted.

## 31. One door, many tools — the skill contract

Tal, 2026-09-22, across five messages: *"now install those skills"* → *"install
eveyrhting"* → *"there shoudl be all one place for skills"* → *"i dont want so
many skills, i just want... when i ask u to edit my videos"* → **"when i ask u
to edit my vidoes u shoudl use all the skills u need, to make this."**

That last line is the contract, and it is not the same as "fewer skills":

> **Tal never picks a skill. `tal-video-editor` answers, and then reaches for
> whatever the job needs without asking.** Loading a tool is a silent
> implementation detail, never a question for him.

All 71 from his shortlist were installed and verified. **45 unrelated ones**
(AWS, MongoDB, Vercel, landing pages, another creator's brand kit) went to
`~/.claude/skills-disabled/`. **25 editing tools stayed**, indexed by
sub-problem in `SKILL.md` — b-roll placement, silence cutting, subject
tracking, zoom emphasis, motion craft, a second-opinion QA gate, shot planning.

**Installing was never the mistake. Letting them all answer the door was.**
Nearly every one declares a trigger like *"edit this video"* —
`remotion-motion-graphics` says verbatim *"use this skill EVERY time the user
wants to create a video."* With 71 competing for one trigger and Tal naming
none, the first edit after that install would have silently lost the framing,
the grade, the caption rules and the Frame.io sourcing, and nothing would have
errored. The fix was routing, not deletion — CLAUDE.md §5c now settles it:
footage, a Frame.io folder or a `projects/<slug>/` means the repo pipeline owns
the edit, and the 25 are components it calls.

**Install-time facts worth keeping:**

- `nl-video-editing` shipped with **no frontmatter at all** and loaded with the
  description "Video Editing" — vague enough to win a routing contest by
  accident. Check `head -1 SKILL.md` is `---` and `name:` matches the directory.
- When "install everything" meets a namespace clash, a **prefix** (`cve-*`)
  keeps a skill reachable without shadowing this repo's version.
- **Check the LICENSE, not the star count.** hoodini/ai-agents-skills ships
  **none**; claude-video-editor carries a **Commons Clause**. Several need an
  ElevenLabs key Tal does not have — they load clean and die at the TTS step.
- Editing an installed skill's **trigger** is legitimate (`yuv-viral-video`
  fired on a bare .mp4 path); editing its body is not.
- **Two must stay disabled permanently.** `honest-agent` scans for CLAUDE.md /
  copilot-instructions.md / .cursorrules and **appends its own directives** —
  it can rewrite the master orchestrator. The `yuv-*` family carries another
  creator's brand; Tal's is bold WHITE uppercase, lower-middle (was recorded
  here as gold at ~72%; corrected 2026-09-24 by his own written standard).
- `cut-video` is the most useful and the most dangerous: MFA boundaries are
  ~10x tighter than Whisper's, but its own docs record **1-6s drift on
  retake-heavy footage** — which is this footage exactly (GAZA GUY IMG_9001 is
  six takes of two words). Ground-truth every boundary.

**And the part no install fixed.** Every failure Tal has flagged was a
**selection** failure — the wrong moment chosen — not a rendering one. These
tools place and polish a shot already chosen. Choosing stays this skill's job.
`EXTERNAL-SKILLS.md` was deleted and folded into `SKILL.md`: one door, one place.

## 32. Speaker diarization is in — and the lav mic decides what it can tell you

Tal supplied a HuggingFace token on 2026-09-22 and accepted pyannote's user
conditions. `scripts/diarize.py` now answers "who is talking", locally, free.

**Three traps, all paid for once — do not re-derive:**

1. **pyannote 4.x silently redirects.** `Pipeline.from_pretrained(
   'pyannote/speaker-diarization-3.1')` loads
   `pyannote/speaker-diarization-community-1` instead — a DIFFERENT gated repo.
   Being granted 3.1 *and* segmentation-3.0 *and* wespeaker is not enough. The
   403 it raises names a FILE (`xvec_transform.npz`), not the repo, on its
   first line, so the real cause is buried.
2. **`use_auth_token` was renamed `token`** in 4.x. The old kwarg raises
   TypeError, which looks like a version problem rather than an auth one.
3. **torchaudio on this machine has NO decode backend** (torchcodec installed
   incorrectly against torch 2.8.0+cpu). `torchaudio.load()` raises "Couldn't
   find appropriate backend". Decode with ffmpeg to raw PCM and hand pyannote
   an in-memory `{'waveform','sample_rate'}` dict — which its own warning
   recommends anyway.

**MEASURED ON GAZA GUY (47 clips, 4 minutes, ~0.7x realtime on CPU):**
only **2 clips** have genuine two-voice content; 12 more register a second
speaker for under 2 seconds. That is not a model failure — **the subject wears
the lav mic and Tal is behind the camera, off-mic.** The model hears one
dominant voice because the microphone only hears one.

**So what diarization is actually good for HERE:** the dominant speaker is
reliably THE SUBJECT — the person to caption, frame and cut on. That is worth
having. What it cannot do on a lav-mic shoot is separate Tal's voice from the
subject's, and no model will, because the audio does not contain it.

**Where it will earn its keep is the Meta glasses footage** — a single POV mic
picking up both people at similar levels is exactly the case diarization is
built for. Run it there before trusting it anywhere.

**One real win already:** the 2 clips it flagged (IMG_8993, IMG_8998) are
exactly the ones where Tal coaches in Hebrew — *"אני רוצה שתגיד"* ("I want you
to say") — followed by the subject's answer. Those are precisely the clips
where a caption gets attributed to the wrong person. It found them unprompted.

**Cost note while this was set up:** writing the token to `.env` from
PowerShell with `Set-Content` on an array **concatenated all three values onto
one line and corrupted `GROQ_API_KEY`**. Nothing errored; transcription would
simply have started failing auth later. Always re-read `.env` after writing it
and verify each key parses to its expected length.

## 33. SHOW HIM A LOW-RES PREVIEW IN CHAT BEFORE ANYTHING IS UPLOADED

Tal, 2026-09-22: *"Maybe you should show me here a low res preview before
uploading the frame instead of keep on changing it."*

This is the process rule, and it outranks any urge to look productive by
shipping. `SKILL.md` STEP 4 already said "the chat is the review workspace" and
it was not being followed: 10 films went to Frame.io on my own judgement, then
had to be superseded and deleted when he saw them. That is his time spent
reviewing things twice and a Frame.io folder full of versions.

**The loop is: build -> low-res preview INTO THE CHAT -> his note -> revise ->
preview again -> only on his yes, upload.** Nothing reaches
`FINAL VIDEOS / EDITED BY CLAUDE` before he has watched it and said so.

Send it with the one-line header and nothing else (`SKILL.md` STEP 4). Do not
explain or defend the edit before he has watched it.

## 34. Two defects he found in one sentence: over-zoom, and captions off the voice

Tal, same message: *"You zoomed way too much and the captions are not set when
I'm speaking. You did the wrong time."*

**OVER-ZOOM.** `lib/framing.mjs` targeted a face at **0.20 of frame height**
with a `maxZoom` of 2.1. On a 9:16 crop of a 4K source that is close to a
portrait: it crops out the street, the other person's hands, and the thing
being given — the parts that make the shot read as a real encounter instead of
a talking head. Widened to **0.145 face / 0.135 profile / 0.10 body**, ceiling
**1.55**. A shot that genuinely needs more than 1.55x is the wrong shot.

**CAPTIONS OFF THE VOICE — and the cause is subtle.** The chunks of a segment
were spread EVENLY across its span (`a0 + ci * per`), then allowed to snap to a
real word onset **only if that onset was within 0.6s**. The two halves defeat
each other: Groq's segments are frequently rounded to whole seconds, so the
even estimate can start 1-2s from the voice, and once it is more than 0.6s out
**the snap is forbidden from reaching the word actually being spoken.** The
caption sits on screen through silence, then arrives late on the next line.

Speech is not evenly spaced — a sentence and a two-second pause occupy the same
clock but not the same words. So a chunk's start now comes from **which word it
begins on**: chunk *i* starts at the word onset whose index matches its first
word, proportionally (proportional because a translated segment has a different
word count from the original-language audio that carries the timings). Each
caption then runs **until the next chunk starts**, so a long word holds, a
quick one passes, and there is no gap where a line has ended but the speaker is
still talking.

**The general rule: never derive a caption time by dividing a clock.** Derive it
from the word being said.

## 35. "It repeats itself" — overlapping beats played the same audio twice

Tal, 2026-09-23: *"The cuts are bad and it repeats itself, man."*

He was hearing it exactly. `call-my-mother`'s beats ran **14.6-21.4, then
21.0-28.2, then 28.0-33.2** — each starting BEFORE the previous ended, so 0.4s
and then 0.2s of the same audio played on both sides of the cut. On a sentence
boundary that is a stutter: the last word is heard, the picture cuts, the word
is heard again.

The overlaps were not malicious. `autotrim` pads each beat outwards to protect
word tails (CLAUDE.md: *"cut later, not earlier"*), which is right for the OUT
point and wrong for the next beat's IN point.

`build-edit.mjs` now detects two consecutive beats from the **same clip** whose
spans overlap and moves the later IN to the earlier OUT — **and prints it**,
because an overlap can also mean the beat list is wrong in a way only a human
should resolve. Nothing is lost: the audio is already in the previous beat.

**Check for this on every project.** It is silent in the edit JSON and obvious
in the ear.

## 36. Stop zooming on every beat

Tal, 2026-09-23: *"You don't need to zoom in just because I gave you that
skill. I did say you need to zoom in — it's just an idea so you can get
better."*

Two separate over-zooms were happening:

1. **A push on every single beat.** The default `zEnd` was 1.06, so every shot
   drifted whether or not the moment wanted it. A move on every beat is a tic,
   not a choice. Default is now **1.0** — a push happens only where the edit
   explicitly asks for one.
2. **The crop itself.** `lib/framing.mjs` targeted a face at 0.20 of frame
   height with a `maxZoom` of 2.1. Widened to **0.145 / 0.135 / 0.10** with a
   ceiling of **1.55**.

**And the deeper point, which is the one to remember:** a tool Tal hands over
is an *option*, not an instruction. He gave 71 skills and a zoom skill and
meant "here is more you could reach for" — not "apply all of this to
everything". Reaching for a capability because it exists is how an edit ends up
full of moves nobody asked for.

## 37. Captions that cannot be read are not captions

Full measured spec now lives in **`LOOK-AND-SOUND.md`** — read that before
touching caption or grade code. The short version:

- 78px **all-gold** over a white shirt in Jerusalem sun is close to invisible.
- The style Tal chose from his own references is **white body, ONE gold key
  word per line**, Arial Black, 94px, heavy stroke.
- `drawtext` **cannot** do a two-colour line — it takes one `fontcolor` for the
  whole string. `scripts/render-caption.py` renders a PNG with PIL and the
  builder composites it with `movie=` + `overlay`.

## 38. Grade to a measured target, and re-measure after every change

Tal handed over a reference and said the grading was *"pretty shit"*. Measured,
the reference sits at **YAVG 102, YMIN 0, YMAX 255**, with a music bed 2.8x the
speech band in the quiet passages.

The first replacement curve crushed our cut to **YAVG 90.5** — *darker* than
the reference it was copying — because planting the black point also dragged
the midtones down. Second attempt overshot to 109.1. Third landed on **102.0**.

**That loop only works because it was measured each time.** "Looks graded" is
not a check. `signalstats` YAVG against the reference is.

**And the honest caveat:** SATAVG is **not** comparable across different
footage. Ours reads 5.1 against the reference's 8.6, and chasing that number
would turn skin orange — a white polo and grey limestone cannot be as saturated
as whatever the reference shot. Use YAVG as the target, SATAVG as a range.

## 39. Music is the one gap I cannot close alone

The reference's look includes a **continuous music bed** — measured at 2.8x the
speech band during its quietest quarter. There is no music library on this
machine; `skills/toolbox/media-use/audio/assets/sfx/` has whooshes, impacts and
risers but **no music**, and CLAUDE.md §1 Rights forbids lifting the bed from
Tal's reference.

**Say so plainly rather than shipping a silent cut as finished.** And match the
device to the film: a whoosh on every cut is a Hormozi device and would be
vandalism on a boy telling his mother he loves her.

## 40. A cut that isn't a cut — contiguous beats must share one framing

Tal, 2026-09-23: *"on the 18 second marker it cuts and then it doesn't look
clean, it doesn't flow."*

At 18.6s `call-my-mother` moved from beat 2 to beat 3. Both come from the SAME
clip and join without a gap — beat 2 ends at 33.2 and beat 3 starts at 33.2, so
the action on screen is unbroken. But **framing is computed per beat**, and the
two crops landed at `@366,737` and `@331,829`. The picture jumped 35px across
and 92px down in the middle of a continuous movement.

**That jump cut was manufactured by the renderer, not by the edit.** Nothing in
the beat list is wrong; the same shot was simply framed twice and the two
answers disagreed. It is invisible in the JSON and obvious on screen.

Two fixes, both in `build-edit.mjs`:

1. **One shot, one crop.** Consecutive beats from the same clip that join
   within 0.05s are grouped, the face is located once across the whole run, and
   every beat in the group gets the identical crop. On this film all four beats
   turned out to be one continuous take (14.6-35.6) — so there is now nothing
   to see at any join.
2. **No audio fade at a join that is not a cut.** The 25ms in/out exists to kill
   the click of splicing on a non-zero sample. On a contiguous run there is no
   splice to hide, and fading every join put a small dip into continuous speech
   every few seconds — audible as exactly the lack of flow he described.

**The general rule: a beat boundary is an editorial device, not automatically a
visual one.** Before treating one as a cut, ask whether the footage actually
cuts there. If it doesn't, the renderer must not invent a discontinuity —
picture or sound.

## 41. A "cut" he can HEAR — one shot must have one noise floor

Tal, 2026-09-23: *"I don't understand why on the 22nd marker there's like a cut
and it changes position, it's weird. Did you reduce noise also?"*

Both halves of that sentence are the same bug, and the second half is the clue.

**The picture was innocent — and it was worth proving that before changing it.**
Measured across the join: YAVG 105.3 before, 105.2 after (no exposure step); a
best-fit background alignment of dx=0 against a within-beat control (no
geometric shift). The frames really are continuous.

**What changed was the AMBIENCE.** Denoise attenuation is measured PER BEAT from
that beat's noise floor, so one unbroken take came out `-a 16, -a 16, -a 12` —
and the Damascus Gate street tone audibly changed character partway through a
continuous shot. The ear reads that as a cut and the eye then goes looking for
one.

Adaptive denoise is still right ACROSS locations (a market needs more than a
quiet street, LESSONS §27). It is wrong WITHIN one unbroken shot. The
attenuation is now measured **once per continuous run** and reused by every
beat in it.

**Two mistakes while fixing it, both worth keeping:**

1. The first version stored a **separate object per beat** in the group map, so
   every beat still computed its own value and "shared" nothing. Sharing by
   reference is the point.
2. The first probe measured the floor **via `cleanAudio()` — which denoises
   before measuring.** It read an already-cleaned file, decided the street was
   quiet, and picked `-a 10` for footage that needed 16. **Never measure a
   signal through the process you are trying to calibrate.**

**The general rule, now three lessons deep (§40, §41):** anything computed
per beat — framing, exposure, denoise, gain — becomes a visible or audible
seam when consecutive beats are really one continuous shot. Compute it for the
SHOT, not the beat.

## 42. Beats can render from a PROXY without anything failing

Found while chasing why coffee-kindness stayed soft no matter what the grade
did: it was cropping **168 pixels wide** out of a 360x640 proxy and upscaling
that to 1080x1920.

`fetch-hq.mjs` pulls only the SECONDS each edit uses — one span per clip. But
if the beat list later changes, or a second project reuses the clip over a
different stretch, the beat falls outside the span and `build-edit.mjs`
**silently drops to the proxy**. It prints a note; nothing errors; the render
succeeds; the file looks mushy and nobody can say why.

**Eight of 32 films were affected** — coffee-kindness, what-makes-you-happy,
eden-music, flowers-christian, giving-water, giving-water-v2, hospital-music,
hospital-ramallah.

Check it directly — the beat spans against the union of every HQ manifest:

```
beat outside [offset, offset+length]  ->  that beat is rendering from a proxy
```

**Re-run `fetch-hq.mjs <slug>` after ANY change to a beat's in/out**, and check
the whole set before delivering. This is invisible in a contact sheet unless
you already know to look for softness.

## 43. Never fetch HQ spans in parallel — two projects can share a clip

Re-fetching the eight with `xargs -P 2` corrupted `a8195320`: two projects use
that clip, both fetches opened the same destination path, and the result died
on decode with **"Error splitting the input into NAL units"** — taking
hospital-ramallah and shalom-salam down with it.

This exact failure is already recorded from an earlier session and I repeated
it the same day. **Fetch serially.** The download is not the slow part.

**And `ffprobe` will not catch it.** A corrupt span still reports a clean
duration because the container header is intact. Decode-test instead:

```bash
ffmpeg -v error -i <file> -t 1 -f null -     # empty output = genuinely OK
```

## 44. find-faces is how a dead beat gets re-placed

`giving-water` captioned "thank you guys for all your hard work" over a
**wheelbarrow of tools**, and an earlier beat over an **empty street** — the
latter created by a hand-authored "picture -9s" shift from a previous session
that moved the beat OUT of the only stretch holding people.

`scripts/find-faces.mjs` scans the WHOLE clip and reports every run that holds
a face. On that clip: only **33.6-49.6s and 54.6-58.6s**. Both broken beats sat
outside both runs; the fix was to move the PICTURE into a measured run and
leave the audio where it was, via `push.audio`.

> **Guessing a nearby window is what created the defect. Measure the runs,
> then place the picture in one.**

**Mind the span offset.** find-faces reports times in the file it opened — for
an HQ span that is span-relative, and the manifest's `offset` must be added to
get the original timeline. Same trap as LESSONS §41's check-beats bug.

## 45. Captions come from the AUDIO, not from the transcript's word array

Tal, 2026-09-23: *"check every video, that it makes sense and the captions are
actually appearing when I speak."*

`scripts/caption-sync.py` now measures it: every caption's start against speech
detected in the **finished file's own audio**. Not the transcript and not the
edit JSON — those are what produced the timings, so they cannot check them.

**The instrument was wrong twice before the edits were.** Version one built the
timeline from `edit.json` durations and reported the whole library as broken —
but `snapBoundaries` makes a rendered beat routinely 0.3-1.2s longer than its
JSON span, and the error compounds down the film. It reads the **rendered
segment lengths** from `beats_*/` now. *A measurement that condemns everything
is usually measuring the wrong thing; check it before acting on it.*

**Then it found the real bug.** Placement indexed into Groq's word array, which
this repo already knows is unreliable (not in speaking order, end times
overrun). "I'M FROM PALESTINE" landed 1.2s after the line had finished. Now:
the **segment's own span** gives a rough estimate of which moment a chunk
belongs to, and the estimate is snapped to a **speech onset measured from the
audio** (`scripts/speech-onsets.py`, a relative threshold so a loud market is
not called silent).

**And my first fix made it worse** — I consumed onsets like a queue, so early
chunks swallowed onsets and shoved later ones past their moment. **Onsets are
not a queue.** Each chunk takes the nearest onset to its estimate, forbidden
only from going backwards in time.

**Honest limit: the metric reports QUIET SPEAKERS as silence.** The mother in
hospital-ramallah is off-mic at -55dB; the caption is correctly placed and the
tool still flags it. Use the metric for gross errors; do not re-cut good
footage to chase it.

## 46. `push.audio` never rebased for HQ spans — every graft played the wrong moment

The worst bug of the session, and completely silent.

`push.audio.at` is stated on the ORIGINAL timeline, but an HQ span begins
`offset` seconds into that original — and the audio path used `at` directly
against the span file. **Every cross-camera audio graft reading from an HQ span
played a moment `offset` seconds late.** Seven projects carry grafts:
call-jerusalem-peace, coffee-kindness, feed-homeless-roman,
flowers-for-strangers, giving-water, giving-water-v2, shalom-salam.

giving-water-v2 asked for 9.0s of a span starting at 5.0s, read 14.0s, ran off
the end of a 17.5s file — and `-shortest` silently truncated that beat from
13.5s to 8.5s, taking **six captions off the end of the film** where they could
never appear. Nothing errored. It only surfaced because caption sync was
measured.

**Two more fixes came out of the same beat:**

- **Captions follow the AUDIO, not the picture.** A grafted beat plays one
  clip's picture over another window's sound (`[picture -2s, audio unchanged]`),
  and captions were still looked up against the picture window — so they were
  offset from the voice by exactly the graft.
- **A beat cannot ask for more footage than the clip holds.** Probe the source
  and clamp, loudly. `-shortest` will otherwise hide the overrun.

## 47. A crop aimed on 10% of samples is not an aim

`eden-simple` framed a beat where the detector found a face in **one sample in
ten**, and put the crop at `y=0` — so a hospital scene rendered as a balloon
and wall sockets with Eden squeezed along the bottom edge.

Below ~25% confidence the detector has not found anyone, and a confidently
wrong tight crop is far worse than none: **the full frame always contains
whatever is actually there.** Those beats now fall back to it.

Related, from shalom-salam: when the source is only slightly wider than 9:16
(1440x1920), there is no zoom to give back — only WHERE the 1080-wide window
sits. A subject walking across frame will leave an aimed window. **Centre it and
do not chase.**

## 48. He edits the same footage as a TWO-CAMERA CONVERSATION

Tal, 2026-09-24, handing over his own cut of the coffee-shop material:
*"notice how it switches between times ... that's the multi angle, just like
the video of the POV style and then a long angle."*

Full measured spec: **`formats/two-camera-kindness.md`**. The headline, and the
reason four attempts at coffee-kindness failed:

**The two cameras alternate continuously — A/B/A/B, median 2.28s a shot, 18.7
cuts/min across 52 shots.** The POV carries the owner's face, the hands, the
money. The long lens carries Tal at the stall and the market around him.

Every earlier attempt treated the Sony as "the correctly exposed camera" and
tried to build whole stretches from it — then hit the wall that the shop owner
is hidden behind signage in the Sony wide for most of the conversation. **That
is not a problem in his cut, because the Sony never has to show the owner.**

> **Never reject a camera because the subject is not in it. Ask which angle
> serves THIS beat.** Coverage is chosen per beat, not per film.

**Three more corrections from the same file:**

- **The story continues past the transaction.** The free drink is carried out
  and given to an Eritrean street cleaner. The payoff is the kindness being
  passed on — the same shape as shop-owner-bread's ending. Look for that second
  beat; it is the ending, not a coda.
- **His captions are plain WHITE, 1-3 words, mid-frame** — and **bilingual when
  the speaker is in Hebrew** (English above, Hebrew below). That contradicts
  CLAUDE.md 0b rule 3 ("English only"), which came from Jamaica. Surface the
  contradiction rather than silently picking one.
- **One grade target does not fit every film.** His coffee-shop cut measures
  **YAVG 61.5 / SAT 4.1**; the "Spread love" reference is 102 / 8.6. The awning
  makes the stall genuinely dark. What IS constant across both: **black planted
  at 0, highlights reaching 255.** The midtone level belongs to the scene.

## 49. He wrote the craft standard down himself — stop inferring it

2026-09-24, right after the coffee-shop cut, Tal handed over a written house
standard: story and pacing, captions, camera and cuts, visual treatment, audio
and music, and a 7-point quality check. It is in `EDITING-DOCTRINE.md`, in his
words, at the top of the skill's authority order.

**Stated direction beats a measurement of one file, and both beat a guess.**
Most of this system's rules were reverse-engineered from references; these were
given. Where an older file disagrees, this wins.

**It closes the two contradictions §48 left open, and one more:**

- **Captions are WHITE**, bold uppercase with a dark outline or shadow, 1-3
  words (one word for emphatic dialogue). The gold key word from the 2026-09-23
  screenshots is now a hook-line device, not the house style. `LOOK-AND-SOUND.md`
  annotated; CLAUDE.md §0b rule 3 amended.
- **Bilingual is sanctioned but subordinate** — "a smaller secondary
  original-language line may sit below **only when it adds useful context**".
  Not a co-equal second caption, and not automatic on every Hebrew line.
- **Position is lower-middle, clear of faces, hands and platform controls** —
  not a fixed ~72%. It has to be checked against the actual subject in the
  actual shot.

**Two lines that are checks on things I have actually got wrong:**

- *"Cut on completed thoughts and emotional turns, not at arbitrary time
  intervals."* The 1.5-3s alternation measured in §48 is the RESULT of cutting
  on turns. Imposing it as a cadence reproduces the number and loses the reason.
- *"The most human reaction is not cut off early"* and *"let reaction shots
  breathe slightly longer than ordinary dialogue cuts."* The pipeline pads
  ~0.45s after the last word uniformly. A reaction beat wants more than a
  dialogue beat does.

**Music: stood down.** The standard asks for a bed that rises on movement,
reactions and the payoff — and an hour later he said *"It's fine. You don't
need to add music."* No library exists here anyway and §1 Rights forbids
lifting one from his references. **Deliver without music and stop flagging its
absence in every hand-off.** I had been treating a missing bed as a blocker on
finished work; it was never one.

**And the shape of the fix mattered as much as the content.** He did not want
another document: *"there shouldn't be like a hundred skills for video editing,
there should be like one skill."* The rules are now **inline in `SKILL.md` ->
THE STANDARD**, in force with nothing else loaded; every other file in the
folder is an appendix. **Default to folding a new rule into SKILL.md. Creating
a file and linking it reads to him as another skill to manage.**

**And a rule written down is not a rule until the code does it.** Three things
in the pipeline still contradicted the new standard after the docs agreed with
it: `render-caption.py` gold-emphasised a word on EVERY caption, `CAP_Y`
defaulted to 0.72, and three markdown files still described his look as "gold
ALL-CAPS at ~72% height". All four are changed; white and 0.66 verified by
rendering the PNGs and looking at them. **After amending a style rule, grep the
scripts for the old value, not just the docs.**

## 50. Nothing goes to Frame.io until he has approved it in chat

2026-09-24. Tal had me delete **every** cut this system ever uploaded —
all 11 live assets in `FINAL VIDEOS / EDITED BY CLAUDE`, the approved
`JAMAICA HELP.mp4` included — and all 82 local renders (7.13 GB). His words:
*"delete kind of everything you have edited for me because everything has been
bad ... now you have all the skills, so now you can practice more and more."*

**The rule, from him, in the same breath:** *"for the Frame.io, we should start
it locally in the chat, and then move there."*

- Render locally -> show a low-res preview in chat -> **he says yes** -> only
  then `auto-deliver.mjs`. Uploading a review version is now a defect, not a
  convenience. This is LESSONS 33 restated after it was ignored at scale.
- `frameio-remove.mjs` is the only delete in the system and its three guards
  held: folder resolved live, name must be in the ledger, nothing without
  `--yes`. Do not loosen them.
- **The ledger was stale** — `delivered.json` listed 4 of the 11 files actually
  on Frame.io, because `auto-deliver.mjs` never appended to it. Provenance was
  re-established a better way: every live name matched a local render this
  system produced. **Verify provenance against the artifact, not the log.**
- Two things were deliberately NOT deleted: `projects/_refs/` (20 of Tal's own
  reels — his work and the measured basis for the house style) and the
  `edit.json` / `BUILD-LOG.json` recipes. *"Remember how you edit those."* The
  recipes are the memory; the MP4s were the waste.

**I also overwrote `SHOP_OWNER_BREAD_V5.mp4` in place during this session**
instead of rendering V6, which breaks CLAUDE.md 1 ("new render = new file").
It did not matter in the end because everything was deleted an hour later, but
the bug is real: `build-edit.mjs` writes to `cfg.out` and will happily clobber
a delivered file. Bump the version before re-rendering something already sent.

## 51. Captions landing in the GAP AFTER the speech they caption

Tal, 2026-09-24: *"make sure when I speak then the captions show up."*

Measured on the finished files, two separate defects — and **one wrong
instrument that hid both**.

**The instrument first.** `caption-sync.py` v1 scored every caption by its
distance to the nearest speech ONSET, and reported all 25 films as broken,
including `call-spread-love`, which Tal had reviewed and called clean. An onset
is the start of an utterance; most captions do not start one, they replace the
previous line mid-sentence where no onset exists. **v1 was punishing captions
for appearing mid-speech.** Rewritten to measure COVERAGE — how much of a
caption's on-screen life has speech under it — with onset error kept only for
captions that genuinely open an utterance. v1 kept as `caption-sync-v1.py`.

*Third time an instrument in this project condemned good work. Validate the
measurement on something known-good before believing it.*

**Defect A — beat-final captions held through the reaction tail.** The caption
end was `nextStart = ... : b0`, the end of the beat. So the last line of every
beat stayed up across the protected word-tail and the reaction we deliberately
let breathe. Measured: `shop-owner-bread` held `'I LOVE YOU'` over 100% silence,
`'WHO NEEDS IT. OKAY'` over 85%. Fixed — a beat-final caption now lives for its
reading time and clears, plus a `HOLD_MAX` of 2.2s so a long gap never parks any
line on screen. On a re-render, median coverage went 0.70 -> 0.82 and
captions-on-words 43% -> 58%.

**Defect B — the real one, still open.** Some captions sit in the SILENCE
BETWEEN two utterances. `shop-owner-bread`: speech runs at 24.8-25.5s and
26.6-27.0s, and `'I LOVE YOU'` is drawn 25.54-26.43 — dead in the gap, starting
0.04s after the words it captions ended. `"I'M ISRAELI. YES"` the same at 55.1s.
**The caption is one phrase late: it appears when the line FINISHES.** Suspect
the word-index -> time mapping plus the forward-only onset snap (`if (o < last)
continue`), which can only ever push a caption later.

**Also found:** the beat-end clamp can produce a caption shorter than the 0.8s
readability floor the code's own comment demands — `"I'M ISRAELI. YES"` rendered
for 0.46s.

**And `BUILD-LOG.json` only recorded a caption's START**, so the checker had been
measuring a GUESSED window for months. `build-edit.mjs` now logs `to` as well.

**Independent confirmation.** AutoSubSync / ffsubsync (Tal supplied it) was run
against the rendered files as a second opinion: `shop-owner-bread` +0.035s (no
offset), `coffee-kindness` **-0.248s across all 61 cues** — a real global late
bias, consistent with Defect B. It is a whole-file synchroniser, so it can
diagnose an offset but cannot fix a single misplaced line. Worth keeping as a
check; not part of the render path.

`tscaps` was also suggested and assessed: a browser/WebCodecs caption renderer
with 38 animated templates. It styles, it does not fix timing, and this
pipeline is headless ffmpeg on Windows. **Not adopted** — the complaint is
timing, and our renderer already produces the look he approved.

## 52. THE CAPTION DRIFT — found, fixed, and now guarded by a test

Tal, three times: *"the captions are not set when I'm speaking"*, *"the
captions r actually apeairng when i speak"*, *"make sure when I speak then the
captions show up."* Each time it was patched by adjusting a snap tolerance.
The cause was one line, somewhere else entirely.

**The bug.** Caption placement computed

    const a = Math.max(prevEnd, ...)

so a caption could not begin before the PREVIOUS caption ENDED. Every caption
is held a readable minimum (>=0.8s). Therefore **whenever anyone spoke faster
than that minimum, each line shoved the next one later, and the error
accumulated down the beat:**

    voice at    0.0  0.5  1.0  1.5  2.0
    caption at  0.0  0.8  1.6  2.4  3.0
    late by       -  +0.3 +0.6 +0.9 +1.0

The fifth caption arrives a full second after the words it captions — i.e. as
the sentence finishes, which is exactly what Tal kept describing.

**Why it survived so long:** at a normal talking pace (~1.0s between lines) the
0.8s floor never binds and nothing looks wrong. It only bites in fast exchanges
— which is most of the material worth keeping. Every previous fix tuned the
snapping, and the snapping was never the problem.

**The fix, in two parts.**
1. A caption starts on **its own speech onset** and is never pushed by the one
   before it. The PREVIOUS caption is cut short by the next one's arrival —
   captions replace each other.
2. Lines arriving closer together than they can be read are **MERGED**, not
   delayed. Delaying to make a line readable is what caused the drift. This is
   Tal's own rule: *"treat captions as rhythm: rapid speech produces rapid
   replacements."*

**A third defect found while fixing it:** onsets were assigned greedily, each
line taking the onset nearest its own estimate. Greedy strands lines — with
five onsets and five lines, line 3 took onset 4 because it was 0.06s nearer,
and line 5 then found every onset used and fell back to an estimate 0.56s off
the voice. Around a pause it was worse: a line sat in the silence while a
perfectly good onset went unused. Now solved as a whole with a small DP that
picks strictly increasing onsets minimising total error.

**It is a testable unit now, not buried in the renderer.**
`system/scripts/lib/caption-timing.mjs` + `system/scripts/test-caption-timing.mjs`.

    node system/scripts/test-caption-timing.mjs          # must print 0 0 0
    node system/scripts/test-caption-timing.mjs --old    # reproduces the bug

The test checks three things on synthetic speech with KNOWN onsets: every
caption within 0.25s of its voice, none shorter than 0.45s, none over silence.
**Run it after touching anything in caption placement.**

Verified against real audio too — real onsets measured off one of Tal's own
reels, 12 lines: **11 captions, all 11 starting exactly on a measured onset,
2 pauses left clean, and two lines 0.39s apart correctly merged** instead of
one being delayed.

> **The wider lesson: the third time a symptom comes back, stop tuning the
> thing you tuned before.** The snap was adjusted three times. The defect was
> in the line that computed the START from the previous caption's END, and no
> amount of snapping could reach it.

## 53 — an instrument that cannot fail loudly is worse than no instrument

2026-09-26. Tal handed over `denizsafak/AutoSubSync` and asked that every repo
he gives actually work. It was already installed (`assy-cli` 1.0.1 +
`ffsubsync` 0.5.1) — what was missing was any record of that, so an earlier
search for a *skill folder* concluded "never installed". **Register the repo,
not the folder.** `REPOS.md` is now that register.

Wired as an independent timing check — the caption-qc rule says never verify
with the engine that generated the captions, and until now the only check was
`speech-runs.py`, which placed them. First run on EDEN V9: **+24.29s median
shift** on a 91-second film. Absurd on its face.

**The control that caught it:** inject a known +2.000s offset, demand −2.000s back.

```
one continuous clip   -2.00 / -2.00 / -2.00      exact, every cue
13-beat montage       -0.27 / -8.48 / +11.55     noise
```

ffsubsync fits ONE global shift. Across hard cuts there isn't one, and it does
not error — it returns a confident wrong number. The wrapper now refuses on a
multi-beat build.

Then it failed again on single clips, differently: it returned **3 of 14** cues
on clip 01, 4 of 17 on 03, 2 of 20 on 05. It silently drops any cue a bad shift
would push before t=0, so a catastrophic misalignment looks like a short file.
Comparing the survivors by index — cue 1 of theirs is cue 12 of ours — produced
**three false FAILs on captions that were fine.** Cue loss is now an
INCONCLUSIVE verdict, not a failure.

It locks on where speech is continuous and loses lock where it is sparse with a
repeated phrase ("HAPPY NEW YEAR" four times — many equal correlation peaks).
It gives no confidence signal. **So it can corroborate timing and never
condemn it, and nothing gets rejected on its say-so.**

Fourth time an instrument here has condemned good work — after caption-sync v1,
the 0.30 scene threshold, and the onset detector on street audio. The pattern is
always the same and so is the fix: **before trusting a new measurement, feed it
an answer you already know and check it gives that answer back.**
