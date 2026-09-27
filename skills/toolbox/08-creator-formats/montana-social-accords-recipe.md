# FORMAT A (fast end) — full build, worked example: Social Accords V3

The **fast end of FORMAT A — Narrated cut** (`SKILL.md`): one person talking to
camera over a script/VO, ~41 cuts/min. Applies to ANY such video — Tal, a
guest, anyone. Montana's `MONTANA TUCKER V3` is just the reference cut it was
measured from (`scratch/refs/sa/ref/REFERENCE_V3.mp4`, 181.5 s, 9:16; every shot
in `scratch/refs/sa/ref/study/` — 146 cut points, `shots.txt`).

> The reusable job: given **a talking-to-camera clip + its script/VO + assets
> (or a green light to source B-roll)**, build a cut like this. The devices,
> pacing, caption rules and 4-act arc are the format (see `SKILL.md`); the §5
> beat sheet is THIS video and is replaced per project.

Structure/technique only — no frame of the reference is reused (CLAUDE.md §1).

---

## 1. Measured spec

| Metric | Value |
|---|---|
| Duration | **181.5 s** (VO tightened ~12 s of pauses from the 194 s raw read) |
| Shots | **136** |
| Mean shot | **1.33 s** · median ~1.3 s |
| Under 1 s | **43 %** of shots |
| Under 2 s | **79 %** |
| Longest shot | 6.8 s (only the very first — the establishing A-roll) |
| Cuts / min | **~41** |
| Aspect / fps | 1080×1920 / 30 |

**The rule:** a picture change every **1–1.5 s**, all the way through. Montana's
A-roll is the spine (~45–55 % of screen time) and everything else is a fast
**cutaway** layered on her VO. She is *never* off screen for more than ~3–4 s.

---

## 2. The eight devices (each recurs)

### D1 — Punch-in cuts on the A-roll
The talking clip is ONE continuous walk-and-talk. It's cut into 0.7–1.3 s
pieces, each a different **crop / push-in / reframe** of the same footage
(wide → chest → face → hands). Never a plain jump cut — always a scale or
position change so the cut reads as energy, not an edit mistake.
→ Remotion: `AutoCut` for the spine + a per-segment `PushIn`/crop wrapper that
varies `scale` (1.0–1.35) and `objectPosition` shot to shot.

### D2 — Phone-in-hand → phone-screen composite
She holds a phone through the open. On "your feed tells you the same thing
**again and again and again**" the shot cuts 3× to a **phone-screen graphic**:
a vertical feed of post/reel cards (police clips, news) with the word "again"
stamped on each, an IG-story-style UI, and a small evil-eye logo bottom-left.
The motif **returns** on "hate is winning **the algorithm**" — same phone, a
reel-scrubber UI, "the algorithm" label.
→ Build: a `PhoneScreen` component — a rounded phone frame, a scrolling column
of `feed card` divs (thumbnail + fake caption), content swappable per beat.

### D3 — Evidence-board news-screenshot stacks (the "hate" visual)
For "one becomes two, two becomes four, four becomes **dozens** … a **trend**":
a **grey paper ground** with **phone-shaped screenshot cards** stacked and
scattered — CCTV missile-strike stills, CNN/Telegraph chyrons, burning-tire
protest frames. A **big yellow counter** sits over it: **`1` → `40` → `DOZENS`**,
caption "becomes 🔥" each step. One card gets a **hand-drawn red box**.
This is exactly `src/components/evidence/` — `PaperBackdrop` + `PhotoStack`
(feed the cards as `PhotoPrint`s) + a counter + `HandScribble kind="circle"`.
Also used for: the **search-results screenshot** on "they click on humanity"
(a browser results page, one result **circled in yellow**), and the **October-7
news article** on "every headline" (article screenshot on paper, "headline"
big in yellow).

### D4 — Animated count-up counters
Yellow, heavy, over an A-roll or B-roll shot: **`13,512,499`** climbing toward
14 M on "a community of more than 14 million"; **`3 BILLION`** on "3 billion
views"; **`66`** / **`1`** / **`40`** as accent numbers.
→ Remotion: `AnimatedCounter` (already exists) styled yellow/black, ~0.6 s ramp.

