package models

// WorkspaceState is sent on WebSocket connect.
type WorkspaceState struct {
	WorkspaceID string   `json:"workspaceId"`
	Layers      []Layer  `json:"layers"`
	Editors     []Editor `json:"editors"`
}

type Layer struct {
	ID         string      `json:"id"`
	Name       string      `json:"name"`
	Color      string      `json:"color"`
	Visible    bool        `json:"visible"`
	Highlights []Highlight `json:"highlights"`
	Arrows     []Arrow     `json:"arrows"`
	Underlines []Underline `json:"underlines"`
}

type Highlight struct {
	ID          string `json:"id"`
	EditorIndex int    `json:"editorIndex"`
	From        int    `json:"from"`
	To          int    `json:"to"`
	Text        string `json:"text"`
	Annotation  string `json:"annotation"`
	Type        string `json:"type,omitempty"`
}

type ArrowEndpoint struct {
	EditorIndex int    `json:"editorIndex"`
	From        int    `json:"from"`
	To          int    `json:"to"`
	Text        string `json:"text"`
}

type Arrow struct {
	ID         string        `json:"id"`
	From       ArrowEndpoint `json:"from"`
	To         ArrowEndpoint `json:"to"`
	ArrowStyle string        `json:"arrowStyle,omitempty"`
}

type Underline struct {
	ID          string `json:"id"`
	EditorIndex int    `json:"editorIndex"`
	From        int    `json:"from"`
	To          int    `json:"to"`
	Text        string `json:"text"`
}

type Editor struct {
	Index       int         `json:"index"`
	Name        string      `json:"name"`
	Visible     bool        `json:"visible"`
	ContentJSON interface{} `json:"contentJson"`
}

// ClientMessage is a WebSocket message from the frontend.
type ClientMessage struct {
	Type      string                 `json:"type"`
	Payload   map[string]interface{} `json:"payload"`
	RequestID string                 `json:"requestId,omitempty"`
}

// ServerMessage is a WebSocket message to the frontend.
type ServerMessage struct {
	Type           string                 `json:"type"`
	Payload        map[string]interface{} `json:"payload,omitempty"`
	SourceClientID string                 `json:"sourceClientId,omitempty"`
	RequestID      string                 `json:"requestId,omitempty"`
}

// ShareRequest is the REST API share creation request.
type ShareRequest struct {
	WorkspaceID string `json:"workspaceId"`
	Access      string `json:"access"`
}

// ShareResponse is the REST API share creation response.
type ShareResponse struct {
	Code string `json:"code"`
	URL  string `json:"url"`
}
