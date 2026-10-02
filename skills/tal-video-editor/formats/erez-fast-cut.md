# FORMAT — Erez fast cut (kindness set-piece, two cameras)

**Tal asks for it as:** *"edit like erezv1"*, *"fast cuts like Erez"*, *"quick
cuts, fast zooms"*. Built and corrected over 7 previews on 2026-10-02/03
(`system/projects/flowers-notes-erez`, Frame.io `NEEDS TO BE EDITED / FLOWERS
FOR STRANGERS / 2`). Everything here is either Tal's words **[S]** or measured
**[M]**. Nothing is a guess.

> **What transfers from Erez is his CUTS and how they FLOW.** Tal: *"we just
> use his cuts and how they flow as reference ... just look at the zoom ins."*
> His text cards, emoji and song do NOT come along unless Tal asks.

## When it applies

A staged surprise filmed from two angles (a locked-ish front and a side), with
little or no dialogue: flowers, a note, a gift, a hug. Tal is IN the picture
as the giver. If there is real dialogue, it is `pov-kindness` / `human-story`.

## The flow [M] — measured frame by frame on Erez `DdynV0UMrtr`

1. **WIDE** (everyone in frame) →
2. **fast zoom-in over ~4 frames (0.13s)**, about 1.0x → 2.2–2.4x →
3. **TIGHT hold**, still drifting in a few percent, 0.3–1.0s →
4. **hard CUT to the other camera** (the other person's face, the hands, or
   back to wide). Repeat.

- **Time only moves forward.** The two cameras cover ONE continuous moment.
- Shots are 0.3–1.0s; **2–3.5s holds only on the key moments** (the handoff,
  the read, the reaction).
- One contact-sheet frame per shot cannot show a zoom. Read the reference at
  30 fps (`ffmpeg -vf fps=30,tile=...`) before the first build (LESSONS 76).

## The order [S] — chronological, no flash-forward hook

1. Open on the giver **holding the prop**, wide, then zoom onto him.
2. The run-up — cut between him and the people who have no idea.
3. **The giving, SEEN**: the angle where his face and the prop are both in
   frame. Slow-mo here. *"You didn't show any zoom ins of me ... of me giving
   him the flowers."*
4. The receiver gets it **in his hand**, then passes it on.
5. Any second gift (the note): the **walk-by** handoff, then her reading it,
   and **the picture of the note pops up** while she reads.
6. Her reactions — **the most emotional moments, zoomed onto her face**
   (hand to mouth, the read, the big smile). Slow-mo on the best one.
7. End on the kiss / hug.

## Rules that cost a rejected preview each [S]

| Rule | His words |
|---|---|
| **No title pill** | *"I don't need the POV on the top ... for this episode we don't do this."* |
| **No colour grade on phone footage** | *"so bad ... you don't need to color grade it."* → `"grade": false` |
| **One action, one shot** | *"It repeats as a cut when he holds the flower, why did you do that."* A second angle of the SAME action is a repeat (LESSONS 75) |
| **Reactions: not looking into the lens** | *"choose the best shots ... without her looking directly at the camera"* — check the gaze on frames |
| **A zoom must be visible** | a 1.7→1.85 drift is not "a zoom in"; snap from wide to ≥2.2x |
| **Slow-mo is part of it** | *"The slow mo, you didn't do that."* |
| **Not the posed angle** | the walk-by handoff, not the shot where she stands in front showing the note |
| **Preview first** | *"u need to show me a low rez video before anything"* |
| **Emoji stickers** | built, judged *"not so good"*, then *"dont do the emoji its fine"* → off by default |

## How to build it — `edit.json`

```json
{ "layout": "vertical", "snap": false, "autoFrame": false, "silent": true,
  "grade": false, "music": "<ambience>.wav", "bedOnly": true, "beats": [ ... ] }
```

One zoom = **three contiguous beats of one clip**, all `"manual": true,
"nocap": true`, same `x`/`y` (focus point, 0..1 of the frame):

```json
["<clip>", 1.6000, 2.2000, 0.5, "WIDE",            null, {"manual":true,"nocap":true,"z":[1.0,1.0],"x":0.62,"y":0.5}],
["<clip>", 2.2000, 2.3333, 0.5, "fast zoom in",    null, {"manual":true,"nocap":true,"z":[1.0,2.4],"x":0.62,"y":0.5}],
["<clip>", 2.3333, 3.0000, 0.5, "tight hold",      null, {"manual":true,"nocap":true,"z":[2.4,2.5],"x":0.62,"y":0.5}],
["<other camera>", ...]
```

- **Every in/out on the 30 fps grid** (multiples of 1/30); the ramp is exactly
  4 frames (0.1333s).
- **Slow-mo:** `"speed": 0.5` on a wordless beat. Check on frames that the
  slowed window IS the moment — the first try started 0.15s late.
- **Pop-up picture:** `"sticker": {"image": "note.png", "w": 900, "x": 0.5,
  "y": 0.19, "from": 0.45}` (path is relative to the project folder). A pasted
  chat image is not a file on disk — recreate it (`make-note.py`) or ask.
- **Emoji sticker (only if asked):** `"sticker": {"emoji": "😳", "x": 0.2,
  "y": 0.72, "size": 170}` — on the body, never on a face.
- **Sound:** 30 pieces in 20s means 30 audio snippets. Use ONE continuous
  ambience track: extract ~25s of clean street sound from a clip with no
  operator voice into `system/projects/_music/`, then `"music"` +
  `"bedOnly": true`. No song — Tal adds a sound in Instagram.
- Watch for the **camera operator's voice** ("go go go, closer") on the clips.

## Finding the moments

Wide contact sheets are not enough. Make **face-level strips** (crop to the
person, 2–5 fps, timestamps burned in) for every take, and pick:
the giver's face + prop at the handoff · the receiver's hand closing on it ·
her hand going to her mouth · her eyes down on the note · the biggest smile
that is NOT aimed at the lens.

## The gate for this format — run on the RENDERED file

```bash
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,avg_frame_rate -show_entries format=duration -of default=nw=1 <render.mp4>
ffmpeg -i <render.mp4> -vf "mpdecimate=hi=200:lo=100:frac=0.5,showinfo" -an -f null - 2>&1 | grep -oE 'pts_time:[0-9.]+' | awk -F: 'NR>1{d=$2-p; if(d>0.05) print "frozen at", p} {p=$2}'
```

- frames must equal **duration × 30** and `avg_frame_rate` must be `30/1`
- **no frozen frames** (one near-duplicate at the start of a slow-mo is fine)
- then a still of EVERY beat on one sheet: is each zoom on the right person,
  does any action appear twice, is anyone looking into the lens

V6 failed this (583 of 597 frames, 10 frozen — *"ITS SO CHOPPY"*); the builder
was cutting short beats a frame short. Fixed in `build-edit.mjs` (LESSONS 77).

## Reference

- Measurements: `toolbox/tal-reference-library/instagram-2026-09-28/erez.v1.md`
  (→ "Cut and zoom grammar")
- His reels: `assets/references/instagram-harvest/erez.v1/*.mp4`
- The worked example: `system/projects/flowers-notes-erez/edit.json`
- LESSONS 71–77
