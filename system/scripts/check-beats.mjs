#!/usr/bin/env node
// IS THE SPEAKER ON SCREEN FOR THIS BEAT?
//
//   node scripts/check-beats.mjs <slug> [--fix]
//
// Tal, on the delivered set: beats that caption dialogue over a shot with
// nobody in it — an empty street captioned "HELLO BROTHER, I GOT", a
// wheelbarrow captioned "FOR YOU", tree branches captioned "THIS IS YOUR HOME".
//
// It asks a stricter question than scripts/scan-empty.py (whose HOG detector
// answers YES to Tal's own forearm): is there a FACE, frontal or profile, for
// most of the beat? Body-only or nothing means the beat is a picture of
// something, not of someone.
//
// ── TWO BUGS THIS FILE SHIPPED WITH, both of which INVENTED defects ──────────
//
// The first version reported 25 of 32 films broken. Much of that was false,
// and both causes were in here, not in the edits:
//
//  1. HQ SPAN OFFSETS WERE NEVER APPLIED. sourceOf() returned `offset: null`
//     with dead code where the rebasing should have been, so an HQ span was
//     read using ORIGINAL-clip timestamps. shana-tova's beat 7 asks for
//     46.4-62.0s of a span that is 19.6s long and starts at 44.4s — every
//     sample landed past the end of the file and came back "no face". Rebased,
//     that beat holds a face for its entire length. It was never broken.
//
//  2. ROTATION WAS NEVER DERIVED. It passed `rot ?? 0`, so a beat with no
//     explicit rotation was scanned unrotated. The Sony clips are portrait
//     stored landscape, so the detector was shown faces lying on their side
//     and found none — call-my-mother came back 4-of-4 broken when three of
//     its four beats are perfectly framed. The builder decides rotation by
//     MEASURING a decoded frame (build-edit.mjs: `beatRot ?? (W > H ? 1 : 0)`),
//     because ffprobe reports CODED dimensions and a phone clip can be coded
//     landscape with a 90-degree display matrix. Same rule is used here.
//
// A measuring instrument that invents defects is worse than none: it sends you
// re-cutting films that were fine. Verify a flag by LOOKING before acting.
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { locate } from "./lib/framing.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const CACHE = join(ROOT, "projects/_frameio/cache");
const PROXY = join(CACHE, "proxies");
const HQDIR = join(CACHE, "hq");
const LOCAL = existsSync(join(CACHE, "local-sources.json"))
  ? JSON.parse(readFileSync(join(CACHE, "local-sources.json"), "utf8")) : {};

// id -> {offset,length} for every fetched HQ span, merged across ALL projects,
// exactly as build-edit.mjs does it.
const HQMAN = (() => {
  const m = {};
  if (existsSync(HQDIR)) for (const f of readdirSync(HQDIR).filter((x) => x.endsWith(".json"))) {
    try {
      const j = JSON.parse(readFileSync(join(HQDIR, f), "utf8"));
      for (const [id, v] of Object.entries(j))
        if (Number.isFinite(v?.offset)) m[id] = { offset: v.offset, length: v.length ?? Infinity };
    } catch {}
  }
  return m;
})();

const slug = process.argv[2];
const FIX = process.argv.includes("--fix");
if (!slug) { console.error("usage: node scripts/check-beats.mjs <slug> [--fix]"); process.exit(1); }
const cfg = JSON.parse(readFileSync(join(ROOT, "projects", slug, "edit.json"), "utf8"));

/** Same source AND same clock the builder uses. Returns times already rebased. */
function resolve(id, ss, to) {
  if (LOCAL[id]?.path && existsSync(LOCAL[id].path)) return { path: LOCAL[id].path, ss, to };
  const rec = HQMAN[id];
  const hq = join(HQDIR, `${id}.mp4`);
  if (rec && existsSync(hq) && ss >= rec.offset - 0.01 && to <= rec.offset + rec.length + 0.01)
    return { path: hq, ss: +(ss - rec.offset).toFixed(3), to: +(to - rec.offset).toFixed(3) };
  const px = join(PROXY, `${id}.mp4`);
  return existsSync(px) ? { path: px, ss, to } : null;
}

const TMP = mkdtempSync(join(tmpdir(), "chkbeats-"));
/** Rotation the way the builder derives it: measure a DECODED frame. */
function rotFor(path, ss, beatRot) {
  if (beatRot !== null && beatRot !== undefined) return beatRot;
  if (cfg.layout === "square") return 0;
  try {
    const png = join(TMP, "p.png");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(Math.max(0, ss)), "-i", path,
      "-frames:v", "1", png], { stdio: "pipe" });
    const [W, H] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height", "-of", "csv=p=0:nk=1", png], { encoding: "utf8" })
      .trim().split(/[,\r\n]+/).map(Number);
    return W > H ? 1 : 0;
  } catch { return 0; }
}

console.log(`\n${slug} — ${cfg.beats.length} beats\n`);
const bad = [];
for (let i = 0; i < cfg.beats.length; i++) {
  const [id, ss, to, , why, beatRot] = cfg.beats[i];
  if (id === "CARD") { console.log(`  ${String(i).padStart(2)}  CARD`); continue; }
  const r = resolve(id, ss, to);
  if (!r) { console.log(`  ${String(i).padStart(2)}  no source for ${String(id).slice(0, 8)}`); continue; }
  const dur = to - ss;
  const rot = rotFor(r.path, r.ss, beatRot);
  const box = locate(r.path, r.ss, r.to, rot, Math.max(5, Math.min(10, Math.round(dur))));
  const kind = box?.found ? box.by : "none";
  const conf = box?.found ? box.found / (box.of || 1) : 0;
  const okFace = (kind === "face" || kind === "profile") && conf >= 0.4;
  if (!okFace) bad.push(i);
  console.log(`${okFace ? "ok  " : "!!  "}${String(i).padStart(2)}  ${String(id).slice(0, 8)} ` +
    `${ss.toFixed(1)}-${to.toFixed(1)} (${dur.toFixed(1)}s) rot${rot}  ${kind} ${(conf * 100).toFixed(0)}%   ${String(why ?? "").slice(0, 52)}`);

  if (!okFace && FIX) {
    let best = null;
    for (const shift of [-12, -9, -6, -4, -2, 2, 4, 6, 9, 12]) {
      const a = r.ss + shift, b = r.to + shift;
      if (a < 0) continue;
      const t = locate(r.path, a, b, rot, 5);
      if (!t?.found || (t.by !== "face" && t.by !== "profile")) continue;
      const c = t.found / (t.of || 1);
      if (c < 0.6) continue;
      if (!best || Math.abs(shift) < Math.abs(best.shift)) best = { shift, c, by: t.by };
    }
    if (best) console.log(`        -> try ${(ss + best.shift).toFixed(1)}-${(to + best.shift).toFixed(1)} ` +
      `(${best.shift > 0 ? "+" : ""}${best.shift}s)  ${best.by} ${(best.c * 100).toFixed(0)}%`);
    else console.log(`        -> nothing within 12s holds a face — scan the whole clip:  node scripts/find-faces.mjs ${id}`);
  }
}
try { rmSync(TMP, { recursive: true, force: true }); } catch {}
console.log(`\n${bad.length} of ${cfg.beats.length} beats have no face on screen: [${bad.join(", ")}]`);
