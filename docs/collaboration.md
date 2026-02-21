# CRDT Collaboration System

## Overview

Referencer uses [Yjs](https://yjs.dev/) CRDTs for real-time collaboration. All shared state -- text content and annotation data (layers, highlights, arrows, underlines) -- lives in a single `Y.Doc` per workspace. The Y.Doc syncs between clients via the [y-websocket](https://github.com/yjs/y-websocket) protocol, with server-side LevelDB persistence and client-side IndexedDB persistence for offline support.

## Y.Doc Structure

Each workspace's `Y.Doc` contains these shared types:

```
Y.Doc
├── XmlFragment("editor-0")     # TipTap/ProseMirror content for editor pane 0
├── XmlFragment("editor-1")     # TipTap/ProseMirror content for editor pane 1
├── XmlFragment("editor-N")     # ... one per editor pane
└── Array("layers")             # Annotation layers
    └── [Y.Map]                 # One per layer
        ├── id: string
        ├── name: string
        ├── color: string
        ├── visible: boolean
        ├── highlights: Y.Array<Y.Map>
        │   └── { id, editorIndex, fromRel, toRel, text, annotation, type }
        ├── arrows: Y.Array<Y.Map>
        │   └── { id, fromEditorIndex, fromRel, fromToRel, fromText,
        │          toEditorIndex, toRel, toToRel, toText, arrowStyle }
        └── underlines: Y.Array<Y.Map>
            └── { id, editorIndex, fromRel, toRel, text }
```

**Text content** is stored as `Y.XmlFragment` -- the native Yjs type that TipTap's `@tiptap/extension-collaboration` binds to. Each editor pane gets its own fragment named `editor-{index}`.

**Annotations** (highlights, arrows, underlines) are stored in `Y.Array("layers")` as nested `Y.Map` and `Y.Array` structures. This is a custom annotation model defined in `frontend/src/lib/yjs/annotations.ts`.

## RelativePositions

Annotation positions (highlight start/end, arrow endpoints) are stored as **Yjs RelativePositions**, not absolute integer offsets. This is critical for correctness:

- **Absolute offsets break** when other users edit text concurrently. If user A highlights characters 10-20 and user B inserts text at position 5, user A's highlight would shift to the wrong text.
- **RelativePositions survive** concurrent edits. They encode a position relative to the Y.XmlFragment's internal node structure, so they automatically adjust as the document changes.

### Encoding and Decoding

```typescript
// Encode: ProseMirror position → RelativePosition (Uint8Array)
function encodeRelativePosition(doc: Y.Doc, editorIndex: number, pos: number): Uint8Array {
  const fragment = doc.getXmlFragment(`editor-${editorIndex}`)
  const relPos = Y.createRelativePositionFromTypeIndex(fragment, pos)
  return Y.encodeRelativePosition(relPos)
}

// Decode: RelativePosition → absolute position (or null if deleted)
function decodeRelativePosition(doc: Y.Doc, encoded: Uint8Array): number | null {
  const relPos = Y.decodeRelativePosition(encoded)
  const absPos = Y.createAbsolutePositionFromRelativePosition(relPos, doc)
  return absPos?.index ?? null
}
```

When a highlight or arrow is created, its positions are encoded as `Uint8Array` (`fromRel`, `toRel`). When rendering, they are decoded back to absolute positions. If the referenced text has been deleted, decoding returns `null` and the annotation is skipped with a warning.

## Sync Protocol

```
┌──────────┐           ┌──────────────┐           ┌──────────┐
│ Client A │           │ Collab Server│           │ Client B │
│          │           │   (:4444)    │           │          │
│ Y.Doc    │◄─────────►│ Y.Doc cache  │◄─────────►│ Y.Doc    │
│ y-ws     │  y-ws     │ LevelDB      │  y-ws     │ y-ws     │
│ IndexedDB│  protocol │              │  protocol │ IndexedDB│
└──────────┘           └──────────────┘           └──────────┘
```

1. Client creates a `WebsocketProvider` connecting to `ws://host:4444/{workspaceId}`
2. The collab server loads the Y.Doc from LevelDB (if it exists) and syncs state to the client
3. Local edits generate Y.Doc updates, sent to the server via the y-websocket protocol
4. The server broadcasts updates to all other connected clients in the same room
5. Server flushes Y.Doc state to LevelDB every 5 seconds and on document destroy

### Connection URL

The WebSocket URL is configured via `VITE_COLLAB_WS_URL` env var. In development, the Vite proxy rewrites `/yjs/{workspaceId}` to `ws://localhost:4444/{workspaceId}`. If unset, it defaults to `ws[s]://{current_host}/yjs`.

## Frontend Hooks

### `useYjs(workspaceId)`

Creates and manages the `Y.Doc` and `WebsocketProvider` for a workspace. Returns:
- `doc` -- the `Y.Doc` instance
- `connected` -- whether the WebSocket is connected
- `synced` -- whether the initial sync is complete (or connection failed)
- `getFragment(index)` -- returns the `Y.XmlFragment` for an editor pane
- `awareness` -- the Yjs awareness instance for presence

Located in `frontend/src/hooks/use-yjs.ts`.

### `useYjsLayers(doc)`

CRDT-backed layer state management. Replaces the old `useLayers` hook. Reads layers from the Y.Doc via `readLayers()` and re-renders on `observeDeep` events. All mutation functions (addLayer, addHighlight, removeArrow, etc.) write directly to Y.Doc shared types.

Located in `frontend/src/hooks/use-yjs-layers.ts`.

### `useYjsUndo(doc)`

Wraps `Y.UndoManager` to provide collaborative undo/redo. Tracks both the `layers` array and all `XmlFragment`s (up to 10 editor panes). Changes within 500ms are grouped into a single undo step. Each user has their own undo stack -- undoing only reverses your own changes.

Located in `frontend/src/hooks/use-yjs-undo.ts`.

### `useUnifiedUndo(yjsUndo, history)`

Merges the Yjs UndoManager with the command-pattern `useActionHistory`. Yjs undo takes priority for CRDT-tracked changes; the action history handles non-CRDT operations (e.g. UI state changes like tool switching, layout toggles).

Located in `frontend/src/hooks/use-unified-undo.ts`.

### `useYjsOffline(doc, workspaceId)`

Attaches IndexedDB persistence to the Y.Doc using `y-indexeddb`. The database is named `referencer-yjs-{workspaceId}`. This allows users to work offline -- changes are stored locally and merged with the server when reconnection occurs.

Located in `frontend/src/hooks/use-yjs-offline.ts`.

## Presence

The `CollaborationPresence` component displays connected collaborators as colored avatar circles. It uses the Yjs awareness protocol:

- Each client sets `awareness.setLocalStateField("user", { name, color })`
- The awareness instance broadcasts presence to all connected peers
- Remote users appear as colored circles with initials
- The local user can click their avatar to edit their display name (stored in `localStorage`)

Located in `frontend/src/components/CollaborationPresence.tsx`.

## Content Seeding

When a workspace Y.Doc is first created and the initial sync completes (or connection fails), the `useEditorWorkspace` hook seeds default layers into the empty Y.Doc:

```typescript
if (yjs.synced && layersArray.length === 0) {
  seedDefaultLayers(doc, createDefaultLayers())
}
```

The seed check only runs once per session (tracked by a `useRef` flag) and only writes if the layers array is empty, preventing overwrite of server-persisted data.

## Collab Server Details

The collab server (`collab-server/server.mjs`) is a lightweight Node.js process:

- **Runtime**: Node.js (not Bun -- y-leveldb requires native Node bindings)
- **Protocol**: y-websocket binary sync protocol on port 4444
- **Persistence**: LevelDB at `collab-server/data/yjs-docs/` (configurable via `DB_DIR`)
- **Flush interval**: 5 seconds (configurable via `FLUSH_INTERVAL`)
- **Retry logic**: Up to 3 retries with exponential backoff on persistence flush errors
- **Health check**: `GET /health` returns `{ status: "ok", rooms: <count>, uptime: <seconds> }`
- **Graceful shutdown**: On `SIGINT`, flushes all documents and destroys the LevelDB instance

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4444` | Server listen port |
| `HOST` | `0.0.0.0` | Server listen host |
| `DB_DIR` | `./data/yjs-docs` | LevelDB storage directory |
