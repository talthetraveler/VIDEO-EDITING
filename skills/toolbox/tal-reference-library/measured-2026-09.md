# MEASURED REFERENCES — 2026-09-20

Every number here was measured locally with ffmpeg scene detection
(`select='gt(scene,0.3)'`) on the actual downloaded file. Nothing is estimated.
Files live in `projects/_refs/` (competitor refs) and `projects/_refs/tal/`
(Tal's own posted reels). Downloaded with `bin/yt-dlp.exe` — **Instagram works
with no login and no API key**, so any reference Tal sends can be measured.

Caveat on the method: scene detection counts hard visual changes. A **punch-in
or zoom inside a continuous take does not register as a cut**, so a low cut
count does NOT mean a static video — see the Jamaica reference below.


> ## ⚠ CORRECTION 2026-09-20 — THE NUMBERS BELOW USED THE WRONG THRESHOLD
>
> Every cut count in this file was measured with `select='gt(scene,0.30)'`.
> That threshold **misses real cuts between similar-looking shots** — beach
> after beach, market stall after market stall.
>
> | | @0.30 | @0.20 (correct) |
> |---|---|---|
> | `DY25uksM6iP` (1.7M) | 0 cuts | **4 cuts** |
> | `DY0BKrvRFO1` | 4 | **10** |
> | `DYwdAcsMUwh` | 3 | **7** |
> | `DdeLOuyBAd2` (Jamaica ref) | 4 | **10** (15/min, not 6) |
> | *Love is the answer* | 5 | **16** (26.5/min, not 8.3) |
>
> **"His biggest video has ZERO cuts" was wrong.** It has 4. The broad
> conclusion still holds — single-subject stories hold shots far longer than
> many-people compilations — but treat every absolute number below as a floor,
> not a fact, until re-measured at 0.20.
>
> **Always measure at 0.20 and sanity-check against the transcript.** If the
> transcript shows 18 exchanges and the detector says 5 cuts, the detector is
> wrong.

---

## 1. TAL'S OWN TOP REELS — the ground truth

This is the most important table in this file. It is Tal's own work, ranked by
the only metric that matters, and it **contradicts the instinct to cut fast**.

| Reel | Views | Duration | Cuts | Cuts/min | Avg shot |
|---|---|---|---|---|---|
| `DY25uksM6iP` | **1.7M** | 60.5s | **0** | 0.0 | **60.5s** |
| `DcjtDsYRZrk` | 759K | 36.2s | 7 | 11.6 | 4.5s |
| `DY41AJUM7L7` | 551K | 145.7s | 105 | 43.2 | 1.4s |
| `DYsXrzVxHD9` | 507K | 80.0s | 43 | 32.2 | 1.8s |
| `DYwdAcsMUwh` | 486K | 76.5s | 3 | 2.4 | 19.1s |
| `DY0BKrvRFO1` | 446K | 155.3s | 4 | 1.5 | 31.1s |

**The single biggest video has ZERO cuts.** Three of the top six average 19-60s
per shot. The two fast-cut compilations (32-43 cuts/min) sit at the bottom of
this list, not the top.

**Rule this produces:** for a ONE-PERSON conversation, do not manufacture pace
by cutting. Hold the shot and let the face work. Fast cutting belongs to
compilations of MANY people, where the cut IS the structure. Picking the wrong
one of these two is the most expensive mistake available on this footage.

### Tal's caption system — measured off `DY25uksM6iP` (the 1.7M reel)

- **Title pill** — white rounded rectangle, top-left, black bold ALL-CAPS,
  emoji inline, wraps to 2-3 lines.
  Example: `POV: I WENT TO MEET MUSLIMS ☪️ IN ISRAEL 🇮🇱`
- **Speech captions** — **ALL CAPS, GOLD/YELLOW, bold sans, no background box**,
  thin dark outline for legibility.
- **Position ~76% of frame height.** Lower third, but deliberately NOT jammed to
  the bottom edge.
- **1-2 words on screen at a time.** Observed: `SURPRISED` · `SECOND` ·
  `CAR PASS` · `YOU'RE ABLE` · `JEWS AND`.
- On the zero-cut reel **the captions carry the entire rhythm**. When the
  picture does not cut, the caption cadence is the pacing device.

---

## 2. COMPETITOR / STYLE REFERENCES

Measured the same way. Grouped by what they are actually good for — the cut rate
separates them far more cleanly than their titles do.

### LONG-TAKE (hold the shot; energy from performance, captions and punch-ins)

| id | What Tal called it | Dur | Cuts | /min | Avg shot |
|---|---|---|---|---|---|
| `DXoFZq8EWOh` | flowers + sandwich | 126.3s | 1 | **0.5** | 63.2s |
| `DWwnzm1jUTn` | giving flowers to strangers | 60.8s | 3 | **3.0** | 15.2s |
| `CjYWrEtJmrg` | asking for a smoothie | 41.2s | 3 | 4.4 | 10.3s |
| `DWRjpRPDZXh` | small acts, big impact | 72.4s | 7 | 5.8 | 9.1s |
| `DdeLOuyBAd2` | **Jamaica / horizontal convo** | 40.1s | 4 | 6.0 | 8.0s |
| `DcWPgz0p_Nj` | you matter more than you know | 41.1s | 5 | 7.3 | 6.9s |

**`DdeLOuyBAd2` is the model for horizontal conversation footage** (Tal sent it
specifically for the Jamaica bike video). Only 4 cuts in 40s, but it does not
feel static: the movement is **punch-ins and pull-outs inside the take**, which
scene detection cannot see. Reframe within the shot; do not chop the
conversation into pieces.

### MID (a conversation that breathes, with real cutaways)

| id | What Tal called it | Dur | Cuts | /min | Avg shot |
|---|---|---|---|---|---|
| `DbEON4-R2ws` | fortune cookie street Q&A | 11.5s | 2 | 10.5 | 3.8s |
| `DcYo0vMseJk` | Jean, Beirut | 118.5s | 24 | 12.1 | 4.7s |
| `DczV7rxhOw7` | paying for groceries | 31.7s | 7 | 13.3 | 4.0s |
| `DcRWmhnon1W` | asking strangers for a hug | 23.1s | 6 | 15.6 | 3.3s |
| `CcyT0e_lYrb` | MD Motivator — Michael | 43.9s | 13 | 17.8 | 3.1s |
| `C7mDUt5tsRC` | restaurant kindness moment | 58.4s | 19 | 19.5 | 2.9s |
| `DapNYXWtICx` | street Q&A, message to world | 56.3s | 20 | 21.3 | 2.7s |

The two Tal named as the most important kindness-test references
(`CcyT0e_lYrb`, `C7mDUt5tsRC`) both land at **~3s per shot**. That is the target
for a kindness-test story: not fast, not static.

### FAST (many people; the cut IS the structure)

| id | What Tal called it | Dur | Cuts | /min | Avg shot |
|---|---|---|---|---|---|
| `DYwzJLmoB2S` | free hugs sign | 80.4s | 40 | 29.8 | 2.0s |
| `DdY0DfwMFRo` | happy montage / zoom-ins | 44.7s | 23 | 30.8 | 1.9s |
| `DT_GXspgP7x` | free hugs | 61.8s | 31 | 30.1 | 1.9s |
| `DdbSNgUuY2B` | POV switching reference | 36.8s | 19 | 31.0 | 1.8s |
| `DQSJn8zirnY` | Jack Jones, flowers to elderly | 179.2s | 105 | 35.1 | 1.7s |
| `DS9-SeKjD6N` | paying kindness forward | 52.1s | 40 | 46.1 | 1.3s |
| `DYXyA_fRuy4` | homeless man, 5-star restaurant | 67.4s | 55 | 48.9 | 1.2s |

---

## 3. THE TRAP THIS TABLE EXPOSES

Tal attached **Jack Jones `DQSJn8zirnY` (35 cuts/min, 3 minutes)** AND
**`DWwnzm1jUTn` (3 cuts/min, 1 minute)** to the SAME brief — video #1, "one very
simple emotional video, keep this short and simple."

Those are opposite films. Taking the average of two references produces
something that is neither.

- For **#1 Old Lady** and **#2 Cleaner** — single-subject, "focus heavily on her
  reaction" — follow `DWwnzm1jUTn`: long takes, ~3-6 cuts/min, the reaction
  held.
- Jack Jones is the template for **#3 Flowers Compilation**, where many
  different people are the point.

Same logic applies to `DWRjpRPDZXh` (small acts, 5.8/min), which Tal attached to
both #2 (single subject — correct) and #4 (water compilation — where the faster
`DS9-SeKjD6N` at 46/min is the better guide).

**When two attached references disagree by 10x on cut rate, the brief's own
words decide.** "Short and simple, focus on her reaction" = long take.
"Lots of different people" = fast cut.
