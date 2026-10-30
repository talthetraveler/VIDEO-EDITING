# TRAVEL VIDEOS — THE SIDE QUESTER / TRAVELING AROUND THE WORLD WITH NO MONEY

Tal, 2026-10-30: *"you're gonna need to know how to edit my travel videos."*
Then: *"u basically need to understand the framework and workflow, how it was able to edit."*

This file is that framework and that workflow. It comes from his Tab handoff (a zip of the
whole WhatsApp chat, Oct 13-29): his own SIDE QUESTER doc, the Episode 1 and 2 briefs, 458
voice notes, 48 PDFs and the kit Tab built so another editor could take over.

**Travel only.** Tal, 2026-10-30: *"anything with Israel is separate."* His street POV videos in
Israel, like "Meeting an Indonesian Christian in Israel", are NOT travel videos, even with a
traveler in them. They follow `TAL-EDITING-BIBLE.md` and THE STANDARD, and nothing here applies to
them. The Tab chat mixes both, so sort every clip, reel and note into one side first.

**Status.** The rules are his, in his words. The measurements are Tab's, not re-measured
here. **No travel cut has been approved yet**: he turned down Ep1 v4, so the long-form half is
taught, not proven. Replace anything he corrects; do not stack a second file beside this one.

**Read before any script: `assets/references/sidequester-kit/PRIVATE-RULES.md`.** What the
public story may and may not say. Gitignored on purpose, because this repo is public. Never
copy its contents into anything that gets pushed.

| where | what |
|---|---|
| `formats/no-money-voiceover.md` | how a voiceover tells a story: say it, see it. Read for every VO |
| `formats/no-money-templates.md` | the menu: 106 reel templates and the lead reference of each |
| `assets/references/sidequester-kit/` | local only: his full doc, the master playbook (466 reels, country plans, scripts), transcripts by country, the footage index, the recreate notes, his voice notes on travel |
| `system/tools/sidequester/` | `footage_search.py`, `grade_match.py`, working here |

---

## 1. The show

> A seventeen-year-old leaves Miami with a backpack and camera, discovers that he can trade
> skills instead of money, begins relying increasingly on strangers, pushes the challenge
> farther across Asia and the world, comes home completely changed, leaves again, starts using
> the journey to help people, and continues seeing how far curiosity, creativity and human
> connection can take him.

*"That should be the lens through which every editor ... looks at the footage."*

**Two workflows run at once. Know which one the job is.**

| | ARCHIVE POSTS | THE CANONICAL SERIES |
|---|---|---|
| order | any country, any day | strictly chronological |
| goal | pages active, learn what performs | the flagship |
| rule | never claim old footage is happening today | told **as if it is happening now** |

**His order of priority, verbatim:** *"USE WHAT IS FINISHED. FIX WHAT IS ALMOST GOOD. FIND THE
BEST STORIES IN THE RAW FOOTAGE. ONLY SPEND HEAVY EDITING TIME ON STORIES THAT DESERVE IT."*

**The decision every clip goes through:**

| story | footage | make |
|---|---|---|
| great | great | PRIORITY |
| great | okay | voiceover / creative edit |
| weak | amazing | cinematic reel |
| weak | weak | don't use |

**Story laws, his words:**

- *"A country isn't the story. What happens to me inside the country is the story."* Never
  airport -> drone -> food -> monument -> hostel -> next country.
- The story is the chain reaction: one stranger leads to another, one yes leads to another.
- Never make it look effortless: *"I get rejected. I don't know where I'm sleeping."*
- *No plan -> something goes wrong -> meet a stranger -> completely unexpected experience.*
- *"NOT EVERY COUNTRY NEEDS ONE VIDEO."* Length follows the story, never a country rule.
- Real audio beats narration: *"I have no idea where I'm sleeping tonight"* said live is better
  than a voiceover saying *"I had no idea where I was sleeping that night."*
- *"Don't use ten average shots when four amazing ones tell the story better."*
- Leave it out if the footage does not exist and the story does not need it.
- Every question gets its answer, in order. Never lift a line for the hook if that leaves a hole.