### D5 — Kinetic single words
A word from the VO blown up huge, centred, 1 beat: **`ALL`**, **`ONLY`**,
**`BREAK`**, and every "**every X**" at the end (`headline`, `religion`,
`nationality` — each its own shot, word in yellow, ~0.5 s). Struck-through
**`stereotypes`**.
→ Remotion: a `HeroWord`-style component, yellow, `power4` scale-in.

### D6 — Yellow location / label cards
Bold yellow all-caps card slapped on for a place or a beat: **`LEBANON`**.
~0.4 s, hard in.

### D7 — The B-roll cutaway library (fast, 0.3–1.5 s each)
Two emotional buckets, cut in **contrast pairs** for the "division" section and
in **runs** for the "kindness" section:

- **Division / "hate"**: CCTV street-altercation (overhead), airstrike smoke
  plume, burning building, empty street w/ lone figure, dark night chase,
  protest crowds. News chyrons left visible.
- **Humanity**: kids doing **heart-hands** (recurring), babies + mothers of
  different backgrounds, close-ups of children's faces, Montana **hugging
  strangers** (a whole montage — recurring), high-fives / greeting lines,
  street-table "**Ask us anything**" conversations, **sign-holders**
  ("I'M A PALESTINIAN & I'M A JEW", "I'M AN ARAB MUSLIM… LET'S TALK",
  "BLACK & JEWISH PEOPLE HAVE MORE IN COMMON THAN…", "SEND A MESSAGE TO PEOPLE
  IN LEBANON", "CHOOSE LOVE"), **Gaza aid** distribution ("GHF Distribution
  Site, Rafah, Gaza" chyron left in), **dancing with kids** (Save a Child's
  Heart), flag-crowd **celebrations**, **other creators** talking to camera
  (to visualise "one creator, then another"), a **creator-video mosaic grid**
  (many tiles), red-carpet / event footage of Montana as "who she is",
  backflip / parkour for pure energy.
- **Family**: grandparents' photos + young-Montana photos as **evidence-board
  photo cards** on paper.

> **Burned-in captions on her reels DO NOT MATTER here** — at 1.3 s/shot they
> read as texture. The reference uses the exact sign / news-chyron / aid-site
> clips I spent hours trying to crop clean. Cut fast, don't fight them.

### D8 — Light-leak / flash transitions
A warm orange lens-flare wipe (~0.2–0.4 s) between the big sections
(problem → turn → mission → close). Not on every cut — only ~4–5 times.

---

## 3. Captions

- **1–2 words per card**, swapping **on every cut** (so ~136 caption cards).
- White, heavy, sentence-case, lower third, black soft shadow, no box.
- **One word per phrase in yellow `#F2C230`** — the payload: `met`, `viral`,
  `trend`, `never`, `humanity`, `kind`, `kindness`, `more`, `stereotypes`,
  plus every end-run word.
- Timed to the word, not the shot — but because shots are ~1 word-group long,
  they line up.
- The existing `nas_caption` preset + `scripts/lib/emphasis.mjs`, just fed
  much shorter groups (`wordsPerGroup: [1,2]`).

---

## 4. Emotional arc (music + grade follow this)

| Act | VO span | Feel | Music | Visual bias |
|---|---|---|---|---|
| **1 — the problem** | 0:00–0:47 | tense, accelerating | low drone → pulse, building | CCTV/airstrike B-roll, evidence-board news stacks, phone feed, red accents |
| **2 — the turn** | 0:47–1:05 | breath, personal | music drops out / soft piano on "but I discovered something" | Montana A-roll, grandparents photos, warm portraits |
| **3 — the mission** | 1:05–2:42 | warm, rising, communal | strings + beat, hopeful, swelling | hugs, kids, heart-hands, signs, creator mosaic, counters |
| **4 — the close** | 2:42–3:01 | anthemic | full, then button | every-X word hits, logo lockup, Montana arms raised |

---

## 5. Beat sheet — VO line → shots (raw seconds of the VO)

Format: **VO** — *shot(s)* — `caption` — device.
Adjust to the tightened VO (V3 runs ~181 s; drop the ~12 s of raw pauses).

**ACT 1 — THE PROBLEM**

1. `0:00` "social media may be teaching you to hate people you've never met" —
   A-roll, phone in hand, 1 long establishing hold (~5 s) then 2 punch-ins —
   `Social Media` / `you've never met` (yellow *met*) — D1, D2.
