# TRAVEL GRADES — presets, filters, letterbox, text styles

Part of `no-money-travel.md` (its section 5 sets the rule). Every number here is Tab's measurement of a reference reel, **not re-measured here**. The filters are Tab's fits to those measurements, starting points only: tone-map first, apply, then compare one still against the reference.

**Filter-string check.** These came out of PDF text. I read every string for broken numbers and split lines. None of the ones in sections 3 and 4 showed damage. The strings in section 5 were rejoined from broken lines by an earlier reader and never diffed against Tab's `.md` source: marked `[REJOINED]`. Tab's 4B filters were also "built from measurements, not yet test-rendered on Tal's frames." Nothing below was rendered here.

---

## 1. The rule on levels and warm/cool [TAL] + Tab

- [TAL] 2026-10-25: *"Every video I've given you, you should study the color grading reference."* Also: not every video gets this kind of grade; a talking or vlog clip stays natural. Never one look for everything.
- The fit moves **levels (a curve) plus warm/cool tint plus a saturation ratio, and nothing else**. No green or magenta push, tints capped. The earlier full three-channel fit pushed neon green and teal into Tal's clips and is not recommended.
- Content-heavy reels (grass, sea, sand) get their colour from the content. Never copy a reference's tint blindly.
- Grade per clip with `grade_match.py`, never one blanket LUT. Phone footage is already vivid: `"grade": false`, or LIGHT (`--strength 0.5`).
- Do not force a grade on well-exposed footage. Night presets only on footage already shot at night; on daylight they only darken.
- Pick by environment first, then mood: calm golden dunes = desert_golden_film; the same dunes in a storm = desert_orange_storm.
- Camera baselines on Tal's own footage (mean / black / white / sat): Sony 0.42 / 0.09 / 0.92 / 0.35; drone (flat) 0.55 / 0.26 / 0.99 / 0.24, cool; iPhone after tone-map 0.55 / 0.23 / sat 0.24.
- [TAL] 2026-10-25, on the Damqq recreate: *"don't add colors."* Honour it when a recreate has no grade of its own.
- Look at a before/after still every time. The "good green" note in section 4 is an open question, not a rule.

| scene | preset |
|---|---|
| talk, vlog, interview | city_natural_doc, green_pastel_matte |
| letterboxed world montage | mountain_moody_nordic (about a quarter of all references), green_moody_film |
| sunset, golden hour | city_heavy_golden_hour, desert_golden_film |
| white sand, bright desert | desert_bright_neutral |
| sand storm | desert_orange_storm |
| "Cost: $0" irony list | noir_desaturated |
| jungle, beach, people | beach_teal_orange |
| night | night_moody_film, night_red_practical |

---

## 2. HDR tone-map (do this before measuring or grading)

`ffprobe` every iPhone clip. `arib-std-b67` or `smpte2084` = HDR. Tone-map to SDR first, then look at a still. [TAL] caught the HDR download three times.

Main-file chain (use this one):
`zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p`

The library quotes a shorter form: `zscale=t=linear:npl=100,tonemap=hable:desat=0,zscale=p=bt709:t=bt709:m=bt709:r=tv,format=yuv420p`. **Not confirmed equivalent**; it skips the float format and the primaries step before the tone-map. Use the main-file chain unless a still shows a reason not to.

`tonemap=mobius` on HLG was rejected by Tal ("so bad", it looked changed; the source ties this to a Taiwan cut, another note ties a similar complaint to a different reel). Compare the SDR result by eye against the phone copy. Convert every beat to limited range at the end of the graph (CLAUDE.md, range bug).

---

## 3. Presets. Five filters each

Notation: **S-F** Sony full · **S-L** Sony light · **D-F** drone full · **D-L** drone light · **I-L** iPhone light (tone-mapped). Heading numbers: mean / contrast / black / white / saturation / warm-cool.

**desert_orange_storm** — the Mauritania sand-storm look, DcymL3TKSyQ. 0.39 / 0.23 / 0.10 / 0.70 / 0.63 / +0.36
- S-F `curves=m='0.0/0.007 0.097/0.104 0.461/0.386 0.956/0.697 1.0/0.741',colorbalance=rs=0.012:bs=-0.012:rm=0.040:bm=-0.040:rh=0.025:bh=-0.025,eq=saturation=1.50`
- S-L `curves=m='0.0/0.003 0.097/0.1 0.461/0.424 0.956/0.827 1.0/0.87',colorbalance=rs=0.006:bs=-0.006:rm=0.031:bm=-0.031:rh=0.025:bh=-0.025,eq=saturation=1.25`
- D-F `curves=m='0.0/0.0 0.281/0.104 0.543/0.386 0.92/0.697 1.0/0.777',colorbalance=rs=0.030:bs=-0.030:rm=0.040:bm=-0.040:rh=0.025:bh=-0.025,eq=saturation=1.50`
- D-L `curves=m='0.0/0.0 0.281/0.192 0.543/0.465 0.92/0.809 1.0/0.888',colorbalance=rs=0.022:bs=-0.022:rm=0.040:bm=-0.040:rh=0.025:bh=-0.025,eq=saturation=1.25`
- I-L `curves=m='0.0/0.0 0.371/0.237 0.641/0.513 0.885/0.791 1.0/0.906',colorbalance=rs=0.006:bs=-0.006:rm=0.040:bm=-0.040:rh=0.025:bh=-0.025,eq=saturation=1.25`
- STYLISED, hand-tuned on real dust, checked on Sony frames: `curves=m='0/0 0.09/0.10 0.42/0.39 0.92/0.70 1/0.74',colorbalance=rs=0.10:bs=-0.12:rm=0.15:gm=0.02:bm=-0.18:rh=0.08:bh=-0.12,eq=saturation=1.35`

