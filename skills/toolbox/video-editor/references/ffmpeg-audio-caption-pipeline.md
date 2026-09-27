# FFmpeg audio/caption/color pipeline — hard-won lessons

Portable, tool-specific knowledge earned building the "Call Someone You Love"
recreate (table-phone street interviews, Sept 2026). Not project-specific —
copy this file wherever `.claude/skills/video-editor/` goes. Pairs with
`house-style.md` (the look/feel rules) and `toolbox.md` (command reference).

---

## 0. This machine's ffmpeg situation

- `node_modules/@remotion/compositor-*/ffmpeg.exe` (the one CLAUDE.md tells
  you to call directly for speed) is a **minimal build with almost no
  filters** — no `fps`, `scale`, `select`, `showinfo`, not even `-f null`
  output. It's fine for `-c copy` remux/trim jobs. For anything with a
  filter graph (rotate, eq, drawtext, denoise chains, waveform diagnostics),
  find a full build instead: check `winget`/`Program Files` installs
  (`Gyan.FFmpeg` is common) or `which ffmpeg` — a full system ffmpeg may
  already be present even when project docs say it isn't (environments
  drift; verify, don't assume the audit is still current).
- **Windows + drawtext = a real trap.** `fontfile=`/`textfile=` values with
  a raw drive-letter colon (`C:/Windows/Fonts/...`) break the filtergraph
  parser even backslash-escaped (`C\:/...`) — it still misparses on some
  builds. Fix: copy the font into your working/temp dir, run ffmpeg with
  `cwd` set there, and reference **bare relative filenames** in every
  drawtext option (`fontfile=arialbd.ttf`, `textfile=cap_x7f2.txt`). No
  colon anywhere in the filter string, no parser issue. Same trick for any
  per-caption text file.

## 1. Sideways/rotated source footage

A camera mounted or held on its side records landscape 4K that needs
`transpose=1` (90° clockwise) or `transpose=2` (counter-clockwise) to stand
upright — check which by rendering one frame each way and reading it, don't
guess. If the sensor's short edge closely matches your target aspect
(3840×2160 rotated = exactly 2160×3840 = precisely 9:16), the rotated frame
needs only `scale=1080:1920` after — **no crop, no letterbox.** Do the
rotation in the render step; never touch the source file.

## 2. Denoise: DeepFilterNet, the standalone binary

Repo: `github.com/Rikorose/DeepFilterNet`. The Python package
(`pip install deepfilternet`) pulls in `deepfilterlib`, which needs a Rust
toolchain to compile from source on a platform/Python combo with no prebuilt
wheel — likely on a fresh Windows box. **Skip pip entirely.** Their GitHub
releases ship a standalone Rust CLI per platform
(`deep-filter-<ver>-x86_64-pc-windows-msvc.exe` etc.) — fetch it directly
from the release API/download URL, ~25MB, zero dependencies, runs standalone.

```bash
deep-filter.exe -D -a 10 -o <out_dir> file1.wav file2.wav ...
```

- `-D` — compensate the STFT/model lookahead delay. Always pass it.
- `-a <N>` — attenuation limit in dB. **This is the setting that bites you.**
  The default (100, i.e. "no limit") and even a "moderate-sounding" 25 both
  **gated real speech to near-silence** during quieter delivery on this
  footage — confirmed by generating waveform images (`showwavespic`) of the
  original vs. denoised audio side by side: continuous speech-shaped signal
  in the original, dead flat in the denoised version for the same stretch.
  **`-a 10` (or lower) fixed it** — real, audible noise reduction without
  eating the voice. Don't trust your ears if you don't have them (agent
  context) — trust a waveform image, which you can actually read.
