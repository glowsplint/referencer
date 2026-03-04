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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL
);
CREATE INDEX idx_share_link_workspace_id ON share_link(workspace_id);

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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_workspace_folder_user_id ON workspace_folder(user_id);
CREATE INDEX idx_workspace_folder_parent_id ON workspace_folder(parent_id);
CREATE INDEX idx_workspace_folder_favorite ON workspace_folder(user_id, is_favorite DESC, name);

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

CREATE TABLE workspace_permission (
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX idx_workspace_permission_user ON workspace_permission(user_id);

CREATE TABLE user_preference (
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, key)
);

-- Full-text search index for annotations.
-- Annotation data lives in opaque Yjs blobs — this table mirrors text fields
-- for server-side search across workspaces.
CREATE TABLE annotation_index (
    id TEXT NOT NULL,
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    layer_id TEXT NOT NULL,
    layer_name TEXT NOT NULL DEFAULT '',
    annotation_type TEXT NOT NULL CHECK (annotation_type IN ('highlight', 'comment', 'arrow', 'underline')),
    selected_text TEXT NOT NULL DEFAULT '',
    annotation_text TEXT NOT NULL DEFAULT '',
    reply_texts TEXT NOT NULL DEFAULT '',
    user_name TEXT NOT NULL DEFAULT '',
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(annotation_text, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(selected_text, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(reply_texts, '')), 'C')
    ) STORED,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, id)
);
CREATE INDEX idx_annotation_search ON annotation_index USING GIN (search_vector);

-- Atomic upsert: delete all annotations for a workspace then insert fresh rows.
-- Called by the collab server on each Yjs document save.
CREATE OR REPLACE FUNCTION upsert_annotation_index(
    p_workspace_id TEXT,
    p_rows JSONB
) RETURNS VOID AS $$
BEGIN
    IF p_rows IS NULL THEN
        RAISE EXCEPTION 'p_rows must not be NULL';
    END IF;

    -- Serialize concurrent upserts for the same workspace
    PERFORM pg_advisory_xact_lock(hashtext(p_workspace_id));

    DELETE FROM annotation_index WHERE workspace_id = p_workspace_id;
    INSERT INTO annotation_index (id, workspace_id, layer_id, layer_name, annotation_type,
                                   selected_text, annotation_text, reply_texts, user_name, updated_at)
    SELECT
        r->>'id',
        p_workspace_id,
        r->>'layer_id',
        COALESCE(r->>'layer_name', ''),
        r->>'annotation_type',
        COALESCE(r->>'selected_text', ''),
        COALESCE(r->>'annotation_text', ''),
        COALESCE(r->>'reply_texts', ''),
        COALESCE(r->>'user_name', ''),
        NOW()
    FROM jsonb_array_elements(p_rows) AS r;
END;
$$ LANGUAGE plpgsql;

-- Cross-workspace annotation search with access control.
-- Uses FTS (websearch_to_tsquery) with ILIKE fallback for partial matches.
-- Only returns annotations in workspaces the user has access to via user_workspace.
CREATE OR REPLACE FUNCTION search_annotations(
    p_user_id TEXT,
    p_query TEXT,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
    v_results JSONB;
    v_total BIGINT;
    v_tsquery tsquery;
    v_escaped_query TEXT;
BEGIN
    -- Guard against empty/null queries
    IF p_query IS NULL OR trim(p_query) = '' THEN
        RETURN jsonb_build_object('results', '[]'::jsonb, 'total', 0);
    END IF;

    -- Clamp pagination bounds
    p_limit := LEAST(GREATEST(p_limit, 1), 100);
    p_offset := GREATEST(p_offset, 0);

    v_tsquery := websearch_to_tsquery('english', p_query);

    -- Escape ILIKE wildcards for the fallback path
    v_escaped_query := replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_');

    SELECT COUNT(*) INTO v_total
    FROM annotation_index ai
    JOIN user_workspace uw ON uw.workspace_id = ai.workspace_id AND uw.user_id = p_user_id
    WHERE ai.search_vector @@ v_tsquery;

    IF v_total = 0 THEN
        -- Fallback to ILIKE for partial word matches
        SELECT COUNT(*) INTO v_total
        FROM annotation_index ai
        JOIN user_workspace uw ON uw.workspace_id = ai.workspace_id AND uw.user_id = p_user_id
        WHERE ai.selected_text ILIKE '%' || v_escaped_query || '%'
           OR ai.annotation_text ILIKE '%' || v_escaped_query || '%'
           OR ai.reply_texts ILIKE '%' || v_escaped_query || '%';

        SELECT jsonb_agg(row_to_json(t)) INTO v_results FROM (
            SELECT ai.id as annotation_id, ai.workspace_id, uw.title as workspace_title,
                   ai.layer_id, ai.layer_name, ai.annotation_type, ai.selected_text,
                   ai.annotation_text, ai.reply_texts, ai.user_name, 0::float as rank
            FROM annotation_index ai
            JOIN user_workspace uw ON uw.workspace_id = ai.workspace_id AND uw.user_id = p_user_id
            WHERE ai.selected_text ILIKE '%' || v_escaped_query || '%'
               OR ai.annotation_text ILIKE '%' || v_escaped_query || '%'
               OR ai.reply_texts ILIKE '%' || v_escaped_query || '%'
            ORDER BY ai.updated_at DESC
            LIMIT p_limit OFFSET p_offset
        ) t;
    ELSE
        SELECT jsonb_agg(row_to_json(t)) INTO v_results FROM (
            SELECT ai.id as annotation_id, ai.workspace_id, uw.title as workspace_title,
                   ai.layer_id, ai.layer_name, ai.annotation_type, ai.selected_text,
                   ai.annotation_text, ai.reply_texts, ai.user_name,
                   ts_rank(ai.search_vector, v_tsquery) as rank
            FROM annotation_index ai
            JOIN user_workspace uw ON uw.workspace_id = ai.workspace_id AND uw.user_id = p_user_id
            WHERE ai.search_vector @@ v_tsquery
            ORDER BY rank DESC
            LIMIT p_limit OFFSET p_offset
        ) t;
    END IF;

    RETURN jsonb_build_object('results', COALESCE(v_results, '[]'::jsonb), 'total', v_total);
END;
$$ LANGUAGE plpgsql;

-- Row-Level Security: defense-in-depth.
-- The app uses the service key (bypasses RLS), but enabling RLS ensures
-- that non-service keys get zero access by default.
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_provider ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_folder ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workspace ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE yjs_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_index ENABLE ROW LEVEL SECURITY;