**desert_golden_film** 0.45 / 0.17 / 0.14 / 0.76 / 0.40 / +0.15
- S-F `curves=m='0.0/0.039 0.097/0.135 0.461/0.447 0.956/0.76 1.0/0.804',colorbalance=rs=-0.006:bs=0.006:rm=0.013:bm=-0.013:rh=0.015:bh=-0.015,eq=saturation=1.06`
- S-L `curves=m='0.0/0.019 0.097/0.116 0.461/0.454 0.956/0.858 1.0/0.902',colorbalance=rs=-0.003:bs=0.003:rm=0.006:bm=-0.006:rh=0.008:bh=-0.008,eq=saturation=1.03`
- D-F `curves=m='0.0/0.0 0.281/0.135 0.543/0.447 0.92/0.76 1.0/0.84',colorbalance=rs=0.025:bs=-0.025:rm=0.040:bm=-0.040:rh=0.025:bh=-0.025,eq=saturation=1.30`
- D-L `curves=m='0.0/0.0 0.281/0.208 0.543/0.495 0.92/0.84 1.0/0.92',colorbalance=rs=0.013:bs=-0.013:rm=0.029:bm=-0.029:rh=0.020:bh=-0.020,eq=saturation=1.15`
- I-L `curves=m='0.0/0.0 0.371/0.253 0.641/0.544 0.885/0.823 1.0/0.937',colorbalance=rs=-0.003:bs=0.003:rm=0.023:bm=-0.023:rh=0.009:bh=-0.009,eq=saturation=1.25`

**desert_bright_neutral** 0.53 / 0.23 / 0.12 / 0.93 / 0.30 / +0.01
- S-F `curves=m='0.0/0.021 0.097/0.118 0.461/0.535 0.956/0.933 1.0/0.976',colorbalance=rs=-0.018:bs=0.018:rm=-0.018:bm=0.018:rh=-0.009:bh=0.009,eq=saturation=0.85`
- S-L `curves=m='0.0/0.01 0.097/0.107 0.461/0.498 0.956/0.945 1.0/0.988',colorbalance=rs=-0.009:bs=0.009:rm=-0.009:bm=0.009:rh=-0.005:bh=0.005,eq=saturation=0.92`
- D-F `curves=m='0.0/0.0 0.281/0.118 0.543/0.535 0.92/0.933 1.0/1.0',colorbalance=rs=0.013:bs=-0.013:rm=0.027:bm=-0.027:rh=0.015:bh=-0.015,eq=saturation=1.04`
- D-L `curves=m='0.0/0.0 0.281/0.199 0.543/0.539 0.92/0.926 1.0/1.0',colorbalance=rs=0.007:bs=-0.007:rm=0.013:bm=-0.013:rh=0.008:bh=-0.008,eq=saturation=1.02`
- I-L `curves=m='0.0/0.0 0.371/0.244 0.641/0.588 0.885/0.909 1.0/1.0',colorbalance=rs=-0.009:bs=0.009:rm=0.007:bm=-0.007:rh=-0.003:bh=0.003,eq=saturation=1.11`

**green_golden_saturated** — golden-hour greens, clean blue sky. 0.40 / 0.22 / 0.09 / 0.87 / 0.52 / -0.02
- S-F `curves=m='0.0/0.0 0.097/0.093 0.461/0.399 0.956/0.867 1.0/0.911',colorbalance=rs=-0.022:bs=0.022:rm=-0.024:bm=0.024:rh=-0.005:bh=0.005,eq=saturation=1.32`
- S-L `curves=m='0.0/0.0 0.097/0.095 0.461/0.43 0.956/0.912 1.0/0.956',colorbalance=rs=-0.011:bs=0.011:rm=-0.012:bm=0.012:rh=-0.002:bh=0.002,eq=saturation=1.16`
- D-F `curves=m='0.0/0.0 0.281/0.093 0.543/0.399 0.92/0.867 1.0/0.947',colorbalance=rs=0.010:bs=-0.010:rm=0.021:bm=-0.021:rh=0.020:bh=-0.020,eq=saturation=1.50`
- D-L `curves=m='0.0/0.0 0.281/0.187 0.543/0.471 0.92/0.894 1.0/0.974',colorbalance=rs=0.005:bs=-0.005:rm=0.010:bm=-0.010:rh=0.010:bh=-0.010,eq=saturation=1.25`
- I-L `curves=m='0.0/0.0 0.371/0.232 0.641/0.52 0.885/0.876 1.0/0.991',colorbalance=rs=-0.011:bs=0.011:rm=0.004:bm=-0.004:rh=-0.001:bh=0.001,eq=saturation=1.25`

**green_moody_film** — low-key forest, passport-and-map country film. 0.29 / 0.19 / 0.05 / 0.75 / 0.37 / +0.02
- S-F `curves=m='0.0/0.0 0.097/0.046 0.461/0.294 0.956/0.745 1.0/0.789',colorbalance=rs=-0.029:bs=0.029:rm=-0.016:bm=0.016:rh=0.025:bh=-0.025,eq=saturation=1.00`
- S-L `curves=m='0.0/0.0 0.097/0.071 0.461/0.378 0.956/0.851 1.0/0.894',colorbalance=rs=-0.015:bs=0.015:rm=-0.008:bm=0.008:rh=0.016:bh=-0.016,eq=saturation=1.00`
- D-F `curves=m='0.0/0.0 0.281/0.046 0.543/0.294 0.92/0.745 1.0/0.825',colorbalance=rs=0.002:bs=-0.002:rm=0.028:bm=-0.028:rh=0.025:bh=-0.025,eq=saturation=1.23`
- D-L `curves=m='0.0/0.0 0.281/0.164 0.543/0.419 0.92/0.833 1.0/0.913',colorbalance=rs=0.001:bs=-0.001:rm=0.014:bm=-0.014:rh=0.025:bh=-0.025,eq=saturation=1.11`
- I-L `curves=m='0.0/0.0 0.371/0.208 0.641/0.468 0.885/0.815 1.0/0.93',colorbalance=rs=-0.015:bs=0.015:rm=0.008:bm=-0.008:rh=0.017:bh=-0.017,eq=saturation=1.22`

