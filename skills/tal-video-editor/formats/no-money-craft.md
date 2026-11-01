# TRAVEL CRAFT — what Tab knew that the other files don't

Part of `no-money-travel.md`. The single place for what came out of the full read of Tab's kit and reference library on 2026-11-01. Tal, on that work: *"this u can implement to my video editing here."*

It adds to the other formats and does not repeat them: the menu is `no-money-templates.md`, timings already written are in `no-money-recipes.md`, filters and text sizes in `no-money-grades.md`, say-it-see-it in `no-money-voiceover.md`, Ep1 and India in `no-money-episodes.md`.

**How to read it.** Numbers are Tab's, read from his library and master text. They were not re-measured on the reels here. Template numbers are the master's (T1-T108); see the note at the end of the menu. Reel ids are Instagram shortcodes; the full entry for each comes from `reel_brief.py <shortcode>` (LESSONS 172). Slots in square brackets are for Tal's own words. Every line, count and price needs his real source (`no-money-travel.md` section 1). No travel cut has been approved yet, so everything here is taught, not proven.

---

## 1. Which rule wins

Decided. Where an older file or a Tab document says otherwise, this table stands.

| topic | rule |
|---|---|
| **order of authority** | Tal's own words beat everything from Tab. Newer beats older. Short reels follow the handbook; long form follows `no-money-travel.md` section 4 |
| **shot floor** | On a recreation, copy the reference's timing, including shots under 1.2 s, and say so when sending it. 60% of measured references are under 1.2 s. Outside a recreation the 1.2 s floor holds. No flash frames in either case |
| **music under VO** | On a recreation, match the reference's measured depth. Otherwise steady about 12 dB under |
| **colour** | Match the reference's grade on a recreation (Tal, Oct 25, 9:26 AM); natural otherwise; long form per section 4. The toolkit's "never add colour" is older |
| **orientation** | Never crop horizontal to vertical or the reverse unless he asks. This beats Refs 25d (centre-crop) and rotating landscape footage to fill the frame |
| **rejections** | Rejections stay on screen in travel videos. "Everyone happy" is for his street videos |
| **kids** | No identifiable kids' faces in close shots in videos. Blur only the people he names. Ask him about specific clips. Tab's clips marked (kids) need his yes |
| **political references** | Structure only, never content |
| **third-party assets** | The Borat clip, meme faces, viral photos, news headlines and film monologues are studied, not reused. Lyric captions: ask him first |
| **wording** | VO wording "no money" and country counts follow the honest-premise rule (`no-money-recipes.md` section 8). No country count until he confirms |
| **text layers** | One at a time and never over a face, unless a recreation's reference clearly does otherwise and he has approved that reel |
| **graphics look** | Polaroids: no. Paper-cut motion graphics: yes |

**What those mean in practice:**

- "60%" is 67 of 111 entries in the short-vlog and caption half of the library, and 60 of 89 in the cinematic and people half. Slowing a flicker reel to obey the floor is the wrong fix. When a recreation goes under 1.2 s, the send line says so in a few words.
- A 2-frame stutter or a 4-frame flash cut in a recreated burst is a short shot, not a flash frame. A flash frame is a stray remnant nobody chose (section 5, "How flashes sneak in"). That line is our reading of his rule. The light-leak in the "Bro said" photo reel is the one open case: see section 8.
- Measured depth on references runs about 3-10 dB under the voice. 12 is the default only when there is no reference to match.
- Sony clips stored sideways are a different thing from turning a shot: putting a clip the right way up is not a change of orientation. Look at a decoded frame. Tab skipped those Mongolia ranges; `SKILL.md` says rotate, never crop.
- Text on a caption reel is the content, so "only what is spoken" in the main file applies to VO and talk, not to reels whose text IS the reel.

---

## 2. Clip rules per format

**Tal, Oct 25, 7:08 PM:** *"make sure you use right clips, like if the reference ... shows someone in the video at the beginning and then ... a nature video, a video of me."* Then: *"you gotta listen to everything first."* Most of a recreate's quality is here. LESSONS 171 is what happens without it.

### 2.1 Reading a clip pick

| mark | means |
|---|---|
| `[QA ✓]` | measured sharp, stable, well exposed. Still look once |
| `[measured]` | measured, did NOT pass. B-roll only, after a look |
| `[unchecked]` | never examined. Look first |
| `[photo, check by eye]` | a photo, not scored |
| `[camera, V/H/S, 13s]` | V vertical, H horizontal, S spherical raw `.insv`: S needs `insv-reframe.py` first and is preview only |
| `(in focus, locked)` / `★3` | Tab's quality words. No score means look at it, not that it is fine |

- **Ids in the master are 8-character prefixes.** Resolve to the full id and match name AND size before cutting.
- **"Footage fill (suggested from the grade/environment)" lines are auto-generated from the grade preset.** Ignore them. They send cinematic reels to iPhone street clips, which breaks *"Nah it's cinematic."* The hand-written "Tal's footage to fill it" lines are usable.
- **Index descriptions are matches, not looks.** Tab's own lists hold weak picks: a man stretching by a window under "grandpa with the best stories". Treat every id as a candidate, never a pick.
- **Camera tags can be wrong.** An index "drone" clip was tagged GoPro. Check the real source before choosing letterbox or crop.

### 2.2 Rules for every format

