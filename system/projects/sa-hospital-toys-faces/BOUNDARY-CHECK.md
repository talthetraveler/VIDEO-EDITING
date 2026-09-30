# Boundary check — SA_HOSPITAL_TOYS_FACES_V1_HQ2.mp4 (2026-09-30, LESSONS 68)

Settled with `scripts/check-boundary.mjs` (Groq second engine on the 3s SOURCE
window + RMS in 50ms steps). The second engine hallucinates on short noisy
Hebrew windows (Spanish/Chinese output), so RMS is the deciding evidence.

| beat | end | verify-cut / 2nd engine | RMS at cut | verdict |
|---|---|---|---|---|
| 02 | in 31.80 | "לך?" / "¿Va" | -61 dB, speech starts 32.10 | clean |
| 02 | out 37.95 | "What?" ends 37.91 | -58 dB | clean |
| 03 | in 60.40 | "I need a liar" (hallucinated) | flat -44 room tone, no speech peak | clean |
| 03 | out 63.00 | "Bye" smeared | synced angle: beat 04 = same instant (+7.60s) | continuous, nobody cut |
| 04 | in 70.60 | "תגיד" 25.9s smear / crowd words | crowd chatter -28 constant | continuous with 03, nocap |
| 06 | out 6.10 | background "that's your app" | room -29..-35, no trough | BACKGROUND talk, not the subject (wordless hug beat) - left in, disclosed |
| 07 | in 3.50 | none | -57 dB gap | clean |
| 08 | in/out | none / "know." ends 1.92 | — | clean |
| 09 | in/out | none | — | clean |
| 10 | in 80.30 | "the" 2.7s smear | -40/-46 trough, rise at 80.40 | clean |
| 11 | in 37.90 | "שמח" smeared 2.7s | word ends ~37.62, cut at -56 dB | clean |
