#!/usr/bin/env node
/**
 * Schedule EVERY finished re-cut (both the -a and -b cuts) as Instagram TRIAL
 * REELS + the other platforms — never the main IG grid. 3 per day at spread
 * times, rolling forward over the next days.
 *
 *   node scripts/schedule-trials.mjs [--only v03-indohome,v04-bakery]
 *        [--start 2026-09-12] [--per-day 3] [--dry] [--confirm]
 *
 * For each slug it renders the *_FINAL.mp4 masters if missing (slow), builds the
 * plan, prints it, and — with --confirm — submits it via publish.mjs and marks
 * the cards scheduled on the dashboard calendar.
 *
 * Nothing is sent without --confirm. Tal's standing instruction (2026-09-10):
 * "post everything on trial reels, no main, 4 per day, different times, the next
 * couple of days."
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const B = join(ROOT, "scratch", "batch");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const has = (n) => args.includes(`--${n}`);

const TZ_OFFSET_H = 3; // Israel (+03:00). ShortSync stores the wall time as UTC,
// so we send the UTC equivalent of each Israel slot.
// 6 candidate slots, 3h apart (ShortSync min_gap rule). Israel wall-clock hours.
const SLOT_H = [7, 10, 13, 16, 19, 22];
// Default 3/day, not 6: at 6/day Instagram started blocking the trial reels
// (2026-09-20). Fewer posts, spread as widely across the day as the slot list
// allows — picking the FIRST n would cluster them all into the morning.
const perDay = Math.min(SLOT_H.length, Number(opt("per-day", "3")));
const SLOTS = Array.from({ length: perDay }, (_, i) =>
  SLOT_H[Math.round((i * (SLOT_H.length - 1)) / Math.max(1, perDay - 1))]);
const dry = has("dry") || !has("confirm");
const only = (opt("only", "") || "").split(",").map((s) => s.trim()).filter(Boolean);

const PLATFORMS = ["instagram", "tiktok", "youtube", "facebook", "threads", "twitter", "bluesky", "pinterest", "snapchat", "mastodon"];

const queue = JSON.parse(readFileSync(join(B, "queue.json"), "utf8"));
const revPath = join(B, "review.json");
const rev = existsSync(revPath) ? JSON.parse(readFileSync(revPath, "utf8")) : {};
const state = (() => { try { return JSON.parse(readFileSync(join(B, "recut-state.json"), "utf8")); } catch { return { done: {} }; } })();

// ---- which slugs to schedule — only ones the re-cut has FINISHED ------
let slugs = only.length ? only : queue.map((q) => q.slug).filter((s) => Object.keys(state.done || {}).includes(s));
// skip ones already fully scheduled — UNLESS named explicitly via --only (an
// explicit call is usually "schedule the new dub/hook variant I just made",
// where -a/-b are already on the calendar but the new variant isn't yet).
if (!only.length) {
  slugs = slugs.filter((s) => {
    const r = rev[s] || {};
    const aDone = ["scheduled", "scheduling", "published"].includes(r.m);
    const bDone = ["scheduled", "scheduling", "published"].includes(r.t);
    return !(aDone && bDone);
  });
}
if (!slugs.length) { console.log("nothing to schedule — every finished re-cut is already on the calendar."); process.exit(0); }

// ---- build the item list: -a then -b per slug ------------------------
const q = (s) => queue.find((x) => x.slug === s) || { title: s };
const hookLine = (slug) => {
  try {
    return JSON.parse(readFileSync(join(B, "state.json"), "utf8")).plan.find((p) => p.slug === slug)?.hook_line || null;
  } catch {
    return null;
  }
};
// a hook line is only usable in a caption if it reads as a whole sentence
const cleanHook = (h) => {
  if (!h) return null;
  const s = h.trim();
  if (s.length < 12 || s.length > 90) return null;
  if (!/[.!?"]$/.test(s)) return null;
  if (/^(to|and|no|have|but|so|the|a|in|is|are|of|for|that|which|because|people)\b/i.test(s)) return null;
  if (!/^[A-Z"]/.test(s)) return null;
  return s;
};
const LANGNAME = { ar: "Arabic", he: "Hebrew", es: "Spanish", fr: "French", pt: "Portuguese", de: "German", hi: "Hindi", ru: "Russian", it: "Italian", tr: "Turkish" };
const variantsOnly = has("variants-only"); // schedule ONLY -c../-ar../.. extras, never re-add -a/-b
const items = [];
for (const s of slugs) {
  const t = (q(s).title || s).replace(/\s*[·—-].*$/, "").replace(/^POV:\s*/i, "").trim();
  const h = cleanHook(hookLine(s));
  if (!variantsOnly && existsSync(join(ROOT, "projects", `${s}-a`, "project.json")))
    items.push({ slug: s, track: "m", project: `${s}-a`, caption: t });
  if (!variantsOnly && existsSync(join(ROOT, "projects", `${s}-b`, "project.json")))
    items.push({ slug: s, track: "t", project: `${s}-b`, caption: h ? `${h}  —  ${t}` : t });
  // extra hook variations (-c, -d…) and DUBBED variants (-ar, -he…)
  try {
    for (const d of readdirSync(join(ROOT, "projects"))) {
      const m = d.match(new RegExp(`^${s}-([c-g]|ar|he|es|fr|pt|de|hi|ru|it|tr)$`));
      if (!m || !existsSync(join(ROOT, "projects", d, "project.json"))) continue;
      const suf = m[1];
      const lang = LANGNAME[suf];
      items.push({ slug: s, track: "t", project: d, caption: lang ? `${t}  (${lang} dub)` : h ? `${h}  —  ${t}` : t });
    }
  } catch { /* noop */ }
}

