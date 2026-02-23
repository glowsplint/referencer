import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useArrowCleanup, checkArrowEndpoints, endpointTextMatches } from "./use-arrow-cleanup";
import type { Layer, Arrow } from "@/types/editor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockEditor(textContent = "hello world testing") {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
    isDestroyed: false,
    state: {
      doc: {
        content: { size: textContent.length + 2 }, // +2 for paragraph wrapper
        textBetween: (from: number, to: number) => {
          // Simple mock: offset by 1 for paragraph open token
          return textContent.slice(from - 1, to - 1);
        },
      },
    },
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(handler);
    }),
    emit: (event: string, ...args: unknown[]) => {
      listeners.get(event)?.forEach((handler) => handler(...args));
    },
  };
}

function createLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: "layer-1",
    name: "Layer 1",
    color: "#fca5a5",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
    ...overrides,
  };
}

function createArrow(overrides: Partial<Arrow> = {}): Arrow {
  return {
    id: "arrow-1",
    from: { editorIndex: 0, from: 1, to: 6, text: "hello" },
    to: { editorIndex: 0, from: 7, to: 12, text: "world" },
    visible: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit tests for endpointTextMatches
// ---------------------------------------------------------------------------

describe("endpointTextMatches", () => {
  const doc = {
    content: { size: 20 },
    textBetween: (from: number, to: number) => "hello world testing".slice(from - 1, to - 1),
  };

  it("returns true when text matches", () => {
    expect(endpointTextMatches(doc, 20, 1, 6, "hello")).toBe(true);
  });

  it("returns false when text does not match", () => {
    expect(endpointTextMatches(doc, 20, 1, 6, "world")).toBe(false);
  });

  it("returns false when from >= to (collapsed range)", () => {
    expect(endpointTextMatches(doc, 20, 5, 5, "hello")).toBe(false);
  });

  it("returns false when from is negative", () => {
    expect(endpointTextMatches(doc, 20, -1, 5, "hello")).toBe(false);
  });

  it("returns false when to exceeds doc size", () => {
    expect(endpointTextMatches(doc, 20, 1, 25, "hello")).toBe(false);
  });

  it("returns false when from >= docSize", () => {
    expect(endpointTextMatches(doc, 20, 20, 22, "hello")).toBe(false);
  });

  it("returns false when textBetween throws", () => {
    const throwingDoc = {
      content: { size: 20 },
      textBetween: () => {
        throw new Error("invalid position");
      },
    };
    expect(endpointTextMatches(throwingDoc, 20, 1, 6, "hello")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Unit tests for checkArrowEndpoints
// ---------------------------------------------------------------------------

describe("checkArrowEndpoints", () => {
  it("removes arrow when from-endpoint text does not match", () => {
    const editor = createMockEditor("XXXXX world testing");
    const removeArrow = vi.fn();
    const arrow = createArrow(); // expects "hello" at 1..6
    const layer = createLayer({ arrows: [arrow] });

    checkArrowEndpoints(editor as any, 0, [layer], removeArrow);
    expect(removeArrow).toHaveBeenCalledWith("layer-1", "arrow-1");
  });

  it("removes arrow when to-endpoint text does not match", () => {
    const editor = createMockEditor("hello XXXXX testing");
    const removeArrow = vi.fn();
    const arrow = createArrow(); // expects "world" at 7..12
    const layer = createLayer({ arrows: [arrow] });

    checkArrowEndpoints(editor as any, 0, [layer], removeArrow);
    expect(removeArrow).toHaveBeenCalledWith("layer-1", "arrow-1");
  });

  it("does not remove arrow when both endpoints match", () => {
    const editor = createMockEditor("hello world testing");
    const removeArrow = vi.fn();
    const arrow = createArrow();
    const layer = createLayer({ arrows: [arrow] });

    checkArrowEndpoints(editor as any, 0, [layer], removeArrow);
    expect(removeArrow).not.toHaveBeenCalled();
  });

  it("skips endpoints from other editors", () => {
    const editor = createMockEditor("XXXXX XXXXX testing");
    const removeArrow = vi.fn();
    const arrow = createArrow({
      from: { editorIndex: 1, from: 1, to: 6, text: "hello" },
      to: { editorIndex: 1, from: 7, to: 12, text: "world" },
    });
    const layer = createLayer({ arrows: [arrow] });

    // Checking editor 0, but arrow is in editor 1 -- should skip
    checkArrowEndpoints(editor as any, 0, [layer], removeArrow);
    expect(removeArrow).not.toHaveBeenCalled();
  });

  it("removes arrow when cross-editor from-endpoint is in this editor and mismatches", () => {
    const editor = createMockEditor("XXXXX world testing");
    const removeArrow = vi.fn();
    const arrow = createArrow({
      from: { editorIndex: 0, from: 1, to: 6, text: "hello" },
      to: { editorIndex: 1, from: 7, to: 12, text: "world" },
    });
    const layer = createLayer({ arrows: [arrow] });

    checkArrowEndpoints(editor as any, 0, [layer], removeArrow);
    expect(removeArrow).toHaveBeenCalledWith("layer-1", "arrow-1");
  });

  it("does not remove when destroyed editor", () => {
    const editor = createMockEditor("XXXXX world testing");
    editor.isDestroyed = true;
    const removeArrow = vi.fn();
    const arrow = createArrow();
    const layer = createLayer({ arrows: [arrow] });

    checkArrowEndpoints(editor as any, 0, [layer], removeArrow);
    expect(removeArrow).not.toHaveBeenCalled();
  });

  it("checks arrows across multiple layers", () => {
    const editor = createMockEditor("XXXXX XXXXX testing");
    const removeArrow = vi.fn();
    const arrow1 = createArrow({ id: "a1" });
    const arrow2 = createArrow({
      id: "a2",
      from: { editorIndex: 0, from: 1, to: 6, text: "XXXXX" },
      to: { editorIndex: 0, from: 7, to: 12, text: "XXXXX" },
    });
    const layer1 = createLayer({ id: "l1", arrows: [arrow1] });
    const layer2 = createLayer({ id: "l2", arrows: [arrow2] });

    checkArrowEndpoints(editor as any, 0, [layer1, layer2], removeArrow);
    // arrow1 should be removed (text mismatch), arrow2 should be kept (text matches)
    expect(removeArrow).toHaveBeenCalledWith("l1", "a1");
    expect(removeArrow).not.toHaveBeenCalledWith("l2", "a2");
  });
});

// ---------------------------------------------------------------------------
// Integration test for useArrowCleanup hook
// ---------------------------------------------------------------------------

describe("useArrowCleanup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls removeArrow after debounced transaction with mismatched text", () => {
    const editor = createMockEditor("XXXXX world testing");
    const removeArrow = vi.fn();
    const arrow = createArrow(); // expects "hello" at 1..6
    const layer = createLayer({ arrows: [arrow] });

    renderHook(() =>
      useArrowCleanup({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        removeArrow,
      }),
    );

    // Simulate a transaction with docChanged
    act(() => {
      editor.emit("transaction", { transaction: { docChanged: true } });
    });

    // Not called immediately (debounced)
    expect(removeArrow).not.toHaveBeenCalled();

    // Advance past the debounce timer
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(removeArrow).toHaveBeenCalledWith("layer-1", "arrow-1");
  });

  it("does not call removeArrow when text still matches", () => {
    const editor = createMockEditor("hello world testing");
    const removeArrow = vi.fn();
    const arrow = createArrow();
    const layer = createLayer({ arrows: [arrow] });

    renderHook(() =>
      useArrowCleanup({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        removeArrow,
      }),
    );

    act(() => {
      editor.emit("transaction", { transaction: { docChanged: true } });
    });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(removeArrow).not.toHaveBeenCalled();
  });

  it("debounces multiple transactions", () => {
    const editor = createMockEditor("XXXXX world testing");
    const removeArrow = vi.fn();
    const arrow = createArrow();
    const layer = createLayer({ arrows: [arrow] });

    renderHook(() =>
      useArrowCleanup({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        removeArrow,
      }),
    );

    // Fire multiple transactions rapidly
    act(() => {
      editor.emit("transaction", { transaction: { docChanged: true } });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      editor.emit("transaction", { transaction: { docChanged: true } });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      editor.emit("transaction", { transaction: { docChanged: true } });
    });

    // Should not have been called yet
    expect(removeArrow).not.toHaveBeenCalled();

    // Advance past the final debounce
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Should only be called once
    expect(removeArrow).toHaveBeenCalledTimes(1);
  });

  it("ignores non-docChanged transactions", () => {
    const editor = createMockEditor("XXXXX world testing");
    const removeArrow = vi.fn();
    const arrow = createArrow();
    const layer = createLayer({ arrows: [arrow] });

    renderHook(() =>
      useArrowCleanup({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        removeArrow,
      }),
    );

    act(() => {
      editor.emit("transaction", { transaction: { docChanged: false } });
    });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(removeArrow).not.toHaveBeenCalled();
  });

  it("cleans up timer on unmount", () => {
    const editor = createMockEditor("XXXXX world testing");
    const removeArrow = vi.fn();
    const arrow = createArrow();
    const layer = createLayer({ arrows: [arrow] });

    const { unmount } = renderHook(() =>
      useArrowCleanup({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        removeArrow,
      }),
    );

    act(() => {
      editor.emit("transaction", { transaction: { docChanged: true } });
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Should not fire after unmount
    expect(removeArrow).not.toHaveBeenCalled();
  });

  it("does nothing when editor is null", () => {
    const removeArrow = vi.fn();
    const arrow = createArrow();
    const layer = createLayer({ arrows: [arrow] });

    // Should not throw
    renderHook(() =>
      useArrowCleanup({
        editor: null,
        editorIndex: 0,
        layers: [layer],
        removeArrow,
      }),
    );

    expect(removeArrow).not.toHaveBeenCalled();
  });
});
