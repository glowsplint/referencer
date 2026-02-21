# Architecture

## System Overview

Referencer is composed of three independently-running services:

1. **Frontend** -- React 19 SPA served by Vite in development and by the backend in production.
2. **Backend** -- TypeScript server (Bun + Hono) handling REST API, OAuth2 auth, and share links.
3. **Collab server** -- Node.js y-websocket server providing CRDT synchronization with LevelDB persistence.

```
┌─────────────────────────────────────────────────────────────┐
│                         Browsers                            │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│    │ Client A │    │ Client B │    │ Client N │            │
│    └────┬─────┘    └────┬─────┘    └────┬─────┘            │
│         │               │               │                   │
│         └───────────────┼───────────────┘                   │
│                         │                                   │
│              HTTP + WebSocket connections                    │
└─────────────────────────┼───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
   ┌───────────┐   ┌───────────┐   ┌──────────────┐
   │  Backend   │   │  Collab   │   │   Vite Dev   │
   │  :5000     │   │  Server   │   │   Server     │
   │            │   │  :4444    │   │   :5173      │
   │ Hono API   │   │           │   │  (dev only)  │
   │ OAuth2     │   │ y-ws sync │   │              │
   │ Share links│   │ LevelDB   │   │ Proxies to   │
   │            │   │           │   │ backend and  │
   │ Static SPA │   │           │   │ collab server│
   │            │   │           │   │              │
   │ ┌────────┐ │   │ ┌───────┐│   └──────────────┘
   │ │ SQLite │ │   │ │LevelDB││
   │ └────────┘ │   │ └───────┘│
   └───────────┘   └───────────┘
```

## Service Communication

### Development (Vite dev server on :5173)

The Vite dev server proxies requests to the other services:

| Path | Target | Protocol |
|------|--------|----------|
| `/api/*` | `http://localhost:5000` | HTTP |
| `/s/*` | `http://localhost:5000` | HTTP |
| `/auth/*` | `http://localhost:5000` | HTTP |
| `/yjs/*` | `ws://localhost:4444` | WebSocket (path stripped) |

### Production

The backend serves the built frontend SPA from `frontend/dist/`. The collab server runs separately. A reverse proxy (e.g. nginx) routes `/yjs` to the collab server on port 4444.

## Frontend Architecture

### State Management

`WorkspaceContext` is the central React context, wrapping the return value of `useEditorWorkspace`. This hook composes:

- **`useYjs`** -- Y.Doc and WebsocketProvider per workspace
- **`useYjsLayers`** -- CRDT-backed layer/annotation state (reads from Y.Doc, writes mutations to Y.Doc)
- **`useYjsUndo`** -- Y.UndoManager for collaborative undo/redo
- **`useYjsOffline`** -- IndexedDB persistence for offline support
- **`useEditors`** -- Editor pane management (local state, not yet CRDT)
- **`useSettings`** -- UI preferences (dark mode, layout, tool state)
- **`useActionHistory`** -- Command-pattern undo/redo for non-CRDT operations

All annotation data (layers, highlights, arrows, underlines) flows through the Y.Doc. Text content is synced via TipTap's `@tiptap/extension-collaboration` which binds directly to Yjs XmlFragments.

### Component Categories

| Category | Components |
|----------|------------|
| Panels | `ButtonPane` (toolbar), `ManagementPane` (layers/sections), `AnnotationPanel` (highlight notes), `ActionConsole` (history) |
| Overlays | `ArrowOverlay` (SVG arrows), `SelectionRingOverlay` (drag visual) |
| Dialogs | `FAQDialog`, `KeyboardShortcutsDialog`, `SettingsDialog`, `ShareDialog`, `MobileInfoDialog` |
| Pickers | `ColorPicker`, `ArrowStylePicker` |
| Display | `StatusBar`, `SectionList`, `LayerRow`, `AnnotationCard` |
| Auth | `LoginButton`, `UserMenu` |
| Collab | `CollaborationPresence` (user avatars) |

### TipTap Extensions

Custom ProseMirror plugins in `lib/tiptap/extensions/`:

- `arrow-lines-plugin` -- renders arrow connection points in editors
- `layer-highlights` -- applies highlight decorations per layer
- `layer-underlines` -- applies underline decorations per layer
- `similar-text-highlights` -- highlights matching text across editors
- `word-hover` / `word-selection` -- custom word-level interaction

## Backend Architecture

The backend (Bun + Hono) serves three roles:

1. **OAuth2 authentication** -- Google, Apple, Facebook via Arctic library. BFF pattern: tokens never reach the frontend.
2. **Share link API** -- create and resolve short share codes with `edit` or `readonly` access.
3. **Static SPA hosting** -- serves the built frontend in production.

See [backend.md](backend.md) for full details.

## Collab Server Architecture

The collab server is a standalone Node.js process running y-websocket:

- Clients connect to `ws://host:4444/{workspaceId}`
- Y.Doc state is loaded from LevelDB on first connection to a room
- Updates are flushed to LevelDB every 5 seconds (debounced)
- Final flush on document destroy and graceful shutdown
- Health endpoint at `GET /health` returns `{ status, rooms, uptime }`

See [collaboration.md](collaboration.md) for the full CRDT design.

## Data Flow

### Text Editing

```
User types in TipTap editor
  → ProseMirror transaction
  → TipTap Collaboration extension writes to Y.XmlFragment("editor-N")
  → Y.Doc update propagated via y-websocket to collab server
  → Collab server broadcasts to other connected clients
  → Other clients' TipTap editors update via Y.XmlFragment observation
```

### Annotation Mutations (e.g. adding a highlight)

```
User selects text and clicks highlight
  → useHighlightMode calls addHighlight(layerId, highlight)
  → useYjsLayers.addHighlight writes to Y.Doc layers array
  → addHighlightToDoc encodes positions as RelativePositions
  → Y.Doc update propagated via y-websocket
  → Other clients' useYjsLayers observeDeep triggers re-render
  → Highlights decoded from RelativePositions and rendered
```

### Authentication

```
User clicks "Sign in with Google"
  → Frontend sets window.location.href = /auth/google
  → Backend generates state + PKCE, redirects to Google
  → User authorizes at Google
  → Google redirects to /auth/google/callback
  → Backend exchanges code for tokens, upserts user, creates session
  → Session cookie set, redirect to /
  → Frontend calls GET /auth/me to check session
```
