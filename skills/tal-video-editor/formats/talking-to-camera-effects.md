# FORMAT — Talking to camera, with effects asked for out loud

Tal films HIMSELF (tripod, one take) and wants the edit to do things on
specific words: a zoom on his hand, a logo in his palm, him vanishing from the
room, a split-screen explainer. Street POV footage is **not** this format.

**Source:** *"Let Claude Edit Your Videos"*, The Creator Stack #113, by
@pauloshimas (PDF guide, 13 pages). Tal handed it over on 2026-09-29: *"this
should be able to do this."* The local copy is in
`assets/references/creator-stack-113/`, which git ignores because the guide is
someone else's work. Everything below is my summary of its method, checked
against what this repo already does.
**Status: GUIDE, NOT MEASURED.** No example video came with it, so none of
its numbers were measured on footage.

## What we already had (no change)

| The guide says | Here it already is |
|---|---|
| Whisper word timings = Claude's ears | `frameio-transcribe.mjs --words`, WhisperX as alignment authority |
| FFmpeg stills = Claude's eyes | contact sheets, `reference-shots.mjs`, Browser-pane seeks |
| Beat sheet before building | `SCENE-PLAN.md` - **but Tal says don't wait for approval** (CLAUDE.md 0a-2) |
| Cut pauses without cutting into a word | `autotrim.mjs`, `toolbox/cut-silences/` |
| Snapshot your own frames before showing | `selfreview.mjs` + stills, THE STANDARD rule 4 |
| Version before each round | `_v2`, `_v3`, never overwrite (CLAUDE.md 1) |
| Style rules in CLAUDE.md | CLAUDE.md + THE STANDARD |
| Study a reference by pulling its frames | the five-step reference rule, CLAUDE.md 0b |

## What is NEW and now part of the system

**1. Spoken effect cues.** While filming, Tal can say the effect out loud:
*"zoom in on my hand"*, *"now throw it at the camera"*. Each cue is a sentence
in the transcript, so its word timestamp is the exact frame the effect lands.
- Search the transcript for the cue sentences first. Each one becomes a beat
  row: cue word -> effect -> start time.
- **Keep the cue in the cut when it is part of the show.** Viewers hear him
  ask and watch it happen, and that is the hook. Cut it only when he typed the
  request in chat instead of saying it.
- Trim the short pause he leaves after each cue. It exists to give the effect
  room, not as a beat to keep.

**2. Check the test shot before the real take.** When Tal sends a 5-second
test clip, pull frames and report back plainly: is his face lit, is he far
enough from the wall to cut out cleanly, is anything important near the edges
(right rail / bottom 20% on 9:16). One list of fixes, no essay.

**3. Clean plate.** For any cutout effect, he films 2s of the EMPTY room
before stopping, plus 2s without any object that will "come to life". Without
it, the vanish and layer effects cannot be built, so ask for it **before** the
shoot, not after.

**4. Names spelled right.** Whisper spells names the way they sound. Pass the
names actually said in the clips:
`node system/scripts/frameio-transcribe.mjs --only <id> --names "Tal, Nazareth, knafeh"`
(added 2026-09-29; opt-in because whisper can echo prompt words into silence).
Tested on a Shabbat Shalom clip: same words, no names leaked in where nobody
said them. It has not yet been tested on a clip where the name was actually
misspelled.

**5. Director notes.** Tal's notes are fastest as one change per line with a
time: *"0:07 logo covers my face - move it next to my hand, 20% smaller."*
When his note has no time, find the moment from the transcript rather than
asking.

**6. Named styles.** He can name a style instead of sending a reference:
movie trailer, Vox-style explainer, Apple-style product reveal, breaking news,
80s VHS. Say how I read it in ONE line in the report, then build (he does not
want a wait-for-OK step). If he also gives a reference for one detail, that
detail follows the reference.

**7. Same edit, several caption languages.** Same cut and timing, captions in
English / Hebrew / Arabic (or whatever he asks), voice untouched. Every
translated version is *"timing verified, wording unverified"*.

## The effects menu (HyperFrames)

These are built in HyperFrames (`hyperframes-*` skills, CLI v0.8.91 verified
2026-09-29). **None of them has been built on Tal's footage yet**, so the first
use of each is a build-and-test job, not a known recipe.

| He says (on camera) | Build | Needs from the shoot |
|---|---|---|
| "zoom in on my hand, put the logo here" -> "throw it at the camera" | punch-in, logo as 3D object on the palm, flies at the lens | logo SVG/PNG; open hand held still 1s |
| "split the scene into layers" -> "hide my layer" -> "bring me back" | cutout (`npx hyperframes remove-background in.mp4 -o me.webm -b room.webm`) with text between him and the wall; he vanishes, voice continues | clean plate; distance from wall |
| "put me in a frame on the right, and on the left show..." | he shrinks into a frame; an animated explainer builds beside him, timed to his next lines | 2-3 short spoken points right after |
| "float my best reels behind me" | his cutout in front, his videos on 3D screens behind | the reels; pick the most visual 3-4s of each |
| "grab the camera from my shelf" | a real object cut out, flies off the shelf, opens up in 3D | second clean plate without the object |

The guide's rule for all of these is to give every effect a twist: the logo
gets thrown, he disappears, the camera takes his picture. An effect that only
appears is weaker than one that does something.

`remove-background` outputs a transparent WebM plus an optional
**hole-cut, not inpainted** background plate. That is why the clean plate
matters: it fills the hole.

**Where it breaks** (the guide's list, which matches ours): fast hands and
loose hair give soft cutout edges; hour-long sources should be done section by
section; it cannot invent footage that was never shot; and taste stays Tal's.

## Where the guide CONFLICTS with Tal's standard, and his standard wins

| Guide | Tal's rule | Resolution |
|---|---|---|
| Cut every pause over 0.3s | Never cut anyone off, and the moments between the words are the best part (CLAUDE.md 2.2) | 0.3s applies to **his own to-camera takes only**. Street footage keeps its pauses. Even to camera, cut dead air and keep the breath (`talking-head.md`) |
| Colour the key word of EVERY sentence | Gold emphasis is for a hook line, not the house style (THE STANDARD, amended 2026-09-24) | white caps; one gold word where it earns it |
| Punch-in 1.2x on each sentence's key word, hold 2s, at most one every 5s | Subtle punch-ins; Jamaica V14 drifts 1.00 -> 1.06 | subtle stays the default. 1.2x only for a spoken zoom cue |
| Plan, then wait for approval | *"go faster"*, *"you don't gotta even show it to me"* | plan internally and state it in the report; do not block on it |
| Whoosh on every zoom, pop on every pop-up | no measured SFX rule for him yet | only if he asks; never the same sound twice in a row |
| Safe zone: nothing in the bottom 20% or near the right edge | `system/src/lib/safe-area.ts`: bottom 400px (21%), right 150px | the same rule. SKILL.md's "~250px" was wrong and is corrected |

## Hand-off

Route here from SKILL.md STEP 0 when Tal is on camera **and** asks for
effects (said or typed). If it is to camera with no effects, it is
`talking-head`. If it is fast cutaways with kinetic type, it is
`social-accords`.
