# FORMAT — MOTION RECREATION (same choreography, new visual identity)

Tal, 2026-09-28, handing over a six-step workflow: analyse a reference video
frame by frame, keep its **timing, camera path, animation rhythm and
transition structure**, and rebuild it with a **completely new premium visual
identity**. His words are kept below as the brief; the method maps each step
onto what this machine can actually do.

**When:** the reference is a MOTION-GRAPHIC piece — animated type, UI, product
shots, abstract 3D, a brand sting. **Not** for his street footage: that is cut,
not recreated (`two-camera-kindness`, `pov-kindness`, …).

---

## Four things the pasted workflow assumes that are not true here

1. **"Opus 5 generation" does not output video.** The model writes code. The
   recreation is a **HyperFrames composition** (HTML/CSS + GSAP, Three.js for
   3D) built to the measured timeline and rendered frame by frame. That is the
   strength of this route: timing lands to the frame, and there is nothing to
   "morph" or "glitch" — no AI artifacts by construction.
2. **Glass, metal, reflections and depth of field are simulated,** not
   path-traced: CSS `backdrop-filter`, gradients, WebGL/Three.js materials and
   environment maps. Premium and clean, but not a Cinema 4D / Octane render.
   A photoreal-3D or live-action reference can be matched in MOTION, not
   literally in material realism. Say so on the first cut.
3. **"Frame by frame" means every frame is MEASURED; sampled frames are
   LOOKED AT.** The renderer cannot play video. Cuts, camera moves and easing
   come from numbers (below); composition and style come from contact sheets.
4. **Rights (CLAUDE.md §1).** Motion structure and technique may be studied and
   reused; the reference's assets never. A 1:1 re-skin of *another studio's
   signature* animation is still a derivative of their choreography — fine for
   Tal's own pieces or as a study; for someone else's distinctive work, keep
   the timing grammar and vary the specific moves.

---

## The pipeline — his six steps, with the tool for each

### STEP 1 — Analyse, and write the timeline as DATA

| what | how it is measured |
|---|---|
| duration, fps, every cut | `node system/scripts/reference-shots.mjs <video>` — scene detection + a contact sheet per shot. Validate the threshold: count cuts at 0.18 / 0.25 / 0.35; a stable count is real, a swinging one hides dissolves and push-ins (formats/nas-explainer.md) |
| camera: zoom, pan, tilt, rotation | OpenCV (installed: 5.0 system Python): track features frame to frame, `estimateAffinePartial2D` -> per-frame scale, dx, dy, angle. Integrate -> the camera path as keyframes |
| object motion, reveals, exits | track the element's bounding box (template match / contour) per frame -> position, scale, rotation vs time; reveal = first frame its area crosses a threshold |
| easing | fit each move's position-vs-time curve against linear / power2 / power3 / expo / back (overshoot). The best fit and its duration become the GSAP ease — not a guess from watching |
| speed ramps | frame-to-frame displacement over the move; a ramp is a clear peak |
| motion blur | edge sharpness (Laplacian variance) drops while the element moves fast |
| layers / depth / parallax | features moving at different speeds under one camera move = separate depth planes; count the clusters |
| colour & light | `signalstats` YAVG / SATAVG / YMIN / YMAX per shot + a k-means palette of 5–6 colours per shot |

Output two files in the project: **`TIMELINE.json`** (every event: start,
end, property, from, to, ease) and **`TIMELINE.md`** in his format — "0–X s:
opening frame, camera, what appears, timing, effects; X–X s: …; final
seconds: ending composition and exit." The JSON is what the build reads.

### STEP 2 — New visual direction

Keep: ✓ timing ✓ camera path ✓ animation rhythm ✓ transition structure.
Change: ✓ colours ✓ materials ✓ graphic style ✓ lighting design.
Write the direction as a short spec before building (palette hexes, the
material list, the type).

### STEP 3 — Replacement assets

Background: clean studio environment, soft gradient depth, floating
particles, natural shadows. Objects: glass panels, metallic elements,
abstract 3D forms, UI-inspired components. Effects: subtle glow, reflections,
depth of field, natural motion blur. **Built as code, not downloaded** — see
`hyperframes-registry` before hand-building any named effect (~400 items).

### STEP 4 — Build it from the timeline

- Load `hyperframes-core`, `hyperframes-animation`, `hyperframes-keyframes`
  (installed, global).
- One GSAP timeline. **Each `TIMELINE.json` event becomes one tween** with its
  measured start, duration and ease. The camera is a wrapper transform whose
  keyframes are the measured path — every layer inherits it, so parallax comes
  from giving each depth plane its own measured multiplier.
- Transitions at the measured cut frames, of the measured type (hard cut,
  whip, match, zoom-through).

### STEP 5 — Refine by MEASURING the render, not by watching it

Run STEP 1 on the render and diff the two timelines:

| must match | tolerance |
|---|---|
| cut times | ±1 frame |
| reveal / exit times | ±1 frame |
| camera zoom / pan curves | within 5% of the reference at every keyframe |
| ease fit | same family |

"Does it feel like a new design, is it premium" is judged — on stills of every
shot — and said to be judged.

### STEP 6 — Natural cinematic grade

Balanced contrast, natural material tones, soft highlights, detailed shadows,
controlled saturation, cinematic depth. **Avoid** oversaturation, artificial
neon, heavy filters, fake AI glow. Checked by numbers: black point near 0,
**no clipped highlights from bloom**, SATAVG moderate.

> **A conflict inside the brief, resolved:** the master prompt asks for "cool
> blue highlights ... subtle bloom", Step 6 forbids "fake AI glow" and neon.
> Both hold if bloom stays subtle — the test is that bloom never clips a
> highlight to 255.

---

## The master prompt — Tal's words, kept as the brief

> Recreate the exact motion structure from the reference video. Keep the same
> pacing, camera movement, zoom speed, object placement, transitions, and
> overall animation flow. Do not change the timing or motion choreography.
>
> Replace the original visual design with a new premium futuristic creative
> style. Transform the background into a clean dark graphite studio environment
> with subtle 3D depth layers, floating abstract shapes, soft light gradients,
> and modern editorial design elements. Replace the original graphic elements
> with sleek glassmorphism panels, smooth metallic surfaces, and minimal
> UI-inspired animations.
>
> Maintain all text/object reveal timing exactly like the reference, but
> redesign every element with a fresh visual language. Use smoother kinetic
> motion, elegant scale animations, soft rotations, and cinematic parallax
> depth.
>
> Color grade: apply a premium cinematic palette with deep charcoal shadows,
> cool blue highlights, soft silver tones, and controlled contrast. Add subtle
> bloom, realistic reflections, soft shadows, and high-end commercial lighting.
> Keep the image clean, sharp, and modern — no oversaturation.
>
> Motion style: ultra-smooth camera moves, professional motion design, natural
> easing curves, realistic motion blur, seamless transitions, no sudden jumps.
> Preserve the exact animation energy of the reference while making it feel
> like a new premium brand film.
>
> Output: cinematic 4K quality, clean details, realistic lighting, polished
> motion graphics, no glitches, no distortion, no AI artifacts.

"Smoother kinetic motion" and "exact motion" pull against each other: **the
measured timeline wins.** Smoothing may refine an ease; it may not move a cut
or a reveal.

---

## Deliverable

`Reference → TIMELINE.json + TIMELINE.md → direction spec → HyperFrames
composition → render → re-measured diff → grade`. Report the diff numbers, and
say plainly which material effects are simulated.
