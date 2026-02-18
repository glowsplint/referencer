package db

import (
	"database/sql"
	"encoding/json"
	"testing"
)

func newTestDB(t *testing.T) *DB {
	t.Helper()
	d, err := NewDB(":memory:")
	if err != nil {
		t.Fatalf("NewDB: %v", err)
	}
	t.Cleanup(func() { d.Close() })
	return d
}

func TestNewDB(t *testing.T) {
	d := newTestDB(t)

	// Verify schema tables exist.
	tables := []string{"workspace", "layer", "highlight", "arrow", "underline", "editor", "share_link"}
	for _, table := range tables {
		var name string
		err := d.conn.QueryRow(
			"SELECT name FROM sqlite_master WHERE type='table' AND name=?", table,
		).Scan(&name)
		if err != nil {
			t.Errorf("table %q not found: %v", table, err)
		}
	}

	// Verify foreign keys are enabled.
	var fk int
	if err := d.conn.QueryRow("PRAGMA foreign_keys").Scan(&fk); err != nil {
		t.Fatalf("PRAGMA foreign_keys: %v", err)
	}
	if fk != 1 {
		t.Errorf("foreign_keys = %d, want 1", fk)
	}
}

func TestEnsureWorkspace(t *testing.T) {
	d := newTestDB(t)

	// Create workspace.
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatalf("EnsureWorkspace: %v", err)
	}

	// Verify workspace exists.
	var id string
	if err := d.conn.QueryRow("SELECT id FROM workspace WHERE id = ?", "ws1").Scan(&id); err != nil {
		t.Fatalf("workspace not found: %v", err)
	}
	if id != "ws1" {
		t.Errorf("id = %q, want %q", id, "ws1")
	}

	// Verify default editor was created.
	var editorName string
	var indexPos int
	if err := d.conn.QueryRow(
		"SELECT index_pos, name FROM editor WHERE workspace_id = ?", "ws1",
	).Scan(&indexPos, &editorName); err != nil {
		t.Fatalf("default editor not found: %v", err)
	}
	if indexPos != 0 || editorName != "Passage 1" {
		t.Errorf("default editor = (%d, %q), want (0, %q)", indexPos, editorName, "Passage 1")
	}

	// Idempotent: calling again should not error or create duplicates.
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatalf("EnsureWorkspace (idempotent): %v", err)
	}

	var count int
	if err := d.conn.QueryRow("SELECT COUNT(*) FROM workspace WHERE id = ?", "ws1").Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Errorf("workspace count = %d, want 1", count)
	}
}

func TestGetWorkspaceState(t *testing.T) {
	t.Run("empty workspace", func(t *testing.T) {
		d := newTestDB(t)
		if err := d.EnsureWorkspace("ws1"); err != nil {
			t.Fatal(err)
		}

		state, err := d.GetWorkspaceState("ws1")
		if err != nil {
			t.Fatalf("GetWorkspaceState: %v", err)
		}

		if state.WorkspaceID != "ws1" {
			t.Errorf("WorkspaceID = %q, want %q", state.WorkspaceID, "ws1")
		}
		if len(state.Layers) != 0 {
			t.Errorf("Layers length = %d, want 0", len(state.Layers))
		}
		if len(state.Editors) != 1 {
			t.Errorf("Editors length = %d, want 1", len(state.Editors))
		}
	})

	t.Run("with layers, highlights, arrows, underlines", func(t *testing.T) {
		d := newTestDB(t)
		if err := d.EnsureWorkspace("ws1"); err != nil {
			t.Fatal(err)
		}

		if err := d.AddLayer("ws1", "layer1", "Layer 1", "#ff0000"); err != nil {
			t.Fatal(err)
		}
		if err := d.AddHighlight("layer1", "hl1", 0, 10, 20, "hello", "note"); err != nil {
			t.Fatal(err)
		}
		if err := d.AddArrow("layer1", "arr1", 0, 5, 10, "src", 0, 30, 35, "dst"); err != nil {
			t.Fatal(err)
		}
		if err := d.AddUnderline("layer1", "ul1", 0, 15, 25, "underlined"); err != nil {
			t.Fatal(err)
		}

		state, err := d.GetWorkspaceState("ws1")
		if err != nil {
			t.Fatalf("GetWorkspaceState: %v", err)
		}

		if len(state.Layers) != 1 {
			t.Fatalf("Layers length = %d, want 1", len(state.Layers))
		}

		layer := state.Layers[0]
		if layer.ID != "layer1" || layer.Name != "Layer 1" || layer.Color != "#ff0000" || !layer.Visible {
			t.Errorf("layer = %+v", layer)
		}
		if len(layer.Highlights) != 1 {
			t.Fatalf("Highlights length = %d, want 1", len(layer.Highlights))
		}
		hl := layer.Highlights[0]
		if hl.ID != "hl1" || hl.From != 10 || hl.To != 20 || hl.Text != "hello" || hl.Annotation != "note" {
			t.Errorf("highlight = %+v", hl)
		}

		if len(layer.Arrows) != 1 {
			t.Fatalf("Arrows length = %d, want 1", len(layer.Arrows))
		}
		arr := layer.Arrows[0]
		if arr.ID != "arr1" {
			t.Errorf("arrow ID = %q, want %q", arr.ID, "arr1")
		}
		if arr.From.EditorIndex != 0 || arr.From.From != 5 || arr.From.To != 10 || arr.From.Text != "src" {
			t.Errorf("arrow.From = %+v", arr.From)
		}
		if arr.To.EditorIndex != 0 || arr.To.From != 30 || arr.To.To != 35 || arr.To.Text != "dst" {
			t.Errorf("arrow.To = %+v", arr.To)
		}

		if len(layer.Underlines) != 1 {
			t.Fatalf("Underlines length = %d, want 1", len(layer.Underlines))
		}
		ul := layer.Underlines[0]
		if ul.ID != "ul1" || ul.From != 15 || ul.To != 25 || ul.Text != "underlined" {
			t.Errorf("underline = %+v", ul)
		}
	})
}

