#!/usr/bin/env node
// Frame.io CLI for the Tal editing system.
//
//   node scripts/frameio.mjs auth                      verify credentials
//   node scripts/frameio.mjs tree                      accounts/workspaces/projects
//   node scripts/frameio.mjs browse "<path>"           list a folder
//   node scripts/frameio.mjs discover "<path>"         proxies + transcripts (NO originals)
//   node scripts/frameio.mjs pull <fileId> [...]       originals, ONLY for chosen clips
//   node scripts/frameio.mjs deliver <file.mp4>        upload an APPROVED final
//
// RULES BAKED IN:
//   - discovery never downloads an original
//   - `deliver` only ever writes to FINAL_DEST below
//   - no delete / rename / move / overwrite exists anywhere in this tool
import {
  me, listAccounts, listWorkspaces, listProjects, listChildren, getAsset,
  getTranscript, getComments, resolvePath, download, uploadToFolder,
  cachePut, cacheGet, CACHE, FIO_DIR,
} from "./lib/frameio.mjs";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

// The ONLY folder approved finals may be written to.
const FINAL_DEST = "Assets/Shot in Israel/Final Videos/Edited by Claude";

const [cmd, ...rest] = process.argv.slice(2);
const cfgPath = join(FIO_DIR, "config.json");
const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")) : {};

const die = (m) => { console.error(`\n${m}\n`); process.exit(1); };
const fmtSize = (b) => b ? `${(b / 1048576).toFixed(1)}MB` : "";

async function ctx() {
  if (cfg.account_id && cfg.root_folder_id) return cfg;
  die(`Missing ${cfgPath}. Run \`node scripts/frameio.mjs tree\` first, then save:\n` +
      `{"account_id":"...","workspace_id":"...","project_id":"...","root_folder_id":"..."}`);
}

