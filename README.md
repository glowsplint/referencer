# Referencer [![react](https://badges.aleen42.com/src/react.svg)](https://badges.aleen42.com/src/react.svg) [![typescript](https://badges.aleen42.com/src/typescript.svg)](https://badges.aleen42.com/src/typescript.svg) [![Go](https://img.shields.io/badge/Go-1.24+-00ADD8?logo=go&logoColor=white)](https://go.dev/)

Referencer is a web-based online Bible study annotation tool that makes it easy to cross-reference multiple passages from different parts of the Bible. The frontend is built with React 19, TypeScript, and TipTap 3. The backend is written in Go.

## Features

- **Multi-passage view** -- open multiple Bible passages side-by-side in separate editor panels
- **Highlights & annotations** -- select text to highlight with colors and attach inline notes
- **Arrows** -- draw connections between words across different passages
- **Layers** -- organize highlights and arrows into named, colored, toggleable layers
- **PDF export** -- export the current workspace to a styled PDF
- **Real-time collaboration** -- WebSocket-based sync across multiple clients
- **Share links** -- generate read-only or editable share URLs

## Tech Stack

| Layer           | Technology                                    |
| --------------- | --------------------------------------------- |
| Frontend        | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| Rich text       | TipTap 3 (ProseMirror) with custom extensions |
| Backend         | Go, Chi router, SQLite                       |
| Real-time       | WebSocket (Gorilla + custom client)           |
| Testing         | Vitest + React Testing Library, Playwright    |
| Package manager | Bun                                           |

## Project Structure

```
referencer/
├── frontend/                  # React SPA
│   └── src/
│       ├── components/        # 17 main components + tiptap template components
│       ├── hooks/             # 42 custom hooks
│       ├── lib/               # Utilities, TipTap extensions, WebSocket client
│       ├── contexts/          # WorkspaceContext (central state)
│       ├── types/             # TypeScript type definitions
│       └── e2e/               # 28 Playwright test files
├── backend/                   # Go backend server
│   ├── internal/
│   │   ├── api/               # REST handlers (share links, Bible proxy)
│   │   ├── db/                # SQLite database layer and migrations
│   │   ├── models/            # Data models and JSON serialization
│   │   └── ws/                # WebSocket handler and connection manager
│   └── go.mod
└── Makefile                   # Build commands
```

## Frontend Architecture

### Components

| Category | Components                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Panels   | `ButtonPane` (toolbar), `ManagementPane` (layers/sections), `AnnotationPanel` (highlight notes), `ActionConsole` (history log) |
| Overlays | `ArrowOverlay` (SVG arrow rendering), `SelectionRingOverlay` (drag selection visual)                                           |
| Dialogs  | `FAQDialog`, `KeyboardShortcutsDialog`, `SettingsDialog`, `ShareDialog`, `MobileInfoDialog`                                    |
| Pickers  | `ColorPicker`, `ArrowStylePicker`                                                                                              |
| Display  | `StatusBar`, `SectionList`, `LayerRow`, `AnnotationCard`                                                                       |

### Hooks (42 hooks, by category)

**Editor state** -- `useEditorWorkspace`, `useEditors`, `useLayers`, `useTrackedEditors`, `useTrackedLayers`, `useActionHistory`, `useActionConsole`, `useSettings`, `useWebSocket`

**Tools & modes** -- `useHighlightMode`, `useUnderlineMode`, `useDrawingMode`, `useCommentMode`, `useEraserMode`, `useDragSelection`, `useWordSelection`, `useInlineEdit`, `useCycleLayer`

**Decorations & visual** -- `useUnifiedDecorations`, `useSelectionDecoration`, `useSelectionHighlight`, `useSimilarTextHighlight`, `useLayerUnderlineDecorations`, `useAllHighlightPositions`, `useWordHover`, `useCursorVisibility`

**Keyboard & shortcuts** -- `useToolShortcuts`, `useToggleShortcuts`, `useUndoRedoKeyboard`, `useMenuNavigation`

**Utilities** -- `useStatusMessage`, `useCustomColors`, `usePositionMapping`, `useIsBreakpoint`, `useWindowSize`, `useElementRect`, `useComposedRef`, `useScrolling`, `useThrottledCallback`, `useUnmount`, `useTiptapEditor`

### State Management

`WorkspaceContext` is the central state provider, wrapping the return value of `useEditorWorkspace`. This hook manages:

