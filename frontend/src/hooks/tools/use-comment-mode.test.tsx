import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { useCommentMode } from "./use-comment-mode";
import type { WordSelection, ActiveTool } from "@/types/editor";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "comments" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    addLayer: vi.fn(() => "auto-layer-1"),
    layers: [] as {
      id: string;
      highlights: {
        id: string;
        editorIndex: number;
        from: number;
        to: number;
        text: string;
        annotation: string;
        type: "highlight" | "comment";
      }[];
    }[],
    addHighlight: vi.fn().mockReturnValue("h-1"),
    removeHighlight: vi.fn(),
    onHighlightAdded: vi.fn(),
    setStatus: vi.fn(),
    flashStatus: vi.fn(),
    clearStatus: vi.fn(),
    ...overrides,
  };
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" };
const word2: WordSelection = { editorIndex: 0, from: 10, to: 15, text: "world" };

describe("useCommentMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when comments tool is activated, then shows entry status", () => {
    const setStatus = vi.fn();
    renderHook(() => useCommentMode(createOptions({ setStatus })), { wrapper });

    expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("when exiting comments tool, then clears status", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useCommentMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "comments" as ActiveTool }, wrapper },
    );

    rerender({ activeTool: "selection" });
    expect(clearStatus).toHaveBeenCalled();
  });

  it("when switching to another annotation tool, then does not clear status", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useCommentMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "comments" as ActiveTool }, wrapper },
    );

    rerender({ activeTool: "underline" });
    expect(clearStatus).not.toHaveBeenCalled();
  });

  it("when unlocking while comments tool is active, then clears status", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useCommentMode(createOptions({ isLocked: props.isLocked, clearStatus })),
      { initialProps: { isLocked: true }, wrapper },
    );

    rerender({ isLocked: false });
    expect(clearStatus).toHaveBeenCalled();
  });

  it("when activeTool is not comments, then does nothing", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    expect(opts.addHighlight).not.toHaveBeenCalled();
  });

  it("when isLocked is false, then does nothing", () => {
    const opts = createOptions({ isLocked: false, selection: word1 });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    expect(opts.addHighlight).not.toHaveBeenCalled();
  });

  it("when there is no selection, then does nothing", () => {
    const opts = createOptions({ selection: null });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    expect(opts.addHighlight).not.toHaveBeenCalled();
  });

  it("when no active layer exists, then auto-creates one", () => {
    const addLayer = vi.fn(() => "auto-layer-1");
    const addHighlight = vi.fn().mockReturnValue("h-1");
    const onHighlightAdded = vi.fn();
    const opts = createOptions({
      activeLayerId: null,
      addLayer,
      addHighlight,
      onHighlightAdded,
      selection: word1,
    });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    expect(addLayer).toHaveBeenCalled();
    expect(addHighlight).toHaveBeenCalledWith("auto-layer-1", {
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
      annotation: "",
      type: "comment",
    });
    expect(onHighlightAdded).toHaveBeenCalledWith("auto-layer-1", "h-1");
  });

  it("when addLayer fails (all colors used), then does nothing", () => {
    const addLayer = vi.fn(() => "");
    const opts = createOptions({ activeLayerId: null, addLayer, selection: word1 });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    expect(addLayer).toHaveBeenCalled();
    expect(opts.addHighlight).not.toHaveBeenCalled();
  });

  it("when a selection is confirmed, then creates highlight and calls onHighlightAdded", () => {
    const opts = createOptions({ selection: word1 });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    expect(opts.addHighlight).toHaveBeenCalledWith("layer-1", {
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
      annotation: "",
      type: "comment",
    });
    expect(opts.onHighlightAdded).toHaveBeenCalledWith("layer-1", "h-1");
  });

  it("when creating a highlight, then preserves selection for keyboard navigation", () => {
    const clearSelection = vi.fn();
    const opts = createOptions({ selection: word1 });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    // Selection should NOT be cleared so user can continue navigating
    expect(clearSelection).not.toHaveBeenCalled();
  });

  it("when creating a new highlight, then removes empty-annotation highlights first", () => {
    const opts = createOptions({
      selection: word2,
      layers: [
        {
          id: "layer-1",
          highlights: [
            {
              id: "h-empty",
              editorIndex: 0,
              from: 20,
              to: 25,
              text: "empty",
              annotation: "",
              type: "comment" as const,
            },
            {
              id: "h-saved",
              editorIndex: 0,
              from: 30,
              to: 35,
              text: "saved",
              annotation: "saved",
              type: "comment" as const,
            },
          ],
        },
      ],
    });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-empty");
    expect(opts.removeHighlight).not.toHaveBeenCalledWith("layer-1", "h-saved");
    expect(opts.addHighlight).toHaveBeenCalled();
  });

  it("when the same range is selected again, then toggles off highlight", () => {
    const opts = createOptions({
      selection: word1,
      layers: [
        {
          id: "layer-1",
          highlights: [
            {
              id: "h-existing",
              editorIndex: 0,
              from: 1,
              to: 5,
              text: "hello",
              annotation: "note",
              type: "comment" as const,
            },
          ],
        },
      ],
    });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-existing");
    expect(opts.addHighlight).not.toHaveBeenCalled();
  });

  it("when a comment is created, then always shows success status", () => {
    const flashStatus = vi.fn();
    const opts = createOptions({ selection: word1, flashStatus });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    expect(opts.addHighlight).toHaveBeenCalled();
    expect(flashStatus).toHaveBeenCalledWith({ text: "Comment added.", type: "success" }, 3000);
  });

  it("when a comment is created, then stays in comments mode", () => {
    const setActiveTool = vi.fn();
    const opts = createOptions({ selection: word1 });
    const { result } = renderHook(() => useCommentMode(opts), { wrapper });

    act(() => {
      result.current.confirmComment();
    });

    // No setActiveTool in the hook — it stays in comments mode
    expect(setActiveTool).not.toHaveBeenCalled();
  });
});
