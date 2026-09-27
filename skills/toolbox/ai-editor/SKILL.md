---
name: ai-editor
description: Tal's normal editing workflow — analyze ALL raw footage, find the stories, cut the strongest moments, make 1–2 smart variations per interaction, add speech-only captions, write a short POV title, show low-res previews, learn from every edit he makes, then publish approved full-res masters via the ShortSync API (trial reels / main posts / scheduled). NOT the Instagram reference-template system.
---

# AI Editor

> RAW FOOTAGE → UNDERSTAND STORY → FIND BEST INTERACTIONS → PICK BEST MOMENTS
> → 1–2 SMART VARIATIONS → SPEECH-ONLY CAPTIONS → STRONG TITLE → PREVIEW
> → LEARN FROM FEEDBACK → APPROVE → FULL-RES EXPORT → SHORTSYNC (trial / main / scheduled)

**Editing quality and story selection are the most important part. Never
sacrifice storytelling to automate the workflow. Never auto-publish.**

## 0. THE PROVEN RECIPE — approved 2026-09-07 (priest-01, bakery-hookB)

Tal/Greta signed off on these two. Follow this sequence for any single-person
story from a vetted seed; the sections below are the detail behind each step.

```bash
# A — natural cut
node scripts/proj-new.mjs --slug meta-shoot --name <name> --from-full <SEED> \
     --brief "..." --title "MEETING A/AN <identity> IN ISRAEL 🇮🇱"
# B — hook-first (optional, only if a genuinely different structure exists)
node scripts/proj-new.mjs --slug meta-shoot --name <name>-B --from-full <SEED> \
     --hook <MOMENT_ID> [--hook-in <s> --hook-out <s>] --brief "..."

node scripts/proj-recaption.mjs <name>          # whisper medium + punctuation → phrase captions
node scripts/proj-render.mjs <name> --scale 0.5 # gentle denoise on by default
#   → send the low-res preview, wait for approval, THEN proj-confirm + --final
```

What that gives you, and why it's the approved look:
- **Captions** `tal_caption`: white + one gold `#FFE21F` word at a time
  (karaoke), outline **behind** the fill (`paint-order`), speech-only, 2–3 word
  phrases broken on meaning — never end on a glue word, question kept off its
  answer, thesis lines split on their commas.
- **Opens on speech** — the first clip is lead-trimmed past a faint/distant
  walk-up ("hey excuse me" over you walking) to the first real connected line.
- **Title** — white pill, black caps, pinned top; real Twemoji flags via
  `<EmojiText>` (🇮🇱 no longer renders as "IL").
- **Audio** — gentle cleanup (rumble/hum out, street left in), system ffmpeg.
- **Nothing publishes** until Tal approves the preview.

## 1. Captions — SPEECH-ONLY (the rule that broke and was fixed 2026-09-06)

The transcript decides exactly when a caption appears and disappears.

- A caption is on screen **only while someone is speaking those words**.
- **No caption during** silence, pauses, reaction shots, B-roll, cuts, or any
  moment nobody is talking. The instant the speaker stops, the caption is gone.
- A pause > ~0.5s inside a phrase **splits** it — a caption never spans a pause.
- A single word can't hold longer than ~0.9s (whisper stamps some word ends
  deep into the following silence — clamp it).
- Natural phrases, **2–3 words**, broken on MEANING (`caption_words_per_group`).
  Word-level timing is for precision, **never one-word display**. A card must
  never end on a glue word (the/a/to/of/in/is/and…), never split "the / best"
  or "in / Israel", never glue a question onto its answer, never strand a lone
  word. The grouper enforces this (glue-trail guard, sentence-starter breaks,
  dangling-word merge).
- **The library `words` table has NO punctuation** (indexed with a model that
  stripped "." "?" ","), so the grouper can't see clause boundaries and phrasing
  stays rough. **Fix per project:** `node scripts/proj-recaption.mjs <name>` —
  re-runs whisper `medium` (punctuated) on just that project's clips, caches to
  `scratch/recap/<slug>/`, rebuilds the caption track from real sentences.
  `proj-new` / `proj-op` auto-prefer that cache once it exists; run it before
  the final master. (`retranscribe.mjs` now also keeps punctuation for the DB.)
- Style: **`tal_caption`** (default) — verified across 5 of Tal's reels. WHITE
  bold caps, **one word gold `#FFE21F` at a time (karaoke)** advancing with
  speech, heavy black stroke (~7px), no box, lower-middle **y ≈ 0.67**.
  `tal_caption_lower` is the identical system in sentence-case (italian, donate
  references). Case is a **toggle** (`caption_uppercase`, weak default `true` —
  4/6 refs). Don't change the rest of the style unless he says so.