2. `0:07` "and the scary part, it's working" — 2 punch-ins on A-roll —
   `And the scary` / `it's working` — D1.
3. `0:09` "because every time hate goes viral someone else sees it and learns" —
   **CCTV overhead street-altercation** B-roll, 4 hard cuts —
   `Because` / `every time` / `hate goes viral` (yellow *viral*) / `and learns` — D7 division.
4. `0:13` "one toxic video becomes two, two becomes four, four becomes dozens" —
   **evidence-board news-screenshot stack** on paper, counter **`1` → `40` → `DOZENS`**,
   red box on one card — `becomes` ×3 — **D3 + D4**.
5. `0:23` "so they copy it, repost it, make their own version, something copies
   them, until hate becomes a trend" — back to A-roll punch-ins, arm raised —
   `make their own` / `just content` / `it becomes a trend` (yellow *trend*) — D1,
   then a **light-leak flash** — D8.
6. `0:26` "and when your feed tells you the same thing again and again and again" —
   A-roll leaning on wall looking at phone → **phone-screen feed graphic ×3**,
   "again" stamped — `tells you` / `again` ×3 — **D2**.
7. `0:30` "someone from another country, another religion, another community,
   or another side of an issue" — **contrast-pair machine-gun**: person praying
   under cloth ↔ airstrike smoke ↔ diverse crowd ↔ burning building ↔ African
   dancers ↔ empty street. 0.3–0.8 s each. `another country` / `another religion`
   / `another`+`community` ×3 / `or another` / `side of` ×3 — **D7 contrast**.
8. `0:42` "can start to feel like your enemy, even if you've never met them" —
   greyed city + red `1`, then 2 A-roll punch-ins — `an issue` / `like your
   enemy` / `you've never` (yellow *never*) — D1.

**ACT 2 — THE TURN**

9. `0:45` "but I discovered something — humanity, love and unity can go viral
   too" — **music drops.** A-roll hold, then diverse family photo, red-carpet
   Montana, diverse group walking toward camera — `I love` / (beat) — D7 humanity.
10. `0:49` **light-leak flash**, then A-roll — `Montana Tucker` (her name) — D8.
11. `0:51` "I'm Montana Tucker and I am the grandchild of Holocaust survivors,
    so I grew up learning" — **evidence-board photo cards**: grandparents +
    young Montana + mother, on paper — `of` / `learning` — **D3 (photos)**.
12. `0:55` "where hatred and dehumanization can lead" — A-roll, then **real
    street-fight B-roll** (people shoving) — `dehumanization` ×2 / `can lead` —
    D7 division.

**ACT 3 — THE MISSION**

13. `0:58` "but I've also spent my life traveling the world meeting people" —
    A-roll walking, Montana greeting/hugging a man on a couch — `spent my life`
    / `traveling` / `Meeting people` — D1, D7.
14. `1:03` "who look different than me, pray differently, and see the world
    differently" — **warm portraits run**: Black woman + baby, hijab + baby +
    Montana, child close-up — `look different` / `pray differently` / `And to
    see` / `differently` — D7 humanity.
15. `1:09` "and after building a community of more than 14 million people
    online" — A-roll with **counter `13,512,499` → 14 M** climbing —
    `their stories` — **D4**.
16. `1:13` "I started telling those stories — stories about people, not
    stereotypes" — A-roll close w/ mic — `stories` `about` / `Not stereotypes`
    (yellow, struck-through) — D5.
17. `1:19` "and when those stories generated more than 3 billion views" —
    **evidence-board card** "This is Lise Mumporeze, from Rwanda…" (named
    person, news-caption style) + Montana with a child + **creator mosaic
    grid** — `And when` / `those stories` / `generated more` ×2 — D3, D7.
18. `1:23` **`3 BILLION`** counter over the mosaic grid, then A-roll —
    `I realized` / `only click on` — D4.
19. `1:25` "people don't only click on outrage — they click on humanity too" —
    **browser search-results screenshot** on paper, one result **circled
    yellow** ("I'M A PALESTINIAN & I'M A JEW / ASK US ANYTHING",
    "Pro-Palestine & Pro-Israeli Activists…") — `outreach` ×2 / `they click on`
    — **D3 + circle**.
