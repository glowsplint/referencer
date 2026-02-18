package ws

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"

	"referencer/backend/internal/db"
	"referencer/backend/internal/models"
)

func newTestDB(t *testing.T) *db.DB {
	t.Helper()
	d, err := db.NewDB(":memory:")
	if err != nil {
		t.Fatalf("NewDB: %v", err)
	}
	t.Cleanup(func() { d.Close() })
	return d
}

// dialTestServer starts an httptest server with the WebSocket handler and
// returns a connected websocket.Conn along with a cleanup function.
func dialTestServer(t *testing.T, database *db.DB, workspaceID string) *websocket.Conn {
	t.Helper()
	connMgr := NewConnectionManager()

	r := chi.NewRouter()
	r.Get("/ws/{workspaceID}", HandleWebSocket(database, connMgr))

	srv := httptest.NewServer(r)
	t.Cleanup(srv.Close)

	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http") + "/ws/" + workspaceID
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	t.Cleanup(func() { conn.Close() })
	return conn
}

// readServerMessage reads and parses a ServerMessage from the connection.
func readServerMessage(t *testing.T, conn *websocket.Conn) models.ServerMessage {
	t.Helper()
	_, raw, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("read message: %v", err)
	}
	var msg models.ServerMessage
	if err := json.Unmarshal(raw, &msg); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return msg
}

// sendClientMessage sends a ClientMessage over the connection.
func sendClientMessage(t *testing.T, conn *websocket.Conn, msg models.ClientMessage) {
	t.Helper()
	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
		t.Fatalf("write message: %v", err)
	}
}

// --- ConnectionManager tests ---

func TestConnectionManager_ConnectDisconnect(t *testing.T) {
	cm := NewConnectionManager()

	// Connect two clients to the same workspace.
	id1 := cm.Connect("ws1", nil)
	id2 := cm.Connect("ws1", nil)

	if id1 == id2 {
		t.Error("expected unique client IDs")
	}

	cm.mu.RLock()
	count := len(cm.connections["ws1"])
	cm.mu.RUnlock()
	if count != 2 {
		t.Errorf("connections = %d, want 2", count)
	}

	// Disconnect first client.
	cm.Disconnect("ws1", id1)

	cm.mu.RLock()
	count = len(cm.connections["ws1"])
	cm.mu.RUnlock()
	if count != 1 {
		t.Errorf("connections after disconnect = %d, want 1", count)
	}

	// Disconnect last client should remove the workspace entry.
	cm.Disconnect("ws1", id2)

	cm.mu.RLock()
	_, exists := cm.connections["ws1"]
	cm.mu.RUnlock()
	if exists {
		t.Error("workspace should be removed when all clients disconnect")
	}
}

func TestConnectionManager_DisconnectNonexistent(t *testing.T) {
	cm := NewConnectionManager()

	// Should not panic.
	cm.Disconnect("ws1", "nonexistent")
	cm.Disconnect("nonexistent", "nonexistent")
}

func TestConnectionManager_MultipleWorkspaces(t *testing.T) {
	cm := NewConnectionManager()

	cm.Connect("ws1", nil)
	cm.Connect("ws2", nil)

	cm.mu.RLock()
	ws1Count := len(cm.connections["ws1"])
	ws2Count := len(cm.connections["ws2"])
	cm.mu.RUnlock()

	if ws1Count != 1 || ws2Count != 1 {
		t.Errorf("ws1=%d ws2=%d, want 1 and 1", ws1Count, ws2Count)
	}
}

func TestConnectionManager_SendToNotFound(t *testing.T) {
	cm := NewConnectionManager()

	err := cm.SendTo("ws1", "nonexistent", "hello")
	if err == nil {
		t.Error("expected error for unknown client")
	}
}

// --- structToMap tests ---

func TestStructToMap(t *testing.T) {
	state := models.WorkspaceState{
		WorkspaceID: "ws1",
		Layers:      []models.Layer{},
		Editors: []models.Editor{
			{Index: 0, Name: "Passage 1", Visible: true},
		},
	}

	m, err := structToMap(state)
	if err != nil {
		t.Fatalf("structToMap: %v", err)
	}
	if m["workspaceId"] != "ws1" {
		t.Errorf("workspaceId = %v, want %q", m["workspaceId"], "ws1")
	}
	editors, ok := m["editors"].([]interface{})
	if !ok || len(editors) != 1 {
		t.Errorf("editors = %v", m["editors"])
	}
}

// --- stringOrDefault tests ---

