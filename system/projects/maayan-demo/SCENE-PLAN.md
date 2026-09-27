# SCENE PLAN — El Hamaayan demo, script v2

**Status: v2 — built as mock v1 (43.1 s, `preview/`). Owner asked for 45 s, "cut long segments, keep it interesting",
demo account OK, app is live on the App Store and Google Play.** v1 (72 s) is in git history.

45 s · 9:16 · English · text only, no voiceover · 9 beats · ~20 caption cards

## Look

- Real app screen recordings (English locale) inside a phone frame, on a blurred
  real place photo from the app. No stock footage, no AI imagery.
- Caption cards sit ABOVE the phone: white, bold, sentence case, 2–6 words, one
  card at a time. One key word may take the brand colour.
- Hard cuts between beats. A finger dot shows every tap and swipe.
- Nothing longer than 9 s. Discover is the longest beat — it's the most fun to watch.
- Music: none in the mock.

## Numbers used (checked 2026-09-27 against the live DB, published places only)

624 springs · 249 trails · 174 lookouts = **1,047 places** → written as "1,000+".
Film only places that have an English name (763 of 1,047 do).

## The script

| # | Time | Screen (real app) | On-screen text |
|---|---|---|---|
| 1 | 0:00–0:03 | Full-bleed photo of a spring | **Where's there water today?** |
| 2 | 0:03–0:08 | Map: pins over Israel → zoom → tap a pin, the sheet peeks up | **1,000+ springs, trails and lookouts** → **All on one map** |
| 3 | 0:08–0:13 | Place page: swipe photos → "How's the water?" → tap *A trickle* | **Real photos** → **Updates from people who were there** |
| 4 | 0:13–0:22 | Discover: swipe right (Like), left (Skip), right, open the summary | **Can't decide?** → **Swipe right to like** → **Left to skip** → **Your picks, saved** |
| 5 | 0:22–0:26 | What's near me: one tap → results | **What's near me?** → **One tap** |
| 6 | 0:26–0:30 | ♥ a place → the lists shelf | **Save it. Sort it into lists.** |
| 7 | 0:30–0:38 | New trip (the jeep) → dashboard → packing list, tap "I will bring it" | **Plan the trip together** → **Who brings what** |
| 8 | 0:38–0:41 | Communities | **Find people to hike with** |
| 9 | 0:41–0:45 | End card: logo + store badges | **El Hamaayan** → **Invite your friends** · App Store · Google Play |

## Cut from v1

Quiz, filters, the separate report screen (folded into beat 3), seats/vehicles,
weather strip, the long trip walkthrough.

## Production notes

- Demo account created through the app's own sign-up (owner OK, 2026-09-27).
- Chromium in this container has no direct egress; recordings route the
  browser's requests through the container (Playwright `page.route` → Node fetch).