func TestAddLayer(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}

	// Add first layer.
	if err := d.AddLayer("ws1", "l1", "Layer 1", "#ff0000"); err != nil {
		t.Fatalf("AddLayer: %v", err)
	}

	var name, color string
	var position, visible int
	if err := d.conn.QueryRow(
		"SELECT name, color, position, visible FROM layer WHERE id = ?", "l1",
	).Scan(&name, &color, &position, &visible); err != nil {
		t.Fatalf("query layer: %v", err)
	}
	if name != "Layer 1" || color != "#ff0000" || position != 0 || visible != 1 {
		t.Errorf("layer = (%q, %q, %d, %d), want (Layer 1, #ff0000, 0, 1)", name, color, position, visible)
	}

	// Add second layer - position should auto-increment.
	if err := d.AddLayer("ws1", "l2", "Layer 2", "#00ff00"); err != nil {
		t.Fatalf("AddLayer (2nd): %v", err)
	}
	if err := d.conn.QueryRow(
		"SELECT position FROM layer WHERE id = ?", "l2",
	).Scan(&position); err != nil {
		t.Fatal(err)
	}
	if position != 1 {
		t.Errorf("second layer position = %d, want 1", position)
	}
}

func TestRemoveLayer(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer 1", "#ff0000"); err != nil {
		t.Fatal(err)
	}
	// Add a highlight to verify cascade delete.
	if err := d.AddHighlight("l1", "hl1", 0, 10, 20, "text", ""); err != nil {
		t.Fatal(err)
	}
	// Add an arrow to verify cascade delete.
	if err := d.AddArrow("l1", "arr1", 0, 0, 5, "", 0, 10, 15, ""); err != nil {
		t.Fatal(err)
	}

	if err := d.RemoveLayer("ws1", "l1"); err != nil {
		t.Fatalf("RemoveLayer: %v", err)
	}

	// Verify layer is gone.
	var count int
	d.conn.QueryRow("SELECT COUNT(*) FROM layer WHERE id = ?", "l1").Scan(&count)
	if count != 0 {
		t.Errorf("layer count = %d, want 0", count)
	}

	// Verify cascade: highlights should be gone.
	d.conn.QueryRow("SELECT COUNT(*) FROM highlight WHERE layer_id = ?", "l1").Scan(&count)
	if count != 0 {
		t.Errorf("highlight count = %d, want 0 (cascade)", count)
	}

	// Verify cascade: arrows should be gone.
	d.conn.QueryRow("SELECT COUNT(*) FROM arrow WHERE layer_id = ?", "l1").Scan(&count)
	if count != 0 {
		t.Errorf("arrow count = %d, want 0 (cascade)", count)
	}
}

