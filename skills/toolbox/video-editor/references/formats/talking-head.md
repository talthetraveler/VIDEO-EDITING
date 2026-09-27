# Talking head

**What it is:** one shot of him talking, clean cuts, captions, **no overlay**. The
simplest format — use when the words carry it and a picture over his head would
just be noise.

## Build

1. `npm run tighten -- <video> --slug <slug>` — filler/pause pass. If there are
   retakes, do the full `../clean-cuts.md` procedure.
2. Register the emitted `<Pascal>Cut` composition (or wrap `<AutoCut>` yourself).
3. Add `<Captions>` from the `captions.json` — drop shadow, no stroke, 2 lines
   max, break on speech, key words emphasised, inside the mobile safe area.
4. Optional: `<LowerThird>` for a name/context tag on the first line only.

That's it. Rule 1 (footage untouched) is automatic here — `<AutoCut>` plays his
frames at full frame.

## When to add one thing

If a single line names a number or a proper noun that really needs showing, a
brief `<Callout>` or one `<BigStat>` cut is allowed — but if you're adding a
picture per line, you're building the head-image reel, use that spec instead.
