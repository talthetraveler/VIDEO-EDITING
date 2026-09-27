---
name: multilingual-dialogue-qc
description: "Handles dialogue in more than one language — English, Hebrew, Arabic, Spanish, Russian. Load whenever footage contains a language other than English, or captions carry a translation. Keeps the original transcript, the translation, speaker identity, uncertainty, names, slang and subtitle timing as SEPARATE fields so none can silently overwrite another. Owns every multilingual caption failure this project has actually shipped."
---

# MULTILINGUAL DIALOGUE QC

Tal's footage is routinely English, Hebrew, Arabic, Spanish and Russian —
sometimes inside one clip. Every multilingual defect this project has shipped
came from **collapsing two different things into one field**: a translation
stored where the transcript belonged, a guess stored where a verified fact
belonged, a name auto-corrected into a different name.

**The whole discipline is: keep them separate, and label what is verified.**

---

## 1. THE RECORD — seven fields, never merged

One record per cue. Written by the build, never hand-typed.

```json
{
  "id": "b05_c02",
  "clip": "C0510",
  "t0": 18.72, "t1": 19.84,

  "source_lang": "he",
  "source_lang_confidence": "VERIFIED",

  "original": "טוב שיהיה שלום בכל המדינות",
  "original_verbatim": true,

  "translations": {
    "en": { "text": "MAY THERE BE PEACE IN ALL THE COUNTRIES",
            "by": "human", "status": "unverified" },
    "ar": { "text": "أن يعمّ السلام في كل الدول",
            "by": "human", "status": "unverified" }
  },

  "speaker": { "id": "SPK_03", "label": "older man, promenade",
               "confidence": "HIGH" },

  "names": [],
  "slang": [],

  "uncertainty": [],
  "timing_source": "whisperx-full-clip"
}
```

**Why each field exists — each one is a bug that happened:**

| Field | The failure it prevents |
|---|---|
| `source_lang` + confidence | Two clips were assumed English because the transcript *read* like English. They were Arabic — it was a **translation**, not a transcription |
| `original` separate from `translations` | Losing the verbatim source makes the translation unauditable forever |
| `original_verbatim` | Marks whether this is what was actually said or a cleaned-up version |
| `translations[].status` | A machine never verifies translated wording. Saying "captions verified" about a translation is a false claim |
| `speaker` | Cutting from one person's answer to another's, or captioning the wrong person |
| `names` | Auto-correct and transliteration mangle real people's names |
| `slang` | Dialect ("سيدي" = *my grandfather* in Moroccan/Levantine, not *sir*) |
| `uncertainty` | The honest place for "I could not make out this word" |
| `timing_source` | Full-clip alignment is authoritative; a short re-align is not |

---

## 2. NEVER ASSUME THE LANGUAGE — read the model's own field

```
whisper.cpp -tr   → the TRANSLATE task. Output is English REGARDLESS of input.
whisper.cpp       → transcription in the detected language.
```

**A fluent English transcript is not proof the audio was English.** It may be a
translation. **Always read `result.language` from the model's own output** and
store it in `source_lang`.

Two clips in the call-someone-you-love shoot were captioned as English before
anyone checked. They were Arabic.

### Auto-detect flips mid-clip

On a language switch whisper sometimes emits a literal annotation instead of
translating — `[SPEAKING HEBREW]` — and **splits it across two word tokens**
(`"[SPEAKING"` / `"HEBREW]"`). A naive per-token `/\[.*\]/` filter misses it and
the bracket text leaks into a caption.

**Track bracket open/close state across tokens, not per token.** If it happens
on a clip you need, re-run with an explicit `-l <lang>` — forcing the language
has recovered a full accurate translation where auto-detect bailed.

---

## 3. SCRIPT PURITY — assert it in the build

Hebrew characters once shipped inside an Arabic caption line. It rendered, it
looked plausible, and it was wrong.

**Every build asserts, per cue:**

| Field | Must contain | Must NOT contain |
|-------|--------------|------------------|
| Hebrew | `[֐-׿]` | `[؀-ۿ]`, Latin |
| Arabic | `[؀-ۿ]` or `[ﭐ-﷿]` | `[֐-׿]`, Latin |
| English | `[A-Za-z]` | either RTL range |

Three lines of code, catches it instantly. **Run it in the build, not in review.**

---

## 4. RTL RENDERING

- Set `dir="rtl"` on Hebrew and Arabic elements. HTML shapes and orders them
  natively — do not pre-reverse strings, and do not rely on fribidi.
