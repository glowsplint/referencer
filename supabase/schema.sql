-- Referencer: Supabase PostgreSQL schema
-- Run this in the Supabase SQL editor to set up the database.
-- Ported from the SQLite schema in backend/src/db/database.ts

CREATE TABLE workspace (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE share_link (
    code TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    access TEXT NOT NULL CHECK (access IN ('edit', 'readonly')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "user" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_user_email ON "user"(email);

CREATE TABLE user_provider (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

CREATE TABLE session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_session_expires_at ON session(expires_at);

-- Yjs document persistence (replaces LevelDB).
-- State is stored as base64-encoded text for simpler handling via Supabase JS client.
CREATE TABLE yjs_document (
    room_name TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RPC function for atomic user + provider creation.
-- Supabase JS doesn't support client-side transactions, so we use a stored procedure.
CREATE OR REPLACE FUNCTION create_user_with_provider(
    p_user_id TEXT,
    p_email TEXT,
    p_name TEXT,
    p_avatar_url TEXT,
    p_provider_id TEXT,
    p_provider TEXT,
    p_provider_user_id TEXT
) RETURNS TEXT AS $$
BEGIN
    INSERT INTO "user" (id, email, name, avatar_url)
    VALUES (p_user_id, p_email, p_name, p_avatar_url);
    INSERT INTO user_provider (id, user_id, provider, provider_user_id)
    VALUES (p_provider_id, p_user_id, p_provider, p_provider_user_id);
    RETURN p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE workspace_folder (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES workspace_folder(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'New Folder',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workspace_folder_user_id ON workspace_folder(user_id);
CREATE INDEX idx_workspace_folder_parent_id ON workspace_folder(parent_id);

CREATE TABLE user_workspace (
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    folder_id TEXT REFERENCES workspace_folder(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, workspace_id)
);
CREATE INDEX idx_user_workspace_user_id ON user_workspace(user_id);
CREATE INDEX idx_user_workspace_updated_at ON user_workspace(updated_at DESC);
CREATE INDEX idx_user_workspace_favorite ON user_workspace(user_id, is_favorite DESC, updated_at DESC);
CREATE INDEX idx_user_workspace_folder_id ON user_workspace(folder_id);

CREATE TABLE user_preference (
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, key)
);