- **Denoise the exact segment you're about to use, not the whole source
  clip up front.** Whole-clip-then-slice-a-piece-out needs the slice's
  in/out recomputed against the denoised file's own (slightly shorter —
  DFN's STFT framing drops ~30ms) duration, via `apad`/`atrim` guesswork.
  Any error there is an audio/video **drift** that surfaces as "captions
  aren't lined up with the words" even though the caption *timestamps* are
  correct — the audio just doesn't start where you think it does anymore.
  Cut the segment first (`-ss in -t dur`, matching your video trim exactly),
  denoise *that*, then `apad,atrim=0:dur` to force it back to the exact
  target length. Nothing to reconstruct, nothing to drift.

## 3. Frame-exact word-level English captions from non-English speech

whisper.cpp's **translate task** (`-tr`) with **word-level timestamps**
(`-sow -ml 1`) gives real per-word English timestamps **directly, in one
pass** — no separate transcribe-then-align-then-translate pipeline needed:

```bash
main.exe -m ggml-medium.bin -f audio16k.wav -l auto -tr -oj -of out -ml 1 -sow -nt
```

Output JSON's `transcription[]` array has one entry per **word** (not
sentence) with `offsets.from`/`offsets.to` in ms, already translated to
English, aligned to the source audio via cross-attention (same class of
technique as WhisperX's forced alignment — validate directly if you have
WhisperX installed and time, but don't assume you need it just because it's
the more famous name).

**Group words into readable cues, don't display them one at a time and
don't trust unedited phrase-length segments either.** Rules, in order:
- 2-4 words per cue.
- Break before a word if the running cue already has 4, or the gap since
  the previous word exceeds ~0.6s (a real pause), or the previous word ends
  in `.?!` (a finished sentence — **always** start fresh after one).
- Never leave a cue ending on a bare glue word (a/the/to/of/in/is/my/you/
  it/for/with/...) if a following cue exists to absorb it — **except** when
  that word actually carries terminal punctuation. "...I love you." ending
  on "you" is a complete, correct sentence; merging it forward into the next
  cue ("you. I hope to see") because "you" is in the glue-word list was a
  real bug — check for `.?!` before applying the anti-dangle rule.
- Clamp any single word's own display life (~1.2s) — whisper sometimes
  stamps a word's end deep into the following silence.
