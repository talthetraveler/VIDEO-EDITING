#!/usr/bin/env node
/**
 * Build ONE AI draft as a project.json.
 *
 *   node scripts/proj-new.mjs --slug meta-shoot --name bakery-01 \
 *        --from-full FI_BAKERY_MAHMOUD \
 *        --brief "the bakery guy who wouldn't let me pay" \
 *        [--title "..."] [--caption-style tal_phrase] [--title-style tal_top_title]
 *        [--broll low|med|high] [--chat "make it warm" --chat "keep my questions"]
 *
 * --from-full seeds the video track from a vetted full-interaction spec
 * (scripts/full-interactions.json / scratch/full/*.json) — those already handle
 * "don't cut him off" and pause-splitting. Captions + title + learned
 * preferences are layered on top.
 *
 * Reads projects/_profile.json first and applies learned preferences, unless a
 * flag overrides them (explicit instruction always wins).
 *
 * VARIATION B — HOOK-FIRST:
 *   ... --hook MOMENT_0042 [--hook-in 12.4 --hook-out 15.1]
 *       [--time-card "HOW IT STARTED"] [--no-time-card] [--force]
 *
 * Lifts one later moment to the front as a cold open, drops a "HOW IT STARTED"
 * flashback card, then plays the whole interaction from the start so the body
 * explains the hook. The "must explain the hook" guard REJECTS a hook that is
 * itself the opening of the interaction (that's just the natural cut), and the
 * body is always the full seed in order so the lead-up is never dropped.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { openDb } from "./lib/db.mjs";
import { groupCaptions } from "./lib/caption-group.mjs";
import { emptyProject, saveProject, loadProfile, loadPreset, recomputeDuration, FPS } from "./lib/project.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const many = (n) => args.map((a, i) => (a === `--${n}` ? args[i + 1] : null)).filter(Boolean);

const slug = opt("slug", "meta-shoot");
const name = opt("name");
const fromFull = opt("from-full");
const brief = opt("brief", "");
if (!name || (!fromFull && !opt("from-comp"))) {
  console.error("Usage: node scripts/proj-new.mjs --slug <s> --name <n> (--from-full <FI_NAME> | --from-comp <COMP_NAME>) --brief <...>");
  process.exit(1);
}

const profile = loadProfile();
const pref = (k, dflt) => (profile.preferences[k]?.confidence >= 0.6 ? profile.preferences[k].value : dflt);

const captionStyleId = opt("caption-style", pref("caption_style", "tal_phrase"));
const titleStyleId = opt("title-style", pref("title_style", "tal_top_title"));
const capPreset = loadPreset("caption", captionStyleId);
const titlePreset = loadPreset("title", titleStyleId);

// ---- seed video track from a full-interaction OR compilation spec --------
const fromComp = opt("from-comp");
const isComp = !!fromComp;
const specPath = isComp
  ? join(root, "scratch", "comps", `${fromComp}.json`)
  : join(root, "scratch", "full", `${fromFull}.json`);
if (!existsSync(specPath)) {
  console.error(`✗ no seed spec ${specPath}`);
  process.exit(1);
}
const seed = JSON.parse(readFileSync(specPath, "utf8"));
const db = openDb(join(root, "public", "footage", slug, "library.db"));
const momClip = db.prepare("SELECT clip_id FROM moments WHERE id=?");
const momFull = db.prepare("SELECT clip_id, in_s, out_s, speech, interaction_id FROM moments WHERE id=?");
const clipPath = db.prepare("SELECT path FROM clips WHERE id=?");
const wordsOf = db.prepare("SELECT word,start_s,end_s FROM words WHERE clip_id=? AND end_s>start_s ORDER BY idx");

// learned trim nudges (seconds shaved off each beat head/tail), weak until repeated
const trimHead = Number(pref("trim_head_extra_sec", 0));
const trimTail = Number(pref("trim_tail_extra_sec", 0));

const p = emptyProject({ id: name, slug, brief });
p.chat_context = many("chat");
if (isComp) p.kind = "compilation";
p.caption_style = captionStyleId;
p.title_style = titleStyleId;
// Tal's references DON'T burn an @handle onto the video — default off.
// (--handle @name to opt in, or set burned_handle_watermark true in _profile.json)
p.handle = opt("handle", pref("burned_handle_watermark", false) ? "@talthetraveler" : null);

// resolve every seed moment to a concrete {src, cid, in, out} — these stay
// SEPARATE clips (the cut is meant to be tight; don't merge the trims away)
const spans = [];
for (const m of seed.moments) {
  const info = momFull.get(m.moment_id);
  const cid = info?.clip_id ?? momClip.get(m.moment_id)?.clip_id;
  if (!cid) continue;
  // compilation specs have bare {moment_id} — take the moment's own window from the DB
  const rawIn = m.in ?? info?.in_s ?? 0;
  const rawOut = m.out ?? info?.out_s ?? rawIn + 8;
  const inS = +(rawIn + trimHead).toFixed(3);
  const outS = +(rawOut - trimTail).toFixed(3);
  if (outS - inS < 0.4) continue;
  spans.push({ src: clipPath.get(cid).path, cid, inS, outS });
}

// ---- VARIATION B: hook-first cold open -----------------------------------
// --hook lifts one LATER moment to 0:00. Guard: it must not be the opening of
// the interaction, and the body stays = the full seed in order so the lead-up
// that explains the hook is never dropped.
const hookId = opt("hook");
let hookSpan = null;
if (hookId) {
  const hm = momFull.get(hookId);
  if (!hm) {
    console.error(`✗ --hook ${hookId}: no such moment in the ${slug} library`);
    process.exit(1);
  }
  const hin = +Number(opt("hook-in", hm.in_s)).toFixed(3);
  const hout = +Number(opt("hook-out", hm.out_s)).toFixed(3);
  if (hout - hin < 0.4) {
    console.error(`✗ hook window ${hin}-${hout}s is too short`);
    process.exit(1);
  }
  const hpath = clipPath.get(hm.clip_id)?.path;
  if (!hpath) {
    console.error(`✗ hook clip ${hm.clip_id} has no file path`);
    process.exit(1);
  }

  // "must explain the hook" guard — find where this hook's content sits on the
  // seed's own timeline. It must come from the LATTER part of the interaction;
  // if it overlaps the first ~25% of playtime it's just the natural opening.
  const seedTotal = seed.moments.reduce((s, m) => s + Math.max(0, m.out - m.in), 0);
  let acc = 0;
  let hookFrac = null; // earliest timeline fraction where the hook window appears
  for (const m of seed.moments) {
    const mc = momClip.get(m.moment_id)?.clip_id;
    const overlaps = mc === hm.clip_id && hin < m.out && hout > m.in;
    if (overlaps && hookFrac === null) hookFrac = seedTotal ? acc / seedTotal : 0;
    acc += Math.max(0, m.out - m.in);
  }
  if (hookFrac === null) {
    const seed0 = seed.moments[0] && momFull.get(seed.moments[0].moment_id);
    if (seed0 && hm.interaction_id && seed0.interaction_id !== hm.interaction_id)
      console.warn(
        `⚠ hook ${hookId} is from interaction ${hm.interaction_id}; the seed is ${seed0.interaction_id} — a different conversation. Using your pick anyway.`,
      );
    console.warn(
      `⚠ hook window isn't inside the seed's cut — can't verify it's from later in the talk. Body is the full seed, so the lead-up is still there.`,
    );
  } else if (hookFrac < 0.25 && !args.includes("--force")) {
    console.error(
      `✗ that hook sits ${Math.round(hookFrac * 100)}% into the interaction — that's the opening, not a hook.\n` +
        `  Hook-first = lift a surprising / curious line from LATER to the front, then cut back and let the\n` +
        `  conversation explain how you got there. Pick a later window (--hook-in/--hook-out), or pass --force.`,
    );
    process.exit(1);
  }
  if (!String(hm.speech || "").trim())
    console.warn(`⚠ hook ${hookId} has no transcribed speech — a cold open usually opens on a spoken line.`);

  hookSpan = { src: hpath, cid: hm.clip_id, inS: hin, outS: hout, _hook: true };
  spans.unshift(hookSpan);
  p.variation = "hook_first";
  p.hook_moment = hookId;
}

let tl = 0; // timeline cursor (seconds)
const capMode = capPreset.mode ?? "phrase";
const wpg = pref("caption_words_per_group", capPreset.wordsPerGroup ?? [2, 4]);
// case: preset carries it; profile can override (weak default, 4/6 refs uppercase)
const capUpper = pref("caption_uppercase", capPreset.uppercase !== false);

// Prefer a punctuated recap cache (scripts/proj-recaption.mjs) over the shared
// DB words — the library's words have NO punctuation, which wrecks phrasing.
const recapDir = join(root, "scratch", "recap", slug);
const recapFor = (cid) => {
  const f = join(recapDir, `${cid}.json`);
  if (!existsSync(f)) return null;
  try {
    return JSON.parse(readFileSync(f, "utf8")); // [{word,start,end}] source-clip seconds
  } catch {
    return null;
  }
};
let usedRecap = 0;

// "only start the video when I start talking" — open on the first CONNECTED
// speech, skipping faint/distant walk-up words. Not on the hook clip of a
// hook-first build (it's a deliberate cold open). --no-lead-trim to disable.
if (!args.includes("--no-lead-trim") && !isComp && spans[0] && !spans[0]._hook) {
  const s0 = spans[0];
  const recap0 = recapFor(s0.cid);
  const w0src = recap0 ? recap0.map((w) => ({ word: w.word, start_s: w.start, end_s: w.end })) : wordsOf.all(s0.cid);
  const ws = w0src
    .filter((w) => w.end_s > s0.inS - 0.1 && w.start_s < s0.outS && /[A-Za-z0-9]/.test(w.word))
    .sort((a, b) => a.start_s - b.start_s);
  // skip words whisper stretched across the quiet walk-up (>1.2s = silence) and
  // any word followed by a big gap
  let i = 0;
  while (i < ws.length - 1 && (ws[i].end_s - ws[i].start_s > 1.2 || ws[i + 1].end_s - ws[i + 1].start_s > 1.2 || ws[i + 1].start_s - ws[i].end_s >= 0.5)) i++;
  if (ws[i] && ws[i + 1] && ws[i].word.replace(/[^A-Za-z]/g, "").length <= 3 && ws[i + 1].start_s - ws[i].end_s < 0.6) i++;
  const w0 = ws[i];
  if (w0 && w0.start_s - s0.inS > 0.4) {
    const newIn = Math.max(0, +(w0.start_s - 0.2).toFixed(3));
    console.log(`  lead trim: first clip in ${s0.inS} → ${newIn}  opens on "${w0.word.trim()}" @ ${w0.start_s.toFixed(2)}s`);
    s0.inS = newIn;
  }
}

const allGroups = [];
for (let si = 0; si < spans.length; si++) {
  const s = spans[si];
  const next = spans[si + 1];
  const sameClipContiguous = next && next.src === s.src && next.inS - s.outS < 1.2 && next.inS >= s.inS;
  p.tracks.video.push({
    id: `v${p.tracks.video.length + 1}`,
    src: s.src,
    sourceIn: s.inS,
    sourceOut: s.outS,
    timelineStart: +tl.toFixed(3),
    speed: 1,
  });
  // words for THIS clip. Capture a hair past the window so a boundary word
  // isn't dropped; but only emit groups that START inside the clip.
  const dur = s.outS - s.inS;
  const recap = recapFor(s.cid);
  if (recap) usedRecap++;
  const rawWords = recap
    ? recap.map((w) => ({ word: w.word, start_s: w.start, end_s: w.end }))
    : wordsOf.all(s.cid);
  const words = rawWords
    .filter((w) => w.end_s > s.inS - (si === 0 ? 0.05 : 0.3) && w.start_s < s.outS + 0.3 && (si !== 0 || w.start_s > s.inS - 0.15))
    .map((w) => ({
      text: w.word.trim(),
      start: +(tl + (w.start_s - s.inS)).toFixed(3),
      end: +(tl + (w.end_s - s.inS)).toFixed(3),
    }));
  if (capMode !== "none" && words.length) {
    const g = groupCaptions(words, {
      mode: capMode,
      wordsPerGroup: wpg,
      maxWidthFrac: capPreset.maxWidthFrac ?? 0.86,
      sizePx: capPreset.sizePx ?? 76,
      uppercase: capUpper,
      leadMs: 110,
    });
    for (const grp of g) {
      // a group must belong to a clip it actually starts within
      if (grp.start < tl - 0.15 || grp.start > tl + dur + 0.15) continue;
      // clamp the group's on-screen end to this clip unless speech flows
      // straight into the next same-clip beat
      const clipEndTl = tl + dur;
      if (!sameClipContiguous) grp.end = Math.min(grp.end, clipEndTl + 0.12);
      // _words = EXACTLY this group's own words, by the indices the engine
      // returned (word_ids index into `words`). Any other matching drifts.
      const own = (grp.word_ids ?? []).map((wi) => words[wi]).filter(Boolean);
      allGroups.push({ ...grp, _words: own });
    }
  }
  tl += dur;
}

// ---- caption track (built per-run above) --------------------------------
const capPos = pref("caption_position", capPreset.position ?? { x: 0.5, y: 0.62 });
allGroups.sort((a, b) => a.start - b.start);
const dedupGroups = [];
for (const g of allGroups) {
  if (dedupGroups.some((x) => x.text === g.text && Math.abs(x.start - g.start) < 0.6)) continue;
  dedupGroups.push(g);
}
p.tracks.captions = dedupGroups
  .map((g, i) => ({
    id: `c${i + 1}`,
    type: "speech_caption",
    start: g.start,
    end: g.end,
    text: g.text,
    word_ids: g.word_ids,
    words: g._words ?? [],
    style: captionStyleId,
    position: capPos,
  }));

// ---- title track -------------------------------------------------------
recomputeDuration(p); // so "persist" hold and the Math.min clamp see a real duration
if ((titlePreset.variant ?? "pill") !== "none") {
  let titleText = opt("title", "");
  if (!titleText) {
    // Tal's title style: short POV framing that explains the situation while
    // scrolling. Cheap guess from the brief; he edits it and the system learns.
    const b = (brief || seed.strategy || name).toLowerCase();
    const ident = b.match(
      /\b(muslim|jewish|christian|nigerian|moroccan|indonesian|druze|arab|palestinian|ethiopian|sri lankan|priest)\b/,
    )?.[1];
    const place = b.match(/\b(bakery|restaurant|shop|mosque|church|market|old city|beach|jaffa|nazareth|jerusalem|tel aviv)\b/)?.[1];
    if (ident && place) titleText = `POV: I WENT TO A ${place} OWNED BY A ${ident} IN ISRAEL`;
    else if (ident) titleText = `POV: MEETING A ${ident} IN ISRAEL`;
    else if (place) titleText = `POV: I WENT TO A ${place} IN ISRAEL`;
    else {
      titleText = (brief || seed.strategy || name).replace(/["".]/g, "").trim();
      if (titleText.length > 42) titleText = titleText.slice(0, 42).replace(/\s\S*$/, "").trim();
    }
  }
  // hold: "hook" (~6s, default), "long" (~17s), "persist" (whole video). From
  // the references — selena drops after the setup, italian holds ~17s, west
  // bank keeps it up the whole time. --title-hold overrides.
  const holdModes = titlePreset.holdModes ?? { hook: 6, long: 17, persist: 0 };
  const holdMode = opt("title-hold", pref("title_hold", "hook"));
  let holdSec = Number(opt("title-hold-sec", holdModes[holdMode] ?? titlePreset.defaultHoldSec ?? 6));
  if (holdMode === "persist" || holdSec === 0) holdSec = p.duration || 999;
  // hook-first: the pill drops exactly when we cut to the body
  if (hookSpan) holdSec = Math.min(holdSec, Math.max(2, hookSpan.outS - hookSpan.inS));
  p.tracks.title.push({
    id: "t1",
    type: "title",
    text: titleText.toUpperCase(),
    start: 0,
    end: +Math.min(holdSec, p.duration || holdSec).toFixed(2),
    style: titleStyleId,
    position: pref("title_position", titlePreset.position ?? { x: 0.5, y: 0.08 }),
  });
}

// hook-first: optional flashback card at the cut to the body. OFF by default —
// Tal ("you don't need the HOW IT STARTED on the top") prefers a clean cut from
// the cold-open line straight into the meet. Pass --time-card "TEXT" to add one.
if (hookSpan && opt("time-card")) {
  const hookDur = hookSpan.outS - hookSpan.inS;
  p.tracks.title.push({
    id: "t2",
    type: "title_card",
    text: String(opt("time-card")).toUpperCase(),
    start: +hookDur.toFixed(2),
    end: +(hookDur + 2).toFixed(2),
    style: "time_jump",
    position: { x: 0.5, y: 0.13 },
  });
}

mkdirSync(join(root, "projects", name), { recursive: true });
writeFileSync(
  join(root, "projects", name, "BRIEF.md"),
  `# ${name}\n\n**Brief:** ${brief}\n**Seed:** ${fromFull} (${seed.strategy ?? ""})\n${hookSpan ? `**Variation:** hook-first (cold open = ${hookId})\n` : ""}**Caption style:** ${captionStyleId}\n**Title style:** ${titleStyleId}\n${p.chat_context.length ? "\n**Chat:**\n" + p.chat_context.map((c) => "- " + c).join("\n") + "\n" : ""}\n`,
);
saveProject(name, p, { isDraft: true });

console.log(`✓ projects/${name}/project.json  (AI_DRAFT, rev_000)`);
if (hookSpan) console.log(`  VARIATION B — hook-first · cold open = ${hookId} (${(hookSpan.outS - hookSpan.inS).toFixed(1)}s)`);
console.log(`  ${p.tracks.video.length} clips · ${(p.duration).toFixed(1)}s · ${p.tracks.captions.length} caption groups · title="${p.tracks.title[0]?.text ?? "(none)"}"`);
console.log(`  caption style: ${captionStyleId} (${capMode}, ${wpg[0]}-${wpg[1]} words)${usedRecap ? ` · punctuated recap for ${usedRecap}/${spans.length} clips` : " · ⚠ DB words have no punctuation — run proj-recaption for clean phrasing"}`);
const applied = Object.entries(profile.preferences).filter(([, v]) => v.confidence >= 0.6);
if (applied.length) console.log(`  applied learned prefs: ${applied.map(([k]) => k).join(", ")}`);
console.log(`\nNext: node scripts/proj-render.mjs ${name}`);
