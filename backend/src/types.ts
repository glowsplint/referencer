export interface WorkspaceState {
  workspaceId: string;
  layers: Layer[];
  editors: Editor[];
}

export interface Layer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  highlights: Highlight[];
  arrows: Arrow[];
  underlines: Underline[];
}

export interface Highlight {
  id: string;
  editorIndex: number;
  from: number;
  to: number;
  text: string;
  annotation: string;
  type?: string;
}

export interface ArrowEndpoint {
  editorIndex: number;
  from: number;
  to: number;
  text: string;
}

export interface Arrow {
  id: string;
  from: ArrowEndpoint;
  to: ArrowEndpoint;
  arrowStyle?: string;
}

export interface Underline {
  id: string;
  editorIndex: number;
  from: number;
  to: number;
  text: string;
}

export interface Editor {
  index: number;
  name: string;
  visible: boolean;
  contentJson: unknown;
}

export interface ClientMessage {
  type: string;
  payload: Record<string, unknown>;
  requestId?: string;
}

export interface ServerMessage {
  type: string;
  payload?: Record<string, unknown>;
  sourceClientId?: string;
  requestId?: string;
}

export interface ShareRequest {
  workspaceId: string;
  access: string;
}

export interface ShareResponse {
  code: string;
  url: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}
