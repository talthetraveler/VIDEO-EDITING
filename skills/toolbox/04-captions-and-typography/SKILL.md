---
name: 04-captions-and-typography
description: Caption timing, wrapping, safe area, emphasis, and house type. Every pitfall already paid for.
---

# 04 · Captions & Typography

Captions are read, not decorated. Everything here exists because a specific
version shipped wrong once.

## House style

- **White** text, **gold/cream accent** for emphasis (names, numbers, the key
  word). **Never a blue "active word" tint** — that's the stock TikTok look and
  it isn't his.
- Heavy drop shadow, **no stroke, no box** for the keyphrase variant.
- Centred vertically by default (`position="center"`), not lower-third.
- 2–6 words on screen at a time. **Numbers get their own beat.**
- Sentence case for recent work; `uppercase` for the older ALL-CAPS look — pick
  one per video and hold it.
- Font: Inter. **Inter has no flag glyphs** — 🇮🇱 renders as tofu. Strip emoji
  from titles, or write "IL".

## The two variants

| Variant | Use |
|---|---|
| `keyphrase` (default) | large, 2–3 words, centred, per-word emphasis |
| `transcript` | small near-verbatim ~2 lines in a translucent pill, top area, under a `<TitleCard>` |

Both can run at once — give the transcript a larger `switchEveryMs` (~3000) and
leave the keyphrase at the default.

## The blob bug — shipped in 111 of 114 videos (2026-09-05)

Tal sent a screenshot of a caption running off both edges of the frame:
`at Shalom Shabbat Shalom You`. Root cause was **not** the layout CSS.

`make-catalog.mjs` / `make-compilations.mjs` write an anchor phrase into every
moment's `caption` field. `build-reel.mjs` treated that as a hand-correction and
emitted it as **one Caption entry spanning the whole beat**. Consequences:

- `createTikTokStyleCaptions` sees one token, so the "page" is one long string
- the active-word highlight has nothing to move between — a whole sentence sits
  frozen for 5–7 seconds
- as a single flex item it will not wrap, so it overflows both edges

**The anchor phrase must select WHICH words to caption, never become the
caption.** Match it against the clip's real word rows (space-insensitively, so
it survives whisper splitting "Shabbat"), then emit those words individually
with their own timings.

**How to detect it without reading code:** count caption entries per video
against duration. ~6 entries for a 34-second video means blobs; ~30 means
word-level. Also assert `0` entries whose text contains a space.

Two more guards that came out of the same pass:

- **Clamp a single word's on-screen life to ~1.2 s.** whisper sometimes hands a
  word an end-timestamp that swallows the silence after it — "Excuse" was held
  7.0 s. Showing nothing during a silence is correct.
- **Filter whisper's annotations at caption time** — `speaking in foreign
  language`, `[Music]`, `BLANK_AUDIO` were being burned on screen ("SPEAKING
  IN" opened A1). Drop the flagged words *and* the orphan glue word they leave
  behind ("in"). Filter at caption time only — the words must stay in the DB or
  phrase matching and beat detection break.

## Timing pitfalls (all previously shipped broken)

1. **Do not use the token-grouping window as a hard page length.**
   `combineTokensWithinMilliseconds` controls *grouping only*. Using it as a cap
   truncated multi-second captions to ~1.1 s. A page lasts until **its own last
   token ends**, or until the next page starts, whichever is first.
2. **Caption from the anchor onward, not from the window start.** A
   phrase-anchored beat opens a couple of seconds before the line; captioning
   the whole window subtitles "I'm sorry to bother you" instead of the actual
   line.
3. **Reaction beats carry no caption.** The label is unreliable and silence is
   the point.
4. Minimum page length 0.5 s. Below that it's a flicker.

## Layout pitfalls

1. **Flex items need `minWidth: 0`** — the default `min-width: auto` refuses to
   wrap below content width and the caption runs off both edges.
2. Use **`whiteSpace: "pre-wrap"`**, not `"pre"`. Our beats emit one caption per
   *phrase*; `pre` keeps the whole phrase on one unbreakable line.
3. `maxWidth: width * 0.86`.
4. Stay inside the mobile safe area (`src/lib/safe-area.ts`) — Instagram's UI
   eats the bottom ~250 px and the top ~180 px at 1920 h.

## Transcript quality

whisper.cpp emits **BPE sub-words, not words**. `" Sh" + "abb" + "at"` is
"Shabbat". A leading space marks a word boundary → merge with
`mergeTokensToWords()` (`scripts/lib/autocut-core.mjs`). Without it every caption
reads "Sh abb at Sha lo m". `scripts/repair-words.mjs` fixes an already-indexed
library without re-transcribing.

Transcribe with a **multilingual** model (`medium`) for Hebrew/Arabic/English —
never a `*.en` model.

## Two real bugs caught in production (2026-09, "Call Someone You Love")

1. **Caption time computed against the wrong time base after a trim.** ffmpeg
   resets PTS to 0 at an `-ss` trim point; if the caption spec still holds the
   word's *original* clip timestamp, every caption on a clip with a nonzero
   trim-in silently never appears — no error, the render just plays mute of
   text. **Rule: whenever a clip's start point moves (trim, `-ss`, a cut
   remap), subtract that offset from every caption time that rides on it, and
   verify with a still at the caption's OWN timestamp, not just "did it
   render."**
2. **A bracketed transcript annotation split across two whisper tokens leaked
   past the filter.** `[SPEAKING HEBREW]` came back as two separate tokens
   (`"[SPEAKING"` then `"HEBREW]"`); a regex matching a *complete* bracketed
   phrase in one token missed both halves. **Rule: track bracket-open/close
   STATE across the token stream, not a single-token regex** — the same class
   of bug `mergeTokensToWords()` already solves for word-splitting, applies
   again for annotation-splitting. And when whisper bails into a placeholder
   like this instead of translating (language-switch boundaries are where it
   happens), re-transcribe just that clip with an explicit `--language`
   hint — don't ship the placeholder.

## Verify

Render stills at the middle of at least 3 caption pages and **look at them**.
Truncation, overflow, and tofu glyphs are invisible in code and obvious in a
frame.

## Related

`src/captions/Captions.tsx`, `.claude/skills/video-editor/references/house-style.md`.
