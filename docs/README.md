# Referencer

Referencer is a web-based Bible study annotation tool for cross-referencing multiple passages side-by-side. Users can highlight text, draw arrows between words across passages, add inline notes, and organize annotations into colored layers. All editing is collaborative in real time via Yjs CRDTs.

## Repository Structure

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
│       ├── persistence.ts     # Supabase snapshot load/save
│       └── ...                # JWT, logger, metrics
├── functions/                 # Cloudflare Pages middleware (proxies /auth, /api, /s to backend worker)
├── supabase/                  # Database schema (PostgreSQL)
└── docs/                      # Architecture documentation (you are here)
```

## Documentation Index

| Document                                       | Description                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| [architecture.md](architecture.md)             | High-level system architecture and how the three services connect                 |
| [collaboration.md](collaboration.md)           | CRDT collaboration system: Yjs, annotations, relative positions, undo, offline    |
| [backend.md](backend.md)                       | Backend API: routes, authentication, database schema                              |
| [authentication.md](authentication.md)         | OAuth flow, session management, security measures, auth API reference             |
| [development.md](development.md)               | Development setup, commands, environment variables, testing                       |
| [ux-brainstorm.md](ux-brainstorm.md)           | UX improvement brainstorm: 60+ ideas across 10 themes with competitor research    |
| [search-improvement.md](search-improvement.md) | Full-text annotation search: architecture, schema, and phased implementation plan |

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
