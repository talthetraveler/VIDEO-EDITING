"""Local image generator for the AI story reels (free, unlimited). Stable Diffusion 1.5 (DreamShaper 8) + LCM LoRA,
sized for a 4 GB card. Usage:  sd-venv/Scripts/python.exe sdgen.py out.jpg "prompt" [seed]
Makes a 576x1024 image in ~6 steps, then upscales x1.875 to 1080x1920 (Lanczos)."""
import sys, torch
from diffusers import StableDiffusionPipeline, LCMScheduler
from PIL import Image
out, prompt = sys.argv[1], sys.argv[2]
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 7
pipe = StableDiffusionPipeline.from_pretrained("Lykon/dreamshaper-8", torch_dtype=torch.float16, safety_checker=None)
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
pipe.fuse_lora()
pipe.enable_model_cpu_offload()
pipe.vae.enable_slicing()
img = pipe(prompt, negative_prompt="text, watermark, logo, deformed, extra fingers, blurry, cartoon", num_inference_steps=7, guidance_scale=1.6,
           width=576, height=1024, generator=torch.Generator("cpu").manual_seed(seed)).images[0]
img.resize((1080, 1920), Image.LANCZOS).save(out, quality=93)
print("saved", out)
