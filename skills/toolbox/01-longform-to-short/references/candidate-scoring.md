# Short-form candidate scoring — reproducible rubric

Adapted from OpenChatCut's `long-video-to-shorts/references/short-form-selection.md`
(`vendor/OpenChatCut/`, AGPL — knowledge only, not code) for this repo's
review-gated workflow. Use it to score MAIN vs TRIAL variations, `ingest.mjs`
hook picks, and every A#/B# candidate in a review batch — **before** captions,
music, or packaging.

## 1. One row per candidate, stable IDs

| Field | What to record |
| --- | --- |
| Candidate ID | `A2` / `B7` (full-story / compilation) + source clip + in/out seconds |
| Direct evidence | the exact transcript line / action / reaction — a quote, not a paraphrase |
| Proposed arc | hook → setup/proof → payoff, inside the selected range |
| Boundary evidence | the complete phrase / breath / pause / reaction at each end |
| Risks | missing context, weak audio, misleading implication, **negativity about Israel**, rights, crop |

Write observations as facts. Label guesses as assumptions and verify before cutting.
Never infer a claim, identity, relationship, result, or chronology the source
doesn't support.

## 2. Arc check — the candidate must answer these from its own material

- **Standalone clarity** — a new viewer gets the subject/claim without the rest of the source
- **Hook** — the first usable beat creates curiosity, tension, surprise, or a face doing work
- **Payoff** — it delivers an answer, reveal, emotional turn, or a satisfying final beat
- **Context integrity** — trimming keeps meaning, order, cause/effect, and his questions before the answers
- **Visual strength** — a readable subject, a real reaction, a purposeful frame
- **Clean boundaries** — it can start and end with no clipped speech or dead air
- **Distinctiveness** — meaningfully different from a stronger candidate

## 3. Score each factor 0–4, same evidence pass

`0` absent/contradicted · `1` weak, needs outside explanation · `2` workable, clear limits ·
`3` strong, minor editing · `4` exceptional, immediately legible

| Factor | Weight | Question |
| --- | ---: | --- |
| Standalone clarity | 18 | Does the selected material explain itself? |
| Hook | 16 | Is the first usable beat compelling? |
| Payoff | 14 | Is there a concrete, satisfying destination? |
| Context integrity | 14 | Will the cut preserve meaning and chronology? |
| Visual strength | 12 | Are the images/actions readable and purposeful? |
| Platform fit | 10 | Fits 9:16, ~20–90 s, his audience/tone? |
| Clean boundaries | 8 | Natural, editable start and end? |
| Distinctiveness | 8 | Adds value beyond a higher-ranked candidate? |

`base = Σ(rating × weight) ÷ 4` → out of 100. Keep the ratings **and one evidence
note per factor** — a bare total isn't reproducible.

Then evidence-based deductions only: correctable risk `-1..-10`, redundancy
`-1..-12`. Don't deduct twice for one weakness. `final = base − deductions`.
Rank by final; tie-break: context integrity → standalone clarity → hook → payoff → visual strength.

## 4. Reject before ranking (reason, not a score)

- changes/obscures source meaning, chronology, intent, or one of his claims
- needs invented context or an unsupported on-screen line to make sense
- no usable opening, understandable middle, or payoff after reasonable trimming
- speech/action irreparably clipped, inaudible, or unreadable
- negativity about Israel, or a rights / consent / sensitive-content problem that
  can't be resolved within the footage → **positivity gate, drop silently** (house rule)
- materially weaker than and redundant with a stronger candidate

Never lower the threshold just to hit a requested count. Don't pad a batch with
weak candidates.

## 5. MAIN vs TRIAL, applied

- **MAIN** = the highest `final` candidate cut chronologically — strongest whole story.
- **TRIAL** = a genuinely different angle (per CLAUDE.md §2.3: different hook,
  who starts, order, length, pacing) — usually the candidate with the best
  **Hook** sub-score lifted to a cold open, ≤45 s. Not a reshuffle of MAIN.
- "Add more variations" → next-best `final` with a distinct arc, never a near-duplicate.
