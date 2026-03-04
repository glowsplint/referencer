# Architecture

## System Overview

Referencer is composed of three independently-deployed Cloudflare services:

1. **Frontend** -- React 19 SPA deployed to Cloudflare Pages with a Functions middleware proxy.
2. **Backend** -- Cloudflare Worker (Hono) handling REST API, OAuth2 auth, share links, workspaces, folders, and preferences.
3. **Collab server** -- Cloudflare Worker with Durable Objects providing Yjs CRDT synchronization with DO storage + Supabase persistence.

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
   ┌────────────┐  ┌────────────┐   ┌──────────────┐
   │ Cloudflare │  │ Cloudflare │   │   Vite Dev   │
   │ Pages      │  │ Worker     │   │   Server     │
   │            │  │ (collab)   │   │   :5173      │
   │ Static SPA │  │            │   │  (dev only)  │
   │ + Functions│  │ Durable    │   │              │
   │   middleware│  │ Objects    │   │ Proxies to   │
   │            │  │ (YjsRoom)  │   │ backend and  │
   │ Proxies    │  │            │   │ collab server│
   │ /api,/auth │  │ DO storage │   │              │
   │ /s to      │  │ + Supabase │   └──────────────┘
   │ backend    │  │            │
   │ worker     │  │            │
   │            │  │            │
   └──────┬─────┘  └────────────┘
          │
          ▼
   ┌────────────┐
   │ Cloudflare │
   │ Worker     │
   │ (backend)  │
   │            │
   │ Hono API   │
   │ OAuth2     │
   │ Supabase   │
   │ Analytics  │
   │ Engine     │
   └────────────┘
```

## Service Communication

### Development (Vite dev server on :5173)

The Vite dev server proxies requests to the other services (both running via `wrangler dev`):

| Path      | Target                  | Protocol                  |
| --------- | ----------------------- | ------------------------- |
| `/api/*`  | `http://localhost:8787` | HTTP                      |
| `/s/*`    | `http://localhost:8787` | HTTP                      |
| `/auth/*` | `http://localhost:8787` | HTTP                      |
| `/yjs/*`  | `ws://localhost:8788`   | WebSocket (path stripped) |

### Production (Cloudflare)

The frontend is deployed to **Cloudflare Pages** at `referencer.pages.dev`. A **Pages Functions middleware** (`functions/_middleware.ts`) proxies `/auth/*`, `/api/*`, and `/s/*` requests to the backend Worker at `referencer-api.elurion.workers.dev`. This keeps all requests same-origin, avoiding third-party cookie issues.

The collab server runs as a separate Cloudflare Worker (`referencer-collab`) with Durable Objects. Clients connect via WebSocket with JWT authentication.

Route gating is defined in `frontend/public/_routes.json`:

```json
{ "version": 1, "include": ["/auth/*", "/api/*", "/s/*"], "exclude": [] }
```

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

| Category | Components                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Panels   | `ButtonPane` (toolbar), `ManagementPane` (layers/sections), `AnnotationPanel` (highlight notes), `ActionConsole` (history) |
| Overlays | `ArrowOverlay` (SVG arrows), `SelectionRingOverlay` (drag visual)                                                          |
| Dialogs  | `FAQDialog`, `KeyboardShortcutsDialog`, `SettingsDialog`, `ShareDialog`, `MobileInfoDialog`                                |
| Pickers  | `ColorPicker`, `ArrowStylePicker`                                                                                          |
| Display  | `StatusBar`, `SectionList`, `LayerRow`, `AnnotationCard`                                                                   |
| Auth     | `LoginButton`, `UserMenu`                                                                                                  |
| Collab   | `CollaborationPresence` (user avatars)                                                                                     |

### TipTap Extensions

Custom ProseMirror plugins in `lib/tiptap/extensions/`:

- `arrow-lines-plugin` -- renders arrow connection points in editors
- `layer-highlights` -- applies highlight decorations per layer
- `layer-underlines` -- applies underline decorations per layer
- `similar-text-highlights` -- highlights matching text across editors
- `word-hover` / `word-selection` -- custom word-level interaction

## Backend Architecture

The backend is a **Cloudflare Worker** (`referencer-api`) using Hono. It serves three roles:

1. **OAuth2 authentication** -- Google, GitHub via Arctic library. BFF pattern: tokens never reach the frontend.
2. **REST API** -- share links, workspaces, folders, preferences, feedback.
3. **Scheduled tasks** -- hourly cron for session cleanup, rate-limit key expiry.

Bindings: Analytics Engine (metrics), Supabase (database). Rate limiting uses an in-memory Map (per-isolate).

See [backend.md](backend.md) for full details.

## Collab Server Architecture

The collab server is a **Cloudflare Worker** (`referencer-collab`) with **Durable Objects**:

- Each workspace room maps to a `YjsRoom` Durable Object instance
- Clients connect via WebSocket with JWT auth (verified by the Worker entry point)
- Permission check against Supabase before upgrading to WebSocket
- The `YjsRoom` DO manages the Y.Doc, syncs updates between clients using the y-websocket binary protocol
- Persistence: DO storage (primary, <128KB) with Supabase fallback (larger docs)
- Periodic Supabase snapshots via DO alarms (every 5 minutes)
- Full flush to both DO storage and Supabase on last client disconnect
- Health endpoint at `GET /health`

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
  → Pages Functions middleware proxies to backend worker
  → Backend generates state + PKCE, redirects to Google
  → User authorizes at Google
  → Google redirects to /auth/google/callback
  → Backend exchanges code for tokens, upserts user, creates session
  → Session cookie set, redirect to /
  → Frontend calls GET /auth/me to check session
```
