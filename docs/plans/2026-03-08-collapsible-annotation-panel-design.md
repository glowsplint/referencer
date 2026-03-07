# Collapsible Annotation Panel

## Goal

Allow users to collapse/expand the AnnotationPanel (comments pane) via a caret button, freeing screen space for the editor.

## Behavior

- A caret button sits inside the AnnotationPanel header row, next to the existing collapse-all chevron.
- **Expanded right panel**: caret shows `ChevronRight` (collapse toward right edge). Clicking collapses to a ~24px thin strip.
- **Collapsed right panel**: strip shows `ChevronLeft` (expand back). Clicking restores full width.
- **Left panel**: mirrored — `ChevronLeft` to collapse, `ChevronRight` to expand.
- Both left and right panels get independent toggles when `commentPlacement === "both"`.
- Smooth ~200ms CSS width transition on collapse/expand.
- State is session-only (not persisted to localStorage). Always starts expanded.

## Collapsed state

When collapsed, only a thin vertical strip (~24px) with the caret icon remains visible. All annotation cards, SVG connectors, and the collapse-all button are hidden. The resize divider is hidden when the adjacent panel is collapsed.

## Component changes

### `AnnotationPanel.tsx`

- New props: `isCollapsed: boolean`, `onToggleCollapsed: () => void`.
- When collapsed: render a thin strip with just the caret.
- When expanded: show caret in header row alongside collapse-all button.
- Animate width via CSS transition (`transition: width 200ms ease-out`).

### `App.tsx`

- Two new `useState<boolean>`: `leftPanelCollapsed`, `rightPanelCollapsed` (default `false`).
- Pass to corresponding `AnnotationPanel` instances.
- Hide the divider when the adjacent panel is collapsed.

## No changes to

- ManagementPane, ButtonPane, or other components
- localStorage/persistence
- Keyboard shortcuts
