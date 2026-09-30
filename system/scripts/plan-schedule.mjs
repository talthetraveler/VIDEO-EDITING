#!/usr/bin/env node
// PLAN-SCHEDULE — turn a finished batch into a posting calendar. Sends nothing.
//
//   node scripts/plan-schedule.mjs [slug] ["<VIDEOS OUT folder>"] [--start 2026-10-01]
//
// Tal, 2026-09-30: *"every day three videos on the main ... nine, 12 and 6 PM
// ... and three on the trial reels ... one, four and seven ... to all
// platforms connected on ShortSync ... captions should be there ... don't post
// them yet, just set it up."*
//
//   MAIN   09:00 12:00 18:00  Israel time  -> every connected platform, IG feed
//   TRIAL  13:00 16:00 19:00  Israel time  -> Instagram ONLY, as a Trial Reel
//
// Trials were first also sent to every other platform, which made 6 posts a
// day on TikTok/YouTube/Facebook/X. Tal then shared the growth advice: "avoid
// over-posting: more than 3 to 5 videos a day ... hurts overall engagement".
// Trial Reels only reach non-followers, so on Instagram they don't crowd the
// feed; everywhere else a trial is just a 4th-6th post. Now: 3/day everywhere.
//
// Who goes where: the V1 of each story is the MAIN post; its variations
// (V2/V3/V4 - different hook, different order) are TRIALS, which is what trial
// reels are for. "needs-tal" videos are HELD - listed, never scheduled - until
// Tal clears them. Only 1080x1920 files are planned.
//
// Order: randomized (seeded) and spread - see the RANDOMIZED block below.
//
// Writes projects/<slug>/schedule-plan.json (the exact input of
// `publish.mjs schedule --plan`) and schedule-held.json. Re-running it
// rebuilds the plan but keeps any item already submitted (post_ids).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const args = process.argv.slice(2);
const pos = args.filter((x, i) => !x.startsWith("--") && args[i - 1] !== "--start");
const slug = pos[0] ?? "israel-batch";
const outDir = pos[1] ?? join(ROOT, "..", "VIDEOS OUT", "2026-09-29 israel batch");
const startArg = args.includes("--start") ? args[args.indexOf("--start") + 1] : null;
const MAIN_H = [9, 12, 18], TRIAL_H = [13, 16, 19];

const readJSON = (p, d) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return d; } };
const mf = join(ROOT, "projects", slug, "manifest.jsonl");
const byFile = new Map();
for (const l of readFileSync(mf, "utf8").split(/\r?\n/).filter(Boolean)) {
  try { const r = JSON.parse(l); const f = basename(String(r.file || "")); if (f && existsSync(join(outDir, f))) byFile.set(f, { ...r, file: f }); } catch {}
}
// Captions: Tal, 2026-09-30 - *"the captions can just be like 'this is the side
// of Israel they don't show you online' - don't use too many tokens."* A few
// close variants rotate so no two posts in a row carry the identical text
// (platforms treat mass-duplicate captions as spam). A per-file override in
// projects/<slug>/captions.json still wins.
const CAPTION_LINES = [
  "This is the side of Israel they don't show you online 🇮🇱",
  "The side of Israel they don't show you online 🇮🇱",
  "This is the Israel they don't show you online 🇮🇱",
  "The side of Israel you won't see in the news 🇮🇱",
  "This is the side of Israel nobody shows you online 🇮🇱",
];
let capN = 0;
const overrides = readJSON(join(ROOT, "projects", slug, "captions.json"), {});
const captions = new Proxy({}, { get: (_, f) => overrides[f] ?? `${CAPTION_LINES[capN++ % CAPTION_LINES.length]}

#Israel #talthetraveler` });
const planPath = join(ROOT, "projects", slug, "schedule-plan.json");
const old = readJSON(planPath, []);
const submitted = new Map(old.filter((r) => r.post_ids).map((r) => [r.file, r]));

