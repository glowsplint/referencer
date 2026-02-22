import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePositionMapping } from "./use-position-mapping";
import type { Layer } from "@/types/editor";

function makeLayer(overrides: Partial<Layer> = {}): Layer {
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

function createMockEditor() {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  return {
    on(event: string, fn: (...args: unknown[]) => void) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    off(event: string, fn: (...args: unknown[]) => void) {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((f) => f !== fn);
      }
    },
    emit(event: string, ...args: unknown[]) {
      for (const fn of listeners[event] ?? []) fn(...args);
    },
    _listeners: listeners,
  };
}

function createMapping(offset: number) {
  return {
    map(pos: number, _assoc?: number) {
      return pos + offset;
    },
  };
}

describe("usePositionMapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when editor is null", () => {
    const setLayers = vi.fn();
    renderHook(() =>
      usePositionMapping({
        editor: null,
        editorIndex: 0,
        layers: [],
        setLayers,
      }),
    );

    expect(setLayers).not.toHaveBeenCalled();
  });

  it("does nothing when setLayers is undefined", () => {
    const editor = createMockEditor();
    renderHook(() =>
      usePositionMapping({
        editor: editor as any,
        editorIndex: 0,
        layers: [],
        setLayers: undefined,
      }),
    );

    // Should not register any listener
    expect(editor._listeners["transaction"] ?? []).toHaveLength(0);
  });

  it("registers and unregisters transaction listener", () => {
    const editor = createMockEditor();
    const setLayers = vi.fn();

    const { unmount } = renderHook(() =>
      usePositionMapping({
        editor: editor as any,
        editorIndex: 0,
        layers: [],
        setLayers,
      }),
    );

    expect(editor._listeners["transaction"]).toHaveLength(1);

    unmount();
    expect(editor._listeners["transaction"]).toHaveLength(0);
  });

  it("ignores transactions where doc did not change", () => {
    const editor = createMockEditor();
    const setLayers = vi.fn();

    renderHook(() =>
      usePositionMapping({
        editor: editor as any,
        editorIndex: 0,
        layers: [],
        setLayers,
      }),
    );

    editor.emit("transaction", { transaction: { docChanged: false } });
    expect(setLayers).not.toHaveBeenCalled();
  });

  it("maps highlight positions through transaction mapping", () => {
    const editor = createMockEditor();
    const setLayers = vi.fn();
    const layer = makeLayer({
      highlights: [
        {
          id: "h-1",
          editorIndex: 0,
          from: 10,
          to: 20,
          text: "hello",
          annotation: "",
          type: "highlight",
        },
      ],
    });

    renderHook(() =>
      usePositionMapping({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        setLayers,
      }),
    );

    editor.emit("transaction", {
      transaction: { docChanged: true, mapping: createMapping(5) },
    });

    expect(setLayers).toHaveBeenCalledTimes(1);
    // Call the updater function to verify the mapping
    const updater = setLayers.mock.calls[0][0] as (prev: Layer[]) => Layer[];
    const result = updater([layer]);

    expect(result[0].highlights[0].from).toBe(15);
    expect(result[0].highlights[0].to).toBe(25);
  });

  it("maps underline positions through transaction mapping", () => {
    const editor = createMockEditor();
    const setLayers = vi.fn();
    const layer = makeLayer({
      underlines: [{ id: "u-1", editorIndex: 0, from: 10, to: 20, text: "hello" }],
    });

    renderHook(() =>
      usePositionMapping({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        setLayers,
      }),
    );

    editor.emit("transaction", {
      transaction: { docChanged: true, mapping: createMapping(3) },
    });

    const updater = setLayers.mock.calls[0][0] as (prev: Layer[]) => Layer[];
    const result = updater([layer]);

    expect(result[0].underlines[0].from).toBe(13);
    expect(result[0].underlines[0].to).toBe(23);
  });

  it("maps arrow source positions when source is in this editor", () => {
    const editor = createMockEditor();
    const setLayers = vi.fn();
    const layer = makeLayer({
      arrows: [
        {
          id: "a-1",
          from: { editorIndex: 0, from: 10, to: 15, text: "word1" },
          to: { editorIndex: 1, from: 20, to: 25, text: "word2" },
        },
      ],
    });

    renderHook(() =>
      usePositionMapping({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        setLayers,
      }),
    );

    editor.emit("transaction", {
      transaction: { docChanged: true, mapping: createMapping(2) },
    });

    const updater = setLayers.mock.calls[0][0] as (prev: Layer[]) => Layer[];
    const result = updater([layer]);

    // Source endpoint should be mapped
    expect(result[0].arrows[0].from.from).toBe(12);
    expect(result[0].arrows[0].from.to).toBe(17);
    // Target endpoint in different editor should be unchanged
    expect(result[0].arrows[0].to.from).toBe(20);
    expect(result[0].arrows[0].to.to).toBe(25);
  });

  it("maps arrow target positions when target is in this editor", () => {
    const editor = createMockEditor();
    const setLayers = vi.fn();
    const layer = makeLayer({
      arrows: [
        {
          id: "a-1",
          from: { editorIndex: 0, from: 10, to: 15, text: "word1" },
          to: { editorIndex: 0, from: 20, to: 25, text: "word2" },
        },
      ],
    });

    renderHook(() =>
      usePositionMapping({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        setLayers,
      }),
    );

    editor.emit("transaction", {
      transaction: { docChanged: true, mapping: createMapping(4) },
    });

    const updater = setLayers.mock.calls[0][0] as (prev: Layer[]) => Layer[];
    const result = updater([layer]);

    // Both endpoints should be mapped since they're in this editor
    expect(result[0].arrows[0].from.from).toBe(14);
    expect(result[0].arrows[0].from.to).toBe(19);
    expect(result[0].arrows[0].to.from).toBe(24);
    expect(result[0].arrows[0].to.to).toBe(29);
  });

  it("skips decorations on a different editor index", () => {
    const editor = createMockEditor();
    const setLayers = vi.fn();
    const layer = makeLayer({
      highlights: [
        {
          id: "h-1",
          editorIndex: 1,
          from: 10,
          to: 20,
          text: "hello",
          annotation: "",
          type: "highlight",
        },
      ],
      underlines: [{ id: "u-1", editorIndex: 1, from: 10, to: 20, text: "hello" }],
    });

    renderHook(() =>
      usePositionMapping({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        setLayers,
      }),
    );

    editor.emit("transaction", {
      transaction: { docChanged: true, mapping: createMapping(5) },
    });

    const updater = setLayers.mock.calls[0][0] as (prev: Layer[]) => Layer[];
    const result = updater([layer]);

    // Positions should be unchanged
    expect(result[0].highlights[0].from).toBe(10);
    expect(result[0].highlights[0].to).toBe(20);
    expect(result[0].underlines[0].from).toBe(10);
    expect(result[0].underlines[0].to).toBe(20);
  });

  it("returns same layer object when no positions changed", () => {
    const editor = createMockEditor();
    const setLayers = vi.fn();
    const layer = makeLayer({
      highlights: [
        {
          id: "h-1",
          editorIndex: 1,
          from: 10,
          to: 20,
          text: "hello",
          annotation: "",
          type: "highlight",
        },
      ],
    });

    renderHook(() =>
      usePositionMapping({
        editor: editor as any,
        editorIndex: 0,
        layers: [layer],
        setLayers,
      }),
    );

    editor.emit("transaction", {
      transaction: { docChanged: true, mapping: createMapping(5) },
    });

    const updater = setLayers.mock.calls[0][0] as (prev: Layer[]) => Layer[];
    const result = updater([layer]);

    // Same reference when nothing changed for this editor
    expect(result[0]).toBe(layer);
  });
});
