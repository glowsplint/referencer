package db

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"

	"referencer/backend/internal/models"
)

// DB wraps a sql.DB connection with application-specific methods.
type DB struct {
	conn *sql.DB
}

const schema = `
-- A workspace is the top-level container; its ID comes from the URL path.
CREATE TABLE IF NOT EXISTS workspace (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Layers group annotations (highlights, arrows, underlines) with shared color/visibility.
CREATE TABLE IF NOT EXISTS layer (
    id TEXT PRIMARY KEY,                -- client-generated UUID
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,                -- hex color, e.g. "#ff0000"
    visible INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0 -- controls display order in the layer panel
);

-- A highlighted text range within an editor.
CREATE TABLE IF NOT EXISTS highlight (
    id TEXT PRIMARY KEY,
    layer_id TEXT NOT NULL REFERENCES layer(id) ON DELETE CASCADE,
    editor_index INTEGER NOT NULL,      -- which editor pane (0-based)
    "from" INTEGER NOT NULL,            -- ProseMirror document position (start)
    "to" INTEGER NOT NULL,              -- ProseMirror document position (end)
    text TEXT NOT NULL DEFAULT '',       -- snapshotted selected text
    annotation TEXT NOT NULL DEFAULT '', -- user-written note
    type TEXT NOT NULL DEFAULT 'highlight' -- reserved for future annotation subtypes
);

-- An arrow connecting two text ranges, possibly across different editors.
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
    arrow_style TEXT NOT NULL DEFAULT 'solid' -- visual style: 'solid', 'dashed', etc.
);

-- An underlined text range within an editor (similar to highlight but rendered differently).
CREATE TABLE IF NOT EXISTS underline (
    id TEXT PRIMARY KEY,
    layer_id TEXT NOT NULL REFERENCES layer(id) ON DELETE CASCADE,
    editor_index INTEGER NOT NULL,
    "from" INTEGER NOT NULL,
    "to" INTEGER NOT NULL,
    text TEXT NOT NULL DEFAULT ''
);

-- Editor panes containing rich text. Uses AUTOINCREMENT (unlike other tables with
-- client-generated TEXT UUIDs) because editors are server-managed and need stable
-- sequential IDs for re-indexing on delete.
CREATE TABLE IF NOT EXISTS editor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    index_pos INTEGER NOT NULL,         -- display order, re-indexed on editor removal
    name TEXT NOT NULL DEFAULT 'Passage',
    visible INTEGER NOT NULL DEFAULT 1,
    content_json TEXT                   -- ProseMirror JSON document, NULL until first edit
);

-- Share links for read-only or edit access to a workspace.
CREATE TABLE IF NOT EXISTS share_link (
    code TEXT PRIMARY KEY,              -- short alphanumeric code (see generateCode)
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    access TEXT NOT NULL CHECK (access IN ('edit', 'readonly')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`

// NewDB opens the SQLite database, enables WAL and foreign keys, and creates tables.
func NewDB(path string) (*DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}

	conn, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	// Enable WAL and foreign keys.
	if _, err := conn.Exec("PRAGMA journal_mode=WAL"); err != nil {
		conn.Close()
		return nil, fmt.Errorf("set WAL mode: %w", err)
	}
	if _, err := conn.Exec("PRAGMA foreign_keys=ON"); err != nil {
		conn.Close()
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}

	// Create tables.
	if _, err := conn.Exec(schema); err != nil {
		conn.Close()
		return nil, fmt.Errorf("create schema: %w", err)
	}

	return &DB{conn: conn}, nil
}

// Close closes the database connection.
func (d *DB) Close() error {
	return d.conn.Close()
}

// EnsureWorkspace creates a workspace if it doesn't exist, with a default editor.
func (d *DB) EnsureWorkspace(workspaceID string) error {
	var id string
	err := d.conn.QueryRow("SELECT id FROM workspace WHERE id = ?", workspaceID).Scan(&id)
	if err == sql.ErrNoRows {
		tx, err := d.conn.Begin()
		if err != nil {
			return err
		}
		defer tx.Rollback()

		if _, err := tx.Exec("INSERT INTO workspace (id) VALUES (?)", workspaceID); err != nil {
			return err
		}
		if _, err := tx.Exec(
			"INSERT INTO editor (workspace_id, index_pos, name, visible) VALUES (?, 0, 'Passage 1', 1)",
			workspaceID,
		); err != nil {
			return err
		}
		return tx.Commit()
	}
	return err
}

