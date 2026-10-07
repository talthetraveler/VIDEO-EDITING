#!/usr/bin/env node
// Frame.io -> a plain public URL Metricool can ingest.
//
// Metricool rejects Frame.io's signed download links ("Failed to normalize
// media") and needs a fast, plain URL; it then copies the file into its own
// storage. This script finds the videos in a Frame.io folder that carry a given
// Status, downloads each original, shrinks it under the bucket's 50 MB limit,
// uploads it to the public Supabase bucket and prints what to schedule.
//
//   node system/scripts/metricool-intake.mjs --list   <folderId> [--status "APPROVED TO POST"]
//   node system/scripts/metricool-intake.mjs --prepare <folderId> [--status "..."]   # download + shrink + upload
//   node system/scripts/metricool-intake.mjs --done <fileId> --post <metricoolUuid> --kind trial|main
//   node system/scripts/metricool-intake.mjs --posted <fileId> --to <folderId>       # status=posted + move
//
// Ledger: system/projects/_metricool-upload/ledger.json (what is already in the
// calendar, so nothing is scheduled twice). Needs SUPABASE_URL and
// SUPABASE_ANON_KEY in system/.env. READ-ONLY on Frame.io except --posted,
// which sets Status and moves ONE file into a POSTED folder (Tal asked for
// exactly that, 2026-10-07).
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { makeClient, filesIn } from "./lib/frameio-deliver.mjs";

const ROOT = "C:/Users/taldo/Downloads/videos to edit/system";
const WORK = join(ROOT, "projects/_metricool-upload/intake");
const LEDGER = join(ROOT, "projects/_metricool-upload/ledger.json");
const BUCKET = "metricool-videos";
const PROJECT = "74af6ae5-c17c-461a-9448-bd630af8dbe5";
const STATUS_FIELD = "4f00ee5a-b21c-4ee2-b4ef-d73ae4db5f7c";
const POSTED_OPTION = "1fafac7c-7380-4b2a-b9e2-09d7429d85cb";
const LIMIT_MB = 45;

const env = Object.fromEntries(readFileSync(join(ROOT, ".env"), "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const one = (r) => r?.response?.data ?? r?.data ?? r;
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ledger = () => (existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : {});
const client = makeClient();
const a = one(await client.accounts.index());
const acc = Array.isArray(a) ? a[0] : a;

const statusOf = async (id) => {
  const m = one(await client.metadata.show(acc.id, id, { show_null: true }));
  return (m.metadata ?? m).find((x) => x.field_definition_name === "Status")?.value?.[0]?.display_name ?? null;
};

if (arg("--done")) {
  const l = ledger();
  l[arg("--done")] = { ...(l[arg("--done")] ?? {}), post: arg("--post"), kind: arg("--kind"), scheduledAt: new Date().toISOString() };
  writeFileSync(LEDGER, JSON.stringify(l, null, 1));
  console.log("ledger updated");
} else if (arg("--posted")) {
  const id = arg("--posted"), dest = arg("--to");
  await client.metadata.bulkUpdate(acc.id, PROJECT, { data: { file_ids: [id], values: [{ field_definition_id: STATUS_FIELD, value: [POSTED_OPTION] }] } });
  await client.files.move(acc.id, id, { data: { parent_id: dest } });
  const f = one(await client.files.show(acc.id, id));
  console.log(f.parent_id === dest ? "MOVED" : "NOT MOVED", "| status:", await statusOf(id), "|", f.name);
  const l = ledger(); l[id] = { ...(l[id] ?? {}), posted: new Date().toISOString() }; writeFileSync(LEDGER, JSON.stringify(l, null, 1));
} else {
  const folder = arg("--list") ?? arg("--prepare");
  if (!folder) { console.error("usage: see header"); process.exit(1); }
  const want = arg("--status");
  const l = ledger();
  const out = [];
  for (const f of (await filesIn(client, acc.id, folder)).filter((x) => x.type === "file")) {
    if (l[f.id]?.post) continue;                       // already in the calendar
    const st = await statusOf(f.id);
    if (want && (st ?? "").toLowerCase() !== want.toLowerCase()) continue;
    const row = { id: f.id, name: f.name, status: st, mb: +(f.file_size / 1048576).toFixed(1) };
    if (arg("--prepare")) {
      mkdirSync(WORK, { recursive: true });
      const key = f.id.slice(0, 8) + ".mp4", src = join(WORK, f.id.slice(0, 8) + ".src"), dst = join(WORK, key);
      const d = one(await client.files.show(acc.id, f.id, { include: "media_links.original" }));
      writeFileSync(src, Buffer.from(await (await fetch(d.media_links.original.download_url)).arrayBuffer()));
      const dur = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).toString().trim();
      const vb = Math.min(9000, Math.floor((LIMIT_MB * 8192) / dur - 160));
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", "scale='min(1080,iw)':-2", "-c:v", "libx264", "-preset", "medium", "-b:v", `${vb}k`, "-maxrate", `${Math.floor(vb * 1.5)}k`, "-bufsize", `${vb * 2}k`, "-pix_fmt", "yuv420p", "-color_range", "tv", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", dst]);
      const up = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, { method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, apikey: env.SUPABASE_ANON_KEY, "Content-Type": "video/mp4", "x-upsert": "true" }, body: readFileSync(dst) });
      row.upload = up.status; row.seconds = +dur.toFixed(1); row.uploadedMb = +(statSync(dst).size / 1048576).toFixed(1);
      row.url = `${env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
      rmSync(src, { force: true });
    }
    out.push(row);
  }
  console.log(JSON.stringify(out, null, 1));
}
