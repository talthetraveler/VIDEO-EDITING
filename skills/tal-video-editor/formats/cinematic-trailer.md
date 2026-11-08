# Cinematic trailer (reference: "Into the Wild" 2007 Trailer #1)

MEASURED 2026-11-08 from `assets/references/cinematic-trailer-XZG1FzyB8DI/` (YouTube XZG1FzyB8DI, Movieclips Classic Trailers).
Tal's brief: a cinematic trailer of HIS trip, shaped like this, plus cinematic loops. The reference is analysed for structure, pacing and technique only. Its pictures, words and music are never reused.

**What it really is, plainly:** a Hollywood theatrical trailer (Paramount Vantage), not a creator trailer. Its "voiceover" is mostly CHARACTER DIALOGUE plus a few narrator lines and the tagline. For Tal's trailer the dialogue slot becomes his VO (and a few real on-camera lines where they exist). Structure and sound design transfer; the line count is a guide, not a rule.

## 1. Measured numbers
| | |
|---|---|
| Length | 145.2 s trailer + 10 s YouTube end card (cut it). 1920x1080, 23.976 fps |
| Frame | **2.39:1 letterbox burned into a 16:9 frame** (cropdetect: 1918x804, 138 px bars top and bottom, static, never animates) |
| Cuts | 66 hard cuts (scene score > 0.25) plus about 25 dips to black (0.04-0.96 s) |
| Average shot length | logo + dialogue build (0-60 s) 2.3 s; dark dialogue act (60-81 s) 3.0 s; travel montage (81-130 s) 2.2 s; title + flash montage (130-143 s) **0.96 s** (cuts at 135.6, 135.9, 136.1, 137.1, 137.3, 138.3, 138.8, 139.3, 139.5, 139.8, 140.1, 140.3, 140.7) |
| Speech | about 180 spoken words in 145 s (~75 wpm average, estimated from the auto-captions, not forced-aligned): lines of 4-12 words, gaps of 1-10 s. The space between lines is the style |
| Loudness | mean about -25 dBFS RMS for most of the film, peak 0.39 (-8 dBFS): a quiet, heavily compressed mix. Only the last 25 s climb to about -20 dB |

## 2. Structure (timeline; validated on a 5 s contact sheet and a 2 fps sheet of the last 20 s)
1. 0:00-0:03 Studio logo over a dark river landscape. Audio starts at about 1 s.
2. 0:03-0:12 COLD OPEN IN DIALOGUE: a close face, a dinner table. First cut 5.6 s. Someone offers him a car, he does not want it ("everything has to be different"). It starts on a person and a want, not on scenery.
3. 0:14-0:34 NARRATOR line ("there are people in this world who go looking for adventure"), then the subject named. Road sign, empty desert, night water, a hand burning money, a lamp-lit face. Slow (ASL 2.5 s), dark, low-key.
4. 0:34-0:56 PUSH-BACK dialogue ("getting a job and making something of this life"), then "I'm going to Alaska". Faces in warm interiors. A white-out bright frame at 0:40-0:42 resets the eye.
5. 0:56-1:12 The thesis line (feel strong, measure yourself) over a face in a kitchen, then a night road. Black gaps.
6. **1:11.7-1:14.1 Black, 2.4 s, near silence.** Then the first big hit at 1:14.3 (+19 dB over the bed). This is the drop: before it dialogue and bed, after it music and pictures.
7. 1:15-1:17 Text card on a blurred, light-leaked picture: "based on the best-seller by jon krakauer", with rising hits (see SFX).
8. 1:20-2:05 TRAVEL MONTAGE: wide, golden, free pictures (rail-line walker, grain harvester, canyon, forest water, snow, river crossing). Dialogue reduced to short exchanges. The music carries it, level rises from -29 to -22 dB.
9. 2:06-2:10 Action peak: river fall, rapid, a bus in snow, a hand-held struggle. Cuts get faster.
10. 2:11-2:14 TITLE CARD on snow with sun flare: small "into the" above big red distressed "WILD" with a thin horizontal rule. Held 3 s.
11. 2:15-2:20 FLASH MONTAGE, 13 cuts in 5 s, each separated by a 0.25-0.6 s dip to black, hits on the cuts: face, kayak, horses, bear, splash, rifle, the bus.
12. 2:20-2:23 TAGLINE "lose yourself", tracked-out lowercase on a snow ridge with flare. Music tail.
13. 2:23-2:25 Billing block, centred stack, then **1.9 s of true silence (143.4-145.4)**, then the end card (cut it).