**green_bright_faded_warm** — bright faded Kodak, the essay-VO look (blacks lifted 0.25-0.29). 0.56 / 0.17 / 0.27 / 0.88 / 0.45 / +0.12
- S-F `curves=m='0.0/0.172 0.097/0.269 0.461/0.563 0.956/0.884 1.0/0.927',colorbalance=rs=-0.021:bs=0.021:rm=0.007:bm=-0.007:rh=0.013:bh=-0.013,eq=saturation=1.18`
- S-L `curves=m='0.0/0.086 0.097/0.183 0.461/0.512 0.956/0.92 1.0/0.964',colorbalance=rs=-0.010:bs=0.010:rm=0.003:bm=-0.003:rh=0.006:bh=-0.006,eq=saturation=1.09`
- D-F `curves=m='0.0/0.0 0.281/0.269 0.543/0.563 0.92/0.884 1.0/0.963',colorbalance=rs=0.010:bs=-0.010:rm=0.040:bm=-0.040:rh=0.025:bh=-0.025,eq=saturation=1.45`
- D-L `curves=m='0.0/0.0 0.281/0.275 0.543/0.553 0.92/0.902 1.0/0.982',colorbalance=rs=0.005:bs=-0.005:rm=0.026:bm=-0.026:rh=0.019:bh=-0.019,eq=saturation=1.22`
- I-L `curves=m='0.0/0.0 0.371/0.32 0.641/0.602 0.885/0.885 1.0/0.999',colorbalance=rs=-0.011:bs=0.011:rm=0.020:bm=-0.020:rh=0.008:bh=-0.008,eq=saturation=1.25`

**green_pastel_matte** — airy, blacks about 0.15, cool. Vlog and best-country ranking. 0.46 / 0.17 / 0.16 / 0.82 / 0.30 / -0.06
- S-F `curves=m='0.0/0.059 0.097/0.155 0.461/0.458 0.956/0.824 1.0/0.868',colorbalance=rs=-0.030:bs=0.030:rm=-0.035:bm=0.035:rh=-0.014:bh=0.014,eq=saturation=0.86`
- S-L `curves=m='0.0/0.029 0.097/0.126 0.461/0.46 0.956/0.89 1.0/0.934',colorbalance=rs=-0.020:bs=0.020:rm=-0.017:bm=0.017:rh=-0.007:bh=0.007,eq=saturation=0.93`
- D-F `curves=m='0.0/0.0 0.281/0.155 0.543/0.458 0.92/0.824 1.0/0.904',colorbalance=rs=-0.009:bs=0.009:rm=0.010:bm=-0.010:rh=0.010:bh=-0.010,eq=saturation=1.05`
- D-L `curves=m='0.0/0.0 0.281/0.218 0.543/0.501 0.92/0.872 1.0/0.952',colorbalance=rs=-0.005:bs=0.005:rm=0.005:bm=-0.005:rh=0.005:bh=-0.005,eq=saturation=1.03`
- I-L `curves=m='0.0/0.0 0.371/0.263 0.641/0.55 0.885/0.855 1.0/0.969',colorbalance=rs=-0.021:bs=0.021:rm=-0.001:bm=0.001:rh=-0.006:bh=0.006,eq=saturation=1.12`

**snow_airy_cool** — bright alpine blue. 0.56 / 0.24 / 0.07 / 0.92 / 0.26 / -0.14
- S-F `curves=m='0.0/0.0 0.097/0.074 0.461/0.557 0.956/0.924 1.0/0.968',colorbalance=rs=-0.029:bs=0.029:rm=-0.040:bm=0.040:rh=-0.025:bh=0.025,eq=saturation=0.75`
- S-L `curves=m='0.0/0.0 0.097/0.085 0.461/0.509 0.956/0.94 1.0/0.984',colorbalance=rs=-0.014:bs=0.014:rm=-0.026:bm=0.026:rh=-0.025:bh=0.025,eq=saturation=0.87`
- D-F `curves=m='0.0/0.0 0.281/0.074 0.543/0.557 0.92/0.924 1.0/1.0',colorbalance=rs=0.002:bs=-0.002:rm=-0.008:bm=0.008:rh=-0.025:bh=0.025,eq=saturation=0.92`
- D-L `curves=m='0.0/0.0 0.281/0.177 0.543/0.55 0.92/0.922 1.0/1.0',colorbalance=rs=0.001:bs=-0.001:rm=-0.004:bm=0.004:rh=-0.016:bh=0.016,eq=saturation=0.96`
- I-L `curves=m='0.0/0.0 0.371/0.222 0.641/0.599 0.885/0.905 1.0/1.0',colorbalance=rs=-0.015:bs=0.015:rm=-0.010:bm=0.010:rh=-0.025:bh=0.025,eq=saturation=1.04`

