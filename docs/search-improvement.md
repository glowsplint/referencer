# Full-Text Annotation Search

## Context

Users can't find their own annotations. Once a user has 50+ highlights and comments across multiple workspaces, there's no way to search for them — the hub only filters by workspace title. This is the #1 gap identified in the [UX brainstorm](ux-brainstorm.md). We need both:

1. **In-workspace search** (client-side) — filter annotations within the currently open workspace
2. **Cross-workspace search** (server-side) — search annotations across ALL workspaces from the hub

The challenge: all annotation data lives in opaque Yjs binary blobs (`yjs_document.state` in Supabase). There's zero server-side text indexing today.

## Architecture Decision

**Hybrid approach**: client-side in-memory filtering for the current workspace, plus a server-side Postgres full-text search index for cross-workspace queries.

- The collab server already has the full `Y.Doc` in memory — extract annotation text during `saveToSupabase()` and upsert into a new `annotation_index` table
- Use Postgres `tsvector`/`tsquery` with weighted fields (comment text ranked highest, then selected text, then reply text)
- ILIKE fallback when FTS returns zero results (catches partial words)
- Full replacement per workspace on each save (simple, self-healing, no diffing)

## Implementation Plan

### Phase 1: Database Schema

**File: `supabase/schema.sql`** — append new table + RPC functions

Add `annotation_index` table:

```sql
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
ALTER TABLE annotation_index ENABLE ROW LEVEL SECURITY;
```

Add `upsert_annotation_index` RPC — atomic delete+insert in a single transaction:

```sql
CREATE OR REPLACE FUNCTION upsert_annotation_index(
    p_workspace_id TEXT,
    p_rows JSONB
) RETURNS VOID AS $$
BEGIN
    DELETE FROM annotation_index WHERE workspace_id = p_workspace_id;
    INSERT INTO annotation_index (id, workspace_id, layer_id, layer_name, annotation_type,
                                   selected_text, annotation_text, reply_texts, user_name, updated_at)
    SELECT
        r->>'id',
        p_workspace_id,
        r->>'layer_id',
        r->>'layer_name',
        r->>'annotation_type',
        r->>'selected_text',
        r->>'annotation_text',
        r->>'reply_texts',
        r->>'user_name',
        NOW()
    FROM jsonb_array_elements(p_rows) AS r;
END;
$$ LANGUAGE plpgsql;
```

Add `search_annotations` RPC — FTS with `websearch_to_tsquery`, ILIKE fallback, joined with `user_workspace` for access control:

```sql
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
BEGIN
    v_tsquery := websearch_to_tsquery('english', p_query);

    SELECT COUNT(*) INTO v_total
    FROM annotation_index ai
    JOIN user_workspace uw ON uw.workspace_id = ai.workspace_id AND uw.user_id = p_user_id
    WHERE ai.search_vector @@ v_tsquery;

    IF v_total = 0 THEN
        -- Fallback to ILIKE for partial word matches
        SELECT COUNT(*) INTO v_total
        FROM annotation_index ai
        JOIN user_workspace uw ON uw.workspace_id = ai.workspace_id AND uw.user_id = p_user_id
        WHERE ai.selected_text ILIKE '%' || p_query || '%'
           OR ai.annotation_text ILIKE '%' || p_query || '%'
           OR ai.reply_texts ILIKE '%' || p_query || '%';

        SELECT jsonb_agg(row_to_json(t)) INTO v_results FROM (
            SELECT ai.id as annotation_id, ai.workspace_id, uw.title as workspace_title,
                   ai.layer_name, ai.annotation_type, ai.selected_text, ai.annotation_text,
                   ai.user_name, 0::float as rank
            FROM annotation_index ai
            JOIN user_workspace uw ON uw.workspace_id = ai.workspace_id AND uw.user_id = p_user_id
            WHERE ai.selected_text ILIKE '%' || p_query || '%'
               OR ai.annotation_text ILIKE '%' || p_query || '%'
               OR ai.reply_texts ILIKE '%' || p_query || '%'
            ORDER BY ai.updated_at DESC
            LIMIT p_limit OFFSET p_offset
        ) t;
    ELSE
        SELECT jsonb_agg(row_to_json(t)) INTO v_results FROM (
            SELECT ai.id as annotation_id, ai.workspace_id, uw.title as workspace_title,
                   ai.layer_name, ai.annotation_type, ai.selected_text, ai.annotation_text,
                   ai.user_name, ts_rank(ai.search_vector, v_tsquery) as rank
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
```

### Phase 2: Annotation Extraction (Collab Server)

**New file: `collab-server/src/extract-annotations.ts`**

Pure function: takes a `Y.Doc`, reads `doc.getArray("layers")`, iterates all highlights/arrows/underlines, returns flat `AnnotationIndexRow[]`. Extracts:

- Highlights: `text`, `annotation`, `replies[].text`, `userName`, `type`
- Arrows: `fromText` + `toText` concatenated into `selected_text`
- Underlines: `text`

**Modified file: `collab-server/src/persistence.ts`**

Add `updateAnnotationIndex(url, key, roomName, rows)` — calls `upsert_annotation_index` RPC.

**Modified file: `collab-server/src/durable-object.ts`**

In `saveToSupabase()` (line 488), after the existing `saveSnapshot()` call, add annotation extraction + index update. Non-fatal — if indexing fails, the save still succeeds. Logs the error and continues.

### Phase 3: Backend Search API

**New file: `backend/src/api/search.ts`**

`GET /api/search?q=<query>&limit=20&offset=0`

- Requires auth (`user` must be set)
- Min query length 2, max 200
- Calls `search_annotations` RPC with user ID for access scoping
- Returns `{ results: SearchResult[], total: number }`

