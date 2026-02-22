import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWordHover } from "./use-word-hover";
import { wordHoverPluginKey } from "@/lib/tiptap/extensions/word-hover";
import { DecorationSet } from "@tiptap/pm/view";

vi.mock("@/lib/tiptap/word-boundaries", () => ({
  getWordBoundaries: vi.fn(),
}));

// Mock Decoration.inline and DecorationSet.create since we don't have a real PM doc
vi.mock("@tiptap/pm/view", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@tiptap/pm/view")>();
  const mockDecorationSet = { type: "mockDecorationSet" };
  return {
    ...orig,
    Decoration: {
      inline: vi.fn(() => ({ type: "mockDecoration" })),
    },
    DecorationSet: {
      ...orig.DecorationSet,
      empty: orig.DecorationSet.empty,
      create: vi.fn(() => mockDecorationSet),
    },
  };
});

function createMockEditor(isDestroyed = false) {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  const dom = {
    addEventListener: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      (listeners[event] ??= []).push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
    }),
  };

  const dispatch = vi.fn();
  const tr = { setMeta: vi.fn().mockReturnThis() };

  const editor = {
    isDestroyed,
    view: {
      dom,
      posAtCoords: vi.fn(),
      dispatch,
    },
    state: {
      doc: {},
      tr,
    },
  };

  return { editor: editor as any, listeners, dispatch, tr, dom };
}

describe("useWordHover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attaches mousemove and mouseleave listeners when locked", () => {
    const { editor, dom } = createMockEditor();
    renderHook(() => useWordHover(editor, 0, true, false, null, "#ff0000", []));

    expect(dom.addEventListener).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(dom.addEventListener).toHaveBeenCalledWith("mouseleave", expect.any(Function));
  });

  it("does not attach listeners when not locked", () => {
    const { editor, dom } = createMockEditor();
    renderHook(() => useWordHover(editor, 0, false, false, null, "#ff0000", []));

    expect(dom.addEventListener).not.toHaveBeenCalled();
  });

  it("does not attach listeners when editor is null", () => {
    renderHook(() => useWordHover(null, 0, true, false, null, "#ff0000", []));
    // No error thrown = pass
  });

  it("dispatches decoration on mousemove over a word", async () => {
    const { getWordBoundaries } = await import("@/lib/tiptap/word-boundaries");
    const mockedGetWordBoundaries = vi.mocked(getWordBoundaries);
    mockedGetWordBoundaries.mockReturnValue({ from: 1, to: 5, text: "hello" });

    const { editor, listeners, dispatch } = createMockEditor();
    editor.view.posAtCoords.mockReturnValue({ pos: 3 });

    renderHook(() => useWordHover(editor, 0, true, false, null, "#ff0000", []));

    const mousemoveHandler = listeners["mousemove"]?.[0];
    mousemoveHandler?.({ clientX: 100, clientY: 50 });

    expect(dispatch).toHaveBeenCalled();
  });

  it("clears decoration on mouseleave", async () => {
    const { getWordBoundaries } = await import("@/lib/tiptap/word-boundaries");
    const mockedGetWordBoundaries = vi.mocked(getWordBoundaries);
    mockedGetWordBoundaries.mockReturnValue({ from: 1, to: 5, text: "hello" });

    const { editor, listeners, dispatch, tr } = createMockEditor();
    editor.view.posAtCoords.mockReturnValue({ pos: 3 });

    renderHook(() => useWordHover(editor, 0, true, false, null, "#ff0000", []));

    // First hover over a word
    listeners["mousemove"]?.[0]?.({ clientX: 100, clientY: 50 });
    dispatch.mockClear();
    tr.setMeta.mockClear();

    // Then leave
    listeners["mouseleave"]?.[0]?.();

    expect(tr.setMeta).toHaveBeenCalledWith(wordHoverPluginKey, DecorationSet.empty);
    expect(dispatch).toHaveBeenCalled();
  });

  it("does not apply decoration when hovered word matches selection", async () => {
    const { getWordBoundaries } = await import("@/lib/tiptap/word-boundaries");
    const mockedGetWordBoundaries = vi.mocked(getWordBoundaries);
    mockedGetWordBoundaries.mockReturnValue({ from: 1, to: 5, text: "hello" });

    const { editor, listeners, dispatch } = createMockEditor();
    editor.view.posAtCoords.mockReturnValue({ pos: 3 });

    const selection = { editorIndex: 0, from: 1, to: 5, text: "hello" };
    renderHook(() => useWordHover(editor, 0, true, false, selection, "#ff0000", []));

    dispatch.mockClear();
    listeners["mousemove"]?.[0]?.({ clientX: 100, clientY: 50 });

    // dispatch should NOT be called for decoration (may be called for empty clear)
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not apply decoration when hovered word overlaps a layer highlight", async () => {
    const { getWordBoundaries } = await import("@/lib/tiptap/word-boundaries");
    const mockedGetWordBoundaries = vi.mocked(getWordBoundaries);
    mockedGetWordBoundaries.mockReturnValue({ from: 1, to: 5, text: "hello" });

    const { editor, listeners, dispatch } = createMockEditor();
    editor.view.posAtCoords.mockReturnValue({ pos: 3 });

    const layers = [
      {
        id: "layer-1",
        name: "Layer 1",
        color: "#ff0000",
        visible: true,
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 3,
            to: 8,
            text: "lo wo",
            annotation: "",
            type: "highlight" as const,
          },
        ],
        arrows: [],
        underlines: [],
      },
    ];
    renderHook(() => useWordHover(editor, 0, true, false, null, "#ff0000", layers));

    dispatch.mockClear();
    listeners["mousemove"]?.[0]?.({ clientX: 100, clientY: 50 });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("removes listeners on cleanup", () => {
    const { editor, dom } = createMockEditor();
    const { unmount } = renderHook(() => useWordHover(editor, 0, true, false, null, "#ff0000", []));

    unmount();

    expect(dom.removeEventListener).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(dom.removeEventListener).toHaveBeenCalledWith("mouseleave", expect.any(Function));
  });
});