const full = (f) => {
  try {
    const [w, h] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", join(outDir, f)], { encoding: "utf8" }).trim().split(",").map(Number);
    return w === 1080 && h === 1920;
  } catch { return false; }
};
const story = (v) => String(v.title || v.file).replace(/\n/g, " ").replace(/\s*-\s*V\d+.*$/i, "").trim().toUpperCase();
// STYLE = what kind of video it is; FAITH = who is in it. "Same style" is what
// Tal means by not posting the same video twice: two kindness tests, two
// greeting montages, two flowers videos. (A single keyword tag put "A MUSLIM
// BAKER WON'T LET ME PAY" and "THEY WOULDN'T LET ME PAY" on back-to-back days.)
const STYLES = [
  ["GIVING", /FLOWER|WATER|HOMELESS|TOYS|HEART|GIVING/],
  ["KINDNESS", /KINDNESS|WON'T LET ME PAY|WOULDN'T LET ME PAY|PAY FOR MY TRAIN|TESTED/],
  ["GREETING", /SHABBAT|SALAM|EID|SHALOM/],
  ["ASKING", /ASKING|WHAT THEY THINK|WHAT MAKES|FEELS SAFE|CAN LIVE/],
  ["CALL", /CALL SOMEONE/],
  ["STORY", /ROMAN|ABRAHAM|PRIDE|ARABIC|BUS DRIVER|PHOTO|RESTAURANT|WHEELCHAIR|KID|BROTHERS/],
];
// YouTube needs a title per video: the on-screen title, one line, <= 100 chars
const ytTitle = (v) => String(v.title || v.file.replace(/\.mp4$/i, "")).replace(/\s+/g, " ").trim().slice(0, 100);
const txt = (v) => `${v.title} ${v.file}`.toUpperCase();
const topic = (v) => (STYLES.find(([, re]) => re.test(txt(v))) ?? ["MEETING"])[0];
const faiths = (v) => ["CHRISTIAN", "MUSLIM", "JEWISH", "HINDU", "BUDDHIST"].filter((f) => txt(v).includes(f));
const FAITH_MAX = 2; // per day

const all = [...byFile.values()];
// holiday greetings are out of date after the holiday and on Tal's cut list
const HOLIDAY = /SHANA TOVA|HAPPY NEW YEAR|CHAG SAMEACH|HAPPY HOLIDAYS/i;
// Tal can clear held videos: projects/<slug>/schedule-approved.json lists files he
// approved ("*" = all). 2026-09-30 he chose "All 22" - the boy and Shana Tova too.
const approvedP = join(ROOT, "projects", slug, "schedule-approved.json");
const approved = new Set(readJSON(approvedP, []));
const held = all.filter((v) => (v.status === "needs-tal" || HOLIDAY.test(`${v.title} ${v.file}`)) && !approved.has("*") && !approved.has(v.file));
const notFull = all.filter((v) => !held.includes(v) && !full(v.file));
const ready = all.filter((v) => !held.includes(v) && !notFull.includes(v) && !submitted.has(v.file));
const mains = ready.filter((v) => /^V1\b/i.test(v.variant || "V1"));
const trials = ready.filter((v) => !mains.includes(v));