## 3. VO / dialogue to picture
- Every line is on a face or a related action. The narrator line at 0:14 is the only one over scenery (a road, a desert).
- Lines land on a cut or just after a black gap; cuts sit 0.1-0.3 s before the first word.
- Dialogue is a conversation (question, answer): a pair is ONE unit.
- The thesis line gets the longest hold and the least picture movement.
- After the drop (1:14) dialogue shrinks to 2-5 words and the pictures speak.

## 4. Look
- Grade: filmic, low-key, warm. Mean luma of the picture area Y=84/255 (dark overall). Warm highlights, cool shadows on snow and river scenes, soft highlight shoulder, visible grain, shallow depth of field.
- The letterbox is the single most copyable decision: wide footage inside a 2.39:1 window on 16:9.
- Titles: small, tracked-out lowercase line with a hairline rule ("lose yourself", "based on the best-seller by..."), one display title in distressed red serif over a bright snow plate. Titles sit on blurred or flared plates and fade in slowly (~0.5 s), never pop.
- One text device per 20 s at most. No lower-third captions, no subtitles.

## 5. SFX / VFX (measured; sounds are INFERRED from level onsets, NOT listened to)
Method: 100 ms RMS envelope of the mono audio, onsets where level jumps more than 8 dB over the previous 0.4 s and sits above -30 dB, merged to one per 0.6 s; dips to black from `blackdetect`; bright flashes from `signalstats` luma spikes on the picture area. Picture-side items were confirmed on frames; the sound-type labels (impact, riser) are readings of the envelope, not ears.

### VFX per cut
| Effect | What was measured | Where (s) |
|---|---|---|
| Hard cut | the default; 66 of them | everywhere |
| **Dip to black** | 25 gaps of 0.04-0.96 s between beats. 0.25 s in the flash montage, 0.6-0.96 s in the dialogue acts, one of 2.4 s | 18.7, 24.1, 25.4, 26.7, 28.6-29.4, 36.4, 37.7, 56.7, 58.2, 61.9, 66.1, 67.1, 69.9, 71.7-74.1, 76.7, 134.6, 135.7, 136.5, 137.8, 139.8 |
| Bright cut-in | a sun-blown shot cut in on a beat (Y>200) | 42.4, 54.0, 84.3, 109.5, 119.1, 140.7 |
| Light leak / lens flare | flare on the title plates and the horse shot | 75-77, 131-134, 135, 140-143 |
| Title reveal | blur-to-sharp plate, small text fades in slowly | 76-77, 131.5-134.5, 140.5-143 |
| Film grain + soft shoulder | continuous | whole film |
| Letterbox | static 2.39:1 bars. NOT animated | whole film |
| Speed ramps | none found; slow motion on the horse run and the splash only (unconfirmed by frame stepping) | 135-139 |
| Whip pan, glitch, zoom punch | none seen on the sheets | n/a |

### SFX hits
| t (s) | jump | Reading and sync |
|---|---|---|
| 3.8, 6.7, 8.2, 9.5, 10.4 | +8 to +11 dB | dialogue words, not effects |
| 15.2, 19.2 | +14 dB | narrator line and first music swell under it ("[Music]" in the captions at 12.7 and 14.3) |
| 29.5 | +11 | music cue under the subject's name, on a cut at 29.4 |
| 60.6, 61.8 | +10 to +11 | dialogue after the black gap at 58.2-58.8 |
| **74.3** | **+19** | THE DROP: the first impact out of the 2.4 s black, on the first picture after black |
| 74.9, 75.9, 76.8 | +8, +14, +12 | three rising hits (a stinger) into the title card at 76.9 |
| 80.3, 81.3 | +9, +12 | music re-entry, cut at 81.5 |
| 135.1, 135.9, 137.1 | +11, +11, +9 | impacts ON the flash-montage cuts (135.0, 135.9, 137.1), each cut following a dip to black; peak level -19 dB |
| 141-143 | tail | music decays to -37 dB, then 143.4-145.4 true silence (-61 dB) |

The sound design is sparse: no whoosh on every cut. Hits are saved for the drop (1:14), the title card (1:16) and the final flash montage (2:15). A silence sits before the drop and one after the end.

