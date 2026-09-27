#!/usr/bin/env python
"""
Translate short caption lines. Reads one JSON object from stdin:

    {"texts": ["HELLO", "WHERE ARE YOU FROM?"], "src": "en", "tgt": "es"}

Writes one JSON object to stdout:

    {"translations": ["HOLA", "¿DE DÓNDE ERES?"], "engine": "google"}

Primary engine: deep-translator's GoogleTranslator (free endpoint, no key, good
quality for short lines). Falls back to NLLB (offline, needs the model) only if
--nllb is passed. Keeps line count stable (1 in -> 1 out).
"""
import sys
import io
import json
import argparse

# Windows console is cp1252 by default -> force UTF-8 both ways or accented /
# RTL output blows up with UnicodeEncodeError
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# language code normalisation: accept ISO-639-1 ("en"), ISO-639-3 ("eng"),
# or NLLB flores ("eng_Latn") and map to what GoogleTranslator wants (639-1)
_ISO3 = {
    "eng": "en", "spa": "es", "fra": "fr", "ara": "ar", "heb": "he", "deu": "de",
    "por": "pt", "ita": "it", "rus": "ru", "hin": "hi", "urd": "ur", "tur": "tr",
    "fas": "fa", "amh": "am", "swa": "sw", "zho": "zh-CN", "jpn": "ja", "kor": "ko",
    "nld": "nl", "pol": "pl", "ron": "ro", "ell": "el", "ukr": "uk", "vie": "vi",
    "tha": "th", "ind": "id", "ben": "bn", "tam": "ta", "yid": "yi",
}


# deep-translator / Google use a few non-standard codes
_GOOGLE_QUIRK = {"he": "iw", "jv": "jw", "nb": "no"}


def norm(code: str) -> str:
    c = (code or "").strip().lower()
    if not c or c in ("src", "source", "original", "auto"):
        return "auto"
    c = c.split("_")[0]           # eng_Latn -> eng
    c = _ISO3.get(c, c)           # eng -> en ; en -> en
    return _GOOGLE_QUIRK.get(c, c)


def google_translate(texts, src, tgt):
    """Translate SENTENCE-BY-SENTENCE for quality, then map back to the original
    caption chunks. Tal's captions are 2-4 word display chunks; translating each
    in isolation ("GUYS FROM?" -> "CHICOS DE?") reads badly, so we join chunks
    into sentences on trailing .?! , translate whole sentences (batched), and
    hand each chunk its proportional slice of the translated sentence."""
    import time
    from deep_translator import GoogleTranslator
    tr = GoogleTranslator(source=src or "auto", target=tgt)

    stripped = [(t or "").strip() for t in texts]
    # group indices into sentences
    groups, cur = [], []
    for i, s in enumerate(stripped):
        cur.append(i)
        if s.endswith((".", "?", "!", "…")) or i == len(stripped) - 1:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)

    sentences = [" ".join(stripped[i] for i in g if stripped[i]) for g in groups]

    def one(text):
        s = text.strip()
        if not s:
            return ""
        was_upper = s.isupper()
        for attempt in (s.lower() if was_upper else s, s, s.rstrip("?!.,")):
            for _try in range(3):
                try:
                    r = tr.translate(attempt)
                    if r:
                        return r.upper() if was_upper else r
                    break
                except Exception as e:
                    if "No translation was found" in str(e):
                        break
                    time.sleep(0.6)          # transient / rate limit
                    sys.stderr.write(f"[translate] retry '{attempt[:40]}' ({e})\n")
        return None

    out = list(texts)
    for g, sent in zip(groups, sentences):
        tsent = one(sent)
        if not tsent:
            for i in g:
                out[i] = texts[i]           # keep originals for this sentence
            continue
        words = tsent.split()
        # distribute translated words across the chunks by chunk word-count share
        counts = [max(1, len(stripped[i].split())) for i in g]
        total = sum(counts)
        pos = 0
        for k, i in enumerate(g):
            take = len(words) if k == len(g) - 1 else round(len(words) * counts[k] / total)
            piece = words[pos:pos + take] if take else []
            pos += take
            out[i] = " ".join(piece) if piece else tsent if len(g) == 1 else ""
    # never leave an empty caption where there was text
    for i, s in enumerate(stripped):
        if s and not str(out[i]).strip():
            out[i] = one(s) or texts[i]
    return out


def nllb_translate(texts, src, tgt):
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    import torch
    _F = {"en": "eng_Latn", "es": "spa_Latn", "fr": "fra_Latn", "ar": "arb_Arab",
          "he": "heb_Hebr", "de": "deu_Latn", "pt": "por_Latn", "ru": "rus_Cyrl",
          "hi": "hin_Deva", "tr": "tur_Latn", "fa": "pes_Arab"}
    name = "facebook/nllb-200-distilled-600M"
    tok = AutoTokenizer.from_pretrained(name)
    model = AutoModelForSeq2SeqLM.from_pretrained(name)
    src_f = _F.get(src, "eng_Latn")
    tgt_f = _F.get(tgt, "spa_Latn")
    tok.src_lang = src_f
    bos = tok.convert_tokens_to_ids(tgt_f)
    out = []
    for t in texts:
        s = (t or "").strip()
        if not s:
            out.append(t)
            continue
        enc = tok(s, return_tensors="pt")
        gen = model.generate(**enc, forced_bos_token_id=bos, max_length=128)
        out.append(tok.batch_decode(gen, skip_special_tokens=True)[0])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--nllb", action="store_true", help="use offline NLLB instead of Google")
    args = ap.parse_args()

    req = json.load(sys.stdin)
    texts = req.get("texts", [])
    src = norm(req.get("src", "auto"))
    tgt = norm(req.get("tgt", "es"))
    if tgt == "auto":
        print(json.dumps({"error": "no target language"}))
        return

    if args.nllb:
        translations = nllb_translate(texts, src if src != "auto" else "en", tgt)
        engine = "nllb"
    else:
        translations = google_translate(texts, None if src == "auto" else src, tgt)
        engine = "google"

    # never change the line count
    if len(translations) != len(texts):
        translations = (translations + texts)[: len(texts)]
    print(json.dumps({"translations": translations, "engine": engine}, ensure_ascii=False))


if __name__ == "__main__":
    main()