func TestStringOrDefault(t *testing.T) {
	m := map[string]interface{}{"key": "value", "num": 42}

	if got := stringOrDefault(m, "key", "def"); got != "value" {
		t.Errorf("got %q, want %q", got, "value")
	}
	if got := stringOrDefault(m, "missing", "def"); got != "def" {
		t.Errorf("got %q, want %q", got, "def")
	}
	// Non-string value should return default.
	if got := stringOrDefault(m, "num", "def"); got != "def" {
		t.Errorf("got %q, want %q", got, "def")
	}
}

// --- Action handler tests ---

func TestHandleAddLayer(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")

	payload := map[string]interface{}{
		"id": "l1", "name": "Layer 1", "color": "#ff0000",
	}
	if err := handleAddLayer(d, "ws1", payload); err != nil {
		t.Fatalf("handleAddLayer: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if len(state.Layers) != 1 {
		t.Fatalf("layers = %d, want 1", len(state.Layers))
	}
	if state.Layers[0].ID != "l1" || state.Layers[0].Name != "Layer 1" {
		t.Errorf("layer = %+v", state.Layers[0])
	}
}

func TestHandleRemoveLayer(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer 1", "#ff0000")

	payload := map[string]interface{}{"id": "l1"}
	if err := handleRemoveLayer(d, "ws1", payload); err != nil {
		t.Fatalf("handleRemoveLayer: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if len(state.Layers) != 0 {
		t.Errorf("layers = %d, want 0", len(state.Layers))
	}
}

func TestHandleUpdateLayerName(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Original", "#ff0000")

	payload := map[string]interface{}{"id": "l1", "name": "Renamed"}
	if err := handleUpdateLayerName(d, "ws1", payload); err != nil {
		t.Fatalf("handleUpdateLayerName: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if state.Layers[0].Name != "Renamed" {
		t.Errorf("name = %q, want %q", state.Layers[0].Name, "Renamed")
	}
}

func TestHandleUpdateLayerColor(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer", "#ff0000")

	payload := map[string]interface{}{"id": "l1", "color": "#00ff00"}
	if err := handleUpdateLayerColor(d, "ws1", payload); err != nil {
		t.Fatalf("handleUpdateLayerColor: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if state.Layers[0].Color != "#00ff00" {
		t.Errorf("color = %q, want %q", state.Layers[0].Color, "#00ff00")
	}
}

func TestHandleToggleLayerVisibility(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer", "#ff0000")

	payload := map[string]interface{}{"id": "l1"}
	if err := handleToggleLayerVisibility(d, "ws1", payload); err != nil {
		t.Fatalf("handleToggleLayerVisibility: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if state.Layers[0].Visible {
		t.Error("expected layer to be hidden")
	}
}

func TestHandleReorderLayers(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer 1", "#ff0000")
	d.AddLayer("ws1", "l2", "Layer 2", "#00ff00")

	// Reverse order (JSON unmarshal produces []interface{}).
	payload := map[string]interface{}{
		"layerIds": []interface{}{"l2", "l1"},
	}
	if err := handleReorderLayers(d, "ws1", payload); err != nil {
		t.Fatalf("handleReorderLayers: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if state.Layers[0].ID != "l2" || state.Layers[1].ID != "l1" {
		t.Errorf("order = [%s, %s], want [l2, l1]", state.Layers[0].ID, state.Layers[1].ID)
	}
}

func TestHandleAddHighlight(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer", "#ff0000")

	payload := map[string]interface{}{
		"layerId": "l1",
		"highlight": map[string]interface{}{
			"id": "hl1", "editorIndex": float64(0),
			"from": float64(10), "to": float64(20),
			"text": "hello", "annotation": "note",
		},
	}
	if err := handleAddHighlight(d, "ws1", payload); err != nil {
		t.Fatalf("handleAddHighlight: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if len(state.Layers[0].Highlights) != 1 {
		t.Fatalf("highlights = %d, want 1", len(state.Layers[0].Highlights))
	}
	hl := state.Layers[0].Highlights[0]
	if hl.ID != "hl1" || hl.From != 10 || hl.To != 20 || hl.Annotation != "note" {
		t.Errorf("highlight = %+v", hl)
	}
}

func TestHandleRemoveHighlight(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer", "#ff0000")
	d.AddHighlight("l1", "hl1", 0, 10, 20, "text", "")

	payload := map[string]interface{}{"layerId": "l1", "highlightId": "hl1"}
	if err := handleRemoveHighlight(d, "ws1", payload); err != nil {
		t.Fatalf("handleRemoveHighlight: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if len(state.Layers[0].Highlights) != 0 {
		t.Errorf("highlights = %d, want 0", len(state.Layers[0].Highlights))
	}
}

func TestHandleUpdateHighlightAnnotation(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer", "#ff0000")
	d.AddHighlight("l1", "hl1", 0, 10, 20, "text", "old")

	payload := map[string]interface{}{
		"layerId": "l1", "highlightId": "hl1", "annotation": "new",
	}
	if err := handleUpdateHighlightAnnotation(d, "ws1", payload); err != nil {
		t.Fatalf("handleUpdateHighlightAnnotation: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if state.Layers[0].Highlights[0].Annotation != "new" {
		t.Errorf("annotation = %q, want %q", state.Layers[0].Highlights[0].Annotation, "new")
	}
}

func TestHandleAddArrow(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer", "#ff0000")

	payload := map[string]interface{}{
		"layerId": "l1",
		"arrow": map[string]interface{}{
			"id": "arr1",
			"from": map[string]interface{}{
				"editorIndex": float64(0), "from": float64(5), "to": float64(10), "text": "src",
			},
			"to": map[string]interface{}{
				"editorIndex": float64(0), "from": float64(20), "to": float64(25), "text": "dst",
			},
		},
	}
	if err := handleAddArrow(d, "ws1", payload); err != nil {
		t.Fatalf("handleAddArrow: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if len(state.Layers[0].Arrows) != 1 {
		t.Fatalf("arrows = %d, want 1", len(state.Layers[0].Arrows))
	}
	if state.Layers[0].Arrows[0].ID != "arr1" {
		t.Errorf("arrow ID = %q, want %q", state.Layers[0].Arrows[0].ID, "arr1")
	}
}

func TestHandleRemoveArrow(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer", "#ff0000")
	d.AddArrow("l1", "arr1", 0, 0, 5, "", 0, 10, 15, "")

	payload := map[string]interface{}{"layerId": "l1", "arrowId": "arr1"}
	if err := handleRemoveArrow(d, "ws1", payload); err != nil {
		t.Fatalf("handleRemoveArrow: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if len(state.Layers[0].Arrows) != 0 {
		t.Errorf("arrows = %d, want 0", len(state.Layers[0].Arrows))
	}
}

func TestHandleUpdateArrowStyle(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer", "#ff0000")
	d.AddArrow("l1", "arr1", 0, 0, 5, "", 0, 10, 15, "")

	payload := map[string]interface{}{"layerId": "l1", "arrowId": "arr1", "arrowStyle": "dashed"}
	if err := handleUpdateArrowStyle(d, "ws1", payload); err != nil {
		t.Fatalf("handleUpdateArrowStyle: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if state.Layers[0].Arrows[0].ArrowStyle != "dashed" {
		t.Errorf("arrowStyle = %q, want %q", state.Layers[0].Arrows[0].ArrowStyle, "dashed")
	}
}

func TestHandleAddUnderline(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer", "#ff0000")

	payload := map[string]interface{}{
		"layerId": "l1",
		"underline": map[string]interface{}{
			"id": "ul1", "editorIndex": float64(0),
			"from": float64(10), "to": float64(20), "text": "underlined",
		},
	}
	if err := handleAddUnderline(d, "ws1", payload); err != nil {
		t.Fatalf("handleAddUnderline: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if len(state.Layers[0].Underlines) != 1 {
		t.Fatalf("underlines = %d, want 1", len(state.Layers[0].Underlines))
	}
	if state.Layers[0].Underlines[0].ID != "ul1" {
		t.Errorf("underline ID = %q", state.Layers[0].Underlines[0].ID)
	}
}

func TestHandleRemoveUnderline(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddLayer("ws1", "l1", "Layer", "#ff0000")
	d.AddUnderline("l1", "ul1", 0, 10, 20, "text")

	payload := map[string]interface{}{"layerId": "l1", "underlineId": "ul1"}
	if err := handleRemoveUnderline(d, "ws1", payload); err != nil {
		t.Fatalf("handleRemoveUnderline: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if len(state.Layers[0].Underlines) != 0 {
		t.Errorf("underlines = %d, want 0", len(state.Layers[0].Underlines))
	}
}

func TestHandleAddEditor(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")

	payload := map[string]interface{}{"index": float64(1), "name": "Passage 2"}
	if err := handleAddEditor(d, "ws1", payload); err != nil {
		t.Fatalf("handleAddEditor: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if len(state.Editors) != 2 {
		t.Errorf("editors = %d, want 2", len(state.Editors))
	}
}

func TestHandleRemoveEditor(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddEditor("ws1", 1, "Passage 2")

	payload := map[string]interface{}{"index": float64(1)}
	if err := handleRemoveEditor(d, "ws1", payload); err != nil {
		t.Fatalf("handleRemoveEditor: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if len(state.Editors) != 1 {
		t.Errorf("editors = %d, want 1", len(state.Editors))
	}
}

func TestHandleUpdateSectionName(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")

	payload := map[string]interface{}{"index": float64(0), "name": "Genesis 1"}
	if err := handleUpdateSectionName(d, "ws1", payload); err != nil {
		t.Fatalf("handleUpdateSectionName: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if state.Editors[0].Name != "Genesis 1" {
		t.Errorf("name = %q, want %q", state.Editors[0].Name, "Genesis 1")
	}
}

func TestHandleToggleSectionVisibility(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")

	payload := map[string]interface{}{"index": float64(0)}
	if err := handleToggleSectionVisibility(d, "ws1", payload); err != nil {
		t.Fatalf("handleToggleSectionVisibility: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if state.Editors[0].Visible {
		t.Error("expected editor to be hidden")
	}
}

func TestHandleReorderEditors(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")
	d.AddEditor("ws1", 1, "Passage 2")
	d.AddEditor("ws1", 2, "Passage 3")

	// Reverse: old 2->0, old 1->1, old 0->2 (JSON produces float64 values).
	payload := map[string]interface{}{
		"permutation": []interface{}{float64(2), float64(1), float64(0)},
	}
	if err := handleReorderEditors(d, "ws1", payload); err != nil {
		t.Fatalf("handleReorderEditors: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if state.Editors[0].Name != "Passage 3" {
		t.Errorf("first editor = %q, want %q", state.Editors[0].Name, "Passage 3")
	}
}

func TestHandleUpdateEditorContent(t *testing.T) {
	d := newTestDB(t)
	d.EnsureWorkspace("ws1")

	content := map[string]interface{}{"type": "doc", "content": []interface{}{}}
	payload := map[string]interface{}{
		"editorIndex": float64(0), "contentJson": content,
	}
	if err := handleUpdateEditorContent(d, "ws1", payload); err != nil {
		t.Fatalf("handleUpdateEditorContent: %v", err)
	}

	state, _ := d.GetWorkspaceState("ws1")
	if state.Editors[0].ContentJSON == nil {
		t.Error("expected non-nil content after update")
	}
}

// --- WebSocket integration tests ---

func TestWebSocket_InitialState(t *testing.T) {
	database := newTestDB(t)
	database.EnsureWorkspace("ws1")

	conn := dialTestServer(t, database, "ws1")

	// First message should be the workspace state.
	msg := readServerMessage(t, conn)
	if msg.Type != "state" {
		t.Fatalf("type = %q, want %q", msg.Type, "state")
	}
	if msg.Payload["workspaceId"] != "ws1" {
		t.Errorf("workspaceId = %v, want %q", msg.Payload["workspaceId"], "ws1")
	}
}

func TestWebSocket_ActionAck(t *testing.T) {
	database := newTestDB(t)
	database.EnsureWorkspace("ws1")

	conn := dialTestServer(t, database, "ws1")

	// Read initial state.
	readServerMessage(t, conn)

	// Send an addLayer action.
	sendClientMessage(t, conn, models.ClientMessage{
		Type: "addLayer",
		Payload: map[string]interface{}{
			"id": "l1", "name": "Layer 1", "color": "#ff0000",
		},
		RequestID: "req-1",
	})

	// Should receive an ack.
	ack := readServerMessage(t, conn)
	if ack.Type != "ack" {
		t.Fatalf("type = %q, want %q", ack.Type, "ack")
	}
	if ack.RequestID != "req-1" {
		t.Errorf("requestId = %q, want %q", ack.RequestID, "req-1")
	}

	// Verify the layer was persisted.
	state, _ := database.GetWorkspaceState("ws1")
	if len(state.Layers) != 1 || state.Layers[0].ID != "l1" {
		t.Errorf("expected layer l1 to be persisted, got %+v", state.Layers)
	}
}

func TestWebSocket_UnknownAction(t *testing.T) {
	database := newTestDB(t)
	database.EnsureWorkspace("ws1")

	conn := dialTestServer(t, database, "ws1")
	readServerMessage(t, conn)

	sendClientMessage(t, conn, models.ClientMessage{
		Type:      "nonexistentAction",
		Payload:   map[string]interface{}{},
		RequestID: "req-2",
	})

	errMsg := readServerMessage(t, conn)
	if errMsg.Type != "error" {
		t.Fatalf("type = %q, want %q", errMsg.Type, "error")
	}
	if errMsg.RequestID != "req-2" {
		t.Errorf("requestId = %q, want %q", errMsg.RequestID, "req-2")
	}
	if msg, ok := errMsg.Payload["message"].(string); !ok || msg == "" {
		t.Error("expected error message in payload")
	}
}

func TestWebSocket_Broadcast(t *testing.T) {
	database := newTestDB(t)
	database.EnsureWorkspace("ws1")

	connMgr := NewConnectionManager()

	r := chi.NewRouter()
	r.Get("/ws/{workspaceID}", HandleWebSocket(database, connMgr))
	srv := httptest.NewServer(r)
	t.Cleanup(srv.Close)

	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http") + "/ws/ws1"

	// Connect two clients.
	conn1, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial conn1: %v", err)
	}
	t.Cleanup(func() { conn1.Close() })

	conn2, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial conn2: %v", err)
	}
	t.Cleanup(func() { conn2.Close() })

	// Both get initial state.
	readServerMessage(t, conn1)
	readServerMessage(t, conn2)

	// conn1 sends an action.
	sendClientMessage(t, conn1, models.ClientMessage{
		Type: "addLayer",
		Payload: map[string]interface{}{
			"id": "l1", "name": "Layer 1", "color": "#ff0000",
		},
		RequestID: "req-b1",
	})

	// conn1 receives ack.
	ack := readServerMessage(t, conn1)
	if ack.Type != "ack" {
		t.Fatalf("conn1 type = %q, want %q", ack.Type, "ack")
	}

	// conn2 receives the broadcast.
	broadcast := readServerMessage(t, conn2)
	if broadcast.Type != "action" {
		t.Fatalf("conn2 type = %q, want %q", broadcast.Type, "action")
	}
	if broadcast.Payload["actionType"] != "addLayer" {
		t.Errorf("actionType = %v, want %q", broadcast.Payload["actionType"], "addLayer")
	}
	if broadcast.SourceClientID == "" {
		t.Error("expected sourceClientId on broadcast")
	}
}

func TestWebSocket_MissingWorkspaceID(t *testing.T) {
	database := newTestDB(t)
	connMgr := NewConnectionManager()

	r := chi.NewRouter()
	r.Get("/ws/{workspaceID}", HandleWebSocket(database, connMgr))
	// Also mount at a path without the param to test the missing-ID case.
	r.Get("/ws-no-id", HandleWebSocket(database, connMgr))

	srv := httptest.NewServer(r)
	t.Cleanup(srv.Close)

	// Request to the path without workspaceID in the route params.
	resp, err := http.Get(srv.URL + "/ws-no-id")
	if err != nil {
		t.Fatalf("GET: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusBadRequest)
	}
}

func TestWebSocket_MultipleActions(t *testing.T) {
	database := newTestDB(t)
	database.EnsureWorkspace("ws1")

	conn := dialTestServer(t, database, "ws1")
	readServerMessage(t, conn)

	// Add layer, then add highlight to it.
	sendClientMessage(t, conn, models.ClientMessage{
		Type: "addLayer",
		Payload: map[string]interface{}{
			"id": "l1", "name": "Layer 1", "color": "#ff0000",
		},
		RequestID: "req-a",
	})
	ack1 := readServerMessage(t, conn)
	if ack1.Type != "ack" || ack1.RequestID != "req-a" {
		t.Fatalf("ack1 = %+v", ack1)
	}

	sendClientMessage(t, conn, models.ClientMessage{
		Type: "addHighlight",
		Payload: map[string]interface{}{
			"layerId": "l1",
			"highlight": map[string]interface{}{
				"id": "hl1", "editorIndex": float64(0),
				"from": float64(5), "to": float64(15),
				"text": "selected", "annotation": "",
			},
		},
		RequestID: "req-b",
	})
	ack2 := readServerMessage(t, conn)
	if ack2.Type != "ack" || ack2.RequestID != "req-b" {
		t.Fatalf("ack2 = %+v", ack2)
	}

	// Verify the full state.
	state, _ := database.GetWorkspaceState("ws1")
	if len(state.Layers) != 1 || len(state.Layers[0].Highlights) != 1 {
		t.Errorf("state = %+v", state)
	}
}
