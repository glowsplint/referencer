package models

import (
	"encoding/json"
	"testing"
)

func TestWorkspaceStateJSON(t *testing.T) {
	state := WorkspaceState{
		WorkspaceID: "ws-123",
		Layers: []Layer{
			{
				ID:      "l1",
				Name:    "Layer 1",
				Color:   "#ff0000",
				Visible: true,
				Highlights: []Highlight{
					{ID: "h1", EditorIndex: 0, From: 10, To: 20, Text: "hello", Annotation: "note", Type: "highlight"},
				},
				Arrows: []Arrow{
					{
						ID:         "a1",
						From:       ArrowEndpoint{EditorIndex: 0, From: 5, To: 10, Text: "src"},
						To:         ArrowEndpoint{EditorIndex: 1, From: 20, To: 25, Text: "dst"},
						ArrowStyle: "dashed",
					},
				},
				Underlines: []Underline{
					{ID: "u1", EditorIndex: 0, From: 15, To: 25, Text: "underlined"},
				},
			},
		},
		Editors: []Editor{
			{Index: 0, Name: "Passage 1", Visible: true, ContentJSON: map[string]interface{}{"type": "doc"}},
		},
	}

	data, err := json.Marshal(state)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}

	// Verify camelCase field names.
	var raw map[string]interface{}
	json.Unmarshal(data, &raw)

	if _, ok := raw["workspaceId"]; !ok {
		t.Error("missing camelCase field 'workspaceId'")
	}
	if _, ok := raw["layers"]; !ok {
		t.Error("missing field 'layers'")
	}
	if _, ok := raw["editors"]; !ok {
		t.Error("missing field 'editors'")
	}

	// Round-trip.
	var decoded WorkspaceState
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if decoded.WorkspaceID != "ws-123" {
		t.Errorf("WorkspaceID = %q, want %q", decoded.WorkspaceID, "ws-123")
	}
	if len(decoded.Layers) != 1 {
		t.Fatalf("Layers length = %d, want 1", len(decoded.Layers))
	}
	if len(decoded.Layers[0].Highlights) != 1 {
		t.Errorf("Highlights length = %d, want 1", len(decoded.Layers[0].Highlights))
	}
	if len(decoded.Layers[0].Arrows) != 1 {
		t.Errorf("Arrows length = %d, want 1", len(decoded.Layers[0].Arrows))
	}
	if decoded.Layers[0].Arrows[0].ArrowStyle != "dashed" {
		t.Errorf("ArrowStyle = %q, want %q", decoded.Layers[0].Arrows[0].ArrowStyle, "dashed")
	}
	if len(decoded.Layers[0].Underlines) != 1 {
		t.Errorf("Underlines length = %d, want 1", len(decoded.Layers[0].Underlines))
	}
}

func TestOmitemptyBehavior(t *testing.T) {
	t.Run("ArrowStyle omitempty", func(t *testing.T) {
		arrow := Arrow{
			ID:   "a1",
			From: ArrowEndpoint{EditorIndex: 0, From: 0, To: 5, Text: "src"},
			To:   ArrowEndpoint{EditorIndex: 0, From: 10, To: 15, Text: "dst"},
		}
		data, _ := json.Marshal(arrow)
		var raw map[string]interface{}
		json.Unmarshal(data, &raw)
		if _, ok := raw["arrowStyle"]; ok {
			t.Error("arrowStyle should be omitted when empty")
		}
	})

	t.Run("ArrowStyle present when set", func(t *testing.T) {
		arrow := Arrow{
			ID:         "a1",
			From:       ArrowEndpoint{EditorIndex: 0, From: 0, To: 5, Text: "src"},
			To:         ArrowEndpoint{EditorIndex: 0, From: 10, To: 15, Text: "dst"},
			ArrowStyle: "dashed",
		}
		data, _ := json.Marshal(arrow)
		var raw map[string]interface{}
		json.Unmarshal(data, &raw)
		if raw["arrowStyle"] != "dashed" {
			t.Errorf("arrowStyle = %v, want %q", raw["arrowStyle"], "dashed")
		}
	})

	t.Run("Highlight Type omitempty", func(t *testing.T) {
		hl := Highlight{ID: "h1", EditorIndex: 0, From: 0, To: 5, Text: "x", Annotation: ""}
		data, _ := json.Marshal(hl)
		var raw map[string]interface{}
		json.Unmarshal(data, &raw)
		if _, ok := raw["type"]; ok {
			t.Error("type should be omitted when empty")
		}
	})

	t.Run("Highlight Type present when set", func(t *testing.T) {
		hl := Highlight{ID: "h1", EditorIndex: 0, From: 0, To: 5, Text: "x", Annotation: "", Type: "highlight"}
		data, _ := json.Marshal(hl)
		var raw map[string]interface{}
		json.Unmarshal(data, &raw)
		if raw["type"] != "highlight" {
			t.Errorf("type = %v, want %q", raw["type"], "highlight")
		}
	})
}

