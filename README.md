# Referencer [![react](https://badges.aleen42.com/src/react.svg)](https://badges.aleen42.com/src/react.svg) [![typescript](https://badges.aleen42.com/src/typescript.svg)](https://badges.aleen42.com/src/typescript.svg)

Referencer is a web-based online Bible study annotation tool that makes it easy to cross-reference multiple passages from different parts of the Bible. The frontend is built with React 19, TypeScript, and TipTap 3. The backend is written in TypeScript (Bun + Hono). Real-time collaboration uses Yjs CRDT with a dedicated collab server.

## Features

- **Multi-passage view** -- open multiple Bible passages side-by-side in separate editor panels
- **Highlights & annotations** -- select text to highlight with colors and attach inline notes
- **Arrows** -- draw connections between words across different passages
- **Layers** -- organize highlights and arrows into named, colored, toggleable layers
- **PDF export** -- export the current workspace to a styled PDF
- **Real-time collaboration** -- Yjs CRDT-based sync across multiple clients with offline support
- **Share links** -- generate read-only or editable share URLs
- **OAuth2 authentication** -- sign in with Google, Apple, or Facebook

## Tech Stack

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| Frontend        | React 19, TypeScript, Vite 7, Tailwind CSS v4   |
| Rich text       | TipTap 3 (ProseMirror) with custom extensions    |
| Backend         | Bun, Hono, SQLite                                |
| Collab server   | y-websocket, Yjs, LevelDB persistence            |
| Real-time       | Yjs CRDT with y-websocket + y-indexeddb           |
| Auth            | OAuth2 (Google, Apple, Facebook) via Arctic       |
| Testing         | Vitest + React Testing Library, Playwright        |
| Package manager | Bun                                              |

## Project Structure

```
referencer/
├── frontend/                  # React SPA
│   └── src/
│       ├── components/        # UI components + tiptap template components
│       ├── hooks/             # Custom hooks (Yjs, annotations, layers, tools)
│       ├── lib/               # Utilities, TipTap extensions, Yjs provider
│       ├── contexts/          # WorkspaceContext, AuthContext
│       ├── types/             # TypeScript type definitions
│       └── e2e/               # Playwright test files
├── backend/                   # TypeScript backend (Bun + Hono)
│   └── src/
│       ├── api/               # REST handlers (share links)
│       ├── auth/              # OAuth2 authentication (providers, handlers, middleware)
│       ├── db/                # SQLite database layer
│       └── lib/               # Shared utilities
├── collab-server/             # Yjs collaboration server
│   └── server.mjs             # y-websocket server with LevelDB persistence
└── Makefile                   # Build commands
```

## Architecture

### System Overview

```
+------------------------------------------------------+
|                       Clients                        |
|        +---------+  +---------+  +---------+         |
|        |Browser 1|  |Browser 2|  |Browser N|         |
|        +----+----+  +----+----+  +----+----+         |
|             |            |            |              |
|        Yjs CRDT sync via y-websocket                |
|             |            |            |              |
+------------------------------------------------------+
              |                        |
   +----------+----------+   +--------+--------+
   |   Collab Server     |   |  Backend (Hono) |
   |  (y-websocket)      |   |  Auth + Share   |
   |  Port 4444          |   |  Port 5000      |
   +----------+----------+   +--------+--------+
              |                        |
   +----------+----------+   +--------+--------+
   |  LevelDB            |   |  SQLite         |
   |  (Yjs doc state)    |   |  (users, share  |
   |                     |   |   links)        |
   +---------------------+   +-----------------+
```

### Real-time Collaboration

Referencer uses **Yjs CRDT** for real-time collaboration instead of a custom WebSocket protocol. This provides:

- **Conflict-free editing** -- multiple users can edit the same passage simultaneously
- **Offline support** -- changes are persisted locally via y-indexeddb and synced when reconnected
- **Presence awareness** -- cursor positions and user info are shared via Yjs awareness protocol
- **Automatic merging** -- Yjs handles conflict resolution without manual merge logic

The collab server (`collab-server/`) runs y-websocket with LevelDB persistence so documents survive server restarts.

### Authentication

OAuth2 authentication via the Arctic library supports:

- Google (OpenID Connect)
- Apple (Sign in with Apple)
- Facebook

Session tokens are stored in HTTP-only cookies. The auth middleware is optional -- the app works without authentication.

## Development

### Requirements

- [Bun](https://bun.sh/) -- package management and running the backend
- [Node.js 20+](https://nodejs.org/) -- running Playwright e2e tests

### Frontend only (hot reload)

```bash
cd frontend
bun install
bun run dev
```

Open [http://localhost:5173/referencer/](http://localhost:5173/referencer/).

### Full stack

1. Start the collab server: `cd collab-server && npm install && npm start` (port 4444)
2. Start the backend: `cd backend && bun install && bun run dev` (port 5000)
3. Start the frontend: `cd frontend && bun install && bun run dev` (port 5173)

The Vite dev server proxies `/auth` and `/api` to the backend on port 5000, and `/yjs` WebSocket connections to the collab server on port 4444.

### Production build

```bash
make build    # cd frontend && bun run build
```

### Running tests

```bash
cd frontend

# Unit tests (Vitest + React Testing Library)
bun run test:run

# E2e tests (Playwright)
bun run test:e2e

# Watch mode
bun run test
```

### Backend tests

```bash
cd backend
bun test
```

### Environment variables

| Variable              | Default                  | Description                           |
| --------------------- | ------------------------ | ------------------------------------- |
| `PORT` (backend)      | `5000`                   | Backend server listen port            |
| `DB_PATH` (backend)   | `./data/referencer.db`   | SQLite database file path             |
| `PORT` (collab)       | `4444`                   | Collab server listen port             |
| `DB_DIR` (collab)     | `./data/yjs-docs`        | LevelDB directory for Yjs documents   |
| `VITE_COLLAB_WS_URL`  | (auto-detected)          | Override WebSocket URL for Yjs        |

## Controls

| Action              | Input                                                    |
| ------------------- | -------------------------------------------------------- |
| Select words        | Click or drag on text                                    |
| Draw arrow          | Hold `Ctrl`/`Cmd` + drag between words                  |
| Highlight selection | Select text, then click highlight tool or press `H`      |
| Underline selection | Select text, then press `U`                              |
| Add annotation      | Select text, then press `N`                              |
| Erase               | Press `E` to toggle eraser, then click highlights/arrows |
| Cycle active layer  | Press `Tab`                                              |
| Undo / Redo         | `Ctrl+Z` / `Ctrl+Shift+Z`                               |

## API Reference

### REST

| Method | Endpoint       | Description                                                                                                                  |
| ------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/share`   | Create a share link. Body: `{"workspaceId": "...", "access": "edit\|readonly"}`. Returns: `{"code": "...", "url": "/s/..."}` |
| `GET`  | `/s/{code}`    | Resolve a share link. Redirects to the workspace (with `?access=readonly` if applicable)                                     |

### Auth

| Method | Endpoint                     | Description                        |
| ------ | ---------------------------- | ---------------------------------- |
| `GET`  | `/auth/:provider`            | Start OAuth flow                   |
| `GET`  | `/auth/:provider/callback`   | OAuth callback                     |
| `POST` | `/auth/logout`               | End session                        |
| `GET`  | `/auth/me`                   | Get current user info              |

### Collab Server

| Endpoint              | Description                        |
| --------------------- | ---------------------------------- |
| `ws://host:4444/{id}` | Yjs WebSocket connection per room  |
| `GET /health`         | Health check with room count       |
