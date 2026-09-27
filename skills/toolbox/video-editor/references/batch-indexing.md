# Batch indexing — index a shoot once, generate many videos

For a folder of ~300–400 raw Meta-glasses clips. Think **interactions + moments +
stories + reactions + b-roll**, not "400 videos". Index once → every reel is a
cheap edit-JSON over the moment library.

## Run order

```
npm run index   -- "<folder>" --slug <shoot> --model medium --frames 5
npm run group   -- --slug <shoot> --gap 120
npm run moments -- --slug <shoot>
node scripts/extract-reactions.mjs  --slug <shoot>     # reaction beats
npm run summary -- --slug <shoot>
node scripts/make-compilations.mjs  --slug <shoot> --clean
```

Then, per video the user asks for:

```
npm run search  -- --slug <shoot> "person receiving flowers" --kind greeting
# → pick MOMENT ids, write edit.json
npm run reel    -- --slug <shoot> --spec edit.json
# → register in Root.tsx, preview stills, fix, render
```

`index` is **resumable** (skips clips already in the DB; `--force` to redo). It
**never modifies source files** — clips are hardlinked into `public/footage/<shoot>/`.
Everything lands in one SQLite file: `public/footage/<shoot>/library.db`.

## What `index` does per clip

1. **ffprobe** — duration, dims, fps, filename-timestamp / mtime, order.
2. **whisper.cpp `medium`** (multilingual, auto-detect language, hotwords:
   Shalom / Shabbat Shalom / Salam / Salam Alaikum / Marhaba / Toda / Yalla /
   Israel / Jaffa / Tel Aviv / Jerusalem) → transcript + word timings +
   speech regions.
3. **keyframes** — N evenly-spaced JPEGs into `frames/`.
4. **CLIP embedding** per frame (Transformers.js, local) → 512-d vector in the DB,
   plus a cheap top visual tag against a moment vocabulary.

## Interaction grouping (`group`)

Consecutive clips become one **INTERACTION** when the time gap ≤ `--gap` seconds
(default 120), or ≤ 3× that if the transcript clearly continues (≥3 shared
proper-noun/topic words). Each interaction is classified:
`greeting · flowers · restaurant · story · street-q · broll · other`, with a
best-guess `person` (Muslim/Christian/Jewish/Nigerian/…) and `location`
(Jaffa/Tel Aviv/Jerusalem…). **7 clips of one restaurant owner = one INTERACTION.**

## Moment library (`moments`)

Inside each interaction, moments are carved from:
- **speech regions** — one padded moment per region; holds ~0.6 s past the last
  word to catch the reaction.
