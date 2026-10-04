#!/usr/bin/env node
// CHECK-SPANS - is every beat (and every audio graft / bed) of an edit inside
// the HQ span that was fetched for its clip?  A beat that runs past its span is
// clamped short by the builder, and every later audio-graft offset is then
// wrong (LESSONS 89). Run after ANY change to beat times, before building.
//   node system/scripts/check-spans.mjs <slug>      (exit 1 if anything is outside)
import { readFileSync } from "node:fs";
const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const slug = process.argv[2];
const e = JSON.parse(readFileSync(`${ROOT}/projects/${slug}/edit.json`, "utf8"));
const hq = JSON.parse(readFileSync(`${ROOT}/projects/_frameio/cache/hq/${slug}.json`, "utf8"));
let bad = 0;
const inside = (id, a, b) => { const h = hq[id]; return h && a >= h.offset - 0.01 && b <= h.offset + h.length + 0.01; };
e.beats.forEach((x, i) => {
  if (!x || x[0] === "CARD") return;
  if (!inside(x[0], x[1], x[2])) { console.log(`  !! beat ${i} ${String(x[0]).slice(0, 8)} ${x[1]}-${x[2]} is outside its span`); bad++; }
  const g = x[6]?.audio;
  if (g && !inside(g.id, g.at, g.at + (x[2] - x[1]))) { console.log(`  !! beat ${i} audio graft ${g.at}s is outside its span`); bad++; }
});
for (const [k, bd] of (e.beds ?? []).entries()) {
  let len = 0; for (let j = bd.from; j <= bd.to; j++) len += e.beats[j][2] - e.beats[j][1];
  if (!inside(bd.id, bd.at, bd.at + len)) { console.log(`  !! bed ${k} ${bd.at}-${(bd.at + len).toFixed(2)}s is outside its span`); bad++; }
}
console.log(bad ? `${bad} outside - run fetch-hq.mjs ${slug} again` : `all ${e.beats.length} beats inside their spans`);
process.exitCode = bad ? 1 : 0;
