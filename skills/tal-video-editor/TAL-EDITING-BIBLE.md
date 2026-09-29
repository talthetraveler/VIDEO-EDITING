# THE TAL EDITING BIBLE

The canonical definition of what a "Tal edit" is. Everything here is either
**measured** from Tal's own videos, **stated** by him directly, or **learned**
from a correction he gave. Nothing in this file is generic editing advice.

Every rule carries its provenance:

- **[M]** measured — from frames, waveforms, scene detection or transcripts
- **[S]** stated — Tal said it, quoted or paraphrased closely
- **[L]** learned — inferred from a correction, an approval, or his own manual edit
- **[?]** low confidence — believed, not verified. Flag before relying on it.

When a format preset (`skills/tal-video-editor/formats/*.md`) contradicts
this file, **the preset wins** — it is the more specific rule. When a generic
skill contradicts this file on a *creative* call, **this file wins**. On a purely
*technical* call (a codec, an API signature), the technical source wins.

---

## 0. WHO THIS IS FOR

Tal Dooreck Aloni — `@talthetraveler`, ~148K on Instagram.
**"SHOWING YOU ISRAEL BEYOND HEADLINES."** Street conversations with real
people — Muslim, Jewish, Christian, Druze, migrant, tourist — about identity,
religion, food, home, fear and kindness. **[S]**

Tone: warm, curious, human. Never propagandistic, never a lecture, never a
"gotcha." **The strongest asset in the footage is a stranger's face changing
when they are treated well.** **[S]**

Output: **vertical 9:16, 1080×1920, 30 fps CFR, H.264 + AAC, −14 LUFS.** **[S]**

---

## 1. THE FRAME — title at top, captions lower-middle

This is the layout that defines a Tal video on sight.

> **These are DEFAULTS, not coordinates.** Keep the language — title toward the
> top, captions in the lower-middle, short groups, one highlighted word. But
> **the footage wins.** If a default position would cover a face, eyes, a sign,
> or the object being discussed, reposition it for that shot. A caption over
> someone's mouth is worse than a caption 6% higher than usual.
> Always stay inside the Reels/TikTok/Shorts safe zones (platform UI eats
> the bottom ~400px / 20%, top ~220px and right ~150px of a 1080x1920 frame,
> per `system/src/lib/safe-area.ts`; corrected 2026-09-29 from ~250/~130).
> **`style consistency > identical pixel coordinates`** **[S]**

```
┌─────────────────────────┐  y=0
│   ╭───────────────────╮ │
│   │ MEETING A MUSLIM  │ │  ← TITLE: white pill, BLACK bold caps
│   │ POLICE OFFICER 🇮🇱 │ │     y ≈ 0.08–0.13, centered, 1–3 lines
│   ╰───────────────────╯ │
│                         │
│                         │
│      [ the person ]     │
│                         │
│                         │
│      I FEEL SAFE        │  ← CAPTIONS: white bold caps, ONE word
│                         │     gold at a time. y ≈ 0.60–0.67
│                         │
└─────────────────────────┘  y=1
```

### Titles **[M, 7 reels + 2 of his own manual edits]**

- White rounded **pill**, **BLACK** bold ALL-CAPS, centered, 1–3 lines.
- **Pinned to the TOP.** `y ≈ 0.08` in the presets; his own manual edits sit
  slightly lower at **`y ≈ 0.10–0.13`**. Prefer 0.11 for story formats. **[L]**
- **0.24 is wrong.** That was an early mistake, corrected. **[L]**
- **Hold — format-dependent, and the preset default is too short:**
  - his own manual edits held the title **~30–40s ("the first third")**, then
    dropped it → **default ~35s for story formats**, not 6s **[L]**
  - `hook` ~6s · `long` ~17s · `persist` whole video · **`none` is valid**
    (2 of 7 reels use no title at all — a spoken premise is the hook) **[M]**
