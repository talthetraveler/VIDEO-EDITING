# @aija (Aija Mayrock) — last 10 reels, measured

Measured 2026-09-28 for Tal's system — **technique only**; her footage, music,
AI images and graphics are never reused (CLAUDE.md §1 Rights).
"Watched" = for every video: a **2 fps filmstrip** (every 0.5 s, whole
runtime) inspected; `reference-shots.mjs` (shot list + Groq word timings +
per-shot sheet); full-res frames with a 5 % height grid for caption
measurement; ebur128 + mid/side RMS + 100 ms envelope correlation + end-card
tail. Not continuous playback.

**DdSItlnpBYt is not her edit** — it is the NAS Daily collab (Montserrat-style
captions, yellow key word, emojis inside captions, big yellow condensed
titles, NASDAILY end card = `nas-explainer.md` house style). Measured as a
**control**, excluded from her styles.

## 1. Per-video table

Real shots = counted by eye from 2 fps filmstrips (±3). The detector misses
both ways: over-counts flash transitions / phone-UI animations / WeWard's
0.16 s flicker on AI phone shots; under-counts dissolves, dip-to-white and slow
AI/CGI clips (Extinction: detector 17 vs ~24 real). Shots/min over content
only (end card excluded). wpm = first word → last word.

| id | views | topic | runtime (content) | real shots (detector) | shots/min | wpm | LUFS / TP | bed: side vs mid RMS | caption face | style |
|---|---|---|---|---|---|---|---|---|---|---|
| DdLGceKhVXd | **933K** | WeWard — paid to walk | 64.7 s (60) | ~38 (50) | **38** | 189 | −14.3 / −0.5 | −25 / −17 | serif | S2 founder |
| DdF2mwmMyx2 | **663K** | Beyond Oil — father+son powder | 109.0 s (104.5) | ~55 (46) | 32 | 177 | −14.2 / −0.5 | −27 / −18 | serif | S2 founder |
| DdSItlnpBYt | 357K | Naxi "emoji language" (**NAS edit**) | 112.6 s (109.5) | ~45 (53) | ~25 | 140 | −14.0 / −0.8 | −29 / −17 | NAS house | control |
| Ddu0K8WsBwc | 330K | Mount Athos — women banned | 63.2 s (60) | 18 (16) | **17** | 183 | −14.1 / −0.8 | −31 / −17 | sans | S1 AI explainer |
| Ddkty-0sVhm | 291K | "90th birthday" gift books | 114.2 s (108.5) | ~45 (42) | 25 | 146 ¹ | −14.1 / −0.5 | −36 / −17 | serif + title cards | S5 personal story |
| DdAsBZbsW5m | 254K | Fraxel laser on her face | 68.7 s (67.5) | ~32 (24) | 28 | 169 | −14.2 / −0.6 | −30 / −17 | serif | S3 body test |
| Dc478-GslZm | 158K | JoltzAED mini defibrillator | 79.0 s (74) | ~31 (30) | 25 | 205 | −14.2 / **+0.5** | −29 / −17 | sans | S2 founder |
| DdYAZythNRi | 113K | Nuropod 60-day challenge | 87.1 s (84.5) | ~44 (31) | 31 | 186 | −14.3 / **+1.0** | −29 / −18 | serif | S3 body test |
| DddWi-hhCf0 | 53.3K | lunch with Holocaust survivor Kitty | 138.6 s (135.5) | ~52 (63) | 23 | 178 ² | −14.1 / −0.1 | −33 / −17 | serif | S4 "come with me" |
| DdpqDSgsk57 | 43K | Great Extinction — 80 % of life died | 64.2 s (61) | ~24 (17) | 24 | 153 | −14.2 / −0.8 | −31 / −17 | sans | S1 AI explainer |

¹ Tool printed 111 wpm — Whisper hallucinated "Thank you" at 114–144 s, past
the end of the 114 s file. Real speech 0–108.5 s: 264 words → 146 wpm.
² Groq dropped ~8 s of Kitty's own speech (31–39 s; captions show she talks) —
wpm slightly low.

