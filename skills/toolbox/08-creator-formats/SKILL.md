# 08 — Creator Formats

Two vertical formats, reverse-engineered from **measured** samples. Load when a
video needs more structure than the house street-interview cut.

- **FORMAT A — Narrated cut** — a script / VO cut to picture. One person's
  words drive the edit; every beat gets a visual. One format on a **density
  dial**: the calm end (NAS Daily explainer, ~22 cuts/min, POV) and the
  relentless end (movement / launch film, ~41 cuts/min, talking-head) are the
  *same recipe at different speeds* — same caption system, same
  every-beat-a-picture rule, same device kit, same 4-act arc.
- **FORMAT B — One-take** — a performance left alone. No cuts.

**Structural recipes only.** No footage, music, graphics, or logo from any
reference is reused (CLAUDE.md §1). We copy *format*, the way every creator does.

### How this was measured

Downloaded the references, `ffmpeg` scene-detect -> shot lengths, `ffprobe`
duration, whisper `medium` for speech pace, contact sheets read as images. Raw
data: `scratch/refs/*/_measure.json`, `scratch/refs/sa/ref/study/`. Never
watched them play — no claim rests on motion.

---

## FORMAT A — Narrated cut (script / VO -> picture)

**Use for:** anything where one person's script or VO carries the video — a POV
explainer, a founder / movement launch, a talking-head mini-documentary, an
advocacy reply. **Not** a street conversation (house style) and **not** an
unbroken performance (Format B).

### The density dial

| | **Calm end** (NAS explainer) | **Fast end** (launch / movement film) |
|---|---|---|
| Measured from | 10 NAS Daily verticals, 477K-6.8M views | Tal's `MONTANA TUCKER V3` (181.5 s) + 2 advocacy replies |
| Duration | 64-178 s (median **157 s**) | ~180 s |
| Shots | median **62** | **136** |
| Median shot | **2.4 s** | **1.33 s** |
| Cuts / min | **~22** (16-27) | **~41** (advocacy replies: 21-31) |
| Under 1 s / under 2 s | 15 % / 47 % | **43 % / 79 %** |
| Longest shot | 10.5 s | 6.8 s (only the first, establishing) |
| Speech pace | **132 wpm** (slower than the 150-160 conversational norm — deliberate) | same |
| Talking-head share | ~40 % (POV hands-to-lens) | ~50 % (walk-and-talk spine, never off screen > 3-4 s) |

**Pick the density by content, not excitement.** Dense fact stack or an
emotional movement pitch -> fast end. A single reveal / payoff that needs room
-> calm end. NAS's own fastest cut ("Israeli hospital", 27/min) is its densest;
its slowest ("Jesus Lake", 16/min) is its most emotional. NAS is **not** making
1-minute videos any more — the 2026 verticals run 2.5-3 min.

### The rule that never changes

**Every caption beat gets its own picture** (CLAUDE.md §2.1). If the line says a
number, the number is on screen. If it names a place, the place is on screen.
No establishing shots, no filler montage. Calm end: ~one cut per **6 spoken
words** (132 wpm / 22 cuts/min). Fast end: ~one cut per **1-2 words**.

Write the VO first, break it at that cadence, assign a picture to each fragment.

### Caption system (the shared signature)

- **Bottom third**, y ~ 0.76 — not mid-frame. White, heavy (~800), sentence
  case, **no outline** — a soft drop shadow separates it.
- **Group size scales with density:** calm end 4-6 words / 2 lines; fast end
  **1-2 words**, swapping on every cut.
- **One span per card lit yellow `#FFE21F`** — the payload word: a number, a
  name, the noun the sentence is about (`38`, `2,000`, `Jerusalem`,
  `two nurses`, `IVF baby`, `viral`, `trend`, `humanity`, `kindness`, `more`,
  `stereotypes`). **Static** for the card's whole life, **not** a karaoke
  sweep. **~Half the cards have no lit word** — lighting every card kills it.
- Preset **`projects/_presets/caption/nas_caption.json`**; picker
  **`scripts/lib/emphasis.mjs`** (`pickEmphasis(text)` — matches real choices
  10/15, override by hand when it matters); renderer `highlight:"keyword"` +
  `caption.emphasis: number[]` in `ProjectVideo.tsx`. Fast end: same preset,
  `wordsPerGroup:[1,2]`. Casing survives in `caption.words[]` even though
  `caption.text` is ALL-CAPS — the sentence-case look needs no recaption;
  index emphasis against `words[]`, not `text`.

### The device kit (use as many as the density warrants)