func TestUpdateLayerName(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Original", "#ff0000"); err != nil {
		t.Fatal(err)
	}

	if err := d.UpdateLayerName("ws1", "l1", "Renamed"); err != nil {
		t.Fatalf("UpdateLayerName: %v", err)
	}

	var name string
	d.conn.QueryRow("SELECT name FROM layer WHERE id = ?", "l1").Scan(&name)
	if name != "Renamed" {
		t.Errorf("name = %q, want %q", name, "Renamed")
	}
}

func TestUpdateLayerColor(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer", "#ff0000"); err != nil {
		t.Fatal(err)
	}

	if err := d.UpdateLayerColor("ws1", "l1", "#00ff00"); err != nil {
		t.Fatalf("UpdateLayerColor: %v", err)
	}

	var color string
	d.conn.QueryRow("SELECT color FROM layer WHERE id = ?", "l1").Scan(&color)
	if color != "#00ff00" {
		t.Errorf("color = %q, want %q", color, "#00ff00")
	}
}

func TestToggleLayerVisibility(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer", "#ff0000"); err != nil {
		t.Fatal(err)
	}

	// Initially visible (1). Toggle to hidden.
	if err := d.ToggleLayerVisibility("ws1", "l1"); err != nil {
		t.Fatalf("ToggleLayerVisibility: %v", err)
	}
	var vis int
	d.conn.QueryRow("SELECT visible FROM layer WHERE id = ?", "l1").Scan(&vis)
	if vis != 0 {
		t.Errorf("visible = %d, want 0 after first toggle", vis)
	}

	// Toggle back to visible.
	if err := d.ToggleLayerVisibility("ws1", "l1"); err != nil {
		t.Fatal(err)
	}
	d.conn.QueryRow("SELECT visible FROM layer WHERE id = ?", "l1").Scan(&vis)
	if vis != 1 {
		t.Errorf("visible = %d, want 1 after second toggle", vis)
	}
}

func TestReorderLayers(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer 1", "#ff0000"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l2", "Layer 2", "#00ff00"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l3", "Layer 3", "#0000ff"); err != nil {
		t.Fatal(err)
	}

	// Reverse the order: l3, l2, l1.
	if err := d.ReorderLayers("ws1", []string{"l3", "l2", "l1"}); err != nil {
		t.Fatalf("ReorderLayers: %v", err)
	}

	// Verify positions.
	rows, _ := d.conn.Query("SELECT id, position FROM layer WHERE workspace_id = ? ORDER BY position", "ws1")
	defer rows.Close()
	expected := []struct{ id string; pos int }{{"l3", 0}, {"l2", 1}, {"l1", 2}}
	i := 0
	for rows.Next() {
		var id string
		var pos int
		rows.Scan(&id, &pos)
		if i >= len(expected) || id != expected[i].id || pos != expected[i].pos {
			t.Errorf("layer[%d] = (%q, %d), want (%q, %d)", i, id, pos, expected[i].id, expected[i].pos)
		}
		i++
	}
	if i != len(expected) {
		t.Errorf("got %d layers, want %d", i, len(expected))
	}
}

func TestAddHighlight(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer", "#ff0000"); err != nil {
		t.Fatal(err)
	}

	if err := d.AddHighlight("l1", "hl1", 0, 10, 20, "hello world", "my note"); err != nil {
		t.Fatalf("AddHighlight: %v", err)
	}

	var id, text, annotation string
	var editorIndex, from, to int
	if err := d.conn.QueryRow(
		`SELECT id, editor_index, "from", "to", text, annotation FROM highlight WHERE id = ?`, "hl1",
	).Scan(&id, &editorIndex, &from, &to, &text, &annotation); err != nil {
		t.Fatalf("query highlight: %v", err)
	}
	if id != "hl1" || editorIndex != 0 || from != 10 || to != 20 || text != "hello world" || annotation != "my note" {
		t.Errorf("highlight = (%q, %d, %d, %d, %q, %q)", id, editorIndex, from, to, text, annotation)
	}
}

func TestRemoveHighlight(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer", "#ff0000"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddHighlight("l1", "hl1", 0, 10, 20, "text", ""); err != nil {
		t.Fatal(err)
	}

	if err := d.RemoveHighlight("l1", "hl1"); err != nil {
		t.Fatalf("RemoveHighlight: %v", err)
	}

	var count int
	d.conn.QueryRow("SELECT COUNT(*) FROM highlight WHERE id = ?", "hl1").Scan(&count)
	if count != 0 {
		t.Errorf("highlight count = %d, want 0", count)
	}
}