// GetWorkspaceState loads the full workspace state for sending to clients.
func (d *DB) GetWorkspaceState(workspaceID string) (*models.WorkspaceState, error) {
	// Load layers ordered by position.
	layerRows, err := d.conn.Query(
		"SELECT id, name, color, visible FROM layer WHERE workspace_id = ? ORDER BY position",
		workspaceID,
	)
	if err != nil {
		return nil, fmt.Errorf("query layers: %w", err)
	}
	defer layerRows.Close()

	type layerInfo struct {
		id      string
		name    string
		color   string
		visible bool
	}
	var layers []layerInfo
	var layerIDs []string
	for layerRows.Next() {
		var li layerInfo
		var vis int
		if err := layerRows.Scan(&li.id, &li.name, &li.color, &vis); err != nil {
			return nil, err
		}
		li.visible = vis != 0
		layers = append(layers, li)
		layerIDs = append(layerIDs, li.id)
	}
	if err := layerRows.Err(); err != nil {
		return nil, err
	}

	// Build highlights, arrows, and underlines indexed by layer.
	highlightsByLayer := make(map[string][]models.Highlight)
	arrowsByLayer := make(map[string][]models.Arrow)
	underlinesByLayer := make(map[string][]models.Underline)

	if len(layerIDs) > 0 {
		// Highlights
		hRows, err := d.conn.Query(
			`SELECT h.id, h.layer_id, h.editor_index, h."from", h."to", h.text, h.annotation, h.type
			 FROM highlight h
			 JOIN layer l ON h.layer_id = l.id
			 WHERE l.workspace_id = ?`,
			workspaceID,
		)
		if err != nil {
			return nil, fmt.Errorf("query highlights: %w", err)
		}
		defer hRows.Close()
		for hRows.Next() {
			var h models.Highlight
			var layerID string
			if err := hRows.Scan(&h.ID, &layerID, &h.EditorIndex, &h.From, &h.To, &h.Text, &h.Annotation, &h.Type); err != nil {
				return nil, err
			}
			highlightsByLayer[layerID] = append(highlightsByLayer[layerID], h)
		}
		if err := hRows.Err(); err != nil {
			return nil, err
		}

		// Arrows
		aRows, err := d.conn.Query(
			`SELECT a.id, a.layer_id,
			        a.from_editor_index, a.from_start, a.from_end, a.from_text,
			        a.to_editor_index, a.to_start, a.to_end, a.to_text,
			        a.arrow_style
			 FROM arrow a
			 JOIN layer l ON a.layer_id = l.id
			 WHERE l.workspace_id = ?`,
			workspaceID,
		)
		if err != nil {
			return nil, fmt.Errorf("query arrows: %w", err)
		}
		defer aRows.Close()
		for aRows.Next() {
			var a models.Arrow
			var layerID string
			if err := aRows.Scan(
				&a.ID, &layerID,
				&a.From.EditorIndex, &a.From.From, &a.From.To, &a.From.Text,
				&a.To.EditorIndex, &a.To.From, &a.To.To, &a.To.Text,
				&a.ArrowStyle,
			); err != nil {
				return nil, err
			}
			arrowsByLayer[layerID] = append(arrowsByLayer[layerID], a)
		}
		if err := aRows.Err(); err != nil {
			return nil, err
		}

		// Underlines
		uRows, err := d.conn.Query(
			`SELECT u.id, u.layer_id, u.editor_index, u."from", u."to", u.text
			 FROM underline u
			 JOIN layer l ON u.layer_id = l.id
			 WHERE l.workspace_id = ?`,
			workspaceID,
		)
		if err != nil {
			return nil, fmt.Errorf("query underlines: %w", err)
		}
		defer uRows.Close()
		for uRows.Next() {
			var u models.Underline
			var layerID string
			if err := uRows.Scan(&u.ID, &layerID, &u.EditorIndex, &u.From, &u.To, &u.Text); err != nil {
				return nil, err
			}
			underlinesByLayer[layerID] = append(underlinesByLayer[layerID], u)
		}
		if err := uRows.Err(); err != nil {
			return nil, err
		}
	}

	// Assemble layers.
	modelLayers := make([]models.Layer, len(layers))
	for i, li := range layers {
		hl := highlightsByLayer[li.id]
		if hl == nil {
			hl = []models.Highlight{}
		}
		ar := arrowsByLayer[li.id]
		if ar == nil {
			ar = []models.Arrow{}
		}
		ul := underlinesByLayer[li.id]
		if ul == nil {
			ul = []models.Underline{}
		}
		modelLayers[i] = models.Layer{
			ID:         li.id,
			Name:       li.name,
			Color:      li.color,
			Visible:    li.visible,
			Highlights: hl,
			Arrows:     ar,
			Underlines: ul,
		}
	}

	// Load editors.
	eRows, err := d.conn.Query(
		"SELECT index_pos, name, visible, content_json FROM editor WHERE workspace_id = ? ORDER BY index_pos",
		workspaceID,
	)
	if err != nil {
		return nil, fmt.Errorf("query editors: %w", err)
	}
	defer eRows.Close()

	var editors []models.Editor
	for eRows.Next() {
		var e models.Editor
		var vis int
		var contentJSON sql.NullString
		if err := eRows.Scan(&e.Index, &e.Name, &vis, &contentJSON); err != nil {
			return nil, err
		}
		e.Visible = vis != 0
		if contentJSON.Valid {
			var parsed interface{}
			if err := json.Unmarshal([]byte(contentJSON.String), &parsed); err == nil {
				e.ContentJSON = parsed
			}
		}
		editors = append(editors, e)
	}
	if err := eRows.Err(); err != nil {
		return nil, err
	}
	if editors == nil {
		editors = []models.Editor{}
	}

	return &models.WorkspaceState{
		WorkspaceID: workspaceID,
		Layers:      modelLayers,
		Editors:     editors,
	}, nil
}