**Her 9 own videos:** median **25 shots/min** (17–38), **178 wpm** (146–205),
runtime 64–139 s (median 79 s), mastered **−14.0 to −14.3 LUFS** on all.

## 2. What all 9 of hers share

1. **Voice from 0.0–0.5 s, caption on screen from frame 0.** No silent open, no title card.
2. **Pull-back zoom open on 7/9** — frame 0–~8 (≈0.3 s) scales ~1.3× → 1× with
   motion blur. Exceptions: Nuropod (walk-in + 0→60 counter), Kitty (walk-in).
3. **First sentence = a claim with a twist; the payoff word lands at 3.3–6 s**
   as the one big emphasis card: "…because women **ARE BANNED**",
   "…just to **walk**", "…fried food **10X HEALTHIER**", "…80 % of life on earth **DIED**".
4. **Captions** (full-res frames, ±2 % height): white, **sentence case**,
   **no outline**, soft dark drop shadow, no colour key word; 1–2 lines,
   **~2–5 words per page**, paced by phrase (not karaoke). Block centre
   **y ≈ 0.58–0.67 (typ. 0.65)**, **moved per shot to clear faces/objects**
   (y 0.18 on "This is the NUROPOD"; ~y 0.50 above the baby basket in Athos).
   **Two faces rotate:** humanist semi-bold sans (Athos, Extinction, Joltz) and a
   high-contrast bold display serif (the other six). Est. line height: sans
   ≈ 0.05 H, serif ≈ 0.035–0.04 H.
5. **Emphasis = 1–2 words per video, ALL CAPS at ~2×**, white, heavier shadow,
   **replaces** the caption for 1–1.5 s; never coloured. (ARE BANNED,
   MIHAILO TOLOTOS, DIED, THE GREAT EXTINCTION, 252 MILLION, SURVIVED, SPREAD,
   DEFIBRILLATOR, FRAXEL LASER, 10X HEALTHIER, NUROPOD.) Exceptions: WeWard's
   huge lowercase serif "walk"; the 90th-birthday full-screen title cards
   (white sans + red second word: ROSES / DIE, TECHNOLOGY / BREAKS, CLOTHES GET / OLD).
6. **Numbers as animated proof:** WeWard "+$0.01 / +$0.10 / +$0.19" over three
   0.5 s walking shots; Nuropod 0→60 counter at frame top.
7. **Hard cuts + 2–7 warm flash / light-leak dips** per video at section
   changes (into flashback, CGI, scale beat, end card).
