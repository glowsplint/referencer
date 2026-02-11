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
    annotation TEXT NOT NULL DEFAULT ''
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
    to_text TEXT NOT NULL DEFAULT ''
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

CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
);

INSERT INTO schema_version (version) VALUES (1);