// --- Layer operations ---

func (d *DB) AddLayer(workspaceID, layerID, name, color string) error {
	var position int
	err := d.conn.QueryRow(
		"SELECT COALESCE(MAX(position), -1) + 1 FROM layer WHERE workspace_id = ?",
		workspaceID,
	).Scan(&position)
	if err != nil {
		return err
	}
	_, err = d.conn.Exec(
		"INSERT INTO layer (id, workspace_id, name, color, visible, position) VALUES (?, ?, ?, ?, 1, ?)",
		layerID, workspaceID, name, color, position,
	)
	return err
}

func (d *DB) RemoveLayer(workspaceID, layerID string) error {
	_, err := d.conn.Exec(
		"DELETE FROM layer WHERE id = ? AND workspace_id = ?",
		layerID, workspaceID,
	)
	return err
}

func (d *DB) UpdateLayerName(workspaceID, layerID, name string) error {
	_, err := d.conn.Exec(
		"UPDATE layer SET name = ? WHERE id = ? AND workspace_id = ?",
		name, layerID, workspaceID,
	)
	return err
}

func (d *DB) UpdateLayerColor(workspaceID, layerID, color string) error {
	_, err := d.conn.Exec(
		"UPDATE layer SET color = ? WHERE id = ? AND workspace_id = ?",
		color, layerID, workspaceID,
	)
	return err
}

func (d *DB) ToggleLayerVisibility(workspaceID, layerID string) error {
	_, err := d.conn.Exec(
		"UPDATE layer SET visible = NOT visible WHERE id = ? AND workspace_id = ?",
		layerID, workspaceID,
	)
	return err
}