**mountain_deep_polariser** — dark, ultra-saturated blue sky. 0.24 / 0.11 / 0.05 / 0.63 / 0.72 / -0.10
- S-F `curves=m='0.0/0.0 0.097/0.053 0.461/0.243 0.956/0.626 1.0/0.67',colorbalance=rs=-0.025:bs=0.025:rm=-0.040:bm=0.040:rh=-0.025:bh=0.025,eq=saturation=1.50`
- S-L `curves=m='0.0/0.0 0.097/0.075 0.461/0.352 0.956/0.791 1.0/0.835',colorbalance=rs=-0.013:bs=0.013:rm=-0.021:bm=0.021:rh=-0.014:bh=0.014,eq=saturation=1.25`
- D-F `curves=m='0.0/0.0 0.281/0.053 0.543/0.243 0.92/0.626 1.0/0.706',colorbalance=rs=0.006:bs=-0.006:rm=0.002:bm=-0.002:rh=-0.004:bh=0.004,eq=saturation=1.50`
- D-L `curves=m='0.0/0.0 0.281/0.167 0.543/0.393 0.92/0.773 1.0/0.853',colorbalance=rs=0.003:bs=-0.003:rm=0.001:bm=-0.001:rh=-0.002:bh=0.002,eq=saturation=1.25`
- I-L `curves=m='0.0/0.0 0.371/0.212 0.641/0.442 0.885/0.756 1.0/0.87',colorbalance=rs=-0.013:bs=0.013:rm=-0.005:bm=0.005:rh=-0.013:bh=0.013,eq=saturation=1.25`

**mountain_moody_nordic** — warm skin against teal; the most common match. 0.37 / 0.25 / 0.05 / 0.80 / 0.34 / +0.08
- S-F `curves=m='0.0/0.0 0.097/0.055 0.461/0.37 0.956/0.802 1.0/0.846',colorbalance=rs=-0.017:bs=0.017:rm=-0.003:bm=0.003:rh=0.024:bh=-0.024,eq=saturation=0.93`
- S-L `curves=m='0.0/0.0 0.097/0.076 0.461/0.416 0.956/0.879 1.0/0.923',colorbalance=rs=-0.009:bs=0.009:rm=-0.002:bm=0.002:rh=0.012:bh=-0.012,eq=saturation=0.97`
- D-F `curves=m='0.0/0.0 0.281/0.055 0.543/0.37 0.92/0.802 1.0/0.882',colorbalance=rs=0.014:bs=-0.014:rm=0.040:bm=-0.040:rh=0.025:bh=-0.025,eq=saturation=1.15`
- D-L `curves=m='0.0/0.0 0.281/0.168 0.543/0.457 0.92/0.861 1.0/0.941',colorbalance=rs=0.007:bs=-0.007:rm=0.021:bm=-0.021:rh=0.024:bh=-0.024,eq=saturation=1.07`
- I-L `curves=m='0.0/0.0 0.371/0.213 0.641/0.505 0.885/0.844 1.0/0.958',colorbalance=rs=-0.009:bs=0.009:rm=0.014:bm=-0.014:rh=0.013:bh=-0.013,eq=saturation=1.17`

**city_natural_doc** — "no visible grade". 0.41 / 0.25 / 0.07 / 0.94 / 0.24 / +0.07
- S-F `curves=m='0.0/0.0 0.097/0.069 0.461/0.406 0.956/0.945 1.0/0.988',colorbalance=rs=-0.015:bs=0.015:rm=-0.005:bm=0.005:rh=0.016:bh=-0.016,eq=saturation=0.71`
- S-L `curves=m='0.0/0.0 0.097/0.083 0.461/0.434 0.956/0.951 1.0/0.994',colorbalance=rs=-0.007:bs=0.007:rm=-0.002:bm=0.002:rh=0.008:bh=-0.008,eq=saturation=0.85`
- D-F `curves=m='0.0/0.0 0.281/0.069 0.543/0.406 0.92/0.945 1.0/1.0',colorbalance=rs=0.016:bs=-0.016:rm=0.040:bm=-0.040:rh=0.025:bh=-0.025,eq=saturation=0.87`
- D-L `curves=m='0.0/0.0 0.281/0.175 0.543/0.475 0.92/0.933 1.0/1.0',colorbalance=rs=0.008:bs=-0.008:rm=0.020:bm=-0.020:rh=0.020:bh=-0.020,eq=saturation=0.94`
- I-L `curves=m='0.0/0.0 0.371/0.22 0.641/0.524 0.885/0.915 1.0/1.0',colorbalance=rs=-0.008:bs=0.008:rm=0.014:bm=-0.014:rh=0.009:bh=-0.009,eq=saturation=1.01`

**city_teal_purple_matte** — lifted blacks, pastel sky. 0.45 / 0.20 / 0.10 / 0.73 / 0.39 / 0.00
- S-F `curves=m='0.0/0.005 0.097/0.102 0.461/0.446 0.956/0.726 1.0/0.77',colorbalance=rs=-0.030:bs=0.030:rm=-0.020:bm=0.020:rh=0.012:bh=-0.012,eq=saturation=1.06`
- S-L `curves=m='0.0/0.003 0.097/0.099 0.461/0.454 0.956/0.841 1.0/0.885',colorbalance=rs=-0.020:bs=0.020:rm=-0.010:bm=0.010:rh=0.006:bh=-0.006,eq=saturation=1.03`
- D-F `curves=m='0.0/0.0 0.281/0.102 0.543/0.446 0.92/0.726 1.0/0.806',colorbalance=rs=-0.008:bs=0.008:rm=0.025:bm=-0.025:rh=0.025:bh=-0.025,eq=saturation=1.30`
- D-L `curves=m='0.0/0.0 0.281/0.192 0.543/0.494 0.92/0.823 1.0/0.903',colorbalance=rs=-0.004:bs=0.004:rm=0.012:bm=-0.012:rh=0.018:bh=-0.018,eq=saturation=1.15`
- I-L `curves=m='0.0/0.0 0.371/0.236 0.641/0.543 0.885/0.806 1.0/0.92',colorbalance=rs=-0.020:bs=0.020:rm=0.006:bm=-0.006:rh=0.007:bh=-0.007,eq=saturation=1.25`

