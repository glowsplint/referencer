import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as Y from "yjs";
import { useYjsUndo } from "./use-yjs-undo";
import { addLayerToDoc, getLayersArray } from "@/lib/yjs/annotations";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useYjsUndo", () => {
  it("canUndo and canRedo start as false", () => {
    const doc = new Y.Doc();
    const { result } = renderHook(() => useYjsUndo(doc));

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("canUndo becomes true after a mutation", async () => {
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

  it("undo reverses the last transaction", async () => {
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

  it("redo replays the undone transaction", async () => {
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

  it("cleanup destroys UndoManager on doc change", () => {
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

  it("is a no-op when doc is null", () => {
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

  it("after undo, canRedo becomes true", async () => {
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