func (d *DB) ReorderLayers(workspaceID string, layerIDs []string) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for position, layerID := range layerIDs {
		if _, err := tx.Exec(
			"UPDATE layer SET position = ? WHERE id = ? AND workspace_id = ?",
			position, layerID, workspaceID,
		); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// --- Highlight operations ---

func (d *DB) AddHighlight(layerID, highlightID string, editorIndex, from, to int, text, annotation string) error {
	_, err := d.conn.Exec(
		`INSERT INTO highlight (id, layer_id, editor_index, "from", "to", text, annotation) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		highlightID, layerID, editorIndex, from, to, text, annotation,
	)
	return err
}

func (d *DB) RemoveHighlight(layerID, highlightID string) error {
	_, err := d.conn.Exec(
		"DELETE FROM highlight WHERE id = ? AND layer_id = ?",
		highlightID, layerID,
	)
	return err
}

func (d *DB) UpdateHighlightAnnotation(layerID, highlightID, annotation string) error {
	_, err := d.conn.Exec(
		"UPDATE highlight SET annotation = ? WHERE id = ? AND layer_id = ?",
		annotation, highlightID, layerID,
	)
	return err
}

// --- Arrow operations ---

func (d *DB) AddArrow(layerID, arrowID string,
	fromEditorIndex, fromStart, fromEnd int, fromText string,
	toEditorIndex, toStart, toEnd int, toText string) error {
	_, err := d.conn.Exec(
		`INSERT INTO arrow (id, layer_id, from_editor_index, from_start, from_end, from_text,
		                     to_editor_index, to_start, to_end, to_text)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		arrowID, layerID, fromEditorIndex, fromStart, fromEnd, fromText,
		toEditorIndex, toStart, toEnd, toText,
	)
	return err
}

func (d *DB) RemoveArrow(layerID, arrowID string) error {
	_, err := d.conn.Exec(
		"DELETE FROM arrow WHERE id = ? AND layer_id = ?",
		arrowID, layerID,
	)
	return err
}

func (d *DB) UpdateArrowStyle(layerID, arrowID, arrowStyle string) error {
	_, err := d.conn.Exec(
		"UPDATE arrow SET arrow_style = ? WHERE id = ? AND layer_id = ?",
		arrowStyle, arrowID, layerID,
	)
	return err
}

// --- Underline operations ---

func (d *DB) AddUnderline(layerID, underlineID string, editorIndex, from, to int, text string) error {
	_, err := d.conn.Exec(
		`INSERT INTO underline (id, layer_id, editor_index, "from", "to", text) VALUES (?, ?, ?, ?, ?, ?)`,
		underlineID, layerID, editorIndex, from, to, text,
	)
	return err
}

func (d *DB) RemoveUnderline(layerID, underlineID string) error {
	_, err := d.conn.Exec(
		"DELETE FROM underline WHERE id = ? AND layer_id = ?",
		underlineID, layerID,
	)
	return err
}

// --- Editor operations ---

func (d *DB) AddEditor(workspaceID string, index int, name string) error {
	_, err := d.conn.Exec(
		"INSERT INTO editor (workspace_id, index_pos, name, visible) VALUES (?, ?, ?, 1)",
		workspaceID, index, name,
	)
	return err
}

func (d *DB) RemoveEditor(workspaceID string, index int) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(
		"DELETE FROM editor WHERE workspace_id = ? AND index_pos = ?",
		workspaceID, index,
	); err != nil {
		return err
	}

	// Re-index remaining editors.
	rows, err := tx.Query(
		"SELECT id FROM editor WHERE workspace_id = ? ORDER BY index_pos",
		workspaceID,
	)
	if err != nil {
		return err
	}
	var editorIDs []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		editorIDs = append(editorIDs, id)
	}
	rows.Close()

	for newIndex, id := range editorIDs {
		if _, err := tx.Exec("UPDATE editor SET index_pos = ? WHERE id = ?", newIndex, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (d *DB) UpdateSectionName(workspaceID string, index int, name string) error {
	_, err := d.conn.Exec(
		"UPDATE editor SET name = ? WHERE workspace_id = ? AND index_pos = ?",
		name, workspaceID, index,
	)
	return err
}

func (d *DB) ToggleSectionVisibility(workspaceID string, index int) error {
	_, err := d.conn.Exec(
		"UPDATE editor SET visible = NOT visible WHERE workspace_id = ? AND index_pos = ?",
		workspaceID, index,
	)
	return err
}

func (d *DB) ReorderEditors(workspaceID string, editorIndices []int) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Fetch all editors for this workspace ordered by current index.
	rows, err := tx.Query(
		"SELECT id, index_pos FROM editor WHERE workspace_id = ? ORDER BY index_pos",
		workspaceID,
	)
	if err != nil {
		return err
	}
	editorByIndex := make(map[int]int) // index_pos -> row id
	for rows.Next() {
		var id, indexPos int
		if err := rows.Scan(&id, &indexPos); err != nil {
			rows.Close()
			return err
		}
		editorByIndex[indexPos] = id
	}
	rows.Close()

	for newPos, oldIndex := range editorIndices {
		id, ok := editorByIndex[oldIndex]
		if !ok {
			continue
		}
		if _, err := tx.Exec("UPDATE editor SET index_pos = ? WHERE id = ?", newPos, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (d *DB) UpdateEditorContent(workspaceID string, editorIndex int, contentJSON interface{}) error {
	jsonBytes, err := json.Marshal(contentJSON)
	if err != nil {
		return fmt.Errorf("marshal content json: %w", err)
	}
	_, err = d.conn.Exec(
		"UPDATE editor SET content_json = ? WHERE workspace_id = ? AND index_pos = ?",
		string(jsonBytes), workspaceID, editorIndex,
	)
	return err
}

// --- Share operations ---

func (d *DB) CreateShareLink(workspaceID, access string) (string, error) {
	const maxRetries = 5
	// 62^6 ≈ 56 billion possible codes; 5 retries makes collision virtually impossible.
	for i := 0; i < maxRetries; i++ {
		code := generateCode(6)
		_, err := d.conn.Exec(
			"INSERT INTO share_link (code, workspace_id, access) VALUES (?, ?, ?)",
			code, workspaceID, access,
		)
		if err == nil {
			return code, nil
		}
		// On unique constraint violation, retry.
	}
	return "", fmt.Errorf("failed to generate unique share code after %d retries", maxRetries)
}

func (d *DB) ResolveShareLink(code string) (workspaceID, access string, err error) {
	err = d.conn.QueryRow(
		"SELECT workspace_id, access FROM share_link WHERE code = ?", code,
	).Scan(&workspaceID, &access)
	if err == sql.ErrNoRows {
		return "", "", nil
	}
	return
}