**Voice.** First person, present tense, happening now: *"Guys, I just graduated high school and
I'm about to go on a crazy adventure."* Never a person looking back. Warm, a bit deadpan, a joke
every few lines, one sincere line near the end. Lists of three. The kit line: *my backpack, my
skateboard, my camera.* Every script line comes from his real words (transcripts, his book).
Flag every fact you cannot verify. **Never invent one.**

---

## 2. How Tab was able to edit: the workflow

**The secret is not the editing. It is the preparation.** Tab first turned everything into text
it could search, so choosing footage stopped being a guess. Five things were built once, then
used on every video:

| built once | what it is | where |
|---|---|---|
| **footage index** | one record per Frame.io asset, 52,978: what is on screen, who, country, camera, shot type, orientation, HDR, kids flag, transcript snippet, measured sharpness / stability / exposure, a `cinematic_ok` flag, and `links` grouping clips of one moment (see below) | `index/tal_footage_index.json` |
| **country transcripts** | every clip with speech, in capture order: story so far, best lines, plan, long-form order | `sources/transcripts/<Country>.md` |
| **reference library** | every reel he sent: hook words, every shot with its length, text, VO, song, grade | `pdf-text/*tal_reference_library.txt`, master Part B |
| **templates** | those reels grouped into 106 repeatable types, each with a recipe and his version | `formats/no-money-templates.md`, master Part A |
| **lessons** | every note he ever gave, as a permanent rule | `sources/editing/tal_editing_lessons.md`, `LESSONS.md` here |

**How the links were made** (`scripts/footage_index/chains.py` in the kit). Each folder was sorted by
file name, then 35 clips at a time went to a model as TEXT: name, length, who, shot type, the
description, the first 220 characters of speech. It returned groups of four types: same-moment
(13,092 links), activity (3,512), enter-place (2,209), talk-then-show (1,283). **Limits:** it judged
from words, never frames, so a link is a hint. It worked inside one folder, so **an iPhone line and
the Sony shot of that moment are never linked.** Drone clips were left out on purpose. 12,885 of
31,325 videos have no link at all.

### How the voiceover knows the story

Tal, 2026-10-25: *"I'm vlogging the story ... if I vlogged the whole Oman trip and spoke about what
happened ... then you can know how to build the story."* A voiceover is never invented. It is
rebuilt from what he already said on camera.

1. **Everything he said is transcribed:** about 15,000 clips with speech, one file per country in
   `sources/transcripts/`, in capture order.
2. **Each file turns that into a story:** what happened, trip beats, best lines, then a PLAN (story
   arc, episode outline, short reels to cut), then every scene with its talking clips and B-roll.
3. **Pick the story, write from his words.** His real lines come first, and the book fills gaps. The
   script keeps the reference's structure and swaps in his facts. See `no-money-voiceover.md`.
4. **Every line finds its clip.** Search the transcript for the words: the best shot is often the
   clip where he says it on camera.
5. **He records it, or it runs in his ElevenLabs voice.**

**Gaps.** Taiwan (691 clips), Jamaica, Italy and Dubai have transcripts but no story or PLAN yet;
write those from the transcripts before scripting. The edited-video files are transcripts only.

**Check every fact.** The story sections and transcripts are machine-made and can be wrong: the
Mongolia file says he "turns 28". Names and local-language lines are often off. Confirm against his
own words or the book, and flag what you cannot confirm.

### The steps, for every video

1. **Take the brief.** Usually one reel and a short note: *"recreate"*, *"nice edit"*, *"like this
   for every country"*. Look its shortcode up in the master, Part B. If it is new: download it low
   quality (*"I don't need references in full quality"*), contact sheet, transcribe, write down
   the hook words, every shot length, text, VO, song, grade.
2. **Copy the TYPE, never the content.** His rule, 2026-10-26: *"if the reference shows someone in
   the first couple seconds and then it goes into the reel, you find that kind of clip."* Opens
   on someone talking -> open on Tal saying a real line. Someone running -> find Tal running.
   *"Doesn't need to match exactly ... level of quality"*: our story and shots differ, the
   quality and speed may not.
