package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"referencer/backend/internal/db"
	"referencer/backend/internal/models"
)

// CheckOrigin allows all origins — permissive for local development.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ConnectionManager tracks WebSocket connections per workspace.
type ConnectionManager struct {
	mu          sync.RWMutex
	connections map[string]map[string]*websocket.Conn // workspace_id -> client_id -> conn
}

// NewConnectionManager creates a new ConnectionManager.
func NewConnectionManager() *ConnectionManager {
	return &ConnectionManager{
		connections: make(map[string]map[string]*websocket.Conn),
	}
}

// Connect registers a WebSocket connection and returns a client ID.
func (cm *ConnectionManager) Connect(workspaceID string, conn *websocket.Conn) string {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	clientID := uuid.New().String()
	if cm.connections[workspaceID] == nil {
		cm.connections[workspaceID] = make(map[string]*websocket.Conn)
	}
	cm.connections[workspaceID][clientID] = conn
	return clientID
}

// Disconnect removes a client from its workspace.
func (cm *ConnectionManager) Disconnect(workspaceID, clientID string) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	if clients, ok := cm.connections[workspaceID]; ok {
		delete(clients, clientID)
		if len(clients) == 0 {
			delete(cm.connections, workspaceID)
		}
	}
}

// SendTo sends a message to a specific client.
func (cm *ConnectionManager) SendTo(workspaceID, clientID string, msg interface{}) error {
	cm.mu.RLock()
	conn := cm.connections[workspaceID][clientID]
	cm.mu.RUnlock()

	if conn == nil {
		return fmt.Errorf("client %s not found", clientID)
	}
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, data)
}

// Broadcast sends a message to all clients in a workspace except one.
func (cm *ConnectionManager) Broadcast(workspaceID string, msg interface{}, excludeClient string) {
	cm.mu.RLock()
	clients := cm.connections[workspaceID]
	// Copy conn references while holding the lock.
	recipients := make(map[string]*websocket.Conn, len(clients))
	for id, conn := range clients {
		if id != excludeClient {
			recipients[id] = conn
		}
	}
	cm.mu.RUnlock()

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("broadcast marshal error: %v", err)
		return
	}
	for cid, conn := range recipients {
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("failed to send to client %s: %v", cid, err)
		}
	}
}

// actionHandler processes a client action by persisting it to the database.
// workspaceID is passed to all handlers for consistency; some operate by layerID alone and don't use it.
type actionHandler func(database *db.DB, workspaceID string, payload map[string]interface{}) error

var actionHandlers = map[string]actionHandler{
	"addLayer":                handleAddLayer,
	"removeLayer":             handleRemoveLayer,
	"updateLayerName":         handleUpdateLayerName,
	"updateLayerColor":        handleUpdateLayerColor,
	"toggleLayerVisibility":   handleToggleLayerVisibility,
	"reorderLayers":           handleReorderLayers,
	"addHighlight":            handleAddHighlight,
	"removeHighlight":         handleRemoveHighlight,
	"updateHighlightAnnotation": handleUpdateHighlightAnnotation,
	"addArrow":                handleAddArrow,
	"removeArrow":             handleRemoveArrow,
	"updateArrowStyle":        handleUpdateArrowStyle,
	"addUnderline":            handleAddUnderline,
	"removeUnderline":         handleRemoveUnderline,
	"addEditor":               handleAddEditor,
	"removeEditor":            handleRemoveEditor,
	"updateSectionName":       handleUpdateSectionName,
	"toggleSectionVisibility": handleToggleSectionVisibility,
	"reorderEditors":          handleReorderEditors,
	"updateEditorContent":     handleUpdateEditorContent,
}

