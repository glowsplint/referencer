# Collapsible Annotation Panel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a caret toggle button to the AnnotationPanel that collapses it to a thin strip and expands it back, with smooth animation.

**Architecture:** Add `isCollapsed` / `onToggleCollapsed` props to `AnnotationPanel`. When collapsed, render a ~24px strip with a chevron instead of the full panel. App.tsx manages two independent boolean states for left/right panels and hides the resize divider when collapsed.

**Tech Stack:** React, Tailwind CSS, lucide-react (ChevronLeft/ChevronRight icons), Vitest + React Testing Library

---

### Task 1: Add collapse toggle to AnnotationPanel

**Files:**

- Modify: `frontend/src/components/AnnotationPanel.tsx:14-42` (props interface), `:178-288` (render)
- Test: `frontend/src/components/AnnotationPanel.test.tsx`

**Step 1: Write the failing tests**

Add to `AnnotationPanel.test.tsx` after the existing `describe` blocks (inside the outer `describe`):

```tsx
describe("when isCollapsed and onToggleCollapsed are provided", () => {
  describe("when panel is expanded", () => {
    it("then shows the collapse toggle button", () => {
      const props = createProps({
        onCollapseAll: vi.fn(),
        onExpandAll: vi.fn(),
        collapsedIds: new Set<string>(),
        isCollapsed: false,
        onToggleCollapsed: vi.fn(),
        placement: "right",
      });
      render(<AnnotationPanel {...props} />);
      expect(screen.getByTestId("togglePanelCollapse")).toBeInTheDocument();
    });

    it("then calls onToggleCollapsed when collapse button is clicked", () => {
      const onToggleCollapsed = vi.fn();
      const props = createProps({
        onCollapseAll: vi.fn(),
        onExpandAll: vi.fn(),
        collapsedIds: new Set<string>(),
        isCollapsed: false,
        onToggleCollapsed,
        placement: "right",
      });
      render(<AnnotationPanel {...props} />);
      fireEvent.click(screen.getByTestId("togglePanelCollapse"));
      expect(onToggleCollapsed).toHaveBeenCalled();
    });
  });

  describe("when panel is collapsed", () => {
    it("then renders only the thin strip with the expand button", () => {
      const props = createProps({
        isCollapsed: true,
        onToggleCollapsed: vi.fn(),
        placement: "right",
      });
      const { container } = render(<AnnotationPanel {...props} />);
      expect(screen.getByTestId("togglePanelCollapse")).toBeInTheDocument();
      // No SVG connectors or annotation cards when collapsed
      expect(container.querySelector("svg")).toBeNull();
    });

    it("then calls onToggleCollapsed when expand button is clicked", () => {
      const onToggleCollapsed = vi.fn();
      const props = createProps({
        isCollapsed: true,
        onToggleCollapsed,
        placement: "right",
      });
      render(<AnnotationPanel {...props} />);
      fireEvent.click(screen.getByTestId("togglePanelCollapse"));
      expect(onToggleCollapsed).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && bun run test:run -- --reporter=verbose AnnotationPanel.test`
Expected: FAIL — `isCollapsed` prop not recognized, `togglePanelCollapse` testid not found

**Step 3: Implement the AnnotationPanel changes**

In `AnnotationPanel.tsx`:

1. Add imports: `ChevronLeft, ChevronRight` from `lucide-react` (line 12, alongside existing `ChevronsUp, ChevronsDown`)

2. Add two new props to `AnnotationPanelProps` interface (after `readOnly?: boolean` at line 41):

```tsx
isCollapsed?: boolean;
onToggleCollapsed?: () => void;
```

3. Add to function destructuring (after `readOnly`, around line 75):

```tsx
isCollapsed,
onToggleCollapsed,
```

4. Add a constant for the collapsed width (after `CONNECTOR_OPACITY` line 50):

```tsx
const COLLAPSED_STRIP_WIDTH = 24;
```

5. Replace the return block (line 178-288) with collapse-aware rendering:

```tsx
const collapseIcon = placement === "left"
  ? (isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />)
  : (isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />);

const effectiveWidth = isCollapsed ? COLLAPSED_STRIP_WIDTH : panelWidth;

return (
  <div
    className="relative flex-shrink-0"
    style={{
      width: effectiveWidth,
      overflowY: isCollapsed ? "hidden" : "clip",
      transition: "width 200ms ease-out",
    }}
    data-testid="annotation-panel"
  >
    {isCollapsed ? (
      <div className="flex items-start justify-center pt-1 h-full">
        <button
          className="p-0.5 rounded hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
          onClick={onToggleCollapsed}
          data-testid="togglePanelCollapse"
        >
          {collapseIcon}
        </button>
      </div>
    ) : (
      <>
        {positions.length > 0 && (
          <>
            {(onCollapseAll || onExpandAll || onToggleCollapsed) && (
              <div className="flex justify-end gap-0.5 px-1 py-0.5">
                {onToggleCollapsed && (
                  <button
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
                    onClick={onToggleCollapsed}
                    data-testid="togglePanelCollapse"
                  >
                    {collapseIcon}
                  </button>
                )}
                {(onCollapseAll || onExpandAll) && (
                  <button
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground transition-colors"
                    onClick={anyExpanded ? onCollapseAll : onExpandAll}
                    title={anyExpanded ? "Collapse all" : "Expand all"}
                    data-testid="toggleCollapseAll"
                  >
                    {anyExpanded ? <ChevronsUp size={14} /> : <ChevronsDown size={14} />}
                  </button>
                )}
              </div>
            )}
            {/* SVG connector lines */}
            <svg ... (existing SVG code unchanged) />
            {/* Annotation cards */}
            <div ... (existing cards code unchanged) />
          </>
        )}
      </>
    )}
  </div>
);
```