- A cue's on-screen window is `[first_word.start, last_word.end + small
  pad]`, clamped so it never runs into the next cue's start.

**Watch for whisper giving up mid-clip.** On a language switch it sometimes
emits a literal `[SPEAKING HEBREW]`-style annotation instead of translating
— and can **split that annotation across two word tokens** ("[SPEAKING" /
"HEBREW]"), so a naive `/\[.*\]/` filter on each token individually misses
it and the literal bracket text leaks into a caption. Track bracket-open/
close **state across tokens**, not per-token. If it happens on a clip you
need, retry with an explicit `-l <lang>` instead of `-l auto` — language
auto-detect flipping mid-clip is the likely trigger, and forcing the
correct language recovered a full accurate translation where auto-detect
had bailed.

**Trim points must land on real word boundaries**, not round numbers you
picked while skimming the transcript. Cutting into the middle of a word's
`[start,end]` span chops its audio and can leave the *next* word's first
syllable as an orphaned one-word caption. Pull the actual per-word JSON,
set `in`/`out` to a word's exact `start`/`end`, and check both the cue
before your `in` and after your `out` aren't left half-included.

## 4. Verify the picture, not just the transcript

**A word's timestamp being technically present is not proof the moment is
usable on camera.** Caught this the hard way: picked a subject's literal
closing line from word-level timestamps that happened to be degenerate
(whisper's alignment had collapsed near that clip's tail — several words
all stamped with the same timestamp). Trusted the numbers anyway, built the
close around them — and when the actual video frames for that span were
finally pulled and looked at, the subject had already walked out of frame
seconds earlier. The line was real; the picture wasn't there anymore.

**Rule: before locking any beat's out-point (especially a clip's tail, or
anywhere the word timestamps look suspiciously repetitive/collapsed), pull
2-3 actual frames from the raw source at that exact timecode and look at
them.** Don't decide from the transcript alone. This is slower than trusting
the JSON but it's the only way to catch a subject having left frame, a hand
covering the lens, a reaction that isn't what the words alone suggest, etc.

## 5. Color: measure, don't eyeball, and don't grade proxies

`ffmpeg -vf "signalstats,metadata=print" -frames:v 1 -f null -` (info
loglevel, not `error` — the metadata prints at info level) dumps real
`YAVG`/`UAVG`/`VAVG`/`SATAVG` for a frame. Sample one representative frame
per clip and compare:
- If `UAVG`/`VAVG` (chroma balance, 128 = neutral) are all close together
  across clips, white balance is already consistent — don't touch it.
- If `YMIN`/`YMAX` span close to the full 0-255 range, the footage is
  standard Rec.709 SDR, not LOG — no LUT/conversion step needed.
- Nudge only clips whose `YAVG` sits meaningfully off the group's mean
  (`eq=brightness=<small decimal>`, roughly `delta_levels/255`). Leave
  clips within a few levels of the mean alone.
- A **uniform** light contrast/saturation lift (each under +2%, applied the
  same to every clip) reads as "consistent and a little polished." Even
  "light" +4-6% starts to look like an applied filter rather than clean
  footage — keep it lower than feels like enough, then check a still.

## 6. Music that moves with the edit

A single flat gain under the whole track reads as "background music," not
scoring. Build a **stepped volume envelope** keyed to the edit's own
absolute cut points (quiet under a cold-open hook and light beats, fullest
under the emotional anchor, back down for the outro) via ffmpeg's `volume`
filter with a `t`-based nested-`if` expression and `eval=frame`:

```
volume='if(lt(t,4.2),0.10,if(lt(t,16.6),0.12,if(lt(t,66.4),0.26,0.12)))':eval=frame
```

Escape internal commas (`\,`) since this sits inside a larger
`-filter_complex` chain. Abrupt level changes timed to land ON a cut read as
intentional "hits," not glitches — smoothing every boundary isn't necessary.

## 7. Hook-first, single-story editing (the format, not just the pipeline)

When asked for "the best possible cut" instead of a batch of variations,
this recipe (validated against a dhar.mann-style reference and Tal's
explicit brief) beats a chronological multi-person compilation:

1. **Cold open on the single strongest line from your strongest subject**,
   no title card eating the first 1-3 seconds — straight into the hook.
2. **A fast visual answer to the hook** (what is this, who's doing it) —
   2-3 seconds, not a full re-explanation.
3. **Light/warm beats from secondary subjects**, aggressively trimmed to
   one tight line each — range and pacing before the weight arrives.
4. **A deliberate mirror/contrast beat** if the footage has one (someone
   whose situation rhymes with or inverts the anchor's) placed right before
   the anchor's full payoff — it sharpens the anchor by contrast.
5. **The anchor subject's full moment, replayed with complete context** —
   yes, the hook line plays again here; that's the payoff, not a repeat.
   This person gets more screen time than everyone else combined.
6. **A wordless close** — no CTA, no final caption competing with the
   emotional beat. Let the picture and the music resolve it.

Cut everyone-but-the-anchor hard. "We filmed it" is not a reason to keep a
clip in a story-first cut — only "it earns its seconds" is.

---

## 8. Fast-cut montages break two of our own verification tools

Learned building the Abraham Accords piece (Sept 2026, 19 beats in 70s,
trilingual captions). Everything above still holds; these are the things
that only show up once beats get **short**, and two of them are the kind of
failure that reports success.

**`verify-captions.py` silently skips its text check under 8s per clip-run.**
`MIN_TEXT_CHECK_SPAN_S = 8.0` — spans shorter than that are dropped as
unverifiable, because an isolated short span can't be re-transcribed
reliably. With 19 beats of 1.5-8s, *every* span was dropped, and it still
printed `PASS` alongside a medium-severity `verification_failed: No span
could be transcribed`. **A PASS there proves timing only.** Read the
findings list, not the headline. On a fast-cut piece, verify wording some
other way (per-beat, against the full-clip alignment) and say plainly that
wording was checked separately.

**Re-aligning a short trimmed segment produces garbage — this is the §2/§3
context-loss bug wearing a different hat.** A per-beat verification pass I
wrote re-ran the aligner on each finished beat file and reported two
"captions over silence." They weren't real: on an 8.15s Spanish beat the
re-alignment had crushed all the speech into the first 4.5s (implying ~12
syllables/sec, physically impossible), so the late cues looked like they sat
over nothing. **The full-clip alignment in `cache/aligned/` is the timing
authority. A re-align of a short cropped segment is not evidence and cannot
overrule it.** If you need to confirm, use a model-free measure (RMS
envelope, `silencedetect`) or the full-context alignment — never a second
short-span pass.

Related trap on that same check: our own voice chain (compressor + per-beat
`loudnorm` + master `loudnorm`) flattens LRA to ~2 LU. That's fine, even
desirable, for phone playback — but it means **RMS-based VAD no longer
discriminates speech from beach ambience on our own output.** Energy-based
caption checks lose their power after the audio is finished. Run them on the
pre-chain audio if you need them.

**Start every beat on its first spoken word.** Several v1 beats began
1.4-1.6s before the first caption — a beat opened at 17.30 while the
speaker's first word landed at 17.38 and the first cue at 18.92. That is
1.5s of a person visibly talking with nothing on screen, and it reads to the
client as "the captions are broken on this clip." They aren't; the beat
started early. Tightening all 19 in-points onto real word starts removed
~6s of dead air and fixed the complaint outright. This is the §3
word-boundary rule applied to the *in*-point, not just the out-point.

**Match chroma to the group mean, not to neutral 128** (extends §5). §5's
advice covers the case where `UAVG`/`VAVG` already agree across clips. When
they *don't*, pulling each clip toward 128 neutralises the scene — golden
hour goes grey. Pull each clip toward the **group's own** mean instead
(here: U 124.8 / V 129.5, both meaningfully warm of neutral). The shots then
match each other while the light stays the light that was actually there.
Same logic for luma: correct ~70% of the way to the target, not 100% — a
full correction over-cooks whichever clips sit at the extremes. Measured
result: luma spread 63 → 42 levels, saturation spread 8.3 → 1.9.

Two measurement cautions from the same pass:
- **A fixed "face region" crop is not a face detector.** Cropping the upper-
  centre band to measure skin tone caught *sky* on two clips (high Y, U>128,
  V<128 — unmistakably not skin) and would have driven a bad correction.
  Either detect properly or fall back to full-frame plus your eyes.
- **Never judge a beat from a single frame.** A contact sheet sampled at
  0.6s into every beat made Tal's own intro look like the weakest shot in
  the set — head down, mid-motion. Sampling that clip across its length
  showed he flips each country's flag as he names it, ending on the Israeli
  flag. One frame nearly cut the best-designed shot in the piece.

**Cap English caption lines at ~34 characters.** At 82px/800 weight with
62px side padding, roughly 20 characters fit per line. Anything much past
34 wraps to three lines, and three lines of English plus two translation
rows climbs over people's faces — caught in a snapshot, not in code. Split
the long ones into two cues on real word boundaries; it raises the cut rate,
which a fast piece wants anyway.

**Assert each caption field contains its own script.** On a trilingual cut
it is genuinely easy to type Hebrew characters into an Arabic line — I did,
and it shipped to a render. A three-line check over the build-emitted cue
list catches it instantly: Hebrew field must match `[֐-׿]` and
contain no `[؀-ۿ]`, Arabic the reverse, English must contain Latin
and neither RTL range. Run it as part of the build, not as a review step.
