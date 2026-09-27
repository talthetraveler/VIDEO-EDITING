# toolbox — NOT skills

These are reference implementations, not things to choose between.
Claude Code does not load anything in here as a skill, on purpose:
many of them declare triggers like *"use this skill EVERY time the user
wants to create a video"*, and when several compete for one trigger the
wrong one can win without erroring.

**There is exactly one skill: `skills/tal-video-editor/`.** It indexes
what is in here by sub-problem and reads a specific file on purpose when
a job needs it.

Nothing here is deleted or disabled - just demoted from door to drawer.
Moved 2026-09-24. 138 directories.
