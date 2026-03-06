# Rename "Passages" → "Texts" + Hotkey T Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename all "passage" terminology to "text" throughout UI and code, and add hotkey T to create a new text editor pane.

**Architecture:** Two independent workstreams — (1) a bulk rename of "passage" → "text" across i18n strings, component names, test IDs, variable names, and test assertions; (2) adding `KeyT` to the toggle shortcuts hook with `addEditor` as the callback. The rename is purely mechanical; the hotkey follows the existing pattern in `use-toggle-shortcuts.ts`.

**Tech Stack:** React 19, TypeScript, Vitest, React Testing Library, i18next

---

## Workstream A: Rename "passage" → "text"

This workstream has 5 parallelizable tasks (A1–A5). Each agent can handle one independently.

### Task A1: i18n — Rename all locale strings

**Files to modify:**

- `frontend/src/i18n/locales/en/common.json` — rename `"passage"` key to `"text"`
- `frontend/src/i18n/locales/en/management.json` — rename `"passages"` section to `"texts"` with updated values
- `frontend/src/i18n/locales/en-SG/common.json` — same as en
- `frontend/src/i18n/locales/en-SG/management.json` — same as en
- All other locale `common.json` files (30 locales) — rename `"passage"` key to `"text"`
- All other locale `management.json` files (30 locales) — rename `"passages"` section to `"texts"` with updated values
- `frontend/src/i18n/locales/en/dialogs.json` — add `"shortcuts.addText": "Add new text"`
- `frontend/src/i18n/locales/en-SG/dialogs.json` — add `"shortcuts.addText": "Add new text"`

**For English `common.json`:**

```json
"text": "Text {{number}}"
```

(was `"passage": "Passage {{number}}"`)

**For English `management.json`:**

```json
"texts": {
  "title": "Texts",
  "addText": "Add text",
  "hideAll": "Hide all texts",
  "showAll": "Show all texts",
  "hideText": "Hide text",
  "showText": "Show text"
}
```

(was `"passages": { "title": "Passages", "addPassage": "Add passage", ... }`)

**For non-English locales:** Apply the same key renames. For `management.json`, rename the key structure from `"passages"` to `"texts"` and update sub-keys from `addPassage` → `addText`, `hidePassage` → `hideText`, `showPassage` → `showText`, `hideAll` → same, `showAll` → same. Keep the translated values but update them to reference "text" instead of "passage" in each language.

**For English `dialogs.json`:** Add within the `"shortcuts"` object:

```json
"addText": "Add new text"
```

**Verification:** `cd frontend && bun run build` — should have no missing i18n key warnings.

---

### Task A2: Rename PassageHeader component → TextHeader

**Files:**

- Rename: `frontend/src/components/PassageHeader.tsx` → `frontend/src/components/TextHeader.tsx`
- Rename: `frontend/src/components/PassageHeader.test.tsx` → `frontend/src/components/TextHeader.test.tsx`
- Modify: `frontend/src/App.tsx` (import and usage)

**Step 1: Create `TextHeader.tsx`** (copy of PassageHeader with renames)

```tsx
import { useInlineEdit } from "@/hooks/ui/use-inline-edit";

interface TextHeaderProps {
  name: string;
  index: number;
  onUpdateName: (name: string) => void;
}

export function TextHeader({ name, index, onUpdateName }: TextHeaderProps) {
  const { isEditing, inputProps, startEditing } = useInlineEdit({
    currentName: name,
    onCommit: onUpdateName,
  });

  return (
    <div className="flex items-center px-3 py-1 border-b border-border bg-muted/30 shrink-0">
      {isEditing ? (
        <input
          {...inputProps}
          className="text-sm font-medium bg-transparent border-0 ring-1 ring-border rounded px-1 py-0 outline-none w-full"
          data-testid={`textHeaderInput-${index}`}
        />
      ) : (
        <span
          className="text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:underline decoration-muted-foreground/30 cursor-text rounded px-1"
          onDoubleClick={() => startEditing()}
          data-testid={`textHeader-${index}`}
        >
          {name}
        </span>
      )}
    </div>
  );
}
```

**Step 2: Create `TextHeader.test.tsx`** — same as PassageHeader.test.tsx but:

- Import `TextHeader` from `./TextHeader`
- Replace `describe("PassageHeader"` → `describe("TextHeader"`
- Replace `<PassageHeader` → `<TextHeader`
- Replace `passageHeader-` → `textHeader-`
- Replace `passageHeaderInput-` → `textHeaderInput-`
- Replace `"passage name"` → `"text name"` in describe strings

