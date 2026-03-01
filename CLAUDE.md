## Project Setup

This project uses **bun** instead of node. Run `bun` commands from `frontend/` for build, test, and lint. For full-stack dev, run `bun run dev` from the project root (starts frontend + backend + collab via concurrently).

## Styling

Use **Tailwind CSS** for all new styling. SCSS is only used by existing tiptap template/primitive components — do not add new SCSS.

## Library Components

Components under `tiptap-*` directories (`tiptap-ui`, `tiptap-ui-primitive`, `tiptap-icons`, `tiptap-node`, `tiptap-extension`) are sourced from third-party tiptap templates. Avoid structural refactoring of these — they may be updated upstream. Minor fixes like import path changes are fine.

## Common Pitfalls

- All test renders need `renderWithWorkspace()` from `test/render-with-workspace.tsx`
- Annotations use Yjs transactions — always go through `lib/yjs/annotations.ts`
- ProseMirror positions ≠ Yjs positions — use position mapping from `usePositionMapping`
- Settings are localStorage; annotations are Yjs CRDTs; workspace metadata is Supabase REST
- In git worktrees, run `bun install` before running tests or Playwright scripts
- Only English has the `tour` i18n namespace — other locales fall back to English

## Testing

Add or update tests for every code change. Use **Vitest** with **React Testing Library**. Run from `frontend/`:

- Unit tests: `bun run test:run`
- E2E tests: `bun run test:e2e`

## Visual Verification

After UI/frontend changes, visually verify using headless Playwright. Start the dev server if not already running (`bun run dev` from `frontend/`), then:

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

Read the screenshot at `/tmp/verify.png` to confirm the change looks correct. Adapt the URL and use `page.locator()` to target specific elements when verifying targeted changes.

## Verification Protocol (MANDATORY)

**NEVER say "done", "complete", or mark a task as finished without passing ALL applicable checks below.** Each check requires pasting actual command output as evidence.

### Checklist

For **every** code change, run and paste output from:

1. **Build** — `cd frontend && bun run build` — zero errors (pre-existing warnings acceptable)
2. **Unit tests** — `cd frontend && bun run test:run` — all pass (paste summary)
3. **E2E tests** — `cd frontend && bun run test:e2e` — all pass (paste summary)
4. **Lint** — `cd frontend && bun run lint` — no errors (pre-existing warnings acceptable)

For **UI/frontend changes**, additionally:

5. **Visual screenshot** — Playwright screenshot of the affected area. Read it and confirm it matches expected result.

For **bug fixes**, additionally:

6. **Reproduction test** — write a test that catches the bug. Show it fails without the fix and passes with it.

### Rules

- Run checks yourself. Do not ask the user to verify.
- If ANY check fails, fix the issue and re-run ALL checks. Do not move on.
- Evidence must be from the current session — do not reference previous runs.
- If a test is flaky, re-run it. If it fails twice, investigate the flake before proceeding.
- In teams, the **Test agent** runs this checklist and reports pass/fail evidence to the team lead. The team lead must NOT mark the task complete without Test agent confirmation.

## Ralph Loop (Persistence Until Correct)

When tackling complex tasks, **keep working until ALL verification checks pass.** Do not stop, ask for help, or declare partial completion.

1. **Attempt** the implementation
2. **Run the full verification checklist** above
3. **If anything fails** → diagnose root cause, fix it, go back to step 2
4. **Only stop** when every check passes with fresh evidence

### Principles

- **Don't assume something works** — run the command and prove it
- **Don't assume something isn't implemented** — search the codebase first
- **Fix forward** — if tests fail, fix the code (not the test) unless the test itself is wrong
- **One thing at a time** — fix one failure, re-run, then address the next
- **Backpressure over trust** — let failing builds/tests/lints force corrections. CI is the source of truth, not your confidence level
