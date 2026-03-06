-- Migration: Rename workspace → document
-- Transforms existing production database from workspace-based naming to document-based naming.
-- Must be run inside a transaction (BEGIN/COMMIT).

BEGIN;

-- ============================================================================
-- 1. Rename tables
--    Order: parent tables first, then dependents (FK constraints).
-- ============================================================================

-- Parent table (referenced by share_link, user_workspace, workspace_permission, annotation_index)
ALTER TABLE workspace RENAME TO document;

-- Independent table (self-referencing FK only)
ALTER TABLE workspace_folder RENAME TO document_folder;

-- Dependent tables
ALTER TABLE user_workspace RENAME TO user_document;
ALTER TABLE workspace_permission RENAME TO document_permission;

-- ============================================================================
-- 2. Rename columns (workspace_id → document_id)
-- ============================================================================

ALTER TABLE share_link RENAME COLUMN workspace_id TO document_id;
ALTER TABLE user_document RENAME COLUMN workspace_id TO document_id;
ALTER TABLE document_permission RENAME COLUMN workspace_id TO document_id;
ALTER TABLE annotation_index RENAME COLUMN workspace_id TO document_id;

-- ============================================================================
-- 3. Rename indexes
--    PostgreSQL supports ALTER INDEX ... RENAME TO.
-- ============================================================================

-- share_link
ALTER INDEX idx_share_link_workspace_id RENAME TO idx_share_link_document_id;

-- workspace_folder → document_folder
ALTER INDEX idx_workspace_folder_user_id RENAME TO idx_document_folder_user_id;
ALTER INDEX idx_workspace_folder_parent_id RENAME TO idx_document_folder_parent_id;
ALTER INDEX idx_workspace_folder_favorite RENAME TO idx_document_folder_favorite;

-- user_workspace → user_document
ALTER INDEX idx_user_workspace_user_id RENAME TO idx_user_document_user_id;
ALTER INDEX idx_user_workspace_updated_at RENAME TO idx_user_document_updated_at;
ALTER INDEX idx_user_workspace_favorite RENAME TO idx_user_document_favorite;
ALTER INDEX idx_user_workspace_folder_id RENAME TO idx_user_document_folder_id;

-- workspace_permission → document_permission
ALTER INDEX idx_workspace_permission_user RENAME TO idx_document_permission_user;

-- ============================================================================
-- 4. Recreate stored functions with updated references
--    CREATE OR REPLACE updates the function body in place.
-- ============================================================================

-- Atomic upsert: delete all annotations for a document then insert fresh rows.
-- Called by the collab server on each Yjs document save.
CREATE OR REPLACE FUNCTION upsert_annotation_index(
    p_document_id TEXT,
    p_rows JSONB
) RETURNS VOID AS $$
BEGIN
    IF p_rows IS NULL THEN
        RAISE EXCEPTION 'p_rows must not be NULL';
    END IF;

    -- Serialize concurrent upserts for the same document
    PERFORM pg_advisory_xact_lock(hashtext(p_document_id));

    DELETE FROM annotation_index WHERE document_id = p_document_id;
    INSERT INTO annotation_index (id, document_id, layer_id, layer_name, annotation_type,
                                   selected_text, annotation_text, reply_texts, user_name, updated_at)
    SELECT
        r->>'id',
        p_document_id,
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

-- Cross-document annotation search with access control.
-- Uses FTS (websearch_to_tsquery) with ILIKE fallback for partial matches.
-- Only returns annotations in documents the user has access to via user_document.
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
    JOIN user_document uw ON uw.document_id = ai.document_id AND uw.user_id = p_user_id
    WHERE ai.search_vector @@ v_tsquery;

    IF v_total = 0 THEN
        -- Fallback to ILIKE for partial word matches
        SELECT COUNT(*) INTO v_total
        FROM annotation_index ai
        JOIN user_document uw ON uw.document_id = ai.document_id AND uw.user_id = p_user_id
        WHERE ai.selected_text ILIKE '%' || v_escaped_query || '%'
           OR ai.annotation_text ILIKE '%' || v_escaped_query || '%'
           OR ai.reply_texts ILIKE '%' || v_escaped_query || '%';

        SELECT jsonb_agg(row_to_json(t)) INTO v_results FROM (
            SELECT ai.id as annotation_id, ai.document_id, uw.title as document_title,
                   ai.layer_id, ai.layer_name, ai.annotation_type, ai.selected_text,
                   ai.annotation_text, ai.reply_texts, ai.user_name, 0::float as rank
            FROM annotation_index ai
            JOIN user_document uw ON uw.document_id = ai.document_id AND uw.user_id = p_user_id
            WHERE ai.selected_text ILIKE '%' || v_escaped_query || '%'
               OR ai.annotation_text ILIKE '%' || v_escaped_query || '%'
               OR ai.reply_texts ILIKE '%' || v_escaped_query || '%'
            ORDER BY ai.updated_at DESC
            LIMIT p_limit OFFSET p_offset
        ) t;
    ELSE
        SELECT jsonb_agg(row_to_json(t)) INTO v_results FROM (
            SELECT ai.id as annotation_id, ai.document_id, uw.title as document_title,
                   ai.layer_id, ai.layer_name, ai.annotation_type, ai.selected_text,
                   ai.annotation_text, ai.reply_texts, ai.user_name,
                   ts_rank(ai.search_vector, v_tsquery) as rank
            FROM annotation_index ai
            JOIN user_document uw ON uw.document_id = ai.document_id AND uw.user_id = p_user_id
            WHERE ai.search_vector @@ v_tsquery
            ORDER BY rank DESC
            LIMIT p_limit OFFSET p_offset
        ) t;
    END IF;

    RETURN jsonb_build_object('results', COALESCE(v_results, '[]'::jsonb), 'total', v_total);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Notes on RLS
--    ALTER TABLE ... ENABLE ROW LEVEL SECURITY is tied to the table OID,
--    so table renames propagate automatically. No migration needed for RLS.
-- ============================================================================

COMMIT;
