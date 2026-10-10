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
machine; `skills/tal-video-editor/assets/sfx/` has whooshes, impacts and
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

## 54 — the exposure fix only ever went one way  [S]

2026-09-28, ROMAN: *"some of the shots are overexposed. You gotta fix that."*
The per-beat exposure block in `build-edit.mjs` was written after the coffee
shop came out "way too dark", so it only LIFTED beats under luma 92. A midday
street was never touched — and then `GRADE` ran on every beat and pushed the
highlights UP (0.85 -> 0.92) with +42% saturation. Measured on the source: the
new-clothes shot at luma **206 with 37% of the frame clipped to white**; after
the old grade, **214**.

**A correction for one direction is half a correction.** Added the TAME branch
(luma > 125): midtone pulled down, black held, white point eased on the worst
frames, and most of GRADE's saturation given back. Tested on stills before
rendering — 206 -> 164, 185 -> 158, 172 -> 148, 141 -> 129.

The first version overcorrected: pulling a near-white shirt down to the mids
REVEALS colour, the +42% saturation then boosts it, and the cream shirt went
orange and blotchy. Compare before/after stills of the worst shot every time.

The honest ceiling: this footage is 8-bit. Sky already at 255 is gone. The
fix restores faces and skin; it does not invent highlight detail.

## 55 — whose line is it, and what does it actually say

ROMAN had been cut before (V7, delivered 2026-09-21). Reading the Hebrew and
looking at who was on camera found four errors that version carried:

- **The best line was given to the wrong person.** *"If I have the strength to
  give someone food, I always give it"* is the shawarma OWNER's — his mouth is
  moving at C0491 21.0s/22.3s, and the lines around it are Tal asking *him* why
  he helps people. V7 and the pasted brief both gave it to Roman. **Before
  attributing a line, look at whose mouth moves.**
- **A translation inverted the meaning.** *"I thought everything he did, he did
  FOR me"* — the Hebrew is נגדי, **against** me. It is the whole point of the
  father story. Also *"I was getting tired"* = I used to REBEL; *"eat them"* =
  FEED them; *"what he doesn't kill with us is deceiving us"* = what doesn't
  kill us makes us stronger.
- **"Two days" was Tal's question, not Roman's answer.** He says *a day and a
  half*. Caption what the person said, not what the brief assumed.
- **The chronology the brief asked for was impossible**, and the footage had
  the answer: the new clothes (C0488, 11:42) precede the food (C0489, 11:44),
  but the real goodbye (C0492, 279-299s) is on the street *in* the new clothes
  — so ending there is both chronological and the clothes payoff.

Machine translation is a draft. On every line that carries the story, read
the Hebrew.

## 56 — two builder traps found on ROMAN, both silent

**Snapping stretched a 3-second hook to 8.8 seconds.** `snapBoundaries`
extends a beat to the edges of the utterance it sits in. On C0489 it pulled the
hook's head from 123.4 back to 117.94 — the whole lead-in became the opening.
It also dragged the goodbye back into a camera whip (278.5) and Roman's line
forward into a passer-by (289.93), and added a stuttered "I... I" after "you
look good". Nothing warned. **Read the `NN local-xx a->b (dur)` lines of the
build log against the edit after every render** — any beat whose duration
differs from what was asked has been moved. Pin it with `push.exact: true`, or
`"snap": false` for a whole montage (added this session).

**`captionFix` runs twice, and collides.** Once on the sentence before it is
split, and again on every finished caption — where it also uppercases the
replacement and bypasses the line-splitter. A rule whose `to` restated a whole
sentence produced, on screen: *"This is for you / Here This is for you / THIS IS
FOR YOU. TAKE OFF YOUR SHIRT."* **Correct the words in the translation cache
(`cache/translate/<id>.json`, with the machine version kept as
`.bak-machine`), not with caption rules.** Keep `captionFix` for dropping a
line (`to: null`).

**And time corrected lines from the Hebrew WORDS, not the machine segments.**
The translation's segments are rounded to whole seconds; Roman pauses
mid-thought ("בהתחלה" alone runs 11.2-13.6s), so captions spread across a
rounded window landed in the gaps — `caption-sync` flagged 9 as over silence.
Re-timed to word boundaries: every one of those moved onto speech. Where the
transcriber stretched a word across a pause ("now" held 14.82-15.92), measure
the voiced intervals with `speech-runs.py` instead.

`caption-sync` itself was checked before being believed (LESSONS 53): the
flagged windows were cut from the rendered file and re-transcribed. Where it
said silence, whisper heard only "תודה" — its known hallucination on
near-silence. Where it said a caption was off but whisper heard the words
("Come on"), the flag was the instrument's, not the edit's.

## 57 — a contact sheet cannot see a colour-range bug

ROMAN, 2026-09-28. Every contact sheet looked right, and two finished files
were still wrong. The chest cam is full range, the Sony limited; beats were
encoded in their source's range and joined, and the finished file carries ONE
range. Sheets are drawn by ffmpeg per beat, honouring each beat's own flag —
so they look fine. A phone, or Instagram's re-encoder, reads the file's flag.

The only way to see it: **decode the same frame from the beat file and from
the final, and compare the black and white points.** Montage Sony shots: 0/254
in the beat, 16/236 in the final. Fixed in `build-edit.mjs` (every beat ->
limited range; final tagged `tv`). After any render that mixes cameras, run
that comparison on one beat from each camera — it takes seconds.

## 58 — a reel downloaded from Instagram cannot tell you its loudness

Instagram harvest, 2026-09-28. Six agents measured 58 downloaded reels from
six accounts (Tal, NAS, aija, erez.v1, Montana, MD Motivator). **Every one
read −14.0 to −14.7 LUFS** — dance clips, song reels, VO films, hidden-camera
dialogue alike. The same day, Tal's ORIGINAL exports of his own films (the
Drive zip) read −6.2, −6.4, −9.1, −13.3 and −14.5. Instagram normalises what it
serves; the file you download is the platform's loudness, not the creator's mix.

So "−14 LUFS, measured from a successful example" proves nothing if the
example came off Instagram — `formats/social-accords.md`'s "Music −14 LUFS"
row and the call-someone-you-love "calibration point" are both suspect for
this reason. **−14 LUFS stays the delivery target** (it is the platform
norm), but never cite a download as evidence for it. What DOES survive the
platform: loudness RANGE (song-driven 0.5–3 LU vs dialogue 7–11 LU), the
music bed's level under the voice (mid vs side), and where the bed swells.

## 59 — the self-review gate passed a video it never checked

israel-batch, 2026-09-29. `selfreview.mjs` printed "0 captions, 0 flagged"
on a test render that clearly had 53 captions on screen, and
`verify-cut.mjs` verified nothing. Both resolved a beat's clip id only if it
was a Frame.io uuid or a DJI tag. Local footage from `transcribe-local.mjs`
has ids like `local-b7bc…`, matching neither, so every beat was skipped
silently. **A gate that finds nothing to check must say so, not pass.**
Fixed: an id with a transcript on disk is used as-is. selfreview now also
prints section 2b, the captions as actually rendered (from BUILD-LOG.json),
which is the list to read as English. After the fix the same test reported 9
real cut-point problems and 2 garbled captions.

## 60 — Groq timings on Meta-glasses footage are too loose to cut on