- **D1 — Punch-in cuts on the A-roll.** The talking / POV clip is ONE take, cut
  into pieces, each a different **crop / push-in / reframe** (wide -> chest ->
  face -> hands). Never a plain jump cut — always a scale or position change.
  Calm: a few. Fast: constant. -> `AutoCut` spine + per-segment `PushIn`/crop
  varying `scale` 1.0-1.35 and `objectPosition`.
- **D2 — Reveal / label cards.** Calm end: one centre-frame heavy yellow card
  at the subject reveal (`nas_card.json`, ~2.5 s, used once). Fast end: bold
  yellow all-caps location / label cards for ~0.4 s (`LEBANON`, `ONLY`).
- **D3 — Evidence board.** Warm **paper ground**, **photo-print cards** that
  scale in and stack with shadows, **hand-drawn marker** circles / arrows /
  strike, a **hand-drawn pie**, a **red label-block** 3-beat, a small red
  **date-stamp** chyron. Uses: news-screenshot stacks + a rising counter
  (`1 -> 40 -> DOZENS`, one card red-boxed) on "becomes a trend"; a
  search-results screenshot with one result circled; family photos on
  "grandchild of survivors"; an article screenshot on "every headline". Accent
  strict **blue + gold**. Components table below.
- **D4 — Animated count-ups.** `AnimatedCounter`, yellow/black, ~0.6 s ramp:
  `13,512,499 -> 14M`, `3 BILLION`, accent `66` / `1` / `40`.
- **D5 — Kinetic single words.** A VO word blown up huge, centred, 1 beat:
  `ALL`, `ONLY`, `BREAK`, struck-through `stereotypes`, an end-run where every
  `every X` gets its own ~0.5 s shot with the word yellow. -> `HeroWord`-style,
  `power4` scale-in. **(not built)**
- **D6 — Phone composite.** Phone in hand -> phone-screen feed graphic: a
  scrolling column of post cards, IG-story UI, brand logo bottom-left. Returns
  on "the algorithm". -> build a `PhoneScreen` component. **(not built)**
- **D7 — Fast B-roll library.** Cut in **contrast pairs** (humans <-> conflict)
  for the problem act; **warm runs** (hugs, kids, heart-hands, signs, aid,
  dancing, other creators to camera, a mosaic grid) for the mission act.
  **Burned-in captions / news chyrons on source clips DO NOT MATTER at
  1.3 s/shot** — they read as texture. Stop cropping them out; cut fast.
- **D8 — Light-leak flash** (~0.2-0.4 s) between the acts only — 4-5 times, not
  every cut.

### Evidence-board components (`src/components/evidence/`)

| Component | What it does |
|---|---|
| `PaperBackdrop` | warm paper surface (fibre grain + vignette). Wrap any board scene. |
| `PhotoPrint` | one photo, white matte, drop shadow, tilt, scale-settle entrance. `src`/`at`/`w`/`rotate`/`caption`. |
| `PhotoStack` | 2-5 prints landing in sequence on a loose arc, staggered. |
| `RedLabelBlock` | red rectangle, white bold caps, one word promoted. Wipe-in slam; a 3-beat. |
| `DateStamp` | small red corner chyron over archival ("9 NOVEMBER, 1938"). |
| `HandScribble` | marker `circle`/`underline`/`arrow`/`strike` that draws itself on (wobbly turbulence). |
| `HandPie` | hand-drawn pie reveal: dot -> grows -> gold wedge sweeps -> labels pop -> arrow draws to wedge. |

Palette + `HAND_FONT` (Caveat, via `src/lib/fonts.ts`) in `evidence/palette.ts`.
Frame-driven, deterministic. Demo: **`EvidenceDemo`** in Root.tsx.

### The 4-act arc (music + grade follow it)

| Act | Feel | Music | Visual bias |
|---|---|---|---|
| **1 — problem / question** | tense, accelerating | low drone -> pulse, building | conflict B-roll, evidence-board news stacks, phone feed, red |
| **2 — the turn** | breath, personal | **drops out** on the pivot line, then soft piano | A-roll, personal photos, warm portraits |
| **3 — mission / body** | warm, rising | strings + beat, swelling | hugs, kids, signs, mosaic, counters; a mid-point "turn" line resets attention |
| **4 — the close** | anthemic | full, then button | kinetic word hits, logo lockup, subject to camera + one optimistic line |

Calm end: acts 1-2 compress to a cold open + reveal card; act 3 is the body;
act 4 is the human payoff.

### Worked builds (the beat sheet is per-project; the rest is the format)

- **`montana-social-accords-recipe.md`** — fast end, full build: 8 devices in
  detail, 43-beat shot sheet, asset checklist, Remotion build notes.
