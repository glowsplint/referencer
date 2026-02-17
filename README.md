# Referencer

A web-based Bible study annotation tool for cross-referencing multiple passages side-by-side with highlights, inline annotations, arrows, and layered organization.

## Features

- **Multi-passage view** -- open multiple Bible passages side-by-side in separate editor panels
- **Highlights & annotations** -- select text to highlight with colors and attach inline notes
- **Arrows** -- draw connections between words across different passages
- **Layers** -- organize highlights and arrows into named, colored, toggleable layers
- **PDF export** -- export the current workspace to a styled PDF
- **Real-time collaboration** -- WebSocket-based sync across multiple clients
- **Share links** -- generate read-only or editable share URLs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| Rich text | TipTap 3 (ProseMirror) with custom extensions |
| Backend | Python, FastAPI, SQLAlchemy (async) |
| Real-time | WebSocket (FastAPI + custom client) |
| Bible API | ESV API v3 |
| Testing | Vitest + React Testing Library, Playwright |
| Package manager | Bun |

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
├── backend/                   # Python FastAPI server
│   ├── main.py                # Routes, ESV API proxy, share links
│   ├── ws.py                  # WebSocket handler + connection manager
│   ├── workspace_store.py     # Workspace CRUD operations
│   ├── share_store.py         # Share link management
│   ├── models.py              # Pydantic models
│   └── database.py            # SQLAlchemy async setup
├── Makefile                   # Build and serve commands
└── Pipfile                    # Python dependencies
```

## Frontend Architecture

### Components

| Category | Components |
|----------|-----------|
| Panels | `ButtonPane` (toolbar), `ManagementPane` (layers/sections), `AnnotationPanel` (highlight notes), `ActionConsole` (history log) |
| Overlays | `ArrowOverlay` (SVG arrow rendering), `SelectionRingOverlay` (drag selection visual) |
| Dialogs | `FAQDialog`, `KeyboardShortcutsDialog`, `SettingsDialog`, `ShareDialog`, `MobileInfoDialog` |
| Pickers | `ColorPicker`, `ArrowStylePicker` |
| Display | `StatusBar`, `SectionList`, `LayerRow`, `AnnotationCard` |

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

FastAPI server with three roles:
1. **Bible API proxy** -- fetches passages from the ESV API (with offline dev mode using local JSON)
2. **WebSocket collaboration** -- manages per-workspace connections, broadcasts actions (highlights, arrows, layers, editor content) to connected clients
3. **Share links** -- creates and resolves short share codes with read-only or edit access

Uses SQLAlchemy with async SQLite for persistence.

## Development

### Requirements

- [Bun](https://bun.sh/) -- frontend package management and dev server
- [Python 3.9+](https://www.python.org/) with [pipenv](https://pipenv.pypa.io/) -- backend server
- A `.env` file in the project root with `API_KEY=<your ESV API key>`

### Frontend only (hot reload)

```bash
cd frontend
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Full stack (hot reload)

1. `make serve` -- starts Python backend on port 5000
2. `cd frontend && bun run dev` -- starts Vite on port 5173
3. Open [http://localhost:5173](http://localhost:5173) -- frontend hot reloads, `/api/*` proxies to backend

### Production build

```bash
make          # builds frontend + starts backend
# or individually:
make build    # cd frontend && bun run build
make serve    # pipenv run uvicorn backend.main:app
```

Backend serves built frontend from `frontend/dist/` on port 5000.

### Backend setup

```bash
pip install pipenv
pipenv install
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

| Action | Input |
|--------|-------|
| Select words | Click or drag on text |
| Draw arrow | Hold `Ctrl`/`Cmd` + drag between words |
| Highlight selection | Select text, then click highlight tool or press `H` |
| Underline selection | Select text, then press `U` |
| Add annotation | Select text, then press `N` |
| Erase | Press `E` to toggle eraser, then click highlights/arrows |
| Cycle active layer | Press `Tab` |
| Undo / Redo | `Ctrl+Z` / `Ctrl+Shift+Z` |
