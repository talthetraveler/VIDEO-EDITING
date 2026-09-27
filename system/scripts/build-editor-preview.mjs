#!/usr/bin/env node
/**
 * Bundle src/editor-preview/mount.tsx → scratch/editor-preview/bundle.js with
 * esbuild. Fast (~1 s). review-server.mjs runs this at startup and serves the
 * output at /editor-preview.js for the timeline editor's instant <Player>.
 *
 *   node scripts/build-editor-preview.mjs [--watch]
 */
import { build, context } from "esbuild";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

const ROOT = process.cwd();
const outdir = join(ROOT, "scratch", "editor-preview");
mkdirSync(outdir, { recursive: true });

/** @type {import("esbuild").BuildOptions} */
const opts = {
  entryPoints: [join(ROOT, "src", "editor-preview", "mount.tsx")],
  outfile: join(outdir, "bundle.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  loader: { ".js": "jsx" },
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
  sourcemap: false,
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const ctx = await context(opts);
  await ctx.watch();
  console.log("· editor-preview: watching");
} else {
  await build(opts);
  console.log("✓ scratch/editor-preview/bundle.js");
}