3. **Pick the story** from the country transcript: story so far, best lines, plan. Use his REAL
   lines. Check the master so a story is not used twice.
4. **Find the shots.**
   ```bash
   PYTHONUTF8=1 python system/tools/sidequester/footage_search.py "<what the line says>" --country mongolia --cinematic --sharp --stable --no-kids
   ```
   Read the `linked` lines: a talking clip and the shots that prove it are already paired. Then
   **pull a frame of every candidate and LOOK.** *"You gotta actually watch a clip, not just
   transcribe them."* The index is a retrieval hint, built Oct 26: 31,325 unique videos, 4,099
   flagged `cinematic_ok`. Anything added to Frame.io since then is not in it.
5. **Fill the sheet before cutting:** `time | line | picture word | shot | clip id`. Say it, see it
   (`no-money-voiceover.md`), then the mute test.
6. **Build on the reference's exact cut times**, 1080x1920 at 30 fps. Tone-map iPhone HDR first
   (section 5).
7. **VO.** His ElevenLabs professional voice (*"U can use v4"*; the key is in `system/.env`). A
   script built on his real lines, every unverifiable fact flagged.
8. **Check everything before he sees it** (section 7).
9. **Preview in chat.** One line, then the video. **Name the song** so he can add it on Instagram.
   Keep a notes file: script, shot table, song, flags.
