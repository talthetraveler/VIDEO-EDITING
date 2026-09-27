# SCENE PLAN — El Hamaayan demo, script v1

**Status: DRAFT — waiting for owner approval.** Nothing is built until this is approved.

~72 s · 9:16 · English · text only, no voiceover · 12 beats · ~40 caption cards

## Look

- Real app screen recordings (English locale) inside a phone frame, on a blurred
  real place photo from the app. No stock footage, no AI imagery.
- Caption cards sit ABOVE the phone: white, bold, sentence case, 2–6 words, one
  card at a time. One key word may take the brand colour.
- Hard cuts between beats. Inside a beat, the screen recording plays — the
  real interaction (a swipe, a tap) is the motion.
- Music: none in the mock (see open question 3).

## Numbers used (checked 2026-09-27 against the live DB, published places only)

624 springs · 249 trails · 174 lookouts = **1,047 places** → written as "1,000+".
Film only places that have an English name (763 of 1,047 do).

## The script

| # | Time | Screen (real app) | On-screen text |
|---|---|---|---|
| 1 | 0:00–0:04 | Full-bleed photo of a spring, no phone yet | **Where's there water today?** |
| 2 | 0:04–0:07 | Logo on the photo | **El Hamaayan** · *Springs, trails and lookouts in Israel* |
| 3 | 0:07–0:15 | `/map` — clusters over Israel, zoom into a region, tap a pin, the sheet peeks up | **1,000+ places. One map.** → **Springs. Trails. Lookouts.** → **Tap any pin** |
| 4 | 0:15–0:23 | Place page — swipe the photos, scroll to "What people say", tap Directions | **Real photos** → **Latest updates from hikers** → **One tap for directions** |
| 5 | 0:23–0:29 | `/report` — "How's the water?" → tap *A trickle* → send | **Been there? Tell everyone** → **Strong flow. A trickle. Dry.** |
| 6 | 0:29–0:40 | `/discover` — swipe right (Like stamp), swipe left (Skip stamp), one more right, open the summary | **Can't decide?** → **Swipe right to like** → **Left to skip** → **Your picks, in one list** |
| 7 | 0:40–0:45 | `/nearby` — one tap, results with the drive radius in the header | **What's near me?** → **One tap. No questions.** |
| 8 | 0:45–0:50 | `/quiz` — two quick answers, then the 3 results | **Or answer a few questions** → **Get 3 places that fit your day** |
| 9 | 0:50–0:55 | `/places` filters → ♥ a place → `/collections` shelf | **Filter by what you want** → **Save the ones you like** → **Sort them into lists** |
| 10 | 0:55–1:06 | `/trips/new` (the jeep drives in) → trip dashboard → who's coming → seat picker → packing list → the day's stops + weather strip | **Plan the trip together** → **Who's coming** → **Who drives, who rides** → **What to pack** → **Stops, in order** → **Weather and sunset** |
| 11 | 1:06–1:10 | `/community` — scroll communities, open a trip | **Find people to hike with** |
| 12 | 1:10–1:14 | Logo end card | **El Hamaayan** · **elamaayan.com** · *(CTA — open question 2)* |

## Left out on purpose (say if you want any back)

Offline mode · live blue dot · friends · creator pages · "on the way" trail
links · profile/settings. Each adds ~4 s; the demo is already dense.

## Open questions

1. **Account to record with.** The collections, trips and community beats need a
   logged-in account with real-looking data. Your account, or a demo account
   I set up (that writes rows to the production DB — needs your OK)?
2. **End-card call to action.** The app is in closed beta. "Join the beta",
   "Coming soon to iOS & Android", or just the URL?
3. **Music.** Silent mock, or a light bed? A track has to be one you have the
   rights to.

## After approval

1. Record each beat from the app (Playwright, 360×800, English locale).
2. Build the Remotion composition (`PhoneMockup`, caption cards, end card).
3. Render a low-res mock (540×960) and check stills of every beat first.
4. Send the mock for review.