- **No `@handle` watermark burned in** — none of his references have one
  (`burned_handle_watermark: false`).

Engine: `scripts/lib/caption-group.mjs` (`gapSplitSec`, `maxWordSec`,
`wordsPerGroup`, `uppercase`, `turnGapSec`; `GLUE_TRAIL` / `STARTER` sets).
`proj-new` groups **per video clip** so no group spans a cut and no boundary
word is lost.

## 2. Titles — short POV framing

Short, simple, visual, explains the situation while scrolling. Use POV framing,
identity, location, flags/emoji when it helps. Don't overcomplicate.

Three templates seen in his references (most common first):
1. `MEETING A/AN <identity> <flag> IN ISRAEL <flag>` — police officer, italian, selena
2. `POV: I WENT TO A <place> OWNED BY A <group> IN ISRAEL` — bakery
3. `<GERUND ACTION> FROM ISRAEL TO <place>` — west bank (+ optional `PART 1`)

Style preset `tal_top_title`: white rounded pill, BLACK bold caps, **pinned hard
to the top, y ≈ 0.08** (the old 0.24 was wrong). Our font (Inter). The **text is
always Tal's** — AI only suggests when blank (`proj-new` guesses a line from the
brief), he edits with `set_title_text`, and the system learns the kind he keeps.

- **Hold** is not fixed (`title_hold` / `--title-hold`): `hook` ≈ 6s (drops
  after the setup — selena), `long` ≈ 17s (italian), `persist` = whole video
  (west bank). Default `hook`.
- **`none` is a valid choice** — eilat and donate run no title at all and let a
  spoken premise / ask be the hook.
- `time_jump` preset — plain no-pill caps ("2 HOURS EARLIER..") for a flashback
  after a peak-moment cold open. `part_label` — small red "PART 1" accent under
  the pill for a series.
