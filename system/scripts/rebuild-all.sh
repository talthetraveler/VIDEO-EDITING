#!/usr/bin/env bash
# REBUILD EVERY DELIVERED CUT ON THE FIXED PIPELINE.
#
# Tal, 2026-09-21, on the set of 32: *"a lot of the video edits you made were
# so bad ... the captions were horrible ... the audio was so bad ... the colors
# are bad like everything is bad about them ... you need to fix up all them."*
#
# Five defects were found by looking at the renders and measuring them, and all
# five are fixed in the pipeline (LESSONS.md 26-27). Every cut therefore has to
# be built again — none of the delivered files can be patched, because the
# framing, the grade, the caption grouping and the beat-level audio gain all
# change what comes out of the builder.
#
# ORDER MATTERS:
#   1. fetch-hq --force   MAXH went 1080 -> 2160, so every cached span is a
#                         downscale of the original and has to come again.
#   2. build-edit         face-aimed framing, curve exposure, per-beat gain.
#   3. qa-look            flicker / level slams / noise floor / empty frames /
#                         captions read back as English.
#
# Resumable: a slug whose render is newer than its edit.json AND which passes
# qa-look is skipped, so this can be re-run after an interruption.
set -u
cd "C:/Users/taldo/Downloads/videos to edit/system" || exit 1

# --refetch re-pulls the HQ spans (MAXH went 1080 -> 2160). That is hours of
# download for the whole library, and it only changes the projects whose spans
# were actually downscaled — the caption, colour, audio and framing fixes do
# not need it. So it is OPT-IN: rebuild first, look at the sheets, then refetch
# only what is genuinely soft.
REFETCH=0
ARGS=()
for a in "$@"; do
  if [ "$a" = "--refetch" ]; then REFETCH=1; else ARGS+=("$a"); fi
done
ONLY="${ARGS[0]:-}"
PASS=(); FAIL=(); SKIP=()

for dir in projects/*/; do
  slug="$(basename "$dir")"
  case "$slug" in _*) continue;; esac
  [ -f "$dir/edit.json" ] || continue
  [ -n "$ONLY" ] && [ "$slug" != "$ONLY" ] && continue

  out="$(python -c "import json,sys;print(json.load(open(r'$dir/edit.json')).get('out') or '')" 2>/dev/null)"
  [ -z "$out" ] && { echo "!! $slug has no \"out\" in edit.json — skipping"; SKIP+=("$slug"); continue; }

  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "  $slug  ->  $out"
  echo "════════════════════════════════════════════════════════════"

  # 1. full-resolution spans, only when asked for.
  if [ "$REFETCH" = "1" ]; then
    node scripts/fetch-hq.mjs "$slug" --force 2>&1 | grep -E "^\s*[+=!]|FAILED" | tail -20
  fi

  # 2. rebuild
  if ! node scripts/build-edit.mjs "$slug" 2>&1 | grep -E "framing:|NO PERSON|exposure:|caption may|TOTAL|Error"; then
    echo "!! BUILD FAILED: $slug"; FAIL+=("$slug"); continue
  fi

  # 3. gate — and LOOK at it, which the contact sheet is for
  node scripts/sheet.mjs "$dir/$out" "$dir/SHEET.png" 9 >/dev/null 2>&1
  if node scripts/qa-look.mjs "$dir/$out"; then PASS+=("$slug"); else FAIL+=("$slug"); fi
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ${#PASS[@]} pass · ${#FAIL[@]} fail · ${#SKIP[@]} skipped"
[ ${#FAIL[@]} -gt 0 ] && printf '  FAIL: %s\n' "${FAIL[*]}"
echo ""
echo "  Every project now has SHEET.png — LOOK at each one before delivering."
echo "  Nothing is uploaded by this script. Delivery is a separate, deliberate"
echo "  step: node scripts/auto-deliver.mjs"
