# "Call someone you love" / leave-a-message phone-booth reel

**What it is:** a public phone-booth rig (a fixed table + an old corded phone +
a sign — "CALL SOMEONE YOU LOVE" / "LEAVE A MESSAGE FOR SOMEONE YOU MISS") sits
in a public place; a stranger picks up the handset and leaves an unscripted
message for someone they love or miss. **This is a FULL STORY format, always
one subject, never a compilation** — the whole point is following one person's
message start to finish.

Studied 2026-09-12 from two real examples (Tal-supplied, measured not vibed —
see `07-cinematic-reference`'s worked-examples entry for the exact numbers):
Tal's own Damascus Gate "CALL SOMEONE YOU LOVE" rig (single continuous 45.8s
take, one man calling his daughter) and a "Hope Wins" branded episode (rig
carried in, sign flips to reveal "LEAVE A MESSAGE FOR SOMEONE YOU MISS," one
woman, 44.9s, starts light then turns into a message about a loss). Same
underlying recipe as `dhar.mann`'s version, already recreated once in
`projects/call-someone-you-love/`.

## Structure (40–60 s, one continuous story)

1. **Cold open on the rig itself** — the sign, the phone, the setup being
   carried in or already standing. No title card eating this beat; if a title
   card is used at all it's a quick pill over the rig, not a full-screen delay.
2. **The pickup + a short identity line** — "It's your mom," "Hi Penelope,
   it's your mom." 2–5 words, establishes who's calling whom instantly.
3. **The message builds** — starts conversational/light (small talk, a
   specific concrete detail — a bed, a routine, "380 days") before it turns
   emotional. Don't force the heavy line first; the specificity is what makes
   the payoff land, not a generic "I love you" cold open.
4. **The emotional core** — the "I love you / I miss you" lines, delivered
   plainly. This is the anchor; give it more time than the setup.
5. **Wordless close** — subject hangs up, sets the phone down, walks off. **No
   CTA, no final caption competing with the moment.** Both studied examples
   end exactly this way — let the picture resolve it.

## Captions — the one rule that matters most

**Captions are silent during pauses. Never held over dead air, never
generated to fill a gap.** Measured directly in both examples: real pauses in
the subject's delivery (1.2–5.4 s each) get zero caption. This is why the
pauses read as someone actually feeling the words, not as a stall or a caption
bug. Do not smooth this over by stretching the previous cue's display window
to bridge the silence — let the screen go caption-free.

Style: white sans-serif, no stroke/heavy box (a soft drop shadow is fine),
phrase-grouped 2–6 words, roughly `y=0.65–0.7` (clear of the subject's face,
above the rig's own sign if one is in frame). Per `04-captions-and-typography`
for the grouping mechanics (glue-word/terminal-punctuation rules, word-exact
timestamps from `whisperx-align.py` on the FINAL edited audio, never
estimated).

## Audio

- **Music is optional, not mandatory.** One studied example (Tal's) has a
  clear, quiet, sad-toned bed under the dialogue (confirmed via spectrogram,
  not assumed) — see the stepped-envelope technique in
  `ffmpeg-audio-caption-pipeline.md` §6 if adding one. The other relies on raw
  ambient street sound with no detectable score and still works — the human
  voice and the real pauses are enough. Don't default to "needs music."
- **Loudness target: -14 LUFS integrated.** Confirmed against a real,
  already-successful example in this exact genre (measured -14.28 LUFS,
  true peak -0.03 dBTP — hot, near the ceiling, on purpose). Tal's own
  Damascus Gate sample measured -19.7 LUFS despite being held up as a quality
  bar — even a good cut can be under-levels; always run `tools/qa-check.py`'s
  loudness check before calling a cut from this format done.
- Do NOT over-denoise. Street ambience is part of the format's authenticity —
  see the standing over-denoise rule.

## Build

From raw clips of one interaction (the phone-booth rig, one continuous
subject): this is a single-take or near-single-take edit, not a multi-clip
assembly like `restaurant-owner.md`. Minimal cutting — trim the approach/setup
if it drags, protect the full message intact. If building from the
`recreate.mjs` pipeline against one of these two videos as `--reference`, its
extracted beat map/pacing numbers apply; if building by hand, follow the
structure above directly. `projects/call-someone-you-love/build.mjs` +
`spec.json` are a working reference implementation (rotate sideways source,
frame-exact captions, DeepFilterNet denoise, signal-measured color, stepped
music envelope) — see `ffmpeg-audio-caption-pipeline.md` for the full
technique writeup.

## Variations from one raw set

Multiple people used the same rig on the same shoot day → multiple candidate
full stories, not one compilation. Score each subject's take independently
(story depth, a concrete specific detail, whether the pause-then-emotional-
turn is genuinely there) and cut the 1–3 strongest as separate FULL STORY
pieces, same as any other full-story batch (§2 of the master `CLAUDE.md`) —
do not chop several people's calls into one montage; that's a different,
weaker video than what makes this format work.