**city_heavy_golden_hour** — highs pulled to 0.62. 0.29 / 0.18 / 0.05 / 0.62 / 0.56 / +0.20
- S-F `curves=m='0.0/0.0 0.097/0.048 0.461/0.287 0.956/0.624 1.0/0.668',colorbalance=rs=-0.018:bs=0.018:rm=0.025:bm=-0.025:rh=0.025:bh=-0.025,eq=saturation=1.40`
- S-L `curves=m='0.0/0.0 0.097/0.073 0.461/0.374 0.956/0.79 1.0/0.834',colorbalance=rs=-0.009:bs=0.009:rm=0.013:bm=-0.013:rh=0.025:bh=-0.025,eq=saturation=1.20`
- D-F `curves=m='0.0/0.0 0.281/0.048 0.543/0.287 0.92/0.624 1.0/0.704',colorbalance=rs=0.013:bs=-0.013:rm=0.040:bm=-0.040:rh=0.025:bh=-0.025,eq=saturation=1.50`
- D-L `curves=m='0.0/0.0 0.281/0.165 0.543/0.415 0.92/0.772 1.0/0.852',colorbalance=rs=0.006:bs=-0.006:rm=0.035:bm=-0.035:rh=0.025:bh=-0.025,eq=saturation=1.25`
- I-L `curves=m='0.0/0.0 0.371/0.21 0.641/0.464 0.885/0.755 1.0/0.869',colorbalance=rs=-0.010:bs=0.010:rm=0.029:bm=-0.029:rh=0.025:bh=-0.025,eq=saturation=1.25`

**beach_teal_orange** — cool water and sky, rich blacks. 0.37 / 0.27 / 0.00 / 0.89 / 0.40 / -0.09
- S-F `curves=m='0.0/0.0 0.088/0.051 0.416/0.424 0.924/0.846 1.0/0.922',colorbalance=rs=-0.030:bs=0.030:rm=-0.040:bm=0.040:rh=-0.025:bh=0.025,eq=saturation=1.19`
- S-L `curves=m='0.0/0.0 0.097/0.048 0.461/0.415 0.956/0.922 1.0/0.966',colorbalance=rs=-0.015:bs=0.015:rm=-0.020:bm=0.020:rh=-0.005:bh=0.005,eq=saturation=1.04`
- D-F `curves=m='0.0/0.0 0.281/0.004 0.543/0.369 0.92/0.888 1.0/0.967',colorbalance=rs=0.001:bs=-0.001:rm=0.005:bm=-0.005:rh=0.014:bh=-0.014,eq=saturation=1.32`
- D-L `curves=m='0.0/0.0 0.281/0.141 0.543/0.456 0.92/0.904 1.0/0.984',colorbalance=rs=0.000:bs=-0.000:rm=0.002:bm=-0.002:rh=0.007:bh=-0.007,eq=saturation=1.16`
- I-L `curves=m='0.0/0.0 0.371/0.185 0.641/0.505 0.885/0.887 1.0/1.0',colorbalance=rs=-0.016:bs=0.016:rm=-0.004:bm=0.004:rh=-0.004:bh=0.004,eq=saturation=1.25`
- A second fit exists for the "they told me not to go" and promise-regret reels: S `curves=m='0.0/0.0 0.097/0.004 0.461/0.369 0.956/0.888 1.0/0.931',colorbalance=rs=-0.030:bs=0.030:rm=-0.040:bm=0.040:rh=-0.010:bh=0.010,eq=saturation=1.07`. The same preset name carries different numbers on different references; re-fit with `grade_match.py`.

**beach_bright_saturated** 0.53 / 0.20 / 0.08 / 0.91 / 0.52 / +0.01
- S-F `curves=m='0.0/0.0 0.097/0.076 0.461/0.528 0.956/0.909 1.0/0.953',colorbalance=rs=0.005:bs=-0.005:rm=-0.019:bm=0.019:rh=-0.014:bh=0.014,eq=saturation=1.32`
- S-L `curves=m='0.0/0.0 0.097/0.087 0.461/0.495 0.956/0.933 1.0/0.976',colorbalance=rs=0.002:bs=-0.002:rm=-0.009:bm=0.009:rh=-0.007:bh=0.007,eq=saturation=1.16`
- D-F `curves=m='0.0/0.0 0.281/0.076 0.543/0.528 0.92/0.909 1.0/0.989',colorbalance=rs=0.030:bs=-0.030:rm=0.026:bm=-0.026:rh=0.011:bh=-0.011,eq=saturation=1.50`
- D-L `curves=m='0.0/0.0 0.281/0.179 0.543/0.535 0.92/0.915 1.0/0.994',colorbalance=rs=0.018:bs=-0.018:rm=0.013:bm=-0.013:rh=0.005:bh=-0.005,eq=saturation=1.25`
- I-L `curves=m='0.0/0.0 0.371/0.224 0.641/0.584 0.885/0.897 1.0/1.0',colorbalance=rs=0.002:bs=-0.002:rm=0.007:bm=-0.007:rh=-0.006:bh=0.006,eq=saturation=1.25`