- **NAS calm-end beat sheet:** `0:00` cold open (strange image + fact fragment,
  no greeting) -> `0:05` presenter asks the viewer's question -> `0:10` stakes
  -> `0:15` reveal card -> `0:20-end` body (one fact = one shot; numbers get
  their own shot; a place gets a map; faces for human facts) -> `~mid` explicit
  turn line ("So let me get this straight") -> `-0:20` human payoff (a person,
  not a fact) -> `-0:10` one optimistic line + sign-off (Tal's handle, not
  NAS's lockup).

### Pace check after every render

`ffmpeg` scene-detect the output. Fast end: **35-45 cuts/min**, median
**1.2-1.5 s**, >= 75 % under 2 s. Calm end: **16-27 cuts/min**, median 2-3 s.
Slower than its target = wrong.

### Needs, every time

The talking / POV clip + its script or VO; a logo file if there's a brand; and
either an asset folder or a green light to source / generate the non-talking
B-roll (news screenshots — a web screenshot is fine — generic emotional clips,
a mosaic grid). Advocacy replies also want a **continuous cinematic music bed
at ~-14 LUFS, ~4 LU range** — not yet in `proj-render`'s mix.

### Transferring to Tal's own footage

His POV Meta footage matches the calm end's first-person hands-to-lens grammar.
His gap: he has **conversation**, this format needs **narration** — he must
record a VO line per beat or it collapses into a normal interview cut. **Keep
the positivity gate** either way.

---

## FORMAT B — One-take ("one take, one wow")

**Use for:** a moment that carries itself — a dance, a reaction, an unbroken
piece of human behaviour. **Not** for anything that needs explaining.

| Metric | Value |
|---|---|
| Duration | 14-43 s (median 23.5 s) |
| Shots | **1** in 6 of 7 samples |
| Cuts / min | 1.4-4.3 |
| On-screen text | none |
| Camera | locked off, wide, full body, horizon behind |

### What does the work

1. **Cold-open object** — ~1 s of something moving before the human appears.
2. **One unbroken take.** Cutting a performance signals you think it's boring.
3. **Colour separation** — subject never the same colour as the background.
4. **Unexpected public place** — the location is half the hook.
5. **Group entering behind** builds scale without a cut.
6. **Trending audio carries the pacing** — the edit adds no rhythm.

### Transferable to Tal even outside dance

- the 1-second object cold-open before a face;
- **not cutting** a moment that's working — his best beats are "the half-second
  after the sentence, when the face changes" (CLAUDE.md §2.2);
- subject/background colour contrast when choosing a take.

---

## Choosing

| The material is... | Format | Notes |
|---|---|---|
| One person's script / VO carrying the video (POV explainer, launch film, talking-head doc, advocacy reply) | **A — Narrated cut** | pick the density: calm ~22/min or fast ~41/min |
| A single unbroken human moment | **B — One-take** | cutting it would kill it |
| A street conversation (Tal's default) | **house style** | `tal_caption` + white pill title, held faces |

**Never apply Format A's cut rate to a street conversation** — Tal's interviews
live on held faces; it would shred them. The house style stays the default.

---

## Files this skill ships

| Path | What |
|---|---|
| `projects/_presets/caption/nas_caption.json` | narrated-cut caption style |
| `projects/_presets/title/nas_card.json` | calm-end centre reveal card |
| `scripts/lib/emphasis.mjs` | auto key-word picker (`pickEmphasis`) |
| `src/components/ProjectVideo.tsx` | `highlight:"keyword"` + `caption.emphasis` |
| `src/components/evidence/*` | evidence-board components (D3) |
| `src/compositions/evidence-demo/EvidenceDemo.tsx` | showcase composition |
| `montana-social-accords-recipe.md` | fast-end full build recipe |
| `reference-analysis/*.md` and `scratch/refs/*/_measure.json` | measured tables + raw data |

## Verified

`nas_caption` applied to `v02-morocco-a`, stills rendered and inspected: yellow
static emphasis on `Salam` / `Morocco?` / `Japan` / `Israel`. Emphasis picker
matches real NAS choices 10/15. Evidence components rendered via `EvidenceDemo`.

## Still open

- Continuous music bed (-14 LUFS, ~4 LU range) not in `proj-render`'s mix.
- `PhoneScreen` (D6) and yellow `HeroWord` (D5) not built.
- Evidence components not wired to a `project.json` track (add `graphics`/`overlay`).
- More Montana reels blocked on IG rate-limit — see [[montana-social-accords-edit-style]].