// HandleWebSocket returns an HTTP handler for WebSocket connections.
func HandleWebSocket(database *db.DB, connMgr *ConnectionManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		workspaceID := chi.URLParam(r, "workspaceID")
		if workspaceID == "" {
			http.Error(w, "workspace ID required", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("websocket upgrade error: %v", err)
			return
		}
		defer conn.Close()

		clientID := connMgr.Connect(workspaceID, conn)
		defer connMgr.Disconnect(workspaceID, clientID)

		log.Printf("client %s connected to workspace %s", clientID, workspaceID)

		// Ensure workspace exists and send initial state.
		if err := database.EnsureWorkspace(workspaceID); err != nil {
			log.Printf("ensure workspace error: %v", err)
			return
		}

		// GetWorkspaceState uses a three-pass loading strategy:
		// 1. Layers (ordered by position)
		// 2. Annotations (highlights, arrows, underlines indexed by layer)
		// 3. Editors (ordered by index_pos)
		state, err := database.GetWorkspaceState(workspaceID)
		if err != nil {
			log.Printf("get workspace state error: %v", err)
			return
		}

		statePayload, err := structToMap(state)
		if err != nil {
			log.Printf("state marshal error: %v", err)
			return
		}

		if err := connMgr.SendTo(workspaceID, clientID, models.ServerMessage{
			Type:    "state",
			Payload: statePayload,
		}); err != nil {
			log.Printf("send state error: %v", err)
			return
		}

		// Message read loop.
		for {
			_, rawMsg, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
					log.Printf("websocket read error: %v", err)
				}
				break
			}

			var msg models.ClientMessage
			if err := json.Unmarshal(rawMsg, &msg); err != nil {
				log.Printf("invalid message from client %s: %v", clientID, err)
				continue
			}

			handler, ok := actionHandlers[msg.Type]
			if !ok {
				connMgr.SendTo(workspaceID, clientID, models.ServerMessage{
					Type:      "error",
					Payload:   map[string]interface{}{"message": fmt.Sprintf("Unknown action: %s", msg.Type)},
					RequestID: msg.RequestID,
				})
				continue
			}

			if err := handler(database, workspaceID, msg.Payload); err != nil {
				log.Printf("action %s error: %v", msg.Type, err)
				connMgr.SendTo(workspaceID, clientID, models.ServerMessage{
					Type:      "error",
					Payload:   map[string]interface{}{"message": err.Error()},
					RequestID: msg.RequestID,
				})
				continue
			}

			// Ack to sender.
			connMgr.SendTo(workspaceID, clientID, models.ServerMessage{
				Type:      "ack",
				Payload:   map[string]interface{}{},
				RequestID: msg.RequestID,
			})

			// Broadcast to other clients.
			// Flatten actionType into the original payload, matching Python behavior.
			broadcastPayload := make(map[string]interface{}, len(msg.Payload)+1)
			broadcastPayload["actionType"] = msg.Type
			for k, v := range msg.Payload {
				broadcastPayload[k] = v
			}
			connMgr.Broadcast(workspaceID, models.ServerMessage{
				Type:           "action",
				Payload:        broadcastPayload,
				SourceClientID: clientID,
				RequestID:      msg.RequestID,
			}, clientID)
		}

		log.Printf("client %s disconnected from workspace %s", clientID, workspaceID)
	}
}

// structToMap converts v to a map via JSON round-trip, ensuring keys match json struct tags that clients expect.
func structToMap(v interface{}) (map[string]interface{}, error) {
	data, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, err
	}
	return m, nil
}

// --- Action handlers ---

func handleAddLayer(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	id, err := assertString(payload, "id")
	if err != nil {
		return err
	}
	name, err := assertString(payload, "name")
	if err != nil {
		return err
	}
	color, err := assertString(payload, "color")
	if err != nil {
		return err
	}
	return database.AddLayer(workspaceID, id, name, color)
}

func handleRemoveLayer(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	id, err := assertString(payload, "id")
	if err != nil {
		return err
	}
	return database.RemoveLayer(workspaceID, id)
}

func handleUpdateLayerName(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	id, err := assertString(payload, "id")
	if err != nil {
		return err
	}
	name, err := assertString(payload, "name")
	if err != nil {
		return err
	}
	return database.UpdateLayerName(workspaceID, id, name)
}

func handleUpdateLayerColor(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	id, err := assertString(payload, "id")
	if err != nil {
		return err
	}
	color, err := assertString(payload, "color")
	if err != nil {
		return err
	}
	return database.UpdateLayerColor(workspaceID, id, color)
}

func handleToggleLayerVisibility(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	id, err := assertString(payload, "id")
	if err != nil {
		return err
	}
	return database.ToggleLayerVisibility(workspaceID, id)
}

func handleReorderLayers(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	raw, err := assertSlice(payload, "layerIds")
	if err != nil {
		return err
	}
	ids := make([]string, len(raw))
	for i, v := range raw {
		s, ok := v.(string)
		if !ok {
			return fmt.Errorf("layerIds[%d]: expected string, got %T", i, v)
		}
		ids[i] = s
	}
	return database.ReorderLayers(workspaceID, ids)
}

func handleAddHighlight(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	layerID, err := assertString(payload, "layerId")
	if err != nil {
		return err
	}
	h, err := assertMap(payload, "highlight")
	if err != nil {
		return err
	}
	id, err := assertString(h, "id")
	if err != nil {
		return err
	}
	editorIndex, err := assertFloat64(h, "editorIndex")
	if err != nil {
		return err
	}
	from, err := assertFloat64(h, "from")
	if err != nil {
		return err
	}
	to, err := assertFloat64(h, "to")
	if err != nil {
		return err
	}
	return database.AddHighlight(
		layerID, id,
		int(editorIndex), int(from), int(to),
		stringOrDefault(h, "text", ""),
		stringOrDefault(h, "annotation", ""),
	)
}

func handleRemoveHighlight(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	layerID, err := assertString(payload, "layerId")
	if err != nil {
		return err
	}
	highlightID, err := assertString(payload, "highlightId")
	if err != nil {
		return err
	}
	return database.RemoveHighlight(layerID, highlightID)
}

func handleUpdateHighlightAnnotation(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	layerID, err := assertString(payload, "layerId")
	if err != nil {
		return err
	}
	highlightID, err := assertString(payload, "highlightId")
	if err != nil {
		return err
	}
	annotation, err := assertString(payload, "annotation")
	if err != nil {
		return err
	}
	return database.UpdateHighlightAnnotation(layerID, highlightID, annotation)
}

