import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname } from "path";

const schema = `
CREATE TABLE IF NOT EXISTS workspace (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS layer (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    visible INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS highlight (
    id TEXT PRIMARY KEY,
    layer_id TEXT NOT NULL REFERENCES layer(id) ON DELETE CASCADE,
    editor_index INTEGER NOT NULL,
    "from" INTEGER NOT NULL,
    "to" INTEGER NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    annotation TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'highlight'
);

CREATE TABLE IF NOT EXISTS arrow (
    id TEXT PRIMARY KEY,
    layer_id TEXT NOT NULL REFERENCES layer(id) ON DELETE CASCADE,
    from_editor_index INTEGER NOT NULL,
    from_start INTEGER NOT NULL,
    from_end INTEGER NOT NULL,
    from_text TEXT NOT NULL DEFAULT '',
    to_editor_index INTEGER NOT NULL,
    to_start INTEGER NOT NULL,
    to_end INTEGER NOT NULL,
    to_text TEXT NOT NULL DEFAULT '',
    arrow_style TEXT NOT NULL DEFAULT 'solid'
);

CREATE TABLE IF NOT EXISTS underline (
    id TEXT PRIMARY KEY,
    layer_id TEXT NOT NULL REFERENCES layer(id) ON DELETE CASCADE,
    editor_index INTEGER NOT NULL,
    "from" INTEGER NOT NULL,
    "to" INTEGER NOT NULL,
    text TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS editor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    index_pos INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT 'Passage',
    visible INTEGER NOT NULL DEFAULT 1,
    content_json TEXT
);

CREATE TABLE IF NOT EXISTS share_link (
    code TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    access TEXT NOT NULL CHECK (access IN ('edit', 'readonly')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON user(email);

CREATE TABLE IF NOT EXISTS user_provider (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON session(expires_at);
`;

export function openDatabase(path: string): Database {
  mkdirSync(dirname(path), { recursive: true });

  const db = new Database(path);
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
  db.exec(schema);

  return db;
}
