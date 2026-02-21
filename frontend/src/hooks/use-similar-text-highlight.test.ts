import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSimilarTextHighlight } from "./use-similar-text-highlight";
import { DecorationSet } from "@tiptap/pm/view";
import { similarTextPluginKey } from "@/lib/tiptap/extensions/similar-text-highlights";
import type { WordSelection } from "@/types/editor";

let capturedDecorations: unknown[] = [];

vi.mock("@tiptap/pm/view", async () => {
  const actual = await vi.importActual("@tiptap/pm/view");
  return {
    ...actual,
    DecorationSet: {
      ...(actual as any).DecorationSet,
      empty: (actual as any).DecorationSet.empty,
      create: vi.fn((_doc: unknown, decorations: unknown[]) => {
        capturedDecorations = decorations;
        return { __decorationCount: decorations.length };
      }),
    },
    Decoration: {
      inline: vi.fn((from: number, to: number, attrs: unknown) => ({
        from,
        to,
        attrs,
      })),
    },
  };
});

vi.mock("@/lib/tiptap/find-text-matches", () => ({
  findTextMatches: vi.fn(),
}));

import { findTextMatches } from "@/lib/tiptap/find-text-matches";
const mockFindTextMatches = vi.mocked(findTextMatches);

function createMockEditor() {
  const mockTr = {
    setMeta: vi.fn(() => mockTr),
  };
  return {
    isDestroyed: false,
    state: { doc: {}, tr: mockTr },
    view: { dispatch: vi.fn() },
  };
}

describe("useSimilarTextHighlight", () => {
  beforeEach(() => {
    capturedDecorations = [];
    mockFindTextMatches.mockReset();
  });

  it("dispatches empty decorations when not locked", () => {
    const editor = createMockEditor();
    const selection: WordSelection = { editorIndex: 0, from: 1, to: 6, text: "hello" };

    renderHook(() => useSimilarTextHighlight(editor as any, selection, 0, false, null, false));

    expect(editor.state.tr.setMeta).toHaveBeenCalledWith(similarTextPluginKey, DecorationSet.empty);
  });

  it("dispatches empty decorations when no selection", () => {
    const editor = createMockEditor();

    renderHook(() => useSimilarTextHighlight(editor as any, null, 0, true, null, false));

    expect(editor.state.tr.setMeta).toHaveBeenCalledWith(similarTextPluginKey, DecorationSet.empty);
  });

  it("creates decorations for matches", () => {
    const editor = createMockEditor();
    const selection: WordSelection = { editorIndex: 0, from: 1, to: 6, text: "hello" };

    mockFindTextMatches.mockReturnValue([
      { from: 1, to: 6 },
      { from: 20, to: 25 },
      { from: 40, to: 45 },
    ]);

    renderHook(() => useSimilarTextHighlight(editor as any, selection, 0, true, null, false));

    // Primary selection (from:1, to:6) should be filtered out
    expect(capturedDecorations).toHaveLength(2);
    expect(capturedDecorations[0]).toMatchObject({ from: 20, to: 25 });
    expect(capturedDecorations[1]).toMatchObject({ from: 40, to: 45 });
  });

  it("skips primary selection range in same editor", () => {
    const editor = createMockEditor();
    const selection: WordSelection = { editorIndex: 0, from: 10, to: 15, text: "world" };

    mockFindTextMatches.mockReturnValue([{ from: 10, to: 15 }]);

    renderHook(() => useSimilarTextHighlight(editor as any, selection, 0, true, null, false));

    // Only match is the primary selection, so empty
    expect(editor.state.tr.setMeta).toHaveBeenCalledWith(similarTextPluginKey, DecorationSet.empty);
  });

  it("highlights all matches in a different editor", () => {
    const editor = createMockEditor();
    // Selection is in editor 1, but we're rendering editor 0
    const selection: WordSelection = { editorIndex: 1, from: 1, to: 6, text: "hello" };

    mockFindTextMatches.mockReturnValue([
      { from: 1, to: 6 },
      { from: 20, to: 25 },
    ]);

    renderHook(() => useSimilarTextHighlight(editor as any, selection, 0, true, null, false));

    // In a different editor, no match is filtered out
    expect(capturedDecorations).toHaveLength(2);
  });

  it("uses 0.15 opacity for highlight color", () => {
    const editor = createMockEditor();
    const selection: WordSelection = { editorIndex: 0, from: 1, to: 6, text: "hello" };

    mockFindTextMatches.mockReturnValue([{ from: 20, to: 25 }]);

    renderHook(() => useSimilarTextHighlight(editor as any, selection, 0, true, "#fca5a5", false));

    expect(capturedDecorations).toHaveLength(1);
    const attrs = (capturedDecorations[0] as any).attrs;
    // blendWithBackground("#fca5a5", 0.15, false) on light bg:
    // r: round(252*0.15 + 255*0.85) = round(37.8+216.75) = round(254.55) = 255
    // g: round(165*0.15 + 255*0.85) = round(24.75+216.75) = round(241.5) = 242
    // b: round(165*0.15 + 255*0.85) = round(24.75+216.75) = round(241.5) = 242
    expect(attrs.style).toBe("background-color: rgb(255, 242, 242)");
    expect(attrs.class).toBe("similar-text-highlight");
  });
});
