# MUSIC

**Empty on purpose.** There are no music files in this repo and none on the
machine — the only audio outside the footage is a reference video's own track,
which is someone else's copyright and is never reused (CLAUDE.md §1 Rights).

To give a cut a music bed, drop an MP3/WAV here and name it in that project's
`edit.json`:

```json
{ "music": "soft-piano.mp3", "silent": true }
```

- `music` — a file in this folder. It loops, fades in over 1.5s, and is mixed
  under the location sound, then the whole timeline is normalised to -16 LUFS.
- `silent: true` — the MUSIC CUT: no captions at all, music forward at 0.85,
  location sound kept underneath so the street still feels real.
  Without it the bed sits at 0.14 so it never fights dialogue.

**Instagram will mute or pull a reel that uses a ripped commercial track** —
their audio matching catches it. Either use a track Tal owns/licensed, or add
the music from Instagram's own audio library at post time.

**Where the footage already contains music, use that instead** (LESSONS §9):
the volunteers singing at the hospital is a real, licence-free bed that is
genuinely part of the scene.