func TestUpdateHighlightAnnotation(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer", "#ff0000"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddHighlight("l1", "hl1", 0, 10, 20, "text", "old note"); err != nil {
		t.Fatal(err)
	}

	if err := d.UpdateHighlightAnnotation("l1", "hl1", "new note"); err != nil {
		t.Fatalf("UpdateHighlightAnnotation: %v", err)
	}

	var annotation string
	d.conn.QueryRow("SELECT annotation FROM highlight WHERE id = ?", "hl1").Scan(&annotation)
	if annotation != "new note" {
		t.Errorf("annotation = %q, want %q", annotation, "new note")
	}
}

func TestAddArrow(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer", "#ff0000"); err != nil {
		t.Fatal(err)
	}

	if err := d.AddArrow("l1", "arr1", 0, 5, 10, "source", 1, 20, 25, "target"); err != nil {
		t.Fatalf("AddArrow: %v", err)
	}

	var id, fromText, toText string
	var fromEI, fromStart, fromEnd, toEI, toStart, toEnd int
	if err := d.conn.QueryRow(
		`SELECT id, from_editor_index, from_start, from_end, from_text,
		        to_editor_index, to_start, to_end, to_text
		 FROM arrow WHERE id = ?`, "arr1",
	).Scan(&id, &fromEI, &fromStart, &fromEnd, &fromText, &toEI, &toStart, &toEnd, &toText); err != nil {
		t.Fatalf("query arrow: %v", err)
	}
	if fromEI != 0 || fromStart != 5 || fromEnd != 10 || fromText != "source" {
		t.Errorf("arrow.from = (%d, %d, %d, %q)", fromEI, fromStart, fromEnd, fromText)
	}
	if toEI != 1 || toStart != 20 || toEnd != 25 || toText != "target" {
		t.Errorf("arrow.to = (%d, %d, %d, %q)", toEI, toStart, toEnd, toText)
	}
}

func TestRemoveArrow(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer", "#ff0000"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddArrow("l1", "arr1", 0, 0, 5, "", 0, 10, 15, ""); err != nil {
		t.Fatal(err)
	}

	if err := d.RemoveArrow("l1", "arr1"); err != nil {
		t.Fatalf("RemoveArrow: %v", err)
	}

	var count int
	d.conn.QueryRow("SELECT COUNT(*) FROM arrow WHERE id = ?", "arr1").Scan(&count)
	if count != 0 {
		t.Errorf("arrow count = %d, want 0", count)
	}
}

func TestUpdateArrowStyle(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer", "#ff0000"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddArrow("l1", "arr1", 0, 0, 5, "", 0, 10, 15, ""); err != nil {
		t.Fatal(err)
	}

	if err := d.UpdateArrowStyle("l1", "arr1", "dashed"); err != nil {
		t.Fatalf("UpdateArrowStyle: %v", err)
	}

	var style string
	d.conn.QueryRow("SELECT arrow_style FROM arrow WHERE id = ?", "arr1").Scan(&style)
	if style != "dashed" {
		t.Errorf("arrow_style = %q, want %q", style, "dashed")
	}
}

func TestAddUnderline(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer", "#ff0000"); err != nil {
		t.Fatal(err)
	}

	if err := d.AddUnderline("l1", "ul1", 0, 10, 20, "underlined text"); err != nil {
		t.Fatalf("AddUnderline: %v", err)
	}

	var id, text string
	var editorIndex, from, to int
	if err := d.conn.QueryRow(
		`SELECT id, editor_index, "from", "to", text FROM underline WHERE id = ?`, "ul1",
	).Scan(&id, &editorIndex, &from, &to, &text); err != nil {
		t.Fatalf("query underline: %v", err)
	}
	if id != "ul1" || editorIndex != 0 || from != 10 || to != 20 || text != "underlined text" {
		t.Errorf("underline = (%q, %d, %d, %d, %q)", id, editorIndex, from, to, text)
	}
}

