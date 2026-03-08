# Referencer [![react](https://badges.aleen42.com/src/react.svg)](https://badges.aleen42.com/src/react.svg) [![typescript](https://badges.aleen42.com/src/typescript.svg)](https://badges.aleen42.com/src/typescript.svg)

Referencer is a web-based online Bible study annotation tool that makes it easy to cross-reference multiple passages from different parts of the Bible. The frontend is built with React 19, TypeScript, and TipTap 3. The backend is a Cloudflare Worker (Hono + Supabase). Real-time collaboration uses Yjs CRDTs with a Cloudflare Durable Objects collab server.

## Features

- **Multi-passage view** -- open multiple Bible passages side-by-side in separate editor panels
- **Highlights & annotations** -- select text to highlight with colors and attach inline notes
- **Arrows** -- draw connections between words across different passages
- **Layers** -- organize highlights and arrows into named, colored, toggleable layers
- **PDF export** -- export the current document to a styled PDF
- **Real-time collaboration** -- Yjs CRDT-based sync across multiple clients with offline support
- **Share links** -- generate read-only or editable share URLs
- **OAuth2 authentication** -- sign in with Google or GitHub

## Tech Stack

| Layer           | Technology                                            |
| --------------- | ----------------------------------------------------- |
| Frontend        | React 19, TypeScript, Vite 7, Tailwind CSS v4         |
| Rich text       | TipTap 3 (ProseMirror) with custom extensions         |
| CRDT sync       | Yjs with y-websocket protocol                         |
| Backend         | Cloudflare Workers, Hono framework, Supabase          |
| Collab server   | Cloudflare Workers + Durable Objects, Supabase        |
| Auth            | OAuth2 (Google, GitHub) via Arctic                    |
| Persistence     | Supabase (PostgreSQL), DO storage, IndexedDB (client) |
| Testing         | Vitest + React Testing Library, Playwright            |
| Package manager | Bun                                                   |

## Project Structure

```
referencer/
├── frontend/                  # React 19 SPA (Vite, TipTap 3, Tailwind CSS v4)
│   ├── src/
│   │   ├── components/        # UI components + tiptap template components
│   │   ├── contexts/          # DocumentContext, AuthContext
│   │   ├── hooks/             # ~50 custom hooks (layers, editors, Yjs, tools)
│   │   ├── lib/               # Yjs provider, TipTap extensions, auth client
│   │   ├── types/             # TypeScript type definitions
│   │   └── data/              # Default document data
│   └── e2e/                   # Playwright end-to-end tests
├── backend/                   # Cloudflare Worker (Hono + Supabase)
│   └── src/
│       ├── api/               # REST handlers (share, documents, folders, preferences, feedback)
│       ├── auth/              # OAuth2 (Google, GitHub) via Arctic
│       ├── db/                # Supabase client
│       ├── lib/               # Utilities (rate-limit, logger, metrics, JWT)
│       └── middleware/        # Permission middleware
├── collab-server/             # Cloudflare Worker with Durable Objects (Yjs CRDT sync)
│   └── src/
│       ├── durable-object.ts  # YjsRoom — Yjs sync via WebSocket + DO storage + Supabase persistence
│       ├── index.ts           # Hono app, JWT auth, permission check, WebSocket upgrade
│       └── persistence.ts     # Supabase snapshot load/save
├── functions/                 # Cloudflare Pages middleware (proxies /auth, /api, /s to backend worker)
├── supabase/                  # Database schema (PostgreSQL)
└── docs/                      # Architecture documentation
```

## Documentation

See the [docs/](docs/README.md) directory for detailed architecture and API documentation:

- [Architecture](docs/architecture.md) -- system overview, service communication, data flow
- [Collaboration](docs/collaboration.md) -- Yjs CRDTs, Y.Doc structure, sync protocol, presence
- [Backend](docs/backend.md) -- REST API routes, database schema, auth system
- [Authentication](docs/authentication.md) -- OAuth flow, session management, account linking
- [Development](docs/development.md) -- full setup guide, environment variables, testing, deployment

## Quick Start

### Frontend only (no collaboration)

```bash
cd frontend
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). The app works fully offline.

### Full stack (with collaboration)

```bash
bun run install:all    # install deps for all services
bun run dev            # start backend :8787, collab :8788, frontend :5173
```

### Tests

```bash
cd frontend
bun run test:run       # unit tests (Vitest)
bun run test:e2e       # e2e tests (Playwright)
```

See [docs/development.md](docs/development.md) for the full setup guide, environment variables, and deployment.

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

## API Reference

See [docs/backend.md](docs/backend.md) for the full API reference. Key endpoints:

| Group     | Endpoints                                                    |
| --------- | ------------------------------------------------------------ |
| Auth      | `GET /auth/:provider`, `/auth/me`, `POST /auth/logout`       |
| Documents | `GET/POST /api/documents`, `PATCH/DELETE /api/documents/:id` |
| Folders   | `GET/POST /api/folders`, `PATCH/DELETE /api/folders/:id`     |
| Share     | `POST /api/share`, `POST /api/share/accept`, `GET /s/:code`  |
| Other     | `/api/preferences`, `/api/feedback`                          |