20. `1:29` "so I started asking a bigger question — what if we can make humanity
    spread the same way hate does" — A-roll, then **heart-hands run** (woman +
    child, child face, kid heart-hands) — `started asking a` / `What if I could`
    `make humanity` (yellow *humanity*) / `the same way hate does` — D7.
21. `1:35` "what if the next thing people wanted to copy was helping a stranger,
    doing something kind" — A-roll, then **stranger-hug B-roll** (keffiyeh /
    hijab embrace) — `to copy` / `a stranger?` / `Doing something kind` (yellow
    *kind*) — D7.
22. `1:41` "for someone who needed it — sitting down with someone you're told to
    hate" — **sign B-roll** "SEND A MESSAGE TO PEOPLE IN LEBANON", **`ONLY`**
    word, **`LEBANON`** card — `Sitting down` / `to hate` — D5, D6.
23. `1:46` "and actually listening" — **backflip/parkour** + **Montana dancing
    with kids** + **`ALL`** word — `listening` — D5, D7.
24. `1:48` "what if one creator did it, another creator saw it and thought I
    want to do that too" — **other creators talking to camera** (straw-hat guy,
    classroom kids waving, white-top woman creator) — `What if one` / `one
    creator` / `did it` / `saw it` / `do that too` / `Then` — D7 (creator
    intercut).
25. `1:56` "then another and another, until kindness, understanding and human
    connection became contagious too" — **creator mosaic grid**, then **Montana
    hugging montage** (African woman, hand on heart), then kid heart-hands —
    `until` / `understanding` / `connection` / `became` ×2 / `contagious too`
    ×2 — D7.
26. `2:05` "but one person can't change the internet" — crowd/aid B-roll +
    **light-leak flash**, then A-roll (denim jacket, table) — `contagious too`
    / `can't change` — D8.
27. `2:08` "so we're bringing together storytellers from around the world to
    create the kind of content we want to see" — **street-table "ASK US
    ANYTHING"** convo (Palestinian flag, sign) — `together` / `the world` /
    `the kind of` / `we want` / `to see more of` — D7.
