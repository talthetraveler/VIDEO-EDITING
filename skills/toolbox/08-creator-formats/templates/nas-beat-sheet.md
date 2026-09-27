# NAS-format beat sheet — fill this in before building

Copy into `projects/<NAME>/SCENE-PLAN.md` and fill every row **before** any
cutting. The format only works if the voice-over exists first.

**Target:** 150 s · ~330 words VO · ~55 shots · ~22 cuts/min · one cut per ~6 words.

## Rules that are not optional

1. **Every VO fragment gets its own picture.** If the line says a number, the
   number is on screen. If it names a place, the place is on screen.
2. **No establishing shots, no filler montage.** Every shot advances or it's cut.
3. **Read at ~132 wpm.** Slower than conversation. Do not rush.
4. **Light one word per caption card, ~half the time.** Numbers, names, the
   payload noun. Never every card.
5. **Positivity gate still applies** — nothing negative about Israel ships.

## Beats

| # | Time | Beat | VO line (5–7 words) | Picture | Lit word |
|---|---|---|---|---|---|
| 1 | 0:00 | COLD OPEN — strange image + fact fragment. No greeting, no name. | | | |
| 2 | 0:05 | PRESENTER — ask the viewer's question out loud, selfie framing | | | |
| 3 | 0:10 | STAKES — why this isn't ordinary | | | |
| 4 | 0:15 | REVEAL CARD — `nas_card` names the subject, centre-frame, 2.5 s | | | — |
| 5 | 0:20 | FACT 1 | | | |
| 6 | | FACT 2 — a number, on its own shot | | | |
| 7 | | FACT 3 | | | |
| 8 | | HUMAN DETAIL — a face, not a statistic | | | |
| 9 | ~50 % | **THE TURN** — "So let me get this straight" / "And then I turned around" | | | |
| 10 | | CONSEQUENCE | | | |
| 11 | | THE BRIDGE — the coexistence / shared-history beat | | | |
| 12 | 2:00 | HUMAN PAYOFF — a person, not a fact | | | |
| 13 | 2:20 | OPTIMISTIC CLOSE — one forward-looking line + smiling group | | | |
| 14 | 2:28 | SIGN-OFF — Tal's handle (never NAS's lockup) | | | — |

## Build commands

```bash
node scripts/proj-op.mjs <NAME> set_caption_style --style nas_caption
```

```bash
node scripts/proj-op.mjs <NAME> set_title_style --style nas_card
```

Emphasis is auto-picked at render time by `scripts/lib/emphasis.mjs`. To
override a card by hand, set `emphasis: [tokenIndex, …]` on that caption in
`project.json` — a hand-set value always wins.

## Check before calling it done

- [ ] Shot count within 40–70; cuts/min within 16–27
- [ ] No shot longer than ~11 s except a deliberate payoff hold
- [ ] Every number has its own shot
- [ ] Lit-word rate between 40 % and 60 % of cards
- [ ] The turn lands near the midpoint
- [ ] Ends on a person, then one optimistic line