**Step 3: Update `App.tsx`**

- Line 15: `import { TextHeader } from "./components/TextHeader";`
- Lines 142 and 746: `<TextHeader` instead of `<PassageHeader`

**Step 4: Delete old files**

- Delete `frontend/src/components/PassageHeader.tsx`
- Delete `frontend/src/components/PassageHeader.test.tsx`

---

### Task A3: Rename test IDs and i18n keys in SectionList

**Files:**

- Modify: `frontend/src/components/SectionList.tsx`
- Modify: `frontend/src/components/SectionList.test.tsx`

**SectionList.tsx changes:**

- Line 1 comment: "passage" → "text"
- Line 36 comment: "passage" → "text"
- Line 68: `t("passages.title")` → `t("texts.title")`
- Line 73: `t("passages.addPassage")` → `t("texts.addText")`
- Line 74: `data-testid="addPassageButton"` → `data-testid="addTextButton"`
- Line 81: `t("passages.hideAll")` / `t("passages.showAll")` → `t("texts.hideAll")` / `t("texts.showAll")`
- Line 91: `key={`passage-${i}`}` → `key={`text-${i}`}`
- Line 96: `data-testid={`passageRow-${i}`}` → `data-testid={`textRow-${i}`}`
- Line 140: `data-testid={`passageNameInput-${i}`}` → `data-testid={`textNameInput-${i}`}`
- Line 146: `data-testid={`passageName-${i}`}` → `data-testid={`textName-${i}`}`
- Line 154: `t("passages.hidePassage")` / `t("passages.showPassage")` → `t("texts.hideText")` / `t("texts.showText")`

**SectionList.test.tsx changes:**

- All `"Passage 1"`, `"Passage 2"`, `"Passage 3"` in sectionNames → `"Text 1"`, `"Text 2"`, `"Text 3"`
- `"Passages"` heading assertion → `"Texts"`
- `"addPassageButton"` → `"addTextButton"`
- `"passageRow-"` → `"textRow-"`
- `"passageName-"` → `"textName-"`
- `"passageNameInput-"` → `"textNameInput-"`
- `"Hide passage"` → `"Hide text"`
- `"Show passage"` → `"Show text"`
- All `describe` text: "passage" → "text"

---

### Task A4: Rename code identifiers in use-editors.ts and related

**Files:**

- Modify: `frontend/src/hooks/data/use-editors.ts`
- Modify: `frontend/src/hooks/data/use-editors.test.ts`
- Modify: `frontend/src/hooks/data/use-editor-document.ts`
- Modify: `frontend/src/hooks/data/use-editor-document.test.ts`
- Modify: `frontend/src/data/default-document.ts`

**use-editors.ts changes:**

- Line 1 comment: "passages" → "texts"
- Line 24: `["Passage 1"]` → `["Text 1"]`
- Line 32: `passageCounterRef` → `textCounterRef`
- Line 49: `Passage ${passageCounterRef.current}` → `Text ${textCounterRef.current}`
- Line 52: `passageCounterRef.current` → `textCounterRef.current`
- Line 54: same pattern

**use-editors.test.ts changes:**

- All `"Passage 1"`, `"Passage 2"`, etc. → `"Text 1"`, `"Text 2"`, etc.
- Line 300 describe text: `"Passage 1"` → `"Text 1"`
- Line 377 describe text: `"passage name counter"` → `"text name counter"`
- All assertions using passage names updated

**default-document.ts changes:**

- Line 14: `DEFAULT_PASSAGE_CONTENTS` → `DEFAULT_TEXT_CONTENTS`
- Line 4 comment: "passage contents" → "text contents"

**use-editor-document.ts changes:**

- Line 18: `DEFAULT_PASSAGE_CONTENTS` → `DEFAULT_TEXT_CONTENTS`
- Lines 80-81: `DEFAULT_PASSAGE_CONTENTS[i]` → `DEFAULT_TEXT_CONTENTS[i]`
- Line 318: `"Reordered passages"` → `"Reordered texts"`
- Lines 342-346: `"Passage ${index + 1}"` → `"Text ${index + 1}"`, `hidePassage`/`showPassage` → `hideText`/`showText`, `"passage"` → `"text"` in descriptions

**use-editor-document.test.ts changes:**

- Line 13: `DEFAULT_PASSAGE_CONTENTS` → `DEFAULT_TEXT_CONTENTS`

