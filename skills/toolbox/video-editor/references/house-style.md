# House style, caption voice, assets, run order

## Enforced rules (repeated across builds — do not relitigate)

1. **His talking footage is never moved, scaled, cropped or padded.** Overlays
   shrink instead.
2. **Never cut him off before he finishes a clause.** When in doubt, cut LATER.
   `clean-cuts.md`.
3. **Captions: soft drop shadow, never stroke/border.** 2 lines max, break on
   speech, key words/stats emphasised, inside the mobile safe area.
4. **Every animation has a storytelling reason.** No transition packs, generic AI
   gradients, floating 3D icons, clutter, motion for its own sake.
5. **Literal illustration** for image / cutout / head-image formats — the picture
   is the noun just said. B-roll montage ("Jack") is the exception: associative.
6. **His own photos/footage** for lines about his body or his story.

## Captions

- Break naturally on speech, not by character count. 2 lines max.
- Soft drop shadow only: black text on its own layer, offset `(+3,+5)`,
  `stroke_width=3`, blur ~7, composited under the white text. **No outline on the
  white text.**
- Time captions off the **pre-enhancement** cut, never the enhanced audio.
- Emphasise stats / proper nouns in the accent colour (`<Captions emphasize={…}>`).

### @talthetraveler caption style (watched IG reels + YT Shorts, 2026-09)

**Primary caption — always vertically positioned ~60–65% down (NOT lower-third),
heavy drop shadow, NO stroke, NO box, 1–4 words/page, fast swaps synced to speech.**
Three font treatments — pick per video/era (all via `<Captions>`):

1. **White or CREAM/GOLD bold ALL-CAPS sans** — his most common. Gold is used
   heavily as the *main* colour in the shop/greeting reels, not just for
   emphasis ("SHABBAT SHALOM", "YEAH", "STILL", "BY OFFERING BUSINESSES CONTENT").
   → `<Captions uppercase emphasize={/…/}>` or set the theme accent as the text colour.
2. **White bold serif/slab, sentence-case** — "they're kidnapping and". Punchier
   videos.
3. **White serif *italic*, lowercase** — his softer recent style for the
   "meeting people" series, used as a running caption ("in Israel", "best
   bakery", "Nigeria"). Distinct font (Playfair/Georgia italic). → needs a
   `<Captions font="serif-italic">` variant (TODO — currently emulate with a
   themed override).

**Title card** — white **translucent rounded PILL, BLACK bold ALL-CAPS**, 2 lines,
upper third, group emoji + 🇮🇱. Series template:
`[POV:] MEETING / WISHING / I WENT TO A … <GROUP> IN ISRAEL <group-emoji>🇮🇱`
(🌙 Muslim · ✝️ Christian · 🇳🇬/🇰🇷 nationality). Variants: stacked **black
translucent boxes** ("THE MOST PEACEFUL" / "BAKERY IN ISRAEL"), or plain heavy
white caps no box (older: "SHABBAT SHALOM", "AS-SALAMU ALAYKUM"). Some hooks are
cream/gold. Holds for the whole hook. → `<TitleCard>` (`variant="pill" | "box" | "plain"`).

**Running-transcript pill** (street-interview series, "ASKING PEOPLE IN ISRAEL 🇮🇱
WHAT MAKES THEM HAPPY") — small near-verbatim text, translucent dark pill, top.
→ `<Captions variant="transcript">`.

Footage: always real — POV Meta-glasses handheld + selfie talking-head + b-roll +
archival + graded collab pieces. **Fast cuts ~1–2 s/shot.** POV handshake / hug
beats are the payoff in the greeting + shop reels. No motion-graphics gloss.
Gear watermarks sometimes left visible.

## Instagram caption voice

One real specific line → one question → `follow for the positive side of
instagram :)`. (The caption-follow-CTA convention.)

## Audio

- **Music beds — approved palette only**: `alej.mp3`, `howls.mp3`
  (`~/אינסטגרם/build/music/`), `mice-on-venus_C418`, `kagefumi_solitude`
  (`jack-songs/`). Picking "mellow instrumentals" freehand has been rejected. Run
  a bed-check on anything new.
- Levels: **voice `loudnorm I=-16:TP=-2`, bed `I=-31`** — 15 dB under, never
  ducking.
- **Voice enhance**: `resemble-enhance`, **75 % wet / 25 % original**. 100 % wet
  = robotic. Two-pass `loudnorm`; `aresample + pan` for stereo.

## Asset layout (this repo)

```
public/
  footage/  voiceover/  images/  screenshots/  screen-recordings/
  logos/  music/  sfx/  generated/        + per-project <area>/<slug>/
src/
  theme/  lib/  components/  components/motion/  graphics/  maps/  captions/
  compositions/<slug>/   generate/   Root.tsx
scripts/   new-video.mjs  tighten.mjs  generate.ts  generate-voiceover.ts  lib/
skills/auto-video-editor/   (vendored macOS original)
prompts/   categories/  saved/
output/    renders
```

His personal source media (Mac): `~/Downloads/תמונות`,
`/Volumes/Seagate/the video/` — **read in place, never copy off the drive**.

## Commands

```
npm run new -- <slug> "<Title>" vertical [editorial|motion]   scaffold a video
npm run tighten -- <video> --slug <slug>                      filler/pause cut
npm run generate -- --spec <shot>.json --slug <slug> --kind <kind>   generate a shot
npm run studio                                                preview (localhost:3000/<CompId>)
npx remotion still <CompId> --frame=N --scale=0.5 --output=output/check.png
npm run render <CompId> output/<slug>.mp4                     final render (only when asked)
npm run voiceover <slug>                                      ElevenLabs TTS (ELEVENLABS_API_KEY)
npx tsc --noEmit                                              typecheck
```

## Run order (with retakes / full finish)

```
tighten (or manual cut per clean-cuts.md)  ->  keep.json + captions.json
verify every junction (clean-cuts.md §4)
build the composition (format reference)
beats / caption timing off the PRE-enhancement cut
enhance voice (75/25) if the format calls for it
preview -> inspect stills -> fix weak sections
render -> gate (spec / audio / overlay) -> syncheck (captions vs audio)
```

**Beat/segment counts must not change between runs** or images unmap. Whisper
drops punctuation run-to-run and merges beats — patch a word-level `FIX` list,
don't remap.