func TestRemoveUnderline(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddLayer("ws1", "l1", "Layer", "#ff0000"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddUnderline("l1", "ul1", 0, 10, 20, "text"); err != nil {
		t.Fatal(err)
	}

	if err := d.RemoveUnderline("l1", "ul1"); err != nil {
		t.Fatalf("RemoveUnderline: %v", err)
	}

	var count int
	d.conn.QueryRow("SELECT COUNT(*) FROM underline WHERE id = ?", "ul1").Scan(&count)
	if count != 0 {
		t.Errorf("underline count = %d, want 0", count)
	}
}

func TestAddEditor(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}

	if err := d.AddEditor("ws1", 1, "Passage 2"); err != nil {
		t.Fatalf("AddEditor: %v", err)
	}

	var count int
	d.conn.QueryRow("SELECT COUNT(*) FROM editor WHERE workspace_id = ?", "ws1").Scan(&count)
	// 1 default + 1 added = 2
	if count != 2 {
		t.Errorf("editor count = %d, want 2", count)
	}

	var name string
	var indexPos int
	if err := d.conn.QueryRow(
		"SELECT index_pos, name FROM editor WHERE workspace_id = ? AND index_pos = 1", "ws1",
	).Scan(&indexPos, &name); err != nil {
		t.Fatalf("query editor: %v", err)
	}
	if name != "Passage 2" {
		t.Errorf("name = %q, want %q", name, "Passage 2")
	}
}

func TestRemoveEditor(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	// Add two more editors (index 1 and 2).
	if err := d.AddEditor("ws1", 1, "Passage 2"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddEditor("ws1", 2, "Passage 3"); err != nil {
		t.Fatal(err)
	}

	// Remove middle editor (index 1).
	if err := d.RemoveEditor("ws1", 1); err != nil {
		t.Fatalf("RemoveEditor: %v", err)
	}

	// Should have 2 editors remaining.
	var count int
	d.conn.QueryRow("SELECT COUNT(*) FROM editor WHERE workspace_id = ?", "ws1").Scan(&count)
	if count != 2 {
		t.Errorf("editor count = %d, want 2", count)
	}

	// Remaining editors should be re-indexed to 0 and 1.
	rows, _ := d.conn.Query("SELECT index_pos, name FROM editor WHERE workspace_id = ? ORDER BY index_pos", "ws1")
	defer rows.Close()
	expectedIndices := []int{0, 1}
	i := 0
	for rows.Next() {
		var idx int
		var name string
		rows.Scan(&idx, &name)
		if i < len(expectedIndices) && idx != expectedIndices[i] {
			t.Errorf("editor[%d] index = %d, want %d", i, idx, expectedIndices[i])
		}
		i++
	}
}

func TestUpdateSectionName(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}

	if err := d.UpdateSectionName("ws1", 0, "Genesis 1"); err != nil {
		t.Fatalf("UpdateSectionName: %v", err)
	}

	var name string
	d.conn.QueryRow("SELECT name FROM editor WHERE workspace_id = ? AND index_pos = 0", "ws1").Scan(&name)
	if name != "Genesis 1" {
		t.Errorf("name = %q, want %q", name, "Genesis 1")
	}
}

func TestToggleSectionVisibility(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}

	// Toggle to hidden.
	if err := d.ToggleSectionVisibility("ws1", 0); err != nil {
		t.Fatalf("ToggleSectionVisibility: %v", err)
	}
	var vis int
	d.conn.QueryRow("SELECT visible FROM editor WHERE workspace_id = ? AND index_pos = 0", "ws1").Scan(&vis)
	if vis != 0 {
		t.Errorf("visible = %d, want 0", vis)
	}

	// Toggle back.
	if err := d.ToggleSectionVisibility("ws1", 0); err != nil {
		t.Fatal(err)
	}
	d.conn.QueryRow("SELECT visible FROM editor WHERE workspace_id = ? AND index_pos = 0", "ws1").Scan(&vis)
	if vis != 1 {
		t.Errorf("visible = %d, want 1", vis)
	}
}

func TestReorderEditors(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddEditor("ws1", 1, "Passage 2"); err != nil {
		t.Fatal(err)
	}
	if err := d.AddEditor("ws1", 2, "Passage 3"); err != nil {
		t.Fatal(err)
	}

	// Reverse order: old index 2 -> new pos 0, old 1 -> new pos 1, old 0 -> new pos 2.
	if err := d.ReorderEditors("ws1", []int{2, 1, 0}); err != nil {
		t.Fatalf("ReorderEditors: %v", err)
	}

	rows, _ := d.conn.Query("SELECT name, index_pos FROM editor WHERE workspace_id = ? ORDER BY index_pos", "ws1")
	defer rows.Close()
	expected := []string{"Passage 3", "Passage 2", "Passage 1"}
	i := 0
	for rows.Next() {
		var name string
		var idx int
		rows.Scan(&name, &idx)
		if i < len(expected) && name != expected[i] {
			t.Errorf("editor[%d] name = %q, want %q", i, name, expected[i])
		}
		i++
	}
}