28. `2:15` "acts of kindness" — **Gaza aid distribution** (helmet, "GHF
    Distribution Site, Rafah, Gaza" chyron, handing boxes) — `acts of` /
    `acts of kindness` ×2 (yellow *kindness*) — D7.
29. `2:18` "unexpected conversations" — **hug**, then **"LET'S TALK ABOUT IT /
    CHOOSE LOVE" sign**, then two people embracing, pride/trans flags —
    `unexpected` ×2 / `conversations` — D7.
30. `2:23` "stories that break stereotypes, and moments that remind us who we
    are to each other" — A-roll (`stereotypes` yellow), then **high-five /
    greeting-line** B-roll, **flag-crowd celebration** — `moments that` / `who
    we are` / `to each other` — D5, D7.
31. `2:30` "not to tell you what to think, not to tell you who to agree with,
    but to introduce you to people you might otherwise spend your entire life
    misunderstanding" — A-roll + **flag crowd** + **Montana hugging older
    woman** + young man to camera + **kids marching with flags** + wide crowd —
    `not to tell you` / `but to` / `introduce you` / `to people` / `that you
    might` / `otherwise spend` / `your entire life` / `misunderstanding` — D7.
32. `2:48` "and not just to show people there's more humanity in the world, but
    to create more of it" — **overhead flat-lay: hands packing aid kits**
    (Save-a-Child's-Heart logo), man eating sandwich (candid), then group photo
    of Montana + creators — `And not just` / `to show people` / `more humanity`
    / `but to create more` (yellow *more*) — D3, D7.

**ACT 4 — THE CLOSE**

33. `2:56` "because right now, hate is winning the algorithm" — A-roll arms
    raised, then **dark night chase B-roll**, then **phone "the algorithm"
    graphic** — `right now` ×2 / `hate` / `is winning` — D2, D7.
34. `3:00` "so we're gonna give it some competition" — A-roll — `give it some`
    — D1.
35. `3:02` "This is the Social Accords, a global movement" — Montana walking
    arms out, **diverse group toward camera**, family photo, **"I'M AN ARAB
    MUSLIM… LET'S TALK" sign** (`66`) — `A global` ×2 / `movement` — D7.
36. `3:07` "using storytelling, human connection and acts of kindness to fight
    hate, misinformation and dehumanization with humanity" — A-roll close +
    community elder + **helping-hand** B-roll — `story telling` / `to fight` /
    `dehumanization` / `with` — D7.
37. `3:12` "because behind every username" — **helping-hand** reaching down ×2 —
    `every username` ×2 — D7.
38. `3:15` "every headline" — **October-7 news-article screenshot** on paper,
    **`headline`** big yellow — **D3 + D5**.
39. `3:17` "every religion" — **"LET'S TALK" sign + "BLACK & JEWISH PEOPLE HAVE
    MORE IN COMMON THAN…" sign**, **`religion`** big yellow — D5, D7.
40. `3:18` "every nationality" — Black man holding the "BLACK & JEWISH…" sign,
    **`nationality`** big yellow — D5, D7.
41. `3:20` "every label is a human being" — A-roll close — `is a human` — D1.
42. `3:23` "I'm Montana Tucker, this is the Social Accords" — A-roll, then the
    **S▽A gold logo lockup** (dark bg, gold monogram, ~1.5 s) — `Montana` /
    `Tucker` / `the social` — **D5 / logo**.
43. `3:26` "and we are here to do one thing — make humanity go viral. So join
    us, we're just getting started" — A-roll **arms raised**, `viral` yellow,
    end on logo or her.

---

## 6. Asset checklist (what to source / generate before building)

**Have:** the raw A-roll (`projects/social-accords/raw/MASTER.mov`), the VO
transcript + word timings, 18 Montana IG reels
(`projects/social-accords/assets/instagram/`), the evidence-board components.

**Need from Tal:**
- The **S▽A "SOCIAL ACCORDS"** gold logo file (dark + gold monogram).
- OK to **source/generate** the non-Montana B-roll (brief said "feel free to
  generate missing clips") and confirm the source: stock / an image-video model
  / his folder.

**Need to source or generate:**
- CCTV / overhead street-altercation clip (division)
- airstrike smoke-plume + burning-building clips (division) — or stills
- news-screenshot images: CCTV missile chyron, CNN/Telegraph frames,
  October-7 anniversary article, a browser search-results page for
  "pro-Palestinian pro-Israeli together" (screenshot from the web is fine)
- a dark night-chase clip (for "hate is winning")
- generic: kids heart-hands, stranger hugs, high-fives, a creator-video mosaic
  (can be built from many small clips), red-carpet Montana (from her IG)
- grandparents / young-Montana photos (ask Tal)

**More Montana reels:** her IG page enumeration was IP-429'd — either wait,
paste more reel URLs, or reconnect the Chrome extension. See
[[montana-social-accords-edit-style]].

---

## 7. Build notes (Remotion)

- **Spine:** `AutoCut` on the A-roll, wrapped per-segment in a crop/`PushIn`
  that varies scale + objectPosition every cut (D1). Drive segment boundaries
  off a hand-tuned cut list (~136 entries) aligned to the VO word timings.
- **Cutaway track:** a `Sequence` per B-roll insert, `from`/`durationInFrames`
  from the cut list, overlapping the spine. Hard cuts (no cross-fade) except
  the 4–5 `LightLeak` transitions (D8).
- **Reuse:** `src/components/evidence/*` (D3), `AnimatedCounter` (D4),
  `Captions` + `nas_caption` + `emphasis.mjs` with `wordsPerGroup:[1,2]` (§3).
- **Build new:** `PhoneScreen` (D2), `HeroWord`-yellow (D5), `LabelCard`
  yellow (D6), `LogoLockup` (needs the file).
- **Pace check:** after a render, run `ffmpeg scene-detect` — target
  **35–45 cuts/min**, median shot **1.2–1.5 s**, <2 s share **≥ 75 %**. If it
  measures slower, it's wrong.
- Render disk: `scripts/sa-render.mjs` now sweeps `%TEMP%/remotion-*` + rm's
  its serveUrl — keep using it, not per-call `npx remotion render`.

See [[montana-social-accords-edit-style]], [[creator-formats-nas-montana]],
[[render-disk-and-roottsx]].
