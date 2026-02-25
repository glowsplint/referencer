import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as Y from "yjs";
import { useYjsUndo } from "./use-yjs-undo";
import { addLayerToDoc, getLayersArray } from "@/lib/yjs/annotations";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useYjsUndo", () => {
  it("when initialized, then canUndo and canRedo are false", () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsUndo(doc));

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("when a mutation occurs, then canUndo becomes true", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsUndo(doc));

    act(() => {
      addLayerToDoc(doc, { id: "l1", name: "Layer 1", color: "#fca5a5" });
    });

    // UndoManager fires stack-item-added asynchronously; wait for state update
    await vi.waitFor(() => {
      expect(result.current.canUndo).toBe(true);
    });
    expect(result.current.canRedo).toBe(false);
  });

  it("when undo is called, then reverses the last transaction", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsUndo(doc));

    act(() => {
      addLayerToDoc(doc, { id: "l1", name: "Layer 1", color: "#fca5a5" });
    });

    await vi.waitFor(() => {
      expect(result.current.canUndo).toBe(true);
    });

    expect(getLayersArray(doc).length).toBe(1);

    act(() => {
      result.current.undo();
    });

    await vi.waitFor(() => {
      expect(getLayersArray(doc).length).toBe(0);
    });
  });

  it("when redo is called, then replays the undone transaction", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsUndo(doc));

    act(() => {
      addLayerToDoc(doc, { id: "l1", name: "Layer 1", color: "#fca5a5" });
    });

    await vi.waitFor(() => {
      expect(result.current.canUndo).toBe(true);
    });

    act(() => {
      result.current.undo();
    });

    await vi.waitFor(() => {
      expect(result.current.canRedo).toBe(true);
    });

    act(() => {
      result.current.redo();
    });

    await vi.waitFor(() => {
      expect(getLayersArray(doc).length).toBe(1);
    });
  });

  it("when doc changes, then cleanup destroys the UndoManager", () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const { rerender, result } = renderHook(({ doc }) => useYjsUndo(doc), {
      initialProps: { doc: doc1 },
    });

    // Add a mutation to doc1
    act(() => {
      addLayerToDoc(doc1, { id: "l1", name: "Layer 1", color: "#fca5a5" });
    });

    // Switch to doc2 -- old UndoManager should be destroyed
    rerender({ doc: doc2 });

    // After rerender with new doc, canUndo should reset
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("when doc is null, then is a no-op", () => {
    const { result } = renderHook(() => useYjsUndo(null));

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    // undo/redo should not throw
    act(() => {
      result.current.undo();
      result.current.redo();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("when undo is called, then canRedo becomes true", async () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsUndo(doc));

    act(() => {
      addLayerToDoc(doc, { id: "l1", name: "Layer 1", color: "#fca5a5" });
    });

    await vi.waitFor(() => {
      expect(result.current.canUndo).toBe(true);
    });

    act(() => {
      result.current.undo();
    });

    await vi.waitFor(() => {
      expect(result.current.canRedo).toBe(true);
      expect(result.current.canUndo).toBe(false);
    });
  });
});