- **Wording templates**, most common first **[M]**:
  1. `MEETING A/AN <identity> <flag> IN ISRAEL 🇮🇱` — identity is the hook
  2. `POV: I WENT TO A <place> OWNED BY A <group> IN ISRAEL`
  3. `<GERUND ACTION> FROM ISRAEL TO <place>`
  4. `SHE IS FROM <place> <flag> AND <VERB-ing> <place> <flag>` — the
     *situation* is the hook, not the identity
- Special cards: `2 HOURS EARLIER..` / `HOW IT STARTED` = plain white caps,
  **no pill**, used after a peak-moment cold open. `PART 1` takes a red accent.
- Flags must render as **Twemoji SVGs** — headless Chrome draws 🇮🇱 as the
  letters "IL". `src/lib/emoji.tsx`. **[M]**

### Captions **[M, same sources]**

> **CORRECTED 2026-09-20 — there are at least TWO caption systems, not one.**
> Re-measuring his own bakery POV reel (`DZiggEMxqSp`, ref #4) frame by frame
> found **sentence-case white captions, 1–3 words, soft shadow, NO gold word at
> all**, at y ≈ 0.58–0.62. The white+gold karaoke system below is real and was
> measured on other reels — but it is **not universal**. Check which system the
> format uses before applying either. Full evidence:
> `reference-library/DZiggEMxqSp/analysis.md`

**System A — white + gold karaoke** (measured on 4+ of the 7 reels):

- **WHITE bold caps base, exactly ONE word lit GOLD `#FFE21F` at a time**,
  advancing with the speech. Karaoke, not a static highlight.
- Heavy black stroke ~7px, **no box**, **no background**.
- **2–3 words per card.** Occasionally 3 wrapping to 2 lines.
- Position `y ≈ 0.67` in presets; **his own manual edits sit at `y ≈ 0.60`**. **[L]**
- **SPEECH-ONLY.** A card is on screen only while those exact words are being
  spoken. Never held through silence, a reaction, b-roll or a cut. This is the
  single most-corrected caption rule. **[S, corrected twice]**
- Case is a **toggle, not a constant** — UPPERCASE in 4 of 7 reels,
  sentence-case in 2. Default uppercase, weak confidence. **[M]**
- **`@handle` watermark — NOT a settled rule.** The 7-reel sample had none, but
  browsing the live profile 2026-09-20 found `@talthetraveler` in a white pill
  at the bottom of the `MEETING A CHRISTIAN ✝️` post. It appears on some and not
  others. **Ask rather than assume.** **[M, corrected]**
- **The gold word is SEMANTIC.** Across ~40 live covers it lands on identity
  words, place names and greetings — JESUS, ISRAEL, JEWISH, APARTHEID, ALAIKUM,
  LEBANESE, YALLA — never mechanically on every word. Sometimes a whole short
  phrase is gold. *Whether it advances karaoke-style during playback is still
  unresolved — covers cannot show it.* **[M]**
- Rendering: `paintOrder: "stroke fill"` so the outline sits BEHIND the fill —
  without it a 7px stroke eats the letterforms and Tal says "the letters r cut".
  `lineHeight` 1.28, `tracking` −0.005. **[S → fixed]**

**System B — plain white, sentence case** (measured on ref #4, his POV bakery):

- **Sentence case**, white only, **no gold word**, soft shadow, **no heavy
  stroke**
- **1–3 words per card**, single line, **y ≈ 0.58–0.62**
- Used on POV / Meta-glasses content. Reads quieter and lets the interaction
  carry the frame

**Which to use:** follow the format preset. If the preset does not say, and the
footage is POV/Meta-glasses, default to **System B**. Otherwise System A.
**[M, 2026-09-20]**

### What he tolerates that the grouper does not **[L]**

His own edits keep dangling words and filler — "AND YOU'RE A", "WELCOME HOME I",
"YES BECAUSE UH", and he keeps the "uh". **The caption grouper is stricter than
he is.** A few trailing fragments getting through is not a bug. Do not
over-clean.

---

## 2. HOOKS — six kinds, all real

Every video needs a hook in the **first 1.5 seconds**. Never open on an empty
street or a walking shot. **[S]**

Six hook kinds, observed across his reels **[M]**:

| | Kind | How it works |
|---|---|---|
| **A** | Question to viewer | "Can you guess…? Comment below" |
| **B** | Title-only, chronological | Play from the approach: "excuse me, sorry, are you from Israel" |
| **C** | Payoff-line cold open | Lift the most surprising *later* sentence to 0:00, then cut to the meet and play straight |
| **D** | Premise + rejection montage | State the stakes, show "No" ×3 — tension is *will anyone say yes* |
| **E** | The ask pulled forward | "Can I sleep in your home?" then play straight |
| **F** | Peak-moment cold open + flashback | Strongest moment first, then `2 HOURS EARLIER..` |

**The rule that binds C, E and F: the cold-open line must be a REAL line from
the footage**, and everything after it must explain how they got there. Never
fabricate or re-voice a hook. **[M]**

**The first visual must create curiosity.** Establish the human, the story or
the problem extremely quickly. **[S]**

---

## 3. PACING — the dial is the format, not a global speed

There is no single Tal cut rate. There are three measured settings, and
choosing the wrong one is a real failure that has happened.

| Setting | Cuts/min | Shot length | Used for |
|---|---|---|---|
| **Street / conversation** | slow — hold faces | 1–3 s typical | Street interviews, POV kindness, human stories |
| **NAS explainer** | **22** (range 16–27) | 2.4 s median | Narrated script/VO explainer **[M, n=10]** |
| **Talking-head fast** | **~41** | 1.3–1.5 s | Social Accords style, A-roll spine + machine-gun cutaways **[M]** |
| **Montana single-take** | **0** | whole video | One unbroken locked-off shot, no text **[M, 6 of 7]** |

**The hard rule: NEVER apply NAS's 22 cuts/min — or the 41 of the fast
talking-head format — to a street conversation.** It shreds the held faces the
format lives on. **[S]**

**NAS derived rule: one cut every ~6 spoken words** (4.9–7.2 across the sample),
speech at **132 wpm**, median runtime **157s** — the "one minute" format is
retired. **[M]**

**Cut rate tracks information density, not excitement.** The densest NAS video
was the most factual; the slowest was the emotional payoff. **[M]**

### How much to trim **[L, from his two manual edits]**

**Trim scales with how loose the raw is.** He cut **3.6s** from a clip that
flowed and **17.5s** from one that was circular and repetitive.
**Do not chase a target length.** Cut what is genuinely redundant, keep the rest.

- Remove dead air. **[S]**
- **Cut on energy, not grammar.** End on the strongest human moment, not the
  last thing said. **[S]**
- **Give emotional moments room.** Don't make every cut hyperactive. **[S]**
- **Cut an incomplete or trailing sentence and jump to the next strong beat.** **[L]**
- **Extend toward the payoff.** Auto-generated seed windows end **~25–30s too
  early** and strong closings get lost. When building from a seed, push the last
  window toward the raw clip's end and look for the real ending. **[L]**

---

## 4. STORY — human first, reveal progressively

**Problem → person → discovery → emotion/payoff.** **[S]**

- **Human first.** Curiosity before information. **[S]**
- **Don't explain everything immediately.** Reveal progressively. **[S]**
- **Preserve authentic reactions.** The half-second after the sentence, when the
  face changes, is the best part of the footage. Silence is not delete. **[S]**
- **FULL STORY vs COMPILATION** — classify every interaction. A full story is
  one person with enough substance to carry the whole video (hook → approach →
  who they are → the best of the conversation → payoff → ending), cut as *that
  person's story*, never chopped into disconnected quotes. **[S]**
- **Never rank a full-story candidate's moments by score and assemble the top
  N.** That produces a quote collage wearing a story's title. **[S]**
- **Greetings score highest and will hijack a story into a greeting montage.**
  Story = chronological, greetings excluded. **[L]**
- **Ending: stop on the payoff / strongest human moment + at most one short
  warm outro. Never a slow fade.** **[M]**
- A wordless close is often right — no CTA competing with the emotional beat. **[M]**

### The establishing walk-up is part of the story **[L — important]**

His own edits **keep the subject walking toward camera**, title already over it,
already talking ("hello hello" / "Assalamu Alaikum, where are you from"). He
**never hard-cuts straight to a talking head.**

So lead-trimming must stay conservative: kill genuinely silent or stretched dead
air only, never a walking shot with speech over it.

---

## 5. B-ROLL — it must earn its seconds

- **Every B-roll shot must advance information, emotion, geography or pacing.** **[S]**
- **Do not add cinematic footage because it looks nice.** **[S]**
- **Prioritise footage connected to what is being said.** **[S]**
- Visual hierarchy, best first: **human footage > real story footage >
  product/UI > screenshots > maps > data-viz > typography > diagrams >
  generated imagery.** AI-generated visuals only when there is no stronger real
  option. **[S]**
- "We filmed it" is not a reason to keep a clip. Only "it earns its seconds" is. **[S]**
- In the fast talking-head format B-roll are **quick inserts over a continuous
  A-roll spine (~50–60% on camera)** — not a replacement track. Removing the
  speaker and going wall-to-wall B-roll was a real rejected edit. **[S, rejected]**

---

## 6. AUDIO — dialogue always understandable, street always present

- **Dialogue must always be understandable.** **[S]**
- **Do NOT over-denoise.** Street ambience, wind, market noise, traffic — that
  texture is the proof it's real. Remove hum, clicks and clipping. **Leave the
  street in.** **[S]**
- DeepFilterNet **`-a 10`**. `-a 25` and the default both gated real speech to
  silence — confirmed against waveform images. **[M]**
- Denoise **the exact segment you will use**, never whole-clip-then-slice
  (that causes A/V drift that looks like a caption bug). **[M]**
- **Target −14 LUFS on the delivered file.** A genuinely successful reference in
  his own genre measured −14.28 LUFS / −0.03 dBTP. **His own posts have been
  running 5–7 LU under target** — a real, fixable gap, not an overcautious
  threshold. Per-beat normalisation alone does not get there. **[M]**
- **Music supports emotion without overpowering the story.** **[S]**
  Music is **optional, not mandatory** in the intimate formats — the raw voice
  and real pauses can carry it. **[M]**
- A flat gain reads as "background music." Use a **stepped envelope keyed to the
  edit's own cut points** — quiet under the hook, fullest under the emotional
  anchor, down for the outro. Level changes landing *on* a cut read as
  intentional. **[M]**
- Never join fragments from two takes into one word. If unsure, **cut later, not
  earlier.** **[S]**

---

## 7. GRAPHICS — clarify or don't

- **Do not add graphics because Remotion can.** **[S]**
- Motion graphics must **clarify information or improve retention.** **[S]**
- **Don't overdo motion graphics.** **[S]**
- **Every animation needs a storytelling reason.** **[S]**
- Avoid: corporate-cheese animation, transition spam, motion for its own sake,
  generic AI gradients, floating 3D icons, clutter. **[S]**
- Big stats get their own full-screen animated moment, not a stock clip behind
  a number. **[S]**
- **MODE A (real/documentary)** — people, interviews, travel, street: real
  footage beats motion graphics, always. **MODE B (motion/explainer)** — tech,
  stats, maps, product: visual explanation + motion graphics. Most videos are
  MODE A. **[S]**

---

## 8. SCRIPT AND LANGUAGE

- **Do not unnecessarily rewrite Tal's script.** **[S]**
- Captions are **exact speech**, correctly punctuated and spelled. **Never
  invent words.** **[S]**
- Check the transcription model's **own detected language field** — "it reads
  like English" is not proof it is. Two clips turned out to be Arabic. **[L]**
- Any translated caption is **"timing verified, wording unverified"** until a
  human who reads both languages checks it. Never call a translation
  "verified". **[S]**
- On multilingual cards: assert each language field contains its own script.
  Hebrew characters once shipped inside an Arabic line. **[L]**
- Relative caption sizing when stacking languages: English is the lead
  (largest), the others sit under it, readable and clearly smaller — but **not
  a footnote.** 40px against 82px was explicitly rejected as too small. **[S]**

---

## 9. NON-NEGOTIABLE PROCESS RULES

- **Never modify `raw/`.** Read-only, always. **[S]**
- **Never overwrite a delivered MP4.** New render = new file. **[S]**
- **Review-gated.** A low-res proxy goes to Tal before anything final. An
  automatically generated edit is never treated as approved. **[S]**
- **One video at a time.** Never batch before he reviews one. **[S]**
- **Never claim a render is right because it compiled.** Render stills and
  actually look at them. **[S]**
- **Never claim to have watched a video.** State what was actually inspected:
  transcript, word timings, N extracted frames, M rendered stills — or nothing. **[S]**
- **Captions are never correct until measured.** `verify-captions.py`, and its
  PASS proves *timing* only on fast cuts (<8s runs skip the text check). **[M]**
- **Report every caveat.** If a step was skipped or a heuristic guessed, say so
  with the actual number. **[S]**

---

## 10. WHAT HE HAS EXPLICITLY REJECTED

The negative examples matter as much as the positive ones.

| Rejected | Why | Date |
|---|---|---|
| Removing the speaker and going wall-to-wall B-roll | "Montana stays on camera" means she is the SPINE with cutaways layered on — the opposite of replacing her | 2026-09-09 |
| A ~20 cuts/min cut of a fast talking-head piece | Felt dead. The reference was ~41 | 2026-09-09 |
| Blind 3-word caption chunking | "THE CAPTIONS R SHIT" — split "THE / BEST", glued question onto answer, stranded lone words. Root cause: the words table had no punctuation | 2026-09-06 |
| 7px stroke painted over the fill | "the letters r cut" | 2026-09-06 |
| Captions held over silence | Must be speech-only | 2026-09-06 |
| Captions starting before he speaks | Lead-trim past the walk-up | 2026-09-06 |
| Hebrew/Arabic captions at 40px under 82px English | Read as a footnote. Raised to 66/52 | 2026-09-16 |
| Beats starting 1.4–1.6s before the first spoken word | Real speech played with no caption — reads as "the captions are broken" | 2026-09-16 |
| A flat, uncorrected grade | "the current rough color looks a little off" — measured: luma spread 63 levels, saturation ~10/128 | 2026-09-16 |
| An opener that wasn't the emotional line | Wanted the Moroccan woman's grandfather line as the cold open, not the existing opener | 2026-09-16 |
| Posting 6 trial reels/day | Instagram throttled the account. Default is now 3/day | 2026-09-20 |

---

## 11. KNOWN-APPROVED WORK

The Golden Reference Library grows from here. These are videos Tal explicitly
approved — **the only ones currently known.**

| Video | Format | What he said | Date |
|---|---|---|---|
| `priest-01` | human-story | "I liked how you did those 2 last videos" | 2026-09-07 |
| `bakery-hookB` | human-story (hook-first) | same | 2026-09-07 |

> **Two videos do not define all of Tal's content.** Both are the same format.
> Lessons from them are **strong for human-story and weak everywhere else.**
> Never apply a rule learned here to a Nas-style explainer, a POV kindness
> montage or a fast talking-head piece just because it came from an approved
> video. **Golden references are format-aware.** **[S]**

**Two tiers, and they are different things:**

- **APPROVED FOR POSTING** — "approved", "good", "ship it". The video is good
  enough to post. **Not every detail is therefore ideal.** Learn only from what
  he explicitly corrected.
- **GOLDEN REFERENCE** — "perfect", "this is exactly it", "I really like this
  edit", "use this style going forward". *This* defines style, and earns a real
  measured analysis in `golden-references/`, tagged with its format.

**The proven recipe from those two**, written up in `skills/toolbox/ai-editor/SKILL.md` §0:

```
proj-new [--hook] --title "MEETING A/AN <identity> IN ISRAEL 🇮🇱"
  → proj-recaption   (medium model + punctuation, phrase captions)
  → proj-render --scale 0.5   (gentle denoise on by default)
  → send preview → approve → --final
```

The look: white + gold karaoke captions with the outline behind the fill, opens
on real speech (lead-trimmed past the walk-up), white pill title with real
Twemoji flags, street ambience kept.

> **The 120 archived videos are NOT golden references.** Their approval records
> were destroyed. They are an archive. A video joins this table only when Tal
> says "I love this" / "use this as a reference" / "edit future videos like
> this", or hands one over directly.

---

## 12. HOW THIS FILE GROWS

Every correction Tal gives is classified at the moment he gives it:

- **Video-specific** ("cut this clip", "use that shot") → apply now, log in the
  project's `NOTES.md`, **do not generalise**.
- **Reusable preference** ("too slow", "stop changing my script", "more
  emotional") → check against this file first:
  - **agrees** → strengthen it, add the example
  - **refines** → narrow the old rule's scope, keep both
  - **contradicts** → **surface it and ask which wins.** Never silently stack
    contradictory rules.

**A contradiction usually means a missing format distinction.** "Cut faster" on
a montage and "give emotional moments room" on a human story are not in
conflict — they are two presets. Collapsing them into one global rule makes both
worse.

The richest signal is the **delta between the V1 I made and the final Tal
approved.** Capture what changed and why: title moved, hook shortened, B-roll
removed, reaction held longer, caption resized, graphic cut, different speaker,
wording restored.

---

## NEVER CUT SOMEONE OFF  [S] — stated 2026-09-20, non-negotiable

Tal, on the Jamaica cut: *"the best editor wouldn't do any cutouts of stuff that
I'm speaking. So why did you do that? You should never do this."*

This is a hard rule, above any target duration. If a beat has to run 12 seconds
so a sentence finishes, it runs 12 seconds.

### The three ways it has actually gone wrong here

1. **Cutting on the frame the word ends.** V4 set an out-point at 48.90 and
   `"happen."` ends at 48.90. Technically not mid-word; it still snapped shut
   and felt broken. **Every beat needs ~0.45s of air after the last word**, and
   ~0.12s before the first.

2. **Throwing away the reply.** Tal said *"Okay, let's make that happen"* and
   Damien answered *"That would be really great, man"* — the cut landed between
   them. **If the other person responds, the response is part of the beat.**
   A line and its answer are one unit.

3. **Trusting the transcript instead of the render.** Tal: *"on the audio
   transcript it says it's okay, but on the actual edit it doesn't look so
   good."* Transcript math is a PREDICTION. The rendered file is the truth.

### The check that must run before ANY video is sent

```bash
node system/scripts/verify-cut.mjs projects/<slug>/EDIT.json --render <preview.mp4>
```

Two passes:
- **Pre-render**, against real word timestamps: flags an in/out that lands
  inside a spoken word, a beat that ends mid-thought, and dead air > 1.2s.
- **Post-render**, against real audio energy in the finished MP4
  (`silencedetect`): flags any cut that lands while speech is still active.
  This is the one that catches what transcript math misses.

It exits non-zero when anything is wrong. **A non-zero exit means do not send.**

Word timestamps are required for this, so any clip that enters an edit must be
transcribed with `--words` (`node system/scripts/frameio-transcribe.mjs --only <id> --words`).
A beat reported as "NO WORD TIMESTAMPS" is unverified, not clean.

---

## WATCH IT YOURSELF FIRST  [S] — stated 2026-09-20, the most important rule

Tal: *"Before giving me a video, you should just watch it one time yourself so
you can see if there's any mistakes. The V1 should have been like the V6."*

Every defect he has had to report was one I could have seen without him:

| Version | Defect | How it was visible |
|---|---|---|
| V1 | centre-crop decapitated people | one contact sheet |
| V2 | captions drifted out of sync | the caption dump |
| V4 | "let's make that happen" snapped shut | `verify-cut` |
| V5 | "FOR YOWEBLLRTHDAY" overlapping captions | one contact sheet |
| V5 | "three here" instead of "three years" | **reading the caption text** |

None of those needed Tal. They needed me to look.

```bash
node system/scripts/selfreview.mjs projects/<slug>/EDIT.json <render.mp4>
```

It produces a contact sheet (framing, decapitation, overlapping text, black
frames), the full caption list with timings, ASR sanity flags, and the boundary
+ post-render audio verification. **Exits non-zero if anything is flagged.**

Looking at the contact sheet is not optional and cannot be skipped by reading
the code instead — V1 "looked correct" in code and cut people's heads off.

### ASR error correction — the three layers

Tal asked what this skill is called: **ASR error correction** / contextual
transcript QA. Three layers, in cost order:

1. **turbo** for discovery — fast, cheap, finds the story.
2. **large-v3 diff** (`scripts/caption-audit.mjs`) on clips that reach the final
   cut. Where two models disagree is where one is guessing. Caught
   "three here" -> "three years".
3. **Reading the captions.** "it take me actually three here to build my house"
   is semantically impossible. No spellchecker or confidence score catches it
   because every word is valid English. This layer is free and was the one
   being skipped.

**Do NOT make large-v3 the default.** Same price, ~3x slower, and it is *worse*
on accents and dialect — it tried to "correct" Damien's Jamaican patois
"yeah man" to "mon" and heard "iron mon" where turbo correctly heard
"hi everyone". Better on rare words, worse on the accents this footage is full
of. Use it as a second opinion, never as the source of truth.

Corrections live in `projects/<slug>/CORRECTIONS.json`, are **caption-only**
(the audio is never altered), and never change what a person actually said —
only what the model misheard.

---

## TWO MORE HARD RULES  [S] — 2026-09-20

### 1. A caption must FIT INSIDE THE FRAME

V6 raised the caption font to 78px because Tal asked for big captions, and
never re-checked that the text still fits. `LOST EVERYTHING, SOMEONE` is ~1120px
at 78px on a 1080px frame — it ran off **both** edges.

**Never guess character widths. Measure with the real font.**
`scripts/fit-caption.py` measures every caption with the actual TTF and shrinks
only the ones that overflow (78px → as low as 44px), so short captions stay big
and long ones stay on screen. Safe width is **960px** on a 1080 frame.

### 2. A PROMISE IN THE DIALOGUE MUST BE PAID OFF ON SCREEN

Tal: *"I say I want to write Damien, and then I don't write Damien. Why did you
do that?"*

V6 used the line *"I want to write Damien"* and then cut away. The viewer is
told something is about to happen and never sees it. That is worse than not
including the line at all.

**If a beat says something is going to happen, the next beat shows it.** The
footage was there the whole time — later in the same clip Tal asks *"What'd you
write?"* and the answer is *"33 … my birthday."* Both the action and its payoff
existed; the edit just didn't look for them.

Before locking any cut, read the beat list as a sentence and ask: **does every
promise land?** "We'll be back with the bicycle" → show the bicycle. "I want to
write Damien" → show the writing. "Let's make that happen" → show it happening.

---

## OPEN ON A HUMAN  [S] — 2026-09-21, hard rule

Tal, on Jamaica V13: *"The first clip is just showing an outside. No — the first
clip should show either me vlogging and talking, or someone else. That's a rule.
Show a human being."*

**The first frame of every video contains a person.** A landscape, an empty
street, a building, a wide of a place — none of these may open a video, however
beautiful or however well the narration explains them.

V13 opened on a wrecked landscape and then ran **28 seconds** of Tal saying
*"look at the situation"* / *"this is where they live"* / *"this is the
situation"* — three clips making the same point, over pictures that showed
nothing. He called it repetitive, and he was right: it was the same sentence
three times.

### The two failures to avoid

1. **No face in the opening shot.** Check the actual frame, not the transcript.
   `0310 @0.6` is Tal's face inside the shelter; `0309 @0.9` is an empty
   hillside. The transcripts read almost identically — only looking tells them
   apart.
2. **Several clips making the SAME point.** One context beat, not four. If two
   clips say "look how they live", keep the one with a person in it and cut the
   rest. More context is not more emotion; it is repetition.

**Corollary:** a short line like *"First time I was here, I cried"* is not
enough on its own to justify a beat. It needs a picture doing work.