## 6. What to copy for Tal's trailer
1. 2.39:1 letterbox inside 16:9; for 9:16, a 4:3-style or 2.39:1 band with the title in the black.
2. Open on a human and a want (his line). The no-money premise is the "want".
3. Quiet bed, 2.4 s of black before the drop, picture-led after. Hits: one at the drop, a three-hit rising stinger into the title, a hit per cut only in the last 5 s.
4. Flash montage: 12-13 cuts in 5 s, 0.25 s dips to black between them, hits on the cuts. Best-looking shots only.
5. Title: small tracked-out lowercase line plus one display title on a flared bright plate; tagline last; 2 s of true silence at the end.
6. Shot length 2-3 s in the build, under 1 s in the flash montage.
7. Speech sparse, a line every 6-10 s, never over the drop.

## 7. Not copied
Studio logos, the song, character dialogue, billing block, YouTube end card.

---

# ADDED 2026-11-08: Tal's two other references (these define what he wants most)

Tal: Vimeo = "this is the type of cinematic I want, I love this with a nice voiceover and sound effects and music". 5A_4_k1nwzk = "I love the sound effects and storytelling of this video". The Into the Wild trailer above supplies STRUCTURE only.
Files and contact sheets: `assets/references/vimeo-462366773/`, `assets/references/yt-5A_4_k1nwzk/`. Same method as section 5 (envelope onsets, blackdetect, scene score 0.25, contact sheets, Groq whisper-large-v3-turbo word timings). Sound-type labels are readings of the audio envelope and the words, not listening; audio cannot be played here.

## 8. Vimeo 462366773 "I AM | a travel short film" (Flo Nick): THE LOOK, VO AND MUSIC FEEL
Download note: the vimeo.com page wants a login; the public `player.vimeo.com/video/<id>` URL with `--referer https://vimeo.com/` works with yt-dlp.
| | |
|---|---|
| Length / frame | 93.5 s, 1920x816 (**2.35:1 letterbox encoded into the file**, not bars on a 16:9 canvas), 25 fps, stereo AAC |
| Cuts | 55 hard cuts, ASL 1.7 s; 1.0-2.5 s in the build, 2.4-3.3 s at the end (cuts 83.8, 87.0, 90.2). Black: 20.28-20.32 (flicker), 62.0-62.2, final black from 90.24 |
| Subject | one woman, a van/tent, fjord, Andes, salt flat, pier, sunsets. Faces are partial: profile, back of head, a hand out of a car window, closed eyes. Almost no full frontal face |
| Look (from the sheet) | teal-and-amber split: teal/blue shadows and sky, amber highlights at golden hour, heavy vignette, lifted milky blacks, shallow depth of field with foreground blur (window frames, hair, car door), silhouettes against the sun, lens flares (a red one near 1:18), handheld drift. Dark exposure overall |
| Camera idiom | shoot THROUGH things (windows, a door frame, hair, a tent flap) so the frame is partly covered; hands, feet and profile as inserts |
| Structure | 0-30 s "who I was" (disoriented / insecure / afraid), 30-53 "but I have changed" (mountains, close faces), 53-78 "I am strong / focused / confident" (sunset hero shots, arms out, hair in wind), 78-90 resolve and fade (closed eyes, pier, black) |
| VO | 15 lines, 93 words in 93 s (62 wpm overall, about 100 wpm inside a line). Calm, close-mic, first person, simple words. Triplet 1: 22.7 "I was disoriented", 25.8 "I was insecure", 27.9 "I was afraid" (one-beat lines 1.3-2.3 s apart). Turn: 30.0 "But I have changed". Triplet 2: 53.6 "Now, I am strong", 56.7 "I am focused", 58.4 "I am confident". Gaps of 3-6 s between line groups: the picture carries them |
| VO to picture | each triplet item sits on a different shot cut on the word; thesis lines sit on hero sunset shots; the last line is over closed eyes and a still pier |
| Music shape | starts near silence (-44 dB at 0 s), builds to -30 / -20 by 6 s, flat bed -20 to -22 until 33 s, rises to -14 at 39-45 s, **full and held at -11/-12 dB from 46 to 77 s** (the plateau, about 31 s), falls to -24 by 80 s and trails to -46 dB at 92 s, ends in black from 90.2. Pulses (+10 to +12 dB) at 5.5, 8.1, 12.2, 15.9, 18.6 s (every 3-4 s) in the first 20 s; swells at 41.4, 44.4, 45.5; closing pulses at 83.8, 86.3, 88.7, 89.4, 90.3 |
| SFX | none found in the envelope: music + VO only. This is the music/VO reference, not the SFX one |
| Text | none on screen |
| Peak | 0.995 (limited hard) |

