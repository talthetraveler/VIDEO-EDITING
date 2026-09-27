/**
 * project.json — the editable timeline. The MP4 is only an output.
 *
 * Multi-track, non-destructive. Every clip keeps its source pointer so any edit
 * is reversible. Operations snapshot to revisions/ so undo/redo and the
 * AI_DRAFT-vs-APPROVED diff always work.
 *
 *   projects/<name>/
 *     project.json      current working state
 *     AI_DRAFT.json      immutable first AI version (rev_000)
 *     revisions/rev_NNN.json
 *     meta.json          { rev, redo, confirmedAt, chat[] }
 *     BRIEF.md
 *     preview/<name>.mp4
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const PRESET_DIR = join(process.cwd(), "projects", "_presets");
export const PROFILE_PATH = join(process.cwd(), "projects", "_profile.json");

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const loadPreset = (kind, id) => {
  const p = join(PRESET_DIR, kind, `${id}.json`);
  if (!existsSync(p)) throw new Error(`no ${kind} preset "${id}" (${p})`);
  return JSON.parse(readFileSync(p, "utf8"));
};

export const emptyProject = ({ id, slug, brief }) => ({
  id,
  slug,
  brief: brief ?? "",
  chat_context: [],
  fps: FPS,
  width: W,
  height: H,
  duration: 0,
  caption_style: "tal_phrase",
  title_style: "tal_top_title",
  tracks: { video: [], captions: [], title: [], broll: [], audio: [], music: [] },
});

/** total timeline duration = end of the last video clip */
export const recomputeDuration = (p) => {
  const end = (arr) => arr.reduce((m, c) => Math.max(m, (c.timelineStart ?? 0) + (c.timelineDur ?? (c.sourceOut - c.sourceIn))), 0);
  p.duration = +Math.max(end(p.tracks.video), end(p.tracks.broll)).toFixed(3);
  return p;
};

const projDir = (name) => join(process.cwd(), "projects", name);

export const loadProject = (name) => {
  const f = join(projDir(name), "project.json");
  if (!existsSync(f)) throw new Error(`no project "${name}"`);
  return JSON.parse(readFileSync(f, "utf8"));
};

export const loadDraft = (name) => JSON.parse(readFileSync(join(projDir(name), "AI_DRAFT.json"), "utf8"));

export const loadMeta = (name) => {
  const f = join(projDir(name), "meta.json");
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : { rev: 0, redo: [], chat: [], confirmedAt: null };
};
export const saveMeta = (name, m) => writeFileSync(join(projDir(name), "meta.json"), JSON.stringify(m, null, 2));

/**
 * Persist `p` as the new current state + a revision snapshot.
 * `isDraft` writes AI_DRAFT.json and rev_000 and does NOT bump the redo stack.
 */
export const saveProject = (name, p, { label = "edit", isDraft = false } = {}) => {
  const dir = projDir(name);
  mkdirSync(join(dir, "revisions"), { recursive: true });
  recomputeDuration(p);
  writeFileSync(join(dir, "project.json"), JSON.stringify(p, null, 2));

  const meta = loadMeta(name);
  if (isDraft) {
    writeFileSync(join(dir, "AI_DRAFT.json"), JSON.stringify(p, null, 2));
    writeFileSync(join(dir, "revisions", "rev_000.json"), JSON.stringify({ label: "AI_DRAFT", project: p }, null, 2));
    saveMeta(name, { rev: 0, redo: [], chat: meta.chat ?? [], confirmedAt: null });
    return 0;
  }
  const nextRev = meta.rev + 1;
  writeFileSync(
    join(dir, "revisions", `rev_${String(nextRev).padStart(3, "0")}.json`),
    JSON.stringify({ label, project: p }, null, 2),
  );
  saveMeta(name, { ...meta, rev: nextRev, redo: [] }); // a new edit clears redo
  return nextRev;
};

export const restoreRevision = (name, rev) => {
  const f = join(projDir(name), "revisions", `rev_${String(rev).padStart(3, "0")}.json`);
  if (!existsSync(f)) throw new Error(`no revision ${rev}`);
  const { project } = JSON.parse(readFileSync(f, "utf8"));
  writeFileSync(join(projDir(name), "project.json"), JSON.stringify(project, null, 2));
  return project;
};

export const undo = (name) => {
  const meta = loadMeta(name);
  if (meta.rev <= 0) return { ok: false, msg: "already at AI_DRAFT" };
  const from = meta.rev;
  restoreRevision(name, from - 1);
  saveMeta(name, { ...meta, rev: from - 1, redo: [from, ...(meta.redo ?? [])] });
  return { ok: true, rev: from - 1 };
};

export const redo = (name) => {
  const meta = loadMeta(name);
  if (!meta.redo?.length) return { ok: false, msg: "nothing to redo" };
  const [next, ...rest] = meta.redo;
  restoreRevision(name, next);
  saveMeta(name, { ...meta, rev: next, redo: rest });
  return { ok: true, rev: next };
};

export const listRevisions = (name) => {
  const dir = join(projDir(name), "revisions");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^rev_\d+\.json$/.test(f))
    .sort()
    .map((f) => {
      const { label } = JSON.parse(readFileSync(join(dir, f), "utf8"));
      return { rev: parseInt(f.match(/\d+/)[0], 10), label };
    });
};

// ---- learned preference profile ------------------------------------------
export const loadProfile = () =>
  existsSync(PROFILE_PATH) ? JSON.parse(readFileSync(PROFILE_PATH, "utf8")) : { preferences: {}, videos_confirmed: 0 };

export const saveProfile = (prof) => writeFileSync(PROFILE_PATH, JSON.stringify(prof, null, 2));

/**
 * Fold one signal into the profile. Explicit chat instruction → high confidence
 * fast; a single silent manual edit → weak, but repeats compound.
 *   strength: "explicit" | "manual" | "manual-repeat"
 */
export const learnSignal = (prof, key, value, strength = "manual") => {
  const p = prof.preferences[key] ?? { value, confidence: 0, samples: 0, history: [] };
  const bump = strength === "explicit" ? 0.6 : strength === "manual-repeat" ? 0.35 : 0.18;
  const sameDir = JSON.stringify(p.value) === JSON.stringify(value) || p.samples === 0;
  p.value = value;
  p.samples += 1;
  p.confidence = Math.min(0.98, sameDir ? p.confidence + bump : Math.max(0.1, p.confidence - 0.15) + bump * 0.5);
  p.history = [...(p.history ?? []).slice(-9), { value, strength, at: new Date().toISOString() }];
  prof.preferences[key] = p;
  return prof;
};
