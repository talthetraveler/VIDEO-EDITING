# Generating shots

For a beat with no footage and no strong web image. AI-generated visuals are a
**fallback** — real footage > real product/UI > screenshots > maps > data-viz >
typography > generated. In the literal formats (head-image, cutout) prefer an
actual web image; generate only when search fails.

Local re-implementation of Open-Higgsfield-AI. Full pipeline: `PIPELINE.md`.

```
npm run generate -- --spec <shot>.json --slug <slug> --kind <text-to-image|image-to-image|text-to-video|image-to-video|lipsync>
```

- `src/generate/prompt.ts` — compiles a `ShotSpec` + Cinema-Studio camera params
  into one prompt.
- `src/generate/registry.ts` — curated model list (flux-2-pro, seedream-v4,
  kling-o1, nano-banana-pro, …), a default per kind.
- `src/generate/providers/` — adapters. **`dry-run` (default)** compiles the
  prompt + writes `.request.json`, generates nothing, costs nothing — use it to
  get the prompt right. **`muapi`** (`GEN_PROVIDER=muapi` + `MUAPI_API_KEY`) hits
  the paid gateway Higgsfield uses. Add others here.
- Output + sidecar `.json` → `public/generated/<slug>/`. `--save` appends the
  prompt to `prompts/saved/winners.md`.

## Writing a spec — fill every slot

`prompts/shot.example.json` is the template. Never "traffic in Miami cinematic".

```
subject · environment · composition · cameraMove · lighting · motion ·
material · depth · style · mood · aspect · durationSec · negative
cinema: { camera, lens, focal, aperture }   ← Cinema-Studio controls
```

Cinema-Studio vocab (Open-Higgsfield): cameras `8k-digital / cine-digital /
70mm-film / s35-studio / 16mm-film / large-format`; lenses `anamorphic / macro /
prime-70s / prime-modern / prime-warm / swirl-bokeh / vintage-prime /
halation-diffusion / clinical-sharp / tilt`; focal `8mm / 14mm / 24mm / 35mm /
50mm / 85mm`; aperture `f1.4 / f4 / f11`. Category prompt files:
`prompts/categories/`.

## For "his body / his story" lines

Don't generate — use his own photos (`~/Downloads/תמונות`,
`/Volumes/Seagate/the video/`, read in place). A generated or stock torso over "I
got the six pack" is exactly what he's rejected.
