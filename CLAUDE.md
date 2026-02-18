## Project Setup

This project uses **bun** instead of node. Use `bun` for all package management and script execution (e.g., `bun install`, `bun run dev`). Always `cd /Users/tym/coding/referencer/frontend` before running any bun commands.

## Styling

Use **Tailwind CSS** for all new styling. SCSS is only used by existing tiptap template/primitive components — do not add new SCSS.

## Library Components

Components under `tiptap-*` directories (`tiptap-ui`, `tiptap-ui-primitive`, `tiptap-icons`, `tiptap-node`, `tiptap-extension`) are sourced from third-party tiptap templates. Avoid structural refactoring of these (e.g., consolidating into factories or abstractions) — they may be updated upstream. Minor fixes like import path changes are fine.

## Git

Use linear history. Always rebase instead of merge (`git rebase`, not `git merge`). Do not create merge commits.

## Agent Teams

Use agent teams for any non-trivial task. Prefer parallelizing work across teammates whenever possible. Examples:

- **Feature implementation**: Spawn a team with teammates for implementation, testing, and visual verification working in parallel.
- **Bug investigation**: Spawn an Explore agent to research the issue while another agent prepares a fix once the root cause is identified.
- **Refactoring**: Split work across multiple agents by file or module, with a dedicated test-runner agent validating changes.
- **Code review / research**: Use multiple Explore agents in parallel to investigate different parts of the codebase simultaneously.

When creating teams:
- Use `general-purpose` agents for any work that requires writing/editing files or running commands.
- Use `Explore` agents for read-only research, codebase search, and investigation.
- Use `Plan` agents when you need architectural analysis before implementation.
- Spawn a dedicated **Test agent** (`general-purpose` subagent) for every team. Its responsibilities:
  - **Unit tests**: Write and run Vitest + React Testing Library tests (`bun run test:run` from `frontend/`).
  - **E2E tests**: Write and run Playwright tests (`bun run test:e2e` from `frontend/`). Tests live in `frontend/e2e/`.
  - **Integration tests**: Where components interact with APIs, state management, or backend services, write integration-level tests that verify these boundaries (e.g., MSW-based API mocking, WebSocket message handling, multi-component flows).
  - The Test agent should run **all three test types** after implementation is complete and report results back to the team lead.
  - If any tests fail, the Test agent coordinates with the implementation agent to fix the issue before the task is considered done.
- Keep team sizes reasonable (2-4 agents for most tasks).
- Always assign clear, scoped tasks to each teammate via TaskCreate.
- Shut down teammates gracefully when their work is complete.

## Testing

Add or update tests for every code change. Use **Vitest** with **React Testing Library**. Before considering any code change complete, run both unit tests (`bun run test:run`) and e2e tests (`bun run test:e2e`) from the `frontend/` directory and ensure all tests pass.

## Visual Verification

After making UI/frontend code changes, visually verify the result using headless Playwright. Start the dev server if not already running (`bun run dev` from `frontend/`), then use a script like:

```bash
cd frontend && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/verify.png', fullPage: true });
  await browser.close();
})();
"
```

Read the screenshot at `/tmp/verify.png` to visually confirm the change looks correct. Use `page.locator()` to interact with or screenshot specific elements when verifying targeted changes.
