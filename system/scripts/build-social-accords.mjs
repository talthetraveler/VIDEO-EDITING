import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const tr = JSON.parse(readFileSync(join(ROOT, "projects/social-accords/cache/transcript.json"), "utf8"));
const FPS = 30;
const SRC = "footage/social-accords/montana-social-accords-aroll.mp4";

// ---- KEEP: the read is teleprompter-clean (486 words, 0 gaps >0.45s, 0 fillers)
// so the tighten is just trimming the phone-hold head + dead tail.
const HEAD = 1.9, TAIL = 194.0;
const keep = {
  src: SRC, fps: FPS,
  segments: [[HEAD, TAIL]],
  stats: { originalSeconds: 194.37, keptSeconds: +(TAIL - HEAD).toFixed(2), fillersRemoved: 0 },
};
writeFileSync(join(ROOT, "public/footage/social-accords/montana-social-accords-aroll.keep.json"), JSON.stringify(keep, null, 2));

// ---- CAPTIONS: word-level Caption[] with manual fixes
const FIX = new Map([
  ["outreach", "outrage"],       // "they click on outrage"
  ["humanization", "dehumanization"], // "where hatred and dehumanization can lead"
]);
const words = tr.segments.flatMap((s) => s.w);
const caps = [];
for (let i = 0; i < words.length; i++) {
  const w = words[i];
  let t = w.t.replace(/\s+/g, " ");
  const bare = t.trim().toLowerCase().replace(/[.,!?]/g, "");
  if (FIX.has(bare)) t = t.replace(new RegExp(bare, "i"), FIX.get(bare));
  // "...do one thing make humanity back so join us" -> "make humanity viral"
  if (bare === "back" && i > 2 && words[i - 1].t.trim().toLowerCase() === "humanity") t = t.replace(/back/i, "viral");
  caps.push({
    text: t.startsWith(" ") ? t : " " + t,
    startMs: Math.round(w.s * 1000),
    endMs: Math.round(w.e * 1000),
    timestampMs: Math.round(((w.s + w.e) / 2) * 1000),
    confidence: 1,
  });
}
writeFileSync(join(ROOT, "public/footage/social-accords/montana-social-accords-aroll.captions.json"), JSON.stringify(caps, null, 2));
console.log(`keep: 1 segment ${keep.stats.keptSeconds}s | captions: ${caps.length} tokens`);