**night_moody_film** — very low key, warm practicals. 0.21 / 0.18 / 0.00 / 0.71 / 0.34 / +0.02
- S-F `curves=m='0.0/0.0 0.097/0.005 0.461/0.211 0.956/0.708 1.0/0.752',colorbalance=rs=-0.022:bs=0.022:rm=-0.016:bm=0.016:rh=0.024:bh=-0.024,eq=saturation=0.93`
- S-L `curves=m='0.0/0.0 0.097/0.051 0.461/0.336 0.956/0.832 1.0/0.876',colorbalance=rs=-0.011:bs=0.011:rm=-0.008:bm=0.008:rh=0.012:bh=-0.012,eq=saturation=0.97`
- D-F `curves=m='0.0/0.0 0.281/0.005 0.543/0.211 0.92/0.708 1.0/0.788',colorbalance=rs=0.009:bs=-0.009:rm=0.029:bm=-0.029:rh=0.025:bh=-0.025,eq=saturation=1.15`
- D-L `curves=m='0.0/0.0 0.281/0.143 0.543/0.377 0.92/0.814 1.0/0.894',colorbalance=rs=0.004:bs=-0.004:rm=0.014:bm=-0.014:rh=0.024:bh=-0.024,eq=saturation=1.07`
- I-L `curves=m='0.0/0.0 0.371/0.188 0.641/0.426 0.885/0.797 1.0/0.911',colorbalance=rs=-0.012:bs=0.012:rm=0.008:bm=-0.008:rh=0.013:bh=-0.013,eq=saturation=1.17`

**night_red_practical** — deep blacks, red practical light. 0.23 / 0.20 / 0.02 / 0.73 / 0.47 / +0.12
- S-F `curves=m='0.0/0.0 0.097/0.023 0.461/0.231 0.956/0.733 1.0/0.777',colorbalance=rs=0.006:bs=-0.006:rm=0.007:bm=-0.007:rh=0.013:bh=-0.013,eq=saturation=1.21`
- S-L `curves=m='0.0/0.0 0.097/0.06 0.461/0.346 0.956/0.845 1.0/0.888',colorbalance=rs=0.003:bs=-0.003:rm=0.004:bm=-0.004:rh=0.007:bh=-0.007,eq=saturation=1.10`
- D-F `curves=m='0.0/0.0 0.281/0.023 0.543/0.231 0.92/0.733 1.0/0.813',colorbalance=rs=0.030:bs=-0.030:rm=0.040:bm=-0.040:rh=0.025:bh=-0.025,eq=saturation=1.49`
- D-L `curves=m='0.0/0.0 0.281/0.152 0.543/0.387 0.92/0.827 1.0/0.906',colorbalance=rs=0.019:bs=-0.019:rm=0.026:bm=-0.026:rh=0.019:bh=-0.019,eq=saturation=1.24`
- I-L `curves=m='0.0/0.0 0.371/0.197 0.641/0.436 0.885/0.809 1.0/0.924',colorbalance=rs=0.003:bs=-0.003:rm=0.020:bm=-0.020:rh=0.008:bh=-0.008,eq=saturation=1.25`

**noir_desaturated** — near B&W, "Cost: $0" lists. 0.19 / 0.22 / 0.00 / 0.75 / 0.14 / -0.01
- S-F `curves=m='0.0/0.0 0.097/0.004 0.461/0.186 0.956/0.747 1.0/0.79',colorbalance=rs=-0.023:bs=0.023:rm=-0.024:bm=0.024:rh=-0.018:bh=0.018,eq=saturation=0.46`
- S-L `curves=m='0.0/0.0 0.097/0.048 0.461/0.324 0.956/0.852 1.0/0.895',colorbalance=rs=-0.011:bs=0.011:rm=-0.012:bm=0.012:rh=-0.009:bh=0.009,eq=saturation=0.73`
- D-F `curves=m='0.0/0.0 0.281/0.004 0.543/0.186 0.92/0.747 1.0/0.826',colorbalance=rs=0.008:bs=-0.008:rm=0.021:bm=-0.021:rh=0.007:bh=-0.007,eq=saturation=0.56`
- D-L `curves=m='0.0/0.0 0.281/0.141 0.543/0.365 0.92/0.834 1.0/0.913',colorbalance=rs=0.004:bs=-0.004:rm=0.011:bm=-0.011:rh=0.003:bh=-0.003,eq=saturation=0.78`
- I-L `curves=m='0.0/0.0 0.371/0.185 0.641/0.413 0.885/0.816 1.0/0.931',colorbalance=rs=-0.012:bs=0.012:rm=0.004:bm=-0.004:rh=-0.008:bh=0.008,eq=saturation=0.83`

---

## 4. Hand-tuned looks from single references