- Editor instances (passages, content, names)
- Layers (with highlights, arrows, colors, visibility)
- Sections (passage grouping and visibility)
- Action history (undo/redo stack)
- WebSocket synchronization

### TipTap Integration

**Custom ProseMirror plugins** (`lib/tiptap/extensions/`):

- `arrow-lines-plugin` -- renders arrow connection points in editors
- `layer-highlights` -- applies highlight decorations per layer
- `layer-underlines` -- applies underline decorations per layer
- `similar-text-highlights` -- highlights matching text across editors
- `word-hover` / `word-selection` -- custom word-level interaction

**Utilities** (`lib/tiptap/`): text matching, word boundary detection, word collection, schema definitions, selection helpers

## Backend

Go server (Chi router) with two roles:

1. **WebSocket collaboration** -- manages per-workspace connections, broadcasts actions (highlights, arrows, layers, editor content) to connected clients
2. **Share links** -- creates and resolves short share codes with read-only or edit access

Uses SQLite with WAL mode for persistence.

## Development

### Requirements

- [Bun](https://bun.sh/) -- frontend package management and dev server
- [Go 1.24+](https://go.dev/) -- backend server
- [Node.js](https://nodejs.org/) -- running Playwright e2e tests

### Frontend only (hot reload)

```bash
cd frontend
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Full stack (hot reload)

1. Start the Go backend (see below) on port 5000
2. `cd frontend && bun run dev` -- starts Vite on port 5173
3. Open [http://localhost:5173](http://localhost:5173) -- frontend hot reloads, `/api/*` proxies to backend

### Production build

```bash
make build    # cd frontend && bun run build
```

### Backend setup

```bash
cd backend
go build ./...
```

## Testing

```bash
cd frontend

# Unit tests (Vitest + React Testing Library)
bun run test:run

# E2E tests (Playwright)
bun run test:e2e

# Watch mode
bun run test
```

## Controls

| Action              | Input                                                    |
| ------------------- | -------------------------------------------------------- |
| Select words        | Click or drag on text                                    |
| Draw arrow          | Hold `Ctrl`/`Cmd` + drag between words                   |
| Highlight selection | Select text, then click highlight tool or press `H`      |
| Underline selection | Select text, then press `U`                              |
| Add annotation      | Select text, then press `N`                              |
| Erase               | Press `E` to toggle eraser, then click highlights/arrows |
| Cycle active layer  | Press `Tab`                                              |
| Undo / Redo         | `Ctrl+Z` / `Ctrl+Shift+Z`                                |

---

# Architecture

## System Overview

| Component | Technology                                            |
| --------- | ----------------------------------------------------- |
| Frontend  | React 19 + TypeScript + Vite + TailwindCSS + TipTap 3 |
| Backend   | Go (chi router)                                       |
| Database  | SQLite with WAL mode                                  |
| Real-time | WebSocket for multi-client collaboration              |
## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   Clients                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Browser 1│  │ Browser 2│  │ Browser N│      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │              │            │
│       └──────────────┼──────────────┘            │
│                      │                           │
│              WebSocket + HTTP                    │
└──────────────────────┼───────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────┐
│                 Go Backend                        │
│  ┌───────────────────┴────────────────────────┐  │
│  │              Chi Router                     │  │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────────┐ │  │
│  │  │WebSocket│ │ REST API │ │Static Files │ │  │
│  │  │Handler  │ │ Handlers │ │  Server     │ │  │
│  │  └────┬────┘ └────┬─────┘ └─────────────┘ │  │
│  └───────┼───────────┼────────────────────────┘  │
│          │           │                            │
│  ┌───────┴───────────┴────────────────────────┐  │
│  │         Connection Manager                  │  │
│  │    (workspace → clients mapping)            │  │
│  └───────────────────┬────────────────────────┘  │
│                      │                            │
│  ┌───────────────────┴────────────────────────┐  │
│  │           SQLite Database                   │  │
│  │  workspace | layer | highlight | arrow      │  │
│  │  editor | share_link | schema_version       │  │
│  └────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

## Real-time Collaboration Protocol

Referencer uses WebSocket connections for real-time multi-client collaboration within a workspace.

### Connection lifecycle

1. Client opens a WebSocket connection to `/ws/{workspaceId}`
2. Server assigns the client a unique `clientId` (UUID)
3. Server sends the full workspace state as an initial `state` message
4. Client sends actions; server persists each to the database, then broadcasts to all other connected clients

### Message format

**Client to server:**

```json
{
  "type": "<actionType>",
  "payload": { ... },
  "requestId": "optional-correlation-id"
}
```

**Server to client:**

```json
{
  "type": "state | action | ack | error",
  "payload": { ... },
  "sourceClientId": "uuid-of-originating-client",
  "requestId": "echoed-correlation-id"
}
```

### Action types

| Action                      | Description                               |
| --------------------------- | ----------------------------------------- |
| `addLayer`                  | Create a new annotation layer             |
| `removeLayer`               | Delete a layer and its highlights/arrows  |
| `updateLayerName`           | Rename a layer                            |
| `updateLayerColor`          | Change a layer's color                    |
| `toggleLayerVisibility`     | Show/hide a layer                         |
| `reorderLayers`             | Reorder layers by ID list                 |
| `addHighlight`              | Add a text highlight to a layer           |
| `removeHighlight`           | Remove a highlight                        |
| `updateHighlightAnnotation` | Edit a highlight's annotation text        |
| `addArrow`                  | Draw an arrow between two text selections |
| `removeArrow`               | Remove an arrow                           |
| `addEditor`                 | Add a new passage editor panel            |
| `removeEditor`              | Remove a passage editor panel             |
| `updateSectionName`         | Rename a passage panel                    |
| `toggleSectionVisibility`   | Show/hide a passage panel                 |
| `updateEditorContent`       | Update the rich text content of a passage |

### Message flow

```
Client A                    Server                    Client B
   │                          │                          │
   │──── action ─────────────>│                          │
   │                          │── persist to DB          │
   │<──── ack ────────────────│                          │
   │                          │──── broadcast action ───>│
   │                          │                          │
```

## WebSocket Scalability

**Current approach:** Single-server WebSocket with in-memory connection tracking. The `ConnectionManager` maps workspace IDs to connected client WebSockets.

**Why it works:** Bible study groups are typically small (2-20 people), so a single server handles the load well.

**Scaling options for the future:**

- **Vertical:** A single Go server can handle 10,000+ concurrent WebSocket connections with minimal resource usage
- **Horizontal:** Add Redis Pub/Sub for cross-instance message broadcasting if multiple server instances are needed

**Alternative protocols considered:**

- **SSE (Server-Sent Events):** Simpler but unidirectional; would require separate POST endpoints for every mutation
- **CRDTs:** Overkill for this use case since operations are discrete (add/remove/update), not collaborative text editing of the same document
- **WebSocket was chosen** because it provides bidirectional real-time communication with low latency and clean semantics for the action/broadcast pattern

## Database Schema

All data is stored in SQLite with WAL mode enabled and foreign keys enforced. The schema is managed through numbered SQL migration files.

### `workspace`

| Column       | Type      | Description                              |
| ------------ | --------- | ---------------------------------------- |
| `id`         | TEXT (PK) | Workspace identifier                     |
| `created_at` | TEXT      | Timestamp, defaults to `datetime('now')` |

### `layer`

| Column         | Type                   | Description                      |
| -------------- | ---------------------- | -------------------------------- |
| `id`           | TEXT (PK)              | Layer identifier                 |
| `workspace_id` | TEXT (FK -> workspace) | Parent workspace, CASCADE delete |
| `name`         | TEXT                   | Display name                     |
| `color`        | TEXT                   | CSS color value                  |
| `visible`      | INTEGER                | Boolean (0/1)                    |
| `position`     | INTEGER                | Sort order within workspace      |

### `highlight`

| Column         | Type               | Description                                  |
| -------------- | ------------------ | -------------------------------------------- |
| `id`           | TEXT (PK)          | Highlight identifier                         |
| `layer_id`     | TEXT (FK -> layer) | Parent layer, CASCADE delete                 |
| `editor_index` | INTEGER            | Which editor panel this highlight belongs to |
| `from`         | INTEGER            | Start offset in editor content               |
| `to`           | INTEGER            | End offset in editor content                 |
| `text`         | TEXT               | Selected text content                        |
| `annotation`   | TEXT               | User-written annotation                      |

### `arrow`

| Column              | Type               | Description                   |
| ------------------- | ------------------ | ----------------------------- |
| `id`                | TEXT (PK)          | Arrow identifier              |
| `layer_id`          | TEXT (FK -> layer) | Parent layer, CASCADE delete  |
| `from_editor_index` | INTEGER            | Source editor panel           |
| `from_start`        | INTEGER            | Source selection start offset |
| `from_end`          | INTEGER            | Source selection end offset   |
| `from_text`         | TEXT               | Source selected text          |
| `to_editor_index`   | INTEGER            | Target editor panel           |
| `to_start`          | INTEGER            | Target selection start offset |
| `to_end`            | INTEGER            | Target selection end offset   |
| `to_text`           | TEXT               | Target selected text          |

### `editor`

| Column         | Type                   | Description                            |
| -------------- | ---------------------- | -------------------------------------- |
| `id`           | INTEGER (PK, auto)     | Internal row ID                        |
| `workspace_id` | TEXT (FK -> workspace) | Parent workspace, CASCADE delete       |
| `index_pos`    | INTEGER                | Display order position                 |
| `name`         | TEXT                   | Panel header name (default: "Passage") |
| `visible`      | INTEGER                | Boolean (0/1)                          |
| `content_json` | TEXT                   | TipTap JSON document content           |

### `share_link`

| Column         | Type                   | Description                                 |
| -------------- | ---------------------- | ------------------------------------------- |
| `code`         | TEXT (PK)              | 6-character alphanumeric code               |
| `workspace_id` | TEXT (FK -> workspace) | Linked workspace, CASCADE delete            |
| `access`       | TEXT                   | `'edit'` or `'readonly'` (CHECK constraint) |
| `created_at`   | TEXT                   | Timestamp, defaults to `datetime('now')`    |

### `schema_version`

| Column    | Type         | Description              |
| --------- | ------------ | ------------------------ |
| `version` | INTEGER (PK) | Migration version number |

## API Reference

### WebSocket

| Endpoint                | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `GET /ws/{workspaceId}` | Upgrade to WebSocket connection for real-time collaboration |

### REST

| Method | Endpoint       | Description                                                                                                                  |
| ------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/share`   | Create a share link. Body: `{"workspaceId": "...", "access": "edit\|readonly"}`. Returns: `{"code": "...", "url": "/s/..."}` |
| `GET`  | `/s/{code}`    | Resolve a share link. Redirects to the workspace (with `?access=readonly` if applicable)                                     |

### Static files

The backend serves the built frontend SPA. All unmatched routes fall through to `index.html` for client-side routing.

## Development Setup

### Prerequisites

- **Go 1.24+** for the backend
- **Bun** for frontend package management
- **Node.js** for running Playwright e2e tests

### Backend

```bash
cd backend
go build ./...
DATABASE_PATH=./data/referencer.db DEVELOPMENT_MODE=1 go run ./...
```

The server starts on port 5000 by default.

### Frontend

```bash
cd frontend
bun install
bun run dev
```

The Vite dev server starts on port 5173 with hot reloading. API and WebSocket requests are proxied to the backend on port 5000.

### Running tests

```bash
# Unit tests (Vitest + React Testing Library)
cd frontend
bun run test:run

# E2e tests (Playwright)
cd frontend
bun run test:e2e
```

### Environment variables

| Variable           | Default                                       | Description                                               |
| ------------------ | --------------------------------------------- | --------------------------------------------------------- |
| `PORT`             | `5000`                                        | Server listen port                                        |
| `DATABASE_PATH`    | `./data/referencer.db`                        | SQLite database file path                                 |
| `CORS_ORIGINS`     | `http://127.0.0.1:5000,http://localhost:5173` | Allowed CORS origins (comma-separated)                    |
| `DEVELOPMENT_MODE` | (unset)                                       | When set, enables development mode                        |

## Project Structure

```
referencer/
├── backend/                  # Go backend
│   ├── internal/
│   │   ├── api/              # REST handlers (share links, Bible proxy)
│   │   ├── db/               # SQLite database layer and migrations
│   │   ├── models/           # Data models and JSON serialization
│   │   └── ws/               # WebSocket handler and connection manager
│   └── go.mod
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # UI components (toolbar, layers, editors, arrows)
│   │   ├── contexts/         # React contexts (workspace state)
│   │   ├── hooks/            # Custom hooks (WebSocket, annotations, layers)
│   │   ├── lib/              # WebSocket client, utilities
│   │   └── types/            # TypeScript type definitions
│   ├── e2e/                  # Playwright end-to-end tests
│   └── package.json
├── data/                     # SQLite database and development fixtures
├── Makefile                  # Build and run commands
└── README.md
```