func TestClientMessageJSON(t *testing.T) {
	msg := ClientMessage{
		Type:      "addLayer",
		Payload:   map[string]interface{}{"id": "l1", "name": "Layer 1", "color": "#ff0000"},
		RequestID: "req-123",
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}

	var decoded ClientMessage
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if decoded.Type != "addLayer" {
		t.Errorf("Type = %q, want %q", decoded.Type, "addLayer")
	}
	if decoded.RequestID != "req-123" {
		t.Errorf("RequestID = %q, want %q", decoded.RequestID, "req-123")
	}
	if decoded.Payload["id"] != "l1" {
		t.Errorf("Payload[id] = %v, want %q", decoded.Payload["id"], "l1")
	}
}

func TestClientMessage_OmitRequestID(t *testing.T) {
	msg := ClientMessage{
		Type:    "addLayer",
		Payload: map[string]interface{}{},
	}
	data, _ := json.Marshal(msg)
	var raw map[string]interface{}
	json.Unmarshal(data, &raw)
	if _, ok := raw["requestId"]; ok {
		t.Error("requestId should be omitted when empty")
	}
}

func TestServerMessageJSON(t *testing.T) {
	msg := ServerMessage{
		Type:           "action",
		Payload:        map[string]interface{}{"actionType": "addLayer"},
		SourceClientID: "client-abc",
		RequestID:      "req-456",
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}

	var decoded ServerMessage
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if decoded.Type != "action" {
		t.Errorf("Type = %q, want %q", decoded.Type, "action")
	}
	if decoded.SourceClientID != "client-abc" {
		t.Errorf("SourceClientID = %q, want %q", decoded.SourceClientID, "client-abc")
	}

	// Verify camelCase in JSON.
	var raw map[string]interface{}
	json.Unmarshal(data, &raw)
	if _, ok := raw["sourceClientId"]; !ok {
		t.Error("missing camelCase field 'sourceClientId'")
	}
}

func TestServerMessage_OmitEmpty(t *testing.T) {
	msg := ServerMessage{Type: "ack"}
	data, _ := json.Marshal(msg)
	var raw map[string]interface{}
	json.Unmarshal(data, &raw)

	if _, ok := raw["payload"]; ok {
		t.Error("payload should be omitted when nil")
	}
	if _, ok := raw["sourceClientId"]; ok {
		t.Error("sourceClientId should be omitted when empty")
	}
	if _, ok := raw["requestId"]; ok {
		t.Error("requestId should be omitted when empty")
	}
}

func TestShareRequestJSON(t *testing.T) {
	req := ShareRequest{WorkspaceID: "ws1", Access: "edit"}
	data, _ := json.Marshal(req)
	var decoded ShareRequest
	json.Unmarshal(data, &decoded)
	if decoded.WorkspaceID != "ws1" || decoded.Access != "edit" {
		t.Errorf("decoded = %+v", decoded)
	}
}

func TestShareResponseJSON(t *testing.T) {
	resp := ShareResponse{Code: "abc123", URL: "/s/abc123"}
	data, _ := json.Marshal(resp)
	var raw map[string]interface{}
	json.Unmarshal(data, &raw)
	if raw["code"] != "abc123" {
		t.Errorf("code = %v", raw["code"])
	}
	if raw["url"] != "/s/abc123" {
		t.Errorf("url = %v", raw["url"])
	}
}
