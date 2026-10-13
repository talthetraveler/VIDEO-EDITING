"""Several stills in one process (the model load is most of the time).  sd-venv python sdbatch.py jobs.json
jobs.json = [{"out": "path.jpg", "prompt": "...", "seed": 7}, ...]"""
import sys, json, torch
from diffusers import StableDiffusionPipeline, LCMScheduler
from PIL import Image
jobs = json.load(open(sys.argv[1], encoding="utf-8"))
pipe = StableDiffusionPipeline.from_pretrained("Lykon/dreamshaper-8", torch_dtype=torch.float16, safety_checker=None)
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
pipe.fuse_lora()
pipe.enable_model_cpu_offload()
pipe.vae.enable_slicing()
for j in jobs:
    img = pipe(j["prompt"], negative_prompt="text, watermark, logo, deformed, extra fingers, blurry, cartoon, face close-up", num_inference_steps=7, guidance_scale=1.6,
               width=576, height=1024, generator=torch.Generator("cpu").manual_seed(j.get("seed", 7))).images[0]
    img.resize((1080, 1920), Image.LANCZOS).save(j["out"], quality=93)
    print("saved", j["out"])
