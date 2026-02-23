# Development

## Prerequisites

- **[Bun](https://bun.sh/)** -- frontend package management, dev server, and backend runtime
- **[Node.js](https://nodejs.org/) 20+** -- required for the collab server (y-leveldb uses native Node bindings) and Playwright tests
- **[fnm](https://github.com/Schniz/fnm)** (recommended) -- manages Node.js versions; the dev script uses `fnm exec --using=22` to run the collab server with the correct Node version

## Quick Start

### Install all dependencies

```bash
bun run install:all
```

This installs dependencies for the root, collab-server, backend, and frontend in one command.

### Frontend only (no collaboration)

```bash
cd frontend
bun install
bun run dev
```

Opens at [http://localhost:5173/referencer/](http://localhost:5173/referencer/). The app works fully offline -- when the collab server is unavailable, the Yjs provider treats the local Y.Doc as synced and content seeding proceeds normally.

### Full stack (with collaboration)

Start all three services with a single command from the project root:

```bash
bun run dev
```

This uses `concurrently` to launch:

| Service       | Port | Runner         |
| ------------- | ---- | -------------- |
| Backend       | 5000 | Bun            |
| Collab server | 4444 | Node (via fnm) |
| Frontend      | 5173 | Bun            |

The Vite dev server proxies API requests to the backend and Yjs WebSocket connections to the collab server.

### Production build

```bash
cd frontend
bun run build
```

Output goes to `frontend/dist/`. The backend serves this directory as static files.

## Vite Proxy Configuration

In development, `frontend/vite.config.ts` proxies:

| Frontend path | Target                  | Notes                            |
| ------------- | ----------------------- | -------------------------------- |
| `/api/*`      | `http://localhost:5000` | REST API                         |
| `/s/*`        | `http://localhost:5000` | Share link resolution            |
| `/auth/*`     | `http://localhost:5000` | OAuth routes                     |
| `/yjs/*`      | `ws://localhost:4444`   | CRDT sync (path prefix stripped) |

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

| Variable                 | Default                 | Description                               |
| ------------------------ | ----------------------- | ----------------------------------------- |
| `PORT`                   | `5000`                  | Server listen port                        |
| `DB_PATH`                | `./data/referencer.db`  | SQLite database file path                 |
| `BASE_URL`               | `http://localhost:5000` | Public URL (used for OAuth callback URLs) |
| `NODE_ENV`               | --                      | Set to `production` for Secure cookies    |
| `SESSION_MAX_AGE`        | `2592000` (30 days)     | Session lifetime in seconds               |
| `GOOGLE_CLIENT_ID`       | --                      | Google OAuth client ID                    |
| `GOOGLE_CLIENT_SECRET`   | --                      | Google OAuth client secret                |
| `GITHUB_CLIENT_ID`       | --                      | GitHub OAuth client ID                    |
| `GITHUB_CLIENT_SECRET`   | --                      | GitHub OAuth client secret                |

Providers are only enabled when all their required env vars are set.

### Collab Server (`collab-server/`)

| Variable | Default           | Description               |
| -------- | ----------------- | ------------------------- |
| `PORT`   | `4444`            | Server listen port        |
| `HOST`   | `0.0.0.0`         | Server listen host        |
| `DB_DIR` | `./data/yjs-docs` | LevelDB storage directory |

### Frontend (`frontend/`)

| Variable             | Default              | Description                 |
| -------------------- | -------------------- | --------------------------- |
| `VITE_COLLAB_WS_URL` | `ws[s]://{host}/yjs` | Collab server WebSocket URL |

## Scripts Reference

### Frontend (`frontend/package.json`)

| Script             | Command                        | Description                           |
| ------------------ | ------------------------------ | ------------------------------------- |
| `dev`              | `vite`                         | Start Vite dev server with HMR        |
| `build`            | `tsc -b && vite build`         | Type-check and build for production   |
| `lint`             | `eslint .`                     | Run ESLint                            |
| `preview`          | `vite preview`                 | Preview production build locally      |
| `test`             | `vitest`                       | Run unit tests in watch mode          |
| `test:run`         | `vitest run`                   | Run unit tests once                   |
| `test:e2e`         | `playwright test -x`           | Run Playwright E2E tests              |
| `test:e2e:ui`      | `playwright test --ui`         | Run Playwright in interactive UI mode |
| `test:integration` | `playwright test --config=...` | Run integration tests                 |

### Backend (`backend/package.json`)

| Script  | Command                      | Description                 |
| ------- | ---------------------------- | --------------------------- |
| `dev`   | `bun run --hot src/index.ts` | Start with hot reloading    |
| `start` | `bun run src/index.ts`       | Start without hot reloading |

### Collab Server (`collab-server/package.json`)

| Script  | Command           | Description                         |
| ------- | ----------------- | ----------------------------------- |
| `start` | `node server.mjs` | Start collab server                 |
| `dev`   | `node server.mjs` | Start collab server (same as start) |

## Project Conventions

- **Styling**: Tailwind CSS for all new styling. SCSS only exists in tiptap template components.
- **Components under `tiptap-*` directories**: Sourced from third-party tiptap templates. Avoid structural refactoring; minor fixes like import path changes are fine.
- **Git**: Linear history. Always rebase, never merge.
- **Package manager**: Bun for everything. The collab server runs under Node.js (via `fnm exec`) due to native LevelDB bindings, but uses `bun install` for dependency management.
