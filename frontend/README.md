# Referencer Frontend

React 19 + TypeScript + Vite 7 + Tailwind CSS v4 single-page application.

See the [main README](../README.md) for full project documentation, architecture details, and controls.

## Quick Start

```bash
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Script                | Description                              |
| --------------------- | ---------------------------------------- |
| `bun run dev`         | Start Vite dev server with hot reload    |
| `bun run build`       | Type-check and build for production      |
| `bun run preview`     | Preview the production build             |
| `bun run lint`        | Run ESLint                               |
| `bun run test`        | Run Vitest in watch mode                 |
| `bun run test:run`    | Run Vitest once                          |
| `bun run test:e2e`    | Run Playwright end-to-end tests          |
| `bun run test:e2e:ui` | Run Playwright tests with interactive UI |

## Project Layout

```
src/
├── components/       # UI components (panels, dialogs, overlays, pickers)
├── hooks/            # 42 custom React hooks
├── lib/              # Utilities, TipTap extensions, WebSocket client
├── contexts/         # WorkspaceContext (central state)
├── types/            # TypeScript definitions
├── styles/           # SCSS for tiptap template components
└── e2e/              # Playwright test specs
```
