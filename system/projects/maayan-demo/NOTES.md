# NOTES — El Hamaayan demo

## Mock v1 — 2026-09-27

`preview/El Hamaayan demo - mock v1.mp4` (not in git — *.mp4 is ignored): 540×960, 43.1 s,
H.264 yuv420p (re-encoded from Remotion's yuvj420p — CLAUDE.md §7), no audio.

Rebuild:
1. Maayan dev server: `VITE_BIND_HOST=127.0.0.1 bunx vite dev --port 5199` (maayan-trail-planner).
2. `cd projects/maayan-demo/record && NODE_USE_ENV_PROXY=1 DEMO_EMAIL=… DEMO_PASSWORD_FILE=… node beats.mjs`
   → `public/maayan-demo/clips/*.mp4`. Needs Playwright from the maayan repo's node_modules and a
   full ffmpeg (lib.mjs `FFMPEG`, `pip install imageio-ffmpeg`).
3. `npx remotion render src/maayan-demo/index.ts MaayanDemo out.mp4 --scale=0.5 --crf=24 --browser-executable=<headless_shell>`
   The edit itself is data: `src/maayan-demo/timeline.ts`.

## Decisions and why

- **Screencast frames, not Playwright recordVideo** — recordVideo is ~1 Mbit VP8; CDP screencast
  JPEGs at q90 are sharp inside the phone frame.
- **Touch events for Discover** — a mouse drag on the card's `<img>` starts a native image drag and
  the deck gets `pointercancel`; the swipe never registers. `swipe()` sends CDP touch events.
- **Discover filtered to Golan trails** — unfiltered, the top cards were Hebrew-only names (and one
  photo of a stranger's face). All 23 published Golan trails have `name_en`.
- **Map: hard cut past the fly-in** — Leaflet shows soft half-rendered tiles mid-flight even with
  pre-warmed tiles; the beat cuts from the cluster split straight to the sharp Golan view.
- **No report is ever submitted** — the place beat taps "A trickle" on the report form and stops.
  A demo account must not post a fake condition report on a real spring.
- **Stops screen dropped** — the trip stops list shows Hebrew place names in the English locale.

## Caveats for the owner

- Place beat photo 2 at Ein Pik (a user-contributed photo) shows two identifiable people.
- Discover's first card (Nahal Zavitan) shows children, from behind.
- Community names on screen are user-generated and Hebrew.
- Opening photo: Ein Pik, Wikimedia Commons, CC0 (Aaadir) — no attribution required.
- The "Invite your friends" CTA and store badges come from the owner's note "in production,
  invite, available in all app stores" — confirm the wording.

## App gaps found while recording (English locale)

- Trip stops (`/trips/$id/places`) and the dashboard "Trip plan" list show Hebrew place names —
  those components don't go through `placeName()` (`src/lib/placeName.ts`).
- The default saved collection's label renders as "שמורים" on `/collections`.
- Descriptions fall back to Hebrew ("Not available in English yet") on most places.

## Demo account (production)

`@maya_hikes` — created 2026-09-27 through the app's own sign-up, owner-approved. Email is a
`+elhamaayan-demo` alias of the owner's Gmail. Seeded: `profiles.email_verified_at` set by SQL
(so gated actions work), 6 saved places, 3 collections (Golan weekend / Easy with kids /
Jerusalem hills, 9 items, SQL), trip "Golan weekend" 2026-10-02 with 4 stops (app), 7 shared gear
items (SQL), one "I will bring it" commitment and a few Discover likes/skips (app).

## Founder footage (for the "belonging" beat) — found 2026-09-29

Source: the El Hamaayan Drive, navigated through the media index (`assets.jsonl`, 989 records).
Originals are downloaded to `public/maayan-demo/founders/` — **gitignored, personal photos**.
Contact sheet: `founders-candidates.jpg` (also gitignored).

| # | Drive file id | What | Index says |
|---|---|---|---|
| 1 | 1vnte4GmzCZO34iDhNznwUwrWxW9RRy8Q | Two founders pointing at camera, 2020 pre-army trip | "Founders", hero |
| 2 | 10eWM_UOpSpXJEmMn4nOvkWpmFaeY9LgQ | Two founders arm in arm, 2020 | "Founders", hero |
| 3 | 1R9Ilrnw7tAZdxIN3_EG8TFnWDcarnwDP | Founder laughing in grass, 2020 | "Founder", hero |
| 4 | 1gsYqXeAO19FV919OMyPOiuagFEVyKCQE | Pre-army group above a valley, 2020 (flag in frame) | hero, friends |
| 5 | 10se3pwQwRfSb4PwIz0Ue0G6P_OspGc9Q | Handshake on trail, Ramat HaShofet 2023 | "Friends" — identity unconfirmed |
| 6 | 1FRpLEF1M9NxQlTsx7jXo7Rdv76-j1bfZ | Four friends through SUV roof (drone), 2024 | "Friends" — identity unconfirmed |
| 7 | 19qfT2hgIb3CY-J-mPqgywGoFmhNlB5IL | Night road-trip crew, Kinneret 2025 | "Friends" — identity unconfirmed |
| 8 | 18kqr8jx2r5Y3c9CDlnOzeDYhw5trwynE | UTV, watermelon + guitar, 2025 (shirtless) | "Friends" — identity unconfirmed |
| 9 | 1rh66oK_MGgZyS7vp1tJn3hYx6EChyjZV | Group on Makhtesh Ramon ridge, 2024 (faces tiny) | "Friends" |

Limits hit: the Drive connector downloads ≤10 MB (and dropped the session above ~6 MB), so
**no founder video could be pulled** — every people-in-frame clip in the index is 19–99 MB.
The index names "founders" only on the three 2020 photos; the rest need the owner to confirm who's
in them. Ruled out: the "טרנד תיוג עצמי" raw clips (a friend's desert-camp shoot, no founders) and
"Young hikers on cliff ledge" (children).
