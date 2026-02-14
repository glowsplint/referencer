## Project Setup

This project uses **bun** instead of node. Use `bun` for all package management and script execution (e.g., `bun install`, `bun run dev`). Always `cd /Users/tym/coding/referencer/frontend` before running any bun commands.

## Styling

Use **Tailwind CSS** for all new styling. SCSS is only used by existing tiptap template/primitive components — do not add new SCSS.

## Library Components

Components under `tiptap-*` directories (`tiptap-ui`, `tiptap-ui-primitive`, `tiptap-icons`, `tiptap-node`, `tiptap-extension`) are sourced from third-party tiptap templates. Avoid structural refactoring of these (e.g., consolidating into factories or abstractions) — they may be updated upstream. Minor fixes like import path changes are fine.

## Git

Use linear history. Always rebase instead of merge (`git rebase`, not `git merge`). Do not create merge commits.

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
