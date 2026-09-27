# EDITING DOCTRINE — provenance record

> **THIS IS NOT THE OPERATIVE COPY.** Tal, 2026-09-24: *"there shouldn't be
> like a hundred skills for video editing, there should be like one skill."*
> The rules below now live **inline in `SKILL.md` -> THE STANDARD**, in force on
> every edit with nothing else loaded. This file is kept only as the record of
> what he gave and when, so the wording can be checked against the source.
> **If the two ever differ, SKILL.md is what runs — fix this file to match.**

# EDITING DOCTRINE — Tal's own written standard

Given by Tal on **2026-09-24**, in his own words, immediately after handing
over his cut of the coffee-shop footage (`formats/two-camera-kindness.md`).
This is the general craft standard for **every** edit — the format presets in
`formats/` say what a particular kind of video does; this says how all of them
are cut.

**It is stated direction, not an inference.** Where an older file in this
system disagrees, this wins. Three long-standing questions are settled by it —
see §8 at the bottom.

---

## 1. Story and pacing

- Open inside the situation, then reveal context through dialogue. Avoid a long
  explanatory setup.
- Preserve the natural interaction, but remove dead air, repeated wording,
  searches for words, and exchanges that do not change the story.
- Cut on completed thoughts and emotional turns, not at arbitrary time
  intervals.
- Alternate POV and observer angles to reset attention and make the viewer feel
  present.
- Use wider location shots briefly as orientation or chapter resets, then
  return to faces and hands.
- Keep imperfect, human reactions when they add warmth, tension, surprise, or
  humor.
- Build toward connection: uncertainty or misunderstanding first, shared
  humanity next, then a warm payoff.

## 2. Captions

- Use bold, uppercase, white sans-serif text with a dark outline or shadow.
- Present one to three words per caption beat; one word is preferred for
  emphatic dialogue.
- Place English captions around the lower-middle of frame, clear of faces,
  hands, and platform controls.
- Match each caption change tightly to the spoken word or short phrase.
- Treat captions as rhythm: rapid speech produces rapid replacements; pauses
  leave the screen clean.
- Do not display full sentences as static blocks.
- For translated dialogue, retain the same English emphasis style. A smaller
  secondary original-language line may sit below only when it adds useful
  context.
- Keep punctuation minimal. Use punctuation mainly for questions, emotional
  stops, and clarity.

## 3. Camera and cuts

- Prefer hard cuts. Effects should not compete with the human interaction.
- Change angle when the speaker changes, a reaction lands, or the energy begins
  to flatten.
- Use subtle punch-ins for emotional or surprising words; do not constantly
  zoom.
- Preserve spatial continuity across POV and observer footage.
- Let reaction shots breathe slightly longer than ordinary dialogue cuts.

## 4. Visual treatment

- Maintain a natural documentary look rather than a polished commercial look.
- Correct exposure and color enough to keep faces readable while preserving the
  real environment.
- Stabilize only when shake distracts from the moment; retain some handheld
  movement for presence.
- Use graphic effects sparingly. A brief light/flash accent can mark a major
  hook or transition, but it is not the default.

## 5. Audio and music

- Dialogue is primary. Clean noise while preserving a natural voice texture.
- Keep ambient location sound low enough to retain realism without masking
  speech.
- Music should support the emotional arc, remain below dialogue, and rise
  during movement, reactions, or the payoff.
- Use sound effects only to reinforce a real cut, reveal, or transition.

## 6. Quality check

1. The opening creates a question within the first two seconds.
2. Every retained exchange changes the relationship or advances the story.
3. Captions match the exact spoken timing and remain readable on a phone.
4. POV and observer angles preserve chronological continuity.
5. The most human reaction is not cut off early.
6. Music never competes with dialogue.
7. The ending delivers a clear emotional payoff rather than simply stopping.

**Run this list against the RENDERED FILE, never the edit JSON** (CLAUDE.md 0b
rule 4). Items 3, 4 and 5 are measurable here and must be measured, not
eyeballed:

| check | measure it with |
|---|---|
| 3 — caption timing vs real speech | `python system/scripts/caption-sync.py <render.mp4> <slug>` |
| 5 — reaction not cut off early | `node system/scripts/check-beats.mjs <slug>` (tail padding) |
| 6 — music below dialogue | `signalstats` / band energy, as in `LOOK-AND-SOUND.md` |

Items 1, 2 and 7 are judgement calls. Make them by watching stills of the
opening, of each retained exchange's in-point, and of the last 3 seconds —
and say plainly that they were judged, not measured (CLAUDE.md 1 Honesty).

---

## 7. What this changes in the pipeline, concretely

- **`§1` "cut on completed thoughts and emotional turns, not at arbitrary time
  intervals"** — `autotrim.mjs` boundaries come from speech onsets, which is
  right, but beat *selection* must not be a fixed cadence. The 1.5-3s
  alternation in `two-camera-kindness.md` is the measured RESULT of cutting on
  turns, not a metronome to impose.
- **`§2` "one word is preferred for emphatic dialogue"** — the current renderer
  builds 1-3 word lines. Emphatic single words are in range; use them.
- **`§3` "do not constantly zoom"** — already enforced: `build-edit.mjs` has no
  automatic push (`zEnd = 1.0` unless a beat explicitly asks). Keep it that way.
  Tal, 2026-09-23: *"You don't need to zoom in just because I gave you that
  skill."*
- **`§4` "stabilize only when shake distracts"** — there is no stabilisation in
  the pipeline today. Do not add a blanket one.
- **`§5` "clean noise while preserving a natural voice texture"** — this is the
  do-not-over-denoise line in CLAUDE.md 1. LESSONS records the cost of getting
  it wrong: a per-beat denoise measured through already-cleaned audio produced
  an audible ambience shift Tal heard as a cut at 0:22.
- **`§5` music** — **stood down by Tal the same day: *"It's fine. You don't
  need to add music."*** No library exists here and CLAUDE.md 1 Rights forbids
  lifting a bed from his references. Deliver without it and stop caveating
  every cut for its absence. The rule stays written down for when he supplies
  tracks.

---

## 8. Three older rules this supersedes

1. **Caption colour.** CLAUDE.md and `LOOK-AND-SOUND.md` specify white body
   with **one gold key word** at ~72% height (from the 2026-09-23 screenshots).
   This doctrine says **white, dark outline or shadow, lower-middle of frame** —
   and it matches what he actually did in his own cut. **White is now the
   default.** Gold key-word emphasis is available for a hook line, not the
   house style.
2. **English only.** CLAUDE.md 0b rule 3 said translate and never caption the
   original — a rule that came from Jamaica, where nobody spoke Hebrew. This
   doctrine permits **a smaller secondary original-language line below the
   English, when it adds context**, which is exactly the bilingual stacking
   measured in his coffee-shop cut (`HAPPY? / משמח מה`). **Secondary line is
   smaller than the English, and optional — never a co-equal second caption.**
3. **Caption position.** ~72% height becomes **lower-middle, clear of faces,
   hands, and platform controls.** On 9:16 that is roughly y 0.60-0.70 of frame
   height, and it must be checked against the actual subject in the actual
   shot, not assumed.

Items 1 and 2 were flagged as open contradictions on 2026-09-24 and are now
closed by Tal's own direction. `CLAUDE.md` 0b rule 3 and `LOOK-AND-SOUND.md`
have been annotated to point here.
