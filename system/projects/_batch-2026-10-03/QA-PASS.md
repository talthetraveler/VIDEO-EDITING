# QA PASS — every cut in the batch (Tal, 2026-10-03)

> "Fix everything so it works. Make sure all the captions are on time. Reduce
> background noise. Make sure everything works. Show me each clip, I will tell
> you what to change."

No creative changes. Same shots, same order, same words. This pass makes each
cut technically right, on the RENDERED file. For EVERY video you made in this
batch (latest version of each):

1. **Captions on time.** Rebuild if the scratch is gone, then
   `python system/scripts/caption-sync.py <render.mp4> <slug>`. Target: 0
   adrift, 0 over silence, opening error under 0.1s, and no caption that
   starts before its words or hangs on after the speaker has moved on to the
   next line. Where a line is late/early, fix the segment timing (measured
   speech runs, second model on the window), not the placement code. A caption
   under 0.8s on screen merges with its neighbour (LESSONS 62/66). Read every
   caption as English once more.
2. **Background noise.** Speech beats must go through DeepFilterNet `-a 10`
   (the builder's per-shot denoise; check the build log says so for each
   speech beat, and that `"denoise"` is not switched off). Films running on a
   custom `LOCATION-SOUND.wav` / bed: make sure the speech in the bed was
   denoised the same way, per shot, never per beat and never `-a 25`. Do NOT
   over-denoise: the street stays in. Measure the noise floor before/after on
   one speech gap per film and report the numbers.
3. **Loudness.** The delivered standard is -14 LUFS, true peak <= -1 dBTP.
   Previews measured -16 to -17. Bring each film to -14 LUFS on the whole
   timeline (not per beat) and report the measured value.
4. **Cuts.** Words-chopped check on the finished file passes; no frozen or
   flash frames (frame count == duration x 30); no audio hole at any join
   (scan for -60 dB dips at cut points; the 4-frame holes found earlier).
5. **Blur / mute** (where the film has them): re-verify by frame index after
   any rebuild. One clear frame = failure.
6. Still NO zooms (LESSONS 80), except the Christian main ending as Tal set it.
7. Stay on preview builds (540x960 from proxies). The shared `cache/hq` now
   holds full-quality spans for `ek-christian-telaviv-fast`; if the shared
   builder picks them up for a clip you use and breaks a beat, say so and
   build from proxies only.

Output: a NEW version file per video (previous kept). Report, per video: new
path, caption-sync numbers, noise floor before/after, LUFS, anything you could
not fix. Keep scratch in your own project folder; clean `beats_*`/`tmp_*`.