// Asia/Jerusalem wall time -> ISO with the right offset for THAT date (DST-safe)
function israelISO(ymd, hour) {
  const guess = new Date(`${ymd}T${String(hour).padStart(2, "0")}:00:00Z`);
  const tzName = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", timeZoneName: "longOffset" }).formatToParts(guess).find((p) => p.type === "timeZoneName").value; // "GMT+03:00"
  const off = tzName.replace("GMT", "") || "+00:00";
  return `${ymd}T${String(hour).padStart(2, "0")}:00:00${off}`;
}
const addDays = (ymd, n) => { const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const tomorrow = addDays(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" }), 1);
const start = startArg ?? tomorrow;

// RANDOMIZED AND SPREAD (Tal, 2026-09-30: "space it out ... not post the same
// style video, like one day the Christian police officer and then the trials
// ... it should all be randomized"). Seeded, so a rebuild gives the same plan.
// Filled day by day, slot by slot (09 M, 12 M, 13 T, 16 T, 18 M, 19 T), each
// pick random among the videos that pass, strictest rule first:
//   1. no STYLE twice in the same day (main and trials together), and at most
//      FAITH_MAX videos featuring one faith that day
//   2. no style that ran the day before
//   3. two versions of one story >= STORY_GAP days apart
// Rules relax in reverse order only if nothing passes (logged).
const STORY_GAP = 5;
// PER-PLATFORM DAILY CAPS. Tal, 2026-09-30: "Post 1 to 2 videos per day on
// Facebook to maintain steady growth without fatiguing your audience or
// triggering spam filters." Facebook skips the 12:00 main -> 2/day (09 + 18).
// Everything else: 3/day (the 3 mains). Instagram: 3 feed + 3 Trial Reels.
// Facebook is posted DIRECTLY (Tal: "no, post to Facebook directly"); the
// duplicate route is the "facebook_for_instagram" connection, which
// publish.mjs always drops when "instagram" is connected.
const PLATFORM_SKIP = { 12: ["facebook"] };
let seed = 20261001;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const SLOTS = [[9, "main"], [12, "main"], [13, "trial"], [16, "trial"], [18, "main"], [19, "trial"]];
const pools = { main: [...mains].sort((a, b) => a.file.localeCompare(b.file)), trial: [...trials].sort((a, b) => a.file.localeCompare(b.file)) };
const plan = [...submitted.values()];
const storyDays = new Map(); // story -> [day index]
for (const r of plan) { const v = byFile.get(r.file); if (v) storyDays.set(story(v), [...(storyDays.get(story(v)) ?? []), -99]); }
let relaxed = 0, prevTopics = new Set();
for (let d = 0; (pools.main.length || pools.trial.length) && d < 200; d++) {
  const day = addDays(start, d);
  const today = new Set();
  const faithCount = new Map();
  const faithOk = (v) => faiths(v).every((f) => (faithCount.get(f) ?? 0) < FAITH_MAX);
  for (const [h, kind] of SLOTS) {
    const pool = pools[kind];
    if (!pool.length) continue;
    const storyOk = (v) => (storyDays.get(story(v)) ?? []).every((x) => Math.abs(x - d) >= STORY_GAP);
    const tiers = [
      (v) => !today.has(topic(v)) && !prevTopics.has(topic(v)) && faithOk(v) && storyOk(v),
      (v) => !today.has(topic(v)) && faithOk(v) && storyOk(v),
      (v) => !today.has(topic(v)) && storyOk(v),
      (v) => storyOk(v),
      (v) => (storyDays.get(story(v)) ?? []).every((x) => Math.abs(x - d) >= 3), // last resort: versions >= 3 days apart, no empty tail days
    ];
    let cands = [];
    for (const [ti, t] of tiers.entries()) { cands = pool.filter(t); if (cands.length) { if (ti) relaxed++; break; } }
    if (!cands.length) continue; // leave the slot empty rather than break the story gap
    const v = cands[Math.floor(rnd() * cands.length)];
    pool.splice(pool.indexOf(v), 1);
    today.add(topic(v));
    for (const f of faiths(v)) faithCount.set(f, (faithCount.get(f) ?? 0) + 1);
    storyDays.set(story(v), [...(storyDays.get(story(v)) ?? []), d]);
    plan.push({ project: join(outDir, v.file), file: v.file, as: kind, platforms: kind === "trial" ? ["instagram"] : (PLATFORM_SKIP[h] ? ["all", ...PLATFORM_SKIP[h].map((x) => "-" + x)] : ["all"]), at: israelISO(day, h), caption: captions[v.file] ?? "", title: ytTitle(v), slug: v.slug });
  }
  prevTopics = today;
}
const tq = [...pools.main, ...pools.trial];
plan.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
writeFileSync(planPath, JSON.stringify(plan, null, 1));
writeFileSync(join(ROOT, "projects", slug, "schedule-held.json"), JSON.stringify(held.map((v) => ({ file: v.file, why: HOLIDAY.test(`${v.title} ${v.file}`) ? "holiday greeting - out of date" : String(v.note || "").slice(0, 300) })), null, 1));

// report
const days = new Map();
for (const r of plan) { const d = r.at.slice(0, 10); if (!days.has(d)) days.set(d, []); days.get(d).push(r); }
for (const [d, rs] of days) {
  console.log(`\n${d}`);
  for (const r of rs) console.log(`  ${r.at.slice(11, 16)} ${r.as.padEnd(5)} ${r.post_ids ? "[SENT] " : ""}${r.file}${r.caption ? "" : "   !! NO CAPTION"}`);
}
const noCap = plan.filter((r) => !r.caption).length;
console.log(`\n${plan.filter((r) => r.as === "main").length} main + ${plan.filter((r) => r.as === "trial").length} trial over ${days.size} days (${start} -> ${[...days.keys()].at(-1)})`);
console.log(`rules relaxed ${relaxed}x (no strict pick available)
held (your call / holiday): ${held.length}   not full size (skipped): ${notFull.length}${notFull.length ? " - " + notFull.map((v) => v.file).join(", ") : ""}   leftover trials: ${tq.length}`);
console.log(`captions missing: ${noCap}${noCap ? " - fill projects/" + slug + "/captions.json and re-run" : ""}`);
console.log(`\nplan: ${planPath}\nNOTHING WAS SENT. To send: the posting page's "Submit schedule" button, or  node scripts/publish.mjs schedule --plan ${planPath} --confirm`);
