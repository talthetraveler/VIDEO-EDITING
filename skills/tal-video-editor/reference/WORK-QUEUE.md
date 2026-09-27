# WORK QUEUE — Frame.io edits (briefed 2026-09-20)

**Global rule: every video UNDER 60 SECONDS unless the story genuinely needs more.**
**Format: 9:16 vertical for EVERY video except Jamaica**, which is square-band
(its source is 16:9 horizontal). Everything else was shot vertical already.
**Self-review before sending — always:** `node system/scripts/selfreview.mjs <EDIT.json> <render.mp4>`.
V1 should be the quality of V6. Tal should not have to find my mistakes.
Deliver a low-res preview in chat → Tal corrects → learn → next. One at a time.
Upload approved cuts to `SOCIAL ACCORDS/SHOT IN ISRAEL/FINAL VIDEOS/EDITED BY CLAUDE`
(id `da1be559-d19b-4b41-8fb9-cdff73c1eacd`, currently empty).

Cut-rate guidance comes from `skills/toolbox/tal-reference-library/measured-2026-09.md`.
Tal's 1.7M-view reel has ZERO cuts — long takes for single-subject stories,
fast cutting only for many-people compilations.

---

## DO NOT TOUCH — explicitly excluded by Tal

| Folder | Reason |
|---|---|
| `feed homeless` | long story, too expensive — skip for now |
| `save a child's heart` | excluded |
| `fabian and avi` | excluded |
| `e&s` | excluded |
| `ABRAHAM ACCORDS` | excluded (already done previously) |
| `NOTES TO STRANGERS` | excluded |
| loose `VID*` files / other assets outside the named folders | "don't worry about them" |

---

## THE QUEUE

| # | Video | Folder | Shape | Status |
|---|---|---|---|---|
| 1 | **Jamaica — the bike** | `giving back in jamaica` | STORY. Meet him → his situation → what he wants for his birthday → bicycle → return with it → his reaction. Horizontal footage: punch in/out INSIDE the take, don't chop. Ref `DdeLOuyBAd2` (40s, 4 cuts, 8s/shot). | — |
| 2 | **Giving water** | `GIVING WATER TO W` | COMPILATION, music-led, zoom into faces for reactions. **`IMG_8610` is NOT vertical — must be rotated/flipped correctly.** | — |
| 3 | **Hospital kids → toys** | `HOSPITAL KIDS TO TOYS` | MUSIC ONLY, no speech. Jews + Muslims + Christians together. Named picks: `8701`, `8740`, `8750`, `8753`. **Do NOT use cancer-patient footage near `IMG_8802`.** Folder is >50 files — page properly. | — |
| 4 | **Shalom / Salam** | `SHALOM/SALAM` | Reactions only, flowers-style. **Alternate Muslim and Jewish greetings** — "Salaam Alaikum" then "Shabbat Shalom", back and forth. The switching IS the point. | — |
| 5 | **What makes you happy** | `WHAT MAKES YOU HAPPY` | ONE video combining RANDOM STREETS + LIELLE + FABIAN + clips from Levi. All 57 transcribed. **Tepora's cancer story: hold on her face and slow-zoom in.** | transcribed |
| 6 | **Flowers compilation** | `FLOWERS FOR STRANGERS/FLOWERS` | Jack Jones style (`DQSJn8zirnY`, 35 cuts/min). Many people, fast. | — |
| 7 | **Old Lady Jerusalem** | `FLOWERS FOR STRANGERS/OLD LADY JERUSALEM` | Run up → give flowers → her reaction. Long-take model (`DWwnzm1jUTn`, 3 cuts/min). She is in a wheelchair, covered market at night. | proxied |
| 8 | **Cleaner Jerusalem** | `FLOWERS FOR STRANGERS/CLEANER JERUSLAEM` | Same shape as #7. His face when he realises. | — |
| 9 | **Max — hugs** | `HUG FOR STRANGER/MAX (THIS IS ME MAX)` | Little/no talking. Reactions and how happy people are. | — |
| 10 | **Fabian — hugs** | `HUG FOR STRANGER/FABIAN` | Same. | — |
| 11-18 | **Kindness tests** | `KIDNESS TEST/*` | "The World Sucks" style: walk up → ask → their decision → payoff. Some are **Arabic — translate**. Reduce background noise. Folders: `WOMEN ON FLOOR..`, `SHOP OWNER`, `Shop Owner 2`, `SHOP OWNER 3`, `SHOP OWNER 4`, `Shop owner 5`, `Shop owner 7`, `muslin guy in coffee shop`. Target ~3s/shot (`CcyT0e_lYrb`, `C7mDUt5tsRC`). | — |

---

## PER-VIDEO METHOD

1. Discover the folder (per-shoot index — never overwrites another shoot).
2. Pull `efficient` proxies only. **Never download all originals.**
3. Transcribe with Groq turbo (cached; ~$0.01 a shoot).
4. Read transcripts + inspect frames — transcript alone has already misled me
   once (the newlywed groom in a wheelchair was invisible in text).
5. Pick the strongest emotional moment, build around it.
6. Download ONLY the originals used.
7. Cut, caption (gold ALL-CAPS 1-2 words at ~76% height, white title pill top-left).
8. Low-res preview in chat → correction → learn → upload on approval.