## 9. YouTube 5A_4_k1nwzk (Levon, a roller-skating grandfather; 72 s documentary short): THE SFX AND STORYTELLING
| | |
|---|---|
| Length / frame | 73.0 s (picture to 71.6 s then 1.3 s black), 1920x1080, 23.976 fps, burned bottom captions |
| Cuts | 43 hard cuts, ASL 1.7 s; **burst of six cuts in 2 s at 25.1-27.0** at the "But is he?" turn; otherwise 1-3 s |
| Text | hook title in the first 2 s ("THIS GUY WILL NEVER DIE." white caps top, NEVER DIE in yellow), bottom subtitles of 3-6 words, white with ONE yellow keyword, a second title "DON'T TRY THIS AT HOME." at 38 s, a big "AGELESS" at 1:06, end line "That's 1 minute, see you tomorrow!" |
| VO | 171 words in 70 s (**about 146 wpm**), comic-narrator energy, lines of 2-8 words |
| Arc | 0-2 HOOK (the claim, a face saying it), 2-10 intro by name, 10-25 BUILD THE WRONG IMPRESSION (looks about to die: white hair, old clothes, tiny apartment, "waiting for his last day"), 23-25 "But is he?" TURN, 25-27 six-cut burst, 30-57 PAYOFF (skating the highway in traffic, police are his friend, strangers love him), 56-63 moral line ("if you're not afraid of death, death stays away from you"), 63-67 "ageless", 69-71 sign-off |
| VO to picture | each line is literally on the picture it names: "disheveled clothes" -> his sandals; "tiny apartment" -> the bed; "waiting for his last day" -> his eyes; "skates on the highways" -> highway; "no fear of police" -> the police car. Eyes in close-up for the emotional lines, wide traffic for scale |
| Loudness | very hot and flat: mean -12 to -15 dB, peak 1.0, never below -55 dB. The opposite of the other two: a compressed social mix |
| SFX (envelope onsets of +10 to +16 dB at 0.7, 2.5, 3.5, 4.4 (loudest, -6 dB), 14.7, 17.7, 21.4, 23.9, 24.6, 38.0, 56.2, 61.4, 62.0) | Spoken SFX inside the VO: "Bam!" at 2-4 s and "Meet Levon!", a groan at 16 s (captioned "*pain*"), "Not bad!" at 25-30. The onsets at 0.7-4.4 are the hook's hit-per-phrase sequence. 14.7-24.6: body/impact hits on the bed shots. 38.0 a hit on the DON'T TRY THIS AT HOME title. 56.2, 61.4, 62.0 on the moral line and on "AGELESS". Separate whooshes were not isolated; the pattern is a hit on title cards and on punchline cuts |
| Storytelling rules | (1) hook claim first, (2) set up a wrong impression, (3) a one-line turn, (4) payoff with what he does, (5) one moral line, (6) a sign-off. Every line is on its picture. SFX only on surprise beats |

## 10. The BLEND for Tal's trailer (what comes from which reference)
- LOOK, VO DELIVERY, MUSIC FEEL from Vimeo "I AM": native 2.35:1 letterbox, teal-amber grade with vignette and milky blacks, shoot-through-foreground inserts, calm close-mic first-person VO, triplets ("I was... I was... I was..."), music that starts near silence, builds, holds a plateau and trails into black.
- SFX DESIGN and STORYTELLING from 5A: a hook claim in the first 2 s, a rule-of-three set-up ("no money for food, no money for a bed, no money for a ride") with a tick/hit per item, a turn line, literal picture-per-line, hits on title cards and surprise beats, one moral line, a sign-off.
- STRUCTURE from Into the Wild where it helps: the black before the drop, the rising stinger into the title card, the 12-13 cut flash montage with 0.25 s dips to black and hits on the cuts, the tagline, 2 s of silence at the end.
- Conflicts decided: 5A is loud and flat, Vimeo dynamic (-44 to -11 dB), Into the Wild quiet and compressed. The trailer follows Vimeo's dynamics. 5A's comic spoken SFX ("Bam!") are not copied (wrong tone for a cinematic).
