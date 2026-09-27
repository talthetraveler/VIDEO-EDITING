#!/usr/bin/env node
/**
 * CONFIRM a video. Diff the AI draft against the approved project, extract
 * structured change signals, and fold them into projects/_profile.json with
 * confidence. The next `proj-new` reads that profile.
 *
 *   node scripts/proj-confirm.mjs <name> [--render-final] [--explicit key=value ...]
 *
 * --explicit marks a signal as a stated instruction (high confidence fast),
 *   e.g. --explicit caption_style=tal_phrase --explicit prefer_less_broll=true
 *
 * Signals compared (titles and captions kept SEPARATE — moving a title must not
 * teach "all text goes to the top"):
 *   hook / first-clip duration        → trim_head_extra_sec, preferred_tighter_hook
 *   per-clip in/out shrink            → trim_head_extra_sec / trim_tail_extra_sec
 *   clips removed                     → (recorded, not yet a numeric pref)
 *   caption style / words-per-group   → caption_style, caption_words_per_group
 *   caption vertical position         → caption_position
 *   title style / text / hold / y     → title_style, title_hold_sec, title_position
 *   captions removed from a section   → prefer_caption_gaps (weak)
 *   question kept before answer       → preserve_question_before_answer
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { loadProject, loadDraft, loadMeta, saveMeta, loadProfile, saveProfile, learnSignal } from "./lib/project.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
if (!name) {
  console.error("Usage: node scripts/proj-confirm.mjs <name> [--render-final] [--explicit k=v ...]");
  process.exit(1);
}
const explicit = args.map((a, i) => (a === "--explicit" ? args[i + 1] : null)).filter(Boolean);

const draft = loadDraft(name);
const appr = loadProject(name);
const meta = loadMeta(name);

const signals = []; // {key, value, strength, note}
const push = (key, value, strength, note) => signals.push({ key, value, strength, note });

// ---- clip / trim comparison -------------------------------------------------
const dV = draft.tracks.video;
const aV = appr.tracks.video;
const hookFirst = draft.variation === "hook_first";

if (hookFirst) {
  // a reordered timeline pollutes head/tail deltas — judge the structure instead
  if (appr.variation === "hook_first" && aV[0] && dV[0] && aV[0].src === dV[0].src) {
    push("hook_first_worked", true, "manual", `kept the ${draft.hook_moment ?? "hook"} cold open`);
    const dHook = dV[0].sourceOut - dV[0].sourceIn;
    const aHook = aV[0].sourceOut - aV[0].sourceIn;
    if (aHook < dHook - 0.4) push("preferred_tighter_hook", true, "manual", `hook ${dHook.toFixed(1)}s → ${aHook.toFixed(1)}s`);
  } else {
    push("hook_first_rejected", true, "manual", `Tal removed / replaced the ${draft.hook_moment ?? "hook"} cold open`);
  }
}

if (!hookFirst && dV[0] && aV[0]) {
  const dHook = dV[0].sourceOut - dV[0].sourceIn;
  const aHook = aV[0].sourceOut - aV[0].sourceIn;
  if (aHook < dHook - 0.4) push("preferred_tighter_hook", true, "manual", `hook ${dHook.toFixed(1)}s → ${aHook.toFixed(1)}s`);
}
// match clips by src+approx source window to see how Tal re-trimmed
let headDeltas = [];
let tailDeltas = [];
for (const a of hookFirst ? [] : aV) {
  // proj-op preserves clip ids, so match on id; fall back to nearest same-src
  let d = dV.find((x) => x.id === a.id);
  if (!d) {
    const cands = dV.filter((x) => x.src === a.src);
    d = cands.sort((x, y) => Math.abs(x.sourceIn - a.sourceIn) - Math.abs(y.sourceIn - a.sourceIn))[0];
    if (d && Math.abs(d.sourceIn - a.sourceIn) > 4) d = null;
  }
  if (!d) continue;
  headDeltas.push(a.sourceIn - d.sourceIn); // + = Tal moved the start later
  tailDeltas.push(d.sourceOut - a.sourceOut); // + = Tal pulled the end in
}
const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
if (headDeltas.filter((x) => Math.abs(x) > 0.15).length >= 2) {
  push("trim_head_extra_sec", +avg(headDeltas.filter((x) => x > 0)).toFixed(2), "manual", `avg +${avg(headDeltas).toFixed(2)}s off clip starts`);
}
if (tailDeltas.filter((x) => Math.abs(x) > 0.15).length >= 2) {
  push("trim_tail_extra_sec", +avg(tailDeltas.filter((x) => x > 0)).toFixed(2), "manual", `avg +${avg(tailDeltas).toFixed(2)}s off clip ends`);
}
if (!hookFirst && aV.length < dV.length) push("removed_clips", dV.length - aV.length, "manual", `${dV.length}→${aV.length} clips`);

// ---- captions (separate model) -------------------------------------------
if (appr.caption_style !== draft.caption_style) push("caption_style", appr.caption_style, "manual", `${draft.caption_style} → ${appr.caption_style}`);
if (appr._caption_words_per_group) push("caption_words_per_group", appr._caption_words_per_group, "manual", `words/group ${appr._caption_words_per_group.join("-")}`);
const dCapY = draft.tracks.captions[0]?.position?.y;
const aCapY = appr._caption_position?.y ?? appr.tracks.captions[0]?.position?.y;
if (dCapY != null && aCapY != null && Math.abs(aCapY - dCapY) > 0.02)
  push("caption_position", { x: 0.5, y: +aCapY.toFixed(3) }, "manual", `caption y ${dCapY} → ${aCapY}`);
const manualCapEdits = appr.tracks.captions.filter((c) => c.manual).length;
if (manualCapEdits) push("caption_hand_edits", manualCapEdits, "manual", `${manualCapEdits} caption text edits`);
if (draft.tracks.captions.length && appr.tracks.captions.length < draft.tracks.captions.length * 0.7)
  push("prefer_caption_gaps", true, "manual", `${draft.tracks.captions.length} → ${appr.tracks.captions.length} groups (removed sections)`);

// ---- title (separate model) --------------------------------------------
if (appr.title_style !== draft.title_style) push("title_style", appr.title_style, "manual", `${draft.title_style} → ${appr.title_style}`);
const dT = draft.tracks.title[0];
const aT = appr.tracks.title[0];
if (dT && aT) {
  if (Math.abs((aT.end - aT.start) - (dT.end - dT.start)) > 0.5)
    push("title_hold_sec", +(aT.end - aT.start).toFixed(1), "manual", `title hold ${(dT.end - dT.start).toFixed(1)} → ${(aT.end - aT.start).toFixed(1)}s`);
  if (aT.position?.y != null && dT.position?.y != null && Math.abs(aT.position.y - dT.position.y) > 0.015)
    push("title_position", { x: 0.5, y: +aT.position.y.toFixed(3) }, "manual", `title y ${dT.position.y} → ${aT.position.y}`);
  if (aT.text !== dT.text) push("title_text_edited", true, "manual", `"${dT.text}" → "${aT.text}"`);
} else if (dT && !aT) push("title_style", "none", "manual", "title removed");

// ---- explicit overrides -------------------------------------------------
for (const kv of explicit) {
  const [k, ...v] = kv.split("=");
  let val = v.join("=");
  try {
    val = JSON.parse(val);
  } catch {
    /* keep string */
  }
  push(k, val, "explicit", "stated instruction");
}