Same batch. Groq's SEGMENT times came back rounded to whole seconds (0.0–2.0,
2.0–5.0 …) and its WORD times were loose and out of order ("Someone who who
loves is always"). The builder takes caption wording from segments and timing
from words, so:
- a sentence that straddled a cut was dropped whole: a beat about "what makes
  you happy?" rendered with no captions at all;
- cut points landed inside words ("Yeah", "for", "So", "Wow").

Fix: `tools/align-cache.py` keeps Groq's TEXT and re-derives every segment
and word time with WhisperX forced alignment (wav2vec2). Test clip: 0 words
out of order (was scrambled), segment boundaries exact, verify-cut went from
9 issues to 1 (a segment alignment couldn't pin, which kept its rounded
times). It runs ~0.5x realtime on CPU, so align only the clips a catalogue
marks usable, 3 workers in parallel (`--ids-file … --shard i/3`). **Cut on
aligned SEGMENT boundaries.**

## 61 — three silent builder faults found by the overnight batch

israel-batch, 2026-09-29, found while cutting ~30 videos. Each one produced a
plausible-looking render with nothing in the log:

1. **Hook-first V2s lost their opening.** A hook beat from late in a clip
   (114–124 s) followed by the story from its start (3.6 s) was read as a 120 s
   overlap ("P.to − C.ss"), judged "entirely inside" and dropped. Every
   hook-first variant of a single-clip story was 5–10 s short. Now a beat that
   starts BEFORE the previous one is a deliberate jump, never an overlap.
   Proof: the Hindu-couple test went from 50.5 s to 56.0 s against 56.1 s of
   beats, with the missing "what makes you happy?" beat and its 5 captions back.
2. **Quiet lines had no caption.** When the audio-energy detector heard no
   speech inside a segment, the caption list for it came back empty and the
   line vanished ("Thanks.", "No, I don't.", "You know my age"). On a
   WhisperX-aligned clip the aligned word times are now used as the speech runs.
3. **The build log recorded captions before the one-at-a-time trim,** so
   selfreview 2b showed overlaps the render never drew. It now logs what is on
   screen. A checker that reports the wrong thing trains you to ignore it.

`test-caption-timing.mjs` still prints 0 0 0 after all three.

## 62 — a caption must HOLD until the sentence is finished (Tal, 2026-09-29)

Tal, reviewing the israel-batch: *"When I speak, the caption comes up, but it
doesn't hold till I finish my sentence … it doesn't hold till the next person
says something. It should hold that way … the caption pops up for like 0.2
seconds and then it goes away. The person doesn't have enough time to read it."*
Also: *"sometimes the color grading is not perfect, so you need to fix that."*

The rule, now in force: a caption stays on screen from its first word until
the NEXT caption replaces it, bridging the small gaps inside a sentence, and
holds a short tail after the sentence ends. Nothing is shown for less than a
readable minimum; lines that would flash are merged with their neighbour
instead. The screen clears only in a real pause. (THE STANDARD's "pauses leave
the screen clean" means REAL pauses, not the gap between two words.)

## 63 — the grade boosted every clip the same, and sunny footage went orange

Same review (Tal: *"sometimes the color grading is not perfect"*). Measured
every beat of 35 renders against 40 frames of his OWN posted reels: his look is
muted (SATAVG median 13, p90 21; warm tint small, U ≥ -9, V ≤ +10). Ours ran
SAT 36–46 with U down to -35, V up to +33 on the sunny cuts (Morocco, Cesar,
Yusuf's close). Root cause: GRADE applies a FIXED `eq=saturation=1.42` plus a
warm colorbalance, tuned on grey, hazy Damascus Gate footage. Colourful source
got +42% on top of its own colour.

Fix: each beat's probe frame is now also measured for SATAVG/UAVG/VAVG; the
saturation is CUT (never boosted beyond GRADE) so that after GRADE it lands near
20, and a source that is already warm gets GRADE's warm push cancelled. Morocco
before → after: SAT 45→27, V+30→+16, skin no longer orange (stills compared).

Calibration note (instrument check): "washed-out" and "lifted blacks" flags fired
on most videos, but his own posted reels sit in the same range (SAT median 13,
YLOW median 40) - those are his documentary look, not faults. Measure against
his work, not against a generic "good grade".

## 64 — a covered lens is not a shot; the giving IS the shot (Tal, 2026-09-29)

Tal, on the feed-homeless cut: *"it wasn't so emotional ... they didn't choose
the best clips ... [the hand was] just covering the camera, so you couldn't
see. So choose from the part where I'm actually giving it."* And the story
shape he wants: *"I say 'are you hungry?', he says 'yes', then I take him ...
we sit down, and then you choose the most emotional parts of what he said."*

Cause: moments were chosen from the transcript. A line can be perfect while
the picture under it is a palm over the lens. **Every beat's picture is
checked on a real frame before it is kept** — a covered, black or
pointing-at-the-ground span is rejected no matter how good the words are.
A kindness story opens on the ask and the yes, goes straight to the giving
(visible), and spends the rest on the person's most emotional lines. Not
chronology of everything said; the arc ask → yes → sit together → heart.

## 65 — a spelling hint deleted the story (measured 2026-09-29)

From the Creator Stack #113 guide: *give Whisper your names so it spells them
right.* Built as `frameio-transcribe.mjs --names` (Groq `prompt`), then
A/B-tested on three real clips before trusting it.

Spelling did improve: `knafe` -> `knafeh`, `yafos` -> `Yafo`. Not every name
was fixed: `Mas Salaam` became `Masalam`, still not *ma'a salama*.

But on the 80s knafeh kindness-test clip (6435e4c1) the prompted run returned
**138 words instead of 235, identically on two runs.** What vanished was the
whole payoff: *"are you Muslim ... I'm Jewish, we are brothers ... I was
testing to see if you would help me."* It still covered 0.1–80s and none of
the `suspect()` checks (language, confidence, looping, empty) fire on it, so
it would have shipped silently as a clean transcript with the story missing.

**Rule: never prompt the transcriber.** The feature was removed the same day.
Fix spelling where it is cheap and visible: when reading every caption as
English (THE STANDARD rule 5), not by steering the model.

**Open, unverified:** `index-footage.mjs`, `retranscribe.mjs` and
`proj-recaption.mjs` still pass a HOTWORDS `--prompt` to whisper.cpp. Same
mechanism; not yet A/B-tested for dropped words.

## 66 — a held caption must not run two sentences together (found 2026-09-29)

LESSONS 62's hold merges a line that would flash (< 0.8s) into the next one.
The merge joined with a SPACE, and every chunk's punctuation had already been
stripped by `captionLines`, so two sentences became one run-on on screen:
*"NICE TO MEET YOU WHAT'S YOUR NAME"*, *"YUSUF ARE YOU MUSLIM? YES"*,
*"THAT ARE JEWISH A LOT OF FRIENDS"* (Yusuf, full-size render).

**First fix was wrong, caught on a preview render (a few full-size files made during that window were re-rendered):** a line
break at EVERY merge put *"I JUST / LANDED IN ISRAEL"* and *"IT'S MY FIRST /
TIME AND I'M"* on screen. Most merges are mid-phrase; the chunker splits a
long clause, the hold glues it back.

**Rule: break only where a sentence ended.** `captionLines` keeps a closing
full stop on the chunk that ends a sentence (not commas, not an ellipsis);
`build-edit.mjs` reads that as an `end` flag before stripping punctuation;
`holdCaptions` puts `\n` after a sentence end, a space otherwise, two lines
max, full stop dropped at the join; `render-caption.py` honours the `\n` down
to 68% of base size (`YUSUF ARE YOU MUSLIM? / YES` needs 66px of 94), below
that the greedy wrap wins. Tested: `test-caption-hold.mjs` rule 5 (six cases,
including the two failures above) and `test-caption-timing.mjs` 0 0 0.

**Also:** `selfreview.mjs` prints `\n` as ` / ` — a raw newline split the
caption dump and hid its `<-- CHECK` flag from `batch-finalize`'s parser.

## 67 — a flash-frame scan with a wide window hides the flashes (found 2026-09-30)

Re-cutting Tal's own edits into segments (kindness mixes) leaves a segment
ending ONE frame into the next shot whenever the scene detection that found
his cut landed a frame late. In a mix that frame is a blink of a different
person or place. The first pass found two (04d, 05b); a later pass found
four more (02a, 02d, 04a, 05a): a car interior, a street and a shop arcade.

**Why the first pass missed them:** it looked for a scene change anywhere in
the last 0.3s. Tal's own angle cuts sit inside the segments, so that window
hit almost every segment, and the real flashes were lost in the noise.

**Rule:** a flash is a scene change in the last or first **0.12s (≤3 frames)**
of a segment, measured with `select='gt(scene,0.3)'` over the WHOLE segment
and compared with its probed duration. Then **look at the last four frames**
before trimming — every one of the six was confirmed on a still. Fix: take
two frames (0.07s) off that edge in `EDGE_FIX`.

## 68 — a smeared timestamp does not make the flag false (found 2026-09-30)

ROMAN: `verify-cut` flagged the ending beat, *"HEAD cuts into 'okay'
(13.32-14.46)"*. A 1.1s "okay" is obviously a stretched timestamp, so the
flag was waved through as an artifact, twice, on two versions. Re-transcribing
just that source window with a second engine (Groq, 3s of audio) put the real
"okay." at 13.20-13.66: the beat, starting at 13.45, opened on the back half
of the word. "Are" began at 14.32. In-point moved to 13.90.

The opposite case happened the same night: the finished-file check flagged
*"כבר"* across a cut from restaurant noise to street noise, and there was no
word there. Groq on both source windows heard nothing before 1.96s, and the
out-point sat in an energy dip.

**Rule:** a smeared word timestamp tells you the timing is unreliable, **not**
that the flag is wrong. Settle every boundary flag by transcribing the 2-3s
SOURCE window around the cut with a second engine (`lib/stt.mjs`
`groqTranscribe`), plus the RMS envelope in 50ms steps. Say which was done.

## 69 — at full quality, translated captions vanished without a warning (found 2026-09-30)

Social Accords batch, first `--hq` rebuild: HOSPITAL TOYS went from 15
captions in review to 5 at full quality, every Hebrew line gone. Abraham V1
lost Tal's intro captions and Water V1 its fence-crew line - both were already
uploaded before it was noticed. Nothing errored; the build log just said
`0 caps`.

Cause: an HQ span file starts `offset` seconds into the original. The picture
seek was rebased, but the speech-onset measurement that places translated /
unaligned captions was handed the HQ file with base 0. It measured the wrong
seconds (or past the end of a 10s span), heard no speech, and dropped the
line. English captions placed on their own aligned words were unaffected,
which is why most videos looked fine.

Fix (build-edit.mjs): `capBase = hq` when the source is the HQ span. Verified:
hospital toys 5 -> 15 captions. **Check: compare the per-beat `caps` counts in
the HQ build log against the review build before uploading.** A drop is a bug,
not a style change.

Also new: `scripts/check-boundary.mjs <slug> <beat#> [--tail] [--at s]` does
the LESSONS 68 check (second engine on the source window + RMS in 50ms steps).
Validated on a known answer before use: mid-"Excuse" -> REAL, the gap before
it -> clean. On short noisy Hebrew windows the second engine hallucinates
other languages; the RMS trace is then the evidence.

## 70 — EDEN HER STORY was rejected after nine versions, and nobody asked why (2026-10-02)

Tal, 2026-10-02: *"the Eden her story wasn't a good edit, so you can just
delete that unless you want to keep the JSON file and re-edit it better."*
V1-V9 and the delivered file went to the Recycle Bin. `eden-story/edit.json`,
`BUILD-LOG.json` and `concat.txt` are kept; the source is still in
`FOOTAGE IN/2026-09-17 eden`. EDEN HOW STRONG, cut from the same afternoon,
was not rejected.

**He did not say what was wrong, and the cause is not known.** Do not invent
one. What the spec itself shows: nine beats in a planned order ("the ask, who
she is, her mother, how hard it is, why she chooses to live..."), which is an
outline of topics, and nine versions were spent on framing and captions
without the shape changing.

**Rule:** a cut that needs a ninth version is not being fixed by a tenth.
Before any re-edit of this, get the reason in his words, then start from the
footage again rather than from `edit.json`. A rejection with no reason
recorded teaches nothing - write the reason here when he gives it.

## 71 — the Erez-style cut: his order, his stickers, and no lens-stare (Tal, 2026-10-02)

FLOWERS + NOTE (Frame.io NEEDS TO BE EDITED / FLOWERS FOR STRANGERS / 2),
asked for "like erezv1 ... fast zooms ... only the best reactions she is
smiling, quick cuts". V1 opened on a flash-forward of the flowers arriving,
carried a "POV:" title pill, snap-zoomed her laughing close-up and had no
stickers. Tal: *"This is not really so good. You need emoji and sticker. I
don't need the POV on the top ... you shouldn't start with the hook of the
flowers. Just start with the person with the flowers ... show him actually
getting the flowers in his hand ... choose the best shots to show a reaction
without her looking directly at the camera, like her smiling. But don't zoom
in."* Then: add the girl walking by and giving the note, her reading it, and
*"when she looks at [it] the picture of the note will pop up"*. And not the
angle where the girl stands in front showing the note - the walk-by.

What an Erez-style kindness cut is, for Tal:
- **No title pill.** Open on the giver HOLDING the prop, a slight zoom in.
  Chronological: giver -> run-up -> the receiver getting it IN HIS HAND ->
  passing it on -> the note handed over -> the note read -> reaction -> kiss.
  No flash-forward hook on this format.
- **Emoji stickers are part of the format** (on the body / beside the subject,
  never on a face). `sticker: {emoji, x, y, size}` on a beat; `image` instead
  of `emoji` pops a picture up (the note). Built 2026-10-02 (`withStickers`,
  `render-sticker.py`).
- **Snap zooms belong on the handoff, not on the reaction.** Reactions are
  held with no zoom move, and only shots where she is NOT looking into the
  lens - a laugh aimed at the camera reads as posed. Check the gaze on frames.
- **Show the low-res preview before anything else.** He said so mid-build.
- A pasted chat image is not a file on disk. Recreate it (`make-note.py`) or
  ask for the file; do not go searching Frame.io for it when he says he will
  send it.

## 72 — bright phone footage was "corrected" into a dark, heavy grade (Tal, 2026-10-02)

Same flowers cut, V2. Tal: *"so bad. You just don't need to color grade it."*
The build log said it in plain words: `exposure: luma 159 TOO BRIGHT -> mid
0.63->0.44` on beat after beat. The exposure block read a correctly exposed,
overcast-bright iPhone street as overexposed and pulled the mids down, then
GRADE added its +42% saturation on top. The result was darker and thicker than
what he shot, on footage that needed nothing.

`"grade": false` in edit.json now switches ALL colour work off for a film (the
GRADE curve, the per-beat exposure lift/tame, the saturation trim). Verified on
frames: graded vs ungraded vs the raw clip - ungraded matches the raw clip.

**For iPhone / phone footage that already looks right, default to
`"grade": false`.** The grade was tuned on grey, hazy Sony and Meta-glasses
footage; it is not a look to put on everything. If a "TOO BRIGHT" or "colour:"
line appears in a build log for footage Tal shot on a phone in daylight, that
is the builder changing a picture nobody asked it to change.

## 73 — "zoom in on me" means the GIVER is the subject too, and the giving must be SEEN (Tal, 2026-10-02)

Flowers cut V3. Tal: *"You didn't show any zoom ins of me ... of me giving him
the flowers. The slow mo, you didn't do that."* V1-V3 showed the handoff only
from the side, where the bouquet rises over the man's shoulder and Tal is
hidden behind him - the gift appears, the giver does not. The "zooms" on Tal
were a 1.7->1.85 drift nobody could see. Slow motion had been listed as
"missing" twice instead of being done.

- **In a kindness set-piece Tal is a character, not the camera.** Find the
  angle where his FACE and the prop are both in frame at the moment of giving
  (here: the front camera, crouching behind the bench, then leaning in beside
  the man) and build the handoff from it. A side angle that hides him is a
  cutaway, not the handoff.
- **A zoom he asked for must be visible:** a snap from ~1.5x to 2.2-2.4x in
  0.2s, then a hold. A slow 10% drift is not "a zoom in".
- **Slow-mo is part of the Erez format** - `{"speed": 0.5}` on the handoff and
  on the best reaction. Check on frames that the slowed window is the moment
  itself; the first attempt started 0.15s late, after he had already ducked.
- Something he asked for and the tool cannot do yet gets BUILT in that turn,
  not reported as a limitation twice.

## 71 — why EDEN HER STORY was bad, in his words, and what was actually wrong underneath (2026-10-02)

Lesson 70 recorded a rejection with no reason. He gave it the same evening,
after being shown the cut and a sheet of 20 stills:

> *"take out the part where I say, can I sit down and listen to your story ...
> there's empty parts ... just cut the questions that I asked. Just say, she
> passed away. Cancer. And the captions are wrong. They're not correct. It's
> not when she's speaking ... And you should blur her face."*

Four notes. Each one had a cause that nine versions never looked at.

**1. His questions were in the cut.** V9 kept "Can I sit down and listen?",
"You lost your mother a year ago?", "How did she pass away?", "How long did she
have cancer?", "Every day is hard?", "How do you stay so strong?", "Do you
believe in yourself?", "What is your dream?". Eight of thirteen beats carried
his voice. In a story about HER, a question stays only when her answer means
nothing without it. "She passed away from cancer" needs no question. "Yes" does
- so that beat goes, not the rule. V10 keeps one line of his: the opening.

**2. The captions were wrong because nobody read the Hebrew.** The English came
from Groq's translation endpoint and was patched with 21 `captionFix` entries
("milk and honey" -> leukemia). Patching hid how bad it was. Re-reading the
used spans from the Hebrew transcript, with a second model on each window:

| V9 said | she said |
|---|---|
| I WILL BE STRONGER | **"I'm a strong girl"** - in English, twice; three of four transcriptions end in "girl", and Tal answers "you're a strong girl" |
| COME AND VISIT | "pray for me, and come visit" (שתתפללו) |
| DON'T LET IT SHOW HOW HARD IT IS | "don't give up when it's hard" (להרים ידיים) |
| BUT DON'T GO STRAIGHT DOWN | "but don't stay down" (להישאר למטה) |
| I'M HAPPY TO LIVE MY LIFE | "I came back to myself, to smiling" |

A translated line that needs a `captionFix` is a line that was never
understood. **For a Hebrew or Arabic story, read the original for every span
that goes in the cut, with two models, before a single caption is rendered.**
Tal reads Hebrew; a wrong English caption is visible to him instantly.

**3. "It's not when she's speaking."** The translation segments are rounded to
whole seconds (`[209.77-211.77]`, `[213.77-218.77]`) and the Groq word times on
this clip disagree with a second model by up to 2s on the same word. The fix
was not in the placement code: the used spans' segments were rewritten one
phrase each, timed to measured speech runs (`cache/translate/<id>.json`, old
file kept as `.bak-2026-10-02`). `caption-sync.py` on the result: 33 captions,
0 adrift, 1 over silence, opening error 0.08s.

**4. V9 also cut her off twice, and nobody had noticed.** The turn ended at
81.8 with "healthy" (בריא) finishing at 82.85, and the message ended at 222.4,
before "know how to lift yourself up" (224.77-227.13) - the sentence the note
in `edit.json` said the beat was there for.

**Rules.**
- In a one-person story, cut the interviewer's questions wherever the answer
  stands alone. Went to `formats/human-story.md`.
- Never ship a translated caption that only exists as a `captionFix`.
- Show him the cut and stills and ask what is wrong BEFORE a re-edit. One
  message from him replaced nine guesses.

**The blur** (`scripts/blur-face.py`, new). Three things it got wrong before it
was right, and each would have shown her face:
- a face detector on the full frame finds her in 100% of frames in the close
  shots and **0-12% in the wide two-shot** (small, in profile). Searching an
  upscaled crop of the region she is allowed to be in took that to 100%. Where
  it still misses (61% in the shot where her hands cover her mouth, and the
  walk-in, where she enters at the edge) a measured prior or hand keyframes
  carry the shot. Detection steers; it is never the guarantee.
- **the mask slid off the picture, by timestamp.** ffmpeg's overlay pairs
  frames by pts, and build-edit's output is not a clean n/30: it starts one
  frame in and gains a frame at some joins (frame 1408 sat three frames late).
  A mask clocked N/30 was therefore already on the NEXT shot for the last
  frames before a cut. The beat frame counts were right all along - my first
  note blamed them, wrongly. `mask_clock()` now rebuilds the video's real
  timestamps for the mask.
- the second fix (a constant one-frame delay) still left frame 1411 in the
  clear. It was caught only because the check pulls the exact frames either
  side of every cut. **A blur is verified at the cuts, by frame index, not by
  sampling every half second.** 85 frames were looked at: 2 each side of all
  10 cuts, the walk-in every 6 frames, 3 through each shot.

**And V10 itself cut her off once.** Beat 9 ended at 216.0 on the strength of
a speech run ending at 215.6; she hesitates in the middle of "cry" (לבכות,
215.0-216.8) and the word was cut in half. `selfreview.mjs` flagged it,
`check-boundary.mjs --tail` confirmed it on the source audio, and the out-point
moved to 216.90. A speech RUN ending is not a WORD ending.

**The grade.** A white hospital room measures luma 151-175 and the builder's
"TOO BRIGHT" branch pulled it to grey. `"exposure": false` in `edit.json` now
leaves the level as shot. The midtone belongs to the scene.

## 74 — a small re-edit: slow motion, hand-aimed zooms, and a copied edit that lost its English (Tal, 2026-10-02)

Tal on HOSPITAL KIDS TOYS - CROWN STORY: *"take off the title ... it should
start with 'we heard you like Barbie' ... some more zoom-ins on her face and
her smile ... maybe some slow-mo."* Built as a NEW slug
(`sa-hospital-crown-story-v3`), the V2 untouched. Three things went wrong on
the way and each has a rule.

**1. A copied edit rendered Hebrew captions.** The English lines of a
Hebrew/Arabic clip live in the PROJECT's own `CORRECTIONS.json`, which
`build-edit.mjs` reads from the project folder. Copying only `edit.json` to a
new slug drops them and the raw Hebrew is drawn (as garbled glyphs). Caught by
reading the BUILD-LOG captions, not by any gate. **Rule: a variation copies
`CORRECTIONS.json` too** - `make-variation.mjs` now does it.

**2. A hand-set zoom was aimed by eye at a moving shot and missed.** I read her
position off a thumbnail strip as x=0.56; she was at 0.72, and the punch-in
put her at the frame edge behind someone's hair. **Rule: simulate the crop on
source stills (zoom + focus, at 4-6 times across the beat) BEFORE rendering.**
A crop of a still costs a second; a render with slow-mo costs twelve minutes.

**3. Dropping a cold open exposes the first frame.** The V2 opened on her face
because the line "We heard you love Barbie" is said while walking down a
corridor behind someone's back. Starting on the line (what Tal asked for) made
frame 0 a back. A slow push toward her over that line (`z:[1.0,1.3]`) brings
her up by about 1s. It is still not a face at 0s - say so when delivering.

**Slow motion is now a beat option: `{speed: 0.5}`.** The picture is retimed
(`setpts` + `minterpolate`, the sources are 30fps); the SOUND stays real-time
from the in-point for the beat's output length, because a room of chatter
stretched to half speed sounds slurred. Consequences to respect when cutting:
the beat is `dur/speed` long; it carries no captions; and the NEXT beat must
start at or after `in + dur/speed` or that sound is heard twice (the crown
ending starts at 76.0 for exactly that reason). Use it on wordless close-ups.
Checked on full-size frames: no warping on a waving hand or on hands placing
a crown.

**The gate exited 1 and the video still shipped - with the reason written
down.** selfreview's 5 boundary flags were one Hebrew word mis-timed across
59-85s over wordless beats. That was not taken on faith: the only two NEW
audio cuts were measured (-34 dB and -40 dB just before the cut, video overall
-22 dB). A non-zero gate is overridden only with a measurement, never a guess.

## 75 — the same action from a second angle is a REPEAT, not coverage (Tal, 2026-10-03)

Flowers cut V4. Tal: *"It repeats as a cut when he holds the flower, why did
you do that."* After the front slow-mo of the man taking the bouquet, the cut
went to the SIDE angle of him holding the bouquet (a different take), then to
the side angle of him giving it to her, then to the front angle of him giving
it to her. Each second angle replayed an action the viewer had just watched.
The "no beat may replay" check in the builder only compares time windows of
the SAME clip - two takes of one action pass it clean.

- **One action, one shot.** Two cameras are for alternating between DIFFERENT
  moments, not for showing one moment twice. Before building, list what
  HAPPENS in each beat in a few words; if two consecutive beats read the same
  ("he holds the flowers", "he holds the flowers"), one goes.
- **Her receiving moments are cut on her emotion, with a zoom onto her face**
  (*"choose the most emotional parts ... zoom in"*): hand to mouth as she takes
  the flowers, reading the note, the big smile, the exclamation. Find them on
  face-level frame strips across every take, not from the wide sheets.
- Emoji stickers: he judged them *"not so good"* and then said *"dont do the
  emoji its fine"* - they are out of this cut. The note picture pop-up stays.

## 76 — "like erezv1" was built from notes about Erez, not from Erez (Tal, 2026-10-03)

Five previews in, Tal asked: *"DID U USE EREZV1 AS REFERANCE"*. The honest
answer was: only the written summary. The summary said "hard cuts, no zooms
measured" because it was made from contact sheets - one frame per shot - and a
zoom cannot show in one frame. Tal: *"we just use his cuts and how they flow as
reference ... just look at the zoom ins"*, then *"DONT ASK ME GO"*.

- **When he names a reference, open the reference VIDEO and read the cut
  points at 30 fps before the first build** - not the notes about it. The file
  is in `assets/references/instagram-harvest/<account>/`.
- What a contact sheet cannot show (zoom ramps, speed ramps, drifts) has to be
  measured frame by frame. The result is now in `erez.v1.md` -> "Cut and zoom
  grammar": wide -> 4-frame zoom-in -> tight hold drifting in -> hard cut to
  the other angle, time only forward.
- Do not offer him a menu ("do you want cards / emoji / a closing card?") when
  he has asked for the cut. He wants the reference's FLOW; decide and build.

## 77 — "it's so choppy" was 10 frozen frames and 30 audio fades, and the first fix was a guess (Tal, 2026-10-03)

Flowers cut V6 (30 beats in 20s, fast zooms). Tal: *"ITS SO CHOPPYU RIGHT"*.
Measured on the rendered file before touching anything:
- **583 frames in 19.92s** where 30fps needs 597, and `mpdecimate` found **10
  frozen frames, one right after every zoom ramp**.
- a 25ms audio fade out + in at each of the 30 joins.

The first fix was a GUESS - "the cut points are off the frame grid" - and
snapping them to the grid changed nothing (still 583 frames, same freezes).
Counting frames PER BEAT FILE found it: every 4-frame zoom beat had 3 frames,
both slow-mo beats were 3 short. Cause in `build-edit.mjs`: `dur` was rounded
with `.toFixed(2)` (0.1333s -> 0.13s = 3.9 frames) and the picture was trimmed
with `-shortest`; `minterpolate` eats a slow-mo beat's tail. The stitch filled
each gap by holding the last frame.

Fixed: durations to 4 decimals; each beat reads slightly MORE source than it
needs and stops at exactly `frames` frames (`-frames:v`). After: 597 frames,
30/1, 0 of 30 beats off, 1 near-duplicate (the first frame of a slow-mo).
Sound: `"bedOnly": true` + `"music"` = ONE continuous ambience track with the
beats' own audio muted - no fades at the joins.

- **The check for a fast cut:** `ffprobe -count_frames` must equal
  duration x 30, and `mpdecimate` must find no frozen frames. Run it on any
  cut with beats shorter than ~0.5s.
- **When a fix does not change the measurement, the cause was wrong.** Go one
  level down (per-beat files) instead of trying a second guess.
- Every earlier cut with very short beats may carry the same frozen frames.

## 77 — delivery is the chat, then Frame.io; nothing goes to VIDEOS OUT (Tal, 2026-10-03)

The laptop disk reached 2.4 GB free of 476 GB in the middle of a 13-item batch.
Tal: *"footage out shouldn't go there. It should just go here, show me here,
and then I'll approve it and then send it to the frame.io."*

- Review renders live in `system/projects/<slug>/` and are sent into the chat.
  After an explicit approval: full-quality render, `frameio-deliver.mjs` to
  `SHOT IN ISRAEL / FINAL VIDEOS / EDITED BY CLAUDE`. Never a copy or hard link
  into `VIDEOS OUT/`. (Supersedes the 2026-09-30 index rule in CLAUDE.md §0b.)
- **Before anything local is removed, prove it is on Frame.io.** Matching was
  done by name AND exact byte size against a full listing of all three
  projects (`frameio-inventory.mjs`, 52,549 files). Of 469 files in FOOTAGE IN,
  only 24 were already on Frame.io; 445 (the `od_video-*` / `video-*` iCloud
  exports) were not. Of the finished videos in VIDEOS OUT, ~187 were not. A
  folder that "came from Frame.io" is not proof that it is on Frame.io.
- The disk was not mostly this project (55 GB of it). iCloud Photos lists
  1.6 TB but holds only 15 GB locally - measure the placeholder attribute
  before blaming a sync folder.

## 78 — "we won't publish it" on camera: mute it and blur the face, don't drop it (Tal, 2026-10-03)

Two hospital families and one man on a Tel Aviv street were told on camera
"we're not publishing this" (both models agree on the Hebrew). The editors left
them out. Tal: *"just blur their face then"*, then *"you can just remove the
audio and blur his face"*.

- A moment like that is not lost: it goes in with **the audio fully muted over
  that span** (room tone from a neighbouring shot underneath, never a voice)
  and **the face blurred** (`blur-face.py`, verified per LESSONS 71: by frame
  index, 2 frames either side of every cut).
- When it is unclear whose face he means, blur every face of that family and
  say so; he can loosen it. Never the other way round.
- Still report every such span to him before it ships. He decides; the editor
  does not quietly drop it or quietly use it.

## 79 — giving water: ONE silent compilation of every shot, not several short cuts with sound (Tal, 2026-10-03)

Four water cuts were made from 8 clips (9-20s each, location sound or a
street bed, one carried by "thank you"). Tal: *"all the water videos, just no
sound, like just do a compilation all into one video, of all the shots."*

- Water footage has 3-5s of real action per worker. Split into singles, each
  video is over before it starts. Together, they are one strong montage.
- **No sound at all** on this one: a silent track (music goes on in
  Instagram), so no captions either. Pace it on the picture.
- Applies to `formats/giving-things.md` where a shoot is many short,
  wordless encounters: default to one compilation, and only split out a single
  person when their moment holds alone (the hug did not need its own video).

## 80 — "stop with all the zooms, it's weird" (Tal, 2026-10-03)

After the first previews of the 2026-10-03 batch (Christian Tel Aviv, hospital,
water, cleaner, old lady), every one built on the Erez grammar of 4-frame snap
zooms and punch-ins onto faces, Tal: *"stop with all the zooms its weird"*.

- **Default is now NO zoom movement**: constant framing per shot, hard cuts,
  slow motion where it earns it. No snap ramps, no punch-ins, no drift, and no
  wide-then-tight cut on the same take (it reads as a zoom).
- This reverses LESSONS 73 ("a zoom he asked for must be visible") and the
  zoom part of 76 / `erez.v1.md` "Cut and zoom grammar" as a house default.
  Those were right for the one flowers cut where he asked for zooms; as a
  style on everything, he finds them weird. **Zoom only when he asks for it
  on a specific video.**
- His own brief that morning said "punch-ins/zooms on reactions". The later,
  specific reaction to seeing them outranks the earlier general wish.

## 81 — a face zoom needs the face to DO something (Tal, 2026-10-03, flowers V10)

*"At eight seconds you zoom in, but you don't see anything. You just see her
face looking down."* V10 snapped to 3.0x on her face, in slow-mo, aimed by
her position, not by what she was doing. Her expression was neutral, so the
zoom showed nothing.

- **Zoom onto the ACTION, not the person.** V11 holds the bouquet passing
  into her hands with her face in frame (2358 7.4–8.67, 1.15 → 1.8x, slow-mo).
- **Before you zoom past 2x on a face, look at the zoomed frames.** If the
  face isn't smiling, crying, laughing, or reading, pull wider so the thing
  that is happening is in frame.
- Aim from a 5 fps strip of the source with timestamps, not a guess. The face
  sat at y≈0.5, but V10 aimed at 0.40.

## 81 — blur the kids' faces (Tal, 2026-10-03)

Hug for Stranger / Tel Aviv: three cuts shipped with children hugging Tal in
a public market, faces clear. Tal: *"you need to blur the kids faces"*.

- **Children who are strangers in public get their faces blurred**, every
  shot they are recognisable in (`blur-face.py`, verified per LESSONS 71 by
  frame index). Adults stay clear.
- If the blur kills a shot whose whole point is the child's face, replace it
  with an adult moment rather than keep a blurred blob as the beat.
- Hospital footage (children receiving toys, filmed with the families) is the
  open question - asked, not assumed. Record his answer here.

## 82 — the run-up showed him arriving behind them three times (Tal, 2026-10-03, flowers V11)

*"Between four or five seconds, I'm walking to give him the flowers and the
cut shows like a repeat of that."* V11 went: side, he appears behind them →
front, he stands behind her → side, the shhh, also behind them. That is three
shots of the same arrival. V12 cut the two middle shots, so it goes front
run-up → side shhh zoom → handoff.
- LESSONS 75 applies to the build-up too, not just the gift: **he arrives
  ONCE.** On the strip, ask of each shot whether it shows something the
  previous shot didn't.

## 83 — "more of how happy she is": shocked and happy beats a smile at the lens (Tal, 2026-10-03, flowers V12)

*"Show more shots of the woman smiling and how happy she is ... slow-mo on
her smiling."* Then: *"not even her smiling, like shocked, like happy, not
looking directly at the camera is better."*
- The payoff section needs SEVERAL different reactions from her, not one:
  the gasp, the big smile, reaching for him, the quiet smile into the flowers.
  Go through every clip in the folder for them, not just the ones already cut.
- Rank them: shocked or overjoyed and looking at him or the gift comes first.
  A posed smile toward the lens comes last.
- Slow-mo goes on the peak of a reaction, after a normal-speed build.

## 82 — a blur that passed 188 stills still showed her face for 20 frames (EDEN V11, 2026-10-03)

V11 was cut to a line-by-line script Tal pasted after reading the numbered
transcript (`EDEN-TRANSCRIPT.md` - showing him every line with a number is what
got a usable brief out of him; do that first next time).

**The leak.** In one two-shot beat the tracker "found her" in 64% of frames at
x 0.91 - but what it had found was a wall-mounted pump beside her head, which
the detector scores as a face at 0.78. Her real face sat below it in the clear
for 20 frames. The cut sheets (2 frames each side of every cut) and the shot
sheets (4 per shot) were all clean: the drift was in the MIDDLE of a shot.

**What caught it:** zooming the right-hand third of that one shot every 6
frames, because its detection rate and centre looked different from its
neighbours. **A detection rate under 100% next to shots at 100%, or a centre
that sits at the frame edge, is the signal - zoom that shot before anything
else.**

**The fix:** that beat's allowed region now starts at x 0.86, which excludes
the pump. Detection went 64% -> 99% and the centre moved onto her.

**`scripts/blur-check.py` (new) - and its limit.** It scans every frame of the
finished file for a face outside every blur ellipse. Known-answer test: on the
leaking render it flagged the leak (beat 08, f1052-f1071, score 0.82), and on
the fixed render beat 08 is clean. But it also flags ~230 frames that are not
her: the same pump, the cartoon on the blanket, and the lower edge of the blur
where her shoulder is. **It cannot return a clean PASS on this footage, so it
is a list of places to LOOK, not a gate.** Every cluster it flagged was zoomed
and looked at (24 spots) before V11 went out.

Also from this cut: a helper script took the newest `beats_*` folder by NAME;
the run id is the last 7 digits of the clock and wraps, so it read a stale
build and blurred the wrong frame counts. Newest by mtime, always
(`caption-sync.py` already does).

## 84 — reviewing a batch: ONE video at a time in chat, its number in the message, nothing burned in (Tal, 2026-10-03)

33 previews were sent in groups, then all 22 at once with a numbered table,
then a job was started to burn a number into the corner of each. Tal: *"you
don't need to burn a number in the corner, just write it over on the chat, or
show me video one you did then I'll approve or tell you what to fix."*

- **One video per message, captioned with its number and name** (`#12 —
  Hospital, Smiles montage (0:27)`). He answers approve / fix; then the next.
- No burned-in ids, no numbered review copies, no table of 22.
- Approved -> full-quality render -> Frame.io (`EDITED BY CLAUDE`). A fix ->
  redo that one and show it again before moving on.

## 85 — first full review of the 2026-10-03 batch: what he approved and what he sent back (Tal, 2026-10-03)

38 previews, his notes dictated in one pass (verbatim table:
`system/projects/_batch-2026-10-03/TAL-NOTES-ROUND-1.md`). The patterns:

- **The hook is the FACT, not the advice.** A cancer survivor's video opened on
  "Don't give up" — *"the hook shouldn't be 'Don't give up' ... the hook should
  be 'I actually beat cancer'"*, and he expects the ig-reel hook formulas to
  have been consulted. Advice is the payoff; the surprising fact opens.
- **A kindness test runs in the order it happened, opening on WHO HE IS.**
  Shop Owner 5 opened on Tal's "I'm Jewish"; he wants the owner's "I am
  Muslim" first, then ask -> yes -> why -> names/identity -> "we are
  brothers, one God" -> reveal -> refusal -> "life is about giving back".
- **A premise video must SHOW the premise.** Phone-call cuts framed tight on
  the speaker lost the "what makes you happy" sign and the phone: *"you don't
  see the thing ... get them picking up the phone."* Cropping to dodge
  passers-by is not worth losing the sign.
- **Picture and voice must be the same person.** A crop that stayed on one man
  while the next person's audio played was called out at once.
- **Don't lay someone's answer over other people's pictures** (hugs "voices"):
  he wants people running up and hugging, their own words in their own shots.
- **"Zoom in" = closer framing on whoever is speaking** when a wide phone shot
  reads small. He asked for it by number on four videos; this refines LESSONS
  80, it does not undo it (no zoom as a blanket style; closer framing where
  the subject is tiny).
- **Arabic videos get a smaller Arabic line under the English.**
- **Names get checked with him** ("Captain Smit, S-M-I-T").
- **No single-child videos** ("it's a little kid, we don't want to do little
  kid"); a one-line answer is a compilation beat, not a video.
- **Music is expected** on the wordless/emotional cuts: *"it doesn't look so
  good without music."* Ask for tracks at the START of a batch, not the end.

## 85 — a zoom aimed above her head, and two reactions too many (Tal, 2026-10-03, flowers V14)

*"You just zoom in on top, not zooming in on her face. Zoom down a little bit
lower to her face and keep it in slow-mo, so it's her smiling."* The 9263
zoom was aimed at y 0.39; her face sits at y 0.57, so the tight frame showed
the scooters behind her with her head at the bottom edge.
- **Aim every zoom from a gridded still of THAT clip** (`drawgrid` at tenths),
  then look at a frame of the zoomed result. V14's check sheet covered the
  ending and skipped this shot.
- *"You don't need the 18 seconds and 19 seconds ... then just them kissing ...
  you don't need to zoom in on her when they're giving a hug, just get the
  other angle."* After her best laugh, go straight to the kiss and the second
  angle. The hand-on-chest exclaim and the zoom on her reaching were padding.

## 86 — a line plays over the shot it was SPOKEN in; and the vertical branch was drifting every beat (Tal, 2026-10-04, EDEN V11)

Tal on V11: *"keep the camera steady and zoom in a bit ... It doesn't make
sense that I say, hi, I heard about your story ... They don't see me actually
sitting down and saying those words. It's just a different shot of me walking
in. So whatever I'm speaking, you should be [showing]."*

**1. His words over a different shot of him read as wrong.** V11 laid clip 6's
"Hi Eden, I heard your story…" under clip 5's doorway walk-in, because his own
script said "Tal walks in (clip 5 visual)". Seen on screen, his mouth is not
saying it and he is not where the words are said. Clip 6 itself has the whole
thing in one take: he stands at the bed saying it, then crouches beside her.
**When he is talking, show the take he is talking in.** A graft of one clip's
sound under another clip's picture of the SAME speaker is for a cutaway where
his mouth is not readable - never for the shot that introduces him.
A script line that names a visual is his idea of the shot before he has seen
it; if the sync shot exists, offer that, and say which one was used.

**2. "Keep the camera steady" was the builder, not the camera.** With
`autoFrame: false` and no `z` on a beat, `build-edit.mjs` (vertical layout,
hand-framed branch) ran every beat from 1.00 to 1.05. Twenty-four beats each
crept in 5% and snapped back at the cut. The aimed branch lost its automatic
push on 2026-09-23 ("you don't need to zoom in just because I gave you that
skill"); this branch had been missed. Fixed: no `z` now means no move.
**A locked-off interview holds ONE constant frame per shot** -
`{"z": [1.1, 1.1], "x": …, "y": …}` when he wants it tighter.

**3. A zoom moves everything the blur rules point at.** `blur-rules.json`
regions are fractions of the RENDERED frame. Changing a beat's zoom or focus
means transforming its region and prior with the same window
(`(v - left) / width`, radius times zoom) and looking at the result again -
the tracker will otherwise search where her face used to be.

## 86 — a wordless "visual" cut with no zooms is not the Erez style he asked for (Tal, 2026-10-04)

Homeless 2 "Visual" was his Option 2 in the brief: *"very visual/emotional ...
(erez V1)"*. It was first built with snap zooms, then flattened to constant
framing when he said "stop with all the zooms" (LESSONS 80). Shown the flat
version: *"use the Erez V1 skill for this video, it's so bad the way you did
this one."*

- **"Stop the zooms" was about zooms sprayed over dialogue videos.** A video
  he briefed as Erez-style keeps the Erez grammar (`formats/erez-fast-cut.md`):
  wide -> 4-frame zoom -> tight -> cut. Applying a blanket rule to a cut whose
  brief named a zoom-based reference removed the style he had asked for.
- When a later general note collides with an earlier specific brief for one
  video, **ask which wins for that video, or keep both versions** - do not
  silently flatten it.
- Same round: he asks for a walk-up at the START of giving videos ("get me
  walking up to her / to him") and a slow-motion exit at the END. The approach
  and the leaving are part of the story, not dead space.

## 87 — in a two-person take, check WHO IS HOLDING THE PHONE against whose voice it is (2026-10-04)

Phone Call Tel Aviv, emotional compilation V2. Tal: *"you're zoomed in on the
guy ... and then it's not him speaking."* The crop sat on the man in the cap
for 4.5s while the woman beside him was the one talking into the phone. The
transcript does not say who speaks, and a tight crop on the wrong person
makes the mistake total.

- Measured afterwards: median pitch 208 Hz in that span, against 163 Hz when
  he holds the phone. **Pitch separates two speakers when a transcript
  cannot.**
- Before captioning a line in any take with two people in frame, look at who
  holds the phone / mic / whose mouth moves on frames at the line's own
  timestamps. A crop is aimed AFTER that, never before.
- If a child-avoiding crop forces the frame onto the non-speaker, the beat is
  cut, not shipped.

## 87 — iPhone originals are HDR, and every tool here was reading them as SDR (found 2026-10-04, pov-church)

`ffprobe` on the fetched originals: `color_transfer=arib-std-b67, color_primaries=bt2020`
(HLG). Nothing in the pipeline converted it. Measured on one frame of IMG_9661:
as-is YAVG 138 / SATAVG 9 and a red dress that reads **orange**; tone-mapped
SATAVG 15 and the dress is red (`system/projects/pov-church/_look/hdr/compare.jpg`).

- **The Frame.io proxy is the same unconverted picture** (identical YAVG / U / V
  to the HQ span as-is), so comparing a render against the proxy can never show
  this. The known answer is the object itself: a red dress, skin, foliage.
- `build-edit.mjs` now detects an HLG source per beat (`isHdr`) and tone-maps it
  (`zscale ... tonemap=hable`, npl=100) before anything measures or grades it.
  npl=203 came out a stop too dark; a bare `zscale` transfer change blew out.
- **Every earlier cut from iPhone footage (IMG_xxxx.mov) is suspect** for flat,
  orange-shifted colour. Part of LESSONS 72 ("bright phone footage … heavy
  grade") may have been this, graded on top of.
- Cost: the float tone-map runs at 4K, about one minute per beat. Budget it.

## 88 — one-word captions exist now, and forced alignment can put a line in the wrong place (2026-10-04, heli-balloon)

Tal: *"Use one word captions."* `"captionWords": 1` in edit.json ->
`oneWordCaptions()` in `lib/caption-timing.mjs`, tested by
`node system/scripts/test-caption-oneword.mjs`. A word shows from its own start
to the next word's start, lingers at most 0.35s into a pause, belongs to the
beat holding its midpoint, and a flash word (<0.1s) rides with the next.
It needs a WhisperX-aligned English clip; anything else keeps phrase captions.

- **Align only the shortlist.** `align-cache.py` on all 112 clips of two
  folders took 55 minutes on this CPU while renders waited. Choose the clips
  from the Groq transcripts first, then align those.
- **An aligned word is not a verified word.** IMG_7565's *"Are you scared?"*
  was aligned to 0.18s; the audio (`speech-runs.py`: 4.24-4.79) and Groq (4.22)
  both put it at 4.2s. The segment was 4.7s long with laughter in it, and the
  aligner took the first sound. Before trusting one-word captions on a beat,
  compare its words against the speech runs of that beat.
- The phrase path lost a word the same day: *"…the style today?" / "Today is
  Thanksgiving Day"* rendered as "IS THANKSGIVING DAY" - the cross-caption
  de-duplicator read the second speaker's "Today" as a stutter. One-word mode
  does not go through it.

## 89 — the music performed on camera, as a real bed (2026-10-04, heli-balloon + pov-church)

Tal: *"the guy plays music, add the background music of the guy playing. Then
there's shots of that, her speaking, the light"* and, for the church, *"it's
dancing in the video with the real audio."* LESSONS 9 said to use it; there was
no way to. Now:

- `"beds": [{id, at, from, to, vol, under, fade}]` - one clip's real sound from
  the start of beat `from` to the end of beat `to` (0-based). Beats with
  `"mute": true` are picture only; under a beat that keeps its own sound the bed
  drops to `under` (0.3). Start the bed on the performer's own picture at the
  same instant and that first shot is in sync.
- Or `push.audio` on each beat with `at` picking up where the last ended: beats
  whose AUDIO is contiguous now share one gain and get no fade at the join.
- `"denoise": 0` on those beats. DeepFilterNet is a speech enhancer; on a room
  of people singing it treats the music as the noise.
- `fetch-hq.mjs` now fetches the graft and bed windows too. **A beat that runs
  past its HQ span is clamped short and every later graft offset is then
  wrong** (the church walk-in shot was moved 0.4s -> 3.0s and came out 0.85s
  instead of 1.5s; the music would have skipped). After moving a beat, run
  fetch-hq again before building.
- `verify-cut.mjs` prints NOT CHECKED for a muted or grafted beat instead of
  failing it on words nobody hears.

## 90 — clips stored sideways AND upside-down in one folder (2026-10-04, pov-church)

Of 36 clips, 7 were sideways and 2 (IMG_9640, IMG_9667) upside-down. The
builder's rotation slot only took `transpose` values. `180` in the rotation slot
now flips both ways. Sideways is still automatic (decoded W > H). Tal: *"we'll
just make the clip straight because right now we're rotated."* Find them on the
first contact sheet of every clip, before choosing anything.

## 91 — what the self-review caught before he saw the church cut (2026-10-04)

A toddler in the walk-in shot (LESSONS 81: strangers' children are blurred or
not used - the shot was replaced with an adults-only window of the same clip),
merged caption lines ("YES WE ARE / AND YOU GUYS"), and a stray "Wow" after
the last answer. All three were visible on the contact sheet and the caption
dump of the RENDER; none were visible in the plan.

## 92 — he holds the phone, so the other person is 20 dB quieter - and the checks said the captions were on silence (2026-10-04)

Church V2 passed the gate, and `caption-sync.py` listed "NO / I'M / FROM /
UGANDA" as *0% speech under it*. The captions were right. The VOICE was too
quiet for the detector: measured in the render, Tal's question sat at -17 dBFS
and the women's answers at -35 to -45. In the raw clip the gap is already
18-25 dB (he holds the phone, they stand two metres away), and DeepFilterNet
pushed "Yes, we are" down a further 9 dB.

- `push.boost = [[from, to, dB], ...]` (clip timeline, 60 ms ramps) raises only
  the other person's lines. After: every captioned word between -12 and -27.
- `python system/scripts/word-levels.py <render.mp4> <slug>` prints the level
  under every captioned word of the RENDER and stars anything under -30 dBFS.
  **Run it on every POV / phone-in-hand cut.** A "silent caption" from
  caption-sync on a line that is clearly spoken means a quiet speaker, not a
  wrong caption.
- On a quiet location (floor -46 dBFS) set `"denoise": 0` for the dialogue
  beats: there is nothing to remove and it costs the far voice.
- Balloon V1 had the same thing, milder: "I'm from Berlin", "You're kidding",
  "Wow. Okay.", "I'm scared" in the taxi - 23 of 187 words under -30.

## 93 — "very simple" did not mean "drop the conversation" (Tal on church V3, 2026-10-04)

His brief: *"should be very simple … I stopped the Nigerians … we got in the
elevator, then we go, boom, I get in, and then everyone starts dancing."* V3
was cut to exactly that list (40s): the stop, the ask, the elevator, the door,
dancing. His note: it is really good and he **likes the captions** (one-word,
`"captionWords": 1` - the first time he has asked for them and kept them), but
*"you didn't include any parts where I asked them what makes them happy, what's
their dream … and the shots of going to the church … then a little bit of
dancing, and then showing the different shots that I got there."*

- A spoken brief lists the BEATS OF THE STORY, not the complete contents. The
  questions he asks on the way are the substance of a POV "meeting a
  <religion>" video (`formats/pov-meta-glasses.md` section 5: *the stranger
  says the thesis*); leaving them out to keep it "simple" removed the reason
  to watch the middle.
- **Before cutting a POV conversation short, list every question he ASKED on
  camera. Each one he asked, he expects to see** - with its best answer, not
  all of them (V4 keeps "what makes you happy" x2 and one "what's your dream").
- The walk there is a beat of its own: the steps, the elevator, the corridor.
- Inside: a little dancing, then VARIETY - one shot each of the different
  things he filmed (singer, room, drummer, a dancer, clapping, the elder), not
  three angles of the same dance.

## 94 — "why did you restart it" - a shot from BEFORE the door, cut in after it (Tal on church V4, 2026-10-04)

V4 answered "the shots of going to the church" with IMG_9660: the two women
walking up the outside steps. It was placed after the ask - whose last frames
show them already going IN the glass door. On screen the film jumps back to
the plaza where it began; he read it as the video starting over (*"on 24
seconds why did you restart it"*). Removed in V5.

- **A "going there" shot must continue the geography, not rewind it.** Read the
  last frame of the beat before and the first frame of the travel shot: if the
  travel shot is somewhere the story has already left, it is a restart, however
  good it looks. Time only moves forward (LESSONS 75/82 said it for repeated
  actions; this is the same rule for places).
- The clip number is not the order of events: 9660 was shot BEFORE 9661/9662
  (the approach was filmed in several takes on the same steps).
- His verdict on V4 otherwise: *"besides that I think it's perfect"*, *"add
  more b-roll if you want"*, *"move to Frame trials"* -> final to Frame.io
  `SHOT IN ISRAEL / FINAL VIDEOS / APPROVED FOR TRIALS`.
- Corrections to approval on this video: 2 (missing questions + walk; the
  restart). Review rounds: 2 (V3, V4).

## 95 — "she didn't say that to me … why did you just say that randomly" (Tal on balloon V2, 2026-10-04)

V2's intro went *"Are you from Israel?" - "No, I'm from Berlin"* straight to
*"to celebrate you coming back to Israel after 10 years, I'm going to rent a
hot air balloon"*. The exchange where she SAYS it has been ten years
(*"Is it your first time?" - "No … it's been 10 years ago"*) had been cut to
save 4.6 seconds. Tal: *"she didn't say that to me that she hasn't been here
ten years. I don't understand why did you just say that randomly. You've got
to make sure the story kind of flows."* It is CLAUDE.md rule 2 run backwards:
not a promise without a payoff, a payoff without its setup.

- **After any trim, read the kept captions top to bottom as a stranger.** For
  every line that refers to something ("after 10 years", "the next surprise",
  "I said yes"), the thing it refers to must be on screen BEFORE it. The
  caption dump from BUILD-LOG.json is the place to do it; it takes a minute.
- **"it was amazing" then a cut** (*"that was amazing, and then it cut out.
  That's not good"*): the beat ended 0.15s after the word, in the middle of
  her answer - she goes on *"It was so much fun. And so happy I left my
  comfort zone."* `exact` beats skip the builder's snapping, so the 0.45s of
  air is the editor's job on every one of them: check `next word start - out`
  and `out - last word end` for each exact beat, and never end a beat while
  the same person is still answering.
- **More of the second act.** He wanted the drag queen as a PERSON, not a
  cutaway: Patricia meeting her sitting at the table, the exchange between
  them, then the show. A surprise that the film announces ("next surprise")
  has to be shown landing on her.
- His verdict otherwise: *"you did a really good job … I was pretty
  impressed"*; length may go to ~1:45.

## 96 — "was perfect, you just need to show me getting in the taxi with her" (Tal on balloon V3, 2026-10-04)

V3 fixed the three things from LESSONS 95 and he called it perfect, then asked
for what the trims to hit a length had taken out:

- *"Show me getting in the taxi with her … we open the taxi."* The shot of
  him opening the door for her had been dropped in V3 to make room. In a
  "taking a stranger somewhere" film **the getting-there is a beat he wants
  SEEN**: the door, him getting in, the two of them inside.
- *"Make sure everything with me and the taxi driver."* The chat with the
  driver on the way to the second surprise (name, where he is from, "Are you
  Muslim?", "Salam alaykum") had never been in any version. A third person he
  speaks to on the way is part of the story, and on this account it is the
  point of it.
- *"End with the ending shot, like for 10 years, and then that was so nice,
  thank you, have a good night, bye bye."* After the toast, the goodbye in
  the street: her thanks, his "welcome to Israel", "after 10 years - good
  celebration". **End on the goodbye, not on the last activity.**
- Length is not the constraint he cares about: the brief said under 1:30, V3
  was allowed 1:45, and now *"two minutes and twenty seconds"*. **When a cut
  is working, he would rather it ran longer than lost a beat of the day.** Do
  not drop a whole scene of the chronology to hit the number in the brief;
  offer the longer cut.
- Place names from a transcript get checked with him (LESSONS 85): Groq wrote
  the driver's town as "Taipei"; captioned TAYBEH, flagged to him.
- Delivery for a Tal Studios shoot: Frame.io `TAL STUDIOS / FINAL VIDEOS!`
  (not the Social Accords folders).

## 97 — "the taxi part is way too long" - a side character gets ONE exchange (Tal on balloon V4, 2026-10-04)

V4 answered *"make sure everything with me and the taxi driver"* with 13
seconds of it: his name, his town, "Mashallah", "Are you Muslim?", "Salam
alaykum". Tal: the taxi part is *"way too long … maybe I just get in the taxi,
open the door for the taxi, you get in, and then I say Salam alaykum, are you
Muslim? … yes. Mashallah."* V5: she gets in the taxi (3.3s), then *"Are you
Muslim?" - "Yeah" - "Nice to meet you, bro. Salam alaykum"* (3.5s).

- "Everything with the driver" meant **the driver is IN the film**, not that
  every line is. A person met on the way gets the one exchange that carries
  the point (here: Jewish creator, Muslim driver, a warm greeting) and the
  film moves on. Name-and-hometown small talk is the first thing to go.
- He remembered the lines in a different order ("Are you Muslim? Yes.
  Mashallah") from the footage ("Mashallah" was said about the town, earlier).
  The cut keeps what was actually said after the question; he was told.
- **`node system/scripts/build-edit.mjs <slug> --reuse`** (new today): beats
  whose spec is unchanged since the last build are copied from its beats
  folder, only changed beats render, the stitch runs in full. This change took
  about three minutes instead of thirty-five. The previous beats folder is
  swept one hour after it was written - a quick revision has to start inside
  that hour, or it is a full render again.
- Five rounds on this video (V2-V5 after the first cut). Every round after V3
  was him putting BACK a beat of the day or trimming one I over-filled. Next
  time: send the first cut with the whole chronology in, at the longer length,
  and let him take out.

## 88 — caption style 5 ("gothic"), and "upload everything, good night" (Tal, 2026-10-05)

Shown six caption looks on one still, Tal: *"caption 5, fix the rest, and
upload to frame trials ... upload everything there and that's it, good night."*

- **Caption option 5 = `"captionStyle": "gothic"`** in edit.json: Century
  Gothic Bold, white caps, dark outline, about two words a line
  (`render-caption.py` `two_per_line`, `build-edit.mjs` GOTHIC). It is opt-in
  per project; the 15 videos delivered before this keep the Arial Black look
  unless he asks for them to be redone. THE STANDARD's rules (white, caps,
  outline, lower-middle, timed to speech) are unchanged - only the face and
  the line breaks differ.
- He had asked for "more aesthetic" captions and "font options". A sheet of
  the same line in six looks got an answer in one message. **Show type
  choices as pictures, never describe them.**
- "Upload everything" at the end of a review day is a standing approval for
  what is left: finish each to full quality, check it myself, upload to the
  folder he named (APPROVED FOR TRIALS), no further round. It does not cover
  the cuts he dropped by name (Hospital Hug, the couple single) or one he
  called "not so good" without a fix (the light phone compilation).
- Recipe the final wave used: `system/projects/_batch-2026-10-03/FINAL-WAVE.md`
  (native-resolution scoped fetch, `-D` on the denoise, blur re-derived at
  full size, -14 LUFS on the whole timeline).

## 98 — "people blurred in the background, we don't need that" (Tal on the delivered finals, 2026-10-05)

His words, after the final wave went to Frame.io: *"H, her story, cancer. That
was good, but then you put it to the Frame.io with people blurred in the
background. We don't need that."* And on the phone compilation: *"she picks it
up and then someone says a word, so that's not good. She should just pick it up
and cut until she says [her line]"*, *"they said 'look at the trees' and then
it cuts wrong"*, *"'what makes you happy', you should see my face when I drop
the thing."* And: *"make sure there's no duplicates in the Frame.io for
trials."*

- **Blur is for the person he names (a child he pointed at, someone told "we
  won't publish"), not for every passer-by.** The final wave re-derived blur at
  full resolution and added blurs the approved preview never had. He approved
  the preview; the final must look like it. A blur he did not see in the
  preview is a change he did not approve. Background adults are never blurred.
- **Between a pick-up/approach and the person's line there is nothing.** A
  stray word from someone else in that gap reads as a mistake. Action -> first
  word of the line.
- **An answer's out-point is checked on the picture and the sound of the
  finished file**, not only the word timing ("it cuts wrong").
- **When the title is his question, show his face asking it / setting the prop
  down.**
- **A new version replaces the old one on Frame.io.** Upload, then take the
  superseded file out of the folder in the same step. Variations are fine;
  two copies of the same cut are not.

## 99 — "why did you move stuff to OLD - DELETE, stop doing that" (Tal, 2026-10-05)

He asked for "no duplicates" in APPROVED FOR TRIALS and said "just move the old
ones". I made an `OLD - DELETE` subfolder and moved seven older cuts and two
replaced files into it. He moved them back and was angry.

- **Never move, rename or reorganise files on Frame.io.** Upload the new file;
  name the old one in chat; he removes it himself. Lesson 98's "take the
  superseded file out in the same step" is withdrawn.
- "No duplicates" means: do not upload a second copy of a cut. It is not a
  licence to tidy his folder.

## 100 — "This isn't so good ... Kung Klaus Cloud ... the script should be better, 'this guy was a ... and convinced ... so ...' ... some videos get cut out ... make the animations better" (Tal on the first AI story reel, Daryl Davis V1, 2026-10-05)

His words on V1: *"This isn't so good. Like, Kung Klaus Cloud, right? ... you
should use like my NAS Daily script writing ... this man was a ... and
convinced ... why, so ... and then tell the story ... some videos get cut out
... make the animations better."*

- **A generated voice is never trusted on a hard name.** Kokoro said "Ku Klux
  Klan" wrong, and Whisper transcribed it back correctly anyway, so the
  transcription check passed a line a listener heard as nonsense. **Hearing
  the right words back from Whisper does not prove the pronunciation.** Write
  around hard words ("the Klan", "K K K") and tell Tal which names to listen
  for.
- **Hook = "This man is a [who]. And he [did the impossible thing]. So how?"**
  then the name, then the story with but / so. Load
  `toolbox/tal-scriptwriting` for every AI story script; the reference formula
  alone read flat to him.
- **"Videos get cut out" was frozen picture.** Shots slowed with
  `data-playback-rate` under 1 froze for 0.3-1.2s in the render (`freezedetect`
  found ten). Never slow footage to stretch a shot; pick a longer take or cut.
  Run `ffmpeg -vf freezedetect=n=0.003:d=0.4` on every HyperFrames render with
  footage.
- **Static cards and hard cuts are not "animation".** Every shot gets a
  push-in, captions pop in, the year counts up, the quote lands word by word,
  small 4:3 archive sits in a window instead of being blown up.
- **A contact sheet made with `fps=1/N` had wrong timestamps** (the label said
  86s, the frame was from 59s) and half of V1's first shot list was wrong
  because of it. Stamp the time before selecting frames:
  `select='gte(t-prev_selected_t,N)'` with `drawtext=%{eif:t:d}`. And look at
  the first AND last frame of every shot in the render: most misses were a
  shot running into the next picture.
- **Windows file names are not case-sensitive.** `DARYL-DAVIS-V1.mp4` and
  `daryl-davis-v1.mp4` are one file; ffmpeg read and overwrote its own input.

## 101 — "make it better with animations based off the references ... they have people speaking ... more zooms, cuts ... no still cards ... use sound effects" (Tal on Daryl Davis V2 and V3, 2026-10-05)

His words: *"you should make it better with animations based off the references
I've given you, you haven't done that ... you said 1983 wrong ... there's also
some parts that are frozen ... you should use sound effects"*, then *"there
should be more zooms, cuts ... moving, no still cards ... I give you the
references, but they have people speaking. It includes the people speaking. So
make it like that."*

- **Studying the references is not using them.** V2 had pop-in captions and a
  push-in; none of the effects written down in `formats/ai-story-reel.md`
  section 3. Every designed beat in an AI story reel names the reference it
  copies (drawn arrow, name blocks, year roller, flurry, viewfinder, article
  highlight, polaroids) before it is built.
- **The people in the story speak in their own voices.** Transcribe every
  source first and pull the subject's real lines: his name, his question, the
  other side's answer, his last word. The narrator only connects them. V4 used
  four; the Kelly line is shown on Kelly saying it (same source, same time, so
  the lips match).
- **A flat card that sits still reads as a freeze.** Solid colour cards went
  out; a designed beat sits over moving footage or moves itself. `freezedetect`
  at `d=0.3` must return nothing.
- **Cuts: 60 a minute was what satisfied "more".** Every shot of 1.5s or more
  gets a punch-in jump cut at its midpoint; the big beats get a 6-cut flurry.
- **Check how the voice engine will READ a word, not how Whisper hears it.**
  `kokoro_onnx.tokenizer.Tokenizer().phonemize(text)` showed "1983" read as
  "nineteen hundred eighty three" and "Daryl" as "DAH-rril". Spell years as
  words ("nineteen eighty-three") and names the way they sound ("Darrel").
- **Sound effects go on every designed beat**: whoosh into a card, click per
  roller digit and per flurry cut, pop on a highlight and each polaroid, a low
  hit on the two biggest moments, a short riser into the quote.

## 102 — "why is this shot like this, this is horrible" and "this article is empty, find a real article" (Tal on Daryl Davis V4, 2026-10-05)

- **A wide shot of two people was centre-cropped to vertical and showed the
  wall between them.** I had approved it from a thumbnail 150 pixels wide.
  Before any landscape clip goes into a vertical frame: pull its full 16:9
  frame, find where each person sits, and either crop ON a person
  (`object-position` at their x) or, when the shot needs both people, show the
  whole picture as a band across the frame. Check framing at 300px or wider
  per shot, never on a 4-row contact sheet.
- **Grey placeholder bars are not an article.** A proof card uses the real
  page: fetch it, and use its real headline, byline, date and opening lines.
  The search-result title I had used was not even the published headline.
  If the real text cannot be fetched, do not show a body at all.
- **How the references use people speaking** (six more reels read the same
  day: @founded x5, @seeitai): one to three real lines per reel, 1-3 seconds
  each, always set up by the narrator's sentence before it ("...took the stage
  and said five words"), the speaker ON SCREEN while the line plays, captions
  carrying on in the same style, then straight back to the narrator. Wide
  footage is shown either tightly cropped on the one speaker or as a 16:9 band
  on black.

## 103 — "you don't do enough animations or movements like the references, copy that exactly ... combine all the references into one ultimate style" (Tal on Daryl Davis V5, 2026-10-05)

He liked V5 (*"it's really good actually, I really like it"*) and asked for
more: arrows like The Comma Effect, more movement, real pictures found online,
sound effects, all references combined. What V6 added, and what each came from:

- **Read the reference at 8-10 frames a second before copying its motion.** A
  contact sheet shows what is in a shot, never how it moves. The Founded
  strips showed things no sheet had: captions that build one word at a time
  dead centre, punch-in cuts of 1.0 -> 1.35 -> 1.8 on the words, half-second
  colour cards, a five-picture flurry for the hook.
- **Real photos first.** Wikimedia Commons had seven freely licensed photos of
  the subject (search the API, keep `LEDGER.json` with licence and author,
  credit on screen). Check there before using anyone's video.
- **Generated stills are available with what is installed**: the Hugging Face
  key reaches FLUX schnell through `router.huggingface.co/fal-ai/...`. Places,
  objects and backs only, labelled as illustration. No real person's face.
- **Arrows** (Comma): a dashed line drawn from a bottom corner to the subject,
  head landing last, a short whoosh under it. Used three times, not on
  every shot.
- **A caption box must not appear before its words**: a boxed phrase shows
  whole; only unboxed phrases build word by word.
- **Punch-in cuts need the subject's position**, in both axes. A head near the
  top of frame was zoomed out of the picture until the origin was set to it.
- Working template: `system/projects/ai-story-daryl-davis/v6/build.py`.

## 104 — "there's a picture of a beer, that doesn't make sense ... you kind of need to watch this video before you give it to me ... don't use the footage of other people, just use the Commons photos and videos" (Tal on Daryl Davis V6, 2026-10-05)

His words: *"Do we even say his age? ... 'Then he says something else.' There's
a picture of a beer. That doesn't make sense. You kind of need to watch this
video before you give it to me. But it's pretty good on the edit side. You
don't need to do the footage clip of other people. Don't use that. Just use
the Commons photos and videos. That was just as a reference."* And the ending
he wants: *"This is what happens when you meet someone you're taught to hate,
and then you actually end up understanding them ... put a big thing at the
end."*

- **Third-party footage is for studying only, even in a draft.** An AI story
  reel is built from Wikimedia Commons media, generated illustrations and
  designed cards. Search Commons for audio and video of the subject too: it
  had a public-domain 5-minute recording of Daryl telling the story himself,
  which gave real voice lines with no rights problem.
- **Watching means reading every picture against the words spoken over it.**
  `look/watch.jpg`: one frame a second with the words under each frame. That
  sheet caught what frame checks missed: a beer under a line about something
  else (and he does not drink; it was cranberry juice), "great friends" over a
  group of strangers, "two enemies" over smiling students, the same students
  behind "TAUGHT TO HATE". Ask of every frame: what does this picture claim
  about the people in it?
- **Tell the story from the subject's own account first.** His recording
  corrected two things the articles had blurred.
- **The ending is a line plus a card**: the narrator says the meaning in one
  sentence, then a big typographic card lands it.
- **Do not put a card or caption on screen for a fact nobody asked for** (the
  "25," card).
- Free image generation on the Hugging Face key ran out after six images in a
  month. Plan the stills before spending them.

## 105 — "when Daryl is speaking, you should use actually the clips of him speaking ... I don't need the illustration of a bar ... use real shots" (Tal on Daryl Davis V7, 2026-10-05)

This corrects lesson 104's first bullet, which I had read too strictly.

- **When the subject's voice is heard, the subject is on screen saying it.** A
  photo under a real voice is not enough. Find the VIDEO the audio came from:
  the public-domain recording on Commons was the audio of a town-hall video,
  gone from YouTube but saved on the Internet Archive
  (`yt-dlp "https://web.archive.org/web/2/https://www.youtube.com/watch?v=<id>"`).
  Line the video up with the audio already cut (transcribe ten seconds of
  each, compare one word's time: the offset was 231.24s) and crop to the
  speaker.
- **Real footage of him is wanted** (documentary, his Instagram, news): for
  him speaking and for the places in the story. What he rejected in V6 was
  other people's footage standing in for things it did not show.
- **No AI illustration where a real shot exists.** The generated bar looked
  fake to him next to real photos. Generated stills are a last resort.
- **Captions go under the speaker's mouth**, never across it, while he is on
  camera.
- **Do not put a narrator's line over footage of someone visibly talking.**
- **Review renders are shown low-res in the chat**; the full file is for
  after approval.

## 106 — "put the Social Accords logo on top, just write it ... over every video" + "it got cut out ... moved way too fast ... doesn't repeat itself ... 'before' and 'And' overlap" (Tal on Daryl Davis V8, 2026-10-05)

- **Every AI story reel carries the wordmark at the top, written as text**, to
  his picture: three stacked centred lines, wide letter-spacing: `THE` small
  and light, `SOCIAL` larger and light, both white; `ACCORDS` bold in warm
  cream-gold `#E9C98F`. CSS is `.wordmark` in
  `system/projects/ai-story-daryl-davis/v9/build.py`. Source credits move down
  to clear it.
- **A real spoken line gets room on both sides.** "It's called conversation"
  was cut 0.06s before the first word and faded on the last one, and he heard
  it as cut off. Leave 0.15s before and 0.25s after a real line.
- **72 cuts a minute was too fast** ("moved way too fast"). V9 is 52: one
  punch-in per long shot at most, a zoom-whip only on a change of chapter or
  speaker, four cuts in a flurry, not six.
- **Read the script aloud for repeated words** before recording it: "a bar in
  Maryland. A bar where..." became "a Maryland bar where...".
- **Time captions one voice segment at a time.** Transcribing the whole mixed
  track let a word from the next speaker land early ("And" over "before?").
  Transcribe each narration or bite file on its own and add its start time.
  A caption ends within 0.8s of its last word so it never hangs into the next
  shot.
- A year followed by a designed animation needs a pause in the voice for the
  animation to play: "In 1983." then 0.9s, then the sentence.

## 107 — Susan Retik: show the attacks and make the review actually playable (Tal, 2026-10-05)

Tal: "There needs to be shots of the attacks happening" and "it needs to be viewable."

- An interview shot over a named historical attack does not satisfy literal event coverage. Use verified archival visuals on those words. Do not substitute aftermath footage from another date or another attack site.
- Historical specificity matters: Susan's husband David was on Flight 11. A South Tower impact shot is Flight 175, so label it as general September 11 context, not the attack that killed David.
- Distinguish archival photographs from moving footage in the handoff. A deleted Commons video page or a search-result licence snippet is not a verified reuse licence.
- A localhost URL returning HTTP 200 can still be the Studio HTML fallback, not the MP4. Verify video/mp4, byte-range seeking, decoded dimensions, duration, and actual playback time advancing before saying the review is playable. Keep a native-controls player open for review.

## 107 — "too much space between the speaking ... a quote of Daryl actually saying the question ... more pictures like the references ... stop overlapping ... the captions aren't so good ... 13 seconds there's a little cut" (Tal on Daryl Davis V10, 2026-10-05)

- **Build the timeline from the sound, not the other way round.** V10 fitted a
  new voice into old slots and left pauses of up to a second. V11's `build.py`
  gives every voice segment a slot (its length plus a breath of 0.2-0.3s) and
  writes each shot as a share of that slot, so a pause can be closed without
  re-timing anything by hand. Longest pause is now 0.6s, and that one is the
  year animation.
- **A shot may not run past the footage that exists.** `MAXLEN` in the build
  holds how long each clip really lasts before it cuts to something else, and
  the build stops if a shot asks for more. It caught two overruns that would
  have shown a blur or the wrong picture.
- **The subject asks his own question.** Search the WHOLE long recording for
  the line before letting the narrator say it: he says "How can you hate me
  when you don't even know me?" on camera 11 minutes into the town hall.
- **Cut the picture and the sound of a real line from the same in and out
  points.** Then they cannot drift.
- **A cutaway for every named thing**, the way the references do it, and from
  free sources: Jerry Lee Lewis when he is named (public-domain photo), a
  street in Frederick for "Maryland", a red drink for "buys him a drink".
  Commons search by the thing's name finds them.
- **Captions: back to the white pill, one at a time, whole phrases written by
  hand** (`TEXT` in the build), gold on the turn. The word-building centre
  captions overlapped faces and each other and he did not like them. Under the
  face when someone is on camera, low on the article card.
- **No shot under 0.75s outside a deliberate flurry, and no move on a short
  shot.** The 0.7s handshake insert and the zoom on the walk-up were the
  "little cut" and the "it moves" he pointed at.

## 108 — "in 1983, there is too much time between speaking" + "make our own style with our own arrows and sound effects, more fast paced, more viral, combining all the references so it doesn't look like we copied them" (Tal on Daryl Davis V11, 2026-10-05/06)

- **No pause is left open for an animation.** I had held 0.6s after "In 1983"
  so the year could roll; he heard it as dead air. A designed beat plays UNDER
  the next words. Breath between narration lines is 0.14-0.2s, 0.2-0.24s
  around a real spoken line, and nothing longer.
- **One tense.** "In 1983, he's playing" next to "he kept talking" read wrong
  to him ("he was playing"). A story in the past is told in the past.
- **Trim a generated line by the model's own character timings**, with 0.06s
  before and 0.12s after. A silence threshold can eat a soft first sound.
- **Our own style, not a copy of any one reference.** From V12 on: our own
  arrow (one solid gold marker stroke, not The Comma Effect's dashed white
  one), our own caption (white pill, gold on the turn), our own end card
  (struck-through line, gold word lands), the written wordmark on top. The
  references are where the IDEAS came from; the look is ours. Next: our own
  sound-effect set instead of the stock whoosh/pop.

## 109. AI story reel V12 -> V13: know what is in every frame, and let the story explain it (2026-10-06)

Tal on Daryl Davis V12: *"on 47 seconds you used a picture of him with a little
Nazi thing, for 0.1 seconds ... Why does he have a Nazi thing? Is that his
story? You should understand that. Include this in the script."*

- **A media-start that lands a few frames early shows the END of the shot
  before.** `A 114.2` opened on 0.2s of the previous shot: Daryl at the White
  House holding a "White Power" swastika sticker. I had never looked at it.
  Find a shot's real first and last frame (stamped frames every 0.15s) before
  writing its start, and start 2-3 frames inside it.
- **A strong picture nobody explains is a hole in the script.** The answer was
  in his own town-hall recording: "over 200 white supremacists have given up
  that ideology ... the Ku Klux Klan or some neo-Nazi movement". So the script
  now says "Then others quit. Klansmen. Even neo-Nazis." over that shot (held
  1.2s, arrow on the sticker), and he says "And over 200 have left that
  ideology" on camera, with the real headline behind it. Search the subject's
  own words for the thing in the picture before inventing a line.
- **Hook: the fact first, the twist second.** "This man convinced members of
  the KKK to quit. And he's a Black musician." beat "This Black musician
  convinced ...". Say "KKK", not "Klan members".
- **Cut a place name that pays nothing off** ("in a Maryland bar" -> "in a
  bar"), and then cut the picture that only existed for it (the Frederick
  houses stayed one render too long).
- **When the subject says the small word himself, use it.** "I said, why?" is
  1.4s of him, then the Klan line. The reveal is the one CINEMATIC beat:
  picture drains to grey, slow push, riser under the line before, heartbeat,
  low boom + low piano note on "Ku Klux Klan". One per video.
- **Arrows come from the top**, down onto the thing, so they never cross the
  caption. A caption drops lower (`caplow`) when the thing pointed at sits
  where the caption would be.
- **Our own sound set** (ElevenLabs sound-generation, free tier works, ~1-2.5s
  each): marker stroke (arrows), camera shutter (every plain photo cut), paper
  slap (article), glass clink, riser, heartbeat, deep boom, low piano note,
  bright piano chord (name + end card: piano is HIS instrument, pick the
  signature sound from the subject). Trim the silence in front and set each
  peak by hand; `alimiter` re-levels a file unless told not to, so set gain
  with `volume` only.

## 110. AI story reel #2 (Tim Zaal + Matthew Boger): a line must explain itself, and every claim gets its picture (2026-10-06)

Tal on V1: *"skipping school because he was gay ... How does that make sense?
... She threw him out. Then you need to show someone throwing someone out ...
you need a video of skinheads ... Tim, you gotta explain that better ... you
need more SFX."*

- **Never keep a quote that only makes sense with the question that was cut.**
  "I told her it was because I was gay" answered "why are you skipping
  school?". Without the question it reads as nonsense. Read each real line
  COLD, alone, as a stranger would. If it needs set-up, say the plain fact in
  the narration ("At thirteen, he told his mother he was gay") and pick the
  line that carries the event itself ("she dragged me across the floor and
  threw me out the door").
- **Every event in the script gets a picture OF THAT EVENT.** "Threw him out"
  over boots walking in a park and "fourteen skinheads" over a man by a car
  were both wrong. If no real footage exists, generate a still (boy with a bag
  at a closed front door; shaved-head silhouettes under streetlights), credit
  it "ILLUSTRATION - AI-GENERATED", and keep faces out of it. Never use a
  photo of real, identifiable strangers to stand in for attackers.
- **Introduce the second person with what he DID**, before his line: "One of
  them was Tim Zaal. He was seventeen. And he threw the last kick." Then his
  own "when I kicked him in the head, he was out" lands.
- **Sound follows the picture**: door slam on the door, boots on the gang,
  running on the alley, a dull thud on the kick, a low drone into the reveal,
  a warm shimmer on "friends" and on the end card. One sound per event.
- **Sources, in order:** low-res everything -> transcribe -> pick lines ->
  download ONLY the chosen videos at 1080p into `hq/` and build from those.
  A talking head filmed 16:9 goes in a TALL window (1080x1216, blurred copy
  behind), never full-bleed: full-bleed cuts the forehead off. A two-shot goes
  in a full-width band so the channel's watermark is whole, not half.
- **Image generation that works here:** Hugging Face -> fal FLUX schnell (a
  couple of images, then 402 until the credits reset) and pollinations.ai (one
  or two, then 402; crop its corner watermark). Plan for 2-3 stills a video.
- **ElevenLabs is on the Creator plan from 2026-10-06**: `/v1/music` works
  (70s instrumental bed, loudnorm to -29 LUFS under the voice) and
  `/v1/sound-generation` for the per-event sounds.

## 111. AI story reel: "the most engaging video ever made", the PUNCH LAYER (2026-10-06)

Tal on Zaal/Boger V2, in three messages: *"you need a shot of him saying [it],
with VFX zoom in a little bit on his face ... make the captions more engaging,
popping up on the screen ... better animations and more B-rolls and faster
paced"*; *"imagine you're making the most engaging video ever made ... I should
watch it and not lose interest, every millisecond should be fast paced"*;
*"clicks, boom, boom, boom, things flashing in, flashing out ... fast cards,
good SFX ... like the references"*. 35 cuts a minute with a caption pill was
too calm. What V4 does, and what every video in this style now starts with:

- **~55-60 cuts a minute.** No narration shot longer than about a second. A
  4-second sentence is 4-6 pictures, not 2.
- **A spoken line is never one static shot.** Enter the same clip part-way
  (`"file.mp4@1.2"`) and raise the zoom each time (`z1.25`, `z1.5`): one line
  becomes two or three punch-ins on the face. Cut the pauses OUT of the line
  (silencedetect, keep ~0.15s) and hide each cut under a punch-in.
- **Captions pop word by word** as each word is spoken (bold white caps, heavy
  dark stroke, 72px, key words gold from the starred word to the end of the
  phrase), and the phrase kicks when the gold word lands.
- **Sound on everything:** a click or swish on every cut, a whoosh + a white
  flash on every whip, a short boom under every gold word, a stamp on every
  label card, a thud + full flash on the hit, plus the event sounds (door,
  boots, running) and the music bed.
- **Big numbers** (`num:14`) slam in over the picture when a number is said;
  **label cards** (`tag:HOLLYWOOD`) stamp in for places and dates.
- **Put the speaker ON CAMERA for the key line**, even if a better-worded
  version exists as voice-over somewhere else. If the exact sentence was
  recorded over B-roll, find the same moment told on camera in another
  interview and say so.
- Build order that saved time: change the ENGINE once (a `patch.py` per
  version), then port the same replacements to the other videos.

## 112. Write these scripts the way Tal writes his own (SCRIPT VIDEOOS PDFs, 2026-10-06)

Tal sent two PDFs of his real shooting scripts (Hisham + Aya; Aryeh Lurie) as
the model for the AI story scripts. What they do, measured on the page:

- **Hook = two identities and one act, as stacked short lines:** "This Muslim
  man / saved this Jewish woman / from being murdered by terrorists." Then the
  people introduce THEMSELVES: "Hi, I'm Hisham." "And I'm Aya. And this is our
  story." If a recording of the subject saying their name exists, use it.
- **3-6 words a line, one fact a line.** Never a sentence with two commas.
- **One concrete object carries the feeling:** "Aya still had her bike helmet
  on." "The old cucumbers that sellers were about to throw away." "The first
  plate out of the pot went to the neighbors." Find the object in the
  subject's own telling (Montana: her grandfather's pin) and build a beat on it.
- **Named beats, in order:** BEFORE -> THE [thing] -> ... -> WHAT IT COST ->
  TODAY. The narrator gives facts; the subject says every line that has a
  feeling in it. His scripts mark the question to ask to get each line.
- **The turn is its own tiny line:** "But they had never met." "For seven
  hours."
- **Ending:** "Today, ..." then the subject's payoff ("he's one of my best
  friends"), then his sign-off: "That's another story from Israel the
  headlines don't show you. Follow for more!" For a non-Israel story: "That's
  another story the headlines don't show you."
- **Check his premise before writing it.** He said Montana Tucker is "the
  daughter of Holocaust survivors"; every source, and her own words, say
  GRANDdaughter. The script says granddaughter.
- **His own voice exists in ElevenLabs** ("TAL VOICE", instant clone
  `UDM1kXWtXWhebxKvVVVw`; the professional clone was not fine-tuned yet on
  2026-10-06). Use it when he asks for his voice. ElevenLabs has no pictures.

## 113. A free, unlimited image generator now runs on the laptop; and never show a picture twice (2026-10-06)

- **`system/tools/sdgen.py`** (own venv: `system/tools/sd-venv`, torch 2.5.1
  + CUDA 12.1, diffusers 0.40). Stable Diffusion 1.5 "DreamShaper 8" + LCM
  LoRA, sized for the RTX 3050 Ti's 4 GB. `sd-venv/Scripts/python.exe sdgen.py
  out.jpg "prompt" [seed]` -> 576x1024 in 7 steps (~6s; ~45s with model load),
  upscaled to 1080x1920. Good for moody, faceless stills (boots on wet
  pavement, a market street, a door at night). Weak at faces and hands: keep
  people small, from behind or in silhouette. Label every generated shot
  "ILLUSTRATION - AI-GENERATED". Generate several in ONE process when a video
  needs many (the load is 40s of each call).
- **What does NOT run here:** LTX-2 (wants 32 GB of video memory; ~9-12 GB
  even compressed; 66 GB of models), Wan, Stable Video Diffusion. No local
  image-to-video on 4 GB. "Open Higgsfield AI" in Downloads is only an
  interface to the paid muapi.ai service and has no key configured.
- **The disk is 98% full (14 GB left on 2026-10-06).** Every 1080p source
  download and every render eats it. Check `df -h /c` before a batch; a render
  that fails with no clear error is often this (or a transient browser crash:
  the Zaal V5 render failed once and passed unchanged on the re-run).
- **No picture twice in one video.** Tal on Zaal V4: the two-shot used for
  "Today, they're friends" came back as the payoff at the end. The payoff must
  be a picture the viewer has not seen. Keep the strongest image of the pair
  for the ending and never spend it earlier; the hook flurry gets its own
  shots, not previews of later ones.
- **A creator's own clips often carry burned-in app text** ("Walking with your
  bestie like"): it collides with our captions. Look at every clip before
  using it and skip the ones with text.
- **A studio interview cuts to the host mid-answer.** Check the last second of
  every on-camera line; cut away to B-roll before the host appears.

## 114. Pexels is in the flow for ILLUSTRATIVE b-roll (2026-10-06)

Tal: *"Pexels is a library of free stock photos and videos ... useful for
general B-roll: pregnancy, hugs, letters, working hands. It isn't evidence of
the actual person's life ... use this if you want in your flow."*

- **`system/tools/pexels.py`**: `python pexels.py find "query" portrait` reads
  the public search page (no key needed, verified 2026-10-06), downloads the
  smallest file of the first 18 results and writes a contact sheet to
  `system/tools/pexels-cache/sheet.jpg`; `python pexels.py get <id> out.mp4`
  fetches the chosen one at 1080 on the short side. Most results are vertical
  4K and MOVING, which a generated still is not: try Pexels first, generate
  only when nothing fits.
- **Licence:** free to use and edit, credit not required. Do not imply the
  people shown endorse anything, never show an identifiable person in an
  offensive role (a stock face must never stand in for an attacker, a victim
  or the subject), never resell the file unchanged.
- **Label it** in the corner credit: "ILLUSTRATIVE STOCK". It is atmosphere
  (a door, a street at night, hands, a crowd from behind), never evidence.
  Prefer shots with no recognisable face.
- Order of preference for any beat: real footage of the real person -> real
  archive of the real event -> Pexels (illustrative, moving) -> local
  generated still (illustrative) -> nothing (rewrite the line).

## 115. Narration speed: natural, not rushed (2026-10-06)

Tal on Montana V1 (his own cloned voice at ElevenLabs speed 1.12): *"don't
speak so fast also."* The references run 180-200 words a minute, but HIS voice
at that speed sounds rushed. **Record narration at speed 1.0** (about 145-180
wpm) and get the pace from the PICTURE (cuts, pops, sounds) and from having no
gaps, not from a sped-up voice. `system/tools/revoice.py <build dir> 1.0`
re-records only the narration lines of a build; the timeline rebuilds itself
from the new lengths.

## 116. AI story reel corrections on Arno + Pardeep V2 (2026-10-06)

Tal: *"why do you say he took the lives of six people and the six is over
him?"*; *"use the original scripts ... from the reference videos I gave you.
Those are better"* (not his Beyond-the-Headlines shooting scripts); *"you
should do the arrow ... more"*; *"you added music [for Montana], why not the
other videos"*; *"now you have a new voice, a Tal voice."*

- **Never put a big number, tag or arrow over the face of the person who is
  speaking.** A "6" over Pardeep while he says "six people" reads as a label
  ON HIM, next to the word "killed". Numbers go on b-roll of the thing
  counted, or stay in the caption.
- **Script model = the REFERENCE reels, not his own shooting scripts.** Hook
  -> "So how did that happen?" -> "This is [name]." -> story -> "This is what
  happens when ...". His PDFs (LESSONS 112) are for videos he shoots; do not
  end these with "the headlines don't show you" unless he asks.
- **Arrows are part of the style: at least two a video,** on a face when the
  narration points at a person ("this man's father", "Arno Michaelis"), never
  on the current speaker.
- **Music must be HEARD.** A bed at -28 LUFS under a -17 mix read to him as
  "no music". Mix the ElevenLabs bed at about -23 LUFS and check every video
  has one (Daryl V14 has none).
- **Narrator = "TAL VOICE"** (his ElevenLabs clone) for all of these from now
  on, at speed 1.0.

## 117. Free only; the paper cut-out pipeline; brag for graphics (2026-10-06)

- **Tal does not want paid generation services** ("I didn't want to do anything paid ... my friends do it for free").
  Do not propose muapi / paid video models again unless he raises it. ElevenLabs (his own plan) is the exception.
- **Cut-out collage, all free and local:** `sdbatch.py` (object "isolated on a plain pure white background") ->
  `npx hyperframes remove-background x.jpg -o x.png` -> `node system/repos/paperima/paper-cutout.mjs` -> three frames
  taking turns at 6 a second = the hand-made wiggle. SD often draws the object twice: look at it and crop one.
- **Style test that proves the Elie Wiesel blocks:** `system/projects/style-test-wiesel/build.py` (two-weight title,
  paper list with cut-outs, framed inset on white). Colour cards and the host shot are not in the test yet.
- **Tal: "brag is really good to use for some aspects of the video edit."** The `brag` skill's motion-graphics craft
  may be borrowed for title / graphic segments inside a story video. Footage edits still belong to tal-video-editor.
- A session restart kills background renders silently: after any restart, check that the expected output files exist.

## 118. The Elie Wiesel Foundation model: host lines, map, stacking words (2026-10-06)

Tal on the Yeonmi Park reel: *"you should be able to do exactly these types of videos ... there's obviously parts that
will be my face speaking. So for those lines you tell me what I need to say, and then I'll send that footage to you ...
make the script and just make me the video, and the only line that's missing is there ... build everything that you
need. Test the quality ... I'll be the host."*

- **The workflow from now on:** write the script -> mark which lines are HOST lines (the connective ones: the question
  after the hook, each turn, the ending) -> build the whole video with his cloned voice on every line -> send it WITH
  the list of host lines to film -> when his clips arrive, swap them in at those slots (picture + his real voice).
  Host lines are short (2-9 words), 5-7 a video, about a third of the running time.
- **How to film a host line (tell him every time):** phone vertical, eye level, face filling the top half, plain wall
  or the location behind, one line per take, a half-second of silence before and after, look at the lens.
- **New blocks, built and tested (free):** `system/tools/mapgen.py` -> `route_map()` (NASA Blue Marble, public domain,
  `system/tools/maps/`; lon/lat points, camera pans along a dotted red route, labels stamp in) and `stack_words()`
  (lines stacking over footage). Test: `system/projects/style-test-map/`.
- **Blocks now in the story engine** (`ai-story-retik-quigley/v1/build.py`): `title:lead|BIG`, `card:#hex|lead|BIG`,
  `cuts:a,b,c` (Paperima cut-outs), mode `inset`.
- Not built: the restyled "wanted" portrait (image-to-image; untested on the 4 GB card).
- Running a test render while a final render is going roughly doubles both: queue them.

## 119. A title IS the caption: never both; Elie Wiesel captions measured (2026-10-06)

Tal on Susan + Patti V1: *"when you're speaking, $150,000, you're putting it on the screen with the text. So you don't
need the captions. Save that as a skill."* Also: the Flight 11 card *"wasn't good"*, the cut-outs *"were cut off a
bit"*, and *"did you do the captions like Elie Wiesel? Look at their page."*

- **When a title, card, number or date tag already shows the spoken words, there is NO caption under it.** The
  reference does exactly this (third reel, DeKSZLztRqk, 118 s: "is still a SUBJECT", "I'm defined as a JEW because
  we are all", "That defines ME not the enemy" all play with no small caption). In the engine: captions that start
  inside a `title:` / `card:` shot are dropped automatically; a phrase prefixed `~` in `TEXT` is timed but not shown
  (use it when a `tag:` chip says the same words, or when Whisper merged the words so the split has to be set by hand).
- **Their caption, measured on three reels** (Dd1Zme0NLJD, DdbjUfvt5T2, DeKSZLztRqk): heavy grotesk, sentence case,
  white, NO stroke and NO box, soft shadow; DARK text on a light page; 2-4 words, the whole phrase at once; vertical
  centre 0.69-0.71 of the height; text height 16 px of 640 (= Inter 800 at 62 px on 1080x1920, tracking -0.035em).
  No colour on key words. A fourth reel on the page (Dd4HHMSgKrd) is a plain speech clip with ordinary subtitles: not
  the model.
- **Their title** sits in the same lower-centre zone as the caption (not at the top): italic serif lead, heavy caps
  word, optional italic tail. A title goes over a PICTURE; a flat colour card is the weak version.
- **A flat colour card for a real event reads cheap** (Flight 11 on navy). Put the two-weight title over a picture.
- **Cut-outs: lay them out so none overlaps another, the credit chip or the caption line**, and look at one frame per
  cut-out. A white object on white fails background removal: draw it (PIL) and send that to Paperima.
- **Render bug found:** an `<img>` inside a clip that starts mid-shot can render as a broken-image icon for the first
  second (not loaded yet). Start the clip with the shot and hold the image at `opacity:0` until its cue.
- When Tal asks "did you study that?", say exactly how many reels were measured and which were not.

## 120. "Go to their Instagram" means study it, not lift it; music a bit lower (2026-10-07)

Tal asked for a Younes Alkarnawi video and pointed at the Jews of NY reel for "nice shots of him". I started cutting
THEIR reel into clips. Tal: *"I don't think we should use the actual picture of the Jews of New York because that's
their video. Just look at their framework... the script. Make it a bit similar."*

- **Another creator's finished reel is a REFERENCE (structure, script, shot ideas), never a footage source.** News,
  talks and documentaries were used as labelled sources in earlier story reels; a peer creator's own edit is different:
  it is their video. Ask what footage of ours exists before building. He has filmed Younes himself.
- When he names an account, find the reel, measure it into `formats/` and the reference library in the same turn, and
  say plainly that the build waits on his own footage.
- **Music: he asked to "lower the music a bit" after -23 LUFS. New default bed: 3 dB under that (about -26 LUFS).**
  `system/tools/wieselcaps.py <build dir>` puts the Elie Wiesel captions, the no-caption-under-a-title rule and the
  quieter bed into an existing story build in one step.

## 121. Previews are LOW-RES renders; full quality only after he approves (2026-10-07)

Tal: *"why are you re-rendering... you should show me just low res here, and then move to high res if I approve."*
I had been rendering every story video at full quality and then shrinking a copy for the chat.
- **Review render = `hyperframes render -q draft`** (or the smallest setting that shows the cut), sent in chat.
- **The full-quality render and the HD/original footage fetch happen ONCE, after an explicit approval.**
- A background job that deletes or rebuilds a project's `src/` or `vo/` must never be left running when it times out:
  a late one wiped the Younes clips mid-build. Kill it, or do not chain `rm` behind a slow command.

## 122. Ayesha V1: "it doesn't really make sense" (2026-10-07)

Tal: *"Why did you say back home in Karachi? At second 12... a picture of, I don't even know what that picture is...
this is kind of good, but it doesn't really make sense."* and *"the thing at the end should say: Follow The Social
Accords for stories that unite people."* and *"look at the Obsession page, look how they do their videos."*
- **A sentence may not lean on something the viewer was never told.** "Back home in Karachi" came before the video had
  said she lived in Karachi or had gone anywhere. Tell it in order: where she is from, where she went, what happened.
- **Never show an object the viewer cannot name** (a close-up of a heart-pump bag under a KARACHI tag). If a thing is on
  screen, the words at that second say what it is.
- **Every story reel ends on the line "Follow The Social Accords for stories that unite people."**
- Script and picture model for narrated story reels: the Obsession recipe in `formats/ai-story-reel.md`.

## 123. One picture per phrase; the Elie Wiesel page is the house model (2026-10-07)

Tal on Ayesha V2: *"it doesn't come good, did you study references to do this? This girl is from Pakistan (Pakistan
flag), switch, the heart (diagram / heart VFX) is from India (flag cut)."* Then: *"study Elie Wiesel, all of the
videos... the soup video... it should just make sense. Boom, fast."*
- I had studied the references and still put ONE face under a whole two-sentence hook. **The hook is cut phrase by
  phrase and each phrase shows its own noun** (person -> flag -> heart -> flag). Check the hook frame by frame.
- Measured the whole page (8 reels): the table and the rules are in `formats/ai-story-reel.md` under THE HOUSE MODEL.
  Their pace is 29-37 cuts a minute, so ours was not too slow; what was missing was the picture matching the word.
- Captions in their newest reels put the key words in YELLOW on the second line. Our Elie Wiesel caption keeps the
  gold key word (`.capx .k`).
- A cut-out or graphic must be on screen from the first frame of its shot: an empty page for a quarter second reads
  as a mistake.

## 124. A cutaway from his raw clip is watched end to end before it is used (2026-10-07)

Tal on Younes V2: *"it gets cut off like 'three years ago today' and it's just a picture. You didn't watch that actual
scene."* Under the title I had put the seconds AFTER his hook take: he drops the pose, pulls out his phone, both look
down. An outtake, used as b-roll because the first frame looked fine.
- **The seconds before "go" and after the last word of a take are outtakes.** Lay every cutaway out at 2 frames a second
  and look at all of it before it goes in the plan; note the usable in/out, not the clip.
- Found the same way: `c_two1` and `c_two3` are good for about 2.2-2.8 s, then he walks out of frame.

## 125. The references' sound, measured: light SFX, a woman's voice, music 6-10 dB under (2026-10-07)

Tal: *"study their audio, their music... understand sound design and effects, whooshes"* and *"try a voice more similar
to theirs... some with ElevenLabs, some free open source... switch them up and see which works best."*
- Table and rules: `formats/ai-story-reel.md`, "SOUND OF THE HOUSE MODEL". Short version: no SFX on every cut; whoosh
  on whips, hit on titles; bed 6.5-10.5 dB under the voice; narrator there is a young woman.
- **Voice tests are made as copies of ONE finished video with only the narration swapped** (`ai-story-ayesha/voices.py`:
  `kokoro` = open source on this laptop, `edge` = free Microsoft neural voice online; ElevenLabs ids in `el.py`).
  hyperframes tts could not see kokoro-onnx on this machine: call `kokoro_onnx.Kokoro` on the cached model directly.
- `pip` and `python` were different interpreters here: always `python -m pip install`.
- A Windows junction made in a bash loop with `..\v2\$j` wrote the literal `v2$j`: make junctions from Python.

## 126. Rotate the narrator voice across DIFFERENT videos (2026-10-07)

I made the same Ayesha video four times with four voices. Tal: *"I wanted you to choose the most interesting stories
and make them... you don't make the same thing four times... you can mix it up. You don't need every time to use
ElevenLabs. Sometimes Michael and Andrew... ElevenLabs Brian or whatever you want, ElevenLabs TAL VOICE... keep rotating."*
- **One voice per video, a different one each time:** Kokoro "Michael" (`voices.py kokoro`, free, local), Microsoft
  "Andrew" (`voices.py edge`, free, online), ElevenLabs Brian / Sarah / any stock voice, ElevenLabs TAL VOICE (his clone).
- Say which voice a video used in the message that delivers it.
- Never render the same cut several times to compare something unless he asks for a side-by-side.

## 127. Real pictures of the real person first; an unexplained picture is a mistake (2026-10-07)

Tal on Hardaga V1: *"the first shot, 'this Muslim woman', you have to use a real image... you have access to Google
Images or Pexels or whatever you need... make it look real and feel like the story is real"* and *"you said in 1984,
Zejneba Hardaga, and then there's just a picture of a tree. How does that make sense? ... try not to use any AI images."*
- **Look for the real photographs BEFORE generating anything.** They were one page away: Yad Vashem's own story page
  has four photos of Zejneba (the 1941 street photo with Rifka Kabiljo, her with her children, the 1985 ceremony).
  I had searched only Wikimedia Commons, found none of her, and fell back to AI silhouettes.
- **Order of sources for a story about a real person:** the institution or family page about them -> news photos ->
  free archives -> stock for places only -> AI as the last resort, and never for the opening shot.
- **A picture needs its reason on screen or in the words at that second.** Her memorial tree is meaningful only if the
  viewer is told it is her tree; shown bare for five seconds it is "just a tree".
- These photos belong to Yad Vashem: credited on screen, and flagged to Tal as NOT cleared (same as news footage).
- WebFetch got 403 from yadvashem.org; the built-in browser read the page and its image URLs.

## 100 — a caption that named the wrong religion, and a calendar that ignored October 7 (2026-10-07)

Two mistakes in the Metricool scheduling run, both caught by Tal asking "what is that?":

- **I captioned a video "meeting a Muslim police officer". Its own title card says "MEETING A CHRISTIAN IN ISRAEL"**: he is a Christian Arab officer from Nazareth. I had read one caption word ("MUSLIM") off a six-frame contact sheet and built four platform captions on it. **A caption states who someone is only from the video's own title card or a transcript of the whole clip, never from a few frames.** Religion, nationality and names are the facts this account exists to get right. When the full transcript has not been read, the caption stays general ("a police officer in Jerusalem").
- **I filled October 7 with ordinary upbeat posts.** Tal: "today probably should put any posts that have to do with October seventh". **Before scheduling, check the dates against the Israeli/Jewish calendar** (Oct 7, Yom HaZikaron, Yom HaShoah, Yom Kippur, Tisha B'Av, and days of national mourning). Those days get remembrance content he approves, or nothing; regular posts move.

## 128. After the hook, get in fast: a 73-second first cut of a one-person story was "too long" (Samira, 2026-10-07)

Tal on Samira V1 (73 s): *"it's too long, 'that teaches peace' then too long."* The hook promised a book that teaches
children peace, and the next thing was an 11-second self-introduction (mother of four, teacher, artist...). V2 kept only
"Hello, I am Samira, from Gaza" (2.7 s) and went straight to her question; two whole sections went, 73 s -> 43 s.
**Rule:** in an ai-story-reel built on one person's interview, the line after the hook is under 3 seconds and pays the
hook off; a single interview carries about 40-45 s, not 70. Cut her lines at real pauses (`silencedetect`), never at
Whisper word boundaries.

## 129. Every story reel is checked against the house model BEFORE the first preview (Rami & Bassam, 2026-10-07)

Tal, after Rami & Bassam V1: *"please use all my skills and references for best one"* and *"when I ask you to make a
video you need to use all my skills and GitHub repos to make it the best script and editing ever, use motion graphics,
use sound effects."* V1 went out at 19 cuts a minute with plain captions on the hook; the house model
(`formats/ai-story-reel.md`, Elie Wiesel) is 29-37 cuts a minute with the hook as BIG words landing one at a time.
V2 fixed it (28 a minute, four hook titles, a red number card, a dark "ENEMIES" card, punch-ins inside every quote).
**Rule: before rendering a first preview, print the build's cuts per minute and compare with the table in the format
file; the hook is big title words, never ordinary captions; every number gets a card; every quote of more than 3 s gets
a punch-in cut.** A first preview that misses these is not a first preview.

Same video, a fact check Tal asked for (*"was it a mistake?"*): a death is described with the wording a court or the
person themselves used, not a blunt summary. "Israeli border police shot her" became "a rubber bullet fired by Israeli
border police hit her" after checking the 2010 Jerusalem court ruling (negligence, no indictment). Check before the
voice is recorded, not after he asks.

Also: all story reels so far share ONE music bed (`sfx/music.wav`). A small library of licensed tracks by mood is the
missing piece; ask Tal for it or attach Instagram's own music through Metricool on auto-published posts.

## 130. The big hook words are the SPOKEN words, one voice segment per title (Rami & Bassam V3, 2026-10-07)

Tal on V2: *"an Israeli father, not 'this'. Make sure it aligns and is correct, and a better hook, better images, more
b-rolls, switches fast."* V2's titles said "this ISRAELI FATHER" while the voice said "An Israeli father", and four
titles were spread evenly over one 7-second voice file, so they drifted from the words.
**Rule: a hook title shows exactly the words being spoken, and each title is its own voice segment in SEQ (h1, h2...),
so the cut and the title land on the phrase by construction.** The hook itself is a contrast in two beats plus a turn
("An Israeli father lost his daughter to a Hamas bomb. A Palestinian father lost his daughter to an Israeli bullet.
Today, they call each other family."), each beat with its own picture (his face, the place). A narrated beat gets
three or four pictures, not two: V3 is 26 shots in 50 s (31 a minute, inside the house range).

## 131. A quoted line is cut on the speaker's first WORD, found with silencedetect (Rami & Bassam V4, 2026-10-07)

Tal on V3: *"when he speaks 'we are family, we are very connected', it's not so good."* The line was cut from the
transcript SEGMENT time (242.5 s); the first word is at 244.47 s. Two seconds of dead air sat in front of it, with a
one-second pause in the middle, and the captions ran ahead of the voice. Whisper's segment start is where the previous
speech ended, not where this speaker begins.
**Rule: every interview line is cut from `silencedetect` (first word minus ~0.07 s, last word plus ~0.12 s), a pause
of more than 0.6 s inside a short line is cut out, and after the build the caption start times for that line are
printed and compared with the word times.** Same rule as LESSONS 128 for Samira; it applies to English lines too.

## 132. The hook names the people in its first line, and the story then runs in order (Indo-Pak Express V1, 2026-10-08)

Tal on V1: *"the story doesn't flow ... doesn't make sense to start 'one is Indian'. Start it with the hook: this Indian
and Pakistani players."* V1 opened on a riddle ("One is Indian. / One is Pakistani.") and then jumped: quote, how they
met, the final, the speech. He also caught a shot of a website: the clip I cut for "One is Pakistani" began on the
last frames of the film's previous shot (a scrolling web page).
**Rule: line one says who this is about, both people together ("An Indian and a Pakistani / were supposed to be
enemies"). After the hook the story is chronological: who they are, how they met, what happened, what was said. And
the FIRST and LAST frame of every cut clip is looked at before the build, not only a frame from the middle.**

## 133. Every spoken line gets a picture of that exact thing; where no real one exists, a faceless illustration (Rawan Osman V1, 2026-10-08)

Tal on V1: *"doesn't really make sense ... a picture of a small shop ... someone dropping her shopping, running
upstairs, locking the door."* V1 put Strasbourg street photos and a synagogue under "walked into a small shop",
"dropped her shopping", "locked her door". True places, wrong pictures. Then, on my first illustrations: *"don't show
an Asian man, he was a Jewish shop owner. Just don't show her face then."* The generator had drawn faces I had not
asked for.
**Rule: for an action nobody photographed, make an illustration (Agnes AI, `system/projects/ai-story-kit/gen.py`,
his free key) of exactly that action: hands, backs, objects, places. NEVER a face for a real person, and no
ethnicity guessed. Look at every generated picture; regenerate any that shows a face. Each one carries the credit
"ILLUSTRATION · AI IMAGE". Real photos and real footage stay first for the people themselves.**

## 134. A death is described the way the family says it (Rami & Bassam V5, 2026-10-08)

Tal: *"'An Israeli father lost his daughter to a Hamas bomb' doesn't make sense. 'To a suicide bombing', that's
good. And you should use part of him speaking."* Rami's own sentence in the interview is "I've lost my 14-year-old
daughter, Smadar, in a Hamas suicide bombing in Jerusalem". V5 uses his wording in the hook and lets him say it.
**Rule: when the person tells the fact on camera, that line is in the video in their voice, and the narrator's
wording matches theirs.**

## 135. One story file, one engine; each story gets its own voice and its own music (2026-10-08)

Five stories in one night were only possible after the per-video `build.py` became `ai-story-kit/engine.py` reading a
small `story.py` (lines, quote ranges, clips, plan, credits). Helpers: `new.sh` (folder), `voice.py` (ElevenLabs),
`prep.py` (quotes and clips; optional crop to remove burned-in text), `gen.py` (illustrations), `music.py`
(ElevenLabs Music, levelled to the old bed). Tal allowed his ElevenLabs for music and SFX the same night.
His Drive music folder (`assets/music-library`, 42 files) is commercial instrumentals (Kanye, Kendrick, Drake, MF
DOOM): Instagram can mute or block a reel for those, so they are not used under these reels unless he says so.
Captions: Montserrat 900, 72 px, key words gold, upper case and 16% larger, popping in.

## 136. Thirteen stories in a day: what broke, and the checks that caught it (2026-10-08)

Tal: *"build everything."* Seven more stories went out after the first six. Four defects were caught on the contact
sheet of the rendered file, one only after an upload:
- **A quote that was the HOST speaking.** The Nissim Black bite "we overdo how much people hate us" came from a
  transcript with no speakers; the picture showed the interviewer. Rule: every quote is confirmed by looking at who is
  on screen while it is said. A voice-only quote is used only when the source is one person's call or monologue.
- **Bite ends that ran into the next speaker** ("Where is this?", "Explain to me"). Rule: after the build, print the
  words Whisper hears in each cut quote; anything after the last intended word means the out-point is late.
- **Illustrations that drew a person anyway** (a face at a desk, a woman in a men's doubles pair, a propeller plane
  for a 737). Rule: look at every generated picture at full size; wrong detail means regenerate or use a real photo.
- **Burned-in subtitles cut off** by the 4:3 "band" crop. The new `wide` mode shows the full 16:9 frame.
- **A failed build that still rendered.** `engine.py | head -1` hid an assertion error, the old index.html rendered
  and was uploaded to Frame.io (Abanoub Samaan V1). Rule: never pipe the engine into `head`; write its output to a
  log and chain the render with `&&`.
Hebrew, Hindi, Punjabi and Korean lines: captions are a translation nobody checked unless the source burned its own
subtitles in (AFP). Say so in the hand-over; Tal reads Hebrew.


## 137. "It wasn't flowing, just has weird cuts": what made the story reels choppy (2026-10-08)

Tal, after thirteen stories: *"I love the videos you made but it wasn't flowing good, just has weird cuts."* Three
things in the engine did it, none of them a real cut decision:
1. **The hook was five separate voice takes** glued 0.04 s apart, so the melody restarted on every line. Now the hook
   is ONE take, cut between lines at the character times ElevenLabs returns (`voice.py`), with no gap inside it.
2. **Every shot longer than 2.6 s jumped 14% closer at its midpoint.** It was meant as a punch-in and read as a cut
   to nothing. Off: a shot now pushes in once, smoothly.
3. **Every paragraph opened with a 1.6x whip and a white flash.** Now 1.16x over a quarter second, flash at 10%.
Also: 0.25 s of breath between paragraphs instead of 0.10. Shown to him on Hadad & Qureshi V2 before touching the
other twelve. **Rule: a transition is something the viewer should not notice. One take per run of narration; no
scale jump inside a shot; a flash only on the hook's last beat.** His hook question the same day ("are you using
Jake Schincariol's skills for hooks?"): I had not been. `ig-reel/hookscore.py` now scores three hook options per
story and the number is reported, never used as a gate (it rates his own titles WEAK).

## 138. Story-reel hooks must score 100 on Jake Schincariol's scorer, and each phrase gets its own picture (2026-10-08)

Tal: *"you should be using one that's 10000"*, then *"only make 100 hook options"*, and on Megan's hook *"a Jewish
man (put image), then with dessert (image), Jewish blogger named ... (image)"*.
**Rules. (1) The hook line of a story reel scores 100.0 on `skills/ig-reel/hookscore.py` before it is voiced; the
lines for all 13 stories are in `ai-story-kit/rehook_data.py`. The scorer wants 5-12 words, 60 characters or
fewer, a stake word or number in the first four words, two concrete things, two stake words, and "you". The line
must still be true: "nearly banned" was dropped for Hadad & Qureshi because he was only warned. (2) When a sentence
names two things, it is two shots: the man, then the dessert; the blogger's real face when his name is said.**
A cut that begins three frames before the shot you want shows as a flash of the wrong picture (students before
Fabian Debora): look at frame 0 of every clip, and when the sound must start earlier than the picture, hold the
first good frame (`tpad`) instead of starting the picture early.

## 139. Write for someone who knows nothing about the subject (Hadad & Qureshi, 2026-10-08)

Tal on V5: *"why did you do a Lahore to Ramla animation"* and *"'fought their way into Wimbledon'? No one knows what
that is."* The map named two birth towns nobody has heard of; the script used tennis words ("fought their way into",
"eleventh seeds", "last sixteen") as if the viewer followed the sport.
**Rule: a map names COUNTRIES unless the town is the story. Every term a 15-year-old outside the field would not
know is replaced by what it means: "Wimbledon, the biggest tennis tournament in the world"; "one of the best teams
in the world", not "the eleventh seeds". Read the script once as someone who has never heard of the subject.**

## 140. The approved story-reel template, and what the first full pass got wrong (2026-10-09)

Tal approved Hadad & Qureshi V8 ("ok this is nice, fix up the rest and add this to the trials and the others to the
trials ... trials once a day"). The template: hook "This man / woman / pilot [what happened]. [One more beat.] This is
the story of NAME", a drawn arrow on the real person, a map with COUNTRY names, paper-collage illustrations, one
counter or checklist, his SFX kit, the hook as one voice take. Fourteen stories now use it (`rehook_data.py`).
Caught on the contact sheets while rolling it out, each a rule:
- **The arrow tip must stop beside the head, never across the face.** Tal sent back the frame where it lay over
  Rawan's eye. The arrow flag takes the face centre and a pull-back distance (face radius plus a margin):
  `arrow:X,Y,seconds,pullback`. Check every opening with `ai-story-kit/hookonly.sh` (3-second draft) before a full render.
- **Two names on one title line run off the screen.** Break after "&" (`|ALI_ABU_AWWAD|&_HANAN|SCHLESINGER`).
- **A collage illustration can still draw a person** (a man at the head of a Shabbat table; a light-skinned man
  walking out of prison in a story about a Black man; a child cut-out beside a pair of shoes). Say "no people" for
  objects and "pure black silhouette" for a figure, and look at each one.
- **A real photo beside the wrong sentence accuses someone.** Coptic priests appeared under "social media taught him
  who the enemy was". Read each caption against its picture.
- A quote cut from a transcript can begin on the previous speaker's "Oh,": print the words heard in each cut quote.

## 141. Street-conversation batch: his finished clips are the template, captions small (2026-10-10)
Tal, briefing a ~330-clip batch before handing it over: *"the ones with the title cards or captions, just take as
references ... you can copy that exact thing"*, *"look at the captions, very small"*, *"the captions to not be so
big"*, *"it needs to flow well"*.
- **A clip in the folder that already has a title card or burned captions is a REFERENCE, never source.** Do not
  re-edit it. Measure its title card and caption size from its own frames and match them on the new cuts.
- **Captions are small.** Take the height from his finished clips in the same folder, not from the previous batch's
  default. If in doubt, go smaller.
- **One person, one video.** Only really positive answers. A fumbled approach, a flat reaction or a negative answer
  means that person gets no video; do not pad the count.
- **Some clips are sideways.** Check rotation on every clip before cutting.

## 142. Phone footage is already graded: no saturation boost (2026-10-10)
Tal on the first street-oct10 cut: *"the color grading was weird, maybe less saturation."* `build-edit.mjs`'s default
GRADE adds +42% saturation, tuned for flat Sony / chest-cam files. His iPhone POV clips arrive already vivid.
Measured SATAVG: raw clip 13.2, my V1 18.8, five of his finished clips from the same folder 7.2-17.4 (median 13.6).
- **iPhone / phone-export footage: `"grade": false`.** The as-shot file already sits where his finished clips sit.
- Also from this cut: `"autoFrame": false` on wide phone POV (the 1.35x face crop cut a head off and softened a
  720p source; his finished clips are uncropped), `"capSize": 64`, `"titleSize": 56`, one yellow word via `captionKeys`.
- He also widened selection the same day: the Nigerian Christians, the fitness creator and the Polish woman are OK
  to cut. "Nothing negative" means no bad reaction to HIM or to Israel, not "never mention anything hard".
  *(The last sentence is my reading of "good ... good ... is ok, that's fine"; confirm if a cut comes back.)*

## 143. A line Tal FEEDS the person is coaching, not dialogue (2026-10-10)
Tal on the Ethiopian cut: *"on 28 seconds I said, 'say you feel safer.' That didn't make sense. It didn't sound
natural."* The transcript read `yeah definitely say I feel safer`; I took "say" for a mis-hearing and captioned it
as her answer. It was him prompting her. His raw clips are full of this ("say I love the people", "now say there are
Jews all over the world", "wait", "one second", "I'm not recording").
- **Any "say ..." in his voice, and the answer that follows it, is out.** Use the clean take: he nearly always
  re-asks the question in the next clip (here IMG_6141, four seconds, asked once and answered once).
- **Never use captionFix to paper over a word that does not make sense.** Find out who said it first.
- Same cut: two consecutive beats both said "Jews come from countries in Africa". Read the beats in order as one
  script before rendering; a repeat is invisible beat by beat.
- Same day, Muslim and Jewish friends: **cut "we are all Arabs"** (and the "I'm an Arab Jew" lead-in). End on the
  peace message and "Habibi. Shalom. Salamu alaikum."

## 144. Street batch look, second pass: light grade + a small Arabic line (2026-10-10)
Tal, after the as-shot versions: *"add some sort of a little bit color grading, and add captions under in Arabic
that are small ... make it flow."*
- **`"grade": "light"`** in `build-edit.mjs`: gentle S-curve holding both endpoints, +10% saturation, no warm push,
  no exposure lift. The step between `false` (he found it flat) and the default +42% (he found it "weird").
- **A second caption line**: `projects/<slug>/captions-ar.json` maps each English caption (UPPER-CASE, single
  spaces) to its Arabic; `render-caption.py` draws it under the English at 72% size, shaped with
  arabic_reshaper + python-bidi. 58% was too small to read on a phone.
- **The Arabic is written by Claude and is UNVERIFIED** until an Arabic speaker reads it. Say so on delivery.
- `render-caption.py` read stdin in the console codepage: without `PYTHONUTF8=1` the Arabic came out as
  mojibake ("Ùƒ Ø§Ù†Øª"). It now decodes stdin as UTF-8 itself. Look at a frame of the second line on every build.

## 145. "Make the captions better" = make them HIS: `"captionStyle": "street"` (2026-10-10)
My street captions were Arial Black, dull gold, up to seven words on two lines. Cropped next to six of his finished
clips the difference was plain: his are a heavy rounded face, 1-3 words, ONE bright-yellow word in every caption.
- `"captionStyle": "street"` -> Montserrat ExtraBold (`system/assets-fonts/Montserrat.ttf`), yellow (255,232,40),
  a key word in every caption (`captionKeys` chooses it, otherwise the longest non-stopword).
- `"captionMaxWords": 4` stops the 0.8s-merge from building a sentence. `"capSize": 74`.
- The Arabic map is keyed by caption chunk, so **re-chunking orphans it**: after any change that moves caption
  breaks, print the captions with no Arabic entry (must be an empty list) before rendering for review.
- Put a crop of his caption next to a crop of mine BEFORE the first review, not after he asks twice.

## 146. Street cuts: open on the greeting, title off the face, title simple (2026-10-10)
Tal on the kebab cut, with a screenshot of the pill across the owner's forehead:
*"change that to not cover his face, just simple: POV: meeting an Arab Christian in Israel"* and
*"start always with the intro shot: hey, salam alaikum, how are you, boom."*
- **The first shot is always the approach / greeting**, even one second of it ("What do you want?"). Never open
  mid-conversation on the second line.
- **The title pill never sits on a face.** `titleY` is a default, not a coordinate: look at frame 15 of every cut.
  When the face is high in frame, put the pill on the chest (`"titleY": 830` here), above the captions.
- **Title = "POV: MEETING A/AN <who> IN ISRAEL"**, two lines. No story summary in the pill.
- He called V4 of this cut "perfect": street caption style + small Arabic + light grade + this title is the
  template for the rest of street-oct10.
- `selfreview.mjs` prints "2 issue(s)" without the reason; run `verify-cut.mjs <edit.json> --render <mp4>` to see it
  (both were beats ending on a dangling "Yes," / "Thank").

## 147. The opening line was captioned from a mis-hearing, and the shot cut off "my friend" (2026-10-10)
Tal, after the kebab cut was already scheduled: *"you did it wrong, captions: it should say 'what do you want in
your pita, my friend'."* The transcript had "What do you want in your business?" and stopped at 0.97s; I captioned
it as written and ended the shot at 1.25s. The real speech runs to 1.56s (`speech-runs.py`: 0.00-0.95, 1.29-1.52).
- **A first line added in a hurry gets the same check as the rest**: run `speech-runs.py` on the span and compare
  with the last transcribed word. Speech after the last word means the transcript is short, not that it is silence.
- **A caption that is an odd thing to say ("what do you want in your business") is a mis-hearing until proven
  otherwise.** I cannot listen; say so, and ask him for the line rather than shipping the transcript's guess.
- **Fix the words in the cached transcript and re-align**, then re-render and REPLACE the media on any scheduled
  post (`updateScheduledPost` with the full original body; the uuid stays, the id changes).