---

### Task A5: Rename passage references in App test files and remaining components

**Files:**

- Modify: `frontend/src/App.multi-editor-layers.test.tsx` — rename `"Passage 1"`, `"Passage 2"` in sectionNames and all "passage" in describe/comment strings
- Modify: `frontend/src/App.ui-consistency.test.tsx` — same pattern
- Modify: `frontend/src/App.desktop.test.tsx` — if it has passage refs
- Modify: `frontend/src/App.mobile.test.tsx` — if it has passage refs
- Modify: `frontend/src/App.annotation-visibility.test.tsx` — if it has passage refs
- Modify: `frontend/src/components/ManagementPane.tsx` — line 1 comment: "passages" → "texts"
- Modify: `frontend/src/components/ManagementPane.test.tsx` — `"Passages"` heading assertion → `"Texts"`, all `passageRow-` → `textRow-`, `passageName-` → `textName-`, `passageNameInput-` → `textNameInput-`, `"Passage 1"`/`"Passage 2"` → `"Text 1"`/`"Text 2"` in sectionNames, describe text updates
- Modify: `frontend/src/components/LayerRow.tsx` — lines 194, 274: `passageName` local var can stay (it's a local variable meaning "name of the text pane", not user-facing)
- Modify: `frontend/src/components/PrintAnnotations.tsx` and test — if passage refs exist
- Modify: `frontend/src/components/ActionConsole.tsx` — if passage refs exist
- Modify: `frontend/src/test/render-with-document.tsx` — if passage refs exist
- Modify: `frontend/src/hooks/data/use-tracked-editors.ts` and test — if passage refs exist
- Modify: `frontend/src/hooks/selection/use-word-selection.ts` and test — if passage refs exist in comments
- Modify: `frontend/src/components/tiptap-templates/simple/extensions.ts` — if passage refs
- Modify: `frontend/src/components/tiptap-templates/simple/EditorPane.tsx` — if passage refs
- Modify: `frontend/src/components/hub/DocumentGrid.tsx` — if passage refs
- Modify: `frontend/src/lib/word-navigation.ts` and test — if passage refs in comments

**Strategy:** Search each file for "passage"/"Passage"/"PASSAGE" and replace appropriately. For user-facing strings change to "text"/"Text". For code comments change to "text". For test describe strings change to "text". Local variables like `passageName` in LayerRow.tsx are fine to keep since they're not user-facing identifiers — but rename if desired for consistency.

---

## Workstream B: Hotkey T to add new text editor

### Task B1: Add T hotkey to toggle shortcuts

**Files:**

- Modify: `frontend/src/hooks/ui/use-toggle-shortcuts.ts`
- Modify: `frontend/src/App.tsx` (pass `addEditor` to `useToggleShortcuts`)
- Modify: `frontend/src/components/KeyboardShortcutsDialog.tsx`
- Modify: `frontend/src/components/KeyboardShortcutsDialog.test.tsx`

**use-toggle-shortcuts.ts changes:**

Add `"addText"` to the ToggleAction type:

```ts
type ToggleAction = "darkMode" | "layout" | "lock" | "menu" | "commentPlacement" | "addText";
```

Add to KEY_MAP:

```ts
KeyT: "addText",
```

Add to interface:

```ts
addText: () => void;
```

Add to callbacksRef, effect, and switch:

```ts
case "addText":
  callbacksRef.current.addText();
  break;
```

**App.tsx changes:**

In the `useToggleShortcuts` call (around line 285), add:

```ts
addText: document.addEditor,
```

**KeyboardShortcutsDialog.tsx changes:**

Add to the document shortcuts section (LEFT_SECTIONS, first section), after the `toggleManagement` entry:

```ts
{ keys: ["T"], description: t("shortcuts.addText") },
```

**KeyboardShortcutsDialog.test.tsx changes:**

In the "lists all document shortcuts" test, add:

```ts
expect(screen.getByText("Add new text")).toBeInTheDocument();
```

---

## Verification

After all tasks complete:

1. `cd frontend && bun run build` — zero errors
2. `cd frontend && bun run test:run` — all pass
3. `cd frontend && bun run lint` — no errors
4. `cd frontend && bun run test:e2e` — all pass

## Task Dependencies

```
A1 ──┐
A2 ──┤
A3 ──┼── All merge → verification
A4 ──┤
A5 ──┤
B1 ──┘
```

All 6 tasks are independent and can run in parallel.
