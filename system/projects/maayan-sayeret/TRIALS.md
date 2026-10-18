# Maayan Sayeret — 3 Instagram trial reels (2026-10-18)

Brief (his words): V1 "a little long and has no point. The hook is kind of nice, but then it shows just more
people jumping. Make it an Instagram format reel that might go viral... something fun that we can later touch
audio on. 3 trial variations."

All three: 1080x1920, 30 fps, H.264, -14 LUFS, natural sound only. **Every cut sits on a 120 BPM grid
(1 beat = 0.5 s)** so any 120 BPM song (or 60/240) dropped in at 0:00 on its first downbeat lines up with
every cut. Per-cut timings: `preview/<name>_cues.txt`. Built by `reel.py edits/<name>.json 1.0`.

Each has ONE idea, a moving first frame with the hook on screen (sound-off legible), and a payoff
(vyral-content-skills/viral-instagram-reels: 3-second cliff, sends > likes, named-persona send prompt).

| | idea | length | hook (on screen) | payoff |
|---|---|---|---|---|
| T1_dog | the dog is the star | 0:15 | לקחנו את הכלב לטיול → טעות גדולה. | הטעות הכי טובה שעשינו (selfie, dog jumps in, she cracks up) |
| T2_rating | rating every stop | 0:20 | דירגנו כל עצירה בטיול לגולן | הכלב 12/10 |
| T3_350photos | the photo bursts as stop-motion | 0:16 | 350 תמונות. יום אחד. | שלחו למי שמצלם הכי הרבה בטיול |

## Post captions (draft — paste and adjust)
T1: לקחנו את הכלב לטיול בגולן. הוא גנב את כל ההצגה 🐾
שלחו למי שתמיד מביא את הכלב
#גולן #טיולים #כנרת #בורדרקולי

T2: דירגנו כל עצירה בטיול לגולן. מסכימים עם ה-12/10?
שלחו למי שאתם יוצאים איתו לטיול הבא
#גולן #מצפהאופיר #כנרת #טיולים

T3: 350 תמונות. יום אחד בגולן 📸
שלחו למי שמצלם הכי הרבה בטיול
#גולן #כנרת #טיולים #photodump

## Caveats
- The scores in T2 are invented for the joke — change any number.
- "350": 351 stills in the folder (some near-duplicate bursts).
- No music: none was supplied. Each is built so a track drops in; the original sound can be lowered in the IG app.
- T2's 12/10 sits near the second girl's chin in the last 2 s — no clean spot in that frame.
- beat-synced-edit (MIT, ZiadAbdelkarim) was found and vetted (no network calls) but installing/running it was
  blocked by the session's safety check; the grid engine here is our own. Needs his OK to install.
