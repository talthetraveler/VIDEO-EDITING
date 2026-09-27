#!/usr/bin/env node
/**
 * Make DUBBED trial-reel variants — clone a video's trial cut, replace the
 * spoken audio with an AI voice in another language, keep it as a new project.
 *
 *   node scripts/dub-variants.mjs --pairs "v12-ahmadi:ar,c01-salam:ar,v10-iraq:he"
 *   node scripts/dub-variants.mjs                # curated default set
 *
 * Writes projects/<slug>-<lang> (e.g. v12-ahmadi-ar) with p.dub set. Slow on
 * CPU (~15–30 min each). schedule-trials.mjs picks these up automatically.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync, cpSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };

// default: the videos whose message travels best in Arabic / Hebrew
const DEFAULT_PAIRS = "v12-ahmadi:ar,c01-salam:ar,v10-iraq:he";
const pairs = (opt("pairs", DEFAULT_PAIRS) || "")
  .split(",").map((s) => s.trim()).filter(Boolean)
  .map((s) => { const [slug, lang] = s.split(":"); return { slug, lang }; });

const done = [];
for (const { slug, lang } of pairs) {
  const from = existsSync(join(ROOT, "projects", `${slug}-b`, "project.json")) ? `${slug}-b` : `${slug}-a`;
  if (!existsSync(join(ROOT, "projects", from, "project.json"))) { console.log(`· skip ${slug}:${lang} — no ${from}`); continue; }
  const variant = `${slug}-${lang}`;
  const vdir = join(ROOT, "projects", variant);
  if (existsSync(join(vdir, "project.json")) && !args.includes("--force")) {
    const p = JSON.parse(readFileSync(join(vdir, "project.json"), "utf8"));
    if (p.dub && p.dub.lang === lang) { console.log(`✓ ${variant} already dubbed — skip`); done.push(variant); continue; }
  }
  console.log(`\n══ ${variant}  (${from} → ${lang}) ══`);
  rmSync(vdir, { recursive: true, force: true });
  cpSync(join(ROOT, "projects", from), vdir, { recursive: true });
  // fresh identity
  const p = JSON.parse(readFileSync(join(vdir, "project.json"), "utf8"));
  p.id = variant;
  delete p.dub;
  writeFileSync(join(vdir, "project.json"), JSON.stringify(p, null, 2));
  for (const f of ["revisions", "meta.json", "AI_DRAFT.json", "preview"]) rmSync(join(vdir, f), { recursive: true, force: true });

  const r = spawnSync(process.execPath, [join(ROOT, "scripts", "dub.mjs"), variant, "--lang", lang], { cwd: ROOT, stdio: "inherit", timeout: 45 * 60 * 1000 });
  if (r.status === 0) { console.log(`✓ ${variant}`); done.push(variant); }
  else console.log(`✗ ${variant} — dub failed`);
}
console.log(`\n${done.length}/${pairs.length} dubbed variant(s): ${done.join(", ")}`);
