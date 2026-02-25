import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActionHistory } from "./use-action-history";

describe("useActionHistory", () => {
  it("when initialized, then returns empty state", () => {
    const { result } = renderHook(() => useActionHistory());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.log).toEqual([]);
  });

  it("when an action is recorded, then adds it to undo stack and log", () => {
    const { result } = renderHook(() => useActionHistory());
    const undo = vi.fn();
    const redo = vi.fn();

    act(() => {
      result.current.record({
        type: "addLayer",
        description: "Created layer 'Layer 1'",
        undo,
        redo,
      });
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.log).toHaveLength(1);
    expect(result.current.log[0].type).toBe("addLayer");
    expect(result.current.log[0].description).toBe("Created layer 'Layer 1'");
    expect(result.current.log[0].undone).toBe(false);
  });

  it("when undo is called, then calls the undo function and marks log entry as undone", () => {
    const { result } = renderHook(() => useActionHistory());
    const undo = vi.fn();
    const redo = vi.fn();

    act(() => {
      result.current.record({ type: "addLayer", description: "test", undo, redo });
    });

    act(() => {
      result.current.undo();
    });

    expect(undo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
    expect(result.current.log[0].undone).toBe(true);
  });

  it("when redo is called, then calls the redo function and marks log entry as not undone", () => {
    const { result } = renderHook(() => useActionHistory());
    const undo = vi.fn();
    const redo = vi.fn();

    act(() => {
      result.current.record({ type: "addLayer", description: "test", undo, redo });
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.redo();
    });

    expect(redo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.log[0].undone).toBe(false);
  });

  it("when undo is called with empty stack, then does nothing", () => {
    const { result } = renderHook(() => useActionHistory());

    act(() => {
      result.current.undo();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("when redo is called with empty stack, then does nothing", () => {
    const { result } = renderHook(() => useActionHistory());

    act(() => {
      result.current.redo();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("when a new action is recorded after undo, then clears the redo stack", () => {
    const { result } = renderHook(() => useActionHistory());

    act(() => {
      result.current.record({ type: "a", description: "a", undo: vi.fn(), redo: vi.fn() });
    });

    act(() => {
      result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.record({ type: "b", description: "b", undo: vi.fn(), redo: vi.fn() });
    });

    expect(result.current.canRedo).toBe(false);
  });

  it("when multiple undo/redo operations run in sequence, then processes them correctly", () => {
    const { result } = renderHook(() => useActionHistory());
    const undoA = vi.fn();
    const redoA = vi.fn();
    const undoB = vi.fn();
    const redoB = vi.fn();

    act(() => {
      result.current.record({ type: "a", description: "action A", undo: undoA, redo: redoA });
      result.current.record({ type: "b", description: "action B", undo: undoB, redo: redoB });
    });

    expect(result.current.log).toHaveLength(2);

    // Undo B
    act(() => {
      result.current.undo();
    });
    expect(undoB).toHaveBeenCalledOnce();
    expect(result.current.log[1].undone).toBe(true);
    expect(result.current.log[0].undone).toBe(false);

    // Undo A
    act(() => {
      result.current.undo();
    });
    expect(undoA).toHaveBeenCalledOnce();
    expect(result.current.log[0].undone).toBe(true);

    // Redo A
    act(() => {
      result.current.redo();
    });
    expect(redoA).toHaveBeenCalledOnce();
    expect(result.current.log[0].undone).toBe(false);

    // Redo B
    act(() => {
      result.current.redo();
    });
    expect(redoB).toHaveBeenCalledOnce();
    expect(result.current.log[1].undone).toBe(false);
  });

  it("when logOnly is called, then adds to log without affecting undo/redo stacks", () => {
    const { result } = renderHook(() => useActionHistory());

    act(() => {
      result.current.logOnly("hideLayer", "Hid layer 'Layer 1'");
    });

    expect(result.current.log).toHaveLength(1);
    expect(result.current.log[0].type).toBe("hideLayer");
    expect(result.current.log[0].description).toBe("Hid layer 'Layer 1'");
    expect(result.current.log[0].undone).toBe(false);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("when multiple actions are recorded, then log entries have unique ids and timestamps", () => {
    const { result } = renderHook(() => useActionHistory());

    act(() => {
      result.current.record({ type: "a", description: "a", undo: vi.fn(), redo: vi.fn() });
      result.current.record({ type: "b", description: "b", undo: vi.fn(), redo: vi.fn() });
    });

    expect(result.current.log[0].id).not.toBe(result.current.log[1].id);
    expect(result.current.log[0].timestamp).toBeLessThanOrEqual(result.current.log[1].timestamp);
  });

  it("when record is called with details, then passes them into log entries", () => {
    const { result } = renderHook(() => useActionHistory());
    const details = [
      { label: "name", after: "Layer 1" },
      { label: "color", after: "#fca5a5" },
    ];

    act(() => {
      result.current.record({
        type: "addLayer",
        description: "Created layer",
        details,
        undo: vi.fn(),
        redo: vi.fn(),
      });
    });

    expect(result.current.log[0].details).toEqual(details);
  });

  it("when record is called without details, then leaves details undefined", () => {
    const { result } = renderHook(() => useActionHistory());

    act(() => {
      result.current.record({
        type: "lock",
        description: "Locked editor",
        undo: vi.fn(),
        redo: vi.fn(),
      });
    });

    expect(result.current.log[0].details).toBeUndefined();
  });
});