func handleAddArrow(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	layerID, err := assertString(payload, "layerId")
	if err != nil {
		return err
	}
	arrow, err := assertMap(payload, "arrow")
	if err != nil {
		return err
	}
	id, err := assertString(arrow, "id")
	if err != nil {
		return err
	}
	fromEndpoint, err := assertMap(arrow, "from")
	if err != nil {
		return err
	}
	toEndpoint, err := assertMap(arrow, "to")
	if err != nil {
		return err
	}
	fromEditorIndex, err := assertFloat64(fromEndpoint, "editorIndex")
	if err != nil {
		return err
	}
	fromStart, err := assertFloat64(fromEndpoint, "from")
	if err != nil {
		return err
	}
	fromEnd, err := assertFloat64(fromEndpoint, "to")
	if err != nil {
		return err
	}
	toEditorIndex, err := assertFloat64(toEndpoint, "editorIndex")
	if err != nil {
		return err
	}
	toStart, err := assertFloat64(toEndpoint, "from")
	if err != nil {
		return err
	}
	toEnd, err := assertFloat64(toEndpoint, "to")
	if err != nil {
		return err
	}
	return database.AddArrow(
		layerID, id,
		int(fromEditorIndex), int(fromStart), int(fromEnd), stringOrDefault(fromEndpoint, "text", ""),
		int(toEditorIndex), int(toStart), int(toEnd), stringOrDefault(toEndpoint, "text", ""),
	)
}

func handleRemoveArrow(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	layerID, err := assertString(payload, "layerId")
	if err != nil {
		return err
	}
	arrowID, err := assertString(payload, "arrowId")
	if err != nil {
		return err
	}
	return database.RemoveArrow(layerID, arrowID)
}

func handleUpdateArrowStyle(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	layerID, err := assertString(payload, "layerId")
	if err != nil {
		return err
	}
	arrowID, err := assertString(payload, "arrowId")
	if err != nil {
		return err
	}
	arrowStyle, err := assertString(payload, "arrowStyle")
	if err != nil {
		return err
	}
	return database.UpdateArrowStyle(layerID, arrowID, arrowStyle)
}

func handleAddUnderline(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	layerID, err := assertString(payload, "layerId")
	if err != nil {
		return err
	}
	u, err := assertMap(payload, "underline")
	if err != nil {
		return err
	}
	id, err := assertString(u, "id")
	if err != nil {
		return err
	}
	editorIndex, err := assertFloat64(u, "editorIndex")
	if err != nil {
		return err
	}
	from, err := assertFloat64(u, "from")
	if err != nil {
		return err
	}
	to, err := assertFloat64(u, "to")
	if err != nil {
		return err
	}
	return database.AddUnderline(
		layerID, id,
		int(editorIndex), int(from), int(to),
		stringOrDefault(u, "text", ""),
	)
}

func handleRemoveUnderline(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	layerID, err := assertString(payload, "layerId")
	if err != nil {
		return err
	}
	underlineID, err := assertString(payload, "underlineId")
	if err != nil {
		return err
	}
	return database.RemoveUnderline(layerID, underlineID)
}

func handleAddEditor(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	index, err := assertFloat64(payload, "index")
	if err != nil {
		return err
	}
	name, err := assertString(payload, "name")
	if err != nil {
		return err
	}
	return database.AddEditor(workspaceID, int(index), name)
}

func handleRemoveEditor(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	index, err := assertFloat64(payload, "index")
	if err != nil {
		return err
	}
	return database.RemoveEditor(workspaceID, int(index))
}

func handleUpdateSectionName(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	index, err := assertFloat64(payload, "index")
	if err != nil {
		return err
	}
	name, err := assertString(payload, "name")
	if err != nil {
		return err
	}
	return database.UpdateSectionName(workspaceID, int(index), name)
}

func handleToggleSectionVisibility(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	index, err := assertFloat64(payload, "index")
	if err != nil {
		return err
	}
	return database.ToggleSectionVisibility(workspaceID, int(index))
}

func handleReorderEditors(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	raw, err := assertSlice(payload, "permutation")
	if err != nil {
		return err
	}
	indices := make([]int, len(raw))
	for i, v := range raw {
		f, ok := v.(float64)
		if !ok {
			return fmt.Errorf("permutation[%d]: expected float64, got %T", i, v)
		}
		indices[i] = int(f)
	}
	return database.ReorderEditors(workspaceID, indices)
}

func handleUpdateEditorContent(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	editorIndex, err := assertFloat64(payload, "editorIndex")
	if err != nil {
		return err
	}
	if payload["contentJson"] == nil {
		return fmt.Errorf("key %q: missing", "contentJson")
	}
	return database.UpdateEditorContent(workspaceID, int(editorIndex), payload["contentJson"])
}

func stringOrDefault(m map[string]interface{}, key, def string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return def
}