**Modified file: `backend/src/index.ts`**

Mount: `app.route("/api/search", search)` alongside existing routes (around line 124).

### Phase 4: In-Workspace Search (Frontend — Client-Side)

**New file: `frontend/src/hooks/ui/use-annotation-search.ts`**

Hook takes `layers: Layer[]` and `query: string`. Returns `AnnotationSearchMatch[]` with `layerId`, `layerColor`, `annotationType`, `annotationId`, `displayText`, `editorIndex`. Uses `useMemo` with case-insensitive `String.includes()` on all text fields. Min query length 2.

**New file: `frontend/src/components/AnnotationSearchResults.tsx`**

Renders search matches grouped by layer — each row shows layer color swatch, annotation type icon, truncated text with query highlighted. Click scrolls the annotation into view.

**Modified file: `frontend/src/components/ManagementPane.tsx`**

Add search input (with `Search` icon from lucide) at the top of the management pane, above the layers heading. When query is non-empty, replace the layer list + section list with `AnnotationSearchResults`. Local state in ManagementPane.

**Keyboard shortcut: Ctrl+F** — override browser default to focus the management pane search input. Add a `useEffect` with a `keydown` listener that calls `e.preventDefault()` on Ctrl+F and focuses the search input ref. Only active when the management pane is visible (not on mobile, not when pane is collapsed).

### Phase 5: Cross-Workspace Search (Frontend — Server-Side)

**New file: `frontend/src/lib/search-client.ts`**

API client: `searchAnnotations(query, limit, offset)` → calls `GET /api/search`. Follows pattern of `workspace-client.ts`.

**New file: `frontend/src/hooks/data/use-annotation-search-api.ts`**

Hook debounces query (300ms), calls API, manages loading/error/results state.

**New file: `frontend/src/components/hub/HubSearchResults.tsx`**

Renders server-side results below the workspace grid search bar. Each result shows workspace title (as link), layer name with color dot, annotation type icon, text preview with query bolded. Click navigates to `#/<workspaceId>`.

**Modified file: `frontend/src/components/hub/WorkspaceGrid.tsx`**

When `searchQuery` is non-empty, render `HubSearchResults` section between the search bar and workspace grid. Existing workspace title filtering continues working alongside. Only shown for authenticated users — hide the annotation search section entirely for guests (their data is local-only in IndexedDB and never reaches Supabase).

### Phase 6: Backfill Script

**New file: `collab-server/scripts/backfill-annotation-index.ts`**

Standalone script: reads all `yjs_document` rows, decodes base64 → `Y.Doc`, extracts annotations, upserts to index. Run once with `cd collab-server && bun run scripts/backfill-annotation-index.ts`.

### Phase 7: Tests

| Test                                | File                                                       | What                                         |
| ----------------------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| `extractAnnotations` unit           | `collab-server/src/extract-annotations.test.ts`            | Build a Y.Doc with layers, verify extraction |
| `useAnnotationSearch` unit          | `frontend/src/hooks/ui/use-annotation-search.test.ts`      | Mock layers, verify filtering logic          |
| `AnnotationSearchResults` component | `frontend/src/components/AnnotationSearchResults.test.tsx` | Render with mock matches, verify display     |
| `HubSearchResults` component        | `frontend/src/components/hub/HubSearchResults.test.tsx`    | Render with mock API results                 |
| `ManagementPane` search integration | Update existing `ManagementPane.test.tsx`                  | Verify search input appears and filters      |

## Dependency Order

```
Phase 1 (Schema) → Phase 2 (Extraction) → Phase 3 (API) → Phase 5 (Hub UI)
                                         → Phase 6 (Backfill)
Phase 4 (In-workspace search) — independent, can run in parallel with all others
Phase 7 (Tests) — alongside each phase
```

Phase 4 (client-side) has zero backend dependencies and could ship as a standalone PR immediately.

## Key Files Summary

| File                                                   | Action                                |
| ------------------------------------------------------ | ------------------------------------- |
| `supabase/schema.sql`                                  | Append table + RPCs                   |
| `collab-server/src/extract-annotations.ts`             | New                                   |
| `collab-server/src/persistence.ts`                     | Add `updateAnnotationIndex()`         |
| `collab-server/src/durable-object.ts`                  | Call extraction in `saveToSupabase()` |
| `backend/src/api/search.ts`                            | New                                   |
| `backend/src/index.ts`                                 | Mount search route                    |
| `frontend/src/hooks/ui/use-annotation-search.ts`       | New                                   |
| `frontend/src/components/AnnotationSearchResults.tsx`  | New                                   |
| `frontend/src/components/ManagementPane.tsx`           | Add search input + Ctrl+F shortcut    |
| `frontend/src/lib/search-client.ts`                    | New                                   |
| `frontend/src/hooks/data/use-annotation-search-api.ts` | New                                   |
| `frontend/src/components/hub/HubSearchResults.tsx`     | New                                   |
| `frontend/src/components/hub/WorkspaceGrid.tsx`        | Add annotation results section        |
| `collab-server/scripts/backfill-annotation-index.ts`   | New                                   |

## Verification

Per-phase verification before moving to the next phase:

1. **Build**: `cd frontend && bun run build` — zero errors
2. **Unit tests**: `cd frontend && bun run test:run` — all pass
3. **Lint**: `cd frontend && bun run lint` — no errors
4. **Manual test (in-workspace)**: Open a workspace with annotations, type in management pane search, verify filtering works and clicking results scrolls to annotation
5. **Manual test (hub)**: From hub, search for annotation text, verify results appear with correct workspace links
6. **Backfill**: Run backfill script, verify `annotation_index` table has rows matching existing workspaces
