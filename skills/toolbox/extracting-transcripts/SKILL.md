---
name: extracting-transcripts
description: Extracts word-level transcripts from video files using AssemblyAI Universal-3 Pro (the engine's default). Use when the user needs to transcribe a video, get captions, extract audio text, or convert video/audio to text. Triggers on "transcript", "transcribe", "speech to text", "video to text", "extract captions".
argument-hint: [video_path_or_url]
allowed-tools:
  - Bash(curl:*)
  - Bash(python:*)
  - Read
  - Write
---

# Extracting Video Transcripts (AssemblyAI Universal-3 Pro)

The engine's default transcription path is **AssemblyAI Universal-3 Pro** — highest-accuracy speech model on the market, word-level timestamps, no GPU required, no model download, runs as a cloud API call.

**Why AssemblyAI Universal-3 Pro:**
- ✅ Best-in-class accuracy on real-world creator audio (podcasts, interviews, screen recordings, mixed-quality mics)
- ✅ Word-level timestamps native (no hacks)
- ✅ No local GPU dependency — runs anywhere with internet
- ✅ Handles 95%+ of cases with one model — no need to pick `tiny` / `small` / `medium`
- ✅ Solid speaker diarization, custom vocabulary, automatic language detection out of the box

**Cost reality:** ~$0.27/hour of audio. A 30-min long-form costs ~$0.14. For a creator producing 5-10 long-forms/month, that's <$2/month — negligible compared to render costs.

---

## Prerequisites

```bash
# 1. Get an API key from https://www.assemblyai.com/dashboard/account
# 2. Set it as an environment variable
export ASSEMBLYAI_API_KEY=your-key-here     # macOS/Linux
$env:ASSEMBLYAI_API_KEY="your-key-here"     # PowerShell
set ASSEMBLYAI_API_KEY=your-key-here        # Windows cmd

# 3. Or add to .env in the engine root:
#    ASSEMBLYAI_API_KEY=your-key-here

# Verify the key works:
curl -s https://api.assemblyai.com/v2/transcript -H "Authorization: $ASSEMBLYAI_API_KEY" | head -3
```

For Python users, install the SDK once (optional — curl works fine):

```bash
pip install assemblyai
```

---

## Method A — Local file (upload then transcribe)

For a local video on disk, upload it to AssemblyAI's storage first, then submit the transcript job pointing at the upload URL.

### Step 1: Upload the file

```bash
ASSEMBLYAI_API_KEY=$(cat .env | grep ASSEMBLYAI_API_KEY | cut -d'=' -f2)

UPLOAD_URL=$(curl -s -X POST "https://api.assemblyai.com/v2/upload" \
  -H "Authorization: $ASSEMBLYAI_API_KEY" \
  -H "Transfer-Encoding: chunked" \
  --data-binary @"VIDEO_PATH" \
  | python -c "import sys, json; print(json.load(sys.stdin)['upload_url'])")

echo "Uploaded: $UPLOAD_URL"
```

### Step 2: Submit the transcript job

```bash
TRANSCRIPT_ID=$(curl -s -X POST "https://api.assemblyai.com/v2/transcript" \
  -H "Authorization: $ASSEMBLYAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"audio_url\": \"$UPLOAD_URL\",
    \"speech_models\": [\"universal-3-pro\"],
    \"language_detection\": true,
    \"punctuate\": true,
    \"format_text\": true
  }" \
  | python -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "Transcript ID: $TRANSCRIPT_ID"
```

### Step 3: Poll for completion

```bash
while true; do
  STATUS=$(curl -s "https://api.assemblyai.com/v2/transcript/$TRANSCRIPT_ID" \
    -H "Authorization: $ASSEMBLYAI_API_KEY" \
    | python -c "import sys, json; print(json.load(sys.stdin)['status'])")

  echo "Status: $STATUS"
  [ "$STATUS" = "completed" ] && break
  [ "$STATUS" = "error" ] && echo "Transcription failed" && exit 1
  sleep 5
done
```

### Step 4: Fetch the result

```bash
curl -s "https://api.assemblyai.com/v2/transcript/$TRANSCRIPT_ID" \
  -H "Authorization: $ASSEMBLYAI_API_KEY" \
  > transcript.json

# transcript.json contains: text, words[], utterances[], audio_duration, language, etc.
```

The `words[]` field is what downstream consumers need:

```json
{
  "words": [
    {"text": "This", "start": 120, "end": 320, "confidence": 0.99},
    {"text": "is", "start": 340, "end": 460, "confidence": 0.99}
  ]
}
```

`start` / `end` are in **milliseconds** (different from WhisperX's seconds). Convert to seconds with `start_ms / 1000`.

---

## Method B — Public URL (no upload)

If the video is already at a public URL (YouTube via `video-download`, S3, GCS, etc.), skip the upload step and submit the URL directly:

```bash
TRANSCRIPT_ID=$(curl -s -X POST "https://api.assemblyai.com/v2/transcript" \
  -H "Authorization: $ASSEMBLYAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"audio_url\": \"$VIDEO_URL\",
    \"speech_models\": [\"universal-3-pro\"],
    \"language_detection\": true
  }" \
  | python -c "import sys, json; print(json.load(sys.stdin)['id'])")
```

Then poll + fetch as in Method A Steps 3-4.

---

## Method C — Python SDK (cleanest for scripts)

```python
import os
import assemblyai as aai

aai.settings.api_key = os.environ['ASSEMBLYAI_API_KEY']

# ⚠️ Prefer the REST path (Method A/B) — your Claude Code project SOT script
# `the AssemblyAI REST helper` DROPPED the SDK and posts
# `speech_models: ["universal-3-pro"]` over raw REST. The SDK's SpeechModel enum lags the
# `universal-3-pro` model name; do NOT use `SpeechModel.universal` (older Universal-2).
transcriber = aai.Transcriber()
config = aai.TranscriptionConfig(
    speech_model="universal-3-pro",   # name the flagship explicitly; never the bare `universal` enum
    language_detection=True,
    punctuate=True,
    format_text=True,
)

# Local file or URL — same API
transcript = transcriber.transcribe('path/to/video.mp4', config)
# OR: transcript = transcriber.transcribe('https://example.com/video.mp4', config)

if transcript.status == aai.TranscriptStatus.error:
    raise Exception(f"Transcription failed: {transcript.error}")

print(f"Detected language: {transcript.language_code}")
print(f"Audio duration: {transcript.audio_duration}s")
print(f"Word count: {len(transcript.words)}")

# Word-level access
for word in transcript.words:
    print(f"[{word.start}ms — {word.end}ms] {word.text}")
```

---

## Output formats for downstream consumers

### Format 1 — Remotion word data (.ts file)

Convert AssemblyAI words → Remotion words array (used by `short-form-editing` for frame-precise overlays):

```python
import json

with open('transcript.json') as f:
    data = json.load(f)

FPS = 30
remotion_words = []
for w in data['words']:
    remotion_words.append({
        'word': w['text'],
        'start': round(w['start'] / 1000 * FPS),  # ms → frames
        'end': round(w['end'] / 1000 * FPS),
    })

ts_lines = [
    "// Auto-generated from AssemblyAI Universal-3 Pro transcript",
    f"// Duration: {data['audio_duration']:.2f}s",
    f"// Words: {len(remotion_words)}",
    "",
    "export const WORDS = [",
]
for w in remotion_words:
    ts_lines.append(f"  {{ word: \"{w['word'].replace(chr(34), chr(92)+chr(34))}\", start: {w['start']}, end: {w['end']} }},")
ts_lines.append("];")

with open('output-words.ts', 'w') as f:
    f.write('\n'.join(ts_lines))
```

### Format 2 — Word-per-block SRT (for `clip-selection` parser)

```python
import json

def ms_to_srt(ms):
    s, ms_rem = divmod(int(ms), 1000)
    h, s = divmod(s, 3600)
    m, s = divmod(s, 60)
    return f"{h:02d}:{m:02d}:{s:02d},{ms_rem:03d}"

with open('transcript.json') as f:
    data = json.load(f)

srt_lines = []
for i, w in enumerate(data['words'], 1):
    srt_lines.append(f"{i}\n{ms_to_srt(w['start'])} --> {ms_to_srt(w['end'])}\n{w['text']}\n")

with open('transcript.srt', 'w') as f:
    f.write('\n'.join(srt_lines))
```

### Format 3 — Plain text with timestamps

```python
import json
with open('transcript.json') as f:
    data = json.load(f)

# Easiest for human review
print(data['text'])

# OR with sentence-level timestamps:
for utt in data.get('utterances', []):
    print(f"[{utt['start']/1000:.1f}s — {utt['end']/1000:.1f}s] {utt['text']}")
```

---

## Workflow integration

| Skill / step | How transcripts flow |
|---|---|
| `long-form-to-clips` workflow Phase 2 | Calls this skill on the downloaded source video; outputs `transcript.json` + `transcript.srt` to `output/runs/{slug}/` |
| `clip-selection` Phase 1 (parse) | Reads SRT or JSON via `skills/clip-machine/clip_extractor/selection/srt_parser.py` |
| `short-form-editing` (Remotion path) | Reads Remotion words .ts file from `remotion/data/{clip}-words.ts` |
| `hyperframes-edit` | Reads transcript JSON, slices to per-clip word ranges for caption overlay |
| `youtube-content-package` | Reads transcript text for description / chapters / tags |
| `short-form-posting` | Reads transcript for caption generation |

---

## Errors + retries

| Status | Meaning | Action |
|---|---|---|
| `queued` | Job accepted, waiting for compute | Poll, normal |
| `processing` | Actively transcribing | Poll, normal |
| `completed` | Success | Fetch result |
| `error` | Permanent failure | Read `error` field; common causes: bad audio, format unsupported, file too large (>2GB) |

| HTTP code | Meaning | Action |
|---|---|---|
| 401 | Invalid API key | Check `ASSEMBLYAI_API_KEY` |
| 400 | Bad request | Check JSON body shape |
| 413 | File too large | Compress before upload (HandBrake, ffmpeg) |
| 429 | Rate limited | Wait + retry (rare on individual creator usage) |
| 5xx | AssemblyAI transient | Exponential backoff retry up to 3 attempts |

---

## Rules

1. **NEVER use local WhisperX or faster-whisper for new transcripts.** AssemblyAI Universal-3 Pro is the default. Existing pre-transcribed clips in `remotion/data/*-words.ts` were generated under the old default and stay as-is — not re-transcribed unless their source video is re-processed.
2. **ALWAYS use `speech_models: ["universal-3-pro"]`** (plural list, named explicitly) — Universal-3 Pro is the engine standard for EVERYTHING. The singular `speech_model` field is deprecated server-side (returns HTTP 400). Bare `["universal"]` is accepted but silently downgrades to the older Universal-2 — never use it. See `transcription-config.md` (the SOT). `word_boost` is rejected on v3 Pro; pass the vocab term list as `keyterms_prompt`.
3. **ALWAYS poll, never block forever.** Set a max wait (default 600s) and surface error status to the caller.
4. **ALWAYS verify the result has a non-empty `words[]`** before declaring done. Empty words = failed transcription even if status says `completed`.
5. **Remember timestamps are MILLISECONDS** (not seconds). Convert when feeding into Remotion (frames @ 30fps) or anywhere else expecting seconds.
6. **NEVER commit your API key.** Use `.env` + `.gitignore`.

---

## Cost estimation (rough)

| Source duration | Cost |
|---|---|
| 5 min | $0.02 |
| 30 min | $0.14 |
| 60 min | $0.27 |
| 3 hours (full podcast) | $0.81 |

For Long-Form → Short-Form Clips workflow: typical 30-60 min source = $0.14-$0.27 per run.
