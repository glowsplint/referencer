import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock the pragmatic-drag-and-drop adapter
let draggableSpy = vi.fn(() => vi.fn());
let dropTargetSpy = vi.fn(() => vi.fn());

vi.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  draggable: (...args: any[]) => draggableSpy(...args),
  dropTargetForElements: (...args: any[]) => dropTargetSpy(...args),
}));

// Mock the DndContext
const mockSetDragState = vi.fn();
const mockResetDrag = vi.fn();
vi.mock("@/contexts/DndContext", () => ({
  useDndContext: () => ({
    isDragging: false,
    dragType: null,
    dragId: null,
    overTargetId: null,
    setDragState: mockSetDragState,
    resetDrag: mockResetDrag,
  }),
}));

import { useDraggable, useDropTarget, type DragData } from "./use-hub-dnd";

// Test component that attaches the ref to a real div
function DraggableComponent({ type, id }: { type: "workspace" | "folder"; id: string }) {
  const ref = useDraggable(type, id);
  return <div ref={ref} data-testid="draggable" />;
}

function DropTargetComponent({
  targetId,
  onDrop,
  canDrop,
}: {
  targetId: string;
  onDrop: (data: DragData) => void;
  canDrop?: (data: DragData) => boolean;
}) {
  const ref = useDropTarget(targetId, onDrop, canDrop);
  return <div ref={ref} data-testid="drop-target" />;
}

describe("useDraggable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draggableSpy = vi.fn(() => vi.fn());
    dropTargetSpy = vi.fn(() => vi.fn());
  });

  it("calls draggable with the element when mounted", () => {
    render(<DraggableComponent type="workspace" id="ws-1" />);
    expect(draggableSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        element: expect.any(HTMLElement),
      }),
    );
  });

  it("provides getInitialData that returns type and id", () => {
    render(<DraggableComponent type="folder" id="f-1" />);
    const config = draggableSpy.mock.calls[0][0];
    expect(config.getInitialData()).toEqual({ type: "folder", id: "f-1" });
  });

  it("onDragStart sets drag state", () => {
    render(<DraggableComponent type="workspace" id="ws-1" />);
    const config = draggableSpy.mock.calls[0][0];
    config.onDragStart();
    expect(mockSetDragState).toHaveBeenCalledWith({
      isDragging: true,
      dragType: "workspace",
      dragId: "ws-1",
    });
  });

  it("onDrop resets drag state", () => {
    render(<DraggableComponent type="workspace" id="ws-1" />);
    const config = draggableSpy.mock.calls[0][0];
    config.onDrop();
    expect(mockResetDrag).toHaveBeenCalled();
  });
});

describe("useDropTarget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draggableSpy = vi.fn(() => vi.fn());
    dropTargetSpy = vi.fn(() => vi.fn());
  });

  it("calls dropTargetForElements with the element when mounted", () => {
    const onDrop = vi.fn();
    render(<DropTargetComponent targetId="target-1" onDrop={onDrop} />);
    expect(dropTargetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        element: expect.any(HTMLElement),
      }),
    );
  });

  it("canDrop returns false when source data has no type", () => {
    const onDrop = vi.fn();
    render(<DropTargetComponent targetId="target-1" onDrop={onDrop} />);
    const config = dropTargetSpy.mock.calls[0][0];
    expect(config.canDrop({ source: { data: {} } })).toBe(false);
  });

  it("canDrop returns true when source data is valid and no custom canDrop", () => {
    const onDrop = vi.fn();
    render(<DropTargetComponent targetId="target-1" onDrop={onDrop} />);
    const config = dropTargetSpy.mock.calls[0][0];
    expect(config.canDrop({ source: { data: { type: "workspace", id: "ws-1" } } })).toBe(true);
  });

  it("canDrop delegates to custom canDrop function", () => {
    const onDrop = vi.fn();
    const canDrop = vi.fn(() => false);
    render(<DropTargetComponent targetId="target-1" onDrop={onDrop} canDrop={canDrop} />);
    const config = dropTargetSpy.mock.calls[0][0];
    const result = config.canDrop({ source: { data: { type: "workspace", id: "ws-1" } } });
    expect(canDrop).toHaveBeenCalledWith({ type: "workspace", id: "ws-1" });
    expect(result).toBe(false);
  });

  it("onDragEnter sets overTargetId", () => {
    const onDrop = vi.fn();
    render(<DropTargetComponent targetId="target-1" onDrop={onDrop} />);
    const config = dropTargetSpy.mock.calls[0][0];
    config.onDragEnter();
    expect(mockSetDragState).toHaveBeenCalledWith({ overTargetId: "target-1" });
  });

  it("onDragLeave clears overTargetId", () => {
    const onDrop = vi.fn();
    render(<DropTargetComponent targetId="target-1" onDrop={onDrop} />);
    const config = dropTargetSpy.mock.calls[0][0];
    config.onDragLeave();
    expect(mockSetDragState).toHaveBeenCalledWith({ overTargetId: null });
  });

  it("onDrop clears overTargetId and calls onDrop callback", () => {
    const onDropCallback = vi.fn();
    render(<DropTargetComponent targetId="target-1" onDrop={onDropCallback} />);
    const config = dropTargetSpy.mock.calls[0][0];
    config.onDrop({
      source: { data: { type: "workspace", id: "ws-1" } },
    });
    expect(mockSetDragState).toHaveBeenCalledWith({ overTargetId: null });
    expect(onDropCallback).toHaveBeenCalledWith({ type: "workspace", id: "ws-1" });
  });

  it("getData returns the targetId", () => {
    const onDrop = vi.fn();
    render(<DropTargetComponent targetId="target-1" onDrop={onDrop} />);
    const config = dropTargetSpy.mock.calls[0][0];
    expect(config.getData()).toEqual({ targetId: "target-1" });
  });
});