- (Emoji note: ☪ renders monochrome and 🇮🇱 falls back to "IL" in headless
  Chrome on Windows — a platform limit. Tal's own exports render flags fine.)

## 3–4. Footage → interactions → best moments

`npm run index` a folder → `group` into interactions → `moments`. Analyze ALL of
it first; don't edit clips individually. Understand which clips are one
conversation, who's speaking, the story, the hooks, the boring parts, the
emotional/funny/surprising/kind/curious/informative beats.

Per interaction, cut the strongest moments — drop greetings, long pauses,
repeats, technical mistakes, dead space, boring transitions, irrelevant
conversation, unnecessary setup — **but keep enough context** that the viewer
gets: who is this, what's happening, why care. `.claude/skills/ai-editor` full
interactions live as seed specs (`scratch/full/*.json`); an `interaction` row
is often several encounters merged — verify it's one person.

## 5–6. 1–2 variations per strong interaction

Only make a 2nd variation when there's a genuinely different strong structure.

- **Variation A — Natural**: the interaction, edited down. Start near the start
  of the interesting part. `proj-new --from-full <seed>`.
- **Variation B — Hook-first**: a strong later line opens, then jump to the
  beginning/context, then the conversation, then the payoff. The hook must make
  viewers curious AND the rest must naturally explain why it happened. **Do not
  just move a random dramatic sentence to the front.** (`--hook <moment_id>` —
  not built yet.)

### Hook kinds (from the 7 references — 2026-09-06)

| Kind | Reference | Mechanism |
|---|---|---|
| A · Question to viewer | bakery | "Can you guess which bakery this is? Comment below" — direct address, invites a comment |
| B · Title-only, chronological | police, italian | no restructure; the pill title carries the curiosity, play from "excuse me sorry are you from Israel" |
| C · Payoff-line cold open | selena | lift the single most surprising later sentence to 0:00 over B-roll, hard-cut to the meet, play straight — the video answers the cold open |
| D · Premise + rejection montage | eilat | Tal states the stakes as a line ("Since there's a war with Iran, I'm taking a stranger to Eilat — you down?"), shows "No" ×3, tension = will anyone say yes, payoff = "you actually came" |
| E · The ask, pulled forward | donate | lift the one blunt request ("Can I sleep in your home?") to 0:00, then play straight |
| F · Peak-moment cold open + flashback card | west bank | open on the climax, `2 HOURS EARLIER..` card, cut back to the meet |

Rule for C/E/F: the cold-open line **must be a real line from the footage**, and
everything after it must explain how they got there. B and D need no title
restructure. **Ending:** stop on the payoff / strongest human moment, then at
most **one short warm outro** ("nice to meet you" / "follow for part two") —
never a slow pleasantries fade.

The hook-first builder should pick: **C** when there's one standout surprising
sentence, **E** when there's a single blunt ask, **F** when there's a clear
peak-action moment plus a mundane setup worth a flashback card.

## 7. Low-res previews per variation, then review

```
Interaction 04
  Variation A — Natural  → preview
  Variation B — Hook first → preview
```
Tal watches and says: approved / change the hook / cut this part / captions
wrong here / make it shorter / use Variation B / combine A and B / this
interaction is bad, delete it. **Nothing publishes without explicit approval.**

## 8. Learn from every decision

Approve, reject, title change, caption change, variation choice, manual edit,
hook change, shorten, reorder — all are training signals. `proj-confirm` diffs
`AI_DRAFT.json` vs approved → `projects/_profile.json` (confidence per pref).
Explicit instruction → high confidence fast; one silent edit → weak; repeats
compound. Titles and captions have **separate** style models. Build the picture
over time; don't treat each video as isolated.

## 9. Catalog — folder → proposed interactions + variations

`node scripts/proj-catalog.mjs --slug <shoot>` writes `projects/_catalog.json`:
- **story candidates** — one per vetted seed (`scratch/full/*.json`), each with
  Variation A (natural) + a **suggested** Variation B (hook-first: the strongest
  back-half beat, with a starting `--hook` / `--hook-in` / `--hook-out`).
- **compilation pools** — moment clusters by reaction / tag / person / theme,
  with 2 candidate orderings. **Pool only — never ship the top-N as-is** (that's
  the quote-collage failure). Claude picks the real set with Tal, then writes a
  seed spec.
- **raw interactions** — flagged `needs_review` when >3 clips or >90s (a merge).

It **proposes, builds nothing.** Claude shows Tal the list; per approved row:
`proj-new --from-full <seed>` for A, `proj-new --from-full <seed> --hook <M> …`
for B. Full-res master per approved variation via `proj-render --final`.

## 10–14. Publishing — `scripts/publish.mjs` (ShortSync)

Config: `projects/_publish/shortsync.config.json` (live key, gitignored, never
share). API: `https://api.shortsync.app/v1`, Bearer. Claude turns Tal's chat
into these calls. **Every mutating call is a DRY RUN unless `--confirm`** — and
Claude only adds `--confirm` after Tal says yes in chat. Only `*_FINAL.mp4`
masters upload, never a preview.

```bash
node scripts/publish.mjs status                       # workspace, quota, connected accounts
node scripts/publish.mjs post <project> [--platforms instagram,tiktok,youtube,facebook] \
     [--caption "..."] [--first-comment "..."] [--at 2026-09-10T19:00:00+03:00] [--confirm]
node scripts/publish.mjs trial <projA> <projB> [projC] [--at ISO] [--every 24h] [--confirm]
node scripts/publish.mjs schedule --plan projects/_publish/plan.json [--confirm]
node scripts/publish.mjs list [--status scheduled] ;  node scripts/publish.mjs cancel <id> --confirm
```

- **MAIN** = `post` to all platforms (Tal confirms the low-res preview first).
- **Trial Reels** ≠ main posts — `trial` sends each variation to Instagram only
  as a trial reel (`platform_options.instagram.trial_reel`, TODO confirm field),
  staggered by `--every`.
- `schedule` enforces `rules.min_gap_hours_between_posts` (default 3h).
- Flow: EDIT → PREVIEW → REVIEW → APPROVAL → `proj-render --final` → publish.
  **Never auto-post** (`rules.never_auto_post: true`).

## Commands (working today)

```bash
node scripts/proj-catalog.mjs --slug <shoot>                          # folder → proposal worksheet
node scripts/proj-new.mjs --slug <shoot> --name <n> --from-full <SEED> --brief "..." \
     [--caption-style tal_caption|tal_caption_lower] [--title-style tal_top_title|none] \
     [--title-hold hook|long|persist] [--handle @name] \
     [--hook <MOMENT_ID> [--hook-in <s>] [--hook-out <s>] [--time-card "HOW IT STARTED"] [--no-time-card] [--force]]
node scripts/proj-render.mjs <n> [--scale 0.4 | --final]
node scripts/proj-recaption.mjs <n> [--model medium] [--force]   # punctuated re-transcribe → clean phrasing
node scripts/proj-op.mjs <n> <op> --flags            # trim/title/caption/… + undo/redo
node scripts/proj-confirm.mjs <n> [--render-final] [--explicit k=v …]
node scripts/publish.mjs <status|post|trial|schedule|list|cancel> …   # ShortSync, --confirm to send
```

## Not built yet

- Frame.io / Google Drive ingest (still a local folder + `npm run index`).
- Visual timeline editor (CapCut-style) — optional; the loop works via
  `proj-op` + hand-editing `project.json`.
- `_catalog.json` doesn't yet track per-variation `status`/`preview`/`master`
  through to publish — Claude tracks that in the chat for now.
