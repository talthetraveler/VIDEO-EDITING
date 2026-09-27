# Restaurant / shop-owner reel ("MEETING A … IN ISRAEL", "I WENT TO A … OWNED BY …")

**What it is:** he walks into a business — bakery, hummus counter, falafel shop,
deli — run by someone from a specific background (Muslim, Arab Christian, etc.),
talks to the owner, orders / pays / tastes the food, warm exchange, goodbye. Same
kindness mission as `kindness-greetings.md`; here it's one longer interaction in
one place instead of many quick street greetings.

Watched examples: "MEETING AN ARAB CHRISTIAN IN ISRAEL" (41.6K), "POV: MEETING A
MUSLIM IN ISRAEL" (45.1K), "POV: I WENT TO A BAKERY OWNED BY A MUSLIM IN ISRAEL",
"THE MOST PEACEFUL BAKERY IN ISRAEL". Often **7+ consecutive raw clips = one of
these** — see the scene-grouping note below.

## Keep / cut

**KEEP:** the walk-in + first hello, the owner saying what they make / how long
they've been there / family, the order + payment, the **taste + reaction beat**
(POV thumbs-up, "YEAH", "STILL", a nod), one warm human line, the goodbye /
handshake. **CUT:** waiting for food, him narrating to camera for >1 sentence,
retakes, filler, awkward silences, anything transactional with no warmth.

## Structure (20–40 s)

1. **Title card** (`<TitleCard variant="pill">`) — white pill, black ALL-CAPS,
   `POV: MEETING A MUSLIM 🌙 IN ISRAEL 🇮🇱` / `THE MOST PEACEFUL BAKERY IN ISRAEL`.
2. Walk-in + hello (2–3 s).
3. Owner introduces the place / the food (one or two beats).
4. **Order + taste + reaction** — the payoff. Gold caption on the reaction word.
5. One warm line + goodbye / handshake.

Multiple variations from one interaction: a 20 s tight cut (walk-in → taste →
goodbye), a 35 s one with the owner's story, a "just the food" cut, a "just the
kindness" cut. Also cross-cut several shops into one "5 restaurants in Israel"
compilation — best 3 beats each.

## Captions

Per `house-style.md`. This format leans on **cream/gold bold ALL-CAPS** as the
main caption colour ("YEAH", "STILL"), and sometimes the **white serif-italic
lowercase** running style ("in Israel", "best bakery"). Centred ~62% down, drop
shadow, no box.

## Build

Same as `kindness-greetings.md` step 3 — `<Series>` of `<Video src trimBefore>`
beats (from the grouped scene's clips) + `<TitleCard>` + `<Captions>`. Use
`npm run tighten -- --batch` first; the index's per-clip transcripts tell you
which consecutive clips are the same shop (owner's name, dish names repeat).

## Scene grouping

Consecutive Meta-glasses clips with small time gaps and a continuing transcript
(same shop, same owner, dish names carrying over) are ONE interaction. Group them,
then cut one or more reels from the group. Don't make one reel per raw clip.