func TestUpdateEditorContent(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}

	content := map[string]interface{}{
		"type": "doc",
		"content": []interface{}{
			map[string]interface{}{"type": "paragraph", "text": "Hello"},
		},
	}
	if err := d.UpdateEditorContent("ws1", 0, content); err != nil {
		t.Fatalf("UpdateEditorContent: %v", err)
	}

	// Verify stored JSON.
	var storedJSON string
	if err := d.conn.QueryRow(
		"SELECT content_json FROM editor WHERE workspace_id = ? AND index_pos = 0", "ws1",
	).Scan(&storedJSON); err != nil {
		t.Fatal(err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(storedJSON), &parsed); err != nil {
		t.Fatalf("unmarshal stored JSON: %v", err)
	}
	if parsed["type"] != "doc" {
		t.Errorf("parsed type = %v, want %q", parsed["type"], "doc")
	}

	// Verify round-trip through GetWorkspaceState.
	state, err := d.GetWorkspaceState("ws1")
	if err != nil {
		t.Fatal(err)
	}
	if len(state.Editors) != 1 {
		t.Fatalf("editors = %d, want 1", len(state.Editors))
	}
	if state.Editors[0].ContentJSON == nil {
		t.Error("ContentJSON is nil after round-trip")
	}
}

func TestCreateShareLink(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}

	code, err := d.CreateShareLink("ws1", "edit")
	if err != nil {
		t.Fatalf("CreateShareLink: %v", err)
	}
	if len(code) != 6 {
		t.Errorf("code length = %d, want 6", len(code))
	}

	// Verify persisted.
	var access string
	if err := d.conn.QueryRow(
		"SELECT access FROM share_link WHERE code = ?", code,
	).Scan(&access); err != nil {
		t.Fatalf("query share_link: %v", err)
	}
	if access != "edit" {
		t.Errorf("access = %q, want %q", access, "edit")
	}

	// Uniqueness: create a second code and verify different.
	code2, err := d.CreateShareLink("ws1", "readonly")
	if err != nil {
		t.Fatal(err)
	}
	if code2 == code {
		t.Errorf("second code %q is identical to first", code2)
	}
}

func TestResolveShareLink(t *testing.T) {
	d := newTestDB(t)
	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}

	code, err := d.CreateShareLink("ws1", "edit")
	if err != nil {
		t.Fatal(err)
	}

	// Found case.
	wsID, access, err := d.ResolveShareLink(code)
	if err != nil {
		t.Fatalf("ResolveShareLink: %v", err)
	}
	if wsID != "ws1" || access != "edit" {
		t.Errorf("resolved = (%q, %q), want (%q, %q)", wsID, access, "ws1", "edit")
	}

	// Not found case.
	wsID, access, err = d.ResolveShareLink("nonexistent")
	if err != nil {
		t.Fatalf("ResolveShareLink (not found): %v", err)
	}
	if wsID != "" || access != "" {
		t.Errorf("not found should return empty, got (%q, %q)", wsID, access)
	}
}

// Test that NewDB handles :memory: specially (no MkdirAll error).
func TestNewDB_Memory(t *testing.T) {
	d, err := NewDB(":memory:")
	if err != nil {
		t.Fatalf("NewDB(:memory:): %v", err)
	}
	defer d.Close()

	// Basic sanity: insert and query.
	if err := d.EnsureWorkspace("test"); err != nil {
		t.Fatalf("EnsureWorkspace: %v", err)
	}
	var id string
	err = d.conn.QueryRow("SELECT id FROM workspace WHERE id = ?", "test").Scan(&id)
	if err != nil {
		t.Fatal(err)
	}
	if id != "test" {
		t.Errorf("got %q, want %q", id, "test")
	}
}

// Test that NewDB with a temporary file path works.
func TestNewDB_TempFile(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := tmpDir + "/sub/test.db"
	d, err := NewDB(dbPath)
	if err != nil {
		t.Fatalf("NewDB: %v", err)
	}
	defer d.Close()

	if err := d.EnsureWorkspace("ws1"); err != nil {
		t.Fatal(err)
	}

	// Verify the file was created.
	if _, err := sql.Open("sqlite", dbPath); err != nil {
		t.Fatalf("database file not created at %s", dbPath)
	}
}
