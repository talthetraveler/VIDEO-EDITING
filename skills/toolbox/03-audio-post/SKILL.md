---
name: 03-audio-post
description: Audio for street POV footage — levels, cleanup, ducking, music. The do-not-over-denoise line.
---

# 03 · Audio Post

**The street is not noise. It is evidence.**

Wind, traffic, a market, a call to prayer, kids in the background — that texture
is what proves the conversation happened in a real place with a real stranger.
Strip it and the video sounds staged.

## The line

**Remove:** electrical hum, clicks and pops, digital clipping, sudden handling
thumps, DC offset.

**Keep:** ambience, room tone, wind that isn't destroying the dialogue, distant
voices, footsteps, the general bed of the street.

**Do NOT over-denoise.** If a cleanup pass makes the voice sound like it was
recorded in a booth, it went too far — revert it. Prefer *less* processing and a
slightly rougher track over a clean, dead one.

## Hard rules

- **Never overwrite original audio.** Processed audio is a new file with a new
  name; the original stays retrievable.
- Never join fragments from two takes into one word.
- Protect first and last consonants, word tails, and breath. Plosives and
  sibilants live outside the word timings whisper reports. **If unsure, cut
  later, not earlier.**
- Do not normalise per-beat — a compilation where every beat is the same
  loudness sounds like a machine assembled it. Normalise across the whole
  programme.

## Levels

| Element | Target |
|---|---|
| Dialogue | −16 to −14 LUFS integrated, peaks ≤ −1 dBTP |
| Ambience under dialogue | −28 to −24 LUFS |
| Music bed (if any) | −24 LUFS, ducked −8 to −10 dB under speech |

Instagram normalises loudness. Do not master hot to compete; it only costs
dynamic range.

## Cuts and boundaries

At every beat boundary:

1. Snap to a **speech-region edge** from the transcript, not to a round number.
2. Add a **short crossfade (20–40 ms)** on the audio at every cut to avoid
   clicks — even on hard visual cuts.
3. Hold ~0.6 s past the last word. The reaction lives there.

## Music

- Only use music I have supplied and confirmed I can use. **Do not extract music
  from a reference video or any third-party source.**
- Most of these videos are stronger with **no music at all**. Ambient street +
  voice is the house sound. Add music only for montage/promo formats, and duck
  it hard.

## Tooling here

No Python and no system ffmpeg on this machine. Use Remotion's bundled ffmpeg
binary (`node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe`) directly
for filters (`highpass`, `loudnorm`, `afade`, `adeclick`).

Python-gated tools (silero-vad, DeepFilterNet, whisperX alignment) are
documented in `.claude/skills/video-editor/references/toolbox.md` for a Mac.
Do not claim to have run them here.

## Related

`01-longform-to-short`, `.claude/skills/video-editor/references/clean-cuts.md`.