10. **After his yes:** HD final -> Frame.io -> **Metricool, brand The Side Quester** (*"traveling my
    videos goes to the sidequester"*; anything about Israel goes to The Social Accords).
11. **Add what he corrected** to `LESSONS.md`, the same turn.

**Footage order inside every country (his):** finished long-form -> short-form edits -> iPhone /
iCloud -> GoPro -> Sony -> drone -> 360 -> photos. Long-form edits come first even when they are
weak: *"Think of them as a story map"*, then go back to the best source clips and rebuild.

---

## 3. The six kinds of travel video

Decide which one first. Numbers are Tab's measurements of his references.

| kind | when | source | look | sound | pace |
|---|---|---|---|---|---|
| **A. YouTube episode** | canonical series | **GoPro vlog folders first**, then Sony, drone | 16:9, **cinematic grade required** | real audio first, VO fills gaps | section 4 |
| **B. VO story reel** | great story, okay footage | his clips, literal to each line | natural unless the ref is graded | his cloned voice, music ~12 dB under, wall to wall | a cut every 1.1-2 s; 3.3-3.8 words/s |
| **C. Cinematic reel** | weak story, amazing footage | **Sony + drone only** (*"Nah it's cinematic"*), or native-vertical DJI | **match the reference's grade** | no VO, music to the last frame | hold, then burst: one 2.5-6 s setup, the drop, 0.4-1.1 s shots, a 1.3-2 s hero closer. Every cut on the music |
| **D. Short vlog** | a day or a chase | iPhone | natural phone colour | his sync talk IS the voiceover; a low song or live sound | talk 2-4 s, inserts 0.6-1.3 s, a 4-5 shot process run at 0.6 s |
| **E. Caption reel** | one idea, no story needed | his strongest moving clips | per reference | music only | 3-5 s hold under the caption, then 8-16 clips of 0.5-1.2 s on the beat |
| **F. Talking moment** | a great line to camera | one clip | natural | no music | *"choosing a really good moment if I'm speaking to the camera ... that could just be a video, just with captions"* |

Also: explainers about a place (*"explainer videos for different places ... SFX, VFX, voiceover
style"*), and the negotiation itself (*"people trying to get something for free by making
videos, and then join the process"*).

**Cinematic rules (C), from the 62 reels he sent on Oct 24:**

- Open on a strong shot that is already moving. No logo, black or fade-in. If the drone opener
  is weak, use the best iPhone clip: *"the first clip is not so nice."*
- **Tight close-ups of him between the big wides:** eyes opening, face, hands. *"That's the
  cinematic stuff."* Every cinematic reel.
- Every shot is a peak action, a person, or an icon of the place. No empty drone shots.
- Golden or blue hour, backlight, silhouettes.
- Type is small and elegant, 3-4% of frame height, never over a face.
- A horizontal clip goes letterboxed. **Never crop horizontal to fill vertical.**
- The 9:16 -> 4:3 format: shot 1 full-screen with the hook text, then on a beat a hard cut drops
  every other shot into a centred window, pure black bars, nothing in them:
  `scale=1080:810:force_original_aspect_ratio=increase,crop=1080:810,pad=1080:1920:0:555:black`
- **Music plays to the last frame.** Check the AUDIO STREAM's duration, not the file's. Render
  video only, then mux, or `-frames:v` cuts the audio short.

**Short vlog joins (D), how clips connect without a voiceover:** say it, show it (the line names
a thing, the next 0.6-1.3 s shot is that thing) · object carried across cuts · dialogue cut at
each speaker change · a recap line that skips time · time cards and day pairs (*"Good night"* ->
the door at dawn) · a hand in the lens · a whip · wide, wide, face at each chapter turn · implied
action (plan line -> wide -> after line; the swim is never shown). About half the cuts land
mid-sentence so the voice stitches the clips. Hook: a face and a stakes line in 2 s. For a long
vlog, a 6-8 s flash-forward, then a small *"3 days earlier"*.

**Photo reels:** people first, sharp portraits looking into the lens, elders, a person with an
animal. No animal-only or object-only shots.

---

## 4. YouTube long form

His references: Reuben Schmitz "Free World Trip" (15 episodes, the backbone), Kerr Rawden's
"£0.01" (31). **Quality bars he named: `Dd10WEzuHqY`, `DIEfg1DzwXS`.** Ep1's pace reference:
`N-ZenLrInoc`: *"Do not copy it. Use it to understand the feeling."*

**Three things are REQUIRED** (his notes on Ep1 v4, which he did not like): a cinematic grade,
motion graphics, and enough real shots.

**Ep1 opens on his FACE in the desert** with a present-tense hook, then the map:
*"Yo, I'm in the middle of the desert, I've got no plan, no money ... wait, wait, wait, let me
tell you how I made it here."* He also described a Sony shot of him with his thumb out, with an
arrow pointing at him. Then: *"You should be using your own creative brain ... smarter than them."*

| measure | target |
|---|---|
| cuts/min, body | 15-23 |
| cuts/min, first 60 s | 25-50 |
| median shot | 1.5-2.5 s in VO, 3-8 s in conversations |
| mix | on camera 45% · VO over B-roll 25% · VO graphics ≤5% · natural + music 25% |
| VO <-> on-camera switches | 6-8 per minute; never over 20 s of VO without a face or natural sound |
| VO sentence | 10-14 words, alternating with a 3-6 word punch |
| VO speed | 2.6-3.0 words/s, a 0.5-1 s breath between beats |
| re-hook | something new every 45-75 s, a mini-arc every 2-5 min |
| music | steady under the voice, drops out for asks and confrontations, 0.5-1 s of silence before a reveal |
| captions | sentence subtitles, lower third |
| loudness | -14 LUFS, true peak ≤ -1 dBTP |
| delivery | 16:9, 1080p or better |

**VO carries:** recap, goal, time jumps, location, stakes, repeated-attempt montages, inner
feeling, the thesis, the close. **On camera carries:** every ask, reaction, decision, goodbye, the
low point. A VO line never describes what the picture already shows. The VO may undercut the
on-camera line: *"Let's go dude."* -> VO *"But it wasn't that simple."*

**Episode shape** (% of runtime, scales from 8 to 30 min):

| % | block |
|---|---|
| 0-1.5 | cold open, the best live moment, real audio only |
| 1.5-2 | series sting + HUD card |
| 2-3.5 | "last time" in 10-20 s: mission line, one sentence back, one measurable goal, a turn line |
| 3.5-4 | map, ≤3 s, only if geography matters |
| 4-15 | "but first" / arrival; plant the question the ending answers |
| 15-33 | the ask: walk in, pitch, no. A counter; montage the repeats in VO |
| 33-55 | the stranger, the chapter's heart: the yes, then the chain reaction |
| 55-80 | escalation; low point at 65-80%, a raw selfie, music out |
| 80-92 | payoff, stated with the number |
| 92-98 | reflective close: thank the stranger by name, one belief out loud |
| 98-100 | set up the next: *"CUT TO BLACK. NEXT EPISODE: INDIA"*. No "follow for more" |

**Devices:** HUD `DAY 41 · $ SPENT: 0 · COUNTRY 7 · TBILISI`, held ≤2 s; trade card GAVE -> GOT; name
tags for every stranger; a no's counter; maps that *"take seconds"*. Graphics colour code: red =
problem, green = win or money, blue = idea, yellow = the key word.

**Motion, his words:** *"animate everything"*, *"Remotion is the best way to edit"*, paper-cut
animation is fine, no Polaroids. When a line names something, show it: *"my backpack, my
skateboard, my camera"* needs that shot or a motion graphic. Name the school and show the school.
*"I want to travel the world"* gets fast cuts, not an old family photo. **VFX stay occasional
accents on a clean real-footage base** (Oct 23), and graphics show only the spoken words.

**Vertical clips in a horizontal film.** First look for a horizontal source: *"you should be using
the Sony clips or the GoPro vlog"* (Oct 24, 10:23 PM, overrides his earlier "make them
horizontal"). Only when the moment exists nowhere else: 4K vertical -> crop or face-tracked crop;
720p to-camera -> blur fill. AI outpainting invented a third person and failed. Tab's Luma video
reframe held up, on a handful of hero shots only.

**Missing shots.** AI is allowed only if it does not look AI, prompted as Sony A7 footage matching
the real clips, never a real person's face. No stock.

**Packaging, Tab's reading of the audits, not his rules:** `[Stake] | Traveling the World With No
Money Ep N`, a stake in every title; thumbnails with face (concern, not a smile), one prop, 0-3
words, a cardboard sign as the native prop; a stranger's quoted line beats everything. Weekly.

**Episode briefs:** Ep1 and Ep2 are written beat by beat with his exact VO in
`assets/references/sidequester-kit/sources/longform/tal_framework_doc.md`, and the clip-by-clip
paper edit is `pdf-text/00002574-Ep1_Edit_Plan_v2.txt`. Follow them.

**Shorts from each episode.** Mark 3-5 passages that work cold while building the long. Start on
that line, cut everything before it, condense by deleting, never reordering, to 55-65% of the
source. End on a high, before the long's payoff. No "watch the full video" card. Structure: *HOOK ->
PROBLEM -> ACTION -> UNEXPECTED TURN -> PAYOFF*. Test: *"Can this story stand alone in 20-60 seconds?"*
*"Do not make the team go through Turkey twice."*

---

## 5. Where this overrides the street standard

THE STANDARD in SKILL.md was written for his street videos. On travel videos these win, because
they are newer and more specific:

| topic | street standard | travel |
|---|---|---|
| **grade** | none | **Long form: cinematic grade required. A recreation: match that reference's grade, per clip** (Oct 25, 9:26 AM voice note: *"That's what really makes the video really cinematic"*). A vlog or talking clip: natural. Never one look for everything |
| **music** | none | Cinematic and caption reels are built on it and it plays to the last frame. VO reels run a steady bed. **Talking videos: none unless he asks.** Use the reference's song or the track he names; flag commercial tracks |
| **captions** | white caps, 1-3 words, lower-middle | Copy the reference on a recreation. VO: 1-2 words, key word big with its picture. Long form: sentence subtitles. **Always:** only what is spoken, never over a face, one text layer at a time (hide captions under kinetic words) |
| **footage quality** | handheld is presence | *"Always use steady shots ... always use not shaky footage."* Sharp, stable, well exposed. No exceptions in reels; handheld stays only for raw vlog moments |
| **title box** | white box above the head | Only when the reference has one |

**Unchanged:** never cut anyone off · every promise paid on screen · no shot used twice · no denoise
or EQ on dialogue · -14 LUFS · preview in chat before Frame.io.

**HDR, the mistake he caught three times** (*"the color on this video is bad ... you downloaded the
HDR version"*). `ffprobe` every iPhone clip; `arib-std-b67` or `smpte2084` means HDR. Tone-map to
SDR BEFORE measuring or grading, and look at a still:
`zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p`

**Never turn a vertical clip into a horizontal one, or the reverse, unless he asks.**

**Grade matching.** Measure the reference and our cut on the same grid, fit per clip, re-measure:
```bash
python system/tools/sidequester/grade_match.py --target desert_orange_storm --src clip.mp4 --strength 0.5
```
Presets live in the kit's `scripts/reflib/presets.json` (desert, green, snow, mountain, city).
`DMArsvVxOgm` is his grade model, `DcymL3TKSyQ` the Western Sahara one.

---

## 6. Tools

| job | tool |
|---|---|
| find footage | `footage_search.py`, then look |
| pull only what is used | `node system/scripts/frameio-discover.mjs`, `fetch-hq.mjs`. Project **THE SIDE QUESTER** (login confirmed here). Not yet run on this project |
| transcribe | `frameio-transcribe.mjs --words` |
| recreate a reference, word-locked captions and pop-ups | **Hypit**, local path only: `node skills/toolbox/hypit/bin/hypit.mjs`. See `REPOS.md`. ~6 min per 14 s. **It replaces outside reel-cloning services; never its paid generation** |
| motion: HUD, trade card, counters, cards, maps | Remotion (`system/src/`, `system/src/maps/RouteMap.tsx`), HyperFrames (local skills) |
| one effect at a number or punchline | `system/scripts/effect.mjs`, at most one per video |
| his voice | ElevenLabs, his professional voice |
| cut check | `selfreview.mjs`, `min-shot.mjs`, `toolbox/ai-video-editor-cooked/` |
| schedule | Metricool, brand The Side Quester |

HeyGen's connector cannot compose or render from Claude Code; only its read tools work here. Use
the local HyperFrames skills.

**Not built yet (gaps, none of them guessed around):** the series HUD template · the trade card
template · cutting to the music beat automatically · a match-cut finder. Build the HUD and the
trade card once and reuse them every episode.

**Several repos Tab used are not installed here,** listed in `REPOS.md`.

---

## 7. Before he sees it

His rule: *"Before you give it a video, you make sure it's perfect."*

- [ ] A frame every 2 s and at every cut, looked at full size
- [ ] Captions re-transcribed from the FINAL audio and diffed word for word
- [ ] Mute test: captions alone describe every shot
- [ ] No text over a face, no two text layers at once
- [ ] No shot under 1.2 s, no shot used twice (see below)
- [ ] Music reaches the last frame (audio stream duration)
- [ ] No shaky, blurry or dark shot; no identifiable kids in close shots unless he cleared the clip
- [ ] HDR tone-mapped; a still checked by eye
- [ ] -14 LUFS, true peak ≤ -1 dBTP, measured on the file sent
- [ ] Read the transcript of the render top to bottom as a stranger: does each line follow?

**Never in a travel video:** anything political · anything in `PRIVATE-RULES.md` · a shot picked
without looking at it · music he did not name · a recap Tal has to sit through · an invented fact.

---

## 8. Still open — ask, do not guess

- The 1.2 s floor against the flicker formats (risk-over-regret, beat flicker, how-was-X, photo
  grids), which are built on 0.2-0.6 s cuts. Never agreed. Default: keep the 1.2 s floor.
- Regular episode length: closer to 12-15 min or 20-30 min. Ep1 is settled at 5-7, max 8.
- Frame.io destination for approved travel finals.
- The cleared list of risky stories (in `PRIVATE-RULES.md`).
- Sponsor beats, thumbnail look, posting day.
