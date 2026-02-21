# Referencer

Referencer is a web-based Bible study annotation tool for cross-referencing multiple passages side-by-side. Users can highlight text, draw arrows between words across passages, add inline notes, and organize annotations into colored layers. All editing is collaborative in real time via Yjs CRDTs.

## Repository Structure

```
referencer/
├── frontend/                  # React 19 SPA (Vite, TipTap 3, Tailwind CSS v4)
│   ├── src/
│   │   ├── components/        # UI components + tiptap template components
│   │   ├── contexts/          # WorkspaceContext, AuthContext
│   │   ├── hooks/             # ~50 custom hooks (layers, editors, Yjs, tools)
│   │   ├── lib/               # Yjs provider, TipTap extensions, auth client
│   │   ├── types/             # TypeScript type definitions
│   │   └── data/              # Default workspace data
│   └── e2e/                   # Playwright end-to-end tests
├── backend/                   # TypeScript backend (Bun + Hono + bun:sqlite)
│   └── src/
│       ├── api/               # REST handlers (share links)
│       ├── auth/              # OAuth2 (Google, Apple, Facebook) via Arctic
│       ├── db/                # SQLite schema and query functions
│       └── lib/               # Utilities
├── collab-server/             # Node.js Yjs CRDT sync server (y-websocket + LevelDB)
└── docs/                      # Architecture documentation (you are here)
```

## Documentation Index

| Document                             | Description                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| [architecture.md](architecture.md)   | High-level system architecture and how the three services connect              |
| [collaboration.md](collaboration.md) | CRDT collaboration system: Yjs, annotations, relative positions, undo, offline |
| [backend.md](backend.md)             | Backend API: routes, authentication, database schema                           |
| [development.md](development.md)     | Development setup, commands, environment variables, testing                    |

## Tech Stack

| Layer           | Technology                                    |
| --------------- | --------------------------------------------- |
| Frontend        | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| Rich text       | TipTap 3 (ProseMirror) with custom extensions |
| CRDT sync       | Yjs with y-websocket protocol                 |
| Backend         | Bun runtime, Hono framework, bun:sqlite       |
| Collab server   | Node.js, y-websocket, LevelDB persistence     |
| Auth            | OAuth2 (Google, Apple, Facebook) via Arctic   |
| Testing         | Vitest + React Testing Library, Playwright    |
| Package manager | Bun                                           |