- Check orientation from a decoded frame. `ffprobe` reports coded size. Sideways and upside-down clips both exist, sometimes in one folder.
- Punch in or crop only on 4K sources. Frame.io Greece iPhone copies are 720p, and some are 2 s long, which fills one 1.3 s beat.
- Finished edits carry burned-in text. Use raw clips. The same take often exists as a captioned export (`VEED Captions Export`, `copy_`, `export_`): use the raw iPhone file. If the only copy of a line is an edited letterboxed file, take the audio from it and look for the nearest raw clip in time for the picture (Ep1's car ride, `C0075`, sits right after one such line).
- Never stack two caption styles. If a clip has burned captions, use it audio-only or cover them with our band.
- Before a clip carries a claim, confirm WHO and WHICH DAY from the capture date. *"Check it's from that day."*
- Never put a place name on a card from an index guess. Tal confirms it.
- If the footage cannot prove a specific claim, keep the words over Tal on camera, never a similar-looking clip. When no B-roll shows the thing named, stay on him, synced, with place cards in the top zone. Tal, on a handlebar POV under a list of countries: *"it's a scooter."*
- Check which cameras were rolling. A dark glasses POV was used once when a Sony take of the same moment existed. A second angle of the same action is still a repeat.
- Read a B-roll candidate's transcript before laying VO on it: it may hold a usable live line. A selfie goes under VO only if he is silent in those seconds.
- Reuse: the same shot may come back across shorts, but not in the same week. When a hero clip repeats, use a different moment of it.

**What each camera is for (his framework):** GoPro vlog = POV, action, walking and talking, boats, swimming, motorbikes, roads, hikes, hitchhiking, transport, chaos. Sony = cinematic and long-form B-roll. Drone = country reveals, scale, openers, geographic transitions, map sequences, cinematic shorts. *"Do not cover every story with drone footage. If I'm talking about being rejected from hotels, show the hotels/rejections."* 360 = horses, ATVs, trains, motorbikes, boats, cars, streets, hikes, skateboarding, POV.

**Source gaps:** Mauritania's Frame.io folders hold no native vertical iPhone clips, so a vertical Mauritania reel needs letterboxed Sony or GoPro, or new uploads. Mongolia has 64 native vertical DJI clips (2160x3840): use them full-frame instead of cropping Sony. Mongolia's Sony is SDR, 29.97 fps, no tone-map; clips numbered 45-133 in Tab's sheets and the first 15 frames of its photo folder are Japan, not Mongolia. No hand-launch clip in Frame.io: iCloud `IMG_0649`/`IMG_0650`, and Tal thinks Georgia has one.

### 2.3 Per format

**Family-voice line (T21, T22, T23).** Tal: "Like this but grandpa", "My son\*\*\*", "Future wife \*\*".
- Every shot looks slightly dangerous or absurd at a glance: top of a train, out of a jeep, cliff edge, stranger's motorbike at night, bungee platform, sandstorm.
- Tal in frame, grinning or screaming, selfie or POV. Goggles, dust masks, headlamps help. Mix day and night. No calm landscapes.
- Grandpa reel: selfie hold 0-4.3 s next to something wild, he turns to look; then 16 anecdote shots at 0.6-1.2 s, locals and animals over landscapes, him in most, a calm closer.
- Mom-said two-part: part 1 is Tal ALONE walking to a static chest-height camera, deadpan, 3-5 s, epic quiet background, daylight. Part 2 is his own loud moment: a crowd, him in the middle of the energy, happy faces. Night or firelight is fine. *"We could literally re-create this"* was said of a reel whose part 2 is a film clip: his footage replaces it.
- Son variant: 3 "society" lines of about 1 s, a 2 s black card, the payoff held. Strip profanity. Each line needs his yes.

**Question to montage (T15, T16, T17, T30, T33).** Tal: *"IDENTIFY WHICH CLIPS."*
- Every shot answers the question visibly with the sound off: thumb out, a vehicle stopping, him inside a stranger's car, a stranger's face laughing, a free meal or chai, a free bed.
- Mix static wides (him small at the roadside) with close selfies inside vehicles, about 50/50. No talking-head shots. Daylight first; one night shot at most, near the end.
- Order tells the day: sign, thumb out, packs on as a car passes, truck pulling over (long lens), inside the cab, back-seat selfie, payoff, night selfie, ridge silhouette.
- Horizontal GoPro suits the letterbox. The Pakistan GoPro hitch arc of Aug 2-3 2025 is the strongest set.

**"The people" (T60).** Tal: *"We can do this for each country... use shots of me interacting with people."* On `DczzMuejt7b`: *"simple and easy, but you have to use the clips that work, with kids, with me smiling and laughing."* The kids rule in section 1 still applies, so those clips need his yes.
- EVERY post-flip shot has Tal AND at least one local, both smiling or laughing, touching distance: a hug, shoulders, a dance, a high-five, tea handed over. A clip with no person in it is wrong even if beautiful.
- Selfie or friend-filmed. Warm daylight. Movement inside the shot.
- The caption flip IS the turn. It lands once, at the cut where the people start. Never re-flip.
- Portrait films and group-hug one-takes use adults.
- `the journey:` then `the people:` (`DeDgXK5zDJD`): risky-journey shots first (train, roads, canoe), flip at 6.6 s, then warm people.

**Beat-grid postcard (T52).** Every shot a DIFFERENT postcard: wide, static or very slow, natural punchy colour, level horizon. A tiny human in about half. Mix 1 animal, 1 dwelling, 1 water, 1 sky or sunset, 1 POV detail (feet, tent door, a window). No talking, no selfies, except the side-quest variant, which is all 0.5x selfies. Same country per reel. Golden hour beats midday. Batchable per country.

**List of lives (T29, T27, T19).** Tal: *"Template no voice."*
- ONE distinct activity per shot, never repeated. Tal in frame doing something physical: jumping, riding, climbing, eating something wild, on top of a vehicle. Motion inside the shot is mandatory.
- 1-2 night shots with flash or firelight.
- Match the line: a cheap-travel line uses only cheap-transport selfies (bus, truck bed, train door, ferry floor). A "no service" line uses only remote places with no people.
- Plan A/B: one steady ordinary selfie walk, daylight, looking at the lens; a city or office-like street makes the joke. Plan B one extreme activity per beat, 9 in all, each readable in 0.6 s, never two of a kind.

**Reality checklist (T20).** Each category needs 3-5 instantly readable proofs. Bed: yurt floor, car seat, tent, a stranger's sofa. Rides: truck bed, motorbike pillion, back of a van, cargo train. Food: chai with drivers, a family meal on the floor. Payment: Tal filming an owner or showing his phone. Selfies are fine; real-life grit is the point. Avoid beauty shots.

**Lyric-sync (T61).** A literal match first: a viewer must get the word in under 1 s. Tal in about half; the rest is the element (water, sky, fire). Clean, bright, steady, because the text is small. Lyric captions: ask him first (section 1).

**Day-X and Part N (T5, T7, T12, T75).** A complete mini-arc is required: ask, wait, ride, gift or meal, goodbye. His real 1-3 s bites are allowed. Drivers' and hosts' faces are welcome; they are the story. Night is fine for tension. Present tense Day-N belongs only inside the canonical chronology; archive posts use T12 past tense or a throwback caption.

**One caption, one wow clip (T62, T56, T53).** ONE continuous take with a reveal or peak inside it, physically real and rare, stable, best light. T53 needs a 12 s action take. The flip-reveal needs one clean selfie, flip, walk, reveal take: if none exists, never substitute cuts. Tal, Oct 25, 9:59 AM: *"So videos can just be like this with music ... Just like me doing something crazy."* Bungee: `b14.mp4` is the operator's cut with a logo; his jump is the continuous follow shot at about 2:10-2:30. The GoPro and 360 versions spin in the fall.

**Map zoom (T63, T47).** Drone or Sony only, wide, saturated, a different landform each shot. At most 1 human shot, tiny. Golden hour or blue-sky noon. No selfies. Exception: the 99.99% version cuts on the zoom's landing to Tal or a local in the most otherworldly spot, for scale, then people first. Text lives on the zoom only and is gone at the first real shot. Zoom length differs per reference, 2.7-7.3 s: read the entry. A rarity number like 99.99% is a claim, so it goes to him first, and the post caption says why so few go.

**Photo reels (T59, T67).** Tal, Oct 25, 10:19 AM: *"This is so good."* 10:17 AM: *"Picture number two is by far the best."*
- Pick 16 PORTRAIT photos. Landscapes only if a 9:16 slice is itself a strong frame. Sharp, good light, no near-duplicates, kids unidentifiable.
- His favourite is the rider with the rearing horse, `DSC03361`. Dramatic action with a person ranks top. Save it for last when a reel promises *(the last one is wild)*.
- Every version needs a clip of Tal raising his camera, and that clip is a shoot requirement: search the country's iPhone and GoPro folders before promising it. `DS7jJKjCmqu` needs a BTS clip per photo; `DdrPKORsHKN` needs a clip of someone filming; Tab found none.
- The 4.9 s selfie intro comes from that country's iCloud photos. The caption band sits below faces.

**Welcome to (T44).** Per reference: drone only, or opener of Tal. Measured openers: Tal jumping on a road (`C0038`), arms open in front of something huge, a slow-motion selfie shout (`DI_WG7mPNlf`). Then drone vistas, dancers, dusk, canyon, switchback road, locals, a portrait. `DcOvaq7xpCW` is all vertical drone, with iPhone only for what the drone doesn't have. Ending: copy the reference; `Dbs9BagMg7c` ends on a person, our recipe's "close on the widest shot" is one option, not a rule. Audio trick (`Db9dK0AxRXC`): real locals saying the welcome, repeated as a vocal hook on the beat.

**Cinematic (T65, T66, T70, T72, T31).**
- Gate: only a country with 10+ QA clips. Rhythm: wide, medium, detail; one human moment every 4-5 shots; end on a held wide.
- Creator in nearly every shot but small in frame. People close to an ultra-wide lens or tiny for scale. Hero local portrait at 0 s and again at the middle, the icon last (`Dd5SKpto6en`). Non-hero shots never over 3 s.
- Reveal: an approach that goes narrow and dark first and wide and bright last: gate, canyon, alley, wadi, forest path, ger-camp approach. Or a low drone already moving toward a tiny person. Never a take-off or hover. Lock the horizon. Trim so frame 1 already shows the light at the end; the last 2-3 s hold the full reveal. Tab's line: pick the clip for the reveal, not the person.
- Best reveal type: a drone that starts tight and RISES: ger roof, through trees, cliff ruins. Check the 12 s from the roof to the reveal by eye.
- Anchor on one person: Tal, Oct 25, 7:08 PM: *"the mongolia guy speaking about a story, you can make the cinematic, the guy, the eagle hunter."* The hunter's hands, the eagle, the horse; steppe as cutaway. Use one hero set for T97 or T102, never both.
- Flicker: 32-40 clips, as many countries as possible, ONE country per flash, wide, bright, one subject, already moving, no talking faces, 5 frames at the PEAK of the action. For golden-hour bursts, golden-hour clips only, so 60 shots read as one.

---

## 3. Recipes that were only a name

The menu lists these; these are their methods. Where the master and the library differ, the measured number is used.

### 3.1 Caption hooks

| reel | method |
|---|---|
| **How was X** (T42, `DeygZcFAgvj`) | Shot A about 3 s, locked off, no cuts, no zoom. He says nothing and shuffles a step, lost for words. Song from frame 1. Text on Shot A only, dead centre. Hard cut on a beat at about 3.1 s with NO whoosh or hit. 20-25 clips of about 0.42 s, the same hero first and last. Shoot Shot A anywhere: hostel door, street, arrival. One per country. `Ddbx7LWR4X6`: deadpan mirror hold 3.3 s, about 34 clips of 8 frames, last 0.5 s the best with him in it. `DU2Yp9WkUvd`: *we spent 1 month in [COUNTRY] / here is how it was..*, 3 s opener, 17 cuts of 0.6-1.2 s |
| **So why'd you go** (T33, `DeR1aaIBcQY`) | Shot A 6-7 s, him looking out, ending on a fast head turn: that is the cut point. Text at about 12%, Shot A only. 35-40 clips of 4-5 frames, EVERY ONE a different country, fastest in the middle, slightly longer on the last 3. People first. The post caption answers |
| **Not X, not Y** (T57, `DalMYk-sgV5`) | 4 shots of exactly 1.2 s, each LOOKS like the famous place. White serif with an ellipsis at about 55%, hard swaps. Reveal on the 5th cut, about 40% of runtime, held over 4-5 shots, at about 43% with emoji and flag. Last shot 1.3 s. 12.4 s |
| **One day** (T24, `De0QHQBys0o`) | Shot 1 2-2.5 s, the "before" moment. The same line flips to `one day:` at 2.3 s and stays. Every shot in a centred box, no zoom-crop. 10-12 shots of 1.0-1.2 s, 2 s on the strongest. **The biggest moment goes LAST**, not first and last |
| **Is X worth it** (T41, `Dd4M4RcAGv8`) | ONE reveal shot. Start tight with no context, tilt or rise to the wide at 2.2-3.9 s, hold. Text becomes `Bro...` at the reveal, same place. 10-14 s, whites rolled to about 0.75 |
| **Cheeky answer** (`DSnkLpnDETp`) | Selfie question 0-2.6 s, a joke answer held over proof shots at median 0.5 s, 9.5 s. Tab's draft: a grandma in every country, the hosts who fed him |
| **Which one swap** (`DbVTwE-C5M7`) | Hook about 3 s, quote at about 30%. Swap to `which one?` the instant the beat lands (2.97 s). One shot per beat, about 0.55 s, 12 shots |
| **Watch this proof** (T18, `DTKpTv7CJ-_`) | Shot 1 0-4.6 s static wide, ordinary, Tal small, post push 100 to 108%. Shot 2 to 9.2 s on the downbeat, first proof, hard swap. Shot 3 to 17 s, one long proof hold. 0.2 s black. Text 4%, 22% from top, same spot. Proof reads in one glance, sound off; real shake is fine here. Long form: 25-30 s with a small label per shot |
| **iMessage hook** (T78, `DdRl-x5uISV`) | Black, two bubbles, 0-3.9 s, then 4 shots of 0.7-3 s, 9.9 s. `DebNXi_SVEa`: bubbles, `Bro...`, 18 beat cuts at 0.57 s letterboxed, all from behind |
| **What if we just left** (T73, `DIktpoWxhBI`) | 0-2.6 s one real BEFORE photo, text word by word beside the face. 2.6-3.3 s black card, one word, white serif. 3.3-15.2 s twelve shots of about 1 s on the beat |
| **Paragraph in the sky** (`DZKoK9GsWvO`, `DSyA9sdkpd_`) | 10.4 s and 13.7 s, no cuts, 4-8 small lines. **Length = reading time plus a beat.** One slow continuous move |
| **Forget X** (T46, `DcMkATnuEpT`) | One line rejecting the obvious, 20-38% in the sky. 10-11 s, 6-9 shots of 1-2 s, all ONE activity, open in motion. `De6hisBxyFX`: 3.5 s setup, drop at 3.47 s, 14 cuts of 0.4 s |
| **Hot take** (T84, `De38NJMNwuD`) | Line over a 4.7 s hold, 8 cuts of 1.0 s. Marked as opinion, not fact |
| **One-liner over one shot** (`DVjGLQRAAhr`, `DeGdQ2DClME`, `DH6ctb0TyzD`) | His "Recreate" and "Edit like this" reels are slow. 6.5 s truck-bed shot, someone else filming. 7.1 s slow-motion shot, 3 serif lines. 16.2 s, 10 shots of 1.3-2.5 s on the song's phrases |
| **Teaser** (`DeOBfsHhPAJ`, Tal: "Nice to copy") | 8.1 s, 4:3. Drone flash, feet on rocks, hero on a rock, crowd at the falls, drone whip, eye close-up, tiny figure arms out, 2 s drone hold. 12 cuts of about 0.5 s |
| **Next station** (`DeGj4mdOOWG`) | Small typed premise, the wrong name slams in big, corrected. Tal: *"add to the cinematic standard."* Tab's numbered rules cited there could not be matched; what survives is in sections 2 and 5 |
| **Held country word** (`DdtsA1QpT8B`) | One small serif word, the country, whole reel. 12 shots, median 0.8 s |

### 3.2 Montages with structure

| reel | method |
|---|---|
| **Category bursts** (T58, `Ck6UrZPomcr`) | Hook 3 s, sceptic question at about 15%. 5 rounds: 8-10 flashes of 0.2-0.3 s on one theme, then ONE held shot of 0.8-1 s with the label building on two drum hits, noun, then noun and noun. Order: nature, weather, water or desert, trails or people, history or wildlife. Best shot last. 21 s, 76 cuts. The reel is -15.9 LUFS: mix to -14. English label sets for Mongolia and Pakistan are in Refs Oct25b |
| **Look to reveal** (T66, `DZlPAzcNAMO`) | Shot A 3 s, selfie shading his eyes. Shot B 10-12 s, one move from close (ridge, road) to the big view. Whip in the direction he looks. No text. Lift at about 3 s. One-drone form: 9.8-11.2 s, a person or vehicle for scale, a 19 s source trimmed to 10 |
| **Stories list** (`DSiFsnUCApm`) | Letterbox, caption in the top band swaps per shot, a numbered list of what viewers ask him, about 1 s each, ends on a joke. 8.4 s. Rewrite the lines: the reference swears |
| **Boys trip** (T69, `DcdGOPks-l0`) | Caption held at 25%. 17 shots, median 0.8 s, friends alternating with landscapes, end on the group. Needs a real trip with friends |
| **Accelerating film** (`DJ3X0hVKElw`, `De7piVez8JJ`) | 17 shots, 8.9 s, 1.08 down to 0.3 s: *the ramp-up is the whole edit*. Title form: *The faces of [COUNTRY]*, 5:4, one face per beat (`DeGO7r4h6gk`) |
| **Flicker from stills** (T32) | Stills from drone clips are a legitimate source. `trim=start=S:duration=0.1667` at the peak, one shared `eq=contrast=1.03`, end on a frame matching the first, music in over 0.1 s. A fixed grid over a calm track on purpose: **this family ignores the beat** |
| **Labelled list** (T26, `DcrJQjdOG7e`) | ONE label per shot at 27-30%, on and off WITH the shot. 1.0-1.2 s per place, 0.5-1.6 s per memory. Empty sky at top. Memory form ends `Part 2?` |
| **Highlight dump** (T25) | 2.7 s selfie tilting down from the sky, two lines at 72%, 6-8 heroes of 0.83 s, one per country. That selfie doesn't exist yet: shoot it |
| **Country listicle** (T55) | A: a 1 s black card per item, then 2-3 drone shots. B: *Tourist visa for [COUNTRY] is [N days]*, region label typing on over 2-4 shots of 0.6-0.8 s. Re-check visa claims on posting day |
| **Sounds like** (T54) | The song IS the content. Every 2 beats (0.97 s) or every beat (0.43 s), never off-grid. 9-14 s. Same postcard opens and closes. Bright iPhone |
| **Maybe you just need** (T51, `DdCPTi9vxVx`) | Hook 0-2.8 s, a 1 s GAP, place in spaced serif from 4.0 s. 1.57 s hero, then a cut EVERY 0.60 s, 12 shots, 7.7 s |
| **World's most** (T45) | ONE caption in the sky at 28%. Wide, walking toward it, the dangerous moment, goggles, sunset on top, small detail, POV feet, selfie. Q&A form: a quoted question 2.7 s, cut to a wide, a two-word answer. Say *one of the last*; a road's name comes from him |
| **T16, T17, T19** | T16: serif question on a calm 3.4 s opener, 13 clips x 0.63 s, 1 s end, no answer text. T17: 3 serif lines 2.9 s, 31 cuts of 0.51 s. T19: selfie walk 0-4.2 s, swap on the drop, 9 shots of 0.6 s |
| **Others** | Time-of-day film: stamp cards the only text, each hour a real shot (`DeTQeHlx-lc`). Metronome with one 2.5 s breath (`C6THYDgKrTo`). T74 stats: one number per shot, every number sourced. T77: title on a white bar, whisper, long proof hold. Letterboxed talking head with serif one-word captions (`DcuHduXyVCD`). Region film (`De32rtrgUDG`): title lists sub-regions over a symmetrical wide |
| **One-take audio** (T62) | A song at full level when nobody speaks; quiet under him when he does. Up to 25 s only if it keeps escalating. `De3onM-pHaC` is 4.5 s |

### 3.3 Photo and BTS

- **Photographer reel (T67).** One engine (`no-money-recipes.md` section 6). Adds: a 1-2 s BTS clip, then 8-15 stills of 0.4-0.8 s. Two-line weight contrast, thin then heavy, at 60-66%, cut on hits with no grid (`DN3GwLF0HKT`). Caption above his head at y 140-200 (`DZEDwbZpKFm`).
- **BTS to reveal (`DY45yYHCjea`).** BTS 4 s, raising the camera at a person, golden hour. Black bold on a white box at the top, plus a small pill *(the last one is wild)* on the BTS only. 6-8 people photos of about 1.8 s, alternating colour and black and white. Most dramatic last.
- **Quote to answer (`Ddizv9wzI1N`).** A held clip under a line people say to him, then 6-10 people photos, the answer caption staying over them.
- **Camera-roll dialogue (`DbBY20lCb3J`).** 5.4 s of him meeting someone, white serif dialogue, then photos every 0.67 s.
- **Carousel (T68).** Whether he wants these is open. Studied from captions only.

### 3.4 Voice and trial

- **Trial reel (T76, `DeyyAyUsedg`).** One 5.2 s vertical golden-hour take, no cuts. One 6-line white serif block at 45-72% over body or sky, never the face, on throughout. Calm trending sound to the last frame. Post as a trial reel.
- **Essay (T8, `DbZWxAVxeP6`, TOP PRIORITY).** Six parts: would-you-rather in 3 s, why the question matters, side A with a punchline, the turn at about 60%, self-reflection, the question back. 250-300 words, about 80 s. Cuts on idea changes (3.1, 47.9, 74.1 s). 10-13 shots of him alone, small, one location, held 4-14 s. Same arms-out shot opens and closes. `green_bright_faded_warm`, LIGHT on Sony.
- **Number-hook series (T7, `DcujXdAt6oI`).** VO on frame 1. `De0HBIIR3Pj` card: big series name with one italic word, `Episode N`, letters flicker in at 1.75-4.7 s over a dusky drive; a walking-selfie promise before it. Day X form: same first sentence every episode, `DAY X / 100` card at 2-5 s, cover a giant outlined number.
- **$0 cost (T1) and cost breakdown (`DdE9EFypqP5`).** Money in line 1, one place per beat, a price row, one quirky detail, a verdict. 35-45 s, ONE map pop. Breakdown: each cost 3-5 shots of 0.8-1.6 s, a screenshot then the thing, a category header, a running tally. State *(they paid me)* when he was paid. Nothing goes under $0 until he confirms how it was paid for.
- **Day 1 diary (T5).** Goal + superlative + *today is day one*, an insider detail, chronological beats, one honest feeling, a stat, *come back for day two*. Phone, about 0.9 s, tiny subtitles, ONE handwritten location title.
- **Day N vlog (T6, `Ddyurypx_0i`).** To the lens 0-3.5 s, title builds word by word. 1.4 s cuts. A sarcastic beat on black smashed by one word. `this is / [PLACE]` over the wide. A map beat, a cost card with a green total. 45-55 s.
- **T92 aphorism.** Tal's own opening: *"Everybody needs to travel the world, not to stay in hotels, to meet the locals."* **T93** adds a **re-hook mid-way**. **T10** one emotional line with a 1 s pause. **T11** 60% Tal on camera, hard cuts on sentence ends. **T105** one locked shot, typewriter text, a 16:9 strip per age. Beat lists for T81, T89, T91, T97, T104 are in the master.
- **Epic trailer (T94, `De6_AnGIZ-4`).** *Welcome to the [superlative]* over him at the vehicle. Route stat on a map. **The music cuts out and a raw sync disaster plays with subtitles.** Thesis as a list of three. Music swells alone. Dry narrator over chaos, 16:9 on blurred 9:16, about 1.9 s cuts. VO bridges, sync carries the peaks.
- **Accidental confession (T95, `DZxwI21uY_N`).** Hook flashed ONE WORD PER SHOT at 0.37 s, each a best moment. Advice first. Mishap, lesson, say-it-see-it list, bookend. Median 0.57 s, 68 s.
- **Mystery guardian (T102, `Dcg23g0Iob3`).** In 91 s: HOOK to 4.2, STAKES 13.9, QUESTION 19.4 on the longest hold, SETUP 33.2, JOURNEY 47.6, HISTORY 56.6, REVEAL 66.9, ASIDE 71.7, TWIST 91.1. His face first appears at 0:22, so the VO becomes a person when the journey starts.
- **Line to camera (T87, `DeqAh_zq5WW`).** ONE sentence, real sync, captions pop word by word above his head. On the last word hard cut to 6-8 huge wides, him tiny. 11.4 s, 9 shots. The line must set up the picture.
- **Contrast diary (T83, `De69-5CoxlT`).** Hook 0-4.5, facts to 12, situation to 17, event to 21 then the ONLY long pause (1.8 s), vulnerability to 33, explainer to 51, observation to 63, reflection to 71, CTA montage at 1.35 s. Doubts at 2.7 w/s, facts at 4.5. It under-performed, so his version is shorter with a text hook.
- **T90** is NOT fast-cut: 17 long takes in 179 s. **T106** freeze + name + hand-drawn arrow: he asked about that arrow, unanswered; it is a p5.brush job. A name tag needs a real name. **T107:** emotional-doubt lines are never written for him.
- **"Imagine" VO (`DcCMgJItFej`).** Only with a real guide. **YouTube cold open (T80):** section 6.

### 3.5 Short vlogs

Tal's "short vlog" label covers a first-person, happy, in-the-moment short, with or without talk. Choose from the reference's hold length, not the word "vlog". His notes: *"Look at the clips it connected. No voiceover"*, *"Look at everything for short form vlog"*. So watch the whole day, not a shortlist.

| type | shape |
|---|---|
| **Reaction to reveal** (`DA1HF7AiVm5`) | one line over an 11 s hold, three reveals of 2.8-3 s. Needs him reacting, a wide with him small, a drone shot |
| **Talk then music** (`DdBaZclOlbq`) | 11.5 s to camera, music-only montage from 14.7 s, 26.7 s |
| **Joy montage** (`C7o8OY9pXuE`) | to camera 0-5.1 s letterboxed, then 0.7-0.8 s joy shots, last 4.1 s. It is T64's lead, so talk is not a requirement |
| **Question-hook vlog** (`DeT-y_tPb4j`) | *I came to [country] with one question*, 3-5 s. 4-6 proof shots of 1-2 s. Back to camera. Pattern break: eye close-up or *hold on, let me zoom in*. Reveal as a forced-perspective gag, then a reaction. Close moving, a forward line |
| **Talking vlog** (`DXr7nZfkT5z`, structure only) | B-roll of the claim by 0.8 s, jump cuts across 3 spots, 3 "because" beats, one unbroken close |
| **Letter home** (T99) | small top text, current word yellow, hand-in-lens high-five as the day change |
| **Teaser, then earlier** (T100) | 0-2 s face + line, to 8.7 s the talk with 5-6 best shots at 0.6 s, a small `3 days earlier`, then one day-line per stop with 2-4 shots. 123.4 s, 87 cuts |
| **Stakes-line** (T101) | a deadline aloud, one small mission, a cut at every speaker change, price lines as punchlines, subtitles translate locals |
| **Food vlog** (`DeveAsPu6Uz`) | about 90 jump cuts of 1.3 s, each dish = name + one-word verdict, live vendor exchanges kept |
| **Join in** (`DRfEU1KjE6s`) | POV box in the top 12%, a GoPro on the ground, static wide, median 9.3 s, coloured word pops for greetings only |
| **"Bro do NOT steal my itinerary"** (`DR40v54EUDg`, `DR2UbhpkfA9`) | 16:9, serif title in the top band, one-word karaoke in the bottom band. 237 wpm. Each spoken day marker cues a new place. Hyper twin: 218 shots, 0.8 s, a pool-ball number per day. Build from the spoken markers. Two text layers on purpose (section 1) |
| **Countdowns** | `DTMEYtRkh89`: VO counts down, the line highlighted on his own scrolling screen recording, last 12 s music-only. `DS8l9PxD6nZ`: a paper list in his hands, 4-6 shots per item. Never reuse its title |

---

## 4. Storyline patterns and hook formulas

From 47 reels and 12 long-form videos. Beats below for a 30-90 s reel. Tal's rule on all of them, Oct 25: tell it like it is happening right now. Present tense, "I" to camera. Rewinds stay in the present too.

| # | pattern | beats | retention devices | best refs |
|---|---|---|---|---|
| 1 | **Flash-forward, how did I get here, rewind** | payoff 0-3 s with a line that makes no sense yet; the question 3-6 s on a freeze or map zoom; rewind 6-40 s with time stamps; problems stack 40-70 s with one false ending; back to the opening shot, one sincere line | open loop in 5 s, *little did I know*, false ending, stamps, escalating list, callback | `DcdXddhRRSo`, `joIpzpL6Dgw` |
| 2 | **Number + stakes, episodes, reflection** | number and stake in one line 0-5 s; fear aloud 5-10 s; 3-5 episodes, one cut per episode, running clock; honest reflection over a slow wide; next-episode hook | day counter, ticking clock, stated fear, running gag, *first test passed* | `DQTPvemk2Oc`, `Dd7b6_-PB4L`, `DbtFl21R6yI` |
| 3 | **Problem, helpers, win** | goal + problem in one breath; rules; stranger by stranger: intro beat, one ask, one yes, one cut; recap list + question | rejections before each yes, a named helper, a win counter, recap list, doubters on camera | `5cNrCPKlEKY`, `DNvfsi92MPK`, `Deyn3-RsIej` |
| 4 | **Question, reframe, confession, question back** | impossible question stacked on screen; why it matters; one side, then *but there's the other side*; confession; hand it back, return to the opening shot | unanswered line 1, the But reversal, confession, comment-driving close | `DbZWxAVxeP6`, `DdkL63RujdR`, `De2Gk5gPKNi` |
| 5 | **You-POV list** | *so apparently* / *imagine*, viewer as main character; one clause = one shot = one place card; setbacks flip to wins; deadpan refrains; callback last line | about 290 wpm, refrains (*so naturally*, *somehow*), *oh wait* false endings | `DdB95uZuBL_`, `DcG24WcRMqn` |
| 6 | **Hot take, proof list** | bold claim or withheld number; instant proof shot; 3-5 proofs signposted, one hard fact each; question or punchline CTA | withheld number, myth to bust, countdown to #1, best item last | `DdE9EFypqP5`, `DS8l9PxD6nZ`, `84WIaK3bl_s` |
| 7 | **Come-with-me day log** | clear goal 0-3 s; big yellow stamps or distance countdowns open each beat; try everything on camera; arrival, tease next | stamps as a progress bar, destination countdown, live reactions | `DclqTesN41S`, `DeiKobUP8fQ` |
| 8 | **One line that stays** | short: one poetic line across 3-5 slow holds, no CTA, loops. Long: a line someone said, *on paper*, *but the more I looked*, lesson, the quote again | a quote that needs context, returning quote, slow pacing, under 15 s | `Dajtw_5gI42`, `DXGe1gcjyv9` |

Picture rule for 8: the edit slows on the sad or true line (`C0mBdgePqin` goes from 0.3 s cuts to 3.5 s holds on one word).

**Top hook formulas.** What they share: a concrete number or place in line 1, stakes said out loud, plain words, a question or reversal the viewer has to stay for, endings that call back.

| formula | use for |
|---|---|
| impossible choice, seven words or fewer | essay |
| *This is me [doing X]. The only problem is [Y]. Let me explain.* | long form, Day 1 |
| *How did I get myself in this situation?* after a flash-forward | cold open |
| a game rule with a fail condition | series premise |
| a payoff that makes no sense yet | flash-forward |
| *So apparently if you [X], you do what any normal person would do and [Y]* | You-POV |
| a strange claim that begs for proof | hot take |
| one quote from a local, *yeah, for you* size | reflection |
| *First day in [country] and there's a problem* (fake danger that flips to kindness) | short vlog |
| *This place has no [x], no [y], and there are no [z]* | secret place |
| cheap price against a crazy act | cost |
| *Next stop, [place]. Or so we thought.* | false ending |
| a mirrored closing line | essay close |
| *[Place] + exact strange number + misleading noun, so I came here to find out why* | number hook |
| *I came to [country] with one question* | vlog |
| *Is it [X]? Let's find out* + `SIDE QUEST #N` card | brand series |

**Also from the references:** open an explicit loop in the hook and close it in the last line · a *by the way* aside gets a pattern break (quick zoom or text pop) · one running phrase the viewer waits for · an open question at the end drives comments · a question from a guest can frame a whole episode · humans and contrast beat abstract theses: the one abstract opener measured sat at the bottom.

**Long VO skeleton (`DbaokEToop2`):** dream hook, setup, tease, 3-5 beats with one *by the way*, lesson, part two.

**Tense.** Essays and advice: present, "you". Diaries: past. YouTube: present in scenes, past only in short recaps. The canonical series stays present.

---

## 5. Methods

### Cuts

- **Stutter repeat.** Some shots repeat 2 frames for a stutter (`DeDb9HKouBP`), or split into 2-3 cuts of 0.1-0.3 s (`DePGWPrur4V`). A 0.8 s breathing shot sits inside the 0.4 s flurry.
- **Cuts after the beat.** `DOBE2ENkgyd` cuts sit about 0.28 s after the detected beat, on the snare, at a constant phase. `DdspbvTO3x2` follows drum fills, not a grid. `DaEyqUOMtJO`'s drum intro IS the cut list. Snapping to detected beats would be 0.28 s early. Copy the reference's cut times and check phase on the audio.
- **On-beat is not 100%.** Shares within 0.1 s of a beat: 48-88% on several exemplars, 100% on only two. "On the music" means on a drum hit or phrase at the reference's phase. Exceptions: the 5-frame flicker over a calm track, and live singing or prayer, cut to faces.
- **Tracker BPM is wrong on slow songs** (read at double or half). Use cut spacing.
- **Silence before the drop.** Measured: `Dev2pHEKYqR` quiet intro 0-4.3 s, 0.9 s silence 4.3-5.2 s, vocal riff in at about 4.8 s, drop at 6.0 s. `C5hdhsHpxYd` 0.5 s of silence at 2.2 s, drop and format switch at 2.75 s. Others 0.4 s before a closing line.
- **Burst then hold** (`DcymL3TKSyQ`, structure only). A flurry of 0.2-0.6 s cuts, then one 4.4 s hold at 6.3 s, the inverse of hold-then-burst. `De2G25qMJTK`: beat cuts of 0.55 s to 7.8 s, then long holds. *The long holds are confident.*
- **One-word lines get one-word cuts.** A 20-cut burst on two short words (`Db-51WtMZda`). Cuts slow on the sad word.
- **Mid-sentence.** 32 of 69, 24 of 37, 32 of 87 on vlogs; 43 of 48 on `Dcg23g0Iob3`; 25 of 27 VO cuts within 0.2 s of a word onset on `De69-5CoxlT`. The sentence carries you across the cut. Cut about 0.1 s before the picture word.
- **VO long-form rule:** one cut per 4-8 words, a 3-5 s wordless hold after a big line.
- **Object carried.** A 4-5 shot run on one object, same centre, at 0.6 s.
- **A counted claim is shown as that many quick shots:** twelve no's, twelve no-shots.
- **Speed.** Speed-ramp only the dull middle, 1.5x at most, so the reveal lands by 8-9 s. Speed-ramp bursts on distance or time lines. Time-box by the words.
- **Whip joins.** Whip in the direction he looks, 4-6 frames of blur, so it feels like one move (`DZlPAzcNAMO`). End a hold on a head turn. Whip into each new place on a vlog. On graphics: 1.16x over 0.25 s, flash only 10%.
- **Passer-by wipes.** Someone crossing the lens as a transition.
- **Push-ins.** Static wide with a slow post push, 100 to 108%. 1.00 to 1.08 on photos. A 1.1x punch-in on the key noun in VO. 1.3x on the key phrase of a long real-audio bite with B-roll cutaways of 1.3 s landing on the words. No scale jump inside a shot just because it is long. Aim on the face, not above it: Tal: *"stop with all the zooms."* Zooms only when the face DOES something.
- **Fisheye eye macro.** A slow warped macro of an eye opens onto the trip (`Dd9kCQNt7lz`): 4.8 s, then 2.9, 1.6, then 0.5-0.8 s. Shoot a new iPhone macro. Tal, Oct 26, 8:38 AM: *"my eyes closed and then they open, you know, that's the cinematic stuff."*
- All shorts under 3:00.
- **Same cut map, two countries.** `DU2Yp9WkUvd` and `DVDeGVakepc` share a cut map and song: keep the map, swap footage.

### Text

- Text on frame 1 can be the caption over a 0.4 s shot (`DdEoXrPJUH6`): there need not be a hold.
- Words build karaoke-style inside a phrase; function words visually lighter. The punch word gets the accent. Gold or yellow is for one key word in a hook, not every line. Never a blue active-word tint.
- Script fonts: the toolkit's Oct 21 list says none, ever. That list is street-era and several travel references use them (T87, T9 location titles). Copy the reference on a recreation; ask before one on an original.
- Text behind the subject: a giant thin serif tucked behind his head with small mono subtitles (`DCl7xGnRN4E`), a heavy country word behind a face (`Dee-WKxocOB`), or masked behind a canyon wall (`DbxmbvQNpLA`). In-world type: words on a street sign. These need a cutout.
- Two-layer shadow for pale text over a white shirt: tight 2.5 px at 0.6 plus soft 9 px at 0.35.
- Selfie faces hit the band at 41-46%: zoom 1.15-1.4 with an offset per shot, or swap the shot. Check 4+ frames per face shot.
- Flip text to black when it sits on a bright sky.
- Abstract line = big kinetic word or Tal on camera. While a big word is up, hide captions.
- Under 0.7 s on screen fails QA. Under 0.8 s, merge with the next, broken where a sentence ends.
- Black caption cards for the 1-3 heaviest lines. Full-screen, one centred white line.

### Sound

- **Own audio is not always safe.** "Untouched" holds only after measuring: `Dd1A_pjtG-j` peaks +0.5 (clip to -1), `C5hdhsHpxYd` -12.2 LUFS, `Ck6UrZPomcr` -15.9.
- Songs start mid-track (`DeGdQ2DClME` from 0:14.4). On a recreate, the reference's own audio carries the offset.
- Tab patched two things into his own `build-edit`, never pushed here: a 2-frame audio fade at each real cut, and J and L cuts that roll the picture cut while the sound edit stays put (default 6 frames, only between different speakers). Check ours before relying on either.
- One shot = one noise floor. A voice under music: lower the music, never cut the person.
- A wordless video is not finished without music: emotional first, 2-3 options, his library.
- Music sources, for reference: on Oct 16, for a street batch, he called his Drive folder, Instagram or Spotify songs and AI music fine. The travel rule is newer: the reference's song, or a track he names.
- Real audio inside the footage can be the bed (people singing). A low-passed bed under talk with the full track up where nobody speaks is a street note, usable on a short vlog with a song.
- Jump-cut filler out of a real-audio bite; a misspoken number is fixed by trimming, not re-dubbing. Dead-air floor in talking cuts: pauses over 0.25 s go, but keep the 0.12 s lead and 0.45 s tail where a line ends an exchange.

### Look

- **Every library entry carries its own Sony and iPhone filter.** Those fits are the reel's, and they beat the preset averages in `no-money-grades.md` on a recreation. `reel_brief.py` prints them.
- **Measure with bars masked.** Letterbox reels read black 0.00 otherwise. Re-measure the picture window only.
- Check p2/p98 after any fit for crushed blacks and clipped sky. Fit, then test on 2 different frames of his.
- **Grain isn't inside a LUT.** `noise=alls=8:allf=t` 16mm, `noise=alls=6:allf=t` warm olive, `noise=alls=5:allf=t` how-was-peru, `noise=c0s=14` amber desert.
- Warm amber film family (T32, T30, T14, T45, T9): +R/-B through all tones, highs rolled hard, never a white sky. Grain, halation and a slight gate weave were read on `C5hdhsHpxYd`: no recipe exists yet.
- Petra grade warms skin to orange: on close faces use the lighter version, or drop the red/yellow boost from 0.25 to 0.10.
- Single-colour burnt orange works only on sand, rock, dusk, fire.
- Grades he named to study: `DePGWPrur4V`, `DcymL3TKSyQ`, `Dd6EKK4oQ1Q`, `DdJra3Ho2Dw`, `DTC7UGOE7df`.

### How flashes sneak in (Tal, Oct 14, 5:40 PM: *"Never do a flash"*)

A cut point 2-5 frames from a jump cut already inside the source leaves a remnant. 1-frame gaps between back-to-back overlays from float timing. B-roll starting a few frames after a source cut. A stray frame of the next shot at the tail of a 0.5 s slice. Cover a remnant by extending the neighbour across it. Check with `select='gt(scene,0.1)',showinfo` on the FINAL render. When patching an overlay, composite B-roll and text first on the exact 1/30 grid, then overlay that one layer with one `enable`.

### Build traps Tab paid for

- Cutting each shot with `-ss a -t dur` alone rounds every shot up 1-3 frames: picture and captions drifted 0.7 s by 60 s. Tal: *"my words are not lined up."* Render with `-frames:v N`, trim audio separately to N/30 s (then mux, per the main file).
- `-loop 1` PNG overlays with `between(n,..)` flickered. Use `-framerate 30 -loop 1`, `setpts=N/30/TB`, time-based `between(t,..)`.
- `zoompan` resamples by frame count: normalise fps first. 48, 30 and 29.97 all appear.
- `freezedetect=n=0.003:d=0.4` on any render with slowed footage.
- Scene detection fires on fast tilts with no real cut. Look at 15 fps before calling it a cut.
- iPhone HLG files can carry an exposure step inside the camera file (`IMG_0590`). Match histograms over about 55 frames, then check frame means.

---

## 6. YouTube graphics and structure

`no-money-travel.md` section 4 owns the numbers and the episode shape. `no-money-episodes.md` 1.5 lists devices. This is what those references actually do, and his words on it.

### Tal's words, from the voice notes

| when | what he said | meaning for the cut |
|---|---|---|
| Oct 24, 8:46 PM | *"my backpack, my skateboard, my camera, then there needs to be a shot ... or make like motion graphics, you know, popping up"* | show it or pop it up, on the word |
| Oct 24, 8:47 PM | *"Remotion is the best way to edit, I think"* | graphics in Remotion |
| Oct 24, 9:12 PM | *"We don't need to do Polaroids ... you can do paper cut animations ... We've got to animate everything"* | paper-cut, nothing static. So any "polaroids" below are his references' look, not his |
| Oct 24, 9:12 PM | *"travel the world, and he's like, all these fast cuts, boom"* | that phrase gets fast cuts of real travel |
| Oct 24, 10:23-10:25 PM | *"the sony clip, because those are in horizontal ... cinematic stuff ... for the iphone clips, that's where you can usually be finding stuff for making the shorts"* | Sony and GoPro vlog folders for long form, iPhone for shorts, *"depends on the country"* |
| Oct 25, 1:53 AM | *"Me with my thumb out in the middle of the desert ... like pointing to me with an arrow ... let me take you back to where it all started"* | one opening he described |
| Oct 25, 10:10 AM | *"yo I'm in the middle of the desert, I got no plan, no money ... wait, wait, wait. And then let me tell you how I made it here. And then it's like a zoom out of the map"* | the later version: face first, then map. Newer wins; the arrow can sit inside it (our reading) |
| Oct 26, 8:38 AM | eyes closed, then open | a cinematic shot, between drone wides |

### Cold open grammar

Nobody starts slow. In the first 15-30 s: a flash-forward or *this is me*, the stakes and rules, *let me explain* on a freeze or ID card, a title card.

| source | what happens |
|---|---|
| `5cNrCPKlEKY` 27:53 | 0:00-0:10 walking with a cardboard destination sign, a yellow hand-drawn "Me" arrow sticker pops on him, a globe with a dashed route and km counter, empty wallet to camera. 0:12-0:22 sit-down intro. 0:28-0:33 flash-forward at 0.8 s. 0:34 title card. 0:38 episode starts. 0:42-0:47 the 3-challenges board, each icon popping as named. 49 cuts in 40 s |
| `joIpzpL6Dgw` 47:54 | 0-7 s wildest moments, the question on a FREEZE, an ID page flies in, a stamp slams, the series title as a passport cover, past episodes on the desk with labels, a shape drawn over real sunset, a red countdown over the city |
| `qkLkdc32KGs` | rules as big pop-up words, a day counter, a 3D globe, a first rejection by 0:52 |
| `N-ZenLrInoc` trailer | 0:00-0:46 tabletop macro, ONE white sentence per shot, slow rack focus; hands unroll a map = the cut into the live montage; 6 chapters; release-date card. This is the "feeling" he named |
| `DbiiKy4uxEX` T80 | 52.7 s, 43 shots. 0-3 s to camera, stakes line, zoom-blur punch-in at 0.6 s, title words pop as spoken. 3-6 s drone + big number. 6-15 s backstory over 6-8 shots. 15-27 s *it's time to* + 3 promises. 27-46 s 5-6 moments each with 1-2 s of real sync reaction. 46-49 s golden drone, title builds word by word. 49-52.7 s end card. Shots 0.6-0.8 s in the list, 1.5-2.5 s on sync. Text three times only. About 234 wpm |
| `MjtJbhuFngg` | night-vision selfie, car-seat confession as a recurring check-in |
| `84WIaK3bl_s` | payoff selfie, then facts as big white text over a timelapse, a price in huge type with the screenshot as proof, best item saved to 5:22 |

Tal's Ep1 opening beats T80: use T80 for teasers and archive openers, per the master's own Shorts use. On YouTube, no "full video on" card.

### One mission per chapter

- A chapter is ONE mini-mission: a ride, a bed, a meal, an experience: ask, struggle, yes. Reuben: goal, obstacle, helper, win counter. One every 1:50 (Niko South America) to 3:45 (Niko Australia), 2-4 min typical. 7, 26 and 19 chapters measured.
- One big episode goal ties them together and can be shown as a document on screen, a golden-ticket style card that later fills.
- Conversations hold 4-10 s; long negotiations 10-30 s.

### A graphic every 20-30 s

Measured: 142 callouts in 48 min (one every 20 s) and 418 in 3:05:49 (one every 25-30 s). Tab's fix list says 8-12 per film; v4 had fewer graphics and Tal rejected it with *"no motion graphics."* So do not cut down to 8-12 on Tab's word. The VFX line in section 4 still holds: accents on clean real footage, spoken words only. How many is an open question at the end of this file.

Menu of what they use:

| kind | detail |
|---|---|
| **counters** | yellow chunky rounded with a dark outline, top-left: day, money with a green delta. Continent or country counter `2/7` over the arrival, only when he confirms a count. Green digital countdown top-right. A red pie `N DAYS REMAINING`. `Time until flight` timer lower-left. A sound on every change |
| **maps** | at every travel leg: globe, Google Earth zoom with pins, flat illustrated map with a dotted route and hand notes, satellite still with a yellow outline, shape drawn over live footage, a cartoon route with a small character walking the line and a km counter. Map names COUNTRIES, not towns, unless the town is the point. Build a real map open from 2-3 tile layers (z6, z9, z12) cross-faded; one zoomed image goes soft |
| **name tags** | handwritten with an arrow, or name + age when he confirms. White subtitles with names in italics |
| **paper-cut set** | ID page, stamp slam, pop-up book page per continent, a rules page with highlighter, a mission checklist panel top-left, a challenges board on parchment. Animate cutout pieces in code, not flat zooms (`ig_De0qdCqxcUy` is the method reference) |
| **cards** | fake phone-message cards for DMs, a screenshot as proof, a booking page showing the price he did not pay, hashtag-style counters, `2 hours later` cards, chapter titles as stamps, a serif keyword on B-roll, a viewfinder bracket over a photo, a press-quote card with a highlight |
| **stat pops** | 3D stat over the live shot, colour field carrying one word, isometric city with route lines for scale |
| **proof** | big centred text over a timelapse instead of VO for facts |

Keep the sting and HUD to 2 s. A device every 10-20 s is the shorts number.

**Effects menu Tal told Tab to memorise (Oct 16):** orbit, couch wall, UI world, frame break, digital zoom, phone mockup, checklist, headline wall, zoom-through cut, chart grow, pull-back reveal, green screen, paper cut, doodle boil, vertigo, cover story, glass type. Pick 3-6 per reel at most, for the story. Oct 21: *"it doesn't need to be every video."* Glass = a number moment. Screen push = a punchline said in the clip, 3-15 words. Over-the-shoulder = before/after. At most one per video, never on a sad beat, no caption in the effect window.

**Lemo styles:** `urban-sketch` for a pitch memory, `watercolor` for a kitchen memory, `paper-popup` for a turning point, `briefing-board` for route maps. A 2-3 s illustrated insert can replace an AI shot.

**Trade card text forms** (for the template when it gets built): `1 VIDEO = 1 ROOM`, `VOLUNTEER = BED`, `20 HOTELS . 20 NO'S`, clock stamps, `OWNER . VIDEO . 5 MIN . NO . YES`, repeated `NO x NO x NO x` then `YES`. Check every number against his clip.

### Previously on, and the cliffhanger

- Recap title his doc uses: `LAST TIME ON THE JOURNEY`. *"Do not recap Episode 1 for a minute."* Same short series intro as Ep1 on Ep2+. `no-money-travel.md`: 10-20 s.
- The references run past episodes as stamped cards with a tick and a label as he names each one. Do it in paper-cut, not polaroids.
- End on the next destination: a flight, a counter over the arrival, a cold cut to next week's crisis, a date card. *First test passed, but this was just the beginning.* `Dd10WEzuHqY` saves a reversal for its last 25 s.
- Quality bars decoded: number + stakes in line 1, music-only breathers after the stakes (14-37 s on `Dd10WEzuHqY`), one honest fear line, a burst on transit.
- `De2Gk5gPKNi`: VO never stops, every phrase its clip, minimal type. Long-form VO: `Deaxk67O-cH`.
- Do NOT treat his own channel as a reference (Tab's note). The existing Pakistan and Oman edits are story maps.

### Long-form odds and ends

- Natural-looking bright travel colour is their norm, full 16:9. Tal requires a cinematic grade (section 4), so this is one place not to copy them.

---

## 7. What he said about each praised reel

Only real Tal quotes, adding to `no-money-recipes.md` section 1. **VN** = in his voice-note file. Everything else is the library's "Tal said" line or a Part B tag: typed or machine-transcribed notes, attributed by Tab. "Tal:" inside a "Tal version" line is often Tab's proposal, so those are not here. A bare link is not approval.

| Tal's words | reels |
|---|---|
| VN Oct 25, 9:26 AM: *"this video is a Western Sahara video ... you should study the color grading"* | `DcymL3TKSyQ`. It is the Mauritania iron-ore train. The grade only |
| VN 9:59 AM: *"videos can just be like this with music"* | `De5P610t4iM` |
| VN 10:04, 10:10 AM: *"Another style ... that we could recreate"*, *"exactly like the type of video that you can recreate"* | `DbZWxAVxeP6` |
| "Great" | `C7o8OY9pXuE`, `DeMtzO8oEae`, `De38NJMNwuD` |
| "Recreate" | `DVjGLQRAAhr`, `DH6ctb0TyzD`, `Dc1SOqzgUWV` |
| "Edit like this" | `DeGdQ2DClME` |
| "We're gonna copy this reference also" | `DduHid8JeWl` |
| "Short vlog" / "Short form vlog" / "Short form blog" | `DA1HF7AiVm5`, `DclqTesN41S`, `Deyn3-RsIej`, `DcG-xd6MZk5`, `DZwxDDnMilN`, `DYV8eZquUGe`, `DXr7nZfkT5z` |
| "Short form vlog. Look at the clips it connected. No voiceover" | `Db8HuHEBAKx` |
| "Look at everything for short form vlog" | `DY1gmQMs95b` |
| "Vlog style / Short forms" | `DeveAsPu6Uz` |
| "Boys trip" | `DcdGOPks-l0` |
| "Same but girlfriend on top" | `DezeQJUpO_D` |
| "Bro what r u doing, your phone is unreachable… I changed it because I'm not a [girl]": a quoted line may be re-voiced | `DSGct2OkTs5` |
| "like this but grandpa" / "My son\*\*\*" / "Future wife \*\*" / "May a boring women" | `C4N8Bh_MsYV` / `DeCeMgIoVL6` / `DM-jNRnxvLs` / `DbRLF3USmUA` |
| "recreate some of the shots of the hook with the map... step color and everything" (*step* probably garbled) | `DTC7UGOE7df` |
| "Reel" | `DZNU5V2sNpj`, 7.3 s zoom |
| "Bro said let's bring a camera... then go see my pictures" | `DTA3_1zDFfi` |
| "This. POV you travel the world to take pics" | `DN3GwLF0HKT` |
| "Do this" / "This" | `DS7jJKjCmqu` / `DZEDwbZpKFm` |
| "I'm a street photographer, here is my work" | `Dd1A_pjtG-j` |
| "also we can do something like this" / "a great example of another" | `DY45yYHCjea` / `Ddizv9wzI1N` |
| "Earth to visit, then the country name, then pictures like this" | `Da0GCyTOl5T` |
| "Will never see this place in their life" | `De4jO-4gUk9` |
| "Travel videos to understand and recreate" | `DeR1aaIBcQY` |
| quoted the hook back / asked how the text is made | `DalMYk-sgV5` / `DeygZcFAgvj` |
| "Can do this in English for country" | `Ck6UrZPomcr` |
| "we can do this" | `DeT-y_tPb4j` |
| "like this, also sometimes just music" | `DZlPAzcNAMO` |
| "YouTube intro for video" | `DbiiKy4uxEX` |
| "Traveler to traveler" | `DeyyAyUsedg` |
| "our first clip is 9:16 and the other ones are like framed like that" | `Ddk0c5-KnGG` |
| "Can you copy stuff like this"; his "map opening up" reference | `DeO0-LDBKGY`, `DeroeTasIz9` |
| "Nice cinematic" / "Great template" / "Cinematic" | `De7BgkxsQ6h` / `De2YM-tOLxh` / `DeTQeHlx-lc` |
| "if there's an idea of me speaking and I say something like this, we could do videos like this" | `DeqAh_zq5WW` |
| "Nice video / reference of voiceover style video" | `De6_AnGIZ-4` |
| "Voiceover", "Voiceover style" (one word marks a VO reference) | `DZxwI21uY_N`, `DY6x8Cvjrjr`, `Dcg23g0Iob3`, `Dcqn_6XokIa`, `DcCMgJItFej`, `DdB95uZuBL_`, `DbtFl21R6yI`, `DXGe1gcjyv9`, `DDuuMh8CEhn`, `Dajtw_5gI42` |
| "like skateboarding my way across China?" (his own rewrite) | `Ddckav5h73W` |
| "we could do this... zero dollars" | `DdLg6A0pCvi` |
| "Hitchikemaxxing" (his word for T15's punchline) | `Da66_Dvu-w7` |

**Bare link, queued, not praised:** `DekVGS1yW9K`, `Dd0kmeoRRwf`, `DdEoXrPJUH6`, `DeWYhzvRvCL`, `DeDb9HKouBP`, `DeIjJbwiP7u`, `DdndR9oRBav`, `DeNSTWTBk9s`, `DdRl-x5uISV`, `DZKoK9GsWvO`, `DB1YaK-JjO6`, `DdtsA1QpT8B`, `DeDgXK5zDJD`, `Dbs9BagMg7c`, `DccByRNvXAY`, `De2G25qMJTK`.

**Unclear, not approval:** `DSpI8vWjzF3` "perfect thesis line" (may be Tab). `DPuNW4oDCJl` "good green" (Tab's reading). `DeWes60uhil` "Cove" (machine text). `DeuQkT1BzGV` "Insert and install how to do this": a tool request with no recorded result.

**Tab's judgement, not Tal's:** "PERFECT Tal fit", "THE brand reel", "Effort 1/5", every "Tal's version", and `@isabelledvictoria` and `@therogerdang` as pages he likes.

---

## 8. Series he asked for

### The five "every country" reels

The only five where he said every or each country. All cheap per country. A build still needs a country whose footage passes.

| | `DeSfbBUy38p` So how was X | `DcOvaq7xpCW` Welcome to | `De6H1FGlDs0` the people | `DeuM3UrgWXl` city, then nature | `DQHaC8KjKPR` photo "Bro said" |
|---|---|---|---|---|---|
| **his words** | *"We can do this for every country... like for Mongolia. We can do this for everything."* (9:02) | *"We can do this from every [country]"* (9:19) | *"We can do this for each country... use shots of me interacting with people"* (9:54) | *"you're going to Taiwan: city first, then boom, nature"* (9:58) | *"Exactly like this for each country"* (9:44) |
| **length, shots** | 18.0 s, 17 shots | 12.3 s, 23 shots | 10.6 s, 8 shots | 24.8 s, 14 shots | 15.0 s, 1 + 16 stills |
| **rhythm** | hold 2.8 s, median 0.5, last hold 5.0 | hold 2.7 s, then 0.4 s | hold 3.7 s, then 0.9-1.1 s | hook 4.9 s, then 1.2-1.9 s, median 1.6 | intro 4.90 s, then 0.63 s |
| **frame** | full 9:16 | full 9:16 | horizontal centred on black, caption top bar, small flag in bottom bar | full 9:16 | full-bleed |
| **footage** | native vertical iPhone: it is vlog-trend, NOT cinematic | ALL drone, so cinematic: vertical DJI first, iPhone only for the icon animal; never crop Sony or drone | Tal WITH a local, each shot | one Tal hook shot + 12 nature wides | 16 portrait people photos from one country |
| **text** | two lines in the whole reel, curly quotes, no question mark, white bold | serif centred at y 958, 0-2.7 s, then the country | quoted warning, then `the people:` from the cut | small white 2 lines at about 40%, hook only | see `no-money-recipes.md` section 6 |
| **grade** | sat 0.31, white 0.84, airy: `green_pastel_matte` fit | sat 0.43, white 0.77, cool: `city_teal_purple_matte` fit, Tab's per-channel Mongolia fit in the library | sat 0.40, deep blacks: `beach_teal_orange` fit | sat 0.32, lifted blacks 0.17: `green_pastel_matte` fit | matte film, refit per country |
| **audio** | reel's own, -14.0 LUFS, TP -5, goes in untouched | reel's own | reel's own | trending, no VO | reel's own, -14.1, peak -2.4 |
| **watch for** | none beyond the kids rule | the text system in the entry is cut off, so measure it | the warning must be something said to him; a danger-joke hook is his call each time | the "Mom:" line is a family-voice line, so his yes on each line | light-leak: see below |
| **built by Tab** | Mongolia | Mongolia | none recorded | offered, not seen | Mongolia |

Notes:

- `De6H1FGlDs0`'s text says 4 beats of 2.6 s; the measured cut list says 8 shots. Use the measured one. Its 42% black is not 16:9: measure the bars.
- Pair `DeDgXK5zDJD` (`the journey:` / `the people:`) with it.
- **The Bro said light-leak.** The reference blooms an orange flare over 4.50-4.90 s before a hard cut. Tab's Mongolia build kept it, and Tal's reaction to that build was *"this is fire... I'm so proud of you."* He never ruled on the leak itself. It stays on a recreation until he says otherwise, and the send line names it. Its variant, *Bro said let's travel the world* with the best 1-2 people photos per country, got *"This is so good"* (VN 10:19 AM).
- Fill order for the people reels: search *Tal with locals, handshake, given food*, then look. Countries named by Tab: Pakistan, India, Laos, Mauritania, Egypt, Jordan.

### The top 15, from Tab's method page

Tab's own order, not Tal's. Status added here.

| # | reel | what | status |
|---|---|---|---|
| 1 | `DbZWxAVxeP6` | essay VO, one word on screen | Tal's words back it: section 3.4 |
| 2 | `DeMtzO8oEae` | "so rich" list | Tal: "Great". Every claim needs the honest-premise check, and he must say what was paid |
| 3 | `DTKpTv7CJ-_` | They said, Watch this | Tab's version names a country count: blocked until he gives one |
| 4 | `DP-7GbDDHiK` | family-voice, cliche to comeback over the jump | needs his yes on the line |
| 5 | `DeDb9HKouBP` | held line + flurry | bare link; Tab's "brand reel". 23 shots, 9.6 s, median 0.4 |
| 6 | `De6H1FGlDs0` | the people | above |
| 7 | `DeDgXK5zDJD` | the journey, the people | bare link |
| 8 | `DQHaC8KjKPR` | photo Bro said | above |
| 9 | `DdndR9oRBav` | afford question | bare link. Use his word, Hitchikemaxxing, spelled properly |
| 10 | `Dd7b6_-PB4L` | motorbike log with VO + map | needs his voice |
| 11 | `DA1HF7AiVm5` | reaction to reveal | Tal: "Short vlog" |
| 12 | `DTC7UGOE7df` | map tabletop | needs tabletop inserts shot: five minutes at home |
| 13 | `DdRl-x5uISV` | iMessage | bare link |
| 14 | `DYkMxWWhYyr` | street interview | **not travel**: leave off the travel queue |
| 15 | `DcymL3TKSyQ` | the grade reference | study the grade, not the reel |

**Tab's batch order:** fastest are T41, T45, T25. Biggest reach T44 (367k), T30 (363k), T4 (315k), T46 (222k). Tal's own ideas per Tab: T43 Mongolia instead of Bali, T41, T45, the T47 map opening, the iron-ore amber grade.

---

## 9. Workflow gaps

Steps in how Tab built a reel that ours skips.

**Reading a reference.** One reel at a time, low-res. An age-restricted reel needs a phone screen recording from Tal; single reel URLs work when profile pages are blocked. Cut list from the CENTRE HALF: `crop=iw:ih/2:0:ih/4,select='gt(scene,0.25)'`. Hypit `media boundaries` as a second opinion on letterboxed reels (threshold 0.1, keep 0.2 and up on high-motion footage), `hypit media tile <file> --frames 12` for a time-labelled sheet. State the threshold with every count: 0.3 misses same-framing jump cuts, lower counts caption swaps. Read motion at 8-10 fps: a contact sheet shows what is in a shot, never how it moves. Song: fingerprint 2 samples (0-6 s, 5-12 s), report N of 2. Ducking = speech loudness minus gap loudness. Grade with bars masked. Keep stills and notes, delete the reel. Compare a frame strip of ref and build. Copy the editing moves, not the concept.

**Attributing his notes.** In a multi-link message each note belongs to the link ABOVE it. Check the note against the reel: a reel with no voice cannot take a "voiceover" note. Keep a one-line map from his phrase to our template id.

**Template page.** Recipe, then "Tal's version" as a draft, then pull and look at each clip, then "Other country versions" as the swap list: that step is why one template becomes a series. Record the series counter in the notes.

**Order of work.** State a "Make first" with reasons: his sync bites exist, a strong question hook, every clip already indexed and cinematic. Hold reels needing his voice until recorded (Part D reels 5, 8, 10, 12, 14, 15). Check Part D's "Why now" and Appendix 3: each open question names what it blocks. LESSONS 171 sits above all of this: his picks first.

**Per-country output.** Summarise the transcript, quote his real lines, name new reels with template ids. His lines get verified against the audio.

**Script sheet.** `Cut time | VO | clip | shot, length, quality tag | edit note`, a `sync` marker for real audio, a "Sources / checks" line, a music guide, and 3-5 yes/no questions for Tal, each tied to one clip. When two book figures disagree, he picks. A clip's own number is usable only when the line plays as live audio.

**Plan for a pack of reels.** Ends with *Also needed from you* and *What's missing / open*. Conflicts between footage and book print inline. When a title he wants can't be defended, give the honest one as A, his wording as B.

**No clip for a beat, in order:** a real moment in an existing long-form edit, a money card or kinetic word, a lemo insert, a listed AI shot. Never a loosely related clip. AI prompts: `Vertical iPhone 13 footage, handheld, slight motion blur, no faces visible, matching <named real clip> colours`, or `Shot on Sony a7 III, 35mm, natural window light, ...`. Objects, hands, backs, places only. Count and prompts go to him for his OK. Free tools only, his ElevenLabs the one exception.

**Five-minute home shoots.** Tell him plainly: airport-window selfie 4 s, iPhone macro of his eye, tabletop inserts, a silent doorway Shot A, a camera-held-up selfie 3 s. Never borrow a thumb-out from another country under a line naming this one.

**His own recording.** One quiet room, phone 20 cm from his mouth, 2 takes each, a 1-second gap between lines. `(opt)` lines only if he approves that beat.

**Pre-send QA, added to `no-money-travel.md` section 7:**

- [ ] A frame at every caption change, plus frame 0 and the last frame
- [ ] Captions zoomed in, never judged from a thumbnail
- [ ] Wrong speaker, wrong translation, late or early captions, spoken lines with no caption
- [ ] True peak on the preview file: AAC can push peaks up
- [ ] Scene scan on the final at a narrow window; `freezedetect` if anything is slowed
- [ ] Local languages: check the model's detected-language field (Groq turbo heard Arabic as French). Never a `*.en` model
- [ ] Translations are unverified until a speaker checks. An odd caption is a mishearing until proven
- [ ] Recreate: side by side at the same frames, and a note of every shot under 1.2 s

*"If something cannot be fixed, it is not sent"*, and he hears exactly what and why first. A passing selfreview is not a good video. Run `cutcheck` AFTER `selfreview`, which rewrites `_review/`.

**What goes back to him.** Lead with the result: what's ready, where, how long. Then only what he must decide: things you could not hear, translations nobody verified, footage not cleared, anything you guessed. If a note was unclear, do the likely thing, say what you assumed, ask the one question. Plain words, no tool names.

**Effect pass.** Ask before installing anything new. Trim the 5-30 s beat: vertical, talking, graded, face near the middle. Render a `--still` and look. Conform to 30 fps. Cut it back. Captions on top. Delete check stills.

**Frame.io, Metricool.** Listings return 50 items a page. One token refresh at a time, never in parallel: 35 at once hit his Adobe login with codes. `media{original{downloadUrl}}` gives range reads; the transcode m3u8 returned 403. Signed links cannot go to Metricool. One Metricool upload at a time.

**Old shorts.** Better first two seconds, new title, better captions, different music, faster pacing, no needless intro, a better ending. A re-post as a new trial needs a different file: 1.04x zoom plus a caption line. *"Do not post something bad simply because it exists."*

---

## 10. Bad data in Tab's files

Entries a builder will trip on. None of these get copied.

**Master, Part B.**
- Row 317 `DTjd7dDDikR`: hook is from another reel. Rows 103 `Dd5SKpto6en`, 208 `DeO-9GWI0Bn`: hook field holds tone-curve numbers; those reels have no hook text.
- "Tal's version" country labels: T49 says Georgia, line is China. T54 says Laos, line is Cuba. T55 says Georgia, line is Philippines. T57 says Georgia, line ends Pakistan. Trust the text, not the header.
- Row 88 `DcuHduXyVCD`, 46.6 s as 1 shot: read the entry; other "1 shot" rows over 15 s may be detector failures. Rows 46, 101 are mis-filed under T41. Rows 448 and 440 are one Ecuador story: use 440.
- Part D reel numbers are not the shipped first-15 numbers in `no-money-episodes.md`. Never cross-reference by number.
- Not travel: rows 95, 133, 184, 193, 224, 242, 270, 356, 358, 371. Deleted: `DT-uAofE1wz`, `DUA6W1Mkzcf`, `DUGuA53jLUU`, `DUJNr6MkqL_`.

**Master, Part A.**
- T4's 1.6-2.1 words/s is old; measured `Deo1QSWM-MV` is about 180 wpm.
- T14 proof clips 1.2-1.6 s against our 0.5-1.2 s: copy the reference's grid.
- T15's title says Homelessmaxxing; Tal's word is Hitchikemaxxing.
- T52's lead `DaVpIp-voRK` measures 2.33 s then 1.43-1.50 s, 9 shots, not the 0.5-0.75 s grid in `no-money-recipes.md` section 3, which is `DOBE2ENkgyd`'s.
- T56: 2 km, 3 km, 2-2.5 km. State none until checked.
- T70: master says full-frame hook then letterbox burst; ours says letterbox then full-frame. Different references: say which.
- T72: master 30-60 s; ours measured 15 s. Ours is newer. Ask before a long one.
- T79: "Normal trip" is stale for `DeIjJbwiP7u`.
- Counts disagree (102, 105, 86 templates; 421, 466 links). Use ids.

**Library.**
- Cross-pasted: `Dc6Tq9pp0FI` carries `DeZnb9iOvRb`'s text; `DevRajPvOXy` carries `DcE4mkyxNUP`'s. Only their measured lines are theirs.
- Boilerplate: `DOX8GidDdOV`, `DeFTLtFhjr9`, `DdjfFXxxXyl`, `DbVqA7BJ9sj`, `DezeG12pGrI`, `De2extMS8Zq`. Measurements only: `DemfOrkuAlz`, `Dd6a9nNiv7R`, `De3onM-pHaC`, `DeWy9CZuHMe`, `Deo59GwI4OM`, `DeZhqGaNV14`, `DYBkjemA4Ha`.
- Pointer entries; the data is in "New from Tal, Oct 25": `DdJra3Ho2Dw`, `DZlPAzcNAMO`, `DdluAm7IorA`, `DY45yYHCjea`, `DeyyAyUsedg`, `Da0GCyTOl5T`, `Ddizv9wzI1N`, `DXr7nZfkT5z`, `DeT-y_tPb4j`, `DeygZcFAgvj`, `DeR1aaIBcQY`, `De0QHQBys0o`, `De4jO-4gUk9`, `DalMYk-sgV5`, `Ck6UrZPomcr`.
- Truncated: `DYAgQNQIDwe`, `Da3yen1RYBu`, `DbtMHu7pVzx`, `DbolJgyoMiz`, `Dc8GNXFxmO2`, `DWGV4H-AEqu`, `DevRajPvOXy`, `DIktpoWxhBI`, and the text systems of `DeSfbBUy38p`, `DcOvaq7xpCW`. Measure, do not guess.
- "VO (measured)" on caption reels is the song or a hallucination: `DcymL3TKSyQ`, `Dd3qcYsBYm4`, `DdEoXrPJUH6`, `DeDb9HKouBP`, `DTf3amKDdOK`, `DTelCFcCUFX`, `De38NJMNwuD`, `DeDgXK5zDJD`.
- Cut counts under-report on letterbox and slow reels: `DR40v54EUDg` (three counts), `DT2sL-VDhBJ`, `Dc5JheeId4Q`, `DdZCBw5RLRM`, `DSFpSmFDYXj`, `DecXgAvxt8q`, `DezeQJUpO_D`. Use caption-change times and a sheet.
- Letterbox labels are eyeballed. 2.35:1 and 2:1 on 55% bars are a 5:4 window. 42% is nearly square. Black 0.00 on letterbox reels is the bars. 36% of letterboxed entries sit in `mountain_moody_nordic` against 18% of the rest, so "most common match" is suspect (inference).
- 15 reels never downloaded. Do not cite them as measured.

**Filters.**
- `[REJOINED]` strings in `no-money-grades.md` were checked against Tab's PDF text and match. Tab's F table holds a second, hotter amber fit; Tal asked for the T4-page look.
- Oct25f T2's `colorbalance=rm=-.10:gm=.11:hb=.08` is invalid: `hb` means `bh`. It is not in our files. Valid fit for that reel: `rs=-0.03:gs=0.04:bs=-0.01:rm=-0.1:gm=0.11:bm=-0.01:rh=-0.13:gh=0.05:bh=0.08,curves=all='0/0.0 1/0.8',eq=saturation=1.38`.
- The three-channel "fitted" method pushed neon into his clips. Levels plus warm/cool only.

**Not in the kit:** `files/luts/*.cube`, `tal_ref_*.md`, `tal_grade_presets.md`, the warm-film curves in `tal_cinematic_reel_refs.md`. Tab's machine only: `bridgeclip`, `apply_edit.py`, `nice-edit-kit`, `effect-of-the-day-stack`, effectcraft.

**Tab's words that read like Tal's.** *"Tal's Oct 16 rule for his travel series"* is a street batch rule. Logo, outro, title box, 3:4 cover and "all videos ONE series" are street notes: do not import them. `LESSONS.md` has duplicate numbers: cite the date. A Tab pick tagged "flagged shaky, use 1s" loses to *"always use not shaky footage."*

**Clip lists.** Reel 4's 13 clips list only 5 ids. Descriptions can be wrong: a Pakistan clip named as the truck jump is a selfie talk afterwards. Where a reference has a meme or film slot, his own reaction clip replaces it.

---

## Still open, ask him

Not settled by the decisions above.

- Long-form music depth. Tab's Ep1 note says 18-20 dB under, others 8-12. Section 4 says only "steady". Default for now: about 12, by ear, music up in gaps.
- HDR tone-map: our `npl=100 hable` against Tab's later `npl=180 hable`, which measured about 3/255 from phone stills. Test one known frame before changing the main chain.
- Graphics density on long form: Tab's 8-12 per film against the references' one every 20-30 s (section 6).
- T70 order and T72 length (section 10). Welcome-to ending.
- Hook pulled forward on a short cut from a long: Shorts Pack reorders, the newer rule says delete, never reorder. Default: delete; ask before lifting a line.
- Danger-joke hooks about a country. His call each time.
- Logo or outro on travel at all. Sources disagree and all are street notes.
- Notify mode on travel trials: Tab's note says it drops the music; our memory uses it.
- Carousels on his feed.
- Ep1 letterbox or full 16:9 (`no-money-episodes.md` 1.4).

---

## The model: a recreation Tal loves (2026-11-01)

Tal: *"This video was edited by Tab, it found the reference reel I gave it and made it in my story and everything."* Reference `DeZXr1uzouY`, a 28 s challenge-launch reel filmed in Taiwan. Measured on Tab's finished file, not the reference: 25.6 s, 1080x1920, 20 shots, 1.28 s average, -14.3 LUFS, peak -1.8 dB. Tab's own notes: `sources/recreates/tal_recreate_DeZXr1uzouY_notes.md` in the kit, printed by `reel_brief.py`.

Do these on every recreation:

1. **Find the same story in his life first.** The reference is a woman starting a challenge in Taiwan. Tab used his own Taiwan trip, same island, same coast. Choose the country because the reference fits it, not the other way round.
2. **Keep the reference's sentences and swap the meaning.** Its idea line becomes "When did we decide you need money to travel?". The frame stays: the "in another life" list, "we only ever see...", "so I'm giving myself a challenge", "follow along". The script reads as his because everything from the challenge line on comes from things he said on camera.
3. **Table first: time, line, clip, why it matches.** Every line gets a clip and a written reason. "A place like this" is the mountain with him tiny on the cliff. "How do I get there?" is the road. "Zero dollars" sits on him at the restaurant he's eating at for free. If you can't write the reason, the clip is wrong.
4. **His face carries it.** He's in 12 of the 19 distinct shots, mostly close selfies. Between them sit only the places the words name.
5. **Copy the whole text system, not just the timing.** Three tiers: lowercase white words building in the middle of the frame, small white lines lower down, one pink bold italic caps key word (MONEY, $0, EAST COAST). Quoted thoughts in italic serif. Two black cards with stacked words. Tilted photo pop-ups landing on "a backpacker, a hitchhiker, someone who sleeps in a tent".
6. **Same structure, retimed to his voice.** 19 cuts and the same long hold under the pop-ups, but every cut moved to land on his words, so the film runs 2.5 s shorter than the reference.
7. **Music enters where the reference's does:** on the challenge card, at about 14 s. Before that, a quiet bed.
8. **Write the flags.** Tab sent nine: the tense, what "zero dollars" hides, which line is the weakest match, which clip he couldn't confirm. That list is why Tal can trust the cut.

Text sits on faces in the first shots here and Tal loved it, because the reference does too. That's the recreation exception in section 1.

### Second model: "Pakistan, you were the country I was warned about"

Tab's finished cut, 2026-11-01. Measured: 74.5 s, 1080x1920, 48 shots, 1.55 s average, -14.2 LUFS, peak -2.1 dB. Reference: Safin Clark, `DZoOjVCP6Ux`, a letter to Bangladesh, about 148K likes (85 s, music bed, a fast flash burst around 55-57 s). Tal: *"thats the reel it copied."*

**How close Tab stayed.** The script is the reference line by line, with only the facts swapped: "Bangladesh, you were the first country we were warned about, but also the one that left the biggest mark" becomes the Pakistan version. "Cycling north through your bustling cities and endless rice fields" becomes "hitchhiking north through your crazy cities and endless mountains". "The worst scammers", "feed you far too much, refuse to let you pay", "a barber", "full bellies and even fuller hearts" all stay, because he lived the same things. Every swapped item is true of his trip and has a clip. This only works because his Pakistan really does match it. Find that match first.

- **A letter to the country.** The whole VO speaks to Pakistan as "you". One idea, and it holds the whole 74 s.
- **The turn is the warning.** "The country I was warned about" opens it. Near the end, "the worst scammers" are the people who feed you and refuse to let you pay. The fear gets turned into the proof.
- **Places lose to people.** It names the tallest mountains, then says that's not what he'll remember. "It's your people." The last stretch is faces, one per item: the smiles, the chai, the generosity.
- **A long list, one literal shot each.** The back of a truck, a zip line, pushing a broken car at midnight, chai, food, a vintage jeep, sick as a dog, a horse cart, a barber. Each shot is that exact thing, and most are from his own trip days.
- **Bookend.** It opens on the Pakistani flag and ends on it.
- **The text stays quiet.** Small white typewriter-style lines low in the frame, no big words, no pink. The story and the faces carry it. This is a different system from `DeZXr1uzouY`: copy each reference's own.

Works for any country he knows well. Write it from his real trip, not from a template.

### Third model: "Come with me to ride the most dangerous train in the world"

Tab's cut from `De6rEXSonQc`, a 45 s orca reel. Measured: 45.01 s, 21 shots, 2.14 s average, -14.4 LUFS, peak -1.9 dB. Tab's notes print with `reel_brief.py`.

- **Exact grid.** Same length and the same 21 cut times as the reference, to the frame. On a VO reel this tight, the script is written to fit the grid.
- **Shot-for-shot type match.** Selfie to selfie, wide to wide. Feet on the boat edge become feet on the wagon. The white flash on his jump into the water stays as a white flash on the climb. The cliffhanger close-up becomes the goggles close-up.
- **Sentence-for-sentence swap.** "Come with me to meet the biggest predator" becomes the most dangerous train. "But then the most extreme thing I could imagine happened" and "You won't believe what you'll see in the next video" stay close to word for word.
- **Text copied as well:** big two-line white title with a black outline on shot one only, then 2-4 word captions mid-frame.

**The file Tal sent still has the three faults the handbook lists for this reel:** "I woke up early" sits on a daytime selfie on the wagon, "we waited by the tracks" sits on shots already on top of the train, and "then, after dark" sits on a shot into the sun. Time words need their own time of day. Copy the method, not those three shots.

**The three models together:** the reference tells you the sentences, the grid and the shot types. His life supplies the facts. The first job is choosing a reference he has really lived.