// ---- repeat detection: same signal seen before → escalate --------------
const prof = loadProfile();
for (const s of signals) {
  const prev = prof.preferences[s.key];
  if (prev && JSON.stringify(prev.value) === JSON.stringify(s.value) && s.strength === "manual") s.strength = "manual-repeat";
  learnSignal(prof, s.key, s.value, s.strength);
}
prof.videos_confirmed = (prof.videos_confirmed ?? 0) + 1;
saveProfile(prof);
saveMeta(name, { ...meta, confirmedAt: new Date().toISOString(), learnedSignals: signals });

// ---- report -----------------------------------------------------------
console.log(`\n✓ CONFIRMED ${name}   (video #${prof.videos_confirmed})\n`);
if (!signals.length) console.log("  no differences from the AI draft — nothing new to learn.");
else {
  console.log("  LEARNED FROM THIS VIDEO:");
  for (const s of signals) {
    const p = prof.preferences[s.key];
    console.log(`   • ${s.key} = ${JSON.stringify(s.value)}   [${s.strength}, confidence ${p.confidence.toFixed(2)}]`);
    console.log(`       ${s.note}`);
  }
  const acting = signals.filter((s) => prof.preferences[s.key].confidence >= 0.6);
  console.log(
    acting.length
      ? `\n  Video ${prof.videos_confirmed + 1} will start with: ${acting.map((s) => s.key).join(", ")}`
      : `\n  (all signals still low-confidence — need to see them repeat before auto-applying)`,
  );
}
console.log(`\n  profile: projects/_profile.json   ·   disable a wrong inference by editing that file`);

if (args.includes("--render-final")) {
  console.log("\n· rendering final (scale 1, crf 19)…");
  execFileSync(process.execPath, [join(root, "scripts", "proj-render.mjs"), name, "--final"], { stdio: "inherit" });
}
