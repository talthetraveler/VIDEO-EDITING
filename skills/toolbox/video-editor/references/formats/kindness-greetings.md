# Kindness-greetings reel ("Shabbat Shalom / Salam alaikum the strangers")

**What it is:** he walks up to strangers — often people from a different
background than the assumed one — greets them warmly (`Shabbat Shalom`,
`Salam alaikum`, `Marhaba`, `Shalom`, `Peace`), has a short warm exchange,
often a handshake or hug, then moves to the next person. The whole point is
**spreading kindness**. He wants **many variations** cut from one shoot.

Reference video: `talthetraveler` — "I love Israel for the people. What about
you?" (May 31), and the "MEETING A …/POV: I WENT TO …" series.

## What to keep / what to cut

**KEEP:**
- The greeting moment itself — him saying `Shabbat Shalom` / `Salam alaikum` /
  `Marhaba` / `Shalom` / `Peace` to someone, and their reply.
- Warm reactions — smiles, laughs, "welcome", "God bless", handshake, hug,
  someone returning the greeting.
- One or two sentences of genuine exchange max per person. Land on the warm beat.
- A short hook line if he sets it up ("I'm going to say Shabbat Shalom to
  strangers in…").

**CUT:**
- Walking / searching / dead air between people.
- Retakes, stumbles, "wait let me do that again", filler ("um", "so", "like").
- Him explaining to camera for more than one sentence.
- Anything awkward, flat, or where the stranger is uncomfortable — kindness only.
- Long pauses after the warm beat — cut on the smile.

## Structure of one reel (15–35 s)

1. **Hook** (0–2 s) — `<TitleCard>`: `SAYING SHABBAT SHALOM TO STRANGERS 🇮🇱`
   (cream/gold, upper). Or cold-open straight into the first greeting.
2. **3–6 greeting beats**, hard cut between people, ~2–4 s each. Fastest, warmest
   ones first and last.
3. **Optional end card** — one line + follow CTA (see `house-style.md`).

Make **several variations** from the same folder: e.g. "all the Muslims I met",
"all the reactions", "the hugs", "people from 10 countries", a 15 s tight cut and
a 30 s one. Same footage, different selections and orders.

## Captions

Per `house-style.md`: white bold, **vertically centred**, drop shadow, no box,
1–4 words, fast swaps. Sentence-case by default; `<Captions uppercase>` if
matching an older ALL-CAPS reel. Keep the greeting word itself on screen
(`SHABBAT SHALOM` / `SALAM ALAIKUM`) — emphasise it in cream/gold via
`<Captions emphasize={/shabbat|salam|shalom|marhaba|peace/i}>`.

## Build path (this repo)

1. **Batch-transcribe the folder:**
   ```
   npm run tighten -- --batch <folder> --slug shabbat-strangers --model small.en
   ```
   Runs every clip → per-clip `keep.json` / `captions.json` / `captions.raw.json`
   / `cut.log`, plus **`public/footage/shabbat-strangers/shabbat-strangers.index.json`**
   listing every clip's transcript, kept spans, and **greeting hits** with
   timestamp + surrounding context. Detection is space-insensitive
   (`GREETING_TERMS` in `scripts/lib/autocut-core.mjs`): `shabbat shalom`, `salam
   alaikum` / `assalamu alaykum`, `shalom`, `salam`, `marhaba`, `ahlan`,
   `habibi`, `peace be with you`, `god bless you`, `welcome`, `kindness`,
   `spread love`. Add terms there as needed.
2. **Read `<slug>.index.json`.** For each reel variation, pick greeting beats
   across clips and write a selection JSON:
   `{ fps: 30, beats: [{ src, startSec, endSec, caption? }] }`.
3. **Build the reel composition** — a `<Series>` of `<Video src={staticFile(beat.src)}
   trimBefore={startSec*fps}>` (`durationInFrames = (endSec-startSec)*fps`), with
   `<TitleCard>` on the hook and `<Captions>` (centred, `emphasize` the greeting
   word in cream/gold). This is the same shape as `<AutoCut>` but sourced from
   multiple clips — generalise `AutoCut` or add a small `<GreetingReel>`.
4. Preview stills → fix weak beats → `npm run render <Comp> output/shabbat-strangers-vN.mp4`.

## Spec status

The exact on-screen caption timing style of the original "Shabbat Shalom" reel
couldn't be watched (IG blocks video in the automation browser). Style is taken
from his other reels — confirm against the real video on his phone if a detail
matters.
