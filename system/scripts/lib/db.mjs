/**
 * Footage library — a single local SQLite file (node:sqlite, built into Node 24,
 * zero native deps). One DB per shoot: public/footage/<slug>/library.db
 *
 * Tables:
 *   clips        one row per raw file (metadata, transcript, language)
 *   words        word-level timings (from whisper.cpp)
 *   speech       speech regions (start/end) — VAD or word-derived
 *   frames       extracted keyframes + CLIP embedding (Float32 blob, 512-d)
 *   interactions grouped consecutive clips = one conversation/story
 *   moments      reusable in/out spans with speech + action + reaction + quality
 *   edits        saved edit-JSONs (variation specs)
 *   edit_moments which moments an edit used (usage tracking)
 *
 * Everything is additive + idempotent so `index-footage` is resumable.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const openDb = (path) => {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS clips (
      id            TEXT PRIMARY KEY,          -- basename without ext
      path          TEXT NOT NULL,             -- staticFile-relative src
      abs_path      TEXT NOT NULL,
      ext           TEXT,
      bytes         INTEGER,
      duration_s    REAL,
      width         INTEGER,
      height        INTEGER,
      fps           REAL,
      created_ms    INTEGER,                   -- mtime / filename timestamp
      order_index   INTEGER,                   -- position in the sorted folder
      language      TEXT,                      -- detected: en/he/ar/...
      transcript    TEXT,
      has_audio     INTEGER DEFAULT 1,
      indexed_at    INTEGER
    );
    CREATE TABLE IF NOT EXISTS words (
      clip_id   TEXT NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
      idx       INTEGER NOT NULL,
      word      TEXT, norm TEXT,
      start_s   REAL, end_s REAL,
      PRIMARY KEY (clip_id, idx)
    );
    CREATE TABLE IF NOT EXISTS speech (
      clip_id  TEXT NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
      start_s  REAL, end_s REAL
    );
    CREATE TABLE IF NOT EXISTS frames (
      clip_id  TEXT NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
      t_s      REAL,
      jpg_path TEXT,
      embed    BLOB,                           -- Float32Array(512)
      PRIMARY KEY (clip_id, t_s)
    );
    CREATE TABLE IF NOT EXISTS interactions (
      id           TEXT PRIMARY KEY,           -- INT_0001
      kind         TEXT,                       -- greeting|restaurant|story|street-q|broll|flowers|other
      clip_ids     TEXT,                       -- JSON array, in order
      start_ms     INTEGER,
      duration_s   REAL,
      summary      TEXT,
      person       TEXT,                       -- best guess (Muslim/Jewish/Nigerian/…)
      location     TEXT,
      score        REAL
    );
    CREATE TABLE IF NOT EXISTS moments (
      id             TEXT PRIMARY KEY,         -- MOMENT_0001
      interaction_id TEXT REFERENCES interactions(id) ON DELETE SET NULL,
      clip_id        TEXT NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
      in_s           REAL, out_s REAL,
      speech         TEXT,
      action         TEXT,                     -- giving flowers|handshake|hug|showing food|walking|…
      reaction       TEXT,                     -- smile|laugh|surprised|thank you|none
      person         TEXT,
      tags           TEXT,                     -- JSON array
      visual_quality TEXT,                     -- good|ok|poor
      audio_quality  TEXT,
      energy         TEXT,                     -- high|medium|low
      clean_start    INTEGER, clean_end INTEGER,
      score          REAL
    );
    CREATE TABLE IF NOT EXISTS edits (
      name        TEXT PRIMARY KEY,
      spec_json   TEXT,
      created_at  INTEGER
    );
    CREATE TABLE IF NOT EXISTS edit_moments (
      edit_name  TEXT REFERENCES edits(name) ON DELETE CASCADE,
      moment_id  TEXT,
      ord        INTEGER
    );
    CREATE INDEX IF NOT EXISTS ix_clip_order ON clips(order_index);
    CREATE INDEX IF NOT EXISTS ix_moment_inter ON moments(interaction_id);
  `);
  // node:sqlite has no .transaction() (that's better-sqlite3) — provide one.
  db.transaction = (fn) => (...a) => {
    db.exec("BEGIN");
    try {
      const r = fn(...a);
      db.exec("COMMIT");
      return r;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
  return db;
};

// ---- Float32 <-> BLOB helpers ---------------------------------------------
export const f32ToBlob = (arr) => Buffer.from(new Float32Array(arr).buffer);
export const blobToF32 = (buf) =>
  new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);

export const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};
