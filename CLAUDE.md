## Project Setup

This project uses **bun** instead of node. Use `bun` for all package management and script execution (e.g., `bun install`, `bun run dev`). Always `cd /Users/tym/coding/referencer/frontend` before running any bun commands.

## Styling

Use **Tailwind CSS** for all new styling. SCSS is only used by existing tiptap template/primitive components — do not add new SCSS.

## Library Components

Components under `tiptap-*` directories (`tiptap-ui`, `tiptap-ui-primitive`, `tiptap-icons`, `tiptap-node`, `tiptap-extension`) are sourced from third-party tiptap templates. Avoid structural refactoring of these (e.g., consolidating into factories or abstractions) — they may be updated upstream. Minor fixes like import path changes are fine.

## Testing

Add or update tests for every code change. Use **Vitest** with **React Testing Library**. Before considering any code change complete, run both unit tests (`bun run test:run`) and e2e tests (`bun run test:e2e`) from the `frontend/` directory and ensure all tests pass.