- **Verify by looking at a rendered frame**, not by reading the source. Reversed
  or unshaped Arabic is obvious in a picture and invisible in a string.
- Arabic must be **shaped** (letters joined). Isolated letterforms mean the font
  lacks the shaping tables — change the font, not the text.

---

## 5. SIZE HIERARCHY — the translation is not a footnote

English leads; other languages sit beneath it, clearly smaller but **readable**.

**Rejected:** 40px Hebrew and Arabic under 82px English — "make the Hebrew
bigger, big, bigger."
**Accepted:** English 82px/800 · Hebrew 66px/700 · Arabic 52px/600.

Cap English at **~34 characters per cue**. Beyond that it wraps to three lines,
and three English lines plus two translation rows climb over faces.

---

## 6. TIMING — the full-clip alignment is the only authority

- Word timings come from **WhisperX forced alignment over the WHOLE clip**, with
  the correct `--language`. Record it as `timing_source`.
- **Never re-align a short trimmed segment to check your work.** It produces
  compressed garbage — an 8.15s Spanish beat came back with all speech crushed
  into 4.5s (≈12 syllables/sec, physically impossible) and reported two
  captions-over-silence that did not exist.
- Every beat's **in-point sits on its first spoken word.** Starting 1.4s early
  means a person visibly talks with no caption — it reads as broken captions.
- To confirm timing independently, use a **model-free** measure (RMS envelope,
  `silencedetect`) — but note our own voice chain flattens LRA to ~2 LU, which
  weakens energy-based detection on finished audio. Measure pre-chain.

---

## 7. SPEAKER CONTINUITY

No speaker diarization exists on this machine — `video-use`'s pipeline runs
without it. So speaker identity is **assigned from the clip and the picture**,
not from audio clustering.

- One `speaker.id` per person per shoot, stable across clips.
- **Never cut from one person's answer into another's mid-sentence** as though
  it were one thought.
- **Never run a caption of person A over footage of person B.**
- B-roll of a person must be that person. Check the frame, not the filename.
- `speaker.confidence` is `HIGH` only when a frame was actually inspected.

---

## 8. WHAT VERIFICATION CAN AND CANNOT PROVE

| Claim | Provable? |
|---|---|
| Cue timing matches speech | **Yes** — `verify-captions.py`, full-clip alignment |
| Cues never overlap | **Yes** — deterministic |
| No cue sits over silence | **Yes** — with the caveat in §6 |
| English caption matches English speech | **Yes** — re-transcription |
| **Translated wording is correct** | **NO. Never machine-verifiable** |

**The only honest phrasing for a translated caption is:**

> *"timing verified, wording unverified — needs a human who reads both
> languages before publishing."*

Never say "captions verified" about a video containing translations.

### The verifier's blind spot on fast cuts

`tools/verify-captions.py` skips its text check on any clip-run shorter than
**8 seconds** (`MIN_TEXT_CHECK_SPAN_S`). On a fast-cut multilingual montage that
is *every* span — it prints `PASS` plus a medium `verification_failed: No span
could be transcribed`. **Read the findings, not the headline.**

---

## 9. TRANSLATION SOURCING

**Do not use the repo's automated translator.** NLLB hallucinated badly on
exactly this kind of short idiomatic line — a 200× "Hi, Hi, Hi…" loop, and a
common well-wishing blessing rendered as "God rest your soul."

Translations are **hand-written**, marked `"by": "human"`, and still carry
`"status": "unverified"` until a bilingual human confirms them.

Preserve dialect. `سيدي` is *my grandfather* in Moroccan/Levantine usage — a
dictionary gives *sir*, which would have destroyed the emotional line the whole
edit was built around.

---

## 10. CHECKLIST — before any multilingual delivery

- [ ] `source_lang` read from the model's own output, not assumed
- [ ] `original` stored verbatim and separate from every translation
- [ ] Script-purity assertion passed for all cues
- [ ] RTL confirmed **in a rendered frame**, not in source
- [ ] Size hierarchy applied (82 / 66 / 52), English ≤ ~34 chars
- [ ] Timing from full-clip alignment; in-points on first spoken word
- [ ] Speaker identity confirmed against frames; no cross-speaker captions
- [ ] Names and slang preserved, not auto-corrected
- [ ] Delivered as **"timing verified, wording unverified"**
- [ ] Any language whose script you cannot read is flagged to Tal explicitly