try {
  switch (cmd) {
    // -------------------------------------------------------------- auth
    case "auth": {
      const u = await me();
      const d = u.data ?? u;
      console.log(`OK — authenticated as ${d.name ?? d.email ?? JSON.stringify(d).slice(0, 120)}`);
      break;
    }

    // -------------------------------------------------------------- tree
    case "tree": {
      const accts = (await listAccounts()).data ?? [];
      for (const a of accts) {
        console.log(`ACCOUNT  ${a.id}  ${a.name ?? ""}`);
        const ws = (await listWorkspaces(a.id)).data ?? [];
        for (const w of ws) {
          console.log(`  WORKSPACE  ${w.id}  ${w.name ?? ""}`);
          const ps = (await listProjects(a.id, w.id)).data ?? [];
          for (const p of ps) {
            console.log(`    PROJECT  ${p.id}  ${p.name ?? ""}   root_folder=${p.root_folder_id ?? p.root_asset_id ?? "?"}`);
          }
        }
      }
      console.log(`\nSave the ids you want into ${cfgPath}`);
      break;
    }

    // ------------------------------------------------------------ browse
    case "browse": {
      const c = await ctx();
      const path = rest.join(" ");
      const { id, trail } = path
        ? await resolvePath(c.account_id, path, c.root_folder_id)
        : { id: c.root_folder_id, trail: ["(root)"] };
      const kids = await listChildren(c.account_id, id);
      console.log(`\n${trail.join(" / ")}   [${id}]\n`);
      for (const k of kids) {
        const isDir = k.type === "folder" || k.kind === "folder";
        console.log(`  ${isDir ? "DIR " : "FILE"}  ${k.id}  ${fmtSize(k.file_size).padStart(9)}  ${k.name}`);
      }
      console.log(`\n${kids.length} items`);
      break;
    }

    // ---------------------------------------------------------- discover
    // Read the shoot WITHOUT pulling originals: metadata + transcripts +
    // proxies only. This is the step that decides what is worth downloading.
    case "discover": {
      const c = await ctx();
      const path = rest.join(" ");
      if (!path) die("usage: discover \"<path>\"");
      const { id, trail } = await resolvePath(c.account_id, path, c.root_folder_id);
      const kids = await listChildren(c.account_id, id);
      const files = kids.filter((k) => !(k.type === "folder" || k.kind === "folder"));

      console.log(`\n${trail.join(" / ")}  —  ${files.length} files\n`);
      const report = [];
      for (const f of files) {
        const key = `asset_${f.id}`;
        let rec = cacheGet(key);
        if (!rec) {
          const a = (await getAsset(c.account_id, f.id)).data ?? {};
          const tr = await getTranscript(c.account_id, f.id).catch(() => null);
          let comments = [];
          try { comments = (await getComments(c.account_id, f.id)).data ?? []; } catch {}
          rec = {
            id: f.id, name: f.name, size: f.file_size,
            duration: a.media_metadata?.duration ?? a.duration ?? null,
            width: a.media_metadata?.width, height: a.media_metadata?.height,
            created: a.created_at,
            has_transcript: !!tr,
            transcript_endpoint: tr?.endpoint ?? null,
            transcript: tr?.data ?? null,
            comments: comments.map((x) => x.text).filter(Boolean),
          };
          cachePut(key, rec);
        }
        report.push(rec);
        const dur = rec.duration ? `${(+rec.duration).toFixed(0)}s` : "?";
        console.log(`  ${rec.id}  ${dur.padStart(5)}  ${fmtSize(rec.size).padStart(9)}  ${rec.has_transcript ? "TXT" : "---"}  ${rec.name}`);
      }
      const out = join(CACHE, `discover_${trail.at(-1).replace(/[^\w]+/g, "_")}.json`);
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(out, JSON.stringify({ path: trail, folder_id: id, files: report }, null, 2), "utf8");
      console.log(`\ncached -> ${out}`);
      console.log(`transcripts: ${report.filter((r) => r.has_transcript).length}/${report.length}`);
      console.log(`\nNO ORIGINALS DOWNLOADED. Use \`pull <fileId>\` for clips you actually cut with.`);
      break;
    }

    // ------------------------------------------------------------- proxy
    case "proxy": {
      const c = await ctx();
      for (const id of rest) {
        const r = await download(c.account_id, id, { quality: "proxy" });
        console.log(`${r.cached ? "cached" : "pulled"}  ${r.path}`);
      }
      break;
    }

    // -------------------------------------------------------------- pull
    // Originals. Opt-in, per clip, only for footage actually going in the edit.
    case "pull": {
      const c = await ctx();
      if (!rest.length) die("usage: pull <fileId> [fileId...]");
      for (const id of rest) {
        const r = await download(c.account_id, id, { quality: "original" });
        console.log(`${r.cached ? "cached" : "pulled"}  ${fmtSize(r.asset.file_size).padStart(9)}  ${r.path}`);
      }
      break;
    }

    // ----------------------------------------------------------- deliver
    // Upload an APPROVED final. Refuses anything that looks like a review.
    case "deliver": {
      const c = await ctx();
      const file = rest[0];
      if (!file || !existsSync(file)) die("usage: deliver <path-to-approved-final.mp4>");
      if (/\b(v\d+|review|draft|preview|temp|wip)\b/i.test(file)) {
        die(`Refusing: "${file}" looks like a review render.\n` +
            `Only APPROVED finals go to Frame.io. Review versions stay in chat.`);
      }
      const { id, trail } = await resolvePath(c.account_id, FINAL_DEST, c.root_folder_id);
      console.log(`uploading to ${trail.join(" / ")}`);
      const r = await uploadToFolder(c.account_id, id, file);
      console.log(`OK — ${r.name} (${fmtSize(r.size)}) -> ${r.id}`);
      break;
    }

    default:
      console.log(`Frame.io CLI — commands:
  auth                      verify credentials
  tree                      list accounts / workspaces / projects + root folder ids
  browse "<path>"           list one folder
  discover "<path>"         metadata + transcripts + no originals  <- start here
  proxy <fileId>...         download proxies for visual checking
  pull <fileId>...          download ORIGINALS (only for clips you will cut)
  deliver <final.mp4>       upload an approved final to ${FINAL_DEST}

Source footage is read-only: this tool has no delete, rename, move or overwrite.`);
  }
} catch (e) {
  die(e.message);
}