- **greeting hits** — `findGreetings()` (space-insensitive: catches "shabbat
  shalom" even when whisper writes "sh abb at shal om").
- **CLIP frame tags** — action (`hug`, `handshake`, `giving flowers`, `showing
  food`, `walking`…) and reaction (`smile`, `laugh`, `reaction`).
- **silent visual moments** — a strong CLIP hit (hug / smile / handshake / food
  closeup) with **no speech in that window** still becomes a moment. Silence is
  not delete — the best beat is often after the sentence.

Each `MOMENT` row: `id, interaction_id, clip_id, in_s, out_s, speech, action,
reaction, person, tags[], visual_quality, audio_quality, energy, clean_start,
clean_end, score`.

## Reaction beats — the moments between and after the words

**The best part of this footage is usually not the sentence, it's the half-second
after it.** `extract-reactions.mjs` makes those first-class, editable beats in a
`reactions` table. Three sources, none of which need vision to be right:

- **after-line** — the window right after a key phrase *ends* (the reaction to
  "I'm Jewish", to a greeting, to "where are you from"). Pure word timings.
- **echo** — they say the greeting *back* (2nd occurrence of the phrase in a clip).
- **gap** — silent pauses ≥1.2 s between speech regions.

CLIP then only **ranks** those candidates across smile / laugh / hug / handshake /
high-five / arm-around / waving / surprised / group-smiling.

**Rule: placement is trusted, the `kind` label is not.** Verified against
keyframes — a top-ranked handshake was real, a top-ranked "group smiling" was a
couple on a bench with no clear smile. So reaction beats **carry no on-screen
caption**, and `kind` is a sort key only. That is also the better edit: silent
human moments are connective tissue, not another line of text.

Use them two ways:
1. **Reaction-only reels** — `smiles`, `laughs`, `hugs-handshakes`,
   `human-moments`. Each variation opens on a different kind (a laugh, a hug, a
   handshake, a group smile).
2. **Interleaved** — dialogue from one person, reaction from **another**:
   `line(A) → reaction(B) → line(C) → reaction(D)`. Straight
   question→answer→question→answer is flat; cutting to a different person's
   smile between lines is what makes it feel human.

## Phrase-anchored beats

Indexed moments are often 20-50 s because one speech region holds a whole
exchange. `scripts/lib/phrase.mjs` finds an anchor phrase in the word timings and
cuts a tight 3-11 s window around it — that's what makes many-people
compilations possible. **Caption from the anchor onward**, not the window start,
or you caption the run-up ("I'm sorry to bother") instead of the line.

## FIRST BATCH OUTPUT (`summary`)

Writes `public/footage/<shoot>/SUMMARY.md`:

```
TOTAL CLIPS / INTERACTIONS (by kind) / GREETING MOMENTS / FLOWER MOMENTS /
STRONG REACTIONS / HUGS+HANDSHAKES / USEFUL B-ROLL / LANGUAGES
BEST STORIES · BEST GREETINGS · BEST REACTIONS · BEST FLOWER MOMENTS · BEST B-ROLL
POSSIBLE VIDEO IDEAS + suggested variations
```

Show this to the user first; let them steer.

## Search (`search`)

Hybrid: CLIP cosine of the query text vs every frame embedding + transcript term
overlap + moment score. `--kind` filters to an interaction type. Returns ranked
MOMENT ids with clip, in/out, action/reaction, speech snippet, and the keyframe
JPG to eyeball. This is what makes it **not transcript-only** — "person laughing",
"beautiful food shot", "street in Jaffa" work without those words in the audio.

## Variations = edit-JSON (`reel`)

Every edit is structured data first:

```json
{
  "name": "greeting_salam_first_v4",
  "title": "SAYING SALAM TO STRANGERS 🌙🇮🇱",
  "titleVariant": "pill",
  "uppercaseCaptions": true,
  "target_duration": 18,
  "strategy": "Salam first, alternate Muslim/Jewish, strongest reaction last",
  "moments": [
    { "moment_id": "MOMENT_0051", "caption": "Salam alaikum" },
    { "moment_id": "MOMENT_0102", "in": 1.7, "out": 4.0 },
    { "moment_id": "MOMENT_0088" }
  ]
}
```

`in`/`out` override the moment's span (absolute seconds in the source clip);
`caption` overrides the transcribed speech. `reel` resolves moments → a `<ClipReel>`
(multi-source `<Series>` of `<Video trimBefore>`) + `<TitleCard>` + `<Captions>`,
writes `src/compositions/<shoot>/<Name>.tsx` + `.data.json`, and records the spec
in the `edits` table (usage tracking). Then register, preview stills, fix, render.

Ten greeting variations = ten small edit-JSONs over the **same** library:
Shalom-first, Salam-first, strongest-reaction-first, alternate identities,
10 s / 15 s / 30 s, only-greetings, greetings+smiles+hugs, different hooks.

## Audio-safe cutting on final clips

Before rendering a variation, tighten the chosen moments' boundaries with the
`clean-cuts.md` procedure — and, where Python is available, **whisperX** word
alignment + **silero-vad**. Protect first/last consonants, word tails, breath.
Never join fragments from two takes into one word. If unsure, **cut later**.

## Restaurant / story interactions

Do NOT montage. Take the whole grouped INTERACTION, understand the story, keep the
person's **strongest complete answer**, cut repeated questions / duplicate answers
/ false starts / boring stretches. Find: hook, who they are, the history, a
personal line, the food, an emotional close. See `formats/restaurant-owner.md`.