// ---- assign day/time slots, rolling forward ------------------------
const startDate = (() => {
  if (opt("start")) return new Date(opt("start") + "T12:00:00Z");
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1); // tomorrow
  return d;
})();
// respect slots already taken in rev.json (day index) — start after the last used day
const usedDays = Object.values(rev)
  .filter((v) => v.day && (["scheduled", "scheduling", "published"].includes(v.m) || ["scheduled", "scheduling", "published"].includes(v.t)))
  .map((v) => v.day);
const dayOffsetBase = usedDays.length ? Math.max(...usedDays) : 0;

// returns { at (UTC ISO, what ShortSync stores), il ("HH:MM" Israel wall time) }
const isoFor = (dayIdx, slotIdx) => {
  const d = new Date(startDate);
  d.setUTCDate(d.getUTCDate() + dayIdx);
  const ilHour = SLOTS[slotIdx];
  d.setUTCHours(ilHour - TZ_OFFSET_H, 0, 0, 0); // Israel wall-clock → UTC
  return { at: d.toISOString().slice(0, 19) + "Z", il: String(ilHour).padStart(2, "0") + ":00" };
};

const plan = [];
items.forEach((it, i) => {
  const dayIdx = Math.floor(i / perDay);
  const slotIdx = i % perDay;
  const s = isoFor(dayIdx, slotIdx);
  it.at = s.at;
  it.il = s.il;
  it.day = dayOffsetBase + dayIdx + 1;
  plan.push({ project: it.project, as: "trial", platforms: PLATFORMS, at: it.at, caption: it.caption });
});

// ---- print the schedule ----------------------------------------------
console.log(`\nTRIAL-REEL SCHEDULE — ${plan.length} posts (${slugs.length} videos × up to 2 cuts), ${perDay}/day, all as Instagram Trial Reels + ${PLATFORMS.length - 1} other platforms · NOT main IG\n`);
let lastDay = "";
for (const it of items) {
  // Israel calendar day for the header
  const ild = new Date(new Date(it.at).getTime() + TZ_OFFSET_H * 3600e3).toISOString().slice(0, 10);
  if (ild !== lastDay) { console.log(`  ── ${ild} (Israel) ──`); lastDay = ild; }
  console.log(`     ${it.il} IL  ${it.project.padEnd(22)} ${it.track === "m" ? "(main cut)" : "(trial cut)"}  "${it.caption.slice(0, 58)}"`);
}
writeFileSync(join(B, "trial-plan.json"), JSON.stringify(plan, null, 2));
console.log(`\nplan → scratch/batch/trial-plan.json`);

if (dry) {
  console.log(`\nDRY RUN — nothing scheduled. Re-run with --confirm to render finals + submit.`);
  process.exit(0);
}

// ---- render finals then submit --------------------------------------
console.log(`\n· rendering *_FINAL.mp4 masters (only the missing ones)…`);
for (const it of items) {
  const fin = join(ROOT, "projects", it.project, "preview", `${it.project}_FINAL.mp4`);
  if (existsSync(fin)) { console.log(`  ✓ ${it.project} (final exists)`); continue; }
  console.log(`  · ${it.project} …`);
  const r = spawnSync(process.execPath, [join(ROOT, "scripts", "proj-render.mjs"), it.project, "--final", "--crf", "20", "--preset", "fast"], { cwd: ROOT, stdio: "inherit", timeout: 30 * 60 * 1000 });
  if (r.status !== 0) console.log(`  ✗ ${it.project} final render failed — it will be skipped by publish.mjs`);
}

console.log(`\n· submitting to ShortSync…`);
const pub = spawnSync(process.execPath, [join(ROOT, "scripts", "publish.mjs"), "schedule", "--plan", join(B, "trial-plan.json"), "--confirm"], { cwd: ROOT, stdio: "inherit", timeout: 60 * 60 * 1000 });
if (pub.status !== 0) { console.error("\n✗ publish.mjs schedule failed — check the output above. Nothing marked scheduled."); process.exit(1); }

// ---- mark the dashboard ---------------------------------------------
const rev2 = JSON.parse(readFileSync(revPath, "utf8"));
for (const it of items) {
  rev2[it.slug] = { ...(rev2[it.slug] || {}), [it.track]: "scheduled", day: it.day, archived: false, status: "" };
}
writeFileSync(revPath, JSON.stringify(rev2, null, 2));
console.log(`\n✓ ${plan.length} trial-reel posts scheduled. They show on the 📅 Content calendar at http://localhost:4100`);
