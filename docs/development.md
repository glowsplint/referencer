# Development

## Prerequisites

- **[Bun](https://bun.sh/)** -- frontend package management, dev server, and backend runtime
- **[Node.js](https://nodejs.org/)** -- required for the collab server (y-leveldb uses native Node bindings) and Playwright tests

## Quick Start

### Frontend only (no collaboration)

```bash
cd frontend
bun install
bun run dev
```

Opens at [http://localhost:5173/referencer/](http://localhost:5173/referencer/). The app works fully offline -- when the collab server is unavailable, the Yjs provider treats the local Y.Doc as synced and content seeding proceeds normally.

### Full stack (with collaboration)

Start all three services:

```bash
# Terminal 1: Backend (port 5000)
cd backend
bun install
bun run dev

# Terminal 2: Collab server (port 4444)
cd collab-server
npm install
npm start

# Terminal 3: Frontend (port 5173)
cd frontend
bun install
bun run dev
```

The Vite dev server proxies API requests to the backend and Yjs WebSocket connections to the collab server.

### Production build

```bash
cd frontend
bun run build
```

Output goes to `frontend/dist/`. The backend serves this directory as static files.

## Vite Proxy Configuration

In development, `frontend/vite.config.ts` proxies:

| Frontend path | Target | Notes |
|---------------|--------|-------|
| `/api/*` | `http://localhost:5000` | REST API |
| `/s/*` | `http://localhost:5000` | Share link resolution |
| `/auth/*` | `http://localhost:5000` | OAuth routes |
| `/yjs/*` | `ws://localhost:4444` | CRDT sync (path prefix stripped) |

## Testing

### Unit Tests (Vitest + React Testing Library)

```bash
cd frontend
bun run test:run     # single run
bun run test         # watch mode
```

Configuration in `frontend/vite.config.ts` (test section): jsdom environment, globals enabled, CSS disabled.

### E2E Tests (Playwright)

```bash
cd frontend
bun run test:e2e       # headless
bun run test:e2e:ui    # interactive UI mode
```

E2E tests live in `frontend/e2e/`. The `-x` flag stops on first failure.

### Integration Tests

```bash
cd frontend
bun run test:integration
```

Uses a separate Playwright config at `e2e/integration/playwright.integration.config.ts`.

## Environment Variables

### Backend (`backend/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server listen port |
| `DB_PATH` | `./data/referencer.db` | SQLite database file path |
| `BASE_URL` | `http://localhost:5000` | Public URL (used for OAuth callback URLs) |
| `NODE_ENV` | -- | Set to `production` for Secure cookies |
| `SESSION_MAX_AGE` | `2592000` (30 days) | Session lifetime in seconds |
| `GOOGLE_CLIENT_ID` | -- | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | -- | Google OAuth client secret |
| `APPLE_CLIENT_ID` | -- | Apple Services ID |
| `APPLE_PRIVATE_KEY` | -- | Apple private key (PEM content) |
| `APPLE_TEAM_ID` | -- | Apple Developer Team ID |
| `APPLE_KEY_ID` | -- | Apple Key ID |
| `FACEBOOK_CLIENT_ID` | -- | Facebook App ID |
| `FACEBOOK_CLIENT_SECRET` | -- | Facebook App Secret |

Providers are only enabled when all their required env vars are set.

### Collab Server (`collab-server/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4444` | Server listen port |
| `HOST` | `0.0.0.0` | Server listen host |
| `DB_DIR` | `./data/yjs-docs` | LevelDB storage directory |

### Frontend (`frontend/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_COLLAB_WS_URL` | `ws[s]://{host}/yjs` | Collab server WebSocket URL |

## Scripts Reference

### Frontend (`frontend/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server with HMR |
| `build` | `tsc -b && vite build` | Type-check and build for production |
| `lint` | `eslint .` | Run ESLint |
| `preview` | `vite preview` | Preview production build locally |
| `test` | `vitest` | Run unit tests in watch mode |
| `test:run` | `vitest run` | Run unit tests once |
| `test:e2e` | `playwright test -x` | Run Playwright E2E tests |
| `test:e2e:ui` | `playwright test --ui` | Run Playwright in interactive UI mode |
| `test:integration` | `playwright test --config=...` | Run integration tests |

### Backend (`backend/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun run --hot src/index.ts` | Start with hot reloading |
| `start` | `bun run src/index.ts` | Start without hot reloading |

### Collab Server (`collab-server/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node server.mjs` | Start collab server |
| `dev` | `node server.mjs` | Start collab server (same as start) |

## Project Conventions

- **Styling**: Tailwind CSS for all new styling. SCSS only exists in tiptap template components.
- **Components under `tiptap-*` directories**: Sourced from third-party tiptap templates. Avoid structural refactoring; minor fixes like import path changes are fine.
- **Git**: Linear history. Always rebase, never merge.
- **Package manager**: Bun for everything except the collab server (which uses npm/Node.js).
