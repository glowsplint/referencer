# Development

## Prerequisites

- **[Bun](https://bun.sh/)** -- package management and script execution across all documents
- **[Wrangler](https://developers.cloudflare.com/workers/wrangler/)** -- Cloudflare Workers CLI for local dev and deployment (installed per-document as devDependency)

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

Opens at [http://localhost:5173](http://localhost:5173). The app works fully offline -- when the collab server is unavailable, the Yjs provider treats the local Y.Doc as synced and content seeding proceeds normally.

### Full stack (with collaboration)

Start all three services with a single command from the project root:

```bash
bun run dev
```

This uses `concurrently` to launch:

| Service       | Port | Runner       |
| ------------- | ---- | ------------ |
| Backend       | 8787 | Wrangler dev |
| Collab server | 8788 | Wrangler dev |
| Frontend      | 5173 | Vite         |

The Vite dev server proxies API requests to the backend and Yjs WebSocket connections to the collab server.

### Production build

```bash
cd frontend
bun run build
```

Output goes to `frontend/dist/`. In production, the frontend is served by Cloudflare Pages (not the backend).

## Vite Proxy Configuration

In development, `frontend/vite.config.ts` proxies:

| Frontend path | Target                  | Notes                            |
| ------------- | ----------------------- | -------------------------------- |
| `/api/*`      | `http://localhost:8787` | REST API                         |
| `/s/`         | `http://localhost:8787` | Share link resolution            |
| `/auth/*`     | `http://localhost:8787` | OAuth routes                     |
| `/yjs/*`      | `ws://localhost:8788`   | CRDT sync (path prefix stripped) |

## Production Deployment

- **Frontend**: Cloudflare Pages with Git integration (auto-deploy on push). Pages Functions middleware (`functions/_middleware.ts`) proxies `/auth/*`, `/api/*`, `/s/*` to the backend Worker.
- **Backend**: `cd backend && wrangler deploy`
- **Collab server**: `cd collab-server && wrangler deploy`

## Testing

### Unit Tests (Vitest + React Testing Library)

```bash
cd frontend
bun run test:run     # single run
bun run test         # watch mode
```

Configuration in `frontend/vite.config.ts` (test section): three test projects (node, jsdom, jsdom-lib) for different test environments.

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

### Backend (Cloudflare Worker secrets + vars)

Secrets are managed via `wrangler secret put <NAME>` from `backend/`:

| Secret                 | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `SUPABASE_URL`         | Supabase project URL                            |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key                       |
| `WS_JWT_SECRET`        | Secret for signing WebSocket auth JWTs          |
| `WS_JWT_SECRET_PREV`   | Previous JWT secret for key rotation (optional) |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID (optional)               |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional)           |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID (optional)               |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret (optional)           |
| `GITHUB_ISSUES_TOKEN`  | GitHub token for feedback issues (optional)     |
| `SESSION_MAX_AGE`      | Session lifetime in seconds (default: 2592000)  |

Vars are set in `backend/wrangler.toml`:

| Var            | Default                        | Description             |
| -------------- | ------------------------------ | ----------------------- |
| `FRONTEND_URL` | `https://referencer.pages.dev` | CORS origin             |
| `BASE_URL`     | `https://referencer.pages.dev` | OAuth callback base URL |

Bindings configured in `backend/wrangler.toml`:

| Binding   | Type             | Description     |
| --------- | ---------------- | --------------- |
| `METRICS` | Analytics Engine | Request metrics |

### Collab Server (Cloudflare Worker secrets)

Secrets are managed via `wrangler secret put <NAME>` from `collab-server/`:

| Secret                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `SUPABASE_URL`         | Supabase project URL (same as backend)           |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key (same as backend)      |
| `WS_JWT_SECRET`        | Secret for verifying WebSocket auth JWTs         |
| `WS_JWT_SECRET_PREV`   | Previous JWT secret for rotation (optional)      |
| `ALLOWED_ORIGIN`       | CORS origin for WebSocket connections (optional) |

Bindings configured in `collab-server/wrangler.toml`:

| Binding    | Type             | Description                 |
| ---------- | ---------------- | --------------------------- |
| `YJS_ROOM` | Durable Object   | Yjs document room instances |
| `METRICS`  | Analytics Engine | Collab metrics              |

### Frontend

| Variable             | Default                 | Description                 |
| -------------------- | ----------------------- | --------------------------- |
| `VITE_COLLAB_WS_URL` | `ws[s]://{host}/yjs`    | Collab server WebSocket URL |
| `VITE_BACKEND_URL`   | `http://localhost:8787` | Backend URL (dev proxy)     |
| `VITE_API_URL`       | `""` (same origin)      | API base URL for fetch      |

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

| Script   | Command           | Description                    |
| -------- | ----------------- | ------------------------------ |
| `dev`    | `wrangler dev`    | Start local dev server (:8787) |
| `deploy` | `wrangler deploy` | Deploy to Cloudflare           |

### Collab Server (`collab-server/package.json`)

| Script   | Command           | Description                    |
| -------- | ----------------- | ------------------------------ |
| `dev:cf` | `wrangler dev`    | Start local dev server (:8788) |
| `deploy` | `wrangler deploy` | Deploy to Cloudflare           |
| `test`   | `vitest run`      | Run collab server tests        |

## Project Conventions

- **Styling**: Tailwind CSS for all new styling. SCSS only exists in tiptap template components.
- **Components under `tiptap-*` directories**: Sourced from third-party tiptap templates. Avoid structural refactoring; minor fixes like import path changes are fine.
- **Git**: Linear history. Always rebase, never merge.
- **Package manager**: Bun for everything.