The key changes to the return block:

- Compute `collapseIcon` and `effectiveWidth` before the return
- Add `transition: "width 200ms ease-out"` to root div style
- Use `effectiveWidth` instead of `panelWidth`
- When `isCollapsed`: render only a thin strip with the caret button
- When expanded + `onToggleCollapsed` provided: add the caret button to the header row alongside collapse-all
- All existing SVG and card rendering stays identical

**Step 4: Run tests to verify they pass**

Run: `cd frontend && bun run test:run -- --reporter=verbose AnnotationPanel.test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add frontend/src/components/AnnotationPanel.tsx frontend/src/components/AnnotationPanel.test.tsx
git commit -m "feat: add collapse/expand toggle to AnnotationPanel"
```

---

### Task 2: Wire collapse state in App.tsx

**Files:**

- Modify: `frontend/src/App.tsx:50` (imports), `:305` (state), `:548-567` (props), `:622-646` (left panel), `:813-837` (right panel)

**Step 1: Add state and pass props**

In `App.tsx`:

1. At line 305 (near `mobileAnnotationPanelOpen` state), add:

```tsx
const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
```

2. In the `annotationPanelProps` object (line 548-567), these are common props shared by both panels. The collapse state is panel-specific, so we'll pass it directly at each render site.

3. For the **left** AnnotationPanel (around line 628-635), add collapse props:

```tsx
<AnnotationPanel
  {...annotationPanelProps}
  placement="left"
  width={annotationPanelWidth}
  editorIndices={settings.commentPlacement === "both" ? editorColumns.left : undefined}
  isCollapsed={leftPanelCollapsed}
  onToggleCollapsed={() => setLeftPanelCollapsed((v) => !v)}
/>
```

4. For the left divider (line 637-644), conditionally hide when collapsed:

```tsx
{
  !leftPanelCollapsed && (
    <div
      role="separator"
      data-testid="annotation-panel-divider"
      onMouseDown={(e) => handleAnnotationPanelDrag(e, "left")}
      className="flex flex-col items-center w-1.5 h-full cursor-col-resize hover:bg-accent transition-colors shrink-0"
    >
      <div className="flex-1 w-px bg-gray-300" />
    </div>
  );
}
```

5. For the **right** divider (line 818-825), conditionally hide when collapsed:

```tsx
{
  !rightPanelCollapsed && (
    <div
      role="separator"
      data-testid="annotation-panel-divider"
      onMouseDown={(e) => handleAnnotationPanelDrag(e, "right")}
      className="flex flex-col items-center w-1.5 h-full cursor-col-resize hover:bg-accent transition-colors shrink-0"
    >
      <div className="flex-1 w-px bg-gray-300" />
    </div>
  );
}
```

6. For the **right** AnnotationPanel (around line 827-834), add collapse props:

```tsx
<AnnotationPanel
  {...annotationPanelProps}
  placement="right"
  width={annotationPanelWidth}
  editorIndices={settings.commentPlacement === "both" ? editorColumns.right : undefined}
  isCollapsed={rightPanelCollapsed}
  onToggleCollapsed={() => setRightPanelCollapsed((v) => !v)}
/>
```

**Step 2: Run full test suite**

Run: `cd frontend && bun run test:run`
Expected: ALL PASS

**Step 3: Run build**

Run: `cd frontend && bun run build`
Expected: zero errors

**Step 4: Run lint**

Run: `cd frontend && bun run lint`
Expected: no new errors

**Step 5: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: wire collapse state for left/right annotation panels in App"
```

---

### Task 3: Visual verification

**Step 1: Start dev server and take screenshots**

Use Playwright to verify collapsed and expanded states look correct. Take screenshots of the annotation panel in both states.

**Step 2: Run E2E tests**

Run: `cd frontend && bun run test:e2e`
Expected: ALL PASS

**Step 3: Final commit (if any visual tweaks needed)**

---

### Task 4: Full verification checklist

Run all four checks and paste evidence:

1. `cd frontend && bun run build`
2. `cd frontend && bun run test:run`
3. `cd frontend && bun run test:e2e`
4. `cd frontend && bun run lint`

All must pass before declaring complete.