| look | where | filter |
|---|---|---|
| Petra / desert golden film (DdJra3Ho2Dw; [TAL] "Study this - music, color grading"), Sony | one 12 s forward push; highs capped 76-80% | `curves=m='0/0.06 0.15/0.12 0.5/0.47 0.8/0.735 1/0.79',colorbalance=rs=0.02:bs=-0.02:rm=0.08:bm=-0.08:rh=-0.04:gh=0.01:bh=0.05,huesaturation=hue=-6:saturation=0.25:colors=r+y,huesaturation=saturation=-0.35:colors=g,eq=saturation=0.95` |
| same, drone (flat profile, pull blacks first) | | `curves=m='0/0.04 0.26/0.115 0.55/0.45 0.95/0.76 1/0.79'`, same colorbalance and huesaturation, `eq=saturation=1.10` |
| same, iPhone | | `curves=m='0/0.04 0.23/0.115 0.55/0.46 0.85/0.74 1/0.79'`, same, `eq=saturation=1.10` |
| burnt-orange single colour (De2G25qMJTK) | sand, rock, dusk, fire only; muddy on green hills | `curves=m='0/0 0.3/0.17 0.6/0.44 1/0.7',colorbalance=rs=0.12:bs=-0.09:rm=0.2:gm=-0.02:bm=-0.2:rh=0.05:bh=-0.06,huesaturation=hue=-25:saturation=-0.6:colors=b+c,huesaturation=saturation=-0.8:colors=g,eq=saturation=1.6` (drone: then `eq=saturation=1.4:gamma=0.95`) |
| "jade mist" for green misty mountains | | `curves=m='0/0.03 0.5/0.45 1/0.78',colorbalance=rm=-0.04:bm=0.03:rh=0.03:bh=-0.04,huesaturation=saturation=-0.5:colors=r+y+m,eq=saturation=0.9` |
| soft natural film (Db_HGLtBmUL), Sony | blacks lifted 9%, highs 88% | `curves=m='0/0.07 0.25/0.24 0.5/0.5 0.85/0.83 1/0.9',colorbalance=rs=0.02:bs=-0.03:gm=0.015:bm=-0.02:rh=-0.03:gh=0.02,eq=saturation=0.92` (GoPro: `0/0.07 0.25/0.23 0.5/0.49 0.85/0.82 1/0.88`, same balance, `eq=saturation=0.85:contrast=0.97`) |
| mountain teal (De0y0sTqC5Q), Sony | cool, saturated, black at 0 | `curves=m='0/0.02 0.25/0.2 0.5/0.5 0.8/0.75 1/0.8',colorbalance=rs=-0.02:bs=0.02:rm=-0.04:gm=0.03:bm=0.01:gh=0.03:bh=-0.03,eq=saturation=1.15` (GoPro: `0/0.02 0.25/0.19 0.5/0.49 0.8/0.74 1/0.78`, same balance, `eq=saturation=1.05`) |
| warm punchy (Dbs9BagMg7c), Sony | warm orange mids, highs capped 81% | `curves=m='0/0.02 0.25/0.2 0.5/0.5 0.8/0.77 1/0.82',colorbalance=rs=0.02:bs=-0.02:rm=0.05:bm=-0.06,eq=saturation=1.05` |
| warm dusty (DccByRNvXAY), Sony | | `curves=m='0/0.04 0.25/0.22 0.5/0.5 0.82/0.79 1/0.85',colorbalance=rm=0.06:bm=-0.06:rh=0.03:gh=0.02:bh=-0.05,eq=saturation=1.05` |
| amber iron-ore-train grade ([TAL] asked for it) | everything pushed to orange, blues removed | `colorbalance=rs=.10:bs=-.12:rm=.18:bm=-.20:rh=.15:bh=-.20,hue=s=0.85,eq=contrast=0.95:gamma=1.03,curves=all='0/0.06 1/0.97'` `[REJOINED]` |
| moody teal-olive film, [TAL] "Good colour and everything" (Dd6EKK4oQ1Q) | | `curves=all='0/0 0.3/0.27 0.7/0.66 1/0.84',colorbalance=gs=.03:bs=-.04:gm=.05:bm=-.05:rh=-.02:gh=.04:bh=-.03,eq=saturation=0.92` `[REJOINED]` |
| "good green" A (natural phone colour, gentle fade) | the reel has no green cast | `curves=master='0/0.05 0.25/0.26 0.6/0.63 1/0.93':red='0/0.02 0.5/0.52 1/1':blue='0/0.06 0.5/0.48 1/0.97',eq=saturation=1.06:contrast=1.02,colorbalance=rm=0.03:gm=0.0:bm=-0.03:rh=0.02:bh=-0.02` |
| "good green" B (lush greens, teal shadows, warm skin; Tab recommended it) | **unconfirmed**: one source says B was cut off, another gives this string | `curves=master='0/0.05 0.25/0.25 0.6/0.62 1/0.94':green='0/0.03 0.5/0.52 1/1':blue='0/0.07 0.5/0.49 1/0.96',selectivecolor=greens='-0.25 0 -0.05 0':yellows='-0.15 0.05 -0.15 0':cyans='0.1 0 0 0',colorbalance=rs=-0.03:gs=0.03:bs=0.02:rm=0.03:gm=0.01:bm=-0.03,eq=saturation=1.08:contrast=1.03` |
| photo reel "Bro said..." | matte film, blacks about 0.07, highs capped 0.93, cool shadows | built as a per-photo-set percentile LUT, refit per country, plus saturation x0.6. No single filter |

Marking: **"good green" is an open question for Tal** ("good, green-light this" or "make it lush green"). `huesaturation` is a newer ffmpeg filter and **was not tested here**: check `ffmpeg -filters` on the Gyan build before relying on the Petra, burnt-orange and jade-mist rows.

---

## 5. Letterbox and frame filters (1080x1920 canvas, pure black bars)

| picture | band | filter |
|---|---|---|
| 4:3 | 1080x808, 29-71% | `scale=-2:808,crop=1080:808,pad=1080:1920:0:556:black` |
| 4:3 (main-file form) | 1080x810, y=555 | `scale=1080:810:force_original_aspect_ratio=increase,crop=1080:810,pad=1080:1920:0:555:black` |
| 3:2 | 1080x720, 31-69%, y=600 | `scale=-2:720,crop=1080:720,pad=1080:1920:0:600:black` |
| 5:4 | 1080x862, 27.5-72.4%, y=528 | `scale=1080:-2,crop=1080:862,pad=1080:1920:0:528:black` |
| 16:9 | 1080x608, centred | `scale=1080:-2,pad=1080:1920:0:(oh-ih)/2:black` |
| 2.39:1 | bars 55-68% black | same filter as 16:9; no crop of horizontal Sony footage |
| wide band for a news-style card | 1080x708 at y=606 (63%) | geometry only, filter not given |