8. **AI imagery for every "can't film this" beat** (garbled sign text —
   "WOMEN ARE NOT ALLOVED", a "DONA_D" box — gives it away): history (Athos,
   Extinction, Kitty's B&W recreations), founder's past with a recurring face
   (WeWard), anatomy/CGI (Fraxel, Nuropod), problem visuals (Beyond Oil).
   Judged from artifacts; not labelled.
9. **Sound:** VO never stops — gaps ≥0.3 s total 1.7–6.7 s per video, longest
   0.5–2.3 s. **A stereo music bed ≈12–19 dB under the voice**, verified not
   assumed: mid (voice) swings ~14 dB quiet vs loud 100 ms windows, side moves
   0–5 dB; envelope correlation −0.06…0.43 → an independent bed, not voice leak.
   At the end card music carries alone and fades ~−18 → <−45 dB over ~3 s.
   −14.0 to −14.3 LUFS on all 10; two peak >0 dBFS (+0.5, +1.0) — hold −1 dBTP.
10. **Identical end:** flash transition → white "Aija Mayrock" wordmark on
    black, 3–5 s. No CTA card, no handle.

## 3. Styles (recipes)

**S1 — AI history explainer** (Athos 330K, Extinction 43K). One outdoor spot, her to camera in two set-ups (likely one shoot).
1. 0–12 s her to camera: superlative claim, caps shock word ~4 s; jump cuts only.
2. ~12 s "This is Mount Athos / This event is called THE GREAT EXTINCTION" → **AI B-roll block**, 4–6 shots at 1.9–3.6 s, slow push-ins, each = the noun spoken.
3. A-roll pivot ("They don't necessarily believe…" / "Then it spread to land").
4. A second AI block on the most human detail (the monk left as an infant who died at 82 never having seen a woman).
5. Close to camera in the present tense ("And it still exists today…" / "everything alive today are descendants…").
17–24 shots/min, 153–183 wpm, ~60 s. **Same recipe, 7.7× view gap** — the human/gendered topic beat deep time; the recipe does not carry a weak topic (n = 2).

**S2 — Founder / invention reveal** (WeWard 933K, Beyond Oil 663K, Joltz 158K).
1. Cold open on a two-shot, her + founder mid-action, pull-back zoom; one-sentence claim, caps payoff word at 4–6 s.
2. Proof inside 7 s: product insert or the +$ counters.
3. "This is <Name>" ~7 s → **founder in his own voice**.
4. Origin as a mini-arc ("an engineer… it wasn't making him happy") in AI recreations → "And then I realized…" from the founder.
5. The problem made visceral (AI oil bubbling, "cause cancer").
6. Demo + her own reaction ("I'm literally gonna throw up", "This onion ring is insane!").
7. Scale: warehouse, world map "20 countries", "3 million people" = three AI walkers at 0.24–0.28 s — one shot per word.
8. **End on the opening frame with a callback thesis**: "But it all began with a father and a son in their garage…" / "Most tech companies keep you on your phone. But Yves… convinces 30 million people to **put their phone down and walk**" — she drops her phone and walks out of frame.
What the top two have that Joltz doesn't (n = 3, hint only): a human origin, a contrarian thesis, an acted ending, faster cutting (38 & 32 vs 25/min). Joltz stops at 52–63 s for a disclaimer + self-promo montage and ends on a demo.

**S3 — "I try it on my body"** (Fraxel 254K, Nuropod 113K).
1. Hook: what's happening to her body now — real footage + **CGI/AI render of her own face**.
2. Caps name card.
3. CGI explainer block, ~1 s per stage.
4. Expert to camera, 5–7 s holds.
5. Receipts: scrolling WHOOP app screen recordings.
6. A vulnerable line ("I've always struggled with anxiety").
7. Close on an aphorism ("the best way to repair something is to damage it first") or an **open loop + CTA** ("comment an 👂… 60 days from today we will know") that calls back the opening.
28–31 shots/min.

**S4 — "Come with me" subject story** (Kitty 53.3K) — the format closest to Tal's.
1. Mission frame in 8 s: "Come with me to bring lunch to a 93-year-old Holocaust survivor" (walking selfie with bags) → "For the last few years I've been…" → "Today I flew to Canada…".
2. "This is Kitty" → Kitty introduces herself.
3. Her past in her VO: AI B&W recreations interleaved with **real family photos** and the book.
4. Every emotional line in Kitty's own voice.
5. Payoff turn: "A little girl who once had no parents… dedicated her life to protecting other children."
6. Aija's one question: "How do you not live with the anger…?" → the answer **held ~19 s on one face**.
23 shots/min, 138.6 s — her lowest views. Likely causes (a guess, n = 1): 2× median length, heavy topic, 19 s static close, a hook without a twist.

**S5 — Personal story** (90th birthday 291K).
1. Paradox hook + AI age-up of her own face under "90th BIRTHDAY" title.
2. 3-item title-card list, ~1.5 s each.
3. "Not diamonds. Memories" over three 0.5 s photos with flashes.
4. Reveal → process (screen recordings) → the pages.
5. The rule that calls back the hook ("two books every year until she's 90").
6. Value line.
7. **Humour button calling back the list** ("and I also got the clothes and the roses… in addition").

## 4. Against what the system already knows

| | Aija (9) | Social Accords NAS | Tal VO films | NAS Daily table |
|---|---|---|---|---|
| wpm | 146–205 (med 178) | 175–183 | 193–199 | 132 |
| shots/min | 17–38 (med 25) | 29–39 | 28–40 | 22 |
| caption words | 2–5 | 1–2 | 1–6 | 4–6 |
| caption y | 0.58–0.67, moves per shot | lower-middle | 0.61 | 0.76 |
| emphasis | 1–2 words, ALL CAPS 2×, white, replaces caption | gold word | none | yellow span |
| loudness | −14.0 to −14.3 | −15.5 / −16.6 | −13.3 / −14.5 | — |
| bed under voice | ~12–19 dB | 12–15 dB | 17–19 dB | continuous |

Her numbers sit **inside** what the system already targets — no preset needs
retuning. What she adds is **structure**: claim → caps payoff word, the founder
arc, the acted-out ending, the mission frame, the open loop. New visual
devices are limited to the pull-back open, animated number proof, and flash dips.

## 5. What transfers to Tal

1. **S2 arc for one person (FULL STORY, §2.8):** open on Tal and the subject already mid-action (pull-back zoom) → "I met a [identity] who [surprising thing]", built only from what they actually say on camera → big card on the payoff word at ~4 s → "This is <Name>" ~7 s → their own line in their own voice → end back on the opening two-shot with Tal's thesis and an acted-out beat (hug, handshake, walking off together).
2. **Contrarian thesis as the last line:** "The headlines show you X. But on this street…" — his positioning, as in the Julius sign-off.
3. **S4 mission frame, fixing Kitty's likely weak points:** "Come with me to…" → "For the last … I've been…" → "Today…" → "This is [Name]"; the subject speaks the emotional lines; Tal's one question stays in; keep **≤90 s**, give the hook a twist, cut the closing answer to its best line (≤6 s).
4. **One oversized word per video.** Copy the rhythm, not her sentence case — his captions are already white ALL-CAPS, so show one payoff word alone at 1.8–2× for 1–1.5 s. Gold stays for hook lines.
5. **Numbers as animated counters** (0.5–1.5 s) over the matching shot.
6. **Lists at one shot per word, 0.25–0.5 s** — her walkers and his identity montage are the same device.
7. **Sandwich pacing for narrated explainers:** A-roll pivot → 4–6 literal B-roll shots at 2–3.5 s → A-roll.
8. **Humour button** after the thesis, calling back an earlier list.
9. **Open loop for series** ("In 30 days I'll be back at this street…") + comment-word CTA.
10. Optional: one consistent flash-dip end card with the bed fading over ~3 s — a brand choice for Tal, not a recommendation.

**Do not transfer:** AI recreations of real people or real history (credibility risk for "Israel beyond headlines"; archival only when Tal supplies and clears it), her serif caption brand, age-filter gags on real subjects, sponsor-shaped structure (5 of 9 tag a company).

**Pipeline gaps (not verified):** pull-back zoom open, the 2× single-word card, animated counters, flash dips, per-shot caption repositioning. Each needs building and testing against her frames first.

## 6. Honest limits

- **Tiny n:** 9 own edits; S4 and S5 are one video each. View explanations are hints. Runtime and cut rate don't clearly track views (Athos is the slowest-cut and third in views).
- **Views from the grid on 2026-09-28** (lists.json). info.json has no view count and its `like_count` is broken; not used.
- **Shots counted by eye at 2 fps, ±3**; sub-0.5 s shots can be missed.
- **Instrument errors corrected:** Whisper's invented "Thank you" (111 → 146 wpm); Groq dropping ~8 s of Kitty. Transcripts misspell names (Nisair/Nasir = Nuseir, Asia = Aija, Pika = Pinchas, WeWork = WeWard).
- **Music bed inferred** from mid/side behaviour, no known-silent control file. Measured, not identified; never lift it.
- **Caption fonts/sizes estimated** from 540 px frames (±2 % height, ±20 % size); typefaces matched by eye.
- **"AI-generated" is a judgement** from visible artifacts; a few shots could be stock.
- **Visual record:** the 2 fps filmstrips were the primary record. Of the per-shot tool sheets only Athos's was opened; the other nine were checked through their shot lists.
