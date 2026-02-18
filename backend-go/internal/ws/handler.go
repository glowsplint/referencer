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
	targets := make(map[string]*websocket.Conn, len(clients))
	for id, conn := range clients {
		if id != excludeClient {
			targets[id] = conn
		}
	}
	cm.mu.RUnlock()

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("broadcast marshal error: %v", err)
		return
	}
	for cid, conn := range targets {
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("failed to send to client %s: %v", cid, err)
		}
	}
}

// actionHandler processes a client action by persisting it to the database.
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
	return database.AddLayer(
		workspaceID,
		payload["id"].(string),
		payload["name"].(string),
		payload["color"].(string),
	)
}

func handleRemoveLayer(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.RemoveLayer(workspaceID, payload["id"].(string))
}

func handleUpdateLayerName(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.UpdateLayerName(workspaceID, payload["id"].(string), payload["name"].(string))
}

func handleUpdateLayerColor(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.UpdateLayerColor(workspaceID, payload["id"].(string), payload["color"].(string))
}

func handleToggleLayerVisibility(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.ToggleLayerVisibility(workspaceID, payload["id"].(string))
}

func handleReorderLayers(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	raw := payload["layerIds"].([]interface{})
	ids := make([]string, len(raw))
	for i, v := range raw {
		ids[i] = v.(string)
	}
	return database.ReorderLayers(workspaceID, ids)
}

func handleAddHighlight(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	layerID := payload["layerId"].(string)
	h := payload["highlight"].(map[string]interface{})
	return database.AddHighlight(
		layerID,
		h["id"].(string),
		int(h["editorIndex"].(float64)),
		int(h["from"].(float64)),
		int(h["to"].(float64)),
		stringOrDefault(h, "text", ""),
		stringOrDefault(h, "annotation", ""),
	)
}

func handleRemoveHighlight(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.RemoveHighlight(payload["layerId"].(string), payload["highlightId"].(string))
}

func handleUpdateHighlightAnnotation(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.UpdateHighlightAnnotation(
		payload["layerId"].(string),
		payload["highlightId"].(string),
		payload["annotation"].(string),
	)
}

func handleAddArrow(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	arrow := payload["arrow"].(map[string]interface{})
	return database.AddArrow(
		payload["layerId"].(string),
		arrow["id"].(string),
		arrow["from"].(map[string]interface{}),
		arrow["to"].(map[string]interface{}),
	)
}

func handleRemoveArrow(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.RemoveArrow(payload["layerId"].(string), payload["arrowId"].(string))
}

func handleUpdateArrowStyle(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.UpdateArrowStyle(
		payload["layerId"].(string),
		payload["arrowId"].(string),
		payload["arrowStyle"].(string),
	)
}

func handleAddUnderline(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	layerID := payload["layerId"].(string)
	u := payload["underline"].(map[string]interface{})
	return database.AddUnderline(
		layerID,
		u["id"].(string),
		int(u["editorIndex"].(float64)),
		int(u["from"].(float64)),
		int(u["to"].(float64)),
		stringOrDefault(u, "text", ""),
	)
}

func handleRemoveUnderline(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.RemoveUnderline(payload["layerId"].(string), payload["underlineId"].(string))
}

func handleAddEditor(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.AddEditor(workspaceID, int(payload["index"].(float64)), payload["name"].(string))
}

func handleRemoveEditor(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.RemoveEditor(workspaceID, int(payload["index"].(float64)))
}

func handleUpdateSectionName(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.UpdateSectionName(workspaceID, int(payload["index"].(float64)), payload["name"].(string))
}

func handleToggleSectionVisibility(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.ToggleSectionVisibility(workspaceID, int(payload["index"].(float64)))
}

func handleReorderEditors(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	raw := payload["permutation"].([]interface{})
	indices := make([]int, len(raw))
	for i, v := range raw {
		indices[i] = int(v.(float64))
	}
	return database.ReorderEditors(workspaceID, indices)
}

func handleUpdateEditorContent(database *db.DB, workspaceID string, payload map[string]interface{}) error {
	return database.UpdateEditorContent(
		workspaceID,
		int(payload["editorIndex"].(float64)),
		payload["contentJson"],
	)
}

func stringOrDefault(m map[string]interface{}, key, def string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return def
}