- Measured bar sizes across references run 39-68% of the frame height, so there is no single "right" ratio: copy the reference.
- The 4:3 and 3:2 forms crop the sides of a 16:9 clip. Keep the subject centred (our reading, not Tab's).
- Text goes on the **black bars**, never on the picture, in every letterboxed format. Caption sits 40-60 px above the picture; type 38-46 px.
- "one day:" box is about 5:4, 85% of width, about 52% of the height black. A 4:3 clip with no letterbox, cropped like a phone video, is 960x720.
- Format switch as the drop: first shot full-frame 9:16, then a hard cut into the window on the beat (or the reverse).
- [TAL] rule: **never crop a horizontal clip to fill vertical**. The face-tracked crop in the Shorts Pack is a conflicting practice that Tal has not ruled on (see `no-money-recipes.md`).

---

## 6. Measured text styles (travel references)

Heights are % of frame height; type is small. Tab measured 1.4-3.5% across about 60 references, most 1.8-2.8%, below the 3-4% in the main file. Copy the reference on a recreation.

| role | look | drawtext / size |
|---|---|---|
| question over the picture (Machu Picchu ref) | white serif regular, 2 centred lines on black, static, about 2.6% each | Georgia or Times Regular, `fontsize=48`, `y=h*0.225` and `h*0.255` |
| "why did you bring your camera backpacking?" | lowercase thin high-contrast serif, 3 lines at 66-79%, faint shadow, gone at first beat; then a tiny "..." at 74% for the whole montage | `drawtext=fontfile=PlayfairDisplay-Regular.ttf:text='why did you bring':fontsize=64:fontcolor=white:x=(w-tw)/2:y=h*0.66:shadowcolor=black@0.35:shadowy=2:enable='lt(t,2.9)'`; lines 2-3 at `y=h*0.705` and `h*0.75` |
| "WELCOME TO ... / ANGOLA" | small bold uppercase sans on the black above the band; name 2x bigger on the beat, held to the end | Montserrat Bold `fontsize=30` at `y=540`; country `fontsize=58` at `y=515` |
| "Them: Going to Africa? ... Cape Town?" | regular sans, soft shadow, 2 lines upper third; swaps on the cut | Inter or Helvetica Regular `fontsize=52`, shadow black@0.5 offset 2, `y=h*0.28` and `h*0.32` |
| China "POV" | small white serif, 3 centred lines on the black, 20-26% down, about 1.8% each | Cormorant Garamond Regular `fontsize=34`, `y=380/420/460` |
| "how was japan?" | straight quotes, lowercase, `?` included, plain grotesque, pure white, **no outline, shadow or box**, dead centre, no animation, frame 1, gone with the cut at 3.09 s | `drawtext=text='"how was india?"':fontfile=Arial.ttf:fontsize=h*0.032:fontcolor=white:x=(w-tw)/2:y=(h-th)/2:enable='lt(t,3.09)'` — `fontsize` as an expression is **unconfirmed** on our ffmpeg; the fixed value is about 61 px |
| "how was peru?" | lowercase, curly quotes, small white sans, about 2.2% (42 px), centred about 50%, 0-3.3 s only | no drawtext given |
| risk/regret one-liner | thin white serif about 3.5% (64 px), no box, no shadow, whole reel | `fontsize=64`, `y=h/2-70` and `h/2+6` |
| "So why'd you go?" | white bold sans in quotes, soft shadow, about 12% from top, on the held shot only | no drawtext given |
| Satisfy-your-Soul stack | 4 lines on a black card, each on a drum hit: "Satisfy" about 80, "your" about 48, "Soul" about 160 bold in `0xF5C518`, then a 48 line | font sizes in px |
| george. photo-reel band | full-width black band y 1102-1169 (68 px, about 40% black), one white regular sans line, Inter Regular about 32 px, ends in an emoji | `drawbox=x=0:y=1102:w=iw:h=68:color=black@0.4:t=fill` is **our guess** at the band |
| speech subtitles (platform look) | white, soft shadow | `fontsize=40:fontcolor=white:shadowcolor=black@0.6:shadowx=2:shadowy=2:x=(w-text_w)/2:y=h*0.84` |
| rounded title pill | drawtext boxes are square-cornered, so draw a PNG with PIL, radius about 0.35 x line height, padding 24/14 px, text 54-60 px | `overlay=x=(W-w)/2:y=420:enable='between(t,0,3.4)'`, pre-fade the PNG 0.25 s in and out |
| talking-moment caption (T108) | Inter ExtraBold 74 px, white, 6 px black outline plus soft shadow, up to 3 words a line, earlier words dim to 85% | centred about y=1330 (69%) |

Positions seen (% from top): letterbox top band for every "POV" and Plan A reel; 22-25% quotes; 28-35% sky captions; 38-50% held one-liners; about 55% one-word karaoke; 60-70% chest-height vlog captions. Sizes: 2% deliberately tiny, about 3% default, 4-4.5% only for the loudest lines, about 5% one-word karaoke, about 10% an activity-vlog title.
Colour: white by default; cream or pale orange for an understated line; yellow for key words and clock stamps; red serif for a country dropped into the landscape. Containers: black text on a white rounded box ("Classic with background"), white text on black rounded boxes, a dark semi-transparent rounded box, or none.
Rules: one question, one size, one place. Hard swap on the cut, no animation, no fade. Hook text stays on the hold shot and is gone at the first beat. Never over a face.
