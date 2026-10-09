// Download Frame.io originals for the posting tracker (remux .mov -> .mp4, no re-encode) and
// get an English text of the speech so captions are written from what is said, not a thumbnail.
import { writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { makeClient } from "./lib/frameio-deliver.mjs";
import { extractAudio, groqTranslate } from "./lib/stt.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const DIR = "projects/_metricool-upload/cf"; mkdirSync(DIR, { recursive: true });
for (const pair of process.argv.slice(2)) {
  const [key, id] = pair.split("=");
  const dst = `${DIR}/${key}.mp4`;
  try {
    if (!existsSync(dst)) {
      const d = one(await client.files.show(acc.id, id, { include: "media_links.original" }));
      const src = `${DIR}/${key}.src`;
      writeFileSync(src, Buffer.from(await (await fetch(d.media_links.original.download_url)).arrayBuffer()));
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-c", "copy", "-movflags", "+faststart", dst]);
      rmSync(src, { force: true });
    }
    const flac = `${DIR}/${key}.flac`;
    extractAudio(dst, flac);
    const r = await groqTranslate(flac);
    const text = (r.segments ?? []).map((x) => x.text).join(" "); writeFileSync(`${DIR}/${key}.txt`, text);
    rmSync(flac, { force: true });
    console.log(`\n=== ${key} ===\n${(r.text ?? "").trim()}`);
  } catch (e) { console.log(`\n=== ${key} FAILED: ${e.message}`); }
}
