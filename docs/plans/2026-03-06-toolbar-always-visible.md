# Toolbar Always Visible When Locked — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Always show all tiptap formatting toolbar buttons, greying them out (disabled) when the editor is locked instead of hiding them.

**Architecture:** Remove `!editor.isEditable` from `shouldShowButton` in 10 tiptap-ui hooks so buttons stay mounted. Remove the wrapper `opacity-50` in SimpleEditorToolbar and let tiptap's built-in `:disabled` CSS (with theme-aware tokens for light/dark) handle the visual dimming. Keep `pointer-events-none` on the wrapper as a safety net. Add `disabled` prop to ClearFormattingButton which currently has no disabled state.

**Tech Stack:** React, Tiptap, Tailwind CSS, Vitest

---

### Task 1: Update existing tests to expect new behavior

**Files:**

- Modify: `frontend/src/components/tiptap-ui/mark-button/use-mark.test.ts:34-37`
- Modify: `frontend/src/components/tiptap-templates/simple/simple-editor.test.tsx:213-219`

**Step 1: Update mark-button shouldShowButton test**

In `use-mark.test.ts`, change the test at line 34 — when editor is not editable, `shouldShowButton` should now return `true` (button visible but disabled):

```ts
it("when editor is not editable, then still returns true (visible but disabled)", () => {
  const editor = createMockEditor({ isEditable: false });
  expect(shouldShowButton({ editor, type: "bold", hideWhenUnavailable: false })).toBe(true);
});
```

**Step 2: Update SimpleEditorToolbar locked test**

In `simple-editor.test.tsx`, the test at line 214 checks `"then dims the formatting controls but not the toolbar itself"`. Update it to verify `pointer-events-none` without `opacity-50`:

```ts
it("then disables interaction on formatting controls but keeps them visible", () => {
  render(<SimpleEditorToolbar isLocked={true} />);
  const toolbar = screen.getByTestId("editorToolbar");
  expect(toolbar).toBeInTheDocument();
  // The inner wrapper should block interaction but not use opacity
  const innerWrapper = toolbar.firstElementChild;
  expect(innerWrapper).toHaveClass("pointer-events-none");
  expect(innerWrapper).not.toHaveClass("opacity-50");
});
```

**Step 3: Run tests to verify they fail**

Run: `cd frontend && bun run test:run -- --reporter=verbose 2>&1 | head -60`
Expected: The two updated tests FAIL (shouldShowButton still returns false; toolbar still has opacity-50)

**Step 4: Commit test changes**

```bash
git add -A && git commit -m "test: update expectations for always-visible toolbar when locked"
```

---

### Task 2: Remove `!editor.isEditable` from `shouldShowButton` in 10 tiptap-ui hooks

Each file has a `shouldShowButton` function with the line:

```ts
if (!editor || !editor.isEditable) return false;
```

Change it to:

```ts
if (!editor) return false;
```

**Files to modify (only the `shouldShowButton` function in each):**

1. `frontend/src/components/tiptap-ui/mark-button/use-mark.ts:110`
2. `frontend/src/components/tiptap-ui/undo-redo-button/use-undo-redo.ts:86`
3. `frontend/src/components/tiptap-ui/heading-button/use-heading.ts:209`
4. `frontend/src/components/tiptap-ui/blockquote-button/use-blockquote.ts:161`
5. `frontend/src/components/tiptap-ui/code-block-button/use-code-block.ts:161`
6. `frontend/src/components/tiptap-ui/text-align-button/use-text-align.ts:117`
7. `frontend/src/components/tiptap-ui/text-color-button/use-text-color.ts:59`
8. `frontend/src/components/tiptap-ui/image-upload-button/use-image-upload.ts:86`
9. `frontend/src/components/tiptap-ui/list-button/use-list.ts:237`
10. `frontend/src/components/tiptap-ui/color-highlight-button/use-color-highlight.ts:204`

**DO NOT modify** `canToggle`, `isActive`, `toggleMark`, or any other function in these files. Only `shouldShowButton`.

**Step 1: Apply the change to all 10 files**

In each file, find the `shouldShowButton` function and change `if (!editor || !editor.isEditable) return false;` to `if (!editor) return false;`.

**Step 2: Run tests**

Run: `cd frontend && bun run test:run -- --reporter=verbose 2>&1 | head -80`
Expected: The mark-button test from Task 1 now passes. Other tests should still pass.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: keep toolbar buttons visible when editor is locked

Remove isEditable check from shouldShowButton in all tiptap-ui hooks.
Buttons remain mounted and get disabled styling via canToggle/canExecute
which still check isEditable. This lets the built-in :disabled CSS
(with light/dark theme tokens) handle the visual dimming."
```

---

### Task 3: Update SimpleEditorToolbar wrapper styling

**Files:**

- Modify: `frontend/src/components/tiptap-templates/simple/SimpleEditorToolbar.tsx:159`

**Step 1: Change the wrapper class**

At line 159, change:

```tsx
className={`flex items-center gap-1 min-w-0${isLocked ? " opacity-50 pointer-events-none" : ""}`}
```

To:

```tsx
className={`flex items-center gap-1 min-w-0${isLocked ? " pointer-events-none" : ""}`}
```

This removes `opacity-50` — the tiptap buttons' `:disabled` state handles dimming with proper theme-aware colors.

**Step 2: Run tests**

Run: `cd frontend && bun run test:run -- --reporter=verbose 2>&1 | head -80`
Expected: All tests pass, including the updated SimpleEditorToolbar test from Task 1.

**Step 3: Commit**

```bash
git add -A && git commit -m "style: remove opacity-50 from locked toolbar wrapper

Let tiptap's built-in :disabled CSS handle visual dimming with
theme-aware color tokens for both light and dark mode."
```

---

### Task 4: Add disabled state to ClearFormattingButton

**Files:**

- Modify: `frontend/src/components/tiptap-ui/clear-formatting-button/clear-formatting-button.tsx`

**Step 1: Add disabled prop**

The button currently has no disabled state. Add `disabled={!editor.isEditable}` so it gets proper `:disabled` styling when locked:

```tsx
<Button
  type="button"
  data-style="ghost"
  role="button"
  tabIndex={-1}
  aria-label="Clear formatting"
  tooltip="Clear formatting"
  disabled={!editor.isEditable}
  onClick={handleClick}
>
```

**Step 2: Run full verification**

Run: `cd frontend && bun run build && bun run test:run && bun run lint`
Expected: Build succeeds, all tests pass, no lint errors.

**Step 3: Commit**

```bash
git add -A && git commit -m "fix: disable ClearFormattingButton when editor is not editable"
```

---

### Task 5: Visual verification

**Step 1: Start dev server**

Run: `cd frontend && bun run dev &`

**Step 2: Screenshot locked state**

Take a Playwright screenshot of the toolbar in locked mode. Verify all toolbar buttons are visible and greyed out (not hidden).

**Step 3: Screenshot unlocked state**

Take a Playwright screenshot of the toolbar in unlocked mode. Verify all toolbar buttons are fully interactive-looking.

**Step 4: Verify dark mode**

If dark mode is testable, screenshot both states in dark mode too.
